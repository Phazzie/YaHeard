==================== ARCHITECTURAL FEEDBACK ====================

CRITICAL SECURITY ISSUES:
- API keys stored in environment variables without validation
- No rate limiting on transcription endpoint (financial DoS risk)
- Missing Content Security Policy headers
- No request size validation beyond file size

PERFORMANCE BOTTLENECKS:
- Quadratic complexity in consensus algorithm (O(n²) similarity calculations)
- No caching of transcription results
- All AI services called in parallel without throttling
- Memory not explicitly freed after processing large files

RELIABILITY GAPS:
- No circuit breaker for failing services
- No retry logic for transient failures
- Missing health check endpoints
- No graceful degradation when services are unavailable

DEPLOYMENT BLOCKERS:
- Missing .env.example file
- No environment variable validation
- Build warnings affect production bundle
- No error tracking in production

==================== PROMPT 1 HELPER SECTION ====================

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

==================== PROMPT 1 VERIFICATION ====================

1. Check Gemini fix:
```bash
grep -n "getSupportedFormats" src/implementations/gemini.ts
# Should show return ['.wav', '.mp3', ...] not ['audio/wav', ...]
```

2. Verify environment validation:
```bash
# Test with no API keys
unset OPENAI_API_KEY ASSEMBLYAI_API_KEY DEEPGRAM_API_KEY ELEVENLABS_API_KEY GEMINI_API_KEY
npm run build
# Should see error about missing API keys

# Test with at least one key
export OPENAI_API_KEY="test-key-12345"
npm run build
# Should see "✅ Environment validation passed"
```

3. Check all new files exist:
```bash
ls -la .env.example src/lib/env-validator.ts src/hooks.server.ts vercel.json
```

==================== PROMPT 1 ROLLBACK ====================

```bash
# Revert Gemini changes
git checkout -- src/implementations/gemini.ts

# Remove new files
rm -f .env.example src/lib/env-validator.ts src/hooks.server.ts vercel.json

# Rebuild
npm run build
```

==================== PROMPT 2 HELPER SECTION ====================

FILE: /workspaces/YaHeard/src/lib/monitoring.ts
CREATE NEW FILE:
```typescript
import * as Sentry from '@sentry/sveltekit';

export function initializeSentry(dsn?: string) {
  if (!dsn) {
    console.log('Sentry DSN not configured, error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  console.log('✅ Sentry error monitoring initialized');
}

export function captureError(error: unknown, context?: Record<string, any>) {
  console.error('Error captured:', error, context);
  
  if (typeof window !== 'undefined' && window.Sentry) {
    Sentry.captureException(error, {
      extra: context
    });
  }
}
```

FILE: /workspaces/YaHeard/src/hooks.server.ts
REPLACE ENTIRE FILE:
```typescript
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { validateEnvironment } from '$lib/env-validator';
import { initializeSentry, captureError } from '$lib/monitoring';

// Initialize on server startup
const env = validateEnvironment();
initializeSentry(env.monitoring.sentryDsn);

// Security headers configuration
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.sentry.io"
};

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  
  try {
    const response = await resolve(event);
    
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add timing header
    response.headers.set('X-Response-Time', `${Date.now() - start}ms`);
    
    return response;
  } catch (error) {
    captureError(error, {
      url: event.url.pathname,
      method: event.request.method
    });
    throw error;
  }
};

export const handleError: HandleServerError = async ({ error, event }) => {
  captureError(error, {
    url: event.url.pathname,
    method: event.request.method,
    headers: Object.fromEntries(event.request.headers.entries())
  });

  return {
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : (error as any)?.message || 'Unknown error'
  };
};
```

FILE: /workspaces/YaHeard/src/routes/api/health/+server.ts
CREATE NEW FILE:
```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      assemblyai: !!process.env.ASSEMBLYAI_API_KEY,
      deepgram: !!process.env.DEEPGRAM_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
    },
    monitoring: {
      sentry: !!process.env.SENTRY_DSN
    }
  };

  const activeServices = Object.values(healthCheck.services).filter(Boolean).length;
  
  if (activeServices === 0) {
    return json({
      ...healthCheck,
      status: 'unhealthy',
      error: 'No AI services configured'
    }, { status: 503 });
  }

  return json(healthCheck);
};
```

