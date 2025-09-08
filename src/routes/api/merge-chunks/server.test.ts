import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import { ConsensusComparisonEngine } from '../../../implementations/comparison';
import type { RequestEvent } from '@sveltejs/kit';

// Mock the consensus engine
vi.mock('../../../implementations/comparison');

// Mock security functions
vi.mock('$lib/security', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  getClientIP: vi.fn(() => '127.0.0.1'),
  validateCsrfFromJson: vi.fn(() => true),
}));

describe('/api/merge-chunks POST', () => {
  const mockCompareTranscriptions = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    (ConsensusComparisonEngine as any).mockImplementation(() => ({
      compareTranscriptions: mockCompareTranscriptions,
    }));
  });

  const createMockRequest = (body: any, csrfToken?: string): RequestEvent => {
    const request = new Request('http://localhost/api/merge-chunks', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    const cookies = {
      get: vi.fn().mockImplementation((name) => (name === 'csrfToken' ? csrfToken : undefined)),
    } as any;

    return { request, cookies } as unknown as RequestEvent;
  };

  it('should correctly assemble chunks and produce a consensus', async () => {
    const mockBody = {
      csrfToken: 'valid-token',
      chunkTexts: [
        { index: 0, textsByService: { Whisper: 'Hello world this', Deepgram: 'Hello world this' } },
        { index: 1, textsByService: { Whisper: 'this is a test.', Deepgram: 'this is a test.' } },
      ],
    };
    const event = createMockRequest(mockBody, 'valid-token');

    mockCompareTranscriptions.mockReturnValue({ finalText: 'Hello world this is a test.' });

    const response = await POST(event);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(mockCompareTranscriptions).toHaveBeenCalledTimes(1);

    // Check that the chunks were correctly assembled before being passed to the engine
    const resultsArg = mockCompareTranscriptions.mock.calls[0][0];
    const whisperResult = resultsArg.find((r: any) => r.serviceName === 'Whisper');
    const deepgramResult = resultsArg.find((r: any) => r.serviceName === 'Deepgram');

    expect(whisperResult.text).toBe('Hello world this is a test.');
    expect(deepgramResult.text).toBe('Hello world this is a test.');
    expect(result.finalText).toBe('Hello world this is a test.');
  });

   it('should handle non-overlapping chunks by adding a space', async () => {
    const mockBody = {
      csrfToken: 'valid-token',
      chunkTexts: [
        { index: 0, textsByService: { Whisper: 'First part.' } },
        { index: 1, textsByService: { Whisper: 'Second part.' } },
      ],
    };
    const event = createMockRequest(mockBody, 'valid-token');
    await POST(event);

    const resultsArg = mockCompareTranscriptions.mock.calls[0][0];
    const whisperResult = resultsArg.find((r: any) => r.serviceName === 'Whisper');
    expect(whisperResult.text).toBe('First part. Second part.');
  });

  it('should return 400 for an invalid JSON body', async () => {
    const request = new Request('http://localhost/api/merge-chunks', {
        method: 'POST',
        body: 'not-json',
    });
    const event = { request, cookies: { get: () => 'valid-token' } as any } as RequestEvent;
    const response = await POST(event);
    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.error).toBe('Invalid JSON body');
  });

  it('should return 400 if chunkTexts is missing or empty', async () => {
    const event = createMockRequest({ csrfToken: 'valid-token', chunkTexts: [] }, 'valid-token');
    const response = await POST(event);
    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.error).toBe('No chunk texts provided');
  });

  it('should return 403 for an invalid CSRF token', async () => {
    const security = await import('$lib/security');
    (security.validateCsrfFromJson as any).mockReturnValue(false);
    const event = createMockRequest({ chunkTexts: [{ index: 0, textsByService: {} }] }, 'invalid-token');
    const response = await POST(event);
    expect(response.status).toBe(403);
  });
});
