// Server-side auth utilities — Phase 3 (docs/12 §6)
// DB-backed API key validation via Drizzle ORM.

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY?.trim();

// Static import — all consumers use runtime: "nodejs"
import { db, schema } from "../../src/db/index.js";

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
 * Hash an API key for secure storage/comparison.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an API key from the request. DB-backed lookup by key hash.
 * Returns valid, keyHash, accountId (customerId), and keyId.
 */
export async function validateApiKey(authHeader: string | null): Promise<{
  valid: boolean;
  keyHash?: string;
  accountId?: string;
  keyId?: string;
}> {
  if (!authHeader) return { valid: false };
  const key = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (key.length < 8) return { valid: false };

  const keyHash = hashApiKey(key);

  const existing = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.keyHash, keyHash))
    .limit(1);

  if (existing.length === 0) return { valid: false };

  const apiKey = existing[0];

  // Check if revoked
  if (apiKey.revokedAt) return { valid: false };

  // Update lastUsedAt
  await db
    .update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.apiKeys.id, apiKey.id));

  return {
    valid: true,
    keyHash: keyHash.slice(0, 16),
    accountId: apiKey.customerId,
    keyId: apiKey.id,
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
