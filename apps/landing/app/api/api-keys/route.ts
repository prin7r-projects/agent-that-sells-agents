import { NextResponse } from "next/server";
import { validateAdminToken, getBearerToken } from "@/lib/server/auth";

export const runtime = "nodejs";

/**
 * GET /api/api-keys — List API keys for the authenticated customer (docs/12 §3.7)
 * Phase 2: stub (returns empty list). Phase 3: DB-backed.
 */
export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!token || token.length < 8) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid API key required." } },
      { status: 401 },
    );
  }

  // Phase 2 stub — Phase 3: query api_keys table
  return NextResponse.json({
    keys: [
      {
        id: "key_stub_001",
        prefix: "tri_live_stub",
        label: "default",
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      },
    ],
  });
}

/**
 * POST /api/api-keys — Create a new API key (docs/12 §3.8)
 * Phase 2: stub (generates random key, not persisted). Phase 3: DB-backed.
 */
export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (!token || token.length < 8) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid API key required." } },
      { status: 401 },
    );
  }

  let body: { label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid JSON." } },
      { status: 400 },
    );
  }

  // Generate a Triangulate-format API key (docs/12 §7)
  const crypto = await import("node:crypto");
  const ulid = Date.now().toString(36) + crypto.randomUUID().slice(0, 10);
  const randomPart = crypto.randomBytes(8).toString("hex");
  const rawKey = `tri_live_${ulid}_${randomPart}`;
  const prefix = rawKey.slice(0, 20);

  console.log(`[STAMPED_AGENTS_API_KEY] Created key prefix=${prefix} label=${body.label ?? "default"}`);

  return NextResponse.json(
    {
      id: `key_${crypto.randomUUID().slice(0, 8)}`,
      key: rawKey,
      prefix,
      label: body.label ?? "default",
      createdAt: new Date().toISOString(),
    },
    { status: 201 },
  );
}

/**
 * DELETE /api/api-keys/:id — Revoke an API key (docs/12 §3.9)
 * Phase 2: stub (always succeeds). Phase 3: DB-backed, can't revoke self.
 */
export async function DELETE(request: Request) {
  const token = getBearerToken(request);
  if (!token || token.length < 8) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid API key required." } },
      { status: 401 },
    );
  }

  // Phase 2 stub
  return NextResponse.json({ ok: true, revoked: "key_stub_001" });
}
