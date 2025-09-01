import type { TranscriptionResult, ConsensusResult, Disagreement, ConsensusStats } from './transcription';

/**
 * Defines the standard interface for any AI transcription service.
 * This allows for a plug-and-play architecture.
 */
export interface AudioProcessor {
  /** A human-readable name for the AI service (e.g., "Whisper", "AssemblyAI"). */
  readonly serviceName: string;

  /**
   * Checks if the service is configured and ready to process files.
   * Typically checks for the presence of an API key.
   */
  isAvailable(): Promise<boolean>;

  /**
   * The core method that sends an audio file to the AI service for transcription.
   * @param file The audio file to transcribe.
   * @returns A promise that resolves to a standardized TranscriptionResult.
   */
  processFile(file: File): Promise<TranscriptionResult>;

  /**
   * Returns the estimated cost per minute for this service in USD.
   * This can be a static value or fetched from an API.
   */
  getCostPerMinute(): Promise<number>;

  /**
   * Returns a list of supported audio formats as file extensions (e.g., '.mp3', '.wav').
   */
  getSupportedFormats(): string[];
}

// --- Type-safe Configuration for Processors ---

export interface BaseProcessorConfig {
  apiKey?: string;
  endpoint?: string;
}

export interface WhisperConfig extends BaseProcessorConfig {
  options?: {
    model?: 'whisper-1';
    language?: string; // ISO 639-1 format
  };
}

export interface AssemblyAIConfig extends BaseProcessorConfig {
  options?: {
    language?: string; // Language code
  };
}

export interface DeepgramConfig extends BaseProcessorConfig {
  options?: {
    model?: 'nova-2' | 'base' | 'enhanced';
    language?: string; // BCP-47 format
    smart_format?: boolean;
    punctuate?: boolean;
    utterances?: boolean;
  };
}

export interface ElevenLabsConfig extends BaseProcessorConfig {
  options?: {
    model?: 'scribe_v1';
    language?: string;
  };
}

export interface GeminiConfig extends BaseProcessorConfig {
  options?: {
    model?: 'gemini-2.0-flash-exp';
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

/** A union type for any possible processor configuration. */
export type ProcessorConfig =
  | WhisperConfig
  | AssemblyAIConfig
  | DeepgramConfig
  | ElevenLabsConfig
  | GeminiConfig;


// --- Interfaces for Handling Multiple Processor Results ---

/**
 * Represents the result of processing one audio file through multiple AI services.
 * This is the raw data before consensus calculation.
 */
export interface MultiProcessingResult {
  results: TranscriptionResult[];
  failedServices: FailedService[];
}

/**
 * Information about an AI service that failed to process a file.
 */
export interface FailedService {
  serviceName: string;
  error: string;
}

// --- Interface for the Consensus Engine ---

/**
 * Defines the interface for an algorithm that compares multiple AI transcriptions
 * and produces a single, high-quality consensus transcription.
 */
export interface ComparisonEngine {
  compareTranscriptions(results: TranscriptionResult[]): ConsensusResult;
}

// --- Convenience Re-exports ---

export type { TranscriptionResult, ConsensusResult, Disagreement, ConsensusStats };