import { describe, it, expect, vi } from 'vitest';
import { load } from './+page.server';
import * as csrf from '$lib/csrf';
import type { PageServerLoadEvent } from './$types';

vi.mock('$lib/csrf', () => ({
  generateCSRFToken: vi.fn(() => 'mock-csrf-token'),
}));

describe('+page.server.ts load function', () => {
  it('should generate a CSRF token and set it as a cookie', async () => {
    const cookies = {
      set: vi.fn(),
    };

    const event = {
      cookies,
      url: new URL('https://example.com'),
    } as unknown as PageServerLoadEvent;

    const result = await load(event);

    expect(csrf.generateCSRFToken).toHaveBeenCalled();
    expect(result.csrfToken).toBe('mock-csrf-token');
    expect(cookies.set).toHaveBeenCalledWith(
      'csrfToken',
      'mock-csrf-token',
      expect.objectContaining({
        path: '/',
        sameSite: 'lax',
        secure: true,
        httpOnly: true,
      })
    );
  });

  it('should set the secure flag to false when on http', async () => {
    const cookies = {
        set: vi.fn(),
      };

      const event = {
        cookies,
        url: new URL('http://localhost'),
      } as unknown as PageServerLoadEvent;

      await load(event);

      expect(cookies.set).toHaveBeenCalledWith(
        'csrfToken',
        'mock-csrf-token',
        expect.objectContaining({
          secure: false,
        })
      );
  });
});
