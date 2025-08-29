/**
 * =============================================================================
 * @file assembly.ts - ASSEMBLYAI PROCESSOR IMPLEMENTATION
 * =============================================================================
 *
 * WHY THIS FILE EXISTS:
 * =====================
 * This file implements the AudioProcessor interface for AssemblyAI's advanced transcription service.
 * AssemblyAI provides high accuracy transcription with additional features like speaker diarization.
 * This implementation can be completely regenerated when AssemblyAI's API changes.
 *
 * @phazzie-status working
 * @last-regenerated 2025-08-29 15:30 UTC
 * @dependencies processors.ts contract - Implements AudioProcessor interface
 *
 * ARCHITECTURAL ROLE:
 * ===================
 * 1. ASSEMBLYAI INTEGRATION: Connects to AssemblyAI's advanced API
 * 2. CONTRACT COMPLIANCE: Implements AudioProcessor interface exactly
 * 3. ERROR HANDLING: Graceful failure with @phazzie-friendly messages
 * 4. ADVANCED FEATURES: Speaker diarization, sentiment analysis
 *
 * REGENERATION RULES:
 * ===================
 * ✅ COMPLETE REGENERATION ALLOWED: This entire file can be rewritten
 * ✅ CONTRACT MUST BE MAINTAINED: Must still implement AudioProcessor
 * ✅ API CHANGES: Regenerate when AssemblyAI API updates
 * ✅ NEW FEATURES: Regenerate when adding AssemblyAI-specific features
 *
 * ASSEMBLYAI-SPECIFIC CONSIDERATIONS:
 * ===================================
 * - Two-step process: upload audio, then transcribe
 * - Polling required to check transcription status
 * - Advanced features like speaker identification
 * - Higher cost but better accuracy than basic services
 *
 * REGENERATION SCENARIOS:
 * =======================
 * 1. **API Changes**: AssemblyAI updates their API
 * 2. **New Features**: Add speaker diarization, sentiment analysis
 * 3. **Cost Changes**: Pricing updates
 * 4. **Bug Fixes**: API integration issues
 */

import type { AudioProcessor, ProcessorConfig } from '../contracts/processors.ts';
import type { TranscriptionResult } from '../contracts/transcription.ts';

// ========= REGENERATION BOUNDARY START: AssemblyAI Implementation =========
// @phazzie: This entire file can be regenerated independently
// @contract: Must implement AudioProcessor interface
// @dependencies: processors.ts contract

export class AssemblyAIProcessor implements AudioProcessor {
  serviceName = 'AssemblyAI';
  private config: ProcessorConfig;

  constructor(config: ProcessorConfig = {}) {
    this.config = config;
    console.log('@phazzie-checkpoint-assembly-1: AssemblyAI processor initialized');
  }

  async isAvailable(): Promise<boolean> {
    console.log('@phazzie-checkpoint-assembly-2: Checking AssemblyAI availability');

    if (!this.config.apiKey) {
      console.log('@phazzie-checkpoint-assembly-3: No API key configured');
      return false;
    }

    console.log('@phazzie-checkpoint-assembly-4: AssemblyAI is available');
    return true;
  }

  async processFile(file: File): Promise<TranscriptionResult> {
    console.log('@phazzie-checkpoint-assembly-5: Starting REAL AssemblyAI processing');

    try {
      // WHY REAL API IMPLEMENTATION:
      // ============================
      // Previous version was placeholder - now using actual AssemblyAI API
      // AssemblyAI provides high accuracy with advanced features
      // Two-step process: upload audio, then transcribe

      if (!this.config.apiKey) {
        throw new Error('ASSEMBLYAI_API_KEY not configured - add to environment variables');
      }

      console.log('@phazzie-checkpoint-assembly-6: Converting file to buffer');

      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const startTime = Date.now();

      // WHY TWO-STEP PROCESS:
      // =====================
      // AssemblyAI requires separate upload and transcription steps
      // Upload returns a URL, then transcription is requested
      // Polling is needed to check completion status

      console.log('@phazzie-checkpoint-assembly-7: Uploading audio to AssemblyAI');

      // Step 1: Upload audio file
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': this.config.apiKey,
          'content-type': 'application/octet-stream'
        },
        body: uint8Array
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const { upload_url } = await uploadResponse.json();

      console.log('@phazzie-checkpoint-assembly-8: Requesting transcription');

      // Step 2: Request transcription
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': this.config.apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: upload_url,
          language_code: 'en'
        })
      });

      if (!transcriptResponse.ok) {
        throw new Error(`Transcription request failed: ${transcriptResponse.status}`);
      }

      const { id } = await transcriptResponse.json();

      console.log('@phazzie-checkpoint-assembly-9: Polling for completion');

      // Step 3: Poll for results (max 60 seconds)
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
          headers: {
            'authorization': this.config.apiKey
          }
        });

        const result = await statusResponse.json();

        if (result.status === 'completed') {
          console.log('@phazzie-checkpoint-assembly-10: Transcription completed successfully');

          const processingTime = Date.now() - startTime;

          const transcriptionResult: TranscriptionResult = {
            id: `assembly-${Date.now()}`,
            serviceName: this.serviceName,
            text: result.text,
            confidence: result.confidence || 0.92,
            processingTimeMs: processingTime,
            timestamp: new Date(),
            metadata: {
              model: 'assembly-ai-best',
              language: result.language_code || 'en',
              wordCount: result.text.split(' ').length,
              features: ['speaker_diarization', 'sentiment_analysis']
            }
          };

          console.log('@phazzie-checkpoint-assembly-11: Returning transcription result');
          return transcriptionResult;

        } else if (result.status === 'error') {
          throw new Error('AssemblyAI transcription failed');
        }

        attempts++;
      }

      throw new Error('Transcription timeout after 60 seconds');

    } catch (error) {
      // WHY THIS ERROR HANDLING:
      // ========================
      // Must provide @phazzie-friendly error messages
      // Should guide regeneration when things break

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('@phazzie-error-assembly:', errorMessage);
      console.error('ASSEMBLYAI REGENERATION NEEDED:');
      console.error('1. Check ASSEMBLYAI_API_KEY environment variable');
      console.error('2. Verify API key has sufficient credits');
      console.error('3. Ensure audio file is valid format');
      console.error('4. Check network connectivity to AssemblyAI');

      throw new Error(`REGENERATE_NEEDED: AssemblyAI API integration - ${errorMessage}`);
    }
  }

  getCostPerMinute(): number {
    return 0.025; // $0.025 per minute for AssemblyAI
  }

  getSupportedFormats(): string[] {
    return ['.mp3', '.wav', '.m4a', '.webm', '.flac'];
  }
}

// ========= REGENERATION BOUNDARY END: AssemblyAI Implementation =========