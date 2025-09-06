/**
 * @file csrf.ts
 * @purpose CSRF protection utilities for enterprise security
 * @phazzie-status implemented
 * @last-regenerated 2025-09-06
 * 
 * PRODUCTION READINESS NOTICE:
 * This implementation uses in-memory storage which is NOT suitable for production
 * environments running on:
 * - Serverless platforms (Vercel, Netlify, AWS Lambda)
 * - Multi-instance deployments behind load balancers
 * - Container orchestration (Kubernetes, Docker Swarm)
 * 
 * For production use, replace tokenStore with:
 * - Redis for distributed caching with TTL
 * - Database with indexed expiration queries
 * - Distributed cache service (AWS ElastiCache, Google Memorystore)
 */

// CSRF token storage (⚠️ IN-MEMORY - NOT PRODUCTION READY FOR DISTRIBUTED SYSTEMS)
const tokenStore = new Map<string, { created: number; used: boolean }>();

const CSRF_CONFIG = {
  TOKEN_LENGTH: 32,
  TOKEN_LIFETIME_MS: 30 * 60 * 1000, // 30 minutes
  CLEANUP_INTERVAL: 5 * 60 * 1000 // 5 minutes
};

/**
 * Generate a secure random string using Web Crypto API or Node.js crypto
 */
function generateSecureRandom(length: number): string {
  const array = new Uint8Array(length);
  
  // Try Web Crypto API first (available in modern browsers and Node.js 16+)
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Try Node.js crypto module (dynamic import for server-side compatibility)
  try {
    // Use dynamic import to avoid bundler issues
    const crypto = eval('require')('crypto');
    const randomBytes: Uint8Array = crypto.randomBytes(length);
    return Array.from(randomBytes, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // No secure random generator available - fail securely
    throw new Error('Secure random number generator (crypto.getRandomValues or Node.js crypto) is required for CSRF token generation. Cannot proceed without cryptographically secure randomness.');
  }
}

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): string {
  const token = generateSecureRandom(CSRF_CONFIG.TOKEN_LENGTH);
  const now = Date.now();
  
  // Store token with timestamp
  tokenStore.set(token, { created: now, used: false });
  
  // Cleanup expired tokens on every token generation to prevent memory leaks
  cleanupExpiredTokens(now);
  
  return token;
}

/**
 * Validate and consume a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  if (!token) return false;
  
  const tokenData = tokenStore.get(token);
  if (!tokenData) return false;
  
  const now = Date.now();
  
  // Check if token has expired
  if (now - tokenData.created > CSRF_CONFIG.TOKEN_LIFETIME_MS) {
    tokenStore.delete(token);
    return false;
  }
  
  // Check if token has already been used (one-time use)
  if (tokenData.used) {
    return false;
  }
  
  // Mark token as used and validate
  tokenData.used = true;
  return true;
}

/**
 * Clean up expired CSRF tokens
 */
function cleanupExpiredTokens(now: number) {
  for (const [token, data] of tokenStore.entries()) {
    if (now - data.created > CSRF_CONFIG.TOKEN_LIFETIME_MS) {
      tokenStore.delete(token);
    }
  }
}

/**
 * Get CSRF token statistics (for monitoring)
 */
export function getCSRFStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;
  
  for (const data of tokenStore.values()) {
    if (now - data.created > CSRF_CONFIG.TOKEN_LIFETIME_MS) {
      expired++;
    } else {
      active++;
    }
  }
  
  return { active, expired, total: tokenStore.size };
}