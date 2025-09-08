import { dev } from '$app/environment';

// Shared types
export type RateLimitResult = { allowed: boolean; retryAfter?: number; error?: string };

// Config for dev-only in-memory rate limiting
const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS: 10,
  WINDOW_MS: 15 * 60 * 1000 // 15 minutes
};

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

export function getClientIP(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return null;
}

function cleanupExpiredEntries(now: number) {
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.windowStart >= RATE_LIMIT_CONFIG.WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}

// Dev-only in-memory rate limiter; in prod, always allow and no memory use
export function checkRateLimit(clientIP: string | null): RateLimitResult {
  if (!dev) return { allowed: true };
  if (!clientIP) return { allowed: false, error: 'Could not determine client IP address for rate limiting' };
  const now = Date.now();
  cleanupExpiredEntries(now);
  const entry = rateLimitMap.get(clientIP);
  if (!entry) {
    rateLimitMap.set(clientIP, { count: 1, windowStart: now });
    return { allowed: true };
  }
  if (now - entry.windowStart >= RATE_LIMIT_CONFIG.WINDOW_MS) {
    rateLimitMap.set(clientIP, { count: 1, windowStart: now });
    return { allowed: true };
  }
  if (entry.count < RATE_LIMIT_CONFIG.MAX_REQUESTS) {
    entry.count++;
    return { allowed: true };
  }
  const timeRemaining = RATE_LIMIT_CONFIG.WINDOW_MS - (now - entry.windowStart);
  return { allowed: false, retryAfter: Math.ceil(timeRemaining / 1000) };
}

// CSRF validators
export function validateCsrfFromForm(formData: FormData, csrfCookie: string | undefined): boolean {
  const csrfToken = (formData.get('csrfToken') as string) || '';
  return Boolean(csrfCookie) && csrfToken === csrfCookie;
}

export function validateCsrfFromJson(body: any, csrfCookie: string | undefined): boolean {
  const csrfToken = (body?.csrfToken as string) || '';
  return Boolean(csrfCookie) && csrfToken === csrfCookie;
}
