import { NextResponse } from "next/server";
import { getAgent, getEvalsForAgent } from "@/lib/catalog-data";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const agent = getAgent(id);

  if (!agent) {
    return NextResponse.json(
      { error: { code: "agent_not_found", message: `Agent ${id} not found.` } },
      { status: 404 },
    );
  }

  const evals = getEvalsForAgent(id, 90);
  const scores = evals.map((e) => e.scoreBps);

  return NextResponse.json({
    id: agent.id,
    lotNumber: agent.lotNumber,
    displayName: agent.displayName,
    category: agent.category,
    blurb: agent.blurb,
    provenance: agent.provenance,
    deployedSince: agent.deployedSince,
    driftStatus: agent.driftStatus,
    outcomes: agent.outcomes,
    references: agent.references,
    lastAudit: agent.lastAudit,
    recentEvalsSummary: evals.length > 0
      ? {
          count: evals.length,
          avgScoreBps: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          lastRunDate: evals[evals.length - 1].runDate,
        }
      : { count: 0, avgScoreBps: null },
  });
}
