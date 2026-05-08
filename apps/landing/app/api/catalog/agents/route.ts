import { NextResponse } from "next/server";
import { loadAgents, agentsToCatalogSummary } from "@/lib/catalog-data";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 60;

export async function GET() {
  const agents = loadAgents();
  return NextResponse.json({
    agents: agentsToCatalogSummary(agents),
    total: agents.length,
    categories: [...new Set(agents.map((a) => a.category))].sort(),
  });
}
