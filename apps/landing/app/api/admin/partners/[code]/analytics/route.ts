import { NextResponse } from "next/server";
import { validateAdminToken, getBearerToken } from "@/lib/server/auth";
import { OrderService, RevShareService } from "@/lib/server/orders";
import { db, schema } from "@/src/db/index";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/admin/partners/:code/analytics — Partner analytics (docs/13 Phase 6 Task 2)
 * Returns 30/60/90-day paid order counts, rev-share accrued, and top agents.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const token = getBearerToken(request);
  if (!validateAdminToken(token)) {
    return NextResponse.json(
      {
        error: {
          code: "unauthorized",
          message: "Valid ADMIN_API_KEY required.",
        },
      },
      { status: 401 },
    );
  }

  const { code } = await params;
  const decodedCode = decodeURIComponent(code);

  // 404 check — code must exist in referrals, orders, or credit transactions
  const [refRow, orderRow, txnRow] = await Promise.all([
    db
      .select()
      .from(schema.referrals)
      .where(eq(schema.referrals.code, decodedCode))
      .limit(1),
    db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.referralCode, decodedCode))
      .limit(1),
    db
      .select()
      .from(schema.creditTransactions)
      .where(eq(schema.creditTransactions.referralCode, decodedCode))
      .limit(1),
  ]);

  if (refRow.length === 0 && orderRow.length === 0 && txnRow.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "not_found",
          message: `Unknown referral code: ${decodedCode}`,
        },
      },
      { status: 404 },
    );
  }

  const allOrders = await OrderService.listAll();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const partnerOrders = allOrders.filter(
    (o) => o.referralCode === decodedCode,
  );

  // Build orderId → revShareUsd map from credit transactions
  const revShareEntries = await RevShareService.getByCode(decodedCode);
  const orderRevShare: Record<string, number> = {};
  for (const entry of revShareEntries) {
    orderRevShare[entry.orderId] =
      (orderRevShare[entry.orderId] || 0) + entry.amountUsd;
  }

  const windowData = (days: number) => {
    const cutoff = now - days * dayMs;
    const windowOrders = partnerOrders.filter((o) => {
      const created = new Date(o.createdAt).getTime();
      return created >= cutoff && o.status === "paid";
    });
    const orders = windowOrders.length;
    const revShareUsd = windowOrders.reduce(
      (sum, o) => sum + (orderRevShare[o.orderId] || 0),
      0,
    );
    return { orders, revShareUsd: Math.round(revShareUsd * 100) / 100 };
  };

  // Top agents within 90d window (by paid order count, with rev-share)
  const cutoff90 = now - 90 * dayMs;
  const orders90 = partnerOrders.filter((o) => {
    const created = new Date(o.createdAt).getTime();
    return created >= cutoff90 && o.status === "paid";
  });

  const agentStats: Record<string, { orders: number; revUsd: number }> = {};
  for (const o of orders90) {
    const agentId = o.agentId ?? o.agentLot ?? "unknown";
    if (!agentStats[agentId]) {
      agentStats[agentId] = { orders: 0, revUsd: 0 };
    }
    agentStats[agentId].orders++;
    agentStats[agentId].revUsd += orderRevShare[o.orderId] || 0;
  }

  const topAgents = Object.entries(agentStats)
    .map(([agentId, stats]) => ({
      agentId,
      orders: stats.orders,
      revUsd: Math.round(stats.revUsd * 100) / 100,
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  return NextResponse.json({
    code: decodedCode,
    windows: {
      "30d": windowData(30),
      "60d": windowData(60),
      "90d": windowData(90),
    },
    topAgents,
    generatedAt: new Date().toISOString(),
  });
}
