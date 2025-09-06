import { json, type RequestHandler } from '@sveltejs/kit';
import { PERFORMANCE_CONFIG } from '$lib/config';
import { WhisperProcessor } from '../../../implementations/whisper';
import { AssemblyAIProcessor } from '../../../implementations/assembly';
import { DeepgramProcessor } from '../../../implementations/deepgram';
import { ElevenLabsProcessor } from '../../../implementations/elevenlabs';
import { GeminiProcessor } from '../../../implementations/gemini';
import { ConsensusComparisonEngine } from '../../../implementations/comparison';
import type { AudioProcessor, TranscriptionResult } from '../../../contracts/processors';
import { MAX_FILE_SIZE_BYTES, SUPPORTED_AUDIO_FORMATS } from '../../../contracts/transcription';
import { getLogger } from '$lib/logger';
import { validateConsensusResult } from '../../../contracts/transcription';

// Reusable comparison engine instance (stateless)
const comparisonEngine = new ConsensusComparisonEngine();

// Simple in-memory rate limiter (per IP)
const RATE_LIMIT_MAX = 10; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 60s
const rateBuckets = new Map<string, { tokens: number; lastRefill: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip) ?? { tokens: RATE_LIMIT_MAX, lastRefill: now };
  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const refill = Math.floor((elapsed / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_MAX);
    if (refill > 0) {
      bucket.tokens = Math.min(RATE_LIMIT_MAX, bucket.tokens + refill);
      bucket.lastRefill = now;
    }
  }
  if (bucket.tokens <= 0) {
    rateBuckets.set(ip, bucket);
    return false;
  }
  bucket.tokens -= 1;
  rateBuckets.set(ip, bucket);
  return true;
}

// --- Helpers to reduce POST complexity ---
async function getAudioFileFromFormData(request: Request): Promise<File | null> {
  const formData = await request.formData();
  const audioFile = formData.get('audio');
  return audioFile instanceof File ? audioFile : null;
}

function validateAudioFileInputs(file: File): { valid: true } | { valid: false; message: string; status: number } {
  if (!file) {
    return { valid: false, message: 'No audio file provided.', status: 400 };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, message: `File too large. Max allowed size is ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB.`, status: 400 };
  }
  const name = file.name || '';
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
  if (!SUPPORTED_AUDIO_FORMATS.includes(ext as any)) {
    return { valid: false, message: `Unsupported file type "${ext || 'unknown'}". Supported: ${Array.from(SUPPORTED_AUDIO_FORMATS).join(', ')}`, status: 400 };
  }
  return { valid: true };
}

function buildFallbackConsensusResult(successfulResults: TranscriptionResult[], consensusError: unknown) {
  // Fallback: pick the fastest successful result
  const bestResult = successfulResults.reduce((best, cur) =>
    (cur.processingTimeMs || Infinity) < (best.processingTimeMs || Infinity) ? cur : best
  );

  const withConf = successfulResults.filter(r => r.confidence !== undefined);
  const averageConfidence = withConf.length
    ? withConf.reduce((s, r) => s + (r.confidence ?? 0), 0) / withConf.length
    : 0;

  const consensusConfidence = (bestResult.confidence ?? averageConfidence ?? 0);

  return {
    finalText: bestResult.text,
    consensusConfidence,
    individualResults: successfulResults,
    disagreements: [],
    stats: {
      totalProcessingTimeMs: Math.max(...successfulResults.map(r => r.processingTimeMs || 0)),
      servicesUsed: successfulResults.length,
      averageConfidence: averageConfidence,
      disagreementCount: 0
    },
    reasoning: {
      finalReasoning: `Consensus algorithm failed. Fallback to fastest provider: ${bestResult.serviceName}.`,
      steps: [{
        stepNumber: 1,
        description: 'The main consensus engine failed. Using fallback logic.',
        data: {
          selectedService: bestResult.serviceName,
          error: consensusError instanceof Error ? consensusError.message : String(consensusError)
        },
      }]
    }
  };
}

