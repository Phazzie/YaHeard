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
 * WHY 60MB LIMIT:
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
export const MAX_FILE_SIZE_BYTES = 60 * 1024 * 1024; // 60MB

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

  /** Confidence score from 0.0 (not confident) to 1.0 (very confident). Can be undefined if the service does not provide it. */
  confidence?: number;

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
 * - reasoning: AI thought process and decision-making logic
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * By including individualResults and reasoning, users can see:
 * 1. Which AI services were used
 * 2. How each performed
 * 3. Where they disagreed
 * 4. Why the consensus was chosen
 * 5. Step-by-step reasoning process
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

  /** AI reasoning and thought process */
  reasoning: AIReasoning;
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
 * AI REASONING - CAPTURING THE THOUGHT PROCESS
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * The step-by-step reasoning process used by the AI consensus engine
 * to arrive at the final transcription result.
 *
 * WHY THESE FIELDS:
 * =================
 * - steps: Sequential reasoning steps taken during consensus
 * - decisionFactors: What factors influenced the final decision
 * - conflictResolution: How disagreements were resolved
 * - qualityAssessment: Quality evaluation of each service
 * - finalReasoning: Summary of why this consensus was chosen
 *
 * VALIDATION CONSTRAINTS:
 * =======================
 * - steps.length: 1-100 steps (prevent memory issues)
 * - decisionFactors: weights must sum to ≤ 1.0
 * - qualityAssessment: scores must be 0.0-1.0
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * This provides transparency into:
 * 1. How the AI makes decisions
 * 2. Why certain results were preferred
 * 3. What logic drives consensus building
 * 4. How conflicts are resolved
 */
export interface AIReasoning {
  /** Sequential steps in the reasoning process */
  steps: ReasoningStep[];

  /** Factors that influenced the final decision */
  decisionFactors: DecisionFactor[];

  /** How conflicts between services were resolved */
  conflictResolution: ConflictResolution[];

  /** Quality assessment of each AI service */
  qualityAssessment: ServiceQualityAssessment[];

  /** Final reasoning summary */
  finalReasoning: string;
}

/**
 * =============================================================================
 * REASONING STEP - INDIVIDUAL THOUGHT PROCESS STEP
 * =============================================================================
 */
export interface ReasoningStep {
  /** Step number in the process */
  stepNumber: number;

  /** Description of what happened in this step */
  description: string;

  /** Type of reasoning applied */
  type: 'analysis' | 'comparison' | 'weighting' | 'decision' | 'validation';

  /** Data or results from this step */
  data?: Record<string, any>;

  /** Timestamp when this step completed */
  timestamp: Date;
}

/**
 * =============================================================================
 * DECISION FACTOR - WHAT INFLUENCED THE CHOICE
 * =============================================================================
 */
export interface DecisionFactor {
  /** Name of the factor */
  factor: string;

  /** Weight/importance of this factor (0.0 to 1.0) */
  weight: number;

  /** How this factor influenced the decision */
  impact: string;

  /** Which services this factor favored */
  favoredServices: string[];
}

/**
 * =============================================================================
 * CONFLICT RESOLUTION - HOW DISAGREEMENTS WERE HANDLED
 * =============================================================================
 */
export interface ConflictResolution {
  /** Services that disagreed */
  conflictingServices: string[];

  /** What they disagreed about */
  conflictDescription: string;

  /** How the conflict was resolved */
  resolutionMethod: string;

  /** Which result was chosen and why */
  chosenResult: string;

  /** Confidence in the resolution (0.0 to 1.0) */
  resolutionConfidence: number;
}

/**
 * =============================================================================
 * SERVICE QUALITY ASSESSMENT - AI SERVICE PERFORMANCE EVALUATION
 * =============================================================================
 */
export interface ServiceQualityAssessment {
  /** Name of the AI service */
  serviceName: string;

  /** Overall quality score (0.0 to 1.0) */
  qualityScore: number;

  /** Specific strengths of this service */
  strengths: string[];

  /** Areas where this service struggled */
  weaknesses: string[];

  /** Recommendation for future use */
  recommendation: 'preferred' | 'acceptable' | 'avoid';

  /** Detailed analysis notes */
  analysisNotes: string;
}

/**
 * =============================================================================
 * CONTRACT COMPLIANCE GUARANTEES & RUNTIME VALIDATION
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

/**
 * =============================================================================
 * USAGE EXAMPLES & IMPLEMENTATION PATTERNS
 * =============================================================================
 */

