import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeepgramProcessor } from './deepgram';

// Mock the global fetch function
global.fetch = vi.fn();

describe('DeepgramProcessor', () => {
  let processor: DeepgramProcessor;

  beforeEach(() => {
    vi.resetAllMocks();
    processor = new DeepgramProcessor({ apiKey: 'test-api-key' });
  });

  it('should return true for isAvailable when an API key is provided', async () => {
    expect(await processor.isAvailable()).toBe(true);
  });

  it('should return false for isAvailable when an API key is not provided', async () => {
    const p = new DeepgramProcessor();
    expect(await p.isAvailable()).toBe(false);
  });

  it('should process a file and return a valid TranscriptionResult', async () => {
    const mockFile = new File(['dummy content'], 'audio.mp3', { type: 'audio/mp3' });
    const mockResponse = {
      results: {
        channels: [
          {
            alternatives: [
              {
                transcript: 'This is a test transcript.',
                confidence: 0.98,
                words: [{ word: 'This' }, { word: 'is' }],
              },
            ],
          },
        ],
      },
    };

    (fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await processor.processFile(mockFile);

    expect(result.serviceName).toBe('Deepgram');
    expect(result.text).toBe('This is a test transcript.');
    expect(result.confidence).toBe(0.98);
    expect(result.metadata?.wordCount).toBe(2);
    expect(fetch).toHaveBeenCalledWith('https://api.deepgram.com/v1/listen', expect.any(Object));
  });

  it('should throw an error if the API call fails', async () => {
    const mockFile = new File(['dummy content'], 'audio.mp3', { type: 'audio/mp3' });

    (fetch as vi.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    await expect(processor.processFile(mockFile)).rejects.toThrow('Deepgram API error (500): Internal Server Error');
  });

  it('should throw an error if no API key is configured', async () => {
    const p = new DeepgramProcessor();
    const mockFile = new File(['dummy content'], 'audio.mp3', { type: 'audio/mp3' });
    await expect(p.processFile(mockFile)).rejects.toThrow('Deepgram API key not configured.');
  });
});
