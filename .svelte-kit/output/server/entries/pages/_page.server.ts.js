const tokenStore = /* @__PURE__ */ new Map();
const CSRF_CONFIG = {
  TOKEN_LENGTH: 32,
  TOKEN_LIFETIME_MS: 30 * 60 * 1e3
};
function generateSecureRandom(length) {
  const array = new Uint8Array(length);
  if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  throw new Error("Secure random number generator (crypto.getRandomValues) is required for CSRF token generation. Node.js 20+ or a modern browser is required.");
}
function generateCSRFToken() {
  const token = generateSecureRandom(CSRF_CONFIG.TOKEN_LENGTH);
  const now = Date.now();
  tokenStore.set(token, { created: now, used: false });
  cleanupExpiredTokens(now);
  return token;
}
function cleanupExpiredTokens(now) {
  for (const [token, data] of tokenStore.entries()) {
    if (now - data.created > CSRF_CONFIG.TOKEN_LIFETIME_MS) {
      tokenStore.delete(token);
    }
  }
}
const load = async (event) => {
  const csrfToken = generateCSRFToken();
  const isHttps = event.url.protocol === "https:";
  event.cookies.set("csrfToken", csrfToken, {
    path: "/",
    sameSite: "lax",
    secure: isHttps,
    // don't mark secure on http://localhost so cookies are sent
    httpOnly: true,
    // client doesn't need to read it; server compares cookie vs form value
    maxAge: 60 * 30
    // 30 minutes
  });
  return {
    csrfToken
  };
};
export {
  load
};
