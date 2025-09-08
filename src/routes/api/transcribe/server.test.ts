import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import { ConsensusComparisonEngine } from '../../../implementations/comparison';
import { WhisperProcessor } from '../../../implementations/whisper';
import { DeepgramProcessor } from '../../../implementations/deepgram';
import type { RequestEvent } from '@sveltejs/kit';

// Mock the implementations
vi.mock('../../../implementations/whisper');
vi.mock('../../../implementations/deepgram');
vi.mock('../../../implementations/comparison');

// Mock the security functions
vi.mock('$lib/security', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  getClientIP: vi.fn(() => '127.0.0.1'),
  validateCsrfFromForm: vi.fn(() => true),
}));

describe('/api/transcribe POST', () => {
  // Mock implementations of the processors
  const mockWhisperProcessFile = vi.fn();
  const mockDeepgramProcessFile = vi.fn();
  const mockCompareTranscriptions = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // Set up the mock implementations for each test
    (WhisperProcessor as any).mockImplementation(() => ({
      processFile: mockWhisperProcessFile,
    }));
    (DeepgramProcessor as any).mockImplementation(() => ({
      processFile: mockDeepgramProcessFile,
    }));
    (ConsensusComparisonEngine as any).mockImplementation(() => ({
      compareTranscriptions: mockCompareTranscriptions,
    }));

    // Stub environment variables to simulate enabled processors
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubEnv('DEEPGRAM_API_KEY', 'test-key');
    vi.stubEnv('ASSEMBLYAI_API_KEY', ''); // Ensure others are disabled
    vi.stubEnv('ELEVENLABS_API_KEY', '');
    vi.stubEnv('GEMINI_API_KEY', '');
  });

  const createMockRequest = (formData: FormData, csrfToken?: string): RequestEvent => {
    const request = new Request('http://localhost/api/transcribe', {
      method: 'POST',
      body: formData,
    });
    const cookies = {
      get: vi.fn().mockImplementation((name) => (name === 'csrfToken' ? csrfToken : undefined)),
    } as any;

    return { request, cookies, fetch: vi.fn() } as unknown as RequestEvent;
  };

  it('should successfully process a file and return a consensus', async () => {
    const formData = new FormData();
    formData.append('audio', new File(['...'], 'test.mp3'));
    formData.append('csrfToken', 'valid-token');

    const event = createMockRequest(formData, 'valid-token');

    // Mock service responses
    mockWhisperProcessFile.mockResolvedValue({ serviceName: 'Whisper', text: 'hello' });
    mockDeepgramProcessFile.mockResolvedValue({ serviceName: 'Deepgram', text: 'hello world' });
    mockCompareTranscriptions.mockReturnValue({ finalText: 'hello world' });

    const response = await POST(event);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(mockWhisperProcessFile).toHaveBeenCalled();
    expect(mockDeepgramProcessFile).toHaveBeenCalled();
    expect(mockCompareTranscriptions).toHaveBeenCalledWith([
        { serviceName: 'Whisper', text: 'hello' },
        { serviceName: 'Deepgram', text: 'hello world' },
    ]);
    expect(result.finalText).toBe('hello world');
  });

  it('should return a 403 error for an invalid CSRF token', async () => {
    const formData = new FormData();
    formData.append('audio', new File(['...'], 'test.mp3'));
    formData.append('csrfToken', 'invalid-token');

    // Import security mock and set validateCsrfFromForm to return false for this test
    const security = await import('$lib/security');
    (security.validateCsrfFromForm as any).mockReturnValue(false);

    const event = createMockRequest(formData, 'different-token-in-cookie');
    const response = await POST(event);

    expect(response.status).toBe(403);
  });

  it('should return a 400 error if no audio file is provided', async () => {
    const formData = new FormData(); // Empty form data
    formData.append('csrfToken', 'valid-token');
    const event = createMockRequest(formData, 'valid-token');

    const response = await POST(event);
    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.error).toBe('No audio file or URL provided.');
  });

   it('should use fallback logic if consensus engine fails', async () => {
    const formData = new FormData();
    formData.append('audio', new File(['...'], 'test.mp3'));
    formData.append('csrfToken', 'valid-token');
    const event = createMockRequest(formData, 'valid-token');

    // Mock service responses, with Deepgram being faster
    mockWhisperProcessFile.mockResolvedValue({ serviceName: 'Whisper', text: 'whisper text', processingTimeMs: 2000 });
    mockDeepgramProcessFile.mockResolvedValue({ serviceName: 'Deepgram', text: 'deepgram text', processingTimeMs: 1000 });
    // Make the consensus engine throw an error
    mockCompareTranscriptions.mockImplementation(() => {
        throw new Error('Consensus explosion!');
    });

    const response = await POST(event);
    const result = await response.json();

    expect(response.status).toBe(200);
    // The fallback should select the fastest result
    expect(result.finalText).toBe('deepgram text');
    expect(result.reasoning.finalReasoning).toContain('Fallback to fastest provider: Deepgram');
  });

  it('should return a 500 error if all AI services fail', async () => {
    const formData = new FormData();
    formData.append('audio', new File(['...'], 'test.mp3'));
    formData.append('csrfToken', 'valid-token');
    const event = createMockRequest(formData, 'valid-token');

    // Mock services to return null (as if they timed out or failed)
    mockWhisperProcessFile.mockResolvedValue(null);
    mockDeepgramProcessFile.mockResolvedValue(null);

    const response = await POST(event);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe('All AI services failed to process the audio file.');
  });
});
