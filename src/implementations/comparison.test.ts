import { describe, it, expect } from 'vitest';
import { ConsensusComparisonEngine } from './comparison';
import type { TranscriptionResult } from '../contracts/transcription';

describe('ConsensusComparisonEngine', () => {
  const engine = new ConsensusComparisonEngine();

  it('should select the result with the highest average similarity', () => {
    const results: TranscriptionResult[] = [
      { id: '1', serviceName: 'A', text: 'hello world', confidence: 0.9, processingTimeMs: 100, timestamp: new Date() },
      { id: '2', serviceName: 'B', text: 'hello world', confidence: 0.8, processingTimeMs: 100, timestamp: new Date() },
      { id: '3', serviceName: 'C', text: 'hello there', confidence: 0.95, processingTimeMs: 100, timestamp: new Date() },
    ];
    const consensus = engine.compareTranscriptions(results);
    expect(consensus.finalText).toBe('hello world');
  });

  it('should use confidence as a tie-breaker when similarities are equal', () => {
    const results: TranscriptionResult[] = [
        { id: '1', serviceName: 'A', text: 'a b c', confidence: 0.9, processingTimeMs: 100, timestamp: new Date() },
        { id: '2', serviceName: 'B', text: 'd e f', confidence: 0.95, processingTimeMs: 100, timestamp: new Date() },
    ];
    // Here, both have an average similarity of 0 to each other. So the higher confidence should win.
    const consensus = engine.compareTranscriptions(results);
    expect(consensus.finalText).toBe('d e f');
  });

  it('should work correctly when no confidence scores are provided', () => {
    const results: TranscriptionResult[] = [
      { id: '1', serviceName: 'A', text: 'the quick brown fox', processingTimeMs: 100, timestamp: new Date() },
      { id: '2', serviceName: 'B', text: 'the quick brown fox jumps', processingTimeMs: 100, timestamp: new Date() },
      { id: '3', serviceName: 'C', text: 'the quick brown fox jumps over', processingTimeMs: 100, timestamp: new Date() },
    ];
    // C is most similar to B. B is most similar to A and C. A is most similar to B.
    // "the quick brown fox jumps" should be the most central text.
    const consensus = engine.compareTranscriptions(results);
    expect(consensus.finalText).toBe('the quick brown fox jumps');
  });

  it('should handle a single result', () => {
    const results: TranscriptionResult[] = [
      { id: '1', serviceName: 'A', text: 'single result', confidence: 0.9, processingTimeMs: 100, timestamp: new Date() },
    ];
    const consensus = engine.compareTranscriptions(results);
    expect(consensus.finalText).toBe('single result');
    expect(consensus.consensusConfidence).toBe(0.9);
  });

  it('should handle empty input', () => {
    const results: TranscriptionResult[] = [];
    expect(() => engine.compareTranscriptions(results)).toThrow('No valid transcription results provided for comparison');
  });

  it('should handle results with no valid text', () => {
    const results: TranscriptionResult[] = [
        { id: '1', serviceName: 'A', text: ' ', confidence: 0.9, processingTimeMs: 100, timestamp: new Date() },
        { id: '2', serviceName: 'B', text: '', confidence: 0.8, processingTimeMs: 100, timestamp: new Date() },
    ];
    const consensus = engine.compareTranscriptions(results);
    expect(consensus.finalText).toBe('');
  });
});
