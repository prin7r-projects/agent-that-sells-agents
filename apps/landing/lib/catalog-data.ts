// Catalog data — seed agents and eval runs.
// Phase 1: static data. Phase 2+: DB-backed.

export interface Agent {
  id: string;
  lotNumber: number;
  displayName: string;
  category: string;
  blurb: string;
  provenance: {
    trainedBy: string;
    shipCount: number;
    costPerAction: number;
  };
  deployedSince: string;
  driftStatus: string;
  outcomes: { label: string; value: string }[];
  references: number;
  lastAudit: string;
}

export interface EvalRun {
  corpus: string;
  scoreBps: number;
  evaluator: string;
  runDate: string;
}

// ── SEED AGENTS ────────────────────────────────────────────────────────────
const agents: Agent[] = [
  {
    id: "lot-042",
    lotNumber: 42,
    displayName: "Anders",
    category: "sdr",
    blurb: "Outbound SDR. Works the inbox. Books meetings against your ICP.",
    provenance: { trainedBy: "Mira Rao", shipCount: 18, costPerAction: 0.42 },
    deployedSince: "2026-02-04",
    driftStatus: "green",
    outcomes: [
      { label: "Sends / mo", value: "312" },
      { label: "Reply rate", value: "42%" },
      { label: "Meetings", value: "8" },
    ],
    references: 18,
    lastAudit: "2026-04-30",
  },
  {
    id: "lot-047",
    lotNumber: 47,
    displayName: "Hatfield",
    category: "support",
    blurb: "Tier-1 concierge. Closes 71% of tickets without a handoff.",
    provenance: { trainedBy: "Sara Okereke", shipCount: 11, costPerAction: 0.31 },
    deployedSince: "2026-02-22",
    driftStatus: "green",
    outcomes: [
      { label: "Tickets / wk", value: "428" },
      { label: "First-touch close", value: "71%" },
      { label: "CSAT", value: "4.7" },
    ],
    references: 11,
    lastAudit: "2026-04-30",
  },
  {
    id: "lot-051",
    lotNumber: 51,
    displayName: "Vance",
    category: "research",
    blurb: "Decision-grade market research. Cited. Two-day SLA.",
    provenance: { trainedBy: "Theo Kapoor", shipCount: 14, costPerAction: 1.20 },
    deployedSince: "2026-03-08",
    driftStatus: "green",
    outcomes: [
      { label: "Reports / mo", value: "63" },
      { label: "Avg sources", value: "41" },
      { label: "Rework rate", value: "9%" },
    ],
    references: 14,
    lastAudit: "2026-04-22",
  },
  {
    id: "lot-054",
    lotNumber: 54,
    displayName: "Brunel",
    category: "ops",
    blurb: "Internal ops auditor. Watches your tools. Files anomalies.",
    provenance: { trainedBy: "Joon Park", shipCount: 7, costPerAction: 0.55 },
    deployedSince: "2026-03-19",
    driftStatus: "green",
    outcomes: [
      { label: "Tools watched", value: "27" },
      { label: "Findings / wk", value: "19" },
      { label: "False positive", value: "6%" },
    ],
    references: 7,
    lastAudit: "2026-05-01",
  },
  {
    id: "lot-058",
    lotNumber: 58,
    displayName: "Lermontov",
    category: "sdr",
    blurb: "Inbound qualifier. Books demos with the buyer, not the form.",
    provenance: { trainedBy: "Mira Rao", shipCount: 9, costPerAction: 0.38 },
    deployedSince: "2026-04-02",
    driftStatus: "yellow",
    outcomes: [
      { label: "Conversations", value: "1.2k" },
      { label: "Qualified", value: "31%" },
      { label: "Booked", value: "188" },
    ],
    references: 9,
    lastAudit: "2026-04-30",
  },
  {
    id: "lot-061",
    lotNumber: 61,
    displayName: "Whitfield",
    category: "research",
    blurb: "Competitive intel. Weekly briefs against your top five.",
    provenance: { trainedBy: "Theo Kapoor", shipCount: 5, costPerAction: 1.45 },
    deployedSince: "2026-04-14",
    driftStatus: "green",
    outcomes: [
      { label: "Briefs / mo", value: "20" },
      { label: "Cited claims", value: "342" },
      { label: "Read-through", value: "84%" },
    ],
    references: 5,
    lastAudit: "2026-05-02",
  },
];

// ── SEED EVAL RUNS ─────────────────────────────────────────────────────────
const evals: Record<string, EvalRun[]> = {
  "lot-042": [
    { corpus: "inbox-prod-q1-2026", scoreBps: 9420, evaluator: "Mira Rao", runDate: "2026-04-15" },
    { corpus: "inbox-prod-q1-2026", scoreBps: 9375, evaluator: "Mira Rao", runDate: "2026-04-30" },
    { corpus: "inbox-prod-q2-2026", scoreBps: 9500, evaluator: "Mira Rao", runDate: "2026-05-05" },
  ],
  "lot-047": [
    { corpus: "tickets-q1-2026", scoreBps: 8890, evaluator: "Sara Okereke", runDate: "2026-04-15" },
    { corpus: "tickets-q1-2026", scoreBps: 8920, evaluator: "Sara Okereke", runDate: "2026-05-01" },
  ],
  "lot-051": [
    { corpus: "research-q1-2026", scoreBps: 9150, evaluator: "Theo Kapoor", runDate: "2026-04-22" },
    { corpus: "research-q2-2026", scoreBps: 9230, evaluator: "Theo Kapoor", runDate: "2026-05-03" },
  ],
  "lot-054": [
    { corpus: "ops-audit-q2-2026", scoreBps: 8740, evaluator: "Joon Park", runDate: "2026-05-01" },
  ],
  "lot-058": [
    { corpus: "inbound-q1-2026", scoreBps: 9075, evaluator: "Mira Rao", runDate: "2026-04-30" },
    { corpus: "inbound-q2-2026", scoreBps: 8820, evaluator: "Mira Rao", runDate: "2026-05-02" },
  ],
  "lot-061": [
    { corpus: "comp-intel-q1-2026", scoreBps: 9340, evaluator: "Theo Kapoor", runDate: "2026-05-02" },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────
export function loadAgents(): Agent[] {
  return agents;
}

export function loadEvals(): Record<string, EvalRun[]> {
  return evals;
}

export function getAgent(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export function getEvalsForAgent(agentId: string, sinceDays = 90): EvalRun[] {
  const all = evals[agentId] ?? [];
  if (sinceDays <= 0) return all;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - sinceDays);
  return all.filter((e) => new Date(e.runDate) >= cutoff);
}

export function agentsToCatalogSummary(agentList: Agent[]) {
  return agentList.map((a) => ({
    id: a.id,
    lotNumber: a.lotNumber,
    displayName: a.displayName,
    category: a.category,
    blurb: a.blurb,
    provenance: a.provenance,
    deployedSince: a.deployedSince,
    driftStatus: a.driftStatus,
    recentEvalsSummary: summarizeEvals(getEvalsForAgent(a.id, 90)),
  }));
}

function summarizeEvals(runs: EvalRun[]) {
  if (runs.length === 0) return { count: 0, avgScoreBps: null };
  const scores = runs.map((r) => r.scoreBps);
  return {
    count: runs.length,
    avgScoreBps: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    lastRunDate: runs[runs.length - 1].runDate,
  };
}
