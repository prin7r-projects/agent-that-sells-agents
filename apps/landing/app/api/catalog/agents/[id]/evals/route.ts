import { NextRequest, NextResponse } from "next/server";
import { getAgent, getEvalsForAgent } from "@/lib/catalog-data";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 60;

export async function GET(
  request: NextRequest,
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

  const sinceParam = request.nextUrl.searchParams.get("since");
  const sinceDays = sinceParam ? parseInt(sinceParam, 10) : 90;

  const runs = getEvalsForAgent(id, sinceDays);
  const scores = runs.map((r) => r.scoreBps);
  const baselineBps = 8500; // Fixed baseline for all agents

  return NextResponse.json({
    agentId: id,
    runs,
    baselineBps,
    current30dMeanBps:
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null,
  });
}
