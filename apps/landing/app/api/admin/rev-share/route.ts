import { NextResponse } from "next/server";
import { validateAdminToken, getBearerToken } from "@/lib/server/auth";
import { RevShareService } from "@/lib/server/orders";

export const runtime = "nodejs";

/**
 * GET /api/admin/rev-share — List all rev-share accruals (admin only)
 */
export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!validateAdminToken(token)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid ADMIN_API_KEY required." } },
      { status: 401 },
    );
  }

  const entries = RevShareService.listAll();
  const stats = RevShareService.stats();

  return NextResponse.json({
    entries,
    stats,
  });
}
