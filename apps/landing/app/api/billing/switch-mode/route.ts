import { NextResponse } from "next/server";
import { validateApiKey, getBearerToken } from "@/lib/server/auth";

export const runtime = "nodejs";

/**
 * POST /api/billing/switch-mode — Toggle between flat and outcome-based pricing (docs/12 §3.6)
 * Phase 2: stub (acknowledges request). Phase 3: updates order row + enforces cap.
 */
export async function POST(request: Request) {
  const token = getBearerToken(request);
  const auth = validateApiKey(token);
  if (!auth.valid) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid API key required." } },
      { status: 401 },
    );
  }

  let body: { orderId?: string; mode?: "flat" | "outcome"; cap?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  if (!body.orderId) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "orderId is required." } },
      { status: 400 },
    );
  }

  if (!body.mode || !["flat", "outcome"].includes(body.mode)) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "mode must be 'flat' or 'outcome'." } },
      { status: 400 },
    );
  }

  const effectiveAt = new Date().toISOString();
  const cap = body.cap ?? (body.mode === "outcome" ? 1.5 : undefined);

  console.log(
    `[STAMPED_AGENTS_BILLING] order=${body.orderId} mode=${body.mode} cap=${cap} account=${auth.accountId}`,
  );

  // Phase 2 stub — Phase 3: persist to orders table
  return NextResponse.json({
    orderId: body.orderId,
    effectiveAt,
    mode: body.mode,
    cap: cap ?? null,
  });
}
