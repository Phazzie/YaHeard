/**
 * @file chunk-audio.ts
 * @purpose Client-side audio chunking utility: decode audio, split by duration estimated from target bytes, encode each chunk as WAV.
 */

export interface AudioChunkOptions {
  /** Target max bytes per chunk (approx). Defaults to 4 * 1024 * 1024 (4MB). */
  targetBytes?: number;
  /** Minimum seconds per chunk to avoid too-short segments. Defaults to 10s. */
  minSeconds?: number;
}

/**
 * Splits an audio File into WAV chunks under the approximate size limit.
 * Note: Must be called in the browser (uses AudioContext).
 */
export async function chunkAudioFile(file: File, opts: AudioChunkOptions = {}): Promise<File[]> {
  const targetBytes = opts.targetBytes ?? 4 * 1024 * 1024; // 4MB
  const minSeconds = opts.minSeconds ?? 10;

  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;

  // PCM16 bytes per second
  const bytesPerSecond = sampleRate * channels * 2; // 16-bit PCM
  let chunkSeconds = Math.max(minSeconds, Math.floor(targetBytes / Math.max(1, bytesPerSecond)));
  if (!isFinite(chunkSeconds) || chunkSeconds <= 0) chunkSeconds = minSeconds;

  const totalSeconds = audioBuffer.duration;
  const chunks: File[] = [];
  let offsetSec = 0;
  let idx = 0;
  while (offsetSec < totalSeconds) {
    const endSec = Math.min(totalSeconds, offsetSec + chunkSeconds);
    const chunk = sliceBufferToWavFile(audioBuffer, offsetSec, endSec, `chunk-${idx}.wav`);
    chunks.push(chunk);
    idx++;
    offsetSec = endSec;
  }
  try { audioCtx.close(); } catch {}
  return chunks;
}

function sliceBufferToWavFile(buffer: AudioBuffer, startSec: number, endSec: number, name: string): File {
  const sampleRate = buffer.sampleRate;
  const startFrame = Math.floor(startSec * sampleRate);
  const endFrame = Math.floor(endSec * sampleRate);
  const frameCount = Math.max(0, endFrame - startFrame);

  const channels = buffer.numberOfChannels;
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < channels; ch++) {
    const src = buffer.getChannelData(ch);
    const slice = src.subarray(startFrame, endFrame);
    // Create a copy to avoid referencing original backing store
    const copy = new Float32Array(slice.length);
    copy.set(slice);
    channelData.push(copy);
  }

  const wavBuffer = encodeWAV(channelData, sampleRate);
  return new File([wavBuffer], name, { type: 'audio/wav' });
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
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true);  // Audio format = PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // interleave channels and convert to PCM16
  let offset = 44;
  for (let i = 0; i < frameCount; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const sample = channelsData[ch][i] || 0;
      // clamp and convert to int16
      const s = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