FILE: /workspaces/YaHeard/package.json
MODIFY: Add Sentry dependency (add to dependencies section)
```json
{
  "dependencies": {
    "@sentry/sveltekit": "^7.100.0"
  }
}
```

==================== PROMPT 2 VERIFICATION ====================

1. Install new dependencies:
```bash
npm install
```

2. Test health endpoint:
```bash
npm run dev
curl http://localhost:5173/api/health
# Should return JSON with service status
```

3. Verify security headers:
```bash
curl -I http://localhost:5173
# Should see X-Frame-Options, Content-Security-Policy, etc.
```

4. Test error handling (create intentional error):
```bash
# Temporarily modify src/routes/api/transcribe/+server.ts to throw error
echo 'throw new Error("Test error");' >> src/routes/api/transcribe/+server.ts
npm run dev
# Make request and check console for error capture
git checkout -- src/routes/api/transcribe/+server.ts
```

==================== PROMPT 2 ROLLBACK ====================

```bash
# Remove Sentry dependency
npm uninstall @sentry/sveltekit

# Remove new files
rm -f src/lib/monitoring.ts src/routes/api/health/+server.ts

# Restore original hooks.server.ts from Prompt 1
git checkout -- src/hooks.server.ts

# Rebuild
npm run build
```

==================== PROMPT 3 HELPER SECTION ====================

FILE: /workspaces/YaHeard/src/lib/rate-limiter.ts
CREATE NEW FILE:
```typescript
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.store[identifier];

    if (!record || now > record.resetTime) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const record = this.store[identifier];
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - record.count);
  }

  private cleanup() {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_REQUESTS || '10'),
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
);
```

FILE: /workspaces/YaHeard/src/routes/api/transcribe/+server.ts
MODIFY: Add rate limiting (insert at beginning of POST handler, line ~19)
```typescript
import { rateLimiter } from '$lib/rate-limiter';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  // Rate limiting
  const clientIp = getClientAddress();
  if (!rateLimiter.isAllowed(clientIp)) {
    return json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60'
        }
      }
    );
  }

  // Add rate limit headers to all responses
  const remaining = rateLimiter.getRemainingRequests(clientIp);
  const headers = {
    'X-RateLimit-Remaining': remaining.toString()
  };

  try {
    // ... existing code ...
```

FILE: /workspaces/YaHeard/src/implementations/comparison.ts
MODIFY: Optimize calculateConsensus method (replace lines 96-128)
```typescript
  private calculateConsensus(results: TranscriptionResult[]): string {
    // Cache similarity calculations to avoid redundant computation
    const similarityCache = new Map<string, number>();
    
    const getCacheKey = (text1: string, text2: string): string => {
      return text1.length <= text2.length ? `${text1}|${text2}` : `${text2}|${text1}`;
    };
    
    const getCachedSimilarity = (text1: string, text2: string): number => {
      const key = getCacheKey(text1, text2);
      if (!similarityCache.has(key)) {
        similarityCache.set(key, this.calculateLevenshteinSimilarity(text1, text2));
      }
      return similarityCache.get(key)!;
    };

    // Use cached similarity for calculations
    const resultsWithScores = results.map(candidate => {
      const otherResults = results.filter(r => r.serviceName !== candidate.serviceName);
      const totalSimilarity = otherResults.reduce((sum, other) => {
        return sum + getCachedSimilarity(candidate.text, other.text);
      }, 0);
      const averageSimilarity = otherResults.length > 0 ? totalSimilarity / otherResults.length : 1.0;

      return {
        ...candidate,
        averageSimilarity,
        score: averageSimilarity * 0.7 + (candidate.confidence || 0.5) * 0.3
      };
    });

    // Sort by combined score
    resultsWithScores.sort((a, b) => b.score - a.score);
    
    return resultsWithScores[0].text;
  }
```

FILE: /workspaces/YaHeard/src/routes/api/transcribe/+server.test.ts
CREATE NEW FILE:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';

