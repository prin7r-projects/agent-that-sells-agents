import { NextResponse } from "next/server";
import { OrderService, LicenseService, RevShareService } from "@/lib/server/orders";
import { isIpnProcessed } from "@/lib/server/idempotency";

// Internal IPN endpoint — called by the NOWPayments webhook handler
// after HMAC verification. Not exposed to public internet (no Traefik route).
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    orderId?: string;
    paymentStatus?: string;
    customerEmail?: string;
    agentId?: string;
    tier?: string;
    priceAmountUsd?: number;
    referralCode?: string;
  };

  const orderId = body.orderId;
  if (!orderId) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "orderId required" } },
      { status: 400 },
    );
  }

  const status = body.paymentStatus ?? "unknown";

  // Idempotency: if we've already processed this (orderId, status) pair, return 200
  if (isIpnProcessed(orderId, status)) {
    console.log(`[INTERNAL_IPN] already processed order=${orderId} status=${status}`);
    return NextResponse.json({ ok: true, idempotent: true, orderId, status });
  }

  // On "finished" or "confirmed" payment, mark paid and issue license
  if (status === "finished" || status === "confirmed") {
    const order = OrderService.markPaid(orderId);
    if (!order) {
      // Order not found in our store — could be from a different instance
      console.warn(`[INTERNAL_IPN] order not found: ${orderId}`);
      return NextResponse.json(
        { ok: false, error: "order_not_found", orderId },
        { status: 404 },
      );
    }

    // Issue license
    const customerEmail = body.customerEmail ?? order.customerEmail ?? `customer@${orderId}`;
    const agentId = body.agentId ?? order.agentLot ?? `lot-unknown`;
    const tier = body.tier ?? order.tier ?? "trial";

    const license = LicenseService.issue({
      orderId,
      customerEmail,
      agentId: `lot-${agentId}`,
      tier,
    });

    // Accrue rev-share if referral code present
    if (body.referralCode || order.referralCode) {
      const refCode = body.referralCode ?? order.referralCode ?? "unknown";
      RevShareService.accrue({
        orderId,
        referralCode: refCode,
        amountUsd: Math.round((order.priceAmountUsd || 99) * 0.3 * 100) / 100,
        bps: 3000,
      });
    }

    console.log(
      `[INTERNAL_IPN] paid order=${orderId} tier=${tier} agent=${agentId} email=${customerEmail} license=${license.validUntil}`,
    );

    return NextResponse.json({
      ok: true,
      orderId,
      status: "paid",
      licenseIssued: true,
      licenseValidUntil: license.validUntil,
    });
  }

  // Other statuses: just log and return
  console.log(`[INTERNAL_IPN] status=${status} order=${orderId}`);
  return NextResponse.json({ ok: true, orderId, status });
}
