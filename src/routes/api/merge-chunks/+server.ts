import { json, type RequestHandler } from '@sveltejs/kit';
import type { TranscriptionResult } from '../../../contracts/transcription';
import { ConsensusComparisonEngine } from '../../../implementations/comparison';

/*
  Merge per-chunk per-service transcripts into a final consensus-like result.
  Input shape:
  {
    chunkTexts: Array<{ index: number; textsByService: Record<string,string> }>
  }

  Strategy:
  - For each service, concatenate its chunk texts in order (with spaces).
  - Build synthetic TranscriptionResult[] with one result per service.
// --- simple dev-only rate limit (same pattern as /api/transcribe) ---
const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS: 20,
  WINDOW_MS: 15 * 60 * 1000 // 15 minutes
};
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function getClientIP(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return null;
}

function cleanupExpiredEntries(now: number) {
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.windowStart >= RATE_LIMIT_CONFIG.WINDOW_MS) rateLimitMap.delete(ip);
  }
}

function checkRateLimit(clientIP: string | null): { allowed: boolean; retryAfter?: number; error?: string } {
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

  - Run the existing comparison engine to produce a ConsensusResult.
  Caveat: token-level confidences won’t exist here; this is intended for large-file assembly.
*/

// --- simple dev-only rate limit (same pattern as /api/transcribe) ---
const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS: 20,
  WINDOW_MS: 15 * 60 * 1000 // 15 minutes
};
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function getClientIP(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return null;
}

function cleanupExpiredEntries(now: number) {
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.windowStart >= RATE_LIMIT_CONFIG.WINDOW_MS) rateLimitMap.delete(ip);
  }
}

function checkRateLimit(clientIP: string | null): { allowed: boolean; retryAfter?: number; error?: string } {
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

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Rate limit check first
    const clientIP = getClientIP(request);
    const rl = checkRateLimit(clientIP);
    if (!rl.allowed) {
      return json(
        { error: rl.error || 'Rate limit exceeded. Too many requests.' },
        { status: rl.error ? 400 : 429, headers: rl.retryAfter ? { 'Retry-After': rl.retryAfter.toString() } : {} }
      );
    }

    const body = await request.json().catch(() => null as any);
    if (!body || typeof body !== 'object') {
      return json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // CSRF: double-submit token validation (body token must match cookie)
    const csrfToken = (body?.csrfToken ?? '') as string;
    const csrfCookie = cookies.get('csrfToken');
    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
      return json({ error: 'Request could not be processed. Please try again.' }, { status: 403 });
    }
    const chunkTexts = Array.isArray(body?.chunkTexts) ? body.chunkTexts : [];
    if (chunkTexts.length === 0) {
      return json({ error: 'No chunk texts provided' }, { status: 400 });
    }

    // Collect service names
    const serviceSet = new Set<string>();
    for (const c of chunkTexts) {
      const map = c?.textsByService || {};
      for (const k of Object.keys(map)) serviceSet.add(k);
    }

    // Concatenate texts per service
    const serviceNames = Array.from(serviceSet.values());
    const results: TranscriptionResult[] = serviceNames.map((svcName) => {
      const ordered = chunkTexts
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .map((c) => (c.textsByService?.[svcName] ?? ''));

      const assembled = mergeWithOverlap(ordered);
      return {
        id: `${svcName}-assembled-${Date.now()}`,
        serviceName: svcName,
        text: assembled,
        processingTimeMs: 0,
        timestamp: new Date(),
        metadata: { assembledFromChunks: true }
      };
    });

    const engine = new ConsensusComparisonEngine();
    const consensus = engine.compareTranscriptions(results);
    return json(consensus);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return json({ error: `Failed to merge chunks: ${msg}` }, { status: 500 });
  }
};

// --- helpers ---
function mergeWithOverlap(chunks: string[]): string {
  let assembled = '';
  for (const next of chunks) {
    const text = (next || '').trim();
    if (!text) continue;
    if (!assembled) {
      assembled = text;
      continue;
    }
    const overlap = computeOverlap(assembled, text);
    if (overlap > 0) {
      assembled += text.slice(overlap);
    } else {
      assembled += ' ' + text;
    }
  }
  return assembled.replace(/\s+/g, ' ').trim();
}

function computeOverlap(a: string, b: string): number {
  const max = Math.min(100, a.length, b.length);
  for (let k = max; k >= 10; k--) {
    const endA = a.slice(-k).toLowerCase();
    const startB = b.slice(0, k).toLowerCase();
    if (endA === startB) return k;
  }
  return 0;
}
