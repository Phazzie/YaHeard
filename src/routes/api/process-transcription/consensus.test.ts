import { describe, it, expect } from 'vitest';
import { levenshteinDistance, calculateConsensus } from './+server';
import type { TranscriptionResult } from '../../../contracts/transcription';

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('should return the correct distance for different strings', () => {
    expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
  });

  it('should be case-sensitive', () => {
    expect(levenshteinDistance('Hello', 'hello')).toBe(1);
  });

  it('should handle empty strings', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5);
    expect(levenshteinDistance('hello', '')).toBe(5);
    expect(levenshteinDistance('', '')).toBe(0);
  });
});

describe('calculateConsensus', () => {
  const mockResults: TranscriptionResult[] = [
    { id: '1', serviceName: 'A', text: 'the quick brown fox', confidence: 0.9, processingTimeMs: 100, timestamp: new Date() },
    { id: '2', serviceName: 'B', text: 'the quick brown dog', confidence: 0.9, processingTimeMs: 100, timestamp: new Date() },
    { id: '3', serviceName: 'C', text: 'the quick brown fox', confidence: 0.9, processingTimeMs: 100, timestamp: new Date() },
  ];

  const mockResults2: TranscriptionResult[] = [
    { id: '1', serviceName: 'A', text: 'hello world', confidence: 0.9, processingTimeMs: 100, timestamp: new Date() },
    { id: '2', serviceName: 'B', text: 'hallo world', confidence: 0.9, processingTimeMs: 100, timestamp: new Date() },
    { id: '3', serviceName: 'C', text: 'herro world', confidence: 0.9, processingTimeMs: 100, timestamp: new new Date() },
  ];

  it('should choose the most common text as the consensus', () => {
    const { consensus } = calculateConsensus(mockResults);
    expect(consensus).toBe('the quick brown fox');
  });

  it('should choose the most central text as the consensus', () => {
    const { consensus } = calculateConsensus(mockResults2);
    expect(consensus).toBe('hallo world');
  });

  it('should return an empty string if no successful results', () => {
    const emptyResults: TranscriptionResult[] = [
      { id: '1', serviceName: 'A', text: '', confidence: 0, processingTimeMs: 100, timestamp: new Date() }
    ];
    const { consensus } = calculateConsensus(emptyResults);
    expect(consensus).toBe('');
  });

  it('should return the single result if only one is successful', () => {
    const singleResult: TranscriptionResult[] = [
        { id: '1', serviceName: 'A', text: 'this is a test', confidence: 0.9, processingTimeMs: 100, timestamp: new Date() }
    ];
    const { consensus } = calculateConsensus(singleResult);
    expect(consensus).toBe('this is a test');
  });
});
