import type { AudioProcessor, GeminiConfig } from '../contracts/processors';
import type { TranscriptionResult } from '../contracts/transcription';

const API_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=';
const TRANSCRIPTION_PROMPT = "Please transcribe this audio file. Provide only the transcribed text without any additional commentary or formatting.";

/**
 * Implements the AudioProcessor interface for Google's Gemini model.
 */
export class GeminiProcessor implements AudioProcessor {
  readonly serviceName = 'Google Gemini';
  private readonly config: GeminiConfig;

  constructor(config: GeminiConfig = {}) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  async processFile(file: File): Promise<TranscriptionResult> {
    if (!this.config.apiKey) {
      throw new Error('Gemini API key not configured.');
    }

    try {
      const base64Audio = await this.arrayBufferToBase64(file);
      const startTime = Date.now();

      const requestBody = this.buildRequestBody(file, base64Audio);
      const data = await this.callGeminiApi(requestBody, this.config.apiKey);

      const processingTime = Date.now() - startTime;
      const transcribedText = this.extractTranscribedText(data);

      return {
        id: `gemini-${Date.now()}`,
        serviceName: this.serviceName,
        text: transcribedText.trim(),
        confidence: undefined, // Gemini does not provide a confidence score.
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: this.config.options?.model || 'gemini-2.0-flash-exp',
          apiVersion: 'v1beta',
          rawResponse: data
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Gemini processor error: ${errorMessage}`);
      throw new Error(`Gemini processor failed: ${errorMessage}`);
    }
  }

  private buildRequestBody(file: File, base64Audio: string) {
    return {
      contents: [{
        parts: [
          { text: TRANSCRIPTION_PROMPT },
          { inlineData: { mimeType: file.type || 'audio/wav', data: base64Audio } }
        ]
      }],
      generationConfig: {
        temperature: this.config.options?.temperature || 0.1,
        topK: this.config.options?.topK || 1,
        topP: this.config.options?.topP || 1.0,
        maxOutputTokens: this.config.options?.maxOutputTokens || 2048,
      }
    } as const;
  }

  private async callGeminiApi(requestBody: unknown, apiKey: string): Promise<any> {
    const response = await fetch(`${API_ENDPOINT_BASE}${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  private extractTranscribedText(data: any): string {
    const candidate = data?.candidates?.[0];
    if (!candidate) {
      throw new Error('Gemini returned no candidates in response.');
    }
    const text = candidate?.content?.parts?.[0]?.text || '';
    return text;
  }

  private async arrayBufferToBase64(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    // Server-side base64 conversion using Buffer (Node.js)
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  }

  async getCostPerMinute(): Promise<number> {
    // Gemini pricing as of late 2024.
    return 0.0018;
  }

  getSupportedFormats(): string[] {
    // Return file extensions to align with app contracts and UI validation.
    return ['.wav', '.mp3', '.m4a', '.ogg', '.webm', '.flac'];
  }
}
