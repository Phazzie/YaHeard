import type { TranscriptionResult, TranscriptionService, ApiTestResult } from '../contracts/transcription';

const UPLOAD_ENDPOINT = 'https://api.assemblyai.com/v2/upload';
const TRANSCRIPT_ENDPOINT = 'https://api.assemblyai.com/v2/transcript';

// Helper methods specific to this implementation, kept outside the main object
async function uploadFile(audio: Buffer, apiKey: string): Promise<string> {
  const response = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'content-type': 'application/octet-stream'
    },
    body: audio
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const { upload_url } = await response.json();
  return upload_url;
}

async function requestTranscription(audioUrl: string, apiKey: string): Promise<string> {
  const response = await fetch(TRANSCRIPT_ENDPOINT, {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: 'en' // Or get from config if needed
    })
  });

  if (!response.ok) {
    throw new Error(`Transcription request failed with status ${response.status}`);
  }

  const { id } = await response.json();
  return id;
}

async function pollForResult(transcriptId: string, apiKey: string): Promise<any> {
  const pollingEndpoint = `${TRANSCRIPT_ENDPOINT}/${transcriptId}`;
  const maxAttempts = 30; // Poll for 30 seconds
  const delay = 1000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, delay));

    const response = await fetch(pollingEndpoint, {
      headers: { 'authorization': apiKey }
    });
    const result = await response.json();

    if (result.status === 'completed') {
      return result;
    }
    if (result.status === 'error') {
      throw new Error(`Transcription failed: ${result.error}`);
    }
  }

  throw new Error('Transcription polling timed out after 30 seconds.');
}


/**
 * Implements the TranscriptionService interface for AssemblyAI.
 */
export const assemblyAiProcessor: TranscriptionService = {
  serviceName: 'AssemblyAI',

  isConfigured: !!process.env.ASSEMBLYAI_API_KEY,

  async process(audio: Buffer): Promise<TranscriptionResult> {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      throw new Error('AssemblyAI API key not configured.');
    }

    try {
      const startTime = Date.now();

      // Step 1: Upload the audio file to get a URL.
      const uploadUrl = await uploadFile(audio, apiKey);

      // Step 2: Request transcription for the uploaded file.
      const transcriptId = await requestTranscription(uploadUrl, apiKey);

      // Step 3: Poll for the transcription result.
      const result = await pollForResult(transcriptId, apiKey);

      const processingTime = Date.now() - startTime;

      return {
        id: `assembly-${Date.now()}`,
        serviceName: this.serviceName,
        text: result.text,
        confidence: result.confidence,
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: 'assembly-ai-best',
          language: result.language_code,
          wordCount: result.words.length,
          rawResponse: result
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`AssemblyAI processor error: ${errorMessage}`);
      throw new Error(`AssemblyAI processor failed: ${errorMessage}`);
    }
  },

  async testConnection(): Promise<ApiTestResult> {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return { serviceName: this.serviceName, success: false, error: 'API key not configured.' };
    }

    try {
      const response = await fetch(`${TRANSCRIPT_ENDPOINT}?limit=1`, {
        method: 'GET',
        headers: { 'authorization': apiKey }
      });

      if (response.ok) {
        return { serviceName: this.serviceName, success: true };
      } else {
        const errorText = await response.text();
        return {
          serviceName: this.serviceName,
          success: false,
          error: `API returned status ${response.status}: ${errorText}`,
          details: { statusCode: response.status }
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
      return { serviceName: this.serviceName, success: false, error: errorMessage };
    }
  }
};