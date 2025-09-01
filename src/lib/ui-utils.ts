/**
 * @file ui-utils.ts
 * @purpose Shared UI utility functions for consistent styling and behavior
 * @phazzie-status working
 * @last-regenerated 2025-09-01 12:09:00 UTC
 */

import { CONSENSUS_CONFIG, UI_CONFIG } from './config.js';

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
