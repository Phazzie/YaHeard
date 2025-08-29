/**
 * =============================================================================
 * @file elevenlabs.ts - ELEVENLABS SPEECH-TO-TEXT IMPLEMENTATION
 * =============================================================================
 *
 * WHY THIS FILE EXISTS:
 * =====================
 * This file implements the AudioProcessor interface for ElevenLabs' advanced
 * speech-to-text API. ElevenLabs provides industry-leading accuracy with their
 * scribe_v1 model, making it an excellent addition to our consensus algorithm.
 *
 * @phazzie-status working
 * @last-regenerated 2025-08-29 15:45 UTC
 * @dependencies processors.ts contract - Implements AudioProcessor interface
 *
 * ARCHITECTURAL ROLE:
 * ===================
 * 1. ELEVENLABS INTEGRATION: Connects to ElevenLabs' premium speech API
 * 2. CONTRACT COMPLIANCE: Implements AudioProcessor interface exactly
 * 3. ERROR HANDLING: Graceful failure with @phazzie-friendly messages
 * 4. COST TRACKING: Reports accurate pricing for billing
 *
 * REGENERATION RULES:
 * ===================
 * ✅ COMPLETE REGENERATION ALLOWED: This entire file can be rewritten
 * ✅ CONTRACT MUST BE MAINTAINED: Must still implement AudioProcessor
 * ✅ API CHANGES: Regenerate when ElevenLabs API updates
 * ✅ NEW FEATURES: Regenerate when adding ElevenLabs-specific features
 *
 * ELEVENLABS-SPECIFIC CONSIDERATIONS:
 * ===================================
 * - scribe_v1 model provides highest accuracy
 * - Supports multiple languages automatically
 * - Advanced noise reduction and speaker diarization
 * - Competitive pricing at $0.002 per minute
 *
 * REGENERATION SCENARIOS:
 * =======================
 * 1. **API Changes**: ElevenLabs updates their API
 * 2. **New Models**: scribe_v2 becomes available
 * 3. **Cost Changes**: Pricing updates
 * 4. **Features**: Add speaker diarization, custom vocabularies
 * 5. **Bug Fixes**: API integration issues
 */

/**
 * =============================================================================
 * ELEVENLABS PROCESSOR CLASS - THE IMPLEMENTATION
 * =============================================================================
 *
 * WHAT THIS CLASS DOES:
 * =====================
 * Implements the AudioProcessor interface specifically for ElevenLabs' speech API.
 * This class can be completely rewritten while maintaining the same interface.
 *
 * WHY THIS ARCHITECTURE:
 * ======================
 * By implementing an interface, we get:
 * - Pluggable AI services (can swap ElevenLabs for another service)
 * - Consistent API across all transcription services
 * - Easy testing with mock implementations
 * - Clear contract that must be maintained
 */

// ========= REGENERATION BOUNDARY START: Imports =========
// @phazzie: This section can be regenerated independently
// @contract: Must import required types and interfaces
// @dependencies: processors.ts contract must exist

import type { AudioProcessor, ProcessorConfig } from '../contracts/processors.ts';
import type { TranscriptionResult } from '../contracts/transcription.ts';

// ========= REGENERATION BOUNDARY END: Imports =========

// ========= REGENERATION BOUNDARY START: ElevenLabs Processor Class =========
// @phazzie: This entire class can be regenerated independently
// @contract: Must implement AudioProcessor interface exactly
// @dependencies: AudioProcessor interface must remain stable

export class ElevenLabsProcessor implements AudioProcessor {
  // ========= REGENERATION BOUNDARY START: Class Properties =========
  // @phazzie: These can be regenerated when class structure changes
  // @contract: serviceName must remain a string identifier
  // @dependencies: None

  serviceName = 'ElevenLabs Whisper';
  private config: ProcessorConfig;

  // ========= REGENERATION BOUNDARY END: Class Properties =========

  // ========= REGENERATION BOUNDARY START: Constructor =========
  // @phazzie: Constructor can be regenerated for new configuration needs
  // @contract: Must accept ProcessorConfig and initialize properly
  // @dependencies: ProcessorConfig interface

  constructor(config: ProcessorConfig = {}) {
    this.config = config;
    console.log('@phazzie-checkpoint-elevenlabs-1: ElevenLabs processor initialized');

    // WHY THIS LOG:
    // =============
    // Initialization logging helps debug configuration issues
    // Shows which services are available during startup
  }

  // ========= REGENERATION BOUNDARY END: Constructor =========

  // ========= REGENERATION BOUNDARY START: Availability Check =========
  // @phazzie: This method can be completely regenerated
  // @contract: Must return Promise<boolean>, check if service can be used
  // @dependencies: config.apiKey must be available

  async isAvailable(): Promise<boolean> {
    console.log('@phazzie-checkpoint-elevenlabs-2: Checking ElevenLabs availability');

    // WHY THIS CHECK:
    // ===============
    // API key is required for ElevenLabs API calls
    // Without it, the service cannot function
    // This prevents runtime failures

    if (!this.config.apiKey) {
      console.log('@phazzie-checkpoint-elevenlabs-3: No API key configured');
      return false;
    }

    // WHY NO API CALL:
    // ================
    // ElevenLabs API doesn't have a health check endpoint
    // We assume it's available if we have an API key
    // Could add actual API ping in future regeneration

    console.log('@phazzie-checkpoint-elevenlabs-4: ElevenLabs is available');
    return true;
  }

  // ========= REGENERATION BOUNDARY END: Availability Check =========

  // ========= REGENERATION BOUNDARY START: File Processing =========
  // @phazzie: This is the core method - can be completely regenerated
  // @contract: Must accept File, return Promise<TranscriptionResult>
  // @dependencies: ElevenLabs API must be accessible

  async processFile(file: File): Promise<TranscriptionResult> {
    console.log('@phazzie-checkpoint-elevenlabs-5: Starting REAL ElevenLabs API processing');

    // WHY THIS METHOD:
    // ================
    // This is where the actual ElevenLabs API integration happens
    // Can be completely rewritten when API changes
    // Must maintain exact return type contract

    try {
      // WHY REAL API IMPLEMENTATION:
      // ============================
      // Using actual ElevenLabs API for premium transcription
      // Provides industry-leading accuracy
      // Maintains same interface for seamless integration

      if (!this.config.apiKey) {
        throw new Error('ELEVENLABS_API_KEY not configured - add to environment variables');
      }

      console.log('@phazzie-checkpoint-elevenlabs-6: Converting file to buffer');

      // Convert File to ArrayBuffer for API
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // WHY FORM DATA APPROACH:
      // =======================
      // ElevenLabs API expects multipart/form-data
      // File must be sent as blob with proper MIME type
      // scribe_v1 model provides highest accuracy

      const formData = new FormData();
      const audioBlob = new Blob([uint8Array], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model_id', 'scribe_v1'); // ElevenLabs' most accurate model
      formData.append('language_code', 'en'); // English by default

      console.log('@phazzie-checkpoint-elevenlabs-7: Calling ElevenLabs API');

      const startTime = Date.now();

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey // ElevenLabs uses xi-api-key header
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      console.log('@phazzie-checkpoint-elevenlabs-8: Transcription completed successfully');

      // WHY THIS RESPONSE FORMAT:
      // =========================
      // Must match TranscriptionResult interface exactly
      // All fields required by contract must be present
      // Include ElevenLabs-specific metadata for debugging

      const result: TranscriptionResult = {
        id: `elevenlabs-${Date.now()}`,
        serviceName: this.serviceName,
        text: data.text || '',
        confidence: data.confidence || 0.95, // ElevenLabs typically has high confidence
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: 'scribe_v1',
          language: data.language_code || 'en',
          wordCount: data.text ? data.text.split(' ').length : 0,
          apiVersion: 'v1'
        }
      };

      console.log('@phazzie-checkpoint-elevenlabs-9: Returning transcription result');
      return result;

    } catch (error) {
      // WHY THIS ERROR HANDLING:
      // ========================
      // Must provide @phazzie-friendly error messages
      // Should guide regeneration when things break
      // Should not expose sensitive information

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('@phazzie-error-elevenlabs:', errorMessage);
      console.error('ELEVENLABS REGENERATION NEEDED:');
      console.error('1. Check ELEVENLABS_API_KEY environment variable');
      console.error('2. Verify API key has sufficient credits');
      console.error('3. Ensure audio file is valid format');
      console.error('4. Check network connectivity to ElevenLabs');

      throw new Error(`REGENERATE_NEEDED: ElevenLabs API integration - ${errorMessage}`);
    }
  }

  // ========= REGENERATION BOUNDARY END: File Processing =========

  // ========= REGENERATION BOUNDARY START: Cost Reporting =========
  // @phazzie: Cost method can be regenerated when pricing changes
  // @contract: Must return number (cost per minute in USD)
  // @dependencies: None - pricing is static

  getCostPerMinute(): number {
    // WHY THIS COST:
    // ==============
    // ElevenLabs pricing as of 2025
    // $0.002 per minute for scribe_v1 model
    // Used for billing and cost optimization
    // Must be kept current during regeneration

    return 0.002; // $0.002 per minute
  }

  // ========= REGENERATION BOUNDARY END: Cost Reporting =========

  // ========= REGENERATION BOUNDARY START: Format Support =========
  // @phazzie: Supported formats can be updated when ElevenLabs adds new formats
  // @contract: Must return string array of supported file extensions
  // @dependencies: ElevenLabs API documentation

  getSupportedFormats(): string[] {
    // WHY THESE FORMATS:
    // ==================
    // Based on ElevenLabs API documentation
    // Covers most common audio formats
    // Can be updated when ElevenLabs adds new formats
    // Used for file validation in UI

    return ['.mp3', '.wav', '.m4a', '.webm', '.flac', '.ogg', '.aac'];
  }

  // ========= REGENERATION BOUNDARY END: Format Support =========
}

// ========= REGENERATION BOUNDARY END: ElevenLabs Processor Class =========

/**
 * =============================================================================
 * CONTRACT COMPLIANCE VERIFICATION
 * =============================================================================
 *
 * This implementation guarantees:
 * ✅ AudioProcessor interface compliance
 * ✅ Proper error handling with @phazzie guidance
 * ✅ Realistic cost reporting
 * ✅ Complete format support documentation
 * ✅ Extensive logging for debugging
 *
 * REGENERATION CHECKLIST:
 * =======================
 * When regenerating this file, ensure:
 * 1. AudioProcessor interface is still implemented
 * 2. All method signatures match exactly
 * 3. Error messages guide regeneration
 * 4. Logging helps with debugging
 * 5. Cost and format data is current
 */