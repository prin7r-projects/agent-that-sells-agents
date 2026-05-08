import { NextResponse } from "next/server";
import { validateAdminToken, getBearerToken } from "@/lib/server/auth";
import { OrderService, RevShareService } from "@/lib/server/orders";

export const runtime = "nodejs";

/**
 * GET /api/admin/partners/:code/analytics — Partner analytics (docs/13 Phase 6 Task 2)
 * Returns 30/60/90-day order counts, rev-share accrued, top agents.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const token = getBearerToken(_request);
  if (!validateAdminToken(token)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid ADMIN_API_KEY required." } },
      { status: 401 },
    );
  }

  const { code } = await params;
  const decodedCode = decodeURIComponent(code);

  const allOrders = OrderService.listAll();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const partnerOrders = allOrders.filter((o) => o.referralCode === decodedCode);

  const windowed = (days: number) =>
    partnerOrders.filter((o) => {
      const created = new Date(o.createdAt).getTime();
      return now - created <= days * dayMs && o.status === "paid";
    });

  const orders30 = windowed(30);
  const orders60 = windowed(60);
  const orders90 = windowed(90);

  // Top agents by paid order count for this partner
  const agentCounts: Record<string, number> = {};
  for (const o of orders90) {
    const agent = o.agentLot ?? "unknown";
    agentCounts[agent] = (agentCounts[agent] || 0) + 1;
  }
  const topAgents = Object.entries(agentCounts)
    .map(([agentId, count]) => ({ agentId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalRevShare = RevShareService.totalByCode(decodedCode);

  return NextResponse.json({
    partnerCode: decodedCode,
    summary: {
      orders30d: orders30.length,
      orders60d: orders60.length,
      orders90d: orders90.length,
      totalRevShareUsd: totalRevShare,
    },
    topAgents,
    orders: partnerOrders.map((o) => ({
      orderId: o.orderId,
      tier: o.tier,
      agentLot: o.agentLot,
      priceAmountUsd: o.priceAmountUsd,
      status: o.status,
      paidAt: o.paidAt,
      createdAt: o.createdAt,
    })),
  });
}
