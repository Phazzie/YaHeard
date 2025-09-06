/**
 * =============================================================================
 * @file src/lib/services/assembly-real.ts - REAL AssemblyAI Implementation
 * =============================================================================
 *
 * WHY THIS FILE EXISTS:
 * =====================
 * This provides the actual AssemblyAI API integration with proper async polling.
 * AssemblyAI offers high accuracy transcription with advanced features.
 *
 * @phazzie-status working
 * @last-regenerated 2025-08-29 15:00 UTC
 * @dependencies AssemblyAI API key, audio upload and polling
 */

// Use process.env for server-side environment variables
const env = process.env;

export async function callAssemblyAPI(audioBuffer: Buffer): Promise<string> {
  // Step 1: Upload audio
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: env.ASSEMBLYAI_API_KEY!,
      'content-type': 'application/octet-stream',
    },
    body: new Uint8Array(audioBuffer),
  });

  const { upload_url } = await uploadResponse.json();

  // Step 2: Request transcription
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: env.ASSEMBLYAI_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      language_code: 'en',
    }),
  });

  const { id } = await transcriptResponse.json();

  // Step 3: Poll for results
  let result;
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: {
        authorization: env.ASSEMBLYAI_API_KEY!,
      },
    });

    result = await statusResponse.json();

    if (result.status === 'completed') {
      return result.text;
    } else if (result.status === 'error') {
      throw new Error('AssemblyAI transcription failed');
    }
  }
}
