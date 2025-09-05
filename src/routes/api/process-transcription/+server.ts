import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { get } from '@vercel/blob';
import { strictLimiter } from '../../../lib/server/ratelimit';
import { kv } from '@vercel/kv';
import logger from '../../../lib/server/logger';

// Import AI service contracts and implementations
import type { AudioProcessor } from '../../../contracts/processors';
import type { TranscriptionResult } from '../../../contracts/transcription';
import { AssemblyAIProcessor } from '../../../implementations/assembly';
import { DeepgramProcessor } from '../../../implementations/deepgram';
import { WhisperProcessor } from '../../../implementations/whisper';
import { GeminiService } from '../../../lib/services/gemini';
import { ElevenLabsProcessor } from '../../../implementations/elevenlabs';

// ========= REGENERATION BOUNDARY START: Consensus Algorithm =========
// @phazzie: This algorithm can be completely regenerated
// @contract: Must take array of results and return consensus
// @dependencies: Levenshtein distance algorithm

/**
 * Calculates the Levenshtein distance between two strings.
 * @param a The first string.
 * @param b The second string.
 * @returns The Levenshtein distance.
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    matrix[j][0] = j;
  }
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Produce a consensus transcription from multiple AI transcription results.
 *
 * Uses Levenshtein distance to pick the result that is on average closest to the others,
 * then computes an agreement percentage reflecting how similar other non-empty results are
 * to that consensus.
 *
 * Detailed behavior:
 * - Ignores results with empty or whitespace-only `text` when computing consensus.
 * - If no non-empty results remain, returns an empty consensus with 0% agreement.
 * - If exactly one non-empty result exists, that text is returned with 100% agreement.
 * - For multiple non-empty results, computes the average Levenshtein distance between
 *   each result and all others; selects the result with the smallest average distance
 *   as the consensus. The agreement percentage is the rounded average similarity
 *   (based on Levenshtein distance normalized by the longer string length) across
 *   non-empty results, expressed as an integer 0–100.
 *
 * @param results - Array of TranscriptionResult objects; original results are preserved in the returned `allResults`.
 * @returns An object with:
 *   - `consensus` (string): chosen consensus transcription (empty string if none),
 *   - `allResults` (TranscriptionResult[]): the original input array,
 *   - `agreementPercentage` (number): rounded agreement percentage (0–100).
 */
export function calculateConsensus(results: TranscriptionResult[]): any {
  const successful = results.filter(r => r.text && r.text.trim().length > 0);

  if (successful.length === 0) {
    return { consensus: '', allResults: results, agreementPercentage: 0 };
  }
  if (successful.length === 1) {
    return { consensus: successful[0].text, allResults: results, agreementPercentage: 100 };
  }

  // Calculate the average Levenshtein distance for each result against all others.
  const distances = successful.map((currentResult, currentIndex) => {
    const otherResults = successful.filter((_, otherIndex) => currentIndex !== otherIndex);
    const totalDistance = otherResults.reduce((sum, otherResult) => {
      return sum + levenshteinDistance(currentResult.text, otherResult.text);
    }, 0);
    return { ...currentResult, avgDistance: totalDistance / otherResults.length };
  });

  // The best result is the one with the lowest average distance to all others.
  const bestResult = distances.reduce((best, current) =>
    current.avgDistance < best.avgDistance ? current : best
  );

  // Calculate a more meaningful agreement percentage based on similarity to the consensus text.
  const totalSimilarity = successful.reduce((sum, result) => {
    const distance = levenshteinDistance(bestResult.text, result.text);
    const longerLength = Math.max(bestResult.text.length, result.text.length);
    const similarity = longerLength === 0 ? 1 : (longerLength - distance) / longerLength;
    return sum + similarity;
  }, 0);

  const agreementPercentage = Math.round((totalSimilarity / successful.length) * 100);

  return {
    consensus: bestResult.text,
    allResults: results,
    agreementPercentage,
    winningService: bestResult.serviceName,
  };
}

// ========= REGENERATION BOUNDARY END: Consensus Algorithm =========

export const POST: RequestHandler = async (event) => {
  await strictLimiter.check(event);
  const { request } = event;
  try {
    const { pathname } = await request.json();
    if (!pathname) {
      return json({ success: false, error: 'No pathname provided.' }, { status: 400 });
    }

    // Set initial status in KV store
    await kv.set(pathname, { status: 'processing', startTime: Date.now() });

    // 1. Fetch the file from Vercel Blob
    const blob = await get(pathname);
    const blobData = await blob.blob();
    const audioFile = new File(
      [blobData],
      pathname.split('/').pop() || 'audio.tmp',
      { type: blobData.type }
    );

    // 2. Run transcription services (moved logic)
    const services: AudioProcessor[] = [];
    if (process.env.OPENAI_API_KEY) services.push(new WhisperProcessor({ apiKey: process.env.OPENAI_API_KEY }));
    if (process.env.ASSEMBLYAI_API_KEY) services.push(new AssemblyAIProcessor({ apiKey: process.env.ASSEMBLYAI_API_KEY }));
    if (process.env.GEMINI_API_KEY) services.push(new GeminiService());
    if (process.env.DEEPGRAM_API_KEY) services.push(new DeepgramProcessor({ apiKey: process.env.DEEPGRAM_API_KEY }));
    if (process.env.ELEVENLABS_API_KEY) services.push(new ElevenLabsProcessor({ apiKey: process.env.ELEVENLABS_API_KEY }));

    if (services.length === 0) {
      await kv.set(pathname, { status: 'failed', error: 'No AI services configured.' });
      return json({ success: false, error: 'No AI services configured.' }, { status: 500 });
    }

    const processingStartTime = Date.now();
    const results = await Promise.allSettled(
      services.map(service => service.processFile(audioFile))
    );

    const transcriptionResults = results.map((result, index) => {
      if (result.status === 'fulfilled') return result.value;
      return {
        id: `${services[index].serviceName.toLowerCase()}-error-${Date.now()}`,
        serviceName: services[index].serviceName,
        text: '',
        confidence: 0,
        processingTimeMs: 0,
        timestamp: new Date(),
        metadata: { error: 'Service completely failed' }
      } as TranscriptionResult;
    });

    // 3. Calculate consensus
    const consensusResult = calculateConsensus(transcriptionResults);

    // 4. Store final result in Vercel KV
    const finalResult = {
      status: 'completed',
      ...consensusResult,
      totalProcessingTime: Date.now() - processingStartTime,
      completedAt: Date.now()
    };
    await kv.set(pathname, finalResult);

    logger.info(
      {
        jobId: pathname,
        totalProcessingTime: finalResult.totalProcessingTime,
        consensusWinner: consensusResult.winningService,
        serviceTimings: transcriptionResults.map(r => ({ [r.serviceName]: r.processingTimeMs })),
      },
      'Transcription job completed'
    );

    // This response is sent to the function that called it, NOT the client.
    // The client will poll a different endpoint for the result.
    return json({ success: true, message: `Processing finished for ${pathname}` });

  } catch (error) {
    logger.error({ err: error, request }, 'Background processing failed');
    // Attempt to update KV with failure status
    try {
      const { pathname } = await request.json();
      if(pathname) await kv.set(pathname, { status: 'failed', error: 'Processing failed.' });
    } catch (kvError) {
      // Ignore KV error during error handling
    }
    return json({ success: false, error: 'An unexpected error occurred during processing.' }, { status: 500 });
  }
};
