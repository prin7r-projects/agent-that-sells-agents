import { NextResponse } from "next/server";
import { validateAdminToken, getBearerToken } from "@/lib/server/auth";
import { LicenseService } from "@/lib/server/orders";
import { loadAgents, type Agent } from "@/lib/catalog-data";

export const runtime = "nodejs";

/**
 * GET /api/admin/drift-cohorts — Drift-watch churn measurement (docs/13 Phase 6 Task 3)
 * Measures churn rate for customers whose agent is yellow vs green over 30 days.
 */
export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!validateAdminToken(token)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Valid ADMIN_API_KEY required." } },
      { status: 401 },
    );
  }

  const agents: Agent[] = loadAgents();
  const agentDrift = new Map(agents.map((a) => [a.id, a.driftStatus]));

  const allLicenses = await LicenseService.listAll();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const windowDays = 30;
  const windowStart = now - windowDays * dayMs;

  // Categorise licenses by their agent's drift status at issue time
  // Churn = revoked within the 30-day window
  const cohorts: Record<string, { total: number; churned: number }> = {
    green: { total: 0, churned: 0 },
    yellow: { total: 0, churned: 0 },
    red: { total: 0, churned: 0 },
    unknown: { total: 0, churned: 0 },
  };

  for (const lic of allLicenses) {
    const drift = agentDrift.get(lic.agentId) ?? "unknown";
    const issued = new Date(lic.issuedAt).getTime();
    // Only count licenses issued within the last 90 days (recent enough to be in cohort)
    if (issued < now - 90 * dayMs) continue;

    cohorts[drift].total++;

    const revoked = lic.revokedAt ? new Date(lic.revokedAt).getTime() : null;
    if (revoked && revoked >= windowStart && revoked <= now) {
      cohorts[drift].churned++;
    }
  }

  const result = Object.entries(cohorts).map(([status, data]) => ({
    driftStatus: status,
    totalLicenses: data.total,
    churned30d: data.churned,
    churnRate: data.total > 0 ? Math.round((data.churned / data.total) * 10000) / 10000 : 0,
  }));

  return NextResponse.json({
    windowDays,
    generatedAt: new Date().toISOString(),
    cohorts: result,
  });
}
