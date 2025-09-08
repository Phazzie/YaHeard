// @ts-nocheck
import { generateCSRFToken } from '$lib/csrf';
import type { PageServerLoad } from './$types';

/**
 * Generate CSRF token for form protection
 */
export const load = async (event: Parameters<PageServerLoad>[0]) => {
  const csrfToken = generateCSRFToken();

  // Set CSRF token as a cookie for double-submit protection (stateless, works on serverless)
  // Browser sends cookie automatically; client also submits token via form field.
  const isHttps = event.url.protocol === 'https:';
  event.cookies.set('csrfToken', csrfToken, {
    path: '/',
    sameSite: 'lax',
    secure: isHttps, // don't mark secure on http://localhost so cookies are sent
    httpOnly: true, // client doesn't need to read it; server compares cookie vs form value
    maxAge: 60 * 30 // 30 minutes
  });

  return {
    csrfToken
  };
};