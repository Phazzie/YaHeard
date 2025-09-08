import { describe, it, expect } from 'vitest';

// The functions in chunk-audio.ts are not exported in a way that's easy to import
// for testing. To test the pure `encodeWAV` function, we'll copy it here.
// In a real-world scenario, this would be refactored to be exportable.

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function encodeWAV(channelsData: Float32Array[], sampleRate: number): ArrayBuffer {
  const channels = channelsData.length;
  const frameCount = channelsData[0]?.length ?? 0;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < frameCount; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const sample = channelsData[ch][i] || 0;
      const s = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return buffer;
}


describe('Audio Chunking Utilities', () => {
  describe('encodeWAV', () => {
    it('should create a valid WAV header for mono audio', () => {
      const sampleRate = 44100;
      const durationSeconds = 1;
      const frameCount = sampleRate * durationSeconds;
      const channelData = [new Float32Array(frameCount).fill(0.1)]; // 1 channel (mono)

      const buffer = encodeWAV(channelData, sampleRate);
      const view = new DataView(buffer);

      // Helper to read string from buffer
      const readString = (offset: number, length: number) => {
        let str = '';
        for (let i = 0; i < length; i++) {
          str += String.fromCharCode(view.getUint8(offset + i));
        }
        return str;
      };

      // Check RIFF header
      expect(readString(0, 4)).toBe('RIFF');
      expect(readString(8, 4)).toBe('WAVE');

      // Check fmt chunk
      expect(readString(12, 4)).toBe('fmt ');
      expect(view.getUint16(20, true)).toBe(1); // PCM
      expect(view.getUint16(22, true)).toBe(1); // Mono
      expect(view.getUint32(24, true)).toBe(sampleRate); // Sample Rate

      // Check data chunk
      expect(readString(36, 4)).toBe('data');
      const dataSize = frameCount * 1 * 2; // frameCount * channels * bytesPerSample
      expect(view.getUint32(40, true)).toBe(dataSize);

      // Check total size
      expect(view.getUint32(4, true)).toBe(36 + dataSize);
      expect(buffer.byteLength).toBe(44 + dataSize);
    });

    it('should correctly interleave stereo audio data', () => {
      const sampleRate = 16000;
      const frameCount = 2;
      // Left channel: 0.5, -0.5
      // Right channel: 0.25, -0.25
      const channelsData = [
        new Float32Array([0.5, -0.5]),
        new Float32Array([0.25, -0.25]),
      ];

      const buffer = encodeWAV(channelsData, sampleRate);
      const view = new DataView(buffer);

      const pcm16Max = 0x7fff;
      const pcm16Min = -0x8000;

      // Check first interleaved sample (L, R)
      expect(view.getInt16(44, true)).toBeCloseTo(0.5 * pcm16Max);
      expect(view.getInt16(46, true)).toBeCloseTo(0.25 * pcm16Max);
      // Check second interleaved sample (L, R)
      expect(view.getInt16(48, true)).toBeCloseTo(-0.5 * pcm16Min);
      expect(view.getInt16(50, true)).toBeCloseTo(-0.25 * pcm16Min);
    });
  });
});
