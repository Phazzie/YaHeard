import { json, type RequestHandler } from '@sveltejs/kit';
import { PERFORMANCE_CONFIG } from '$lib/config';
import { WhisperProcessor } from '../../../implementations/whisper';
import { AssemblyAIProcessor } from '../../../implementations/assembly';
import { DeepgramProcessor } from '../../../implementations/deepgram';
import { ElevenLabsProcessor } from '../../../implementations/elevenlabs';
import { GeminiProcessor } from '../../../implementations/gemini';
import { ConsensusComparisonEngine } from '../../../implementations/comparison';
import type { AudioProcessor, TranscriptionResult } from '../../../contracts/processors';

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

    const results = await processWithAllAIs(processors, audioFile);
    const successfulResults = results.filter((r): r is TranscriptionResult => r !== null);

    if (successfulResults.length === 0) {
      return json({ error: 'All AI services failed to process the audio file.' }, { status: 500 });
    }

    const comparisonEngine = new ConsensusComparisonEngine();
    const consensusResult = comparisonEngine.compareTranscriptions(successfulResults);

    return json(consensusResult);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`Transcription API Error: ${errorMessage}`);
    return json({ error: 'Failed to process audio file.', details: errorMessage }, { status: 500 });
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
async function processWithAllAIs(processors: AudioProcessor[], file: File): Promise<(TranscriptionResult | null)[]> {
  const promises = processors.map(processor => processWithTimeout(processor, file));
  return Promise.all(promises);
}

/**
 * Wraps the processor's `processFile` call with a timeout.
 */
async function processWithTimeout(processor: AudioProcessor, file: File): Promise<TranscriptionResult | null> {
  try {
    return await Promise.race([
      processor.processFile(file),
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