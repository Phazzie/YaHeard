/**
 * =============================================================================
 * @file src/lib/services/gemini.ts - Google Gemini 2.5 Flash Implementation
 * =============================================================================
 *
 * WHY THIS FILE EXISTS:
 * =====================
 * This adds Google Gemini 2.5 Flash as a third AI service for consensus comparison.
 * Four services provide better accuracy through triangulation of results.
 *
 * @phazzie-status working
 * @last-regenerated 2025-08-29 15:30 UTC
 * @dependencies Gemini API key, base64 audio encoding
 */

import type { AudioProcessor, ProcessorConfig } from '../../contracts/processors';
import type { TranscriptionResult } from '../../contracts/transcription';
import { TranscriptionServiceError } from '$lib/server/errors';

export class GeminiService implements AudioProcessor {
  serviceName = 'Google Gemini 2.5 Flash';

  private config: ProcessorConfig;

  constructor(config: ProcessorConfig = {}) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  getRequiredEnvVars(): string[] {
    return ['GEMINI_API_KEY'];
  }

  async isAvailable(): Promise<boolean> {
    return this.isConfigured();
  }

  async processFile(file: File): Promise<TranscriptionResult> {

    try {
      if (!this.isConfigured()) {
        throw new Error('GEMINI_API_KEY not configured - add to environment variables');
      }


      // Convert File to ArrayBuffer for API
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const startTime = Date.now();


      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: "Transcribe this audio exactly as spoken. Return ONLY the transcription, no other text."
                },
                {
                  inlineData: {
                    mimeType: "audio/wav",
                    data: Buffer.from(arrayBuffer).toString('base64')
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const transcriptionText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';


      const processingTime = Date.now() - startTime;

      return {
        id: `gemini-${Date.now()}`,
        serviceName: this.serviceName,
        text: transcriptionText.trim(),
        confidence: 0.9, // Gemini typically has high confidence
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: 'gemini-2.5-flash',
          wordCount: transcriptionText.split(' ').length
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new TranscriptionServiceError(this.serviceName, `Gemini API integration failed: ${errorMessage}`, { cause: error });
    }
  }

  getCostPerMinute(): number {
    // Gemini 2.5 Flash pricing (approximate as of 2025)
    return 0.0018; // $0.0018 per minute
  }

  getSupportedFormats(): string[] {
    return ['.mp3', '.wav', '.m4a', '.flac', '.webm', '.ogg'];
  }
}
