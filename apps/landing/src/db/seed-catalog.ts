// apps/landing/src/db/seed-catalog.ts
// Seeds the StampedAgents `agents` table with the six lot records
// from lib/catalog-data.ts so license FK references resolve.
// Idempotent — uses INSERT ... ON CONFLICT DO NOTHING.
// Run: pnpm db:seed

import postgres from "postgres";

// `?? ""` keeps the declared type `string` so the narrowing survives into
// runSeed() below; the guard still throws on an unset/empty value.
const connectionString: string = process.env.DATABASE_URL ?? "";
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required (no dev default; set it in .env or docker-compose)",
  );
}
const SCHEMA = process.env.STAMPED_AGENTS_DB_SCHEMA ?? "stampedagents";

const AGENTS = [
  {
    id: "lot-042",
    lotNumber: 42,
    displayName: "Anders",
    category: "sdr",
    blurb: "Outbound SDR. Works the inbox. Books meetings against your ICP.",
    provenanceTrainedBy: "Mira Rao",
    provenanceShipCount: 18,
    provenanceCostPerAction: 0.42,
    driftStatus: "green",
  },
  {
    id: "lot-047",
    lotNumber: 47,
    displayName: "Hatfield",
    category: "support",
    blurb: "Tier-1 concierge. Closes 71% of tickets without a handoff.",
    provenanceTrainedBy: "Sara Okereke",
    provenanceShipCount: 11,
    provenanceCostPerAction: 0.31,
    driftStatus: "green",
  },
  {
    id: "lot-051",
    lotNumber: 51,
    displayName: "Vance",
    category: "research",
    blurb: "Decision-grade market research. Cited. Two-day SLA.",
    provenanceTrainedBy: "Theo Kapoor",
    provenanceShipCount: 14,
    provenanceCostPerAction: 1.20,
    driftStatus: "green",
  },
  {
    id: "lot-054",
    lotNumber: 54,
    displayName: "Brunel",
    category: "ops",
    blurb: "Internal ops auditor. Watches your tools. Files anomalies.",
    provenanceTrainedBy: "Joon Park",
    provenanceShipCount: 7,
    provenanceCostPerAction: 0.55,
    driftStatus: "green",
  },
  {
    id: "lot-058",
    lotNumber: 58,
    displayName: "Lermontov",
    category: "sdr",
    blurb: "Inbound qualifier. Books demos with the buyer, not the form.",
    provenanceTrainedBy: "Mira Rao",
    provenanceShipCount: 9,
    provenanceCostPerAction: 0.38,
    driftStatus: "yellow",
  },
  {
    id: "lot-061",
    lotNumber: 61,
    displayName: "Whitfield",
    category: "research",
    blurb: "Competitive intel. Weekly briefs against your top five.",
    provenanceTrainedBy: "Theo Kapoor",
    provenanceShipCount: 5,
    provenanceCostPerAction: 1.45,
    driftStatus: "green",
  },
];

const REFERRALS = [
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
];

export async function runSeed(): Promise<void> {
  const sql = postgres(connectionString, { connect_timeout: 10, max: 1 });
  try {
    for (const a of AGENTS) {
      await sql`
        INSERT INTO "${sql.unsafe(SCHEMA)}".agents
          (id, lot_number, display_name, category, blurb,
           provenance_trained_by, provenance_ship_count,
           cost_per_action, drift_status)
        VALUES
          (${a.id}, ${a.lotNumber}, ${a.displayName}, ${a.category}, ${a.blurb},
           ${a.provenanceTrainedBy}, ${a.provenanceShipCount},
           ${a.provenanceCostPerAction}, ${a.driftStatus})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    for (const r of REFERRALS) {
      await sql`
        INSERT INTO "${sql.unsafe(SCHEMA)}".referrals
          (code, agency_name, contact_email, rev_share_bps, active)
        VALUES
          (${r.code}, ${r.agencyName}, ${r.contactEmail}, ${r.revShareBps}, ${r.active})
        ON CONFLICT (code) DO NOTHING
      `;
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log(`[db:seed] ${AGENTS.length} agents + ${REFERRALS.length} referrals inserted into "${SCHEMA}"`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[db:seed] failed:", err);
      process.exit(1);
    });
}
