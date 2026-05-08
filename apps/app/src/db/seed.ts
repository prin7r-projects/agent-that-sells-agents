// apps/app/src/db/seed.ts — Seed script for StampedAgents database
import { db, schema } from "./index.js";

const { agents, referrals, customers, orders, licenses, evalRuns } = schema;

async function seed() {
  console.log("🌱 Seeding StampedAgents database...");

  // Seed agents
  await db.insert(agents).values([
    {
      id: "lot-042",
      lotNumber: 42,
      displayName: "Anders",
      category: "sdr",
      blurb: "AI-powered SDR that books 30+ meetings/month with enterprise prospects.",
      provenanceTrainedBy: "Triangulate Labs",
      provenanceShipCount: 47,
      provenanceCostPerAction: 2.40,
      driftStatus: "green",
    },
    {
      id: "lot-047",
      lotNumber: 47,
      displayName: "Hatfield",
      category: "support",
      blurb: "Tier-1 support agent that resolves 80% of tickets without human escalation.",
      provenanceTrainedBy: "Triangulate Labs",
      provenanceShipCount: 52,
      provenanceCostPerAction: 0.85,
      driftStatus: "green",
    },
    {
      id: "lot-051",
      lotNumber: 51,
      displayName: "Vance",
      category: "research",
      blurb: "Market research agent that delivers competitive intelligence in 10 minutes.",
      provenanceTrainedBy: "Triangulate Labs",
      provenanceShipCount: 38,
      provenanceCostPerAction: 4.20,
      driftStatus: "green",
    },
    {
      id: "lot-058",
      lotNumber: 58,
      displayName: "Reeves",
      category: "ops",
      blurb: "LinkedIn outbound agent that generates 50+ qualified leads per week.",
      provenanceTrainedBy: "Triangulate Labs",
      provenanceShipCount: 29,
      provenanceCostPerAction: 1.90,
      driftStatus: "green",
    },
    {
      id: "lot-061",
      lotNumber: 61,
      displayName: "Sterling",
      category: "sdr",
      blurb: "AE agent that handles discovery calls and pipeline management.",
      provenanceTrainedBy: "Triangulate Labs",
      provenanceShipCount: 33,
      provenanceCostPerAction: 5.60,
      driftStatus: "yellow",
    },
    {
      id: "lot-064",
      lotNumber: 64,
      displayName: "Crawford",
      category: "ops",
      blurb: "RevOps agent that automates CRM hygiene and pipeline forecasting.",
      provenanceTrainedBy: "Triangulate Labs",
      provenanceShipCount: 41,
      provenanceCostPerAction: 3.10,
      driftStatus: "green",
    },
  ])
    .onConflictDoNothing();

  // Seed referral partners
  await db.insert(referrals).values([
    {
      code: "AGENCY-NYC-014",
      agencyName: "Triangulate Agency NYC",
      contactEmail: "partners@triangulate.ai",
      revShareBps: 3000,
      active: true,
    },
    {
      code: "PARTNER-SF-007",
      agencyName: "Bay Area AI Partners",
      contactEmail: "hello@baiai.co",
      revShareBps: 2500,
      active: true,
    },
  ])
    .onConflictDoNothing();

  // Seed eval runs for lot-042
  const now = new Date();
  const evalDates = [
    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  ];

  await db.insert(evalRuns).values([
    {
      agentId: "lot-042",
      corpus: "enterprise-sdr-v2",
      scoreBps: 8750,
      evaluator: "tri-eval-3.1",
      runDate: evalDates[0],
    },
    {
      agentId: "lot-042",
      corpus: "enterprise-sdr-v2",
      scoreBps: 8620,
      evaluator: "tri-eval-3.1",
      runDate: evalDates[1],
    },
    {
      agentId: "lot-042",
      corpus: "enterprise-sdr-v2",
      scoreBps: 8490,
      evaluator: "tri-eval-3.0",
      runDate: evalDates[2],
    },
  ])
    .onConflictDoNothing();

  console.log("✅ Seed complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
