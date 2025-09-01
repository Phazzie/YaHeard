/**
 * @file ui-utils.ts
 * @purpose Shared UI utility functions for consistent styling and behavior
 * @phazzie-status working
 * @last-regenerated 2025-09-01 12:09:00 UTC
 */

import { CONSENSUS_CONFIG, UI_CONFIG } from './config.js';

// ========= COLOR AND STYLING UTILITIES =========

/**
 * Get color classes for reasoning step types
 */
export function getStepColor(type: string): string {
  switch (type) {
    case 'analysis': return 'border-blue-400/50 bg-blue-500/10';
    case 'comparison': return 'border-yellow-400/50 bg-yellow-500/10';
    case 'weighting': return 'border-purple-400/50 bg-purple-500/10';
    case 'decision': return 'border-green-400/50 bg-green-500/10';
    case 'validation': return 'border-cyan-400/50 bg-cyan-500/10';
    default: return 'border-white/30 bg-white/10';
  }
}

/**
 * Get icon for reasoning step types
 */
export function getStepIcon(type: string): string {
  switch (type) {
    case 'analysis': return '🔍';
    case 'comparison': return '⚖️';
    case 'weighting': return '📊';
    case 'decision': return '🎯';
    case 'validation': return '✅';
    default: return '🤖';
  }
}

/**
 * Get color class based on quality score
 */
export function getQualityColor(score: number): string {
  if (score >= CONSENSUS_CONFIG.HIGH_CONFIDENCE_THRESHOLD) return 'text-green-400';
  if (score >= CONSENSUS_CONFIG.ACCEPTABLE_CONFIDENCE_THRESHOLD) return 'text-yellow-400';
  if (score >= 0.5) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Get color classes for service recommendations
 */
export function getRecommendationColor(recommendation: string): string {
  switch (recommendation) {
    case 'preferred': return 'text-green-400 bg-green-500/20';
    case 'acceptable': return 'text-yellow-400 bg-yellow-500/20';
    case 'avoid': return 'text-red-400 bg-red-500/20';
    default: return 'text-gray-400 bg-gray-500/20';
  }
}

// ========= DATA FORMATTING UTILITIES =========

/**
 * Safely stringify JSON data with size limits.
 * Truncates objects/arrays at a property/item limit to preserve valid JSON.
 */
export function formatJsonSafely(data: unknown): string {
  const MAX_ITEMS = UI_CONFIG.MAX_JSON_DISPLAY_ITEMS ?? 50; // fallback if not set
  let wasTruncated = false;

  function truncate(obj: any, depth = 0): any {
    if (Array.isArray(obj)) {
      if (obj.length > MAX_ITEMS) {
        wasTruncated = true;
        return obj.slice(0, MAX_ITEMS).concat(['...(truncated)']);
      }
      return obj.map(item => truncate(item, depth + 1));
    } else if (obj && typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length > MAX_ITEMS) {
        wasTruncated = true;
        const truncatedObj: any = {};
        for (const key of keys.slice(0, MAX_ITEMS)) {
          truncatedObj[key] = truncate(obj[key], depth + 1);
        }
        truncatedObj['...(truncated)'] = true;
        return truncatedObj;
      }
      const result: any = {};
      for (const key of keys) {
        result[key] = truncate(obj[key], depth + 1);
      }
      return result;
    }
    return obj;
  }

  try {
    const safeData = truncate(data);
    let jsonString = JSON.stringify(safeData, null, 2);
    if (wasTruncated) {
      jsonString += '\n/* Output truncated for display */';
    }
    return jsonString;
  } catch (error) {
    return `[Error formatting data: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

/**
 * Format confidence as percentage with color indication
 */
export function formatConfidence(confidence: number): { text: string; colorClass: string } {
  const percentage = (confidence * 100).toFixed(1);
  const colorClass = getQualityColor(confidence);
  
  return {
    text: `${percentage}%`,
    colorClass
  };
}

/**
 * Format processing time with appropriate units
 */
export function formatProcessingTime(timeMs: number): string {
  if (timeMs < 1000) {
    return `${timeMs.toFixed(0)}ms`;
  } else if (timeMs < 60000) {
    return `${(timeMs / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

// ========= VALIDATION UTILITIES =========

/**
 * Check if an object is potentially too large for safe rendering
 */
export function isLargeObject(obj: unknown): boolean {
  try {
    const size = JSON.stringify(obj).length;
    return size > UI_CONFIG.MAX_JSON_DISPLAY_LENGTH;
  } catch {
    return true; // Assume it's large if we can't stringify it
  }
}

/**
 * Validate reasoning step data structure
 */
export function isValidReasoningStep(step: unknown): step is {
  stepNumber: number;
  description: string;
  type: string;
  timestamp: Date | string;
} {
  if (!step || typeof step !== 'object') return false;
  
  const s = step as Record<string, unknown>;
  return (
    typeof s.stepNumber === 'number' &&
    typeof s.description === 'string' &&
    typeof s.type === 'string' &&
    (s.timestamp instanceof Date || typeof s.timestamp === 'string')
  );
}

// ========= ERROR HANDLING UTILITIES =========

/**
 * Create error boundary wrapper for UI components
 */
export function withErrorBoundary<T>(
  fn: () => T,
  fallback: T,
  errorLogger?: (error: Error) => void
): T {
  try {
    return fn();
  } catch (error) {
    if (errorLogger && error instanceof Error) {
      errorLogger(error);
    }
    console.warn('UI Error caught by boundary:', error);
    return fallback;
  }
}

/**
 * Safe array access with fallback
 */
export function safeArrayAccess<T>(
  array: T[] | undefined | null,
  index: number,
  fallback: T
): T {
  return array?.[index] ?? fallback;
}

// ========= ACCESSIBILITY UTILITIES =========

/**
 * Generate accessible labels for quality scores
 */
export function getQualityLabel(score: number): string {
  if (score >= CONSENSUS_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
    return `Excellent quality: ${(score * 100).toFixed(0)}%`;
  } else if (score >= CONSENSUS_CONFIG.ACCEPTABLE_CONFIDENCE_THRESHOLD) {
    return `Good quality: ${(score * 100).toFixed(0)}%`;
  } else if (score >= 0.5) {
    return `Moderate quality: ${(score * 100).toFixed(0)}%`;
  } else {
    return `Low quality: ${(score * 100).toFixed(0)}%`;
  }
}
