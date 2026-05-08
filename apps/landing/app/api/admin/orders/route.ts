import { NextResponse } from "next/server";
import { validateAdminToken, getBearerToken } from "@/lib/server/auth";
import { OrderService } from "@/lib/server/orders";

export const runtime = "nodejs";

/**
 * GET /api/admin/orders — List all orders (admin only)
 */
export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!validateAdminToken(token)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid ADMIN_API_KEY required." } },
      { status: 401 },
    );
  }

  const orders = OrderService.listAll();
  const stats = OrderService.stats();

  return NextResponse.json({
    orders,
    stats,
  });
}
