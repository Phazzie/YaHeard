/**
 * =============================================================================
 * @file processors.ts - AI PROCESSOR CONTRACTS AND INTERFACES
 * =============================================================================
 *
 * WHY THIS FILE EXISTS:
 * =====================
 * This file defines the "plugs" that AI services must fit into. Just like how
 * USB devices all fit the same USB interface, all AI transcription services
 * must implement these exact interfaces to work with our system.
 *
 * @phazzie-status working
 * @last-regenerated 2025-01-29 13:54:37 UTC
 * @dependencies transcription.ts - Uses the core data structures
 *
 * ARCHITECTURAL ROLE:
 * ===================
 * 1. STANDARDIZES AI INTEGRATION: All services implement the same interface
 * 2. ENABLES PLUGGABILITY: New AI services can be added without changing core logic
 * 3. ENSURES CONSISTENCY: All services return the same data format
 * 4. FACILITATES TESTING: Mock services can implement the same interface
 *
 * REGENERATION RULES:
 * ===================
 * ✅ Can be extended when adding new AI services
 * ✅ Can add new methods to interfaces (backward compatible)
 * ✅ Should not break existing implementations
 * ✅ Update when business requirements change
 *
 * THE POWER OF INTERFACES:
 * ========================
 * By defining AudioProcessor as an interface, we get:
 * - Multiple implementations (Whisper, AssemblyAI, Deepgram)
 * - Easy testing with mock implementations
 * - Ability to add new services without changing existing code
 * - Clear contract that implementations must follow
 *
 * EXAMPLE EVOLUTION:
 * ==================
 * 1. Start with WhisperProcessor implementing AudioProcessor
 * 2. Add AssemblyAIProcessor implementing AudioProcessor
 * 3. Add DeepgramProcessor implementing AudioProcessor
 * 4. All work with the same processing pipeline
 * 5. UI and comparison engine don't need changes
 */

import type {
    ConsensusResult,
    Disagreement,
    TranscriptionResult
} from './transcription';

/**
 * =============================================================================
 * AUDIO PROCESSOR - THE MASTER INTERFACE FOR ALL AI SERVICES
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * This is the universal "plug" that all AI transcription services must fit.
 * Any service that implements this interface can be used in our system.
 *
 * WHY THESE METHODS:
 * ==================
 * - serviceName: Identify which service this is
 * - isAvailable(): Check if service is configured and working
 * - processFile(): The core transcription functionality
 * - getCostPerMinute(): Cost tracking for billing
 * - getSupportedFormats(): What file types this service can handle
 *
 * CONTRACT ENFORCEMENT:
 * =====================
 * All implementations MUST:
 * 1. Return a valid TranscriptionResult
 * 2. Handle errors gracefully
 * 3. Provide accurate cost estimates
 * 4. List supported formats accurately
 * 5. Be thread-safe for concurrent processing
 */
export interface AudioProcessor {
  /** Human-readable name of the AI service */
  serviceName: string;

  /** Check if this service is available and configured */
  isAvailable(): Promise<boolean>;

  /** Process an audio file and return transcription result */
  processFile(file: File): Promise<TranscriptionResult>;

  /** Get the cost per minute for this service in USD */
  getCostPerMinute(): number;

  /** Get supported audio formats for this service */
  getSupportedFormats(): string[];
}

/**
 * =============================================================================
 * PROCESSOR CONFIGURATION OPTIONS - TYPED SERVICE SETTINGS
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * Common configuration options that AI services may support.
 * Provides type safety while allowing service-specific customization.
 */
export interface ProcessorOptions {
  /** Language code for transcription (e.g., "en", "es", "fr") */
  language?: string;

  /** Model variant to use (e.g., "whisper-1", "base", "large") */
  model?: string;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Maximum retries on failure */
  maxRetries?: number;

  /** Enable/disable automatic punctuation */
  punctuation?: boolean;

  /** Enable/disable speaker diarization */
  diarization?: boolean;

  /** Custom headers for API requests */
  headers?: Record<string, string>;

  /** Service-specific additional options */
  extra?: Record<string, unknown>;
}

/**
 * =============================================================================
 * PROCESSOR CONFIGURATION - WHAT EACH AI SERVICE NEEDS
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * The configuration needed to initialize any AI transcription service.
 * All processors must accept this standardized configuration.
 *
 * WHY THESE FIELDS:
 * =================
 * - apiKey: Authentication for the service
 * - endpoint: Custom API endpoint (for self-hosted services)
 * - options: Service-specific configuration options
 *
 * CONTRACT ENFORCEMENT:
 * =====================
 * All AI processors MUST accept this configuration format.
 * This ensures interchangeable processors with consistent setup.
 */
