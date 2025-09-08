import type { TranscriptionResult, TranscriptionService, ApiTestResult } from '../contracts/transcription';

const API_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const TRANSCRIPTION_PROMPT = "Please transcribe this audio file. Provide only the transcribed text without any additional commentary or formatting.";

/**
 * Implements the TranscriptionService interface for Google's Gemini model.
 */
export const geminiProcessor: TranscriptionService = {
  serviceName: 'Google Gemini',

  isConfigured: !!process.env.GEMINI_API_KEY,

  async process(audio: Buffer): Promise<TranscriptionResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured.');
    }

    try {
      const base64Audio = audio.toString('base64');
      const startTime = Date.now();
      const model = 'gemini-1.5-flash-latest';

      const requestBody = {
        contents: [{
          parts: [
            { text: TRANSCRIPTION_PROMPT },
            { inlineData: { mimeType: 'audio/mp3', data: base64Audio } } // Assume mp3, Gemini is flexible
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1.0,
          maxOutputTokens: 2048,
        }
      };

      const response = await fetch(`${API_ENDPOINT_BASE}/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      const candidate = data.candidates?.[0];
      const transcribedText = candidate?.content?.parts?.[0]?.text || '';

      if (!candidate) {
        throw new Error('Gemini returned no candidates in response.');
      }

      return {
        id: `gemini-${Date.now()}`,
        serviceName: this.serviceName,
        text: transcribedText.trim(),
        confidence: undefined, // Gemini does not provide a confidence score.
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: model,
          apiVersion: 'v1beta',
          rawResponse: data
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Gemini processor error: ${errorMessage}`);
      throw new Error(`Gemini processor failed: ${errorMessage}`);
    }
  },

  async testConnection(): Promise<ApiTestResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { serviceName: this.serviceName, success: false, error: 'API key not configured.' };
    }

    try {
      const response = await fetch(`${API_ENDPOINT_BASE}/models?pageSize=1`, {
        method: 'GET',
        headers: { 'x-goog-api-key': apiKey }
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
