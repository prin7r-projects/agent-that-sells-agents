import { NextResponse } from "next/server";
import { loadAgents, agentsToCatalogSummary } from "@/lib/catalog-data";

export const runtime = "nodejs";
// dynamic export: ISR static files dont route correctly through Traefik in standalone mode
// Keep as dynamic — catalog data is in-memory and fast

export async function GET() {
  const agents = loadAgents();
  return NextResponse.json({
    agents: agentsToCatalogSummary(agents),
    total: agents.length,
    categories: [...new Set(agents.map((a) => a.category))].sort(),
  });
}
