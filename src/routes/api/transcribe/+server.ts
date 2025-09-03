import { json, type RequestHandler } from '@sveltejs/kit';
import { PERFORMANCE_CONFIG } from '$lib/config';
import { WhisperProcessor } from '../../../implementations/whisper';
import { AssemblyAIProcessor } from '../../../implementations/assembly';
import { DeepgramProcessor } from '../../../implementations/deepgram';
import { ElevenLabsProcessor } from '../../../implementations/elevenlabs';
import { GeminiProcessor } from '../../../implementations/gemini';
import { ConsensusComparisonEngine } from '../../../implementations/comparison';
import type { AudioProcessor, TranscriptionResult } from '../../../contracts/processors';

// Reusable comparison engine instance (stateless)
const comparisonEngine = new ConsensusComparisonEngine();

/**
 * Handles POST requests to the /api/transcribe endpoint.
 * This function orchestrates the multi-AI transcription and consensus process.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return json({ error: 'No audio file provided.' }, { status: 400 });
    }

    const processors = initializeProcessors();
    if (processors.length === 0) {
      return json({ error: 'No AI services are configured on the server.' }, { status: 500 });
    }

    const settledResults = await processWithAllAIs(processors, audioFile);
    const successfulResults: TranscriptionResult[] = [];
    settledResults.forEach(result => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        // Optionally log the reason for failure for better diagnostics
        console.error(`A service failed: ${result.reason}`);
      }
    });

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
async function processWithAllAIs(processors: AudioProcessor[], file: File): Promise<PromiseSettledResult<TranscriptionResult>[]> {
  const promises = processors.map(processor => processWithTimeout(processor, file));
  return Promise.allSettled(promises);
}

/**
 * Wraps the processor's `processFile` call with a timeout.
 */
async function processWithTimeout(processor: AudioProcessor, file: File): Promise<TranscriptionResult> {
  try {
    return await Promise.race([
      processor.processFile(file),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS)
      )
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Re-throw a more informative error
    throw new Error(`${processor.serviceName} failed: ${errorMessage}`);
  }
}