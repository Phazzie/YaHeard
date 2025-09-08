import { describe, it, expect } from 'vitest';
import { validateTranscriptionResult, validateConsensusResult, type TranscriptionResult, type ConsensusResult } from './transcription';

describe('Transcription Contract Validators', () => {
  describe('validateTranscriptionResult', () => {
    const validResult: TranscriptionResult = {
      id: '123',
      serviceName: 'test-service',
      text: 'This is a test.',
      confidence: 0.95,
      processingTimeMs: 1500,
      timestamp: new Date(),
    };

    it('should return true for a valid TranscriptionResult', () => {
      expect(validateTranscriptionResult(validResult)).toBe(true);
    });

    it('should return true for a valid TranscriptionResult without optional fields', () => {
      const { confidence, ...rest } = validResult;
      expect(validateTranscriptionResult(rest)).toBe(true);
    });

    it('should return false for an invalid object', () => {
      expect(validateTranscriptionResult({ foo: 'bar' })).toBe(false);
    });

    it('should return false for a null or undefined object', () => {
      expect(validateTranscriptionResult(null)).toBe(false);
      expect(validateTranscriptionResult(undefined)).toBe(false);
    });

    it('should return false for incorrect data types', () => {
      expect(validateTranscriptionResult({ ...validResult, id: 123 })).toBe(false);
      expect(validateTranscriptionResult({ ...validResult, text: null })).toBe(false);
      expect(validateTranscriptionResult({ ...validResult, confidence: 'high' })).toBe(false);
    });
  });

  describe('validateConsensusResult', () => {
    const validConsensus: ConsensusResult = {
      finalText: 'This is the final text.',
      consensusConfidence: 0.98,
      individualResults: [],
      disagreements: [],
      stats: {
        totalProcessingTimeMs: 2000,
        servicesUsed: 1,
        averageConfidence: 0.95,
        disagreementCount: 0,
      },
      reasoning: {
        finalReasoning: 'This is why.',
        steps: [],
      },
    };

    it('should return true for a valid ConsensusResult', () => {
      expect(validateConsensusResult(validConsensus)).toBe(true);
    });

    it('should return false for an invalid object', () => {
      expect(validateConsensusResult({ foo: 'bar' })).toBe(false);
    });

    it('should return false for a null or undefined object', () => {
        expect(validateConsensusResult(null)).toBe(false);
        expect(validateConsensusResult(undefined)).toBe(false);
    });

    it('should return false for incorrect data types', () => {
      expect(validateConsensusResult({ ...validConsensus, finalText: 123 })).toBe(false);
      expect(validateConsensusResult({ ...validConsensus, individualResults: {} })).toBe(false);
    });
  });
});
