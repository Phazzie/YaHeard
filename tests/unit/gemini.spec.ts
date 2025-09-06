import { describe, it, expect } from 'vitest';
import { GeminiProcessor } from '../../src/implementations/gemini';

describe('GeminiProcessor', () => {
    it('returns extensions from getSupportedFormats()', () => {
        const gp = new GeminiProcessor({});
        const fmts = gp.getSupportedFormats();
        expect(Array.isArray(fmts)).toBe(true);
        expect(fmts.length).toBeGreaterThan(0);
        // all start with '.' and contain common formats
        expect(fmts.every(f => f.startsWith('.'))).toBe(true);
        expect(fmts).toContain('.mp3');
        expect(fmts).toContain('.wav');
    });

    it('isAvailable is false without apiKey and true with apiKey', async () => {
        const gpNoKey = new GeminiProcessor({});
        expect(await gpNoKey.isAvailable()).toBe(false);

        const gpWithKey = new GeminiProcessor({ apiKey: 'test' });
        expect(await gpWithKey.isAvailable()).toBe(true);
    });
});
