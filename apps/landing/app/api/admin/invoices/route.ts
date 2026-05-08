import { NextResponse } from "next/server";
import { validateAdminToken, getBearerToken } from "@/lib/server/auth";

export const runtime = "nodejs";

/**
 * POST /api/admin/invoices — Enterprise concierge close (docs/12 §3.5)
 * Admin-only. Creates a NOWPayments hosted invoice for Enterprise tier.
 */
export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (!validateAdminToken(token)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid ADMIN_API_KEY required." } },
      { status: 401 },
    );
  }

  const apiKey = process.env.NOWPAYMENTS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: { code: "missing_env", message: "NOWPAYMENTS_API_KEY is not set." } },
      { status: 503 },
    );
  }

  let body: {
    customerId?: string;
    tier?: string;
    agentIds?: string[];
    priceAmountUsd?: number;
    expiresAt?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  const customerId = body.customerId ?? "enterprise_buyer";
  const tier = body.tier ?? "enterprise";
  const agentIds = body.agentIds ?? [];
  const priceAmountUsd = body.priceAmountUsd ?? 4800;
  const description = agentIds.length > 0
    ? `StampedAgents — Enterprise (${agentIds.length} agents)`
    : "StampedAgents — Enterprise";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agent-that-sells-agents.prin7r.com";
  const orderId = `stmp_${tier}_${Date.now().toString(36)}_${customerId.slice(0, 8)}`;

  const invoicePayload = {
    price_amount: priceAmountUsd,
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
  try { data = JSON.parse(text) as Record<string, unknown>; } catch { data = { raw: text }; }

  if (!response.ok) {
    return NextResponse.json(
      { error: { code: "nowpayments_error", message: `NOWPayments returned HTTP ${response.status}`, detail: data } },
      { status: 502 },
    );
  }

  const invoiceUrl = typeof data.invoice_url === "string" ? data.invoice_url : "";
  const invoiceId = typeof data.id === "string" || typeof data.id === "number" ? String(data.id) : "";

  console.log(
    `[STAMPED_AGENTS_ADMIN_INVOICE] tier=${tier} order=${orderId} invoice=${invoiceId} customer=${customerId}`,
  );

  return NextResponse.json(
    {
      orderId,
      invoiceUrl,
      invoiceId,
      tier,
      priceAmountUsd,
      customerId,
      agentIds,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    { status: 201 },
  );
}
