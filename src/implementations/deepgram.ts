import type { TranscriptionResult, TranscriptionService, ApiTestResult } from '../contracts/transcription';

const API_ENDPOINT = 'https://api.deepgram.com/v1/listen';
const AUTH_TEST_ENDPOINT = 'https://api.deepgram.com/v1/auth/token';

/**
 * Implements the TranscriptionService interface for Deepgram.
 */
export const deepgramProcessor: TranscriptionService = {
  serviceName: 'Deepgram',

  isConfigured: !!process.env.DEEPGRAM_API_KEY,

  async process(audio: Buffer): Promise<TranscriptionResult> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('Deepgram API key not configured.');
    }

    try {
      const base64Audio = audio.toString('base64');
      const startTime = Date.now();

      const options = {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
        utterances: true,
        language: 'en-US'
      };

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          ...options
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deepgram API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      const alternative = data.results?.channels?.[0]?.alternatives?.[0];

      return {
        id: `deepgram-${Date.now()}`,
        serviceName: this.serviceName,
        text: alternative?.transcript || '',
        confidence: alternative?.confidence,
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: options.model,
          language: options.language,
          wordCount: alternative?.words?.length || 0,
          rawResponse: data
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Deepgram processor error: ${errorMessage}`);
      throw new Error(`Deepgram processor failed: ${errorMessage}`);
    }
  },

  async testConnection(): Promise<ApiTestResult> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return { serviceName: this.serviceName, success: false, error: 'API key not configured.' };
    }

    try {
      // Deepgram docs suggest hitting this endpoint to validate a key.
      const response = await fetch(AUTH_TEST_ENDPOINT, {
        method: 'GET',
        headers: { 'Authorization': `Token ${apiKey}` }
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