/**
 * Handles POST requests to the /api/transcribe endpoint.
 * This function orchestrates the multi-AI transcription and consensus process.
 */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    // Rate limiting
    const ip = typeof getClientAddress === 'function' ? getClientAddress() : 'unknown';
    const requestId = (globalThis as any).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const logger = getLogger({ requestId, route: '/api/transcribe', ip });

    if (!checkRateLimit(ip)) {
      logger.warn('Rate limit exceeded');
      return json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const audioFile = await getAudioFileFromFormData(request);
    const validation = audioFile ? validateAudioFileInputs(audioFile) : { valid: false, message: 'No audio file provided.', status: 400 } as const;
    if (!validation.valid) {
      logger.warn('Validation failed', { reason: validation.message });
      return json({ error: validation.message }, { status: validation.status });
    }

    const processors = initializeProcessors();
    logger.info('Initialized processors', { count: processors.length });
    if (processors.length === 0) {
      logger.error('No AI services configured');
      return json({ error: 'No AI services are configured on the server.' }, { status: 500 });
    }

    const results = await processWithAllAIs(processors, audioFile!, logger);
    const successfulResults = results.filter((r): r is TranscriptionResult => r !== null);

    if (successfulResults.length === 0) {
      logger.error('All AI services failed');
      return json({ error: 'All AI services failed to process the audio file.' }, { status: 500 });
    }

    let consensusResult;
    try {
      consensusResult = comparisonEngine.compareTranscriptions(successfulResults);
      logger.info('Consensus success', { servicesUsed: successfulResults.length });
    } catch (consensusError) {
      logger.warn('Consensus failed; using fallback', { error: consensusError instanceof Error ? consensusError.message : String(consensusError) });
      consensusResult = buildFallbackConsensusResult(successfulResults, consensusError);
    }

    if (!validateConsensusResult(consensusResult)) {
      logger.error('ConsensusResult failed validation');
      return json({ error: 'Consensus result validation failed.' }, { status: 500 });
    }

    return json(consensusResult);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    // Use plain console here since logger may not be initialized
    console.error(`Transcription API Error: ${errorMessage}`);

    const response = process.env.NODE_ENV === 'production'
      ? { error: 'Failed to process audio file.' }
      : { error: 'Failed to process audio file.', details: errorMessage };

    return json(response, { status: 500 });
  }
};

/**
 * Initializes and returns a list of available AI processors based on configured API keys.
 */
function initializeProcessors(): AudioProcessor[] {
  const processors: AudioProcessor[] = [];
  if (process.env.OPENAI_API_KEY) processors.push(new WhisperProcessor({ apiKey: process.env.OPENAI_API_KEY }));
  if (process.env.ASSEMBLYAI_API_KEY) processors.push(new AssemblyAIProcessor({ apiKey: process.env.ASSEMBLYAI_API_KEY }));
  if (process.env.DEEPGRAM_API_KEY) processors.push(new DeepgramProcessor({ apiKey: process.env.DEEPGRAM_API_KEY }));
  if (process.env.ELEVENLABS_API_KEY) processors.push(new ElevenLabsProcessor({ apiKey: process.env.ELEVENLABS_API_KEY }));
  if (process.env.GEMINI_API_KEY) processors.push(new GeminiProcessor({ apiKey: process.env.GEMINI_API_KEY }));
  return processors;
}

/**
 * Processes the audio file with all available AI services in parallel and with timeouts.
 */
async function processWithAllAIs(processors: AudioProcessor[], file: File, logger?: ReturnType<typeof getLogger>): Promise<(TranscriptionResult | null)[]> {
  const promises = processors.map(processor => processWithTimeout(processor, file, logger));
  return Promise.all(promises);
}

/**
 * Wraps the processor's `processFile` call with a timeout.
 */
async function processWithTimeout(processor: AudioProcessor, file: File, logger?: ReturnType<typeof getLogger>): Promise<TranscriptionResult | null> {
  try {
    return await Promise.race([
      processor.processFile(file),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS)
      )
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (logger) {
      logger.warn('Processor failed', { service: processor.serviceName, error: errorMessage });
    } else {
      console.error(`${processor.serviceName} failed: ${errorMessage}`);
    }
    return null; // Return null for failed services
  }
}