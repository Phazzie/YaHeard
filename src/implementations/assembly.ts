import type { AudioProcessor, AssemblyAIConfig } from '../contracts/processors';
import type { TranscriptionResult } from '../contracts/transcription';

const UPLOAD_ENDPOINT = 'https://api.assemblyai.com/v2/upload';
const TRANSCRIPT_ENDPOINT = 'https://api.assemblyai.com/v2/transcript';

/**
 * Implements the AudioProcessor interface for AssemblyAI.
 * This processor uses a two-step process: upload and transcribe with polling.
 */
export class AssemblyAIProcessor implements AudioProcessor {
  readonly serviceName = 'AssemblyAI';
  private config: AssemblyAIConfig;

  constructor(config: AssemblyAIConfig = {}) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  async processFile(file: File): Promise<TranscriptionResult> {
    if (!this.config.apiKey) {
      throw new Error('AssemblyAI API key not configured.');
    }

    try {
      const startTime = Date.now();

      // Step 1: Upload the audio file to get a URL.
      const uploadUrl = await this.uploadFile(file);

      // Step 2: Request transcription for the uploaded file.
      const transcriptId = await this.requestTranscription(uploadUrl);

      // Step 3: Poll for the transcription result.
      const result = await this.pollForResult(transcriptId);

      const processingTime = Date.now() - startTime;

      return {
        id: `assembly-${Date.now()}`,
        serviceName: this.serviceName,
        text: result.text,
        confidence: result.confidence,
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: 'assembly-ai-best', // AssemblyAI doesn't specify model versions in the response
          language: result.language_code,
          wordCount: result.words.length,
          rawResponse: result // Include the raw response for more details if needed
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`AssemblyAI processor error: ${errorMessage}`);
      throw new Error(`AssemblyAI processor failed: ${errorMessage}`);
    }
  }

  private async uploadFile(file: File): Promise<string> {
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: {
        'authorization': this.config.apiKey!,
        'content-type': 'application/octet-stream'
      },
      body: await file.arrayBuffer()
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const { upload_url } = await response.json();
    return upload_url;
  }

  private async requestTranscription(audioUrl: string): Promise<string> {
    const response = await fetch(TRANSCRIPT_ENDPOINT, {
      method: 'POST',
      headers: {
        'authorization': this.config.apiKey!,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: this.config.options?.language || 'en'
      })
    });

    if (!response.ok) {
      throw new Error(`Transcription request failed with status ${response.status}`);
    }

    const { id } = await response.json();
    return id;
  }

  private async pollForResult(transcriptId: string): Promise<any> {
    const pollingEndpoint = `${TRANSCRIPT_ENDPOINT}/${transcriptId}`;
    const maxAttempts = 30; // Poll for 30 seconds
    const delay = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delay));

      const response = await fetch(pollingEndpoint, {
        headers: { 'authorization': this.config.apiKey! }
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

  async getCostPerMinute(): Promise<number> {
    // AssemblyAI pricing as of late 2024.
    return 0.025;
  }

  getSupportedFormats(): string[] {
    // Based on AssemblyAI API documentation.
    return ['.mp3', '.wav', '.m4a', '.webm', '.flac'];
  }
}