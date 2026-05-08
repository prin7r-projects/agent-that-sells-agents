export type AgentRole = "Sales" | "Support" | "Research" | "Ops";

export type Agent = {
  lot: string;
  name: string;
  role: AgentRole;
  blurb: string;
  trainedBy: string;
  deployedSince: string;
  outcomes: { label: string; value: string }[];
  references: number;
  lastAudit: string;
};

export const agents: Agent[] = [
  {
    lot: "042",
    name: "Anders",
    role: "Sales",
    blurb: "Outbound SDR. Works the inbox. Books meetings against your ICP.",
    trainedBy: "Mira Rao",
    deployedSince: "2026-02-04",
    outcomes: [
      { label: "Sends / mo", value: "312" },
      { label: "Reply rate", value: "42%" },
      { label: "Meetings", value: "8" },
    ],
    references: 18,
    lastAudit: "2026-04-30",
  },
  {
    lot: "047",
    name: "Hatfield",
    role: "Support",
    blurb: "Tier-1 concierge. Closes 71% of tickets without a handoff.",
    trainedBy: "Sara Okereke",
    deployedSince: "2026-02-22",
    outcomes: [
      { label: "Tickets / wk", value: "428" },
      { label: "First-touch close", value: "71%" },
      { label: "CSAT", value: "4.7" },
    ],
    references: 11,
    lastAudit: "2026-04-30",
  },
  {
    lot: "051",
    name: "Vance",
    role: "Research",
    blurb: "Decision-grade market research. Cited. Two-day SLA.",
    trainedBy: "Theo Kapoor",
    deployedSince: "2026-03-08",
    outcomes: [
      { label: "Reports / mo", value: "63" },
      { label: "Avg sources", value: "41" },
      { label: "Rework rate", value: "9%" },
    ],
    references: 14,
    lastAudit: "2026-04-22",
  },
  {
    lot: "054",
    name: "Brunel",
    role: "Ops",
    blurb: "Internal ops auditor. Watches your tools. Files anomalies.",
    trainedBy: "Joon Park",
    deployedSince: "2026-03-19",
    outcomes: [
      { label: "Tools watched", value: "27" },
      { label: "Findings / wk", value: "19" },
      { label: "False positive", value: "6%" },
    ],
    references: 7,
    lastAudit: "2026-05-01",
  },
  {
    lot: "058",
    name: "Lermontov",
    role: "Sales",
    blurb: "Inbound qualifier. Books demos with the buyer, not the form.",
    trainedBy: "Mira Rao",
    deployedSince: "2026-04-02",
    outcomes: [
      { label: "Conversations", value: "1.2k" },
      { label: "Qualified", value: "31%" },
      { label: "Booked", value: "188" },
    ],
    references: 9,
    lastAudit: "2026-04-30",
  },
  {
    lot: "061",
    name: "Whitfield",
    role: "Research",
    blurb: "Competitive intel. Weekly briefs against your top five.",
    trainedBy: "Theo Kapoor",
    deployedSince: "2026-04-14",
    outcomes: [
      { label: "Briefs / mo", value: "20" },
      { label: "Cited claims", value: "342" },
      { label: "Read-through", value: "84%" },
    ],
    references: 5,
    lastAudit: "2026-05-02",
  },
];

export type Tier = {
  id: "trial" | "pro" | "enterprise";
  name: string;
  priceLabel: string;
  cadence: string;
  highlight?: boolean;
  amountUsd: number;
  features: string[];
  ctaLabel: string;
};

export const tiers: Tier[] = [
  {
    id: "trial",
    name: "Trial",
    priceLabel: "$99",
    cadence: "/ month — cancel anytime",
    amountUsd: 99,
    features: [
      "One agent from the catalog",
      "Up to 500 actions / month",
      "Single seat",
      "Weekly digest",
    ],
    ctaLabel: "Buy Trial — pay in USDT/USDC",
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "$499",
    cadence: "/ month — 6-month commit",
    highlight: true,
    amountUsd: 499,
    features: [
      "Up to three agents",
      "5k actions / month",
      "Three seats",
      "Monthly retraining slot",
      "Named human owner",
    ],
    ctaLabel: "Buy Pro — pay in USDT/USDC",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "$4,800+",
    cadence: "/ year — concierge invoice",
    amountUsd: 4800,
    features: [
      "Unlimited catalog access",
      "50k actions / month",
      "Dedicated channel",
      "Custom retraining",
      "99.5% reachability SLO",
    ],
    ctaLabel: "Issue invoice — concierge",
  },
];
