import { NextResponse } from "next/server";
import { verifyNowpaymentsIpn } from "@/lib/signatures";
import { incrementSigFailure } from "@/lib/server/alerts";
import { scrubPii } from "@/lib/server/log-redact";

export const runtime = "nodejs";

/**
 * NOWPayments IPN webhook handler.
 * Phase 2: verified HMAC, logged, ACKs.
 * Phase 3: verified HMAC → calls internal IPN endpoint for order persistence.
 * Idempotent on (orderId, paymentStatus).
 */

export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig = request.headers.get("x-nowpayments-sig");
  const secret = process.env.NOWPAYMENTS_IPN_SECRET?.trim() ?? "";

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    payload = { raw: rawBody };
  }

  const verified = secret ? verifyNowpaymentsIpn(payload, sig, secret) : false;
  const orderId =
    (typeof payload.order_id === "string" && payload.order_id) ||
    (typeof payload.payment_id === "string" && payload.payment_id) ||
    "unknown";
  const status =
    (typeof payload.payment_status === "string" && payload.payment_status) ||
    (typeof payload.status === "string" && payload.status) ||
    "unknown";

  // PII-safe logging
  const scrubbed = scrubPii(payload);
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      route: "POST /api/webhooks/nowpayments",
      event: verified ? "ipn_verified" : "ipn_unverified",
      orderId,
      paymentStatus: status,
      payload: scrubbed,
    }),
  );

  // On verified "finished" IPN, call internal endpoint to persist
  if (verified && (status === "finished" || status === "confirmed")) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.url.replace(/\/api\/webhooks\/.*/, "");
      const internalSecret = process.env.INTERNAL_IPN_SECRET?.trim();
      if (!internalSecret) {
        console.error("[STAMPED_AGENTS_WEBHOOK] INTERNAL_IPN_SECRET not set — skipping fulfillment");
      } else {
        const internalRes = await fetch(`${baseUrl}/api/internal/ipn`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${internalSecret}`,
          },
          body: JSON.stringify({
            orderId,
            paymentStatus: status,
            priceAmountUsd: typeof payload.price_amount === "number" ? payload.price_amount : undefined,
          }),
        });
        const internalBody = await internalRes.json().catch(() => ({}));
        console.log(
          `[STAMPED_AGENTS_WEBHOOK] internal_ipn call order=${orderId} status=${internalRes.status} ok=${(internalBody as Record<string,unknown>).ok}`,
        );
      }
    } catch (e) {
      console.error(`[STAMPED_AGENTS_WEBHOOK] internal_ipn failed for order=${orderId}:`, e);
      // Don't fail the webhook response — NOWPayments should still get 200
    }
  }

  // Reject forged IPNs
  if (!verified && sig) {
    incrementSigFailure();
    console.warn(
      `[STAMPED_AGENTS_WEBHOOK] forged IPN rejected order=${orderId} sig_prefix=${sig.slice(0, 8)}...`,
    );
    return NextResponse.json(
      { ok: false, error: "invalid_signature" },
      { status: 401 },
    );
  }

  // Always 200 for verified or unsigned payloads; NOWPayments retries on non-200
  return NextResponse.json({ ok: verified, orderId, status });
}
