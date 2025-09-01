import type { AudioProcessor, DeepgramConfig } from '../contracts/processors';
import type { TranscriptionResult } from '../contracts/transcription';

const API_ENDPOINT = 'https://api.deepgram.com/v1/listen';

/**
 * Implements the AudioProcessor interface for Deepgram.
 */
export class DeepgramProcessor implements AudioProcessor {
  readonly serviceName = 'Deepgram';
  private config: DeepgramConfig;

  constructor(config: DeepgramConfig = {}) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  async processFile(file: File): Promise<TranscriptionResult> {
    if (!this.config.apiKey) {
      throw new Error('Deepgram API key not configured.');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Audio = this.arrayBufferToBase64(arrayBuffer);
      const startTime = Date.now();

      const options = {
        model: this.config.options?.model || 'nova-2',
        smart_format: this.config.options?.smart_format ?? true,
        punctuate: this.config.options?.punctuate ?? true,
        utterances: this.config.options?.utterances ?? true,
        language: this.config.options?.language || 'en-US'
      };

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.apiKey}`,
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
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async getCostPerMinute(): Promise<number> {
    // Deepgram pricing as of late 2024.
    return 0.0043;
  }

  getSupportedFormats(): string[] {
    // Based on Deepgram API documentation.
    return ['.mp3', '.wav', '.m4a', '.webm', '.flac', '.ogg', '.aac', '.wma'];
  }
}