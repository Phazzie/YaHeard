import type { AudioProcessor, WhisperConfig } from '../contracts/processors';
import type { TranscriptionResult } from '../contracts/transcription';

/**
 * Implements the AudioProcessor interface for OpenAI's Whisper model.
 */
export class WhisperProcessor implements AudioProcessor {
  readonly serviceName = 'Whisper';
  private config: WhisperConfig;
  private readonly API_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

  constructor(config: WhisperConfig = {}) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  async processFile(file: File): Promise<TranscriptionResult> {
    if (!this.config.apiKey) {
      throw new Error('Whisper API key not configured.');
    }

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const model = this.config.options?.model || 'whisper-1';
      const language = this.config.options?.language;
      formData.append('model', model);
      if (language) {
        formData.append('language', language);
      }

      const startTime = Date.now();

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
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
  }

  async getCostPerMinute(): Promise<number> {
    // OpenAI Whisper pricing as of late 2024.
    return 0.006;
  }

  getSupportedFormats(): string[] {
    // Based on OpenAI Whisper API documentation.
    return ['.mp3', '.wav', '.m4a', '.webm', '.flac', '.ogg'];
  }
}