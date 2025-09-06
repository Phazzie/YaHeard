/**
 * @file csrf.ts
 * @purpose CSRF protection utilities for enterprise security
 * @phazzie-status implemented
 * @last-regenerated 2025-09-06
 */

// CSRF token storage (in production, use Redis or database)
const tokenStore = new Map<string, { created: number; used: boolean }>();

const CSRF_CONFIG = {
  TOKEN_LENGTH: 32,
  TOKEN_LIFETIME_MS: 30 * 60 * 1000, // 30 minutes
  CLEANUP_INTERVAL: 5 * 60 * 1000 // 5 minutes
};

/**
 * Generate a secure random string using Web Crypto API
 */
function generateSecureRandom(length: number): string {
  // Use Web Crypto API for secure random generation
  const array = new Uint8Array(length);
  
  // In Node.js environment (server-side)
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): string {
  const token = generateSecureRandom(CSRF_CONFIG.TOKEN_LENGTH);
  const now = Date.now();
  
  // Store token with timestamp
  tokenStore.set(token, { created: now, used: false });
  
  // Cleanup old tokens periodically
  if (Math.random() < 0.1) {
    cleanupExpiredTokens(now);
  }
  
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