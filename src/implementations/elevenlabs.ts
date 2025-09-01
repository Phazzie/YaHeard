import type { AudioProcessor, ElevenLabsConfig } from '../contracts/processors';
import type { TranscriptionResult } from '../contracts/transcription';

const API_ENDPOINT = 'https://api.elevenlabs.io/v1/speech-to-text';

/**
 * Implements the AudioProcessor interface for ElevenLabs.
 */
export class ElevenLabsProcessor implements AudioProcessor {
  readonly serviceName = 'ElevenLabs';
  private config: ElevenLabsConfig;

  constructor(config: ElevenLabsConfig = {}) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  async processFile(file: File): Promise<TranscriptionResult> {
    if (!this.config.apiKey) {
      throw new Error('ElevenLabs API key not configured.');
    }

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const model = this.config.options?.model || 'scribe_v1';
      const language = this.config.options?.language;
      formData.append('model_id', model);
      if (language) {
        formData.append('language_code', language);
      }

      const startTime = Date.now();

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey
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
  }

  async getCostPerMinute(): Promise<number> {
    // ElevenLabs pricing as of late 2024.
    return 0.002;
  }

  getSupportedFormats(): string[] {
    // Based on ElevenLabs API documentation.
    return ['.mp3', '.wav', '.m4a', '.webm', '.flac', '.ogg', '.aac'];
  }
}