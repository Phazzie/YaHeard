# Architecture Overview

This project uses a contract-first, regeneration-friendly architecture built on SvelteKit.

## High-level flow

1. Page load (`src/routes/+page.server.ts`)
   - Generates CSRF token and sets a cookie (double-submit pattern)
   - Exposes `csrfToken` to the page for form submission

2. User action (`src/routes/+page.svelte`)
   - Select a file or provide a public URL
   - Optional: enable client-side chunking (~4MB WAV chunks)
   - Submit form to `/api/transcribe` (or loop over chunks)
   - If chunking, collect per-chunk per-service texts and POST to `/api/merge-chunks`

3. API layer
   - `api/transcribe/+server.ts`: Validates CSRF (cookie vs form), applies dev-only rate limiting, fetches remote audio when `audioUrl` is provided, initializes available processors based on env keys, runs all in parallel with timeouts, and computes consensus (with a fallback if the engine fails)
   - `api/merge-chunks/+server.ts`: Overlap-aware concatenation per service and consensus across assembled texts

## Contracts and implementations

- `src/contracts/`
  - `transcription.ts`: Data shapes for `TranscriptionResult`, `ConsensusResult`, etc.
  - `processors.ts`: `AudioProcessor` interface
  - `file-upload.ts`: UI upload contract

- `src/implementations/`
  - `whisper.ts`, `assembly.ts`, `deepgram.ts`, `elevenlabs.ts`, `gemini.ts`: Real service integrations
  - `comparison.ts`: Consensus engine (weighted similarity/jaccard + Levenshtein with decision weights)

## Configuration

- `src/lib/config.ts`: Centralized constants
  - `PERFORMANCE_CONFIG.MAX_FILE_SIZE_BYTES`
  - `PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS`
  - `CONSENSUS_CONFIG` weights and thresholds
  - `QUALITY_CONFIG`, `UI_CONFIG`, `ERROR_CONFIG`

## Security

- Double-submit cookie CSRF (stateless)
- Dev-only in-memory rate limiting (replace with Redis for production)
- Minimal error detail in production responses

## UI Components

- `src/lib/components/ResultsDisplay.svelte`: Displays final text, per-service stats, token-level confidence visualization, contested tokens list, tooltips, and legend
- `src/lib/components/FileUpload.svelte`: Basic upload controls
- `src/lib/components/ProgressBar.svelte`: Visual progress indicator

## Regeneration seams

Critical areas contain regeneration boundary comments. Implementations can be regenerated independently by keeping contract interfaces stable.
