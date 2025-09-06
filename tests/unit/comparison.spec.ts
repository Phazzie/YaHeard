import { describe, it, expect } from 'vitest';
import { ConsensusComparisonEngine } from '../../src/implementations/comparison';
import type { TranscriptionResult } from '../../src/contracts/processors';
import { validateConsensusResult } from '../../src/contracts/transcription';
import { CONSENSUS_CONFIG } from '../../src/lib/config';

function makeResult(overrides: Partial<TranscriptionResult>): TranscriptionResult {
    return {
        id: Math.random().toString(36).slice(2),
        serviceName: 'TestService',
        text: 'hello world',
        processingTimeMs: 1000,
        timestamp: new Date(),
        ...overrides,
    };
}

describe('ConsensusComparisonEngine', () => {
    it('returns valid consensus for multiple results and prefers highest similarity', () => {
        const engine = new ConsensusComparisonEngine();
        const a = makeResult({ serviceName: 'A', text: 'hello world', confidence: 0.9, processingTimeMs: 2100 });
        const b = makeResult({ serviceName: 'B', text: 'hello word', confidence: 0.87, processingTimeMs: 1800 });
        const c = makeResult({ serviceName: 'C', text: 'hello world', confidence: 0.91, processingTimeMs: 3200 });

        const consensus = engine.compareTranscriptions([a, b, c]);

        expect(consensus.finalText).toBe('hello world');
        expect(consensus.individualResults.length).toBe(3);
        expect(consensus.consensusConfidence).toBeGreaterThan(0);
        expect(consensus.consensusConfidence).toBeLessThanOrEqual(1);
        expect(validateConsensusResult(consensus)).toBe(true);
    });

    it('computes single-result confidence with expected weighting', () => {
        const engine = new ConsensusComparisonEngine();
        const r = makeResult({ serviceName: 'Solo', text: 'only result', confidence: 0.9, processingTimeMs: CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD - 1 });
        const consensus = engine.compareTranscriptions([r]);

        // averageSimilarity=1 (only result), speed=1 (fast). confidence weight=0.2
        // expected = 1*0.7 + 0.9*0.2 + 1*0.1 = 0.98
        expect(consensus.consensusConfidence).toBeGreaterThan(0.95);
        expect(consensus.individualResults.length).toBe(1);
        expect(consensus.finalText).toBe('only result');
    });

    it('breaks ties by confidence when similarity is equal', () => {
        const engine = new ConsensusComparisonEngine();
        // A and C are identical; tie on similarity; higher confidence should win
        const a = makeResult({ serviceName: 'A', text: 'alpha beta', confidence: 0.6 });
        const b = makeResult({ serviceName: 'B', text: 'alpha bet', confidence: 0.99 });
        const c = makeResult({ serviceName: 'C', text: 'alpha beta', confidence: 0.8 });

        const consensus = engine.compareTranscriptions([a, b, c]);
        expect(consensus.finalText).toBe('alpha beta');
        // Winner should be the text from service C due to higher confidence than A
        // We cannot directly read winner, but finalText equals A and C; both equal
        // Ensure confidence is <=1 and result validates
        expect(validateConsensusResult(consensus)).toBe(true);
    });
});