/**
 * @example Creating a TranscriptionResult from an AI service
 * ```typescript
 * const whisperResult: TranscriptionResult = {
 *   id: crypto.randomUUID(),
 *   serviceName: 'Whisper',
 *   text: 'Hello, this is a transcription.',
 *   confidence: 0.95,
 *   processingTimeMs: 1250,
 *   timestamp: new Date(),
 *   metadata: {
 *     model: 'whisper-1',
 *     language: 'en',
 *     duration: 5.2
 *   }
 * };
 * ```
 */

/**
 * @example Creating AI reasoning for a consensus decision
 * ```typescript
 * const reasoning: AIReasoning = {
 *   steps: [
 *     {
 *       stepNumber: 1,
 *       description: 'Analyzed 3 transcription results',
 *       type: 'analysis',
 *       data: { resultCount: 3, averageConfidence: 0.87 },
 *       timestamp: new Date()
 *     }
 *   ],
 *   decisionFactors: [
 *     {
 *       factor: 'Confidence Score',
 *       weight: 0.7,
 *       impact: 'Selected highest confidence result',
 *       favoredServices: ['Whisper']
 *     }
 *   ],
 *   conflictResolution: [],
 *   qualityAssessment: [
 *     {
 *       serviceName: 'Whisper',
 *       qualityScore: 0.95,
 *       strengths: ['High confidence', 'Fast processing'],
 *       weaknesses: [],
 *       recommendation: 'preferred',
 *       analysisNotes: 'Excellent performance with clear audio'
 *     }
 *   ],
 *   finalReasoning: 'Selected Whisper result based on superior confidence and quality.'
 * };
 * ```
 */

/**
 * @example Validating data before processing
 * ```typescript
 * import { validateTranscriptionResult, validateConsensusResult } from './transcription.js';
 * 
 * // Validate individual result
 * if (!validateTranscriptionResult(result)) {
 *   throw new Error('Invalid transcription result');
 * }
 * 
 * // Validate consensus before returning
 * if (!validateConsensusResult(consensusData)) {
 *   throw new Error('Invalid consensus result');
 * }
 * ```
 */

/**
 * @example Handling different confidence thresholds
 * ```typescript
 * import { CONSENSUS_CONFIG } from '../lib/config.js';
 * 
 * const classifyResult = (result: TranscriptionResult) => {
 *   if (result.confidence >= CONSENSUS_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
 *     return 'high_confidence';
 *   } else if (result.confidence >= CONSENSUS_CONFIG.ACCEPTABLE_CONFIDENCE_THRESHOLD) {
 *     return 'acceptable';
 *   } else {
 *     return 'low_confidence';
 *   }
 * };
 * ```
 */

// ========= RUNTIME VALIDATION UTILITIES =========

/**
 * Validate a TranscriptionResult object
 */
export function validateTranscriptionResult(result: unknown): result is TranscriptionResult {
  if (!result || typeof result !== 'object') return false;
  
  const r = result as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.serviceName === 'string' &&
    typeof r.text === 'string' &&
    typeof r.confidence === 'number' &&
    r.confidence >= 0 && r.confidence <= 1 &&
    typeof r.processingTimeMs === 'number' &&
    r.processingTimeMs >= 0 &&
    r.timestamp instanceof Date
  );
}

/**
 * Validate a ConsensusResult object
 */
export function validateConsensusResult(result: unknown): result is ConsensusResult {
  if (!result || typeof result !== 'object') return false;
  
  const r = result as Record<string, unknown>;
  return (
    typeof r.finalText === 'string' &&
    typeof r.consensusConfidence === 'number' &&
    r.consensusConfidence >= 0 && r.consensusConfidence <= 1 &&
    Array.isArray(r.individualResults) &&
    Array.isArray(r.disagreements) &&
    typeof r.stats === 'object' &&
    typeof r.reasoning === 'object'
  );
}

/**
 * Validate AI reasoning structure
 */
export function validateAIReasoning(reasoning: unknown): reasoning is AIReasoning {
  if (!reasoning || typeof reasoning !== 'object') return false;
  
  const r = reasoning as Record<string, unknown>;
  return (
    Array.isArray(r.steps) &&
    r.steps.length <= 100 && // Prevent memory issues
    Array.isArray(r.decisionFactors) &&
    Array.isArray(r.conflictResolution) &&
    Array.isArray(r.qualityAssessment) &&
    typeof r.finalReasoning === 'string'
  );
}

/**
 * Validate decision factors weights sum
 */
export function validateDecisionFactorWeights(factors: DecisionFactor[]): boolean {
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  return totalWeight <= 1.01; // Allow small floating point errors
}

/**
 * Validate quality score is within bounds
 */
export function validateQualityScore(score: number): boolean {
  return typeof score === 'number' && score >= 0 && score <= 1;
}
