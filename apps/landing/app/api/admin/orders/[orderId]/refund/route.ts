import { NextResponse } from "next/server";
import { validateAdminToken, getBearerToken } from "@/lib/server/auth";
import { OrderService, LicenseService, RevShareService } from "@/lib/server/orders";

export const runtime = "nodejs";

/**
 * POST /api/admin/orders/:orderId/refund — Process a refund (admin only)
 * Marks order refunded, revokes license, reverses rev-share.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const token = getBearerToken(request);
  if (!validateAdminToken(token)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid ADMIN_API_KEY required." } },
      { status: 401 },
    );
  }

  const { orderId } = await params;

  let body: { reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    // body is optional
  }

  const order = await OrderService.get(orderId);
  if (!order) {
    return NextResponse.json(
      { error: { code: "order_not_found", message: `Order ${orderId} not found.` } },
      { status: 404 },
    );
  }

  if (order.status === "refunded") {
    return NextResponse.json(
      { error: { code: "already_refunded", message: "Order is already refunded." } },
      { status: 409 },
    );
  }

  // 1. Mark order as refunded
  await OrderService.refund(orderId, body.reason);

  // 2. Revoke license
  const revokedLicense = await LicenseService.revoke(orderId);

  // 3. Reverse rev-share if applicable
  const reversedRevShare = await RevShareService.reverseForOrder(orderId);

  console.log(
    `[STAMPED_AGENTS_ADMIN_REFUND] order=${orderId} reason=${body.reason ?? "N/A"} licenseRevoked=${!!revokedLicense} revShareReversed=${!!reversedRevShare}`,
  );

  return NextResponse.json({
    ok: true,
    orderId,
    status: "refunded",
    refundedAt: new Date().toISOString(),
    licenseRevoked: revokedLicense
      ? {
          agentId: revokedLicense.agentId,
          customerEmail: revokedLicense.customerEmail,
          validUntil: revokedLicense.validUntil,
        }
      : null,
    revShareReversed: reversedRevShare
      ? {
          referralCode: reversedRevShare.referralCode,
          amountUsd: reversedRevShare.amountUsd,
        }
      : null,
  });
}
