import type { TranscriptionResult, TranscriptionService, ApiTestResult } from '../contracts/transcription';

const API_BASE = 'https://api.openai.com/v1';

/**
 * Implements the TranscriptionService interface for OpenAI's Whisper model.
 */
export const whisperProcessor: TranscriptionService = {
  serviceName: 'Whisper (OpenAI)',

  isConfigured: !!process.env.OPENAI_API_KEY,

  async process(audio: Buffer): Promise<TranscriptionResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Whisper API key not configured.');
    }

    try {
      const formData = new FormData();
      const audioBlob = new Blob([audio]);
      formData.append('file', audioBlob, 'audio.mp3');

      const model = 'whisper-1';
      formData.append('model', model);

      const prompt = "The following is a transcript of an audio file. If there are any words that are unclear, please use your best guess and surround them with brackets. For example: 'I think the answer is [four/for]'. If you are very unsure, use a question mark in brackets. For example: '[?]'. Please also try to identify and label different speakers, for example: '[SPEAKER A]', '[SPEAKER B]'.";
      formData.append('prompt', prompt);

      const startTime = Date.now();

      const response = await fetch(`${API_BASE}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        id: `whisper-${Date.now()}`,
        serviceName: this.serviceName,
        text: data.text,
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: model,
          language: data.language,
          apiVersion: 'v1',
          wordCount: data.text.split(' ').length
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Whisper processor error: ${errorMessage}`);
      throw new Error(`Whisper processor failed: ${errorMessage}`);
    }
  },

  async testConnection(): Promise<ApiTestResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { serviceName: this.serviceName, success: false, error: 'API key not configured.' };
    }

    try {
      const response = await fetch(`${API_BASE}/models`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
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