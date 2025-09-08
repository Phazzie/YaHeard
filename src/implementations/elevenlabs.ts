import type { TranscriptionResult, TranscriptionService, ApiTestResult } from '../contracts/transcription';

const API_ENDPOINT = 'https://api.elevenlabs.io/v1/speech-to-text';
const USER_INFO_ENDPOINT = 'https://api.elevenlabs.io/v1/user';

/**
 * Implements the TranscriptionService interface for ElevenLabs.
 */
export const elevenLabsProcessor: TranscriptionService = {
  serviceName: 'ElevenLabs',

  isConfigured: !!process.env.ELEVENLABS_API_KEY,

  async process(audio: Buffer): Promise<TranscriptionResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured.');
    }

    try {
      const formData = new FormData();
      // ElevenLabs API expects a file, so we create a Blob from the buffer.
      const audioBlob = new Blob([audio]);
      formData.append('file', audioBlob, 'audio.mp3'); // Filename is arbitrary but required

      const model = 'scribe_v1';
      formData.append('model_id', model);

      const startTime = Date.now();

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        id: `elevenlabs-${Date.now()}`,
        serviceName: this.serviceName,
        text: data.text || '',
        confidence: data.confidence,
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: model,
          language: data.language_code,
          wordCount: data.text ? data.text.split(' ').length : 0,
          apiVersion: 'v1'
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`ElevenLabs processor error: ${errorMessage}`);
      throw new Error(`ElevenLabs processor failed: ${errorMessage}`);
    }
  },

  async testConnection(): Promise<ApiTestResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return { serviceName: this.serviceName, success: false, error: 'API key not configured.' };
    }

    try {
      const response = await fetch(USER_INFO_ENDPOINT, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey }
      });

      if (response.ok) {
        return { serviceName: this.serviceName, success: true };
      } else {
        return {
          serviceName: this.serviceName,
          success: false,
          error: `API returned status ${response.status}`,
          details: { statusCode: response.status }
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
      return { serviceName: this.serviceName, success: false, error: errorMessage };
    }
  }
};