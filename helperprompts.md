# Helper Prompts and Architectural Notes (Updated)

STATUS SNAPSHOT (2025-09-06)
- Implemented: Per-IP rate limiting on /api/transcribe
- Implemented: Structured JSON logging (requestId, route, ip)
- Implemented: Gemini getSupportedFormats() returns extensions (not MIME)
- Implemented: Unit tests (Vitest) for consensus and Gemini
- Pending: Confidence normalization, similarity cache, MIME/magic-byte sniffing, CI

---

==================== ARCHITECTURAL FEEDBACK ====================

CRITICAL SECURITY ISSUES:
- API keys stored in environment variables without validation (acceptable; consider runtime validation)
- Content Security Policy headers not configured globally (hooks.server.ts candidate)
- Request size validation beyond file size not implemented (consider total payload limits)
- Rate limiting: Implemented per-IP token bucket at API layer

PERFORMANCE BOTTLENECKS:
- Quadratic complexity in consensus algorithm (O(n²) similarity calculations) — add pairwise cache
- No caching of transcription results (by audio hash) — optional
- All AI services called in parallel without throttling (acceptable for low concurrency)
- Memory not explicitly freed after processing large files (Node GC adequate; monitor)

RELIABILITY GAPS:
- No circuit breaker for repeatedly failing services
- Retry logic limited to internal service implementations
- Missing health check endpoint (candidate: /api/health)
- Graceful degradation present: fastest-result fallback on consensus failure

DEPLOYMENT BLOCKERS:
- .env.example recommended; not yet committed
- No environment variable validation module committed (planned)
- No CI pipeline (typecheck/build/test)
- No error tracking instrumentation (Sentry) wired

---

==================== PROMPT 1 HELPER SECTION (HISTORICAL) ====================

NOTE: The Gemini fix below is already implemented. Keep for reference only.

FILE: /workspaces/YaHeard/src/implementations/gemini.ts
MODIFICATION: Fix getSupportedFormats() method (line 98)
```typescript
  getSupportedFormats(): string[] {
    // Return file extensions, not MIME types
    return ['.wav', '.mp3', '.m4a', '.ogg', '.flac'];
  }
```

FILE: /workspaces/YaHeard/.env.example
CREATE NEW FILE:
```bash
# Required API Keys (at least one must be configured)
OPENAI_API_KEY=
ASSEMBLYAI_API_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=

# Optional: Error Monitoring
SENTRY_DSN=

# Optional: Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
```

FILE: /workspaces/YaHeard/src/lib/env-validator.ts
CREATE NEW FILE:
```typescript
export interface EnvConfig {
  apis: {
    openai?: string;
    assemblyai?: string;
    deepgram?: string;
    elevenlabs?: string;
    gemini?: string;
  };
  monitoring: {
    sentryDsn?: string;
  };
  rateLimit: {
    requests: number;
    windowMs: number;
  };
}

export function validateEnvironment(): EnvConfig {
  const apis = {
    openai: process.env.OPENAI_API_KEY,
    assemblyai: process.env.ASSEMBLYAI_API_KEY,
    deepgram: process.env.DEEPGRAM_API_KEY,
    elevenlabs: process.env.ELEVENLABS_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  };

  // Ensure at least one API key is configured
  const hasAtLeastOneApi = Object.values(apis).some(key => !!key);
  if (!hasAtLeastOneApi) {
    throw new Error('At least one AI service API key must be configured. Check your .env file.');
  }

  // Validate API key formats (basic validation)
  Object.entries(apis).forEach(([name, key]) => {
    if (key && key.length < 10) {
      console.warn(`Warning: ${name} API key seems too short. Please verify it's correct.`);
    }
  });

  return {
    apis,
    monitoring: {
      sentryDsn: process.env.SENTRY_DSN
    },
    rateLimit: {
      requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '10'),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
    }
  };
}

// Validate on module load
if (typeof process !== 'undefined' && process.env) {
  try {
    validateEnvironment();
    console.log('✅ Environment validation passed');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
```

FILE: /workspaces/YaHeard/src/hooks.server.ts
CREATE NEW FILE:
```typescript
import type { Handle } from '@sveltejs/kit';
import { validateEnvironment } from '$lib/env-validator';

// Validate environment on server startup
validateEnvironment();

export const handle: Handle = async ({ event, resolve }) => {
  // Add request timing
  const start = Date.now();
  
  const response = await resolve(event);
  
  // Add basic security headers (will be enhanced in Prompt 2)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Add timing header for monitoring
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);
  
  return response;
};
```

FILE: /workspaces/YaHeard/vercel.json
CREATE NEW FILE:
```json
{
  "functions": {
    "src/routes/api/transcribe/+server.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

The remaining helper sections are kept for future work; adjust as features land to avoid drift.