import { describe, it, expect, vi } from 'vitest';
import {
  formatJsonSafely,
  formatProcessingTime,
  isLargeObject,
  withErrorBoundary,
  safeArrayAccess,
} from './ui-utils';
import { UI_CONFIG } from './config';

describe('UI Utilities', () => {
  describe('formatJsonSafely', () => {
    it('should format a simple object correctly', () => {
      const data = { a: 1, b: 'hello' };
      const expected = JSON.stringify(data, null, 2);
      expect(formatJsonSafely(data)).toBe(expected);
    });

    it('should truncate a large array', () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => i);
      const result = formatJsonSafely(largeArray);
      expect(result).toContain('...(truncated)');
      expect(result).toContain('/* Output truncated for display */');
    });

    it('should truncate an object with many properties', () => {
      const largeObject: { [key: string]: number } = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`key${i}`] = i;
      }
      const result = formatJsonSafely(largeObject);
      expect(result).toContain('"...(truncated)": true');
    });

    it('should handle circular references gracefully', () => {
        const obj: any = { a: 1 };
        obj.b = obj; // Circular reference
        const result = formatJsonSafely(obj);
        expect(result).toContain('Error formatting data');
    });
  });

  describe('formatProcessingTime', () => {
    it('should format time in milliseconds', () => {
      expect(formatProcessingTime(500)).toBe('500ms');
    });

    it('should format time in seconds', () => {
      expect(formatProcessingTime(2500)).toBe('2.5s');
    });

    it('should format time in minutes and seconds', () => {
      expect(formatProcessingTime(65000)).toBe('1m 5s');
    });
  });

  describe('isLargeObject', () => {
    it('should return false for a small object', () => {
      expect(isLargeObject({ a: 1 })).toBe(false);
    });

    it('should return true for a large object', () => {
      const largeObject = { data: 'a'.repeat(UI_CONFIG.MAX_JSON_DISPLAY_LENGTH) };
      expect(isLargeObject(largeObject)).toBe(true);
    });
  });

  describe('withErrorBoundary', () => {
    it('should return the result of the function if it succeeds', () => {
      const result = withErrorBoundary(() => 'success', 'fallback');
      expect(result).toBe('success');
    });

    it('should return the fallback value if the function throws an error', () => {
      const errorFn = () => {
        throw new Error('test error');
      };
      const result = withErrorBoundary(errorFn, 'fallback');
      expect(result).toBe('fallback');
    });

    it('should call the error logger if provided', () => {
      const errorFn = () => {
        throw new Error('test error');
      };
      const logger = vi.fn();
      withErrorBoundary(errorFn, 'fallback', logger);
      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith(new Error('test error'));
    });
  });

  describe('safeArrayAccess', () => {
    const arr = ['a', 'b', 'c'];
    const fallback = 'default';

    it('should return the element for a valid index', () => {
      expect(safeArrayAccess(arr, 1, fallback)).toBe('b');
    });

    it('should return the fallback for an out-of-bounds index', () => {
      expect(safeArrayAccess(arr, 5, fallback)).toBe(fallback);
    });

    it('should return the fallback for a negative index', () => {
      expect(safeArrayAccess(arr, -1, fallback)).toBe(fallback);
    });

    it('should return the fallback for a null or undefined array', () => {
      expect(safeArrayAccess(null, 0, fallback)).toBe(fallback);
      expect(safeArrayAccess(undefined, 0, fallback)).toBe(fallback);
    });
  });
});
