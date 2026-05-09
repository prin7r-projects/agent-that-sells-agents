import { NextResponse } from "next/server";
import { OrderService, LicenseService, RevShareService } from "@/lib/server/orders";
import { isIpnProcessed } from "@/lib/server/idempotency";
import { sendMagicLinkEmail } from "@/lib/server/email";
import { createMagicLink } from "@/lib/server/magic-link";
import { syncOrderToNotion } from "@/lib/server/notion";
import { agents as staticAgents } from "@/lib/agents";
import { eq } from "drizzle-orm";
import { db, schema } from "@/src/db/index";

async function getAgentName(agentId: string | undefined): Promise<string> {
  if (!agentId) return "your agent";
  const rows = await db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).limit(1);
  if (rows.length > 0) return rows[0].displayName;
  const staticAgent = staticAgents.find((a) => `lot-${a.lot}` === agentId || a.lot === agentId);
  return staticAgent?.name ?? "your agent";
}

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
    const order = await OrderService.markPaid(orderId);
    if (!order) {
      console.warn(`[INTERNAL_IPN] order not found: ${orderId}`);
      return NextResponse.json(
        { ok: false, error: "order_not_found", orderId },
        { status: 404 },
      );
    }

    const customerEmail = body.customerEmail ?? order.customerEmail ?? `customer@${orderId}`;
    const agentId = body.agentId ?? order.agentLot ?? "lot-unknown";
    const tier = body.tier ?? order.tier ?? "trial";

    const license = await LicenseService.issue({
      orderId,
      customerEmail,
      agentId: agentId.startsWith("lot-") ? agentId : `lot-${agentId}`,
      tier,
    });

    // Accrue rev-share if referral code present
    if (body.referralCode || order.referralCode) {
      const refCode = body.referralCode ?? order.referralCode ?? "unknown";
      await RevShareService.accrue({
        orderId,
        referralCode: refCode,
        amountUsd: Math.round((order.priceAmountUsd || 99) * 0.3 * 100) / 100,
        bps: 3000,
      });
    }

    // Magic-link email + Notion sync (best-effort)
    let emailResult: { ok: boolean; error?: string } = { ok: false };
    let notionResult: { ok: boolean; error?: string } = { ok: false };
    try {
      const agentName = await getAgentName(agentId);
      const magicLink = await createMagicLink({ email: customerEmail, orderId });
      emailResult = await sendMagicLinkEmail({
        to: customerEmail,
        magicLinkUrl: magicLink.url,
        agentName,
        tier,
      });
      notionResult = await syncOrderToNotion({
        orderId,
        customerEmail,
        agentId,
        tier,
        priceAmountUsd: order.priceAmountUsd || 99,
        referralCode: order.referralCode,
        paidAt: new Date().toISOString(),
      });
    } catch (postPaymentErr) {
      console.error(`[INTERNAL_IPN] post-payment actions failed for order=${orderId}:`, postPaymentErr);
    }

    console.log(
      `[INTERNAL_IPN] paid order=${orderId} tier=${tier} agent=${agentId} email=${customerEmail} license=${license.validUntil} emailSent=${emailResult.ok} notionSynced=${notionResult.ok}`,
    );

    return NextResponse.json({
      ok: true,
      orderId,
      status: "paid",
      licenseIssued: true,
      licenseValidUntil: license.validUntil,
      emailSent: emailResult.ok,
      notionSynced: notionResult.ok,
    });
  }

  // Other statuses: just log and return
  console.log(`[INTERNAL_IPN] status=${status} order=${orderId}`);
  return NextResponse.json({ ok: true, orderId, status });
}
