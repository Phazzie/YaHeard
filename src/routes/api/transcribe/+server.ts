import { PERFORMANCE_CONFIG } from '$lib/config';
import { json, type RequestHandler } from '@sveltejs/kit';
import { checkRateLimit, getClientIP, validateCsrfFromForm } from '$lib/security';
import type { TranscriptionService, TranscriptionResult } from '../../../contracts/transcription';
import { assemblyAiProcessor } from '../../../implementations/assembly';
import { ConsensusComparisonEngine } from '../../../implementations/comparison';
import { deepgramProcessor } from '../../../implementations/deepgram';
import { elevenLabsProcessor } from '../../../implementations/elevenlabs';
import { geminiProcessor } from '../../../implementations/gemini';
import { whisperProcessor } from '../../../implementations/whisper';

// Reusable comparison engine instance (stateless)
const comparisonEngine = new ConsensusComparisonEngine();


/**
 * Handles POST requests to the /api/transcribe endpoint.
 * This function orchestrates the multi-AI transcription and consensus process.
 */
export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      return json(
        { 
          error: rateLimitResult.error || 'Rate limit exceeded. Too many requests.',
          retryAfter: rateLimitResult.retryAfter
        }, 
        { 
          status: rateLimitResult.error ? 400 : 429,
          headers: rateLimitResult.retryAfter ? {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '900'
          } : {}
        }
      );
    }

    const formData = await request.formData();
    
    // CSRF protection: double-submit cookie (stateless)
    const csrfCookie = cookies.get('csrfToken');
    if (!validateCsrfFromForm(formData, csrfCookie)) {
      return json(
        { error: 'Request could not be processed. Please try again.' },
        { status: 403 }
      );
    }

    const audioUrl = (formData.get('audioUrl') as string | null)?.trim() || '';
    if (!audioUrl) {
      return json({ error: 'No audio URL provided.' }, { status: 400 });
    }

    let audioBuffer: Buffer;

    // Server-side fetch of the remote audio
    try {
      const resp = await fetch(audioUrl);
      if (!resp.ok) {
        return json({ error: `Failed to fetch audio from URL (${resp.status})` }, { status: 400 });
      }
      const arrayBuf = await resp.arrayBuffer();
      const sizeBytes = arrayBuf.byteLength;
      if (sizeBytes > PERFORMANCE_CONFIG.MAX_FILE_SIZE_BYTES) {
        return json({ error: `Remote file too large: ${(sizeBytes/1024/1024).toFixed(1)}MB (max ${(PERFORMANCE_CONFIG.MAX_FILE_SIZE_BYTES/1024/1024).toFixed(1)}MB)` }, { status: 400 });
      }
      audioBuffer = Buffer.from(arrayBuf);
    } catch (e) {
      return json({ error: `Could not download audio from URL: ${e instanceof Error ? e.message : 'Unknown error'}` }, { status: 400 });
    }

    const processors = initializeProcessors();
    if (processors.length === 0) {
      return json({ error: 'No AI services are configured on the server.' }, { status: 500 });
    }

  const results = await processWithAllAIs(processors, audioBuffer);
    const successfulResults = results.filter((r): r is TranscriptionResult => r !== null);

    if (successfulResults.length === 0) {
      return json({ error: 'All AI services failed to process the audio file.' }, { status: 500 });
    }

    let consensusResult;
    try {
        consensusResult = comparisonEngine.compareTranscriptions(successfulResults);
    } catch (consensusError) {
        console.warn('Consensus engine failed, using fallback.', consensusError);
        // Fallback: pick the fastest successful result
        const bestResult = successfulResults.reduce((best, cur) =>
            (cur.processingTimeMs || Infinity) < (best.processingTimeMs || Infinity) ? cur : best
        );

        const withConf = successfulResults.filter(r => r.confidence !== undefined);
        const averageConfidence = withConf.length
            ? withConf.reduce((s, r) => s + (r.confidence ?? 0), 0) / withConf.length
            : 0;

        consensusResult = {
            finalText: bestResult.text,
            consensusConfidence: bestResult.confidence ?? 0,
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

    return json(consensusResult);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`Transcription API Error: ${errorMessage}`);
    
    // Don't leak internal error details in production
    const response = process.env.NODE_ENV === 'production'
      ? { error: 'Failed to process audio file.' }
      : { error: 'Failed to process audio file.', details: errorMessage };
    
    return json(response, { status: 500 });
  }
};

/**
 * Initializes and returns a list of available AI processors based on configured API keys.
 */
function initializeProcessors(): TranscriptionService[] {
  const processors: TranscriptionService[] = [];
  if (whisperProcessor.isConfigured) processors.push(whisperProcessor);
  if (assemblyAiProcessor.isConfigured) processors.push(assemblyAiProcessor);
  if (deepgramProcessor.isConfigured) processors.push(deepgramProcessor);
  if (elevenLabsProcessor.isConfigured) processors.push(elevenLabsProcessor);
  if (geminiProcessor.isConfigured) processors.push(geminiProcessor);
  return processors;
}

/**
 * Processes the audio file with all available AI services in parallel and with timeouts.
 */
async function processWithAllAIs(processors: TranscriptionService[], audio: Buffer): Promise<(TranscriptionResult | null)[]> {
  const promises = processors.map(processor => processWithTimeout(processor, audio));
  return Promise.all(promises);
}

/**
 * Wraps the processor's `process` call with a timeout.
 */
async function processWithTimeout(processor: TranscriptionService, audio: Buffer): Promise<TranscriptionResult | null> {
  try {
    return await Promise.race([
      processor.process(audio),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS)
      )
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${processor.serviceName} failed: ${errorMessage}`);
    return null; // Return null for failed services
  }
}