import { NextResponse } from "next/server";
import { tiers, agents } from "@/lib/agents";
import { OrderService } from "@/lib/server/orders";
import {
  buildIdempotencyKey,
  checkIdempotency,
  storeIdempotency,
} from "@/lib/server/idempotency";

export const runtime = "nodejs";

type CheckoutBody = {
  tierId?: "trial" | "pro" | "enterprise";
  agentLot?: string;
  upgradeFrom?: "trial";
  referralCode?: string;
  customerEmail?: string;
};

function appUrlFromRequest(request: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv && fromEnv.startsWith("http")) return fromEnv;
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CheckoutBody;
  const tier = tiers.find((t) => t.id === body.tierId) ?? tiers[1];
  const agent = agents.find((a) => a.lot === body.agentLot);

  const apiKey = process.env.NOWPAYMENTS_API_KEY?.trim();
  if (!apiKey) {
    // Safe fallback: live payment is disabled until the deploy env is restored.
    // Surface an actionable 503 so the on-call (or the Concierge) can fix it via
    // docs/runbooks/restore-nowpayments-key.md. Do not silently stub to a fake URL.
    console.error(
      "[STAMPED_AGENTS_CHECKOUT] NOWPAYMENTS_API_KEY missing — checkout disabled. " +
        "See docs/runbooks/restore-nowpayments-key.md.",
    );
    return NextResponse.json(
      {
        ok: false,
        mode: "disabled",
        code: "missing_env",
        env: "NOWPAYMENTS_API_KEY",
        envFile: "/opt/prin7r-deploys/agent-that-sells-agents/.env",
        runbook: "docs/runbooks/restore-nowpayments-key.md",
        message:
          "Live checkout is temporarily disabled. The NOWPAYMENTS_API_KEY is not " +
          "set on the deployed container. Restore it per the runbook to re-enable.",
      },
      { status: 503 },
    );
  }

  // Idempotency check: same buyer + agent + tier within the same hour → same invoice
  const idemKey = buildIdempotencyKey({
    email: body.customerEmail,
    agentId: body.agentLot,
    tierId: tier.id,
  });
  const cached = checkIdempotency(idemKey);
  if (cached) {
    console.log(
      `[STAMPED_AGENTS_CHECKOUT] idempotent hit key=${idemKey} order=${cached.orderId}` +
      (body.upgradeFrom ? ` upgradeFrom=${body.upgradeFrom}` : "") +
      (body.referralCode ? ` referral=${body.referralCode}` : ""),
    );
    return NextResponse.json({
      ok: true,
      mode: "live",
      orderId: cached.orderId,
      invoiceId: cached.invoiceId,
      invoiceUrl: cached.invoiceUrl,
      tier: tier.id,
      description: cached.orderId,
      idempotent: true,
      upgradeFrom: body.upgradeFrom ?? null,
      referralCode: body.referralCode ?? null,
    });
  }

  const baseUrl = appUrlFromRequest(request);
  const upgradeSuffix = body.upgradeFrom ? `_upgradeFrom_${body.upgradeFrom}` : "";
  const referralSuffix = body.referralCode ? `_ref_${body.referralCode}` : "";
  const orderId = `stmp_${tier.id}${upgradeSuffix}${referralSuffix}_${Date.now().toString(36)}`;
  const descriptionParts = [`StampedAgents — ${tier.name}`];
  if (agent) descriptionParts.push(`Lot ${agent.lot} · ${agent.name}`);
  if (body.upgradeFrom) descriptionParts.push(`(upgrade from ${body.upgradeFrom})`);
  const description = descriptionParts.join(" ");

  const invoicePayload = {
    price_amount: tier.amountUsd,
    price_currency: "usd",
    pay_currency: "usdttrc20",
    ipn_callback_url: `${baseUrl}/api/webhooks/nowpayments`,
    order_id: orderId,
    order_description: description,
    success_url: `${baseUrl}/?order=${orderId}&status=success#pricing`,
    cancel_url: `${baseUrl}/?order=${orderId}&status=cancelled#pricing`,
    is_fixed_rate: false,
    is_fee_paid_by_user: false,
  };

  const response = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(invoicePayload),
  });

  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        mode: "live",
        status: response.status,
        message: `NOWPayments returned HTTP ${response.status}`,
        body: data,
      },
      { status: 502 },
    );
  }

  const invoiceUrl =
    typeof data.invoice_url === "string" ? data.invoice_url : "";
  const invoiceId =
    typeof data.id === "string" || typeof data.id === "number"
      ? String(data.id)
      : "";

  // Persist order in DB (Wave 3)
  try {
    await OrderService.create({
      orderId,
      tier: tier.id,
      agentLot: body.agentLot,
      priceAmountUsd: tier.amountUsd,
      referralCode: body.referralCode,
      upgradeFrom: body.upgradeFrom,
      customerEmail: body.customerEmail,
      invoiceId,
    });
  } catch (dbErr) {
    console.error(`[STAMPED_AGENTS_CHECKOUT] DB persist failed order=${orderId}:`, dbErr);
    return NextResponse.json(
      { ok: false, mode: "live", message: "Invoice created but order persistence failed." },
      { status: 500 },
    );
  }

  // Store idempotency entry so replays within the hour window return the same invoice
  storeIdempotency(idemKey, { orderId, invoiceUrl, invoiceId });

  console.log(
    `[STAMPED_AGENTS_CHECKOUT] tier=${tier.id} order=${orderId} invoice=${invoiceId} url=${invoiceUrl}` +
    (body.upgradeFrom ? ` upgradeFrom=${body.upgradeFrom}` : "") +
    (body.referralCode ? ` referral=${body.referralCode}` : ""),
  );

  return NextResponse.json({
    ok: true,
    mode: "live",
    orderId,
    invoiceId,
    invoiceUrl,
    tier: tier.id,
    description,
    idempotent: false,
    upgradeFrom: body.upgradeFrom ?? null,
    referralCode: body.referralCode ?? null,
  });
}