export interface ProcessorConfig {
  /** API key for the service */
  apiKey?: string;

  /** API endpoint URL */
  endpoint?: string;

  /** Additional configuration options */
  options?: ProcessorOptions;
}

/**
 * =============================================================================
 * MULTI-PROCESSING RESULT - WHAT HAPPENS WHEN MULTIPLE AI SERVICES RUN
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * The result of processing one audio file through multiple AI services
 * simultaneously. This is the raw data before consensus calculation.
 *
 * WHY THESE FIELDS:
 * =================
 * - results: Successful transcription results
 * - failedServices: Services that couldn't process the file
 * - success: Overall success status
 * - totalProcessingTimeMs: Performance tracking
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * By separating multi-processing from consensus, we can:
 * 1. Run services in parallel for speed
 * 2. Handle partial failures gracefully
 * 3. Provide detailed error reporting
 * 4. Optimize which services to use
 */
export interface MultiProcessingResult {
  /** Results from each AI service that succeeded */
  results: TranscriptionResult[];

  /** Services that failed to process the file */
  failedServices: FailedService[];

  /** Whether the overall process was successful */
  success: boolean;

  /** Total processing time across all services */
  totalProcessingTimeMs: number;
}

/**
 * =============================================================================
 * FAILED SERVICE - TRACKING WHEN AI SERVICES FAIL
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * Information about an AI service that failed to process a file.
 * This helps with debugging and service reliability tracking.
 *
 * WHY THESE FIELDS:
 * =================
 * - serviceName: Which service failed
 * - error: What went wrong
 * - timestamp: When the failure occurred
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * Tracking failures helps us:
 * 1. Identify unreliable services
 * 2. Provide better error messages to users
 * 3. Implement fallback strategies
 * 4. Monitor service health
 */
export interface FailedService {
  /** Name of the service that failed */
  serviceName: string;

  /** Error message describing what went wrong */
  error: string;

  /** When the failure occurred */
  timestamp: Date;
}

/**
 * =============================================================================
 * COMPARISON ENGINE - TURNING MULTIPLE RESULTS INTO CONSENSUS
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * The algorithm that takes multiple AI transcriptions and produces
 * a single, high-quality consensus transcription.
 *
 * WHY THIS INTERFACE:
 * ===================
 * - compareTranscriptions(): The main consensus algorithm
 * - calculateConsensusConfidence(): Quality scoring
 * - findDisagreements(): Identify conflicts for review
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * By making this an interface, we can:
 * 1. Experiment with different consensus algorithms
 * 2. A/B test different approaches
 * 3. Optimize for different use cases
 * 4. Upgrade algorithms without breaking the system
 */
export interface ComparisonEngine {
  /** Compare multiple transcription results and generate consensus */
  compareTranscriptions(results: TranscriptionResult[]): ConsensusResult;

  /** Calculate confidence score for consensus text */
  calculateConsensusConfidence(results: TranscriptionResult[]): number;

  /** Identify disagreements between services */
  findDisagreements(results: TranscriptionResult[]): Disagreement[];
}

/**
 * =============================================================================
 * TYPE RE-EXPORTS - MAKING CONTRACTS EASILY ACCESSIBLE
 * =============================================================================
 *
 * WHY RE-EXPORT:
 * ==============
 * These types are used throughout the system, so we re-export them here
 * to make imports cleaner and more logical.
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * - Single import point for processor-related types
 * - Clear separation between core types and processor types
 * - Easier refactoring if we reorganize files
 */

// Re-export core types for convenience
export type {
    ConsensusResult, ConsensusStats, Disagreement, TranscriptionResult
} from './transcription';

/**
 * =============================================================================
 * CONTRACT COMPLIANCE GUARANTEES
 * =============================================================================
 *
 * By implementing these interfaces, AI services guarantee:
 * 1. CONSISTENT OUTPUT: All services return TranscriptionResult format
 * 2. RELIABLE OPERATION: Proper error handling and availability checking
 * 3. COST TRANSPARENCY: Accurate cost reporting for billing
 * 4. FORMAT COMPATIBILITY: Clear statement of supported file types
 *
 * This contract-driven approach ensures:
 * - New AI services can be added without system changes
 * - Existing services can be upgraded independently
 * - The comparison engine works with any compliant service
 * - Users get consistent experience regardless of AI backend
 */
