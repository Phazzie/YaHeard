import { j as json } from './index-BIAFQWR9.js';
import { g as getClientIP, c as checkRateLimit, v as validateCsrfFromJson, C as ConsensusComparisonEngine } from './security-C7mvuoNL.js';
import './transcription-G03f1VOB.js';

const POST = async ({ request, cookies }) => {
  try {
    const clientIP = getClientIP(request);
    const rl = checkRateLimit(clientIP);
    if (!rl.allowed) ;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const csrfCookie = cookies.get("csrfToken");
    if (!validateCsrfFromJson(body, csrfCookie)) {
      return json({ error: "Request could not be processed. Please try again." }, { status: 403 });
    }
    const chunkTexts = Array.isArray(body?.chunkTexts) ? body.chunkTexts : [];
    if (chunkTexts.length === 0) {
      return json({ error: "No chunk texts provided" }, { status: 400 });
    }
    const serviceSet = /* @__PURE__ */ new Set();
    for (const c of chunkTexts) {
      const map = c?.textsByService || {};
      for (const k of Object.keys(map)) serviceSet.add(k);
    }
    const serviceNames = Array.from(serviceSet.values());
    const results = serviceNames.map((svcName) => {
      const ordered = chunkTexts.sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map((c) => c.textsByService?.[svcName] ?? "");
      const assembled = mergeWithOverlap(ordered);
      return {
        id: `${svcName}-assembled-${Date.now()}`,
        serviceName: svcName,
        text: assembled,
        processingTimeMs: 0,
        timestamp: /* @__PURE__ */ new Date(),
        metadata: { assembledFromChunks: true }
      };
    });
    const engine = new ConsensusComparisonEngine();
    const consensus = engine.compareTranscriptions(results);
    return json(consensus);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: `Failed to merge chunks: ${msg}` }, { status: 500 });
  }
};
function mergeWithOverlap(chunks) {
  let assembled = "";
  for (const next of chunks) {
    const text = (next || "").trim();
    if (!text) continue;
    if (!assembled) {
      assembled = text;
      continue;
    }
    const overlap = computeOverlap(assembled, text);
    if (overlap > 0) {
      assembled += text.slice(overlap);
    } else {
      assembled += " " + text;
    }
  }
  return assembled.replace(/\s+/g, " ").trim();
}
function computeOverlap(a, b) {
  const max = Math.min(100, a.length, b.length);
  for (let k = max; k >= 10; k--) {
    const endA = a.slice(-k).toLowerCase();
    const startB = b.slice(0, k).toLowerCase();
    if (endA === startB) return k;
  }
  return 0;
}

export { POST };
//# sourceMappingURL=_server.ts-Dz88llo_.js.map
