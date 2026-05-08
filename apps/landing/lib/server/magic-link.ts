// Magic-link onboarding service — Phase 3 (docs/13 Phase 3 Task 7)
// Generates and validates magic links for post-purchase onboarding.

import { createHash, randomBytes } from "node:crypto";

// Dynamic import to avoid bundling DB client in edge runtime
let db: any = null;
let schema: any = null;

async function getDb() {
  if (!db) {
    const mod = await import("../../../../app/src/db/index.js");
    db = mod.db;
    schema = mod.schema;
  }
  return { db, schema };
}

const MAGIC_LINK_EXPIRY_HOURS = 24;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://agent-that-sells-agents.prin7r.com";

interface MagicLinkResult {
  token: string;
  url: string;
  expiresAt: Date;
}

/**
 * Create a magic link for a customer after purchase.
 * Stores the link in the DB with expiry.
 */
export async function createMagicLink(params: {
  email: string;
  orderId: string;
}): Promise<MagicLinkResult> {
  const { db, schema } = await getDb();

  // Generate a secure random token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + MAGIC_LINK_EXPIRY_HOURS);

  await db.insert(schema.magicLinks).values({
    email: params.email.toLowerCase(),
    token,
    orderId: params.orderId,
    expiresAt,
  });

  const url = `${APP_URL}/onboarding?token=${token}`;

  console.log(`[MAGIC_LINK] Created for email=${params.email} order=${params.orderId} expires=${expiresAt.toISOString()}`);

  return { token, url, expiresAt };
}

/**
 * Validate a magic link token.
 * Returns the email and orderId if valid, null otherwise.
 */
export async function validateMagicLink(token: string): Promise<{
  valid: boolean;
  email?: string;
  orderId?: string;
  error?: string;
}> {
  const { db, schema } = await getDb();

  const existing = await db
    .select()
    .from(schema.magicLinks)
    .where(eq(schema.magicLinks.token, token))
    .limit(1);

  if (existing.length === 0) {
    return { valid: false, error: "Invalid or expired magic link" };
  }

  const link = existing[0];

  // Check if already used
  if (link.usedAt) {
    return { valid: false, error: "Magic link already used" };
  }

  // Check if expired
  if (new Date() > link.expiresAt) {
    return { valid: false, error: "Magic link expired" };
  }

  // Mark as used
  await db
    .update(schema.magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(schema.magicLinks.id, link.id));

  console.log(`[MAGIC_LINK] Validated for email=${link.email} order=${link.orderId}`);

  return {
    valid: true,
    email: link.email,
    orderId: link.orderId ?? undefined,
  };
}

import { eq } from "drizzle-orm";