describe('Transcription API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject requests without audio file', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: new FormData()
    });

    const response = await POST({ 
      request, 
      getClientAddress: () => '127.0.0.1' 
    } as any);
    
    const result = await response.json();
    expect(response.status).toBe(400);
    expect(result.error).toContain('No audio file');
  });

  it('should enforce rate limiting', async () => {
    const formData = new FormData();
    formData.append('audio', new File(['test'], 'test.wav', { type: 'audio/wav' }));

    // Make requests up to rate limit
    for (let i = 0; i < 11; i++) {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData
      });

      const response = await POST({ 
        request, 
        getClientAddress: () => '192.168.1.1' 
      } as any);

      if (i === 10) {
        expect(response.status).toBe(429);
        const result = await response.json();
        expect(result.error).toContain('Rate limit exceeded');
      }
    }
  });
});
```

FILE: /workspaces/YaHeard/vitest.config.ts
CREATE NEW FILE:
```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts']
  }
});
```

FILE: /workspaces/YaHeard/src/test-setup.ts
CREATE NEW FILE:
```typescript
import { vi } from 'vitest';

// Mock environment variables for testing
vi.stubEnv('OPENAI_API_KEY', 'test-key');
vi.stubEnv('NODE_ENV', 'test');

// Mock fetch for API tests
global.fetch = vi.fn();
```

FILE: /workspaces/YaHeard/package.json
MODIFY: Add test script and dependencies
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  },
  "devDependencies": {
    "vitest": "^1.2.0",
    "@testing-library/svelte": "^4.0.0",
    "jsdom": "^24.0.0"
  }
}
```

==================== PROMPT 3 VERIFICATION ====================

1. Install test dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm run test:run
# Should see test results
```

3. Test rate limiting manually:
```bash
# Make rapid requests to test rate limiting
for i in {1..12}; do
  curl -X POST http://localhost:5173/api/transcribe \
    -F "audio=@test.wav" \
    -w "\nStatus: %{http_code}\n"
done
# Should see 429 status after 10 requests
```

4. Verify performance optimization:
```bash
# Check that similarity cache is being used
grep -n "similarityCache" src/implementations/comparison.ts
# Should see cache implementation
```

==================== PROMPT 3 ROLLBACK ====================

```bash
# Remove test files
rm -f src/routes/api/transcribe/+server.test.ts
rm -f vitest.config.ts src/test-setup.ts
rm -f src/lib/rate-limiter.ts

# Restore original files
git checkout -- src/routes/api/transcribe/+server.ts
git checkout -- src/implementations/comparison.ts

# Remove test dependencies
npm uninstall vitest @testing-library/svelte jsdom

# Rebuild
npm run build
```

==================== FINAL DEPLOYMENT CHECKLIST ====================

□ Environment variables configured (.env file created from .env.example)
□ At least one AI API key is set and validated
□ Build completes without errors: `npm run build`
□ All tests pass: `npm run test:run`
□ Health check endpoint responds: `curl /api/health`
□ Security headers are present in responses
□ Rate limiting is active on /api/transcribe
□ Gemini processor returns correct file extensions
□ Sentry DSN configured (optional but recommended)
□ Vercel.json present for deployment settings
□ No sensitive data in git history: `git log --oneline`
□ Production build tested locally: `npm run preview`

DEPLOYMENT COMMAND:
```bash
vercel --prod
```

==================== DEPENDENCY MAP ====================

PROMPT 1 (Critical Fixes & Environment):
- Independent, must complete first
- Fixes breaking bug in Gemini processor
- Sets up environment validation
- Required for all subsequent prompts

PROMPT 2 (Monitoring & Security):
- Depends on: PROMPT 1 (needs hooks.server.ts base)
- Enhances security headers from PROMPT 1
- Can be skipped but highly recommended for production
- Health endpoint useful for monitoring

PROMPT 3 (Testing & Performance):
- Depends on: PROMPT 1 (needs working codebase)
- Independent of PROMPT 2
- Can be deployed without, but recommended for production
- Rate limiting critical for cost control

EXECUTION ORDER:
1. PROMPT 1 → Required
2. PROMPT 2 & 3 → Can be done in parallel or either order
3. Final deployment checklist → After all prompts

MINIMUM VIABLE DEPLOYMENT: Just PROMPT 1
RECOMMENDED DEPLOYMENT: All 3 prompts