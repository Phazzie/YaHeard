/**
 * =============================================================================
 * @file transcription.ts - CORE CONTRACTS FOR TRANSCRIPTION PROCESSING
 * =============================================================================
 *
 * WHY THIS FILE EXISTS:
 * =====================
 * This file defines the immutable "language" of our transcription system.
 * Think of it as the constitution - it establishes the rules that everything
 * else must follow. These contracts ensure that all AI services, UI components,
 * and processing logic speak the same "language" of data structures.
 *
 * @phazzie-status working
 * @last-regenerated 2025-01-29 13:54:37 UTC
 * @dependencies NONE - This is the foundation that everything else depends on
 *
 * ARCHITECTURAL ROLE:
 * ===================
 * 1. DEFINES DATA STRUCTURES: What information flows through the system
 * 2. ESTABLISHES STANDARDS: Common format for all transcription results
 * 3. ENABLES INTEROPERABILITY: All AI services must output these formats
 * 4. PREVENTS DRIFT: Contracts keep implementations aligned
 *
 * REGENERATION RULES:
 * ===================
 * ❌ NEVER regenerate this file casually
 * ✅ Only update when business requirements change
 * ✅ All implementations must be updated to match new contracts
 * ✅ Update must be coordinated across entire codebase
 *
 * CONTRACT-DRIVEN DEVELOPMENT:
 * ============================
 * This file embodies the core principle: "Define what you want before how you do it"
 * By establishing these contracts first, we ensure that:
 * - AI implementations can be swapped without breaking the UI
 * - UI components can be redesigned without breaking the backend
 * - Processing logic can be optimized without breaking contracts
 *
 * EXAMPLE WORKFLOW:
 * ================
 * 1. Business needs new field (e.g., "speaker_diarization")
 * 2. Add it to TranscriptionResult interface
 * 3. Update all AI implementations to provide this field
 * 4. Update UI to display this field
 * 5. Update comparison engine to use this field
 *
 * This ensures consistency across the entire system.
 */

/**
 * =============================================================================
 * SUPPORTED AUDIO FORMATS - WHAT FILES CAN WE PROCESS?
 * =============================================================================
 *
 * WHY THESE FORMATS:
 * ==================
 * - MP3: Most common, good compression ratio
 * - WAV: Uncompressed, highest quality
 * - M4A: Modern format, good compression
 * - WebM: Web-native, browser compatible
 * - FLAC: Lossless compression for high quality
 * - OGG: Open format, good compression
 *
 * ARCHITECTURAL DECISION:
 * =======================
 * We define this at the contract level because:
 * 1. All AI services must support these formats
 * 2. UI validation depends on this list
 * 3. File size calculations use this
 * 4. Changing formats requires coordinated updates
 */
export const SUPPORTED_AUDIO_FORMATS = [
  '.mp3',
  '.wav',
  '.m4a',
  '.webm',
  '.flac',
  '.ogg'
] as const;

export type AudioFormat = typeof SUPPORTED_AUDIO_FORMATS[number];

/**
 * =============================================================================
 * MAXIMUM FILE SIZE LIMIT - PREVENTING ABUSE
 * =============================================================================
 *
 * WHY 10MB LIMIT:
 * ===============
 * - Balances user needs with server costs
 * - Prevents abuse of free tier services
 * - Keeps processing times reasonable
 * - Allows for Vercel serverless limits
 *
 * ARCHITECTURAL DECISION:
 * =======================
 * Defined as constant because:
 * 1. Used in multiple places (validation, UI, API)
 * 2. Changing requires testing across all components
 * 3. Business decision that affects pricing
 */
export const MAX_FILE_SIZE_BYTES = 60 \* 1024 \* 1024; // 10MB

/**
 * =============================================================================
 * TRANSCRIPTION RESULT - THE CORE DATA STRUCTURE
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * This is the standardized output from ANY AI transcription service.
 * Whether it's Whisper, AssemblyAI, or a future service, they ALL must
 * return data in this exact format.
 *
 * WHY THESE FIELDS:
 * =================
 * - id: Unique identifier for tracking and debugging
 * - serviceName: Which AI service produced this result
 * - text: The actual transcription (most important field)
 * - confidence: How sure the AI is (0.0 to 1.0)
 * - processingTimeMs: Performance tracking
 * - timestamp: When processing completed
 * - error: Any problems encountered
 * - metadata: Service-specific additional data
 *
 * CONTRACT ENFORCEMENT:
 * =====================
 * All AI implementations MUST return this exact interface.
 * This ensures the comparison engine can process any service's output.
 */
