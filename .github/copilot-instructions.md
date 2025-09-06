# Copilot instructions for YaHeard

Purpose: concise, project‑specific guidance for AI agents working on this SvelteKit + TypeScript multi‑AI transcription app.

## Roadmap checklist (from repo status)
- Fix Gemini format bug: make `getSupportedFormats()` return extensions, not MIME types (`src/implementations/gemini.ts`).
- Normalize confidence handling across processors and consensus (see `TranscriptionResult.confidence`).
- Reduce O(n²) similarity cost in `implementations/comparison.ts` if performance becomes an issue.

## Architecture (what lives where)
- Contracts `src/contracts/`: `transcription.ts` (types + validators), `processors.ts` (`AudioProcessor`, `ComparisonEngine`).
- Implementations `src/implementations/`: processors (`whisper.ts`, `assembly.ts`, `deepgram.ts`, `elevenlabs.ts`, `gemini.ts`) + consensus (`comparison.ts`).
- API: `src/routes/api/transcribe/+server.ts` orchestrates processors → consensus → returns `ConsensusResult`.
- UI: `src/routes/+page.svelte` with components in `src/lib/components/`.
- Config: `src/lib/config.ts` (weights, thresholds, 25MB upload limit); adapter configured in `svelte.config.js`.

## Dev workflow
- Node 20. Scripts: `dev`, `build`, `preview`, `check`.
- Env: copy `.env.example` → `.env`; set at least one API key (OPENAI/ASSEMBLYAI/DEEPGRAM/ELEVENLABS/GEMINI) or the API returns 500.

## Contracts to preserve
- `TranscriptionResult`: `{ id, serviceName, text, processingTimeMs, timestamp, confidence?, metadata? }` (set `timestamp: new Date()`).
- API returns `ConsensusResult`: `{ finalText, consensusConfidence, individualResults, disagreements, stats, reasoning }` to the UI.
- Use `validateConsensusResult` / `validateTranscriptionResult` from `contracts/transcription.ts` when constructing outputs.

## Consensus behavior
- Weights in `lib/config.ts`: similarity 0.7, confidence 0.2, speed 0.1.
- `comparison.ts`: rank by avg Levenshtein similarity; tie‑break by confidence then service name.
- API fallback: if consensus throws, return the fastest successful result as minimal `ConsensusResult`.

## Processor integration
- Implement `AudioProcessor` in `src/implementations/<name>.ts`; return extensions from `getSupportedFormats()`.
- In `processFile(file)`: measure `processingTimeMs`, set `timestamp: new Date()`, mirror `whisper.ts` shape.
- Register in `initializeProcessors()` in `api/transcribe/+server.ts`, gated by `process.env.<KEY>`.

## Server route and UI
- POST `/api/transcribe` expects `FormData` key `audio`; missing file → 400; no services/all failed → 500.
- Each processor wrapped with `Promise.race` using `PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS`; failures return `null`.
- `+page.svelte` expects the `ConsensusResult` shape; breaking it will break `ResultsDisplay.svelte`.

## Local gotchas
- Gemini formats mismatch (MIME vs extensions) — align to extensions when touching it.
- `consensusConfidence` renders as a percent in the UI; keep weights coherent.
- Uploads capped at 25MB via config (`PERFORMANCE_CONFIG.MAX_FILE_SIZE_BYTES`).

## Tiny examples
- Processor format contract:
	```ts
	getSupportedFormats(): string[] { return ['.wav', '.mp3', '.m4a', '.ogg', '.flac']; }
	```
- Minimal client call:
	```ts
	const fd = new FormData(); fd.append('audio', file);
	const r = await fetch('/api/transcribe', { method: 'POST', body: fd });
	```

## Quick quality gates
- Build/typecheck: `npm run build` and `npm run check` before committing.
- Contract sanity: ensure `validateConsensusResult(...)` passes after consensus changes.
- UI smoke: upload a small `.wav` and verify `ResultsDisplay.svelte` renders `finalText` and confidence.