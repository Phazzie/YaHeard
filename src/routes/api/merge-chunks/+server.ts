import { json, type RequestHandler } from '@sveltejs/kit';
import type { TranscriptionResult } from '../../../contracts/transcription';
import { ConsensusComparisonEngine } from '../../../implementations/comparison';
import { checkRateLimit, getClientIP, validateCsrfFromJson } from '$lib/security';

/*
  Merge per-chunk per-service transcripts into a final consensus-like result.
  Input shape:
  {
    chunkTexts: Array<{ index: number; textsByService: Record<string,string> }>
  }

  Strategy:
  - For each service, concatenate its chunk texts in order (with spaces).
  - Build synthetic TranscriptionResult[] with one result per service.

  - Run the existing comparison engine to produce a ConsensusResult.
  Caveat: token-level confidences won’t exist here; this is intended for large-file assembly.
*/


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
    const csrfCookie = cookies.get('csrfToken');
    if (!validateCsrfFromJson(body, csrfCookie)) {
      return json({ error: 'Request could not be processed. Please try again.' }, { status: 403 });
    }
    const chunkTexts: Array<{ index: number; textsByService: Record<string, string> }>
      = Array.isArray(body?.chunkTexts) ? body.chunkTexts : [];
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
