import { NextResponse } from "next/server";
import { verifyNowpaymentsIpn } from "@/lib/signatures";

export const runtime = "nodejs";

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

  console.log(
    `[STAMPED_AGENTS_WEBHOOK] verified=${verified} order=${orderId} status=${status}`,
  );

  // Always 200 once we've logged; verified flag is in the body so NOWPayments
  // can see we accepted the payload, and we can replay from logs if needed.
  return NextResponse.json({ ok: verified, orderId, status });
}
