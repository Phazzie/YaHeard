import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssemblyAIProcessor } from './assembly';

// Mock the global fetch function
const fetchMock = vi.spyOn(global, 'fetch');

// Helper to create a mock File object
const createMockFile = () => new File(['dummy audio content'], 'audio.mp3', { type: 'audio/mp3' });

describe('AssemblyAIProcessor', () => {
  let processor: AssemblyAIProcessor;

  beforeEach(() => {
    vi.resetAllMocks();
    processor = new AssemblyAIProcessor({ apiKey: 'test-assembly-key' });
  });

  it('should return true for isAvailable when an API key is provided', async () => {
    expect(await processor.isAvailable()).toBe(true);
  });

  it('should return false for isAvailable when an API key is not provided', async () => {
    const p = new AssemblyAIProcessor();
    expect(await p.isAvailable()).toBe(false);
  });

  it('should throw an error if no API key is configured during processing', async () => {
    const p = new AssemblyAIProcessor();
    await expect(p.processFile(createMockFile())).rejects.toThrow('AssemblyAI API key not configured.');
  });

  it('should handle the full upload, transcribe, and poll process successfully', async () => {
    const mockFile = createMockFile();
    const mockUploadUrl = 'https://cdn.assemblyai.com/upload/123';
    const mockTranscriptId = 'abc';
    const mockCompletedResponse = {
      id: mockTranscriptId,
      status: 'completed',
      text: 'This is a test from AssemblyAI.',
      confidence: 0.97,
      language_code: 'en',
      words: [{ text: 'word' }],
    };

    // Mock the sequence of fetch calls
    fetchMock
      // 1. Upload call
      .mockResolvedValueOnce(new Response(JSON.stringify({ upload_url: mockUploadUrl }), { status: 200 }))
      // 2. Transcription request call
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: mockTranscriptId }), { status: 200 }))
      // 3. First poll (processing)
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: mockTranscriptId, status: 'processing' }), { status: 200 }))
      // 4. Second poll (completed)
      .mockResolvedValueOnce(new Response(JSON.stringify(mockCompletedResponse), { status: 200 }));

    const result = await processor.processFile(mockFile);

    expect(result.serviceName).toBe('AssemblyAI');
    expect(result.text).toBe('This is a test from AssemblyAI.');
    expect(result.confidence).toBe(0.97);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    // Check that the correct endpoints were called
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.assemblyai.com/v2/upload');
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.assemblyai.com/v2/transcript');
    expect(fetchMock.mock.calls[2][0]).toBe(`https://api.assemblyai.com/v2/transcript/${mockTranscriptId}`);
  });

  it('should throw an error if the upload fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Upload failed', { status: 500 }));

    await expect(processor.processFile(createMockFile())).rejects.toThrow('Upload failed with status 500');
  });

  it('should throw an error if the transcription request fails', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ upload_url: 'some_url' }), { status: 200 }))
      .mockResolvedValueOnce(new Response('Transcription request failed', { status: 500 }));

    await expect(processor.processFile(createMockFile())).rejects.toThrow('Transcription request failed with status 500');
  });

  it('should throw an error if the polling returns a failed status', async () => {
    const mockTranscriptId = 'abc';
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ upload_url: 'some_url' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: mockTranscriptId }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'error', error: 'Transcription failed miserably' }), { status: 200 }));

    await expect(processor.processFile(createMockFile())).rejects.toThrow('Transcription failed: Transcription failed miserably');
  });

  it('should throw an error if polling times out', async () => {
    const mockTranscriptId = 'abc';
    // Mock upload and transcribe request
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ upload_url: 'some_url' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: mockTranscriptId }), { status: 200 }));

    // Mock polling to always return 'processing'
    fetchMock.mockImplementation((url) => {
        if (url === `https://api.assemblyai.com/v2/transcript/${mockTranscriptId}`) {
            return Promise.resolve(new Response(JSON.stringify({ status: 'processing' }), { status: 200 }));
        }
        // This shouldn't be reached in this test
        return Promise.resolve(new Response('Unexpected call', { status: 500 }));
    });

    // We need to use fake timers to avoid waiting 30 seconds for the test to run
    vi.useFakeTimers();
    const processPromise = processor.processFile(createMockFile());
    // Advance timers by 31 seconds to ensure all polling attempts are made
    await vi.advanceTimersByTimeAsync(31000);

    await expect(processPromise).rejects.toThrow('Transcription polling timed out after 30 seconds.');

    vi.useRealTimers();
  });
});
