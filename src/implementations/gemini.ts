/**
 * =============================================================================
 * @file gemini.ts - GOOGLE GEMINI AI PROCESSOR IMPLEMENTATION
 * =============================================================================
 *
 * WHY THIS FILE EXISTS:
 * =====================
 * This file implements the AudioProcessor interface for Google's Gemini model.
 * Gemini 2.5 Flash provides multimodal AI capabilities including audio transcription.
 * This implementation can be completely regenerated when Gemini's API changes without affecting other parts of the system.
 *
 * @phazzie-status working
 * @last-regenerated 2025-09-01 - NEW: Gemini integration for 5-AI system
 * @dependencies processors.ts contract - Implements AudioProcessor interface
 *
 * ARCHITECTURAL ROLE:
 * ===================
 * 1. GEMINI INTEGRATION: Connects to Google's Gemini 2.5 Flash API
 * 2. CONTRACT COMPLIANCE: Implements AudioProcessor interface exactly
 * 3. ERROR HANDLING: Graceful failure with @phazzie-friendly messages
 * 4. COST TRACKING: Reports accurate pricing for billing
 *
 * REGENERATION RULES:
 * ===================
 * ✅ COMPLETE REGENERATION ALLOWED: This entire file can be rewritten
 * ✅ CONTRACT MUST BE MAINTAINED: Must still implement AudioProcessor
 * ✅ API CHANGES: Regenerate when Gemini API updates
 * ✅ NEW FEATURES: Regenerate when adding Gemini-specific features
 *
 * GEMINI-SPECIFIC IMPLEMENTATION NOTES:
 * =====================================
 * - Uses Google AI Studio API endpoint
 * - Requires base64 audio encoding for multimodal processing
 * - API key passed as query parameter (not header)
 * - Response structure: candidates[0].content.parts[0].text
 * - Pricing: ~$0.0018 per minute of audio
 *
 * =============================================================================
 *
 * WHAT THIS CLASS DOES:
 * =====================
 * Implements the AudioProcessor interface specifically for Google Gemini 2.5 Flash.
 * This class can be completely rewritten while maintaining the same interface.
 *
 * WHY THIS ARCHITECTURE:
 * ======================
 * By implementing an interface, we get:
 * - Pluggable AI services (can swap Gemini for another service)
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

// ========= REGENERATION BOUNDARY START: Gemini Processor Class =========
// @phazzie: This entire class can be regenerated independently
// @contract: Must implement AudioProcessor interface exactly
// @dependencies: AudioProcessor interface must remain stable

export class GeminiProcessor implements AudioProcessor {
  // ========= REGENERATION BOUNDARY START: Class Properties =========
  // @phazzie: These can be regenerated when class structure changes
  // @contract: serviceName must remain a string identifier
  // @dependencies: None

  serviceName = 'Google Gemini';
  private config: ProcessorConfig;

  // ========= REGENERATION BOUNDARY END: Class Properties =========

  // ========= REGENERATION BOUNDARY START: Constructor =========
  // @phazzie: Constructor can be regenerated for new configuration needs
  // @contract: Must accept ProcessorConfig and initialize properly
  // @dependencies: ProcessorConfig interface

  constructor(config: ProcessorConfig = {}) {
    this.config = config;
    console.log('@phazzie-checkpoint-gemini-1: Gemini processor initialized');

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
    console.log('@phazzie-checkpoint-gemini-2: Checking Gemini availability');

    // WHY THIS CHECK:
    // ===============
    // API key is required for Gemini API calls
    // Without it, the service cannot function
    // This prevents runtime failures

    if (!this.config.apiKey) {
      console.log('@phazzie-checkpoint-gemini-3: No API key configured');
      return false;
    }

    // WHY NO API CALL:
    // ================
    // Gemini API doesn't have a dedicated health check endpoint
    // We assume it's available if we have an API key
    // Could add actual API ping in future regeneration

    console.log('@phazzie-checkpoint-gemini-4: Gemini is available');
    return true;
  }

  // ========= REGENERATION BOUNDARY END: Availability Check =========

  // ========= REGENERATION BOUNDARY START: File Processing =========
  // @phazzie: This is the core method - can be completely regenerated
  // @contract: Must accept File and return TranscriptionResult
  // @dependencies: TranscriptionResult interface

  async processFile(file: File): Promise<TranscriptionResult> {
    console.log('@phazzie-checkpoint-gemini-5: Starting REAL Gemini API processing');

    // WHY THIS METHOD:
    // ================
    // This is where the actual Gemini API integration happens
    // Can be completely rewritten when API changes
    // Must maintain exact return type contract

    try {
      // WHY REAL API IMPLEMENTATION:
      // ============================
      // Using actual Google Gemini API for multimodal transcription
      // Provides industry-leading multimodal AI capabilities
      // Maintains same interface for seamless integration

      if (!this.config.apiKey) {
        throw new Error('GEMINI_API_KEY not configured - add to environment variables');
      }

      console.log('@phazzie-checkpoint-gemini-6: Converting file to base64');

      // Convert File to base64 for Gemini API (multimodal requirement)
      // Use chunked processing to handle large audio files efficiently
      const arrayBuffer = await file.arrayBuffer();
      const base64Audio = await this.arrayBufferToBase64(arrayBuffer);

      // WHY BASE64 APPROACH:
      // ====================
      // Gemini multimodal API requires inline data encoding
      // Audio must be embedded as base64 in the request
      // Different from other APIs that use form-data

      console.log('@phazzie-checkpoint-gemini-7: Preparing Gemini API request');

      const requestBody = {
        contents: [{
          parts: [
            {
              text: "Please transcribe this audio file. Provide only the transcribed text without any additional commentary or formatting."
            },
            {
              inlineData: {
                mimeType: file.type || 'audio/wav',
                data: base64Audio
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent transcription
          topK: 1,
          topP: 1.0,
          maxOutputTokens: 2048,
        }
      };

      console.log('@phazzie-checkpoint-gemini-8: Calling Gemini API');

      const startTime = Date.now();

      // WHY QUERY PARAMETER AUTH:
      // =========================
      // Gemini API uses query parameter for API key
      // Different from header-based auth in other services
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      console.log('@phazzie-checkpoint-gemini-9: Gemini API response received');

      // WHY NESTED RESPONSE PARSING:
      // =============================
      // Gemini returns nested structure: candidates[0].content.parts[0].text
      // Need to safely navigate this structure
      // Handle cases where structure might be different

      let transcribedText = '';
      let confidence = 0.85; // Gemini doesn't provide confidence, use reasonable default

      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        transcribedText = data.candidates[0].content.parts[0].text || '';
        
        // WHY CONFIDENCE ESTIMATION:
        // ==========================
        // Gemini doesn't provide explicit confidence scores
        // We estimate based on response completeness and length
        // Longer responses generally indicate better processing
        if (transcribedText.length > 50) {
          confidence = 0.90;
        } else if (transcribedText.length > 10) {
          confidence = 0.85;
        } else {
          confidence = 0.70;
        }
      } else {
        console.warn('@phazzie-warning: Unexpected Gemini response structure');
        throw new Error('Gemini returned unexpected response structure');
      }

      // WHY RESULT CONSTRUCTION:
      // ========================
      // Must match TranscriptionResult interface exactly
      // All processors return the same structure for consensus
      // Timestamp and metadata help with debugging and analysis

      const result: TranscriptionResult = {
        id: `gemini-${Date.now()}`,
        serviceName: this.serviceName,
        text: transcribedText.trim(),
        confidence: confidence,
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: 'gemini-2.0-flash-exp',
          apiVersion: 'v1beta',
          temperature: 0.1,
          estimatedCostUSD: this.calculateCost(processingTime)
        }
      };

      console.log(`@phazzie-checkpoint-gemini-10: Gemini processing completed in ${processingTime}ms`);
      console.log(`@phazzie-checkpoint-gemini-11: Transcribed ${transcribedText.length} characters with ${(confidence * 100).toFixed(1)}% confidence`);

      return result;

    } catch (error) {
      console.error('@phazzie-error: Gemini processing failed:', error);
      
      // WHY ERROR HANDLING:
      // ===================
      // Network issues, API failures, or invalid responses can occur
      // We re-throw with service context for debugging
      // Upper layers will handle graceful degradation
      
      throw new Error(`Gemini transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ========= REGENERATION BOUNDARY END: File Processing =========

  // ========= REGENERATION BOUNDARY START: Cost Calculation =========
  // @phazzie: Cost calculation can be regenerated when pricing changes
  // @contract: Must return number (cost in USD)
  // @dependencies: None

  getCostPerMinute(): number {
    // WHY THIS COST:
    // ==============
    // Gemini pricing is approximately $0.0018 per minute of audio
    // This is competitive with other premium transcription services
    // Prices may change - regenerate when Google updates pricing
    
    return 0.0018;
  }

  private calculateCost(processingTimeMs: number): number {
    // WHY COST CALCULATION:
    // =====================
    // Estimate cost based on processing time
    // Assume processing time correlates with audio length
    // Provide transparency for usage tracking
    
    const minutes = processingTimeMs / (1000 * 60);
    return minutes * this.getCostPerMinute();
  }

  // ========= REGENERATION BOUNDARY END: Cost Calculation =========

  // ========= REGENERATION BOUNDARY START: Base64 Helper =========
  // @phazzie: Helper method for robust base64 encoding of large audio files
  // @contract: Must handle large ArrayBuffers efficiently
  // @dependencies: None

  private async arrayBufferToBase64(arrayBuffer: ArrayBuffer): Promise<string> {
    // WHY THIS IMPLEMENTATION:
    // ========================
    // btoa() with String.fromCharCode(...array) fails for large files
    // FileReader approach handles large audio files efficiently
    // Avoids memory issues with spread operator on large arrays
    
    return new Promise<string>((resolve, reject) => {
      const blob = new Blob([arrayBuffer]);
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data:application/octet-stream;base64, prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert ArrayBuffer to base64'));
        }
      };
      
      reader.onerror = () => reject(new Error('FileReader error during base64 conversion'));
      reader.readAsDataURL(blob);
    });
  }

  // ========= REGENERATION BOUNDARY END: Base64 Helper =========

  // ========= REGENERATION BOUNDARY START: Format Support =========
  // @phazzie: Supported formats can be regenerated when capabilities change
  // @contract: Must return string array of supported formats
  // @dependencies: None

  getSupportedFormats(): string[] {
    // WHY THESE FORMATS:
    // ==================
    // Gemini supports most common audio formats through multimodal processing
    // Base64 encoding allows format flexibility
    // May support additional formats in future API versions
    
    return [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/m4a',
      'audio/ogg',
      'audio/webm',
      'audio/flac'
    ];
  }

  // ========= REGENERATION BOUNDARY END: Format Support =========
}

// ========= REGENERATION BOUNDARY END: Gemini Processor Class =========
