import { describe, it, expect } from 'vitest';
import { ConsensusComparisonEngine } from './comparison';
import type { TranscriptionResult } from '../contracts/transcription';

// A baseline date for consistent timestamps
const testDate = new Date('2025-01-01T12:00:00.000Z');

// Helper to create mock TranscriptionResult objects
const createMockResult = (
  id: string,
  serviceName: string,
  text: string,
  confidence?: number,
  processingTimeMs: number = 1000
): TranscriptionResult => ({
  id,
  serviceName,
  text,
  confidence,
  processingTimeMs,
  timestamp: testDate,
});

describe('ConsensusComparisonEngine', () => {
  let engine: ConsensusComparisonEngine;

  beforeEach(() => {
    engine = new ConsensusComparisonEngine();
  });

  describe('Edge Case Handling', () => {
    it('should throw an error if no results are provided', () => {
      expect(() => engine.compareTranscriptions([])).toThrow('No valid transcription results provided for comparison.');
    });

    it('should throw an error if all results have empty text', () => {
      const results = [
        createMockResult('r1', 'ServiceA', ''),
        createMockResult('r2', 'ServiceB', ''),
      ];
      expect(() => engine.compareTranscriptions(results)).toThrow('All transcription results were empty or invalid.');
    });

    it('should return a consensus based on a single result if only one is provided', () => {
      const singleResult = createMockResult('r1', 'ServiceA', 'This is the only result.', 0.9);
      const consensus = engine.compareTranscriptions([singleResult]);
      expect(consensus.finalText).toBe('This is the only result.');
      expect(consensus.individualResults).toEqual([singleResult]);
      expect(consensus.consensusConfidence).toBe(0.9);
      expect(consensus.reasoning.finalReasoning).toContain('Selected the only available transcription result.');
    });
     it('should use a default confidence for a single result if confidence is not provided', () => {
      const singleResult = createMockResult('r1', 'ServiceA', 'This is the only result.', undefined);
      const consensus = engine.compareTranscriptions([singleResult]);
      expect(consensus.finalText).toBe('This is the only result.');
      expect(consensus.consensusConfidence).toBe(0.75); // Default confidence
    });
  });

  describe('Core Consensus Logic', () => {
    it('should choose the text that is most similar to the others', () => {
      const results = [
        createMockResult('r1', 'ServiceA', 'This is a test sentence.', 0.9),
        createMockResult('r2', 'ServiceB', 'This is a test sentence.', 0.88),
        createMockResult('r3', 'ServiceC', 'This is a different sentence.', 0.95),
      ];
      const consensus = engine.compareTranscriptions(results);
      expect(consensus.finalText).toBe('This is a test sentence.');
    });

    it('should use confidence as a tie-breaker when similarities are equal', () => {
      // Note: This test is hard to construct perfectly without knowing the exact similarity scores.
      // We'll create a scenario where two texts are very similar to a third, but not to each other.
      const results = [
        createMockResult('r1', 'ServiceA', 'cats and dogs', 0.95), // Higher confidence, should win
        createMockResult('r2', 'ServiceB', 'cats and dogs', 0.90), // Lower confidence
      ];
      const consensus = engine.compareTranscriptions(results);
      expect(consensus.finalText).toBe('cats and dogs');
      expect(consensus.reasoning.finalReasoning).toContain('Selected text from "ServiceA"');
    });

    it('should handle three completely different transcriptions', () => {
        const results = [
            createMockResult('r1', 'ServiceA', 'The quick brown fox jumps over the lazy dog.', 0.9, 500),
            createMockResult('r2', 'ServiceB', 'A lazy cat naps in the warm afternoon sun.', 0.8, 1500),
            createMockResult('r3', 'ServiceC', 'Pack my box with five dozen liquor jugs.', 0.85, 2500),
        ];
        const consensus = engine.compareTranscriptions(results);
        // In this scenario, 'ServiceA' should win because its text is longest and will have a slightly
        // higher Jaccard/Levenshtein similarity to the other two dissimilar strings than they have to each other.
        // This is a predictable outcome of the algorithm.
        expect(consensus.finalText).toBe('The quick brown fox jumps over the lazy dog.');
    });
  });

  describe('Confidence Calculation', () => {
    it('should calculate a weighted consensus confidence score', () => {
      const results = [
        createMockResult('r1', 'ServiceA', 'The winner text', 0.9, 4000), // Fast, high confidence
        createMockResult('r2', 'ServiceB', 'A slightly different text', 0.8, 8000), // Slow, lower confidence
      ];
      const consensus = engine.compareTranscriptions(results);
      expect(consensus.finalText).toBe('The winner text');
      // The final confidence should be influenced by the winner's high confidence, its fast speed,
      // and its similarity to the other result. We expect a high score.
      expect(consensus.consensusConfidence).toBeGreaterThan(0.8);
      expect(consensus.consensusConfidence).toBeLessThan(1.0);
    });
     it('should produce a lower confidence for a slow result with low similarity', () => {
        const results = [
            createMockResult('r1', 'ServiceA', 'The winner text', 0.7, 12000), // Slow, low confidence
            createMockResult('r2', 'ServiceB', 'A completely different string of words', 0.6, 8000),
        ];
        const consensus = engine.compareTranscriptions(results);
        expect(consensus.finalText).toBe('The winner text');
        // Confidence should be penalized due to low similarity, low winner confidence, and slow speed.
        expect(consensus.consensusConfidence).toBeLessThan(0.7);
    });
  });

  describe('Similarity Helpers', () => {
    // Access private methods for testing using a cast to 'any'
    const testEngine = new ConsensusComparisonEngine() as any;

    it('calculateLevenshteinSimilarity should return 1 for identical strings', () => {
      const sim = testEngine.calculateLevenshteinSimilarity('hello world', 'hello world');
      expect(sim).toBe(1);
    });

    it('calculateLevenshteinSimilarity should return 0 for completely different strings of same length', () => {
      // This is an approximation, it might not be exactly 0 but should be very low.
      const sim = testEngine.calculateLevenshteinSimilarity('abcde', 'fghij');
      expect(sim).toBe(0);
    });

    it('calculateJaccardSimilarity should return 1 for identical strings', () => {
      const sim = testEngine.calculateJaccardSimilarity('hello world', 'hello world');
      expect(sim).toBe(1);
    });

    it('calculateJaccardSimilarity should work for partially similar strings', () => {
      const sim = testEngine.calculateJaccardSimilarity('the cat sat on the mat', 'the dog sat on the mat');
      // wordsA = {the, cat, sat, on, mat} (5)
      // wordsB = {the, dog, sat, on, mat} (5)
      // intersection = {the, sat, on, mat} (4)
      // union = {the, cat, dog, sat, on, mat} (6)
      // Jaccard = 4 / 6 = 0.666...
      expect(sim).toBeCloseTo(4 / 6);
    });

    it('calculateEnhancedSimilarity should combine Jaccard and Levenshtein', () => {
        // Mock the individual similarity functions to isolate the weighting logic
        testEngine.calculateJaccardSimilarity = () => 0.8;
        testEngine.calculateLevenshteinSimilarity = () => 0.6;

        const { JACCARD_WEIGHT, LEVENSHTEIN_WEIGHT } = { JACCARD_WEIGHT: 0.6, LEVENSHTEIN_WEIGHT: 0.4 }; // from config
        const expected = (0.8 * JACCARD_WEIGHT) + (0.6 * LEVENSHTEIN_WEIGHT); // (0.8 * 0.6) + (0.6 * 0.4) = 0.48 + 0.24 = 0.72

        const enhancedSim = testEngine.calculateEnhancedSimilarity('a', 'b');
        expect(enhancedSim).toBeCloseTo(0.72);
    });
  });
});
