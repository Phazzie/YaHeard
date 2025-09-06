# YaHeard Implementation Plan (Easiest → Hardest)

Purpose: Execute the prioritized fixes efficiently by grouping related work while proceeding from easiest to hardest.

Order summary
- Phase 1 (Quick wins): Gemini formats; smoke tests; build warnings; docs consolidation
- Phase 2 (API correctness): Fallback/stat consistency; confidence normalization
- Phase 3 (Protection): Rate limiting & validation; structured logging/monitoring
- Phase 4 (Performance & quality): Consensus perf opt; automated testing suite

---

## Phase 1 — Quick Wins (Easiest)

1) Fix Gemini format bug
- Goal: getSupportedFormats() returns file extensions, not MIME types
- Files
  - src/implementations/gemini.ts
- Tasks
  - Replace MIME types with extensions like ['.wav', '.mp3', '.m4a', '.ogg', '.webm', '.flac']
  - Sanity check processor compilation
- Acceptance
  - Typecheck passes; UI accepts Gemini-supported extensions

2) Developer smoke test script
- Goal: quick manual verification loop
- Files
  - (script) package.json scripts section or docs
- Tasks
  - Document smoke test steps in README (upload .wav → see ConsensusResult)
  - Optionally add npm run smoke:doc to open docs
- Acceptance
  - Contributor can follow steps to validate end-to-end locally

3) Build warnings & dependency hygiene
- Goal: clean build and basic dependency review
- Files
  - Svelte/CSS: src/lib/components/*, tailwind.css usage
  - package.json (audit optional)
- Tasks
  - Resolve SvelteKit untrack import warning (if present)
  - Remove/adjust unused CSS selectors
  - Run npm audit and note safe upgrades (no breaking changes)
- Acceptance
  - npm run build & npm run check pass without warnings from our code

4) Documentation consolidation
- Goal: reduce markdown noise; fix chronology and outdated claims
- Files
  - README.md, CHANGELOG.md, PROJECT_STATUS.md, PR9_FIX_PLAN.md
- Tasks
  - Keep 4 core docs (README, CHANGELOG, PROJECT_STATUS, PR plan); trim others or link them
  - Ensure CHANGELOG entries are reverse-chronological
  - Remove outdated “mock data” claims if already fixed
- Acceptance
  - Docs reflect reality; navigation is simpler

---

## Phase 2 — API Correctness & Consistency

5) Robust fallback & stats consistency
- Goal: fallback result is deterministic and stats are coherent
- Files
  - src/routes/api/transcribe/+server.ts
- Tasks
  - Ensure fallback picks fastest successful result (already implemented)
  - Stats: totalProcessingTimeMs = max; servicesUsed = count; averageConfidence = average of defined values only
  - Reasoning includes error context when consensus fails
- Acceptance
  - validateConsensusResult passes in fallback; manual test shows coherent stats

6) Normalize confidence handling end-to-end
- Goal: remove hardcoded defaults and standardize undefined handling
- Files
  - src/implementations/comparison.ts
  - src/lib/components/ResultsDisplay.svelte
- Tasks
  - Remove conflicting defaults (e.g., 0.75/0.7) for single-result paths
  - Average confidences from defined values only
  - UI continues to render undefined as N/A
- Acceptance
  - Single-result and multi-result flows produce consistent confidence behavior

---

## Phase 3 — Protection & Monitoring

7) API rate limiting & request validation
- Goal: protect expensive endpoints and enforce inputs
- Files
  - src/routes/api/transcribe/+server.ts
- Tasks
  - Add per-IP/burst rate limiting (lightweight in-memory or edge-friendly approach)
  - Validate file type/size early against SUPPORTED_AUDIO_FORMATS and MAX_FILE_SIZE_BYTES
- Acceptance
  - Legit requests succeed; abusive/bad inputs are rejected with 4xx

8) Structured logging & error monitoring
- Goal: production-grade diagnostics
- Files
  - src/routes/api/transcribe/+server.ts
  - src/implementations/*.ts
- Tasks
  - Add correlation IDs on request boundary; structured logs (serviceName, timings)
  - Centralized error formatting; redact sensitive data
  - Document integration path for a hosted error tracker (optional)
- Acceptance
  - Logs are structured and traceable across a request

---

## Phase 4 — Performance & Quality (Hardest)

9) Consensus performance optimization
- Goal: reduce redundant O(n²) similarity work
- Files
  - src/implementations/comparison.ts
- Tasks
  - Cache pairwise Levenshtein similarity per run (Map keyed by pair)
  - Pass winningText into confidence calc to reuse cached similarities
  - Add simple timing metrics to reasoning or logs for visibility
- Acceptance
  - Same outputs; reduced CPU time for 4–5+ providers

10) Automated testing suite
- Goal: raise confidence and prevent regressions
- Files
  - tests/unit/comparison.spec.ts; tests/integration/api-transcribe.spec.ts
- Tasks
  - Unit tests: similarity ranking, tie-breaks, consensusConfidence math, disagreements
  - Integration tests: mock processors → /api/transcribe → validate ConsensusResult
  - CI: run build/check/test on PR
- Acceptance
  - Green test suite in CI; failures catch regressions in consensus or API

---

## Tracking Checklist
- [x] 1) Gemini getSupportedFormats returns extensions
- [x] 2) Smoke test steps documented and runnable
- [x] 3) Build warnings resolved; audit reviewed
- [ ] 4) Docs consolidated and chronology fixed
- [x] 5) Fallback behavior and stats consistent; validated
- [x] 6) Confidence handling normalized; no conflicting defaults
- [x] 7) Rate limiting and early input validation in API
- [ ] 8) Structured logging and correlation IDs added
- [x] 9) Similarity caching and recomputation minimized
- [ ] 10) Unit & integration tests + CI
