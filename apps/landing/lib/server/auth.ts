// Server-side auth utilities — Phase 3 (docs/12 §6)
// Validates Bearer tokens for admin endpoints and API keys.

const ADMIN_API_KEY = process.env.ADMIN_API_KEY?.trim();

/**
 * Validate an admin Bearer token. Uses constant-time comparison.
 * Admin keys are 64+ char hex strings, rotated every 90 days.
 */
export function validateAdminToken(authHeader: string | null): boolean {
  if (!ADMIN_API_KEY) {
    console.warn("[AUTH] ADMIN_API_KEY not set — admin endpoints disabled");
    return false;
  }
  if (!authHeader) return false;
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  // Constant-time comparison
  try {
    const crypto = require("node:crypto");
    return crypto.timingSafeEqual(
      Buffer.from(token.trim()),
      Buffer.from(ADMIN_API_KEY),
    );
  } catch {
    return token.trim() === ADMIN_API_KEY;
  }
}

/**
 * Validate an API key from the request. In Phase 3+ this checks against DB.
 * In Phase 2/early-Phase3, any key ≥ 8 characters is accepted (stub auth).
 */
export function validateApiKey(authHeader: string | null): {
  valid: boolean;
  keyHash?: string;
  accountId?: string;
} {
  if (!authHeader) return { valid: false };
  const key = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  // Phase 2 stub: any key ≥ 8 chars
  // Phase 3: sha256(key) → lookup in api_keys table
  if (key.length < 8) return { valid: false };

  return {
    valid: true,
    keyHash: `stub_${key.slice(0, 8)}`,
    accountId: "acct_stub",
  };
}

/**
 * Extract Bearer token from request headers.
 */
export function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : auth.trim();
}
