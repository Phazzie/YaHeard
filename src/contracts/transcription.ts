/**
 * This file defines the core data structures for the transcription system.
 * These interfaces act as a contract for all parts of the application.
 */

/**
 * A read-only array of supported audio formats.
 * Defined at the contract level to ensure UI and all processors adhere to the same list.
 */
export const SUPPORTED_AUDIO_FORMATS = [
  '.mp3', '.wav', '.m4a', '.webm', '.flac', '.ogg'
] as const;

export type AudioFormat = typeof SUPPORTED_AUDIO_FORMATS[number];

/**
 * Maximum file size for uploads, in bytes.
 * This is based on typical serverless function payload limits.
 */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * The result of a single API connection test.
 */
export interface ApiTestResult {
  serviceName: string;
  success: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Defines the contract for any transcription service processor.
 */
export interface TranscriptionService {
  serviceName: string;
  isConfigured: boolean;
  process: (audio: Buffer) => Promise<TranscriptionResult>;
  testConnection: () => Promise<ApiTestResult>;
}

/**
 * The standardized output from ANY AI transcription service.
 * All processors must return data in this format.
 */
export interface TranscriptionResult {
  id: string;
  serviceName: string;
  text: string;
  /** Confidence score from 0.0 (low) to 1.0 (high). Optional. */
  confidence?: number;
  processingTimeMs: number;
  timestamp: Date;
  /** Any errors encountered during processing. */
  error?: string;
  /** Additional metadata specific to the AI service. */
  metadata?: Record<string, unknown>;
}

/**
 * The final output after comparing multiple AI transcriptions.
 * This is the primary data structure for the UI.
 */
export interface ConsensusResult {
  finalText: string;
  consensusConfidence: number;
  individualResults: TranscriptionResult[];
  disagreements: Disagreement[];
  stats: ConsensusStats;
  reasoning: AIReasoning;
}

/**
 * Represents a specific point of difference between transcription results.
 */
export interface Disagreement {
  position: number;
  serviceTexts: Record<string, string>;
  severity: number;
}

/**
 * Quantitative measures of the consensus process.
 */
export interface ConsensusStats {
  totalProcessingTimeMs: number;
  servicesUsed: number;
  averageConfidence: number;
  disagreementCount: number;
}

// --- AI Reasoning ---

/**
 * A simplified representation of the AI's reasoning process for reaching consensus.
 */
export interface AIReasoning {
  /** A summary of why the final text was chosen. */
  finalReasoning: string;
  /** An ordered list of steps taken during the consensus process. */
  steps: ReasoningStep[];
}

/**
 * A single step in the consensus reasoning process.
 */
export interface ReasoningStep {
  stepNumber: number;
  /** A human-readable description of the action taken in this step. */
  description: string;
  /** The data associated with this step, for UI display or debugging. */
  data?: Record<string, unknown>;
}

// --- Runtime Validation Utilities ---

/**
 * Validates a TranscriptionResult object at runtime.
 */
export function validateTranscriptionResult(result: unknown): result is TranscriptionResult {
  if (!result || typeof result !== 'object') return false;
  const r = result as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.serviceName === 'string' &&
    typeof r.text === 'string' &&
    (typeof r.confidence === 'undefined' || (typeof r.confidence === 'number' && r.confidence >= 0 && r.confidence <= 1)) &&
    typeof r.processingTimeMs === 'number' && r.processingTimeMs >= 0 &&
    r.timestamp instanceof Date
  );
}

/**
 * Validates a ConsensusResult object at runtime.
 */
export function validateConsensusResult(result: unknown): result is ConsensusResult {
  if (!result || typeof result !== 'object') return false;
  const r = result as Record<string, unknown>;
  return (
    typeof r.finalText === 'string' &&
    typeof r.consensusConfidence === 'number' && r.consensusConfidence >= 0 && r.consensusConfidence <= 1 &&
    Array.isArray(r.individualResults) &&
    Array.isArray(r.disagreements) &&
    typeof r.stats === 'object' &&
    typeof r.reasoning === 'object'
  );
}
