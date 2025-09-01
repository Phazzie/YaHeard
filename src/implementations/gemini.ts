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
    console.log('@phazzie-checkpoint-gemini-5: Starting REAL Gemini API processing with Files API');
    if (!this.config.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    let uploadedFileUri: string | undefined;
    const startTime = Date.now();

    try {
      // Step 1: Upload the file to the Files API
      console.log('@phazzie-checkpoint-gemini-6: Uploading file to Google Files API');
      const uploadResult = await this._uploadFile(file);
      const fileUri = uploadResult.file.uri;
      uploadedFileUri = uploadResult.file.name; // The 'name' is the resource identifier, e.g., "files/12345"
      console.log(`@phazzie-checkpoint-gemini-7: File uploaded successfully. URI: ${fileUri}`);

      // Step 2: Make the generateContent request using the file URI
      const requestBody = {
        contents: [{
          parts: [
            { text: "Please transcribe this audio file. Provide only the transcribed text without any additional commentary or formatting." },
            { fileData: { mimeType: file.type || 'audio/wav', fileUri: fileUri } }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1.0,
          maxOutputTokens: 2048,
        }
      };

      console.log('@phazzie-checkpoint-gemini-8: Calling Gemini API with file reference');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      console.log('@phazzie-checkpoint-gemini-9: Gemini API response received');

      let transcribedText = '';
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        transcribedText = data.candidates[0].content.parts[0].text;
      } else {
        console.warn('@phazzie-warning: Unexpected Gemini response structure', data);
        throw new Error('Gemini returned unexpected response structure');
      }

      const result: TranscriptionResult = {
        id: `gemini-${Date.now()}`,
        serviceName: this.serviceName,
        text: transcribedText.trim(),
        confidence: undefined,
        processingTimeMs: processingTime,
        timestamp: new Date(),
        metadata: {
          model: 'gemini-2.0-flash-exp',
          apiVersion: 'v1beta',
          fileApiUsed: true,
          estimatedCostUSD: this.calculateCost(processingTime)
        }
      };

      console.log(`@phazzie-checkpoint-gemini-10: Gemini processing completed in ${processingTime}ms`);
      return result;

    } catch (error) {
      console.error('@phazzie-error: Gemini processing failed:', error);
      throw new Error(`Gemini transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Step 3: Delete the file from the Files API
      if (uploadedFileUri) {
        await this._deleteFile(uploadedFileUri);
      }
    }
  }

  private async _uploadFile(file: File): Promise<{ file: { name: string; uri: string; mimeType: string } }> {
    if (!this.config.apiKey) throw new Error("API key is missing for Gemini file upload.");

    const uploadUrl = `https://generativelanguage.googleapis.com/v1beta/uploads?key=${this.config.apiKey}`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        // The display name is sent via a different header for the uploads API
        'x-goog-request-params': `file.display_name=${encodeURIComponent(file.name)}`,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Gemini file upload failed: ${uploadResponse.status} ${errorText}`);
    }
    const responseJson = await uploadResponse.json();
    // The 'uri' in the response is the publicly servable URI, but the 'name' is the resource identifier for API calls.
    if (!responseJson.file?.name) {
        throw new Error('Gemini file upload did not return a file resource name.');
    }
    // We need to construct the full URI for the fileData part of the next request.
    // The actual URI is not returned directly in a usable format for the next step, but the `name` field is the identifier.
    // The `fileUri` in the `generateContent` call should be the `name` from the upload response.
    responseJson.file.uri = `https://generativelanguage.googleapis.com/v1beta/${responseJson.file.name}`;
    return responseJson;
  }

  private async _deleteFile(fileName: string): Promise<void> {
    console.log(`@phazzie-checkpoint-gemini-11: Deleting temporary file ${fileName} from Google`);
    if (!this.config.apiKey) {
      console.warn("API key is missing for Gemini file deletion. Skipping.");
      return;
    }

    // The fileName is the resource identifier like 'files/12345'
    const deleteUrl = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${this.config.apiKey}`;
    try {
      const response = await fetch(deleteUrl, { method: 'DELETE' });
      if (!response.ok) {
        const errorText = await response.text();
        // Don't throw an error, just warn, as failing to delete shouldn't fail the whole transcription.
        console.warn(`Failed to delete Gemini file ${fileName}: ${response.status} ${errorText}`);
      } else {
        console.log(`@phazzie-checkpoint-gemini-12: Successfully deleted temporary file ${fileName}`);
      }
    } catch (error) {
      console.warn(`Error during Gemini file deletion for ${fileName}:`, error);
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
    
    return ['.wav', '.mp3', '.m4a', '.ogg', '.webm', '.flac'];
  }

  // ========= REGENERATION BOUNDARY END: Format Support =========
}

// ========= REGENERATION BOUNDARY END: Gemini Processor Class =========
