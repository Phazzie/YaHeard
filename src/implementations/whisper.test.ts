import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhisperProcessor } from './whisper';

// Mock the global fetch function
vi.spyOn(global, 'fetch');

// Helper to create a mock File object
const createMockFile = () => new File(['dummy audio content'], 'audio.mp3', { type: 'audio/mp3' });

describe('WhisperProcessor', () => {
  let processor: WhisperProcessor;

  beforeEach(() => {
    vi.resetAllMocks();
    processor = new WhisperProcessor({ apiKey: 'test-whisper-key' });
  });

  it('should return true for isAvailable when an API key is provided', async () => {
    expect(await processor.isAvailable()).toBe(true);
  });

  it('should return false for isAvailable when an API key is not provided', async () => {
    const p = new WhisperProcessor();
    expect(await p.isAvailable()).toBe(false);
  });

  it('should throw an error if no API key is configured during processing', async () => {
    const p = new WhisperProcessor();
    await expect(p.processFile(createMockFile())).rejects.toThrow('Whisper API key not configured.');
  });

  it('should process a file successfully using FormData', async () => {
    const mockFile = createMockFile();
    const mockApiResponse = {
      text: 'This is a test from Whisper.',
      language: 'en',
    };

    (fetch as any).mockResolvedValue(new Response(JSON.stringify(mockApiResponse), { status: 200 }));

    const result = await processor.processFile(mockFile);

    expect(result.serviceName).toBe('Whisper');
    expect(result.text).toBe('This is a test from Whisper.');
    expect(result.confidence).toBeUndefined(); // Whisper doesn't provide confidence
    expect(fetch).toHaveBeenCalledTimes(1);

    // Verify the FormData content by checking the body passed to fetch
    const fetchOptions = (fetch as any).mock.calls[0][1];
    expect(fetchOptions.body).toBeInstanceOf(FormData);
    const formDataEntries = [...(fetchOptions.body as any).entries()];
    expect(formDataEntries).toContainEqual(['model', 'whisper-1']);
    const fileEntry = formDataEntries.find(entry => entry[0] === 'file');
    expect(fileEntry).toBeDefined();
    expect(fileEntry[1]).toBeInstanceOf(File);
    expect(fileEntry[1].name).toBe('audio.mp3');
  });

  it('should include optional language parameter when provided', async () => {
    const processorWithLang = new WhisperProcessor({
        apiKey: 'test-whisper-key',
        options: { language: 'es' }
    });
    const mockFile = createMockFile();
    const mockApiResponse = { text: 'Hola mundo.', language: 'es' };
    (fetch as any).mockResolvedValue(new Response(JSON.stringify(mockApiResponse), { status: 200 }));

    await processorWithLang.processFile(mockFile);

    const fetchOptions = (fetch as any).mock.calls[0][1];
    const formDataEntries = [...(fetchOptions.body as any).entries()];
    expect(formDataEntries).toContainEqual(['language', 'es']);
  });

  it('should throw an error if the API call fails', async () => {
    (fetch as any).mockResolvedValue(new Response('API Error', { status: 500, statusText: 'Internal Server Error' }));

    await expect(processor.processFile(createMockFile())).rejects.toThrow('Whisper API error (500)');
  });
});
