/**
 * @file config.ts
 * @purpose Centralized configuration constants for the application
 * @phazzie-status working
 * @last-regenerated 2025-09-01 12:09:00 UTC
 */

// ========= CONSENSUS ALGORITHM CONFIGURATION =========

/**
 * AI Consensus Configuration
 * These values control how the consensus algorithm weighs different factors
 */
export const CONSENSUS_CONFIG = {
  /** Threshold for determining agreement between services (as percentage of average text length) */
  AGREEMENT_THRESHOLD: 0.3,
  
  /** Minimum confidence score to consider a result as high-quality */
  HIGH_CONFIDENCE_THRESHOLD: 0.9,
  
  /** Minimum confidence score to consider a result acceptable */
  ACCEPTABLE_CONFIDENCE_THRESHOLD: 0.8,
  
  /** Below this confidence, results are considered low quality */
  LOW_CONFIDENCE_THRESHOLD: 0.7,
  
  /** Below this confidence, results should be treated with extreme caution and avoided */
  AVOID_THRESHOLD: 0.4,
  
  /** Processing time threshold for "fast" services (milliseconds) */
  FAST_PROCESSING_THRESHOLD: 5000,
  
  /** Processing time threshold for "slow" services (milliseconds) */
  SLOW_PROCESSING_THRESHOLD: 10000,
  
  /** Decision factor weights for consensus calculation */
  DECISION_WEIGHTS: {
    CONFIDENCE_SCORE: 0.6,
    PROCESSING_SPEED: 0.2,
    TEXT_LENGTH_CONSISTENCY: 0.2
  }
} as const;

// ========= UI CONFIGURATION =========

/**
 * UI Display Configuration
 * Controls various display thresholds and limits
 */
export const UI_CONFIG = {
  /** Maximum characters to display in JSON data before truncation */
  MAX_JSON_DISPLAY_LENGTH: 1000,
  
  /** Maximum items to show in objects/arrays before truncation (preserves JSON structure) */
  MAX_JSON_DISPLAY_ITEMS: 50,
  
  /** Number of particles to display in background animation */
  BACKGROUND_PARTICLE_COUNT: 12,
  
  /** Animation duration for background effects (seconds) */
  BACKGROUND_ANIMATION_DURATION: 12
} as const;// ========= PERFORMANCE CONFIGURATION =========

/**
 * Performance and Resource Limits
 */
export const PERFORMANCE_CONFIG = {
  /** Maximum file size allowed for upload (bytes) - from original config */
  MAX_FILE_SIZE_BYTES: 60 * 1024 * 1024, // 60MB
  
  /** Timeout for individual AI service processing (milliseconds) */
  SERVICE_TIMEOUT_MS: 30000, // 30 seconds
  
  /** Maximum number of reasoning steps to store */
  MAX_REASONING_STEPS: 100,
  
  /** Memory threshold for large object warnings (bytes) */
  LARGE_OBJECT_THRESHOLD: 1024 * 1024 // 1MB
} as const;

// ========= QUALITY ASSESSMENT CONFIGURATION =========

/**
 * Service Quality Assessment Thresholds
 */
export const QUALITY_CONFIG = {
  /** Quality score thresholds for service recommendations */
  QUALITY_THRESHOLDS: {
    PREFERRED: 0.8,
    ACCEPTABLE: 0.5,
    AVOID: 0.5 // Below this threshold
  },
  
  /** Text length variation thresholds (multiplier of average length) */
  LENGTH_VARIATION: {
    DETAILED_THRESHOLD: 1.1, // 10% longer than average
    SHORT_THRESHOLD: 0.8     // 20% shorter than average  
  },

  /** Validation constraints for data integrity */
  VALIDATION_CONSTRAINTS: {
    CONFIDENCE_BOUNDS: { MIN: 0.0, MAX: 1.0 },
    QUALITY_SCORE_BOUNDS: { MIN: 0.0, MAX: 1.0 },
    PROCESSING_TIME_LIMITS: {
      MAX_REASONABLE_MS: 30000, // 30 seconds
      WARN_THRESHOLD_MS: 10000  // Warn if over 10 seconds
    },
    TEXT_LENGTH_LIMITS: {
      MIN_REASONABLE_LENGTH: 5,    // Minimum reasonable transcription
      MAX_REASONABLE_LENGTH: 50000 // Maximum text length we'll handle
    },
    METADATA_CONSTRAINTS: {
      MAX_METADATA_KEYS: 20,       // Prevent metadata bloat
      MAX_METADATA_VALUE_LENGTH: 1000
    }
  }
} as const;

// ========= ERROR HANDLING CONFIGURATION =========

/**
 * Error Handling and Retry Configuration
 */
export const ERROR_CONFIG = {
  /** Number of retries for failed AI service calls */
  MAX_RETRIES: 3,
  
  /** Delay between retries (milliseconds) */
  RETRY_DELAY: 1000,
  
  /** Timeout for individual retry attempts */
  RETRY_TIMEOUT: 10000
} as const;

// ========= TYPE DEFINITIONS FOR CONFIG =========

export type ConsensusConfig = typeof CONSENSUS_CONFIG;
export type UIConfig = typeof UI_CONFIG;
export type PerformanceConfig = typeof PERFORMANCE_CONFIG;
export type QualityConfig = typeof QUALITY_CONFIG;
export type ErrorConfig = typeof ERROR_CONFIG;
