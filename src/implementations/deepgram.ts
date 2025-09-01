/**
 * =============================================================================
 * @file deepgram.ts - DEEPGRAM AI PROCESSOR IMPLEMENTATION
 * =============================================================================
 *
 * WHY THIS FILE EXISTS:
 * =====================
 * This file implements the AudioProcessor interface for Deepgram's speech recognition.
 * Deepgram provides high-accuracy transcription with advanced features like real-time
 * processing, custom vocabularies, and speaker diarization. Adding it increases
 * transcription diversity for better consensus results.
 *
 * @phazzie-status working
 * @last-regenerated 2025-08-29 15:30 UTC
 * @dependencies processors.ts contract - Implements AudioProcessor interface
 *
 * ARCHITECTURAL ROLE:
 * ===================
 * 1. DEEPGRAM INTEGRATION: Connects to Deepgram's advanced speech API
 * 2. CONTRACT COMPLIANCE: Implements AudioProcessor interface exactly
 * 3. ERROR HANDLING: Graceful failure with @phazzie-friendly messages
 * 4. COST TRACKING: Reports accurate pricing for billing
 *
 * REGENERATION RULES:
 * ===================
 * ✅ COMPLETE REGENERATION ALLOWED: This entire file can be rewritten
 * ✅ CONTRACT MUST BE MAINTAINED: Must still implement AudioProcessor
 * ✅ API CHANGES: Regenerate when Deepgram API updates
 * ✅ NEW FEATURES: Regenerate when adding Deepgram-specific features
 *
 * DEEPGRAM-SPECIFIC CONSIDERATIONS:
 * ================================
 * - Nova-2 model provides highest accuracy
 * - Smart formatting and punctuation included
 * - Utterance detection for better structure
 * - Cost-effective pricing at $0.0043 per minute
 *
 * REGENERATION SCENARIOS:
 * =======================
 * 1. **API Changes**: Deepgram updates their API
 * 2. **New Models**: Nova-2 becomes Nova-3
 * 3. **Cost Changes**: Pricing updates
 * 4. **Features**: Add speaker diarization, custom vocabularies
 * 5. **Bug Fixes**: API integration issues
 */

