import { describe, it, expect } from 'vitest';
import { ConsensusComparisonEngine } from '../../src/implementations/comparison';
import type { TranscriptionResult } from '../../src/contracts/processors';

function makeResult(overrides: Partial<TranscriptionResult>): TranscriptionResult {
    return {
        id: Math.random().toString(36).slice(2),
        serviceName: 'Svc',
        text: '',
        processingTimeMs: 1000,
        timestamp: new Date(),
        ...overrides,
    };
}

describe('ConsensusComparisonEngine errors', () => {
    it('throws when no results are provided', () => {
        const engine = new ConsensusComparisonEngine();
        expect(() => engine.compareTranscriptions([])).toThrowError();
    });

    it('throws when all results are empty or invalid', () => {
        const engine = new ConsensusComparisonEngine();
        const a = makeResult({ text: '' });
        const b = makeResult({ text: '' });
        expect(() => engine.compareTranscriptions([a, b])).toThrowError();
    });
});
