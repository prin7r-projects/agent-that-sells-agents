import { NextResponse } from "next/server";
import { validateApiKey, validateAdminToken, getBearerToken } from "@/lib/server/auth";
import { OrderService } from "@/lib/server/orders";
import { isFlagEnabled, recordFlagEvent } from "@/lib/server/feature-flags";

export const runtime = "nodejs";

/**
 * POST /api/billing/switch-mode — Toggle between flat and outcome-based pricing (docs/12 §3.6)
 * Phase 6: gated by ff.outcomePricingToggle for Pro customers (50/50 split).
 */
export async function POST(request: Request) {
  const token = getBearerToken(request);
  const auth = await validateApiKey(token);
  const isAdmin = validateAdminToken(request.headers.get("authorization"));
  if (!auth.valid && !isAdmin) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid API key or admin token required." } },
      { status: 401 },
    );
  }

  let body: {
    orderId?: string;
    mode?: "flat" | "outcome";
    cap?: number;
    customerId?: string;
    customerTier?: string;
  };
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

  const customerId = body.customerId ?? auth.accountId ?? "anonymous";
  const customerTier = body.customerTier ?? "pro"; // default to pro for toggle eligibility

  // Feature-flag gating (admins bypass)
  const flagOn = isAdmin || isFlagEnabled("outcomePricingToggle", customerId, customerTier);

  // Log exposure on every request (idempotent pipe)
  recordFlagEvent("outcomePricingToggle", customerId, "exposed", {
    orderId: body.orderId,
    mode: body.mode,
    flagEnabled: flagOn,
  });

  if (!flagOn) {
    return NextResponse.json(
      {
        error: {
          code: "feature_not_available",
          message: "Outcome-based pricing is not available for this account yet.",
        },
      },
      { status: 403 },
    );
  }

  const effectiveAt = new Date().toISOString();
  const cap = body.cap ?? (body.mode === "outcome" ? 1.5 : undefined);

  // Persist billing mode change
  const updated = await OrderService.updateBillingMode(body.orderId, body.mode, cap);
  if (!updated) {
    return NextResponse.json(
      { error: { code: "order_not_found", message: `Order ${body.orderId} not found.` } },
      { status: 404 },
    );
  }

  // Log conversion (mode switch)
  recordFlagEvent("outcomePricingToggle", customerId, "converted", {
    orderId: body.orderId,
    mode: body.mode,
    cap,
  });

  console.log(
    `[STAMPED_AGENTS_BILLING] order=${body.orderId} mode=${body.mode} cap=${cap} account=${auth.accountId ?? "admin"}`,
  );

  return NextResponse.json({
    orderId: body.orderId,
    effectiveAt,
    mode: body.mode,
    cap: cap ?? null,
    flagEnabled: true,
  });
}