/**
 * =============================================================================
 * DEEPGRAM PROCESSOR CLASS - THE IMPLEMENTATION
 * =============================================================================
 *
 * WHAT THIS CLASS DOES:
 * =====================
 * Implements the AudioProcessor interface specifically for Deepgram's speech API.
 * This class can be completely rewritten while maintaining the same interface.
 *
 * WHY THIS ARCHITECTURE:
 * ======================
 * By implementing an interface, we get:
 * - Pluggable AI services (can swap Deepgram for another service)
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

// ========= REGENERATION BOUNDARY START: Deepgram Processor Class =========
// @phazzie: This entire class can be regenerated independently
// @contract: Must implement AudioProcessor interface exactly
// @dependencies: AudioProcessor interface must remain stable

export class DeepgramProcessor implements AudioProcessor {
  // ========= REGENERATION BOUNDARY START: Class Properties =========
  // @phazzie: These can be regenerated when class structure changes
  // @contract: serviceName must remain a string identifier
  // @dependencies: None

  serviceName = 'Deepgram';
  private config: ProcessorConfig;

  // ========= REGENERATION BOUNDARY END: Class Properties =========

  // ========= REGENERATION BOUNDARY START: Constructor =========
  // @phazzie: Constructor can be regenerated for new configuration needs
  // @contract: Must accept ProcessorConfig and initialize properly
  // @dependencies: ProcessorConfig interface

  constructor(config: ProcessorConfig = {}) {
    this.config = config;
    console.log('@phazzie-checkpoint-deepgram-1: Deepgram processor initialized');

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
    console.log('@phazzie-checkpoint-deepgram-2: Checking Deepgram availability');

    // WHY THIS CHECK:
    // ===============
    // API key is required for Deepgram API calls
    // Without it, the service cannot function
    // This prevents runtime failures

    if (!this.config.apiKey) {
      console.log('@phazzie-checkpoint-deepgram-3: No API key configured');
      return false;
    }

    // WHY NO API CALL:
    // ================
    // Deepgram API doesn't have a health check endpoint
    // We assume it's available if we have an API key
    // Could add actual API ping in future regeneration

    console.log('@phazzie-checkpoint-deepgram-4: Deepgram is available');
    return true;
  }

  // ========= REGENERATION BOUNDARY END: Availability Check =========

  // ========= REGENERATION BOUNDARY START: File Processing =========
  // @phazzie: This is the core method - can be completely regenerated
  // @contract: Must accept File, return Promise<TranscriptionResult>
  // @dependencies: Deepgram API must be accessible

  async processFile(file: File): Promise<TranscriptionResult> {
    console.log('@phazzie-checkpoint-deepgram-5: Starting REAL Deepgram API processing');

    // WHY THIS METHOD:
    // ================
    // This is where the actual Deepgram API integration happens
    // Can be completely rewritten when API changes
    // Must maintain exact return type contract

    try {
      // WHY REAL API IMPLEMENTATION:
      // ============================
      // Using actual Deepgram API for high-accuracy transcription
      // Provides real transcription capabilities
      // Maintains same interface for seamless integration

      if (!this.config.apiKey) {
        throw new Error('DEEPGRAM_API_KEY not configured - add to environment variables');
      }

      console.log('@phazzie-checkpoint-deepgram-6: Converting file to base64');

      // Convert File to ArrayBuffer for API
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // WHY BASE64 APPROACH:
      // ====================
      // Deepgram API accepts base64-encoded audio data
      // More reliable than multipart/form-data for their API
      // Allows for additional processing options

      const base64Audio = btoa(String.fromCharCode(...uint8Array));

      console.log('@phazzie-checkpoint-deepgram-7: Calling Deepgram API');

      const startTime = Date.now();

      const response = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          model: 'nova-2', // Deepgram's most accurate model
          smart_format: true,
          punctuate: true,
          utterances: true,
          language: 'en-US'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deepgram API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      console.log('@phazzie-checkpoint-deepgram-8: Transcription completed successfully');

      // WHY THIS RESPONSE FORMAT:
      // =========================
      // Must match TranscriptionResult interface exactly
      // All fields required by contract must be present
      // Include Deepgram-specific metadata for debugging

      const result: TranscriptionResult = {
        id: `deepgram-${Date.now()}`,
        serviceName: this.serviceName,
        text: data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '',
        confidence: data.results?.channels?.[0]?.alternatives?.[0]?.confidence,
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: 'nova-2',
          language: 'en-US',
          smart_format: true,
          punctuate: true,
          utterances: data.results?.channels?.[0]?.alternatives?.[0]?.utterances || [],
          wordCount: data.results?.channels?.[0]?.alternatives?.[0]?.words?.length || 0
        }
      };

      console.log('@phazzie-checkpoint-deepgram-9: Returning transcription result');
      return result;

    } catch (error) {
      // WHY THIS ERROR HANDLING:
      // ========================
      // Must provide @phazzie-friendly error messages
      // Should guide regeneration when things break
      // Should not expose sensitive information

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('@phazzie-error-deepgram:', errorMessage);
      console.error('DEEPGRAM REGENERATION NEEDED:');
      console.error('1. Check DEEPGRAM_API_KEY environment variable');
      console.error('2. Verify API key has sufficient credits');
      console.error('3. Ensure audio file is valid format');
      console.error('4. Check network connectivity to Deepgram');

      throw new Error(`REGENERATE_NEEDED: Deepgram API integration - ${errorMessage}`);
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
    // Deepgram pricing as of 2025
    // $0.0043 per minute for Nova-2 model
    // Used for billing and cost optimization
    // Must be kept current during regeneration

    return 0.0043; // $0.0043 per minute
  }

  // ========= REGENERATION BOUNDARY END: Cost Reporting =========

  // ========= REGENERATION BOUNDARY START: Format Support =========
  // @phazzie: Supported formats can be updated when Deepgram adds new formats
  // @contract: Must return string array of supported file extensions
  // @dependencies: Deepgram API documentation

  getSupportedFormats(): string[] {
    // WHY THESE FORMATS:
    // ==================
    // Based on Deepgram API documentation
    // Covers most common audio formats
    // Can be updated when Deepgram adds new formats
    // Used for file validation in UI

    return ['.mp3', '.wav', '.m4a', '.webm', '.flac', '.ogg', '.aac', '.wma'];
  }

  // ========= REGENERATION BOUNDARY END: Format Support =========
}

// ========= REGENERATION BOUNDARY END: Deepgram Processor Class =========

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