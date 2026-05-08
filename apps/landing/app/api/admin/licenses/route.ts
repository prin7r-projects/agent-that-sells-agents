import { NextResponse } from "next/server";
import { validateAdminToken, getBearerToken } from "@/lib/server/auth";
import { LicenseService } from "@/lib/server/orders";

export const runtime = "nodejs";

/**
 * GET /api/admin/licenses — List all licenses (admin only)
 */
export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!validateAdminToken(token)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid ADMIN_API_KEY required." } },
      { status: 401 },
    );
  }

  const licenses = await LicenseService.listAll();
  const active = licenses.filter((l) => !l.revokedAt && new Date(l.validUntil) > new Date()).length;
  const revoked = licenses.filter((l) => l.revokedAt).length;

  return NextResponse.json({
    licenses,
    stats: {
      total: licenses.length,
      active,
      revoked,
    },
  });
}