export interface TranscriptionResult {
  /** Unique identifier for this transcription result */
  id: string;

  /** Name of the AI service that generated this transcription */
  serviceName: string;

  /** The actual transcribed text - the most important field */
  text: string;

  /** Confidence score from 0.0 (not confident) to 1.0 (very confident) */
  confidence: number;

  /** How long the AI service took to process this file in milliseconds */
  processingTimeMs: number;

  /** When the transcription was completed */
  timestamp: Date;

  /** Any errors encountered during processing */
  error?: string;

  /** Additional metadata specific to the AI service */
  metadata?: Record<string, any>;
}

/**
 * =============================================================================
 * CONSENSUS RESULT - COMBINING MULTIPLE AI RESULTS
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * The final output after comparing multiple AI transcriptions.
 * This is what the user sees as the "best" transcription.
 *
 * WHY THESE FIELDS:
 * =================
 * - finalText: The consensus transcription text
 * - consensusConfidence: Overall confidence in the consensus
 * - individualResults: All the AI results used for comparison
 * - disagreements: Where AIs disagreed (for manual review)
 * - stats: Performance and quality metrics
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * By including individualResults, users can see:
 * 1. Which AI services were used
 * 2. How each performed
 * 3. Where they disagreed
 * 4. Why the consensus was chosen
 */
export interface ConsensusResult {
  /** The final consensus transcription text */
  finalText: string;

  /** Overall confidence in the consensus (0.0 to 1.0) */
  consensusConfidence: number;

  /** Individual transcription results used for consensus */
  individualResults: TranscriptionResult[];

  /** Words/phrases where services disagreed */
  disagreements: Disagreement[];

  /** Processing statistics */
  stats: ConsensusStats;
}

/**
 * =============================================================================
 * DISAGREEMENT - WHERE AI SERVICES DIFFER
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * Places where different AI services produced different transcriptions.
 * These are opportunities for manual review or algorithm improvement.
 *
 * WHY THESE FIELDS:
 * =================
 * - position: Where in the text the disagreement occurs
 * - serviceTexts: What each service said at this position
 * - severity: How significant the disagreement is
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * Tracking disagreements helps us:
 * 1. Improve the consensus algorithm
 * 2. Identify which AI services are most reliable
 * 3. Provide transparency to users
 * 4. Guide manual review processes
 */
export interface Disagreement {
  /** Position in the transcription where disagreement occurs */
  position: number;

  /** Text from each service at this position */
  serviceTexts: Record<string, string>;

  /** Severity of the disagreement (0.0 to 1.0) */
  severity: number;
}

/**
 * =============================================================================
 * CONSENSUS STATISTICS - PERFORMANCE AND QUALITY METRICS
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * Quantitative measures of the consensus process performance and quality.
 *
 * WHY THESE FIELDS:
 * =================
 * - totalProcessingTimeMs: How long all services took together
 * - servicesUsed: How many AI services contributed
 * - averageConfidence: Average confidence across all services
 * - disagreementCount: How many disagreements were found
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * These metrics help us:
 * 1. Optimize performance (which services are fastest?)
 * 2. Improve quality (which services are most accurate?)
 * 3. Cost optimization (which services give best value?)
 * 4. User experience (show progress and quality indicators)
 */
export interface ConsensusStats {
  /** Total processing time across all services in milliseconds */
  totalProcessingTimeMs: number;

  /** Number of AI services that contributed to the consensus */
  servicesUsed: number;

  /** Average confidence score across all services */
  averageConfidence: number;

  /** Number of disagreements found between services */
  disagreementCount: number;
}

/**
 * =============================================================================
 * CONTRACT COMPLIANCE GUARANTEES
 * =============================================================================
 *
 * By importing and using these interfaces, all parts of the system agree to:
 * 1. Use these exact data structures for communication
 * 2. Maintain backward compatibility when updating
 * 3. Validate data against these contracts
 * 4. Handle all defined fields appropriately
 *
 * This contract-driven approach ensures that:
 * - The system can evolve piece by piece
 * - Components can be regenerated independently
 * - Integration is seamless and reliable
 * - The user experience remains consistent
 */
