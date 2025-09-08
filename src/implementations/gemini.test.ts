import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProcessor } from './gemini';

// Mock the global fetch function
vi.spyOn(global, 'fetch');

// Helper to create a mock File object
const createMockFile = () => new File(['dummy audio content'], 'audio.mp3', { type: 'audio/mp3' });

describe('GeminiProcessor', () => {
  let processor: GeminiProcessor;

  beforeEach(() => {
    vi.resetAllMocks();
    processor = new GeminiProcessor({ apiKey: 'test-gemini-key' });
  });

  it('should return true for isAvailable when an API key is provided', async () => {
    expect(await processor.isAvailable()).toBe(true);
  });

  it('should return false for isAvailable when an API key is not provided', async () => {
    const p = new GeminiProcessor();
    expect(await p.isAvailable()).toBe(false);
  });

  it('should throw an error if no API key is configured during processing', async () => {
    const p = new GeminiProcessor();
    await expect(p.processFile(createMockFile())).rejects.toThrow('Gemini API key not configured.');
  });

  it('should process a file successfully and format the request correctly', async () => {
    const mockFile = createMockFile();
    const mockApiResponse = {
      candidates: [{
        content: {
          parts: [{ text: 'This is a test from Gemini. ' }],
        },
      }],
    };

    (fetch as any).mockResolvedValue(new Response(JSON.stringify(mockApiResponse), { status: 200 }));

    const result = await processor.processFile(mockFile);

    expect(result.serviceName).toBe('Google Gemini');
    expect(result.text).toBe('This is a test from Gemini.'); // Should be trimmed
    expect(result.confidence).toBeUndefined(); // Gemini doesn't provide confidence
    expect(fetch).toHaveBeenCalledTimes(1);

    // Verify the request body structure
    const fetchOptions = (fetch as any).mock.calls[0][1];
    const body = JSON.parse(fetchOptions.body);
    expect(body.contents[0].parts[0].text).toBe("Please transcribe this audio file. Provide only the transcribed text without any additional commentary or formatting.");
    expect(body.contents[0].parts[1].inlineData.mimeType).toBe('audio/mp3');
    expect(body.contents[0].parts[1].inlineData.data).toBeDefined();
    expect(fetchOptions.headers['x-goog-api-key']).toBe('test-gemini-key');
  });

  it('should throw an error if the API call fails', async () => {
    (fetch as any).mockResolvedValue(new Response('API Error', { status: 500, statusText: 'Internal Server Error' }));

    await expect(processor.processFile(createMockFile())).rejects.toThrow('Gemini API error (500)');
  });

  it('should throw an error if the API response contains no candidates', async () => {
    const mockApiResponse = { candidates: [] }; // Empty candidates array
    (fetch as any).mockResolvedValue(new Response(JSON.stringify(mockApiResponse), { status: 200 }));

    await expect(processor.processFile(createMockFile())).rejects.toThrow('Gemini returned no candidates in response.');
  });

   it('should throw an error if the API response is missing the parts array', async () => {
    const mockApiResponse = {
      candidates: [{
        content: {
          // parts array is missing
        },
      }],
    };
    (fetch as any).mockResolvedValue(new Response(JSON.stringify(mockApiResponse), { status: 200 }));

    await expect(processor.processFile(createMockFile())).rejects.toThrow("Cannot read properties of undefined (reading '0')");
  });
});
