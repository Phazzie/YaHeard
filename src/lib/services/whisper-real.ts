/**
 * =============================================================================
 * @file src/lib/services/whisper-real.ts - REAL Whisper API Implementation
 * =============================================================================
 *
 * WHY THIS FILE EXISTS:
 * =====================
 * This provides the actual OpenAI Whisper API integration to replace the stub implementation.
 * The @Phazzie architecture allows us to swap implementations while keeping the same contract.
 *
 * @phazzie-status working
 * @last-regenerated 2025-08-29 15:00 UTC
 * @dependencies OpenAI API key, audio buffer processing
 */

// Use process.env for server-side environment variables
const env = process.env;

export async function callWhisperAPI(audioBuffer: Buffer): Promise<string> {
  console.log('@phazzie-checkpoint-whisper-real-1: Calling REAL Whisper API');

  const formData = new FormData();
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY!}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Whisper error: ${response.status}`);
  }

  const data = await response.json();
  console.log('@phazzie-checkpoint-whisper-real-2: Got transcription');
  return data.text;
}
