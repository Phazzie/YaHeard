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
 *
 * GEMINI-SPECIFIC API PATTERNS (FROM LESSONS LEARNED):
 * ===================================================
 * 1. COMPLEX AUTHENTICATION: Uses API key in query parameter (not header)
 * 2. INLINE DATA ENCODING: Requires base64 encoding of audio data
 * 3. MULTIMODAL CONTENT: Uses 'contents' array with text + inlineData
 * 4. GENERATION CONFIG: Separate config object for model parameters
 * 5. RESPONSE PARSING: Nested structure (candidates[0].content.parts[0].text)
 *
 * WHY GEMINI INTEGRATION:
 * =======================
 * - Industry-leading multimodal capabilities
 * - Excellent audio transcription accuracy
 * - Competitive pricing at $0.0018/minute
 * - Different algorithmic approach provides consensus value
 *
 * REGENERATION SCENARIOS:
 * =======================
 * 1. API Endpoint Changes: Google updates API structure
 * 2. Authentication Changes: New auth methods available
 * 3. Model Updates: New Gemini versions released
 * 4. Pricing Changes: Cost per minute updates
 * 5. Feature Additions: New audio processing capabilities
 */

import type { AudioProcessor, ProcessorConfig } from '../../contracts/processors';
import type { TranscriptionResult } from '../../contracts/transcription';

export class GeminiService implements AudioProcessor {
  serviceName = 'Google Gemini 2.5 Flash';

  private config: ProcessorConfig;

  constructor(config: ProcessorConfig = {}) {
    this.config = config;
    console.log('@phazzie-checkpoint-gemini-init: Gemini service initialized');
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  getRequiredEnvVars(): string[] {
    return ['GEMINI_API_KEY'];
  }

  async isAvailable(): Promise<boolean> {
    console.log('@phazzie-checkpoint-gemini-0: Checking Gemini availability');
    return this.isConfigured();
  }

  async processFile(file: File): Promise<TranscriptionResult> {
    console.log('@phazzie-checkpoint-gemini-1: Starting REAL Gemini API processing');

    try {
      if (!this.isConfigured()) {
        throw new Error('GEMINI_API_KEY not configured - add to environment variables');
      }

      console.log('@phazzie-checkpoint-gemini-2: Converting file to buffer');

      // WHY BASE64 ENCODING:
      // ====================
      // Gemini API requires audio data as base64-encoded string
      // Must convert ArrayBuffer to base64 for API compatibility
      // This is Gemini-specific - other services use different approaches

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const startTime = Date.now();

      console.log('@phazzie-checkpoint-gemini-3: Calling Gemini API');

      // WHY THIS API STRUCTURE:
      // =======================
      // Gemini uses multimodal content structure
      // Text prompt + inline audio data in same request
      // Different from simple text-only APIs used by other services

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
                    data: btoa(String.fromCharCode(...Array.from(uint8Array)))
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,  // Low temperature for consistent transcription
              maxOutputTokens: 8192  // Sufficient for most audio transcriptions
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      // WHY THIS RESPONSE PARSING:
      // ==========================
      // Gemini returns nested response structure
      // Must navigate: data.candidates[0].content.parts[0].text
      // Different from flat response structures of other APIs

      const data = await response.json();
      const transcriptionText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log('@phazzie-checkpoint-gemini-4: Transcription completed successfully');

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
          wordCount: transcriptionText.split(' ').length,
          apiPattern: 'multimodal-inline-data', // Gemini-specific pattern
          encodingMethod: 'base64' // Audio encoding method used
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('@phazzie-error-gemini:', errorMessage);

      return {
        id: `gemini-error-${Date.now()}`,
        serviceName: this.serviceName,
        text: '',
        confidence: 0,
        processingTimeMs: 0,
        timestamp: new Date(),
        error: errorMessage
      };
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
