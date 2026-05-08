# 07 — Sales Strategy

## Motion

**Hybrid PLG + curated.** The catalog is self-serve up to the Pro tier; Enterprise is concierge-led but priced on the page. The Concierge rail on the landing is the bridge — it qualifies in-flow, hands off only when needed.

## Pricing tiers (visible on the landing)

| Tier | Price | What's included | Crypto CTA |
|------|-------|-----------------|------------|
| **Trial** | $99/mo · cancel anytime | One agent, up to 500 actions/mo, single seat, weekly digest. | Pay with USDT/USDC via NOWPayments |
| **Pro** | $499/mo · 6-month commit | Up to three agents, 5k actions/mo, three seats, monthly retraining slot, named owner. | Pay with USDT/USDC via NOWPayments |
| **Enterprise** | from $4,800/yr | Unlimited agents in catalog, 50k actions/mo, dedicated channel, custom agent retraining, 99.5% SLO. | Pay with USDT/USDC via NOWPayments — invoice issued by Concierge |

Outcome-based pricing is supported as a footnote on Pro and Enterprise — for SDR and Support agents, the buyer can swap a flat fee for a per-meeting / per-resolved-ticket rate, capped at 1.5x the flat tier.

## Discounts

- **Annual.** 2 months free on Pro, 15% off Enterprise.
- **Agency partners (Alex's cohort).** 30% rev-share to the agency on Pro/Enterprise referrals; partner code shipped on the agent's page.
- **No public coupon codes.** Discounts are negotiated by the Concierge agent, not by a marketing modal.

## Objection handling (script for the Concierge rail)

| Objection | Response |
|-----------|----------|
| "We need to keep the model in our VPC." | Pro and Enterprise support BYO endpoint (Bedrock, Vertex, Azure OpenAI). Trial uses our hosted stack. |
| "What's the SLO?" | 99.5% reachability for Pro, hard-targets per-agent for Enterprise (e.g., SDR: 100 actions/day, 30-day reply rate >25%). |
| "How do you handle drift?" | Monthly retraining is part of Pro; we ship a public eval log per agent. Drift is owned by the named operator. |
| "Why crypto checkout?" | Faster than card pilots — buyers in our wedge already use stablecoin rails. Wire and ACH coming; not in v1. |
| "I want to see the prompts." | StampedAgents section lists corpus + eval method. Full prompt access is part of Enterprise. |

## Closing motion

- Self-serve checkout (NOWPayments hosted invoice) for Trial and Pro.
- Concierge-led close for Enterprise with a 24h turnaround on the invoice.
- All paid orders route to a single Slack channel (`#orders-stampedagents`) for human review of the first delivery.
