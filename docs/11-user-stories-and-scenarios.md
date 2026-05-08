# 11 — User Stories and Scenarios

This document is the canonical input contract for StampedAgents's Phase 2 SaaS implementation. It enumerates personas, primary user stories, end-to-end scenarios (happy paths, edge cases, anti-scenarios), and ties each flow to the frontend touch-points and backend services that doc 12 specifies. Every API endpoint in doc 12 must trace back to at least one story here; no orphan endpoints, no orphan stories.

StampedAgents's product surface is a **catalog of vetted AI agents** (the shelf), with three buyer tiers (Trial / Pro / Enterprise), one self-serve checkout rail (NOWPayments), and a Concierge rail that bridges in-page demo to purchase in under ten minutes.

---

## 1. Personas summary

### P1 — Mira, VP RevOps, $7M ARR SaaS (primary; deep dive in `05-audience-profile.md` §1)

34, three years in role, reports to the CRO. One AI pilot shipped, one stalled. Buys on the company card up to ~$10k/yr without committee. Her core need: *three SDR options on a shelf with reference customers and a price tag, by Friday.* Voice cue: "show me a name, a number, and what it cost to run." Lives in RevGenius, Pavilion, AdvisorTo Slack.

### P2 — Alex, Agency Principal, 14-person shop (secondary; deep dive in `05-audience-profile.md` §2)

41, runs a B2B RevOps agency in NYC. Resells productized services. Already pays for OpenAI, Anthropic, Apollo on his own card. Core need: *a vetted catalog he can put a margin on without staking his reputation on a tool with no provenance.* Voice cue: "I need to be able to say 'I run that' without making it up."

### P3 — Tomás, Founder/COO, $14M ARR Marketplace (new in this doc, secondary)

39, runs a 60-person two-sided marketplace. Owns a function (Operations) but also a budget. Buys when the agent maps to a named cost center (e.g., "support backlog"). Core need: *named outcomes, not capability claims.* Voice cue: "what does this replace on my org chart?"

### Anti-personas (out of scope — see doc 05 §3)

The no-code dabbler (wants a playground), Fortune-500 procurement (wants 60-page MSA), and the pure consumer (no personal-AI fit). No flows in this doc serve these segments — the implementation should explicitly reject them at the marketing-channel boundary, not at the checkout boundary.

---

## 2. Primary user stories

10 stories that cover the core product loop end-to-end (discovery → demo → purchase → recurring use → escalation). Each maps to ≥1 scenario in §3 and ≥1 endpoint in doc 12 §3.

1. **As Mira, I want to see three SDR-tier agents stacked above the fold with their lot numbers, named operators, and 30-day acceptance rates, so that I can decide within 60 seconds whether this is a real shelf or another no-code marketplace.** *(US-01)*
2. **As Mira, I want to demo an agent against my own inbox or against a sample inbox, so that I can verify the agent works end-to-end before committing $499.** *(US-02)*
3. **As Mira, I want to see the price on every catalog card, so that I never have to "request a demo" to learn what something costs.** *(US-03)*
4. **As Mira, I want to pay $499/mo in USDT or USDC on Polygon or Tron, so that I don't have to wait for a card-merchant onboarding.** *(US-04)*
5. **As Mira, I want a weekly digest with named numbers ("Anders sent 312 emails, 41 replies, 8 meetings"), so that I can defend the spend in next week's pipeline review.** *(US-05)*
6. **As Mira, I want to add a second agent to my account in <5 minutes with no re-onboarding, so that I can compound the value of one paid relationship.** *(US-06)*
7. **As Alex, I want to apply a partner code at checkout that pays my agency 30% of the line, so that I can resell without reinventing billing.** *(US-07)*
8. **As Alex, I want to point a prospect at a public catalog page and say "Lot 042 — Anders, SDR — I run that for three of my clients" without making it up, so that I can stake my brand on the agent's provenance record.** *(US-08)*
9. **As Tomás, I want to see what the agent replaces on the org chart (named outcome, not capability claim), so that I can map the spend to a cost center.** *(US-09)*
10. **As Tomás, I want an Enterprise CTA that creates a NOWPayments invoice within 24h after a Concierge call, so that I can pay without a 6-week procurement cycle.** *(US-10)*
11. **As any buyer, I want a refund within 14 days for the Trial tier if the agent fails its eval log, so that I'm not locked in by a signed-up-and-forgot subscription.** *(US-11)*
12. **As any buyer, I want a public eval log per agent (last 90 days of runs), so that I can audit drift without a sales call.** *(US-12)*

---

## 3. Main scenarios (happy paths)

### Scenario 1 — Self-serve Trial purchase (Mira, SDR agent)

**Trigger.** Mira clicks a Slack DM from a peer at RevGenius linking to `https://agent-that-sells-agents.prin7r.com`.

**Steps.**
1. Mira lands on the hero. *Frontend: `BlueprintHero`, `ConciergeRail` (idle state) on `apps/landing/app/page.tsx`.*
2. She reads three lot ribbons under the hero (`Lot 042 — Anders, SDR — 18 ops teams since Feb`). *Frontend: `LotRibbon[]`.*
3. Scrolls to the `CatalogGrid`. Sees 6 `AgentCard`s. Clicks **Demo** on the SDR card. *Backend: `GET /api/catalog/agents/:agentId` returns the agent's provenance record + demo script.*
4. The `ConciergeRail` opens an in-page demo sheet. Asks: "your inbox or ours?" Mira picks "ours" for speed. *Frontend: `DemoSheet`.*
5. The 4-step scripted demo runs (pull lead → draft email → qualify → hand off). *Backend: scripted, no external LLM call in the demo path; the actual production agent uses BYO endpoint.*
6. The demo ends and surfaces 3 `PricingTier` cards — Trial / Pro / Enterprise — with a NOWPayments CTA on each.
7. Mira clicks **Buy — Trial $99**. Browser POSTs to `/api/checkout/nowpayments` with `{ tierId: 'trial', agentId: 'lot-042' }`. *Backend: `POST /api/checkout/nowpayments` (doc 12 §3.2) builds a NOWPayments hosted invoice with `order_id = trial-{uuid}-lot-042`, returns `{ checkoutUrl, orderId }`.*
8. Browser redirects to the NOWPayments hosted page. Mira pays $99 in USDT-Polygon.
9. NOWPayments POSTs an IPN to `/api/webhooks/nowpayments`. Server verifies HMAC-SHA512 on sorted-keys JSON of payload using `NOWPAYMENTS_IPN_SECRET`. *Backend: `POST /api/webhooks/nowpayments` → `OrderService.markPaid(orderId)` → `LicenseService.issue(orderId)`.*
10. (Wave 3) Mira receives an email with her license key + dashboard link.

**Success criteria.** Order persisted with `status='paid'`, license issued within 5s of IPN. Time-to-first-CTA <60s, time-to-purchase <10min. No "request a demo" friction.

**Frontend touch-points.** `BlueprintHero`, `LotRibbon`, `CatalogGrid`, `AgentCard`, `DemoSheet`, `ConciergeRail`, `PricingTier`, success-redirect page (Wave 3).
**Backend touch-points.** `GET /api/catalog/agents/:agentId`, `POST /api/checkout/nowpayments`, `POST /api/webhooks/nowpayments`, `OrderService`, `LicenseService`.

### Scenario 2 — Pro tier upgrade with second agent (Mira, week 2)

**Trigger.** Mira completed the Trial purchase last week. She gets a weekly digest email.

**Steps.**
1. Mira clicks the digest link. Dashboard (Wave 3) loads with her current agent's 7-day numbers.
2. She clicks **Add another agent**. Catalog opens with an `Owned` filter showing what she has and what's available.
3. Selects Lot 047 (Support concierge). Clicks **Buy — Pro $499**.
4. POST `/api/checkout/nowpayments` with `{ tierId: 'pro', agentId: 'lot-047', upgradeFrom: 'trial' }`. Server prorates the trial credit and returns the upgrade invoice.
5. Mira pays. IPN fires. `LicenseService` issues a Pro license; `OrderService` archives the trial.

**Success criteria.** Upgrade from Trial → Pro adds the second agent without re-onboarding. Total elapsed time <5min.

**Frontend touch-points.** `Dashboard`, `OwnedFilter`, `CatalogGrid`, `PricingTier`.
**Backend touch-points.** `POST /api/checkout/nowpayments` (with `upgradeFrom`), `OrderService.upgrade()`, `LicenseService.reissue()`.

### Scenario 3 — Agency-partner referral (Alex)

**Trigger.** Alex's agency-partner code is `AGENCY-NYC-014`. He emails a prospect a catalog link with `?ref=AGENCY-NYC-014`.

**Steps.**
1. Prospect lands. The `?ref` param is stored in a 30-day cookie + appended to checkout requests. *Frontend: `useReferral` hook.*
2. Prospect demos and buys Pro $499. The checkout body includes `referralCode: 'AGENCY-NYC-014'`. *Backend: `POST /api/checkout/nowpayments` records the code on the order.*
3. IPN marks paid. `RevShareService` records 30% ($149.70) accrued to Alex's agency on the line item.
4. End-of-month (Wave 3): Alex receives a USDT payout invoice for the accrued amount.

**Success criteria.** Referral code persists across the demo → checkout → payment flow. Rev-share accrues without manual reconciliation.

### Scenario 4 — Enterprise concierge close (Tomás)

**Trigger.** Tomás clicks **Talk to Concierge — Enterprise** on the Pricing tier.

**Steps.**
1. `ConciergeRail` opens a scheduling sheet (Wave 3 calendar embed).
2. Tomás books a 30-min call. Concierge agent (human-in-the-loop, Wave 2; agent-driven Wave 3) joins, scopes 3 agents + 50k actions/mo, $4,800/yr.
3. Concierge issues an Enterprise invoice via `POST /api/admin/invoices` (admin-only endpoint, Bearer auth). Invoice URL is sent to Tomás by email.
4. Tomás pays via the same NOWPayments hosted page (`POST /v1/invoice` with `order_id = enterprise-{uuid}-{customerId}`).
5. IPN fires. License issued. Onboarding kickoff scheduled.

**Success criteria.** Concierge → invoice in <24h; payment to onboarding kickoff in <72h.

**Frontend touch-points.** `ConciergeRail` (scheduling), Enterprise CTA.
**Backend touch-points.** `POST /api/admin/invoices` (admin Bearer), `POST /api/webhooks/nowpayments`, `LicenseService`.

### Scenario 5 — Eval-log audit (any buyer)

**Trigger.** A prospect wants to verify drift before paying.

**Steps.**
1. Prospect clicks **View eval log** on an `AgentCard`. *Frontend: `EvalLogModal`.*
2. Modal fetches `GET /api/catalog/agents/:agentId/evals?since=90d`. Server returns the last 90 days of eval runs (corpus name, score, evaluator, run-date).
3. Modal renders a sparkline + a table. No PII; all eval data is public for catalog agents.

**Success criteria.** Eval data is publicly readable without auth. Drift visualized with the same numbers cited on the lot ribbon.

### Scenario 6 — Outcome-based pricing toggle (Mira, SDR agent at Pro)

**Trigger.** Mira on Pro $499/mo wants to swap to per-meeting pricing.

**Steps.**
1. Dashboard (Wave 3) → Settings → **Switch to outcome-based**.
2. Form previews: "$499 flat or $80/booked-meeting (cap 1.5x flat = $748.50)."
3. Mira confirms. `POST /api/billing/switch-mode` updates the order's pricing rule.
4. End-of-month: NOWPayments invoice for actual usage (capped).

**Success criteria.** Switch is reversible monthly. Cap enforced at 1.5x flat.

---

## 4. Edge case scenarios

### EC-1 — IPN arrives before the user returns from NOWPayments

The webhook handler must be idempotent on `orderId`. If `OrderService.markPaid(orderId)` is called twice (once from the IPN, once from a server-side refresh on the success page), the second call must be a no-op.

### EC-2 — Buyer drops off after `POST /api/checkout/nowpayments` but before payment

The order persists as `status='pending'`. A daily sweeper expires pending orders >24h old. If the buyer returns within 24h with the same `orderId` cookie, the same invoice is shown rather than a new one created.

### EC-3 — Refund within 14 days (Trial only)

Buyer emails `support@prin7r.com` (Wave 2: human-in-the-loop). Concierge issues a refund via NOWPayments dashboard, then `POST /api/admin/orders/:orderId/refund` records the refund and revokes the license. Pro and Enterprise tiers have no automatic refund — see anti-scenarios.

### EC-4 — Agent eval drops below threshold

If an agent's 30-day eval drops >2σ below its baseline, the catalog page shows a yellow "Drift watch" badge. New buyers see the badge before they buy. Existing Pro+ buyers receive an email; if they choose to pause, the next billing cycle is skipped.

### EC-5 — Concurrent demos by the same agent

`DemoSheet` runs are stateless (no LLM calls in the demo path). Concurrency is not a constraint. If we move to BYO-endpoint live demos in Wave 3, we add a per-agent rate limit at Traefik.

### EC-6 — Partner code applied to Trial tier

Allowed. Rev-share accrues at 30% on the $99/mo line. (We accept the tradeoff: agency partners may funnel low-tier traffic; we'd rather have the data than block the code.)

---

## 5. Anti-scenarios

### AS-1 — No-code playground / "build your own agent"

The catalog is curated. There is no UI to create a new agent from the buyer side. If a prospect asks for this in the Concierge rail, the rail responds: "StampedAgents is a vetted catalog, not a builder. We can refer you to a no-code agent platform." The implementation must NOT add a builder route, even as a hidden flag.

### AS-2 — Free tier / freemium

There is no $0 tier. The Trial is $99/mo and is the floor. Implementation should NOT add a "free preview" mode that bypasses checkout.

### AS-3 — Marketing-modal coupon codes

Discounts are negotiated by the Concierge rail, not by a public coupon UI. There is no `couponCode` field on the public checkout endpoint — only `referralCode` (which is partner-scoped, not buyer-scoped).

### AS-4 — Procurement-grade MSA flows

Wave 2 does not staff a 60-page MSA review. If a Fortune-500 contact asks for one, the Concierge politely declines and offers the standard Enterprise terms. The implementation must NOT add a custom-contract upload form.

### AS-5 — Personal-AI / consumer use cases

The pricing floor ($99/mo) and the catalog (B2B agents only) deliberately filter out consumer buyers. The implementation must NOT add a personal-tier or social-login path.

---

## 6. Cross-references to docs 12 and 13

- §2 stories US-01..US-12 → doc 12 §3 endpoints (catalog, checkout, webhook, admin invoice, billing switch, eval log, refund).
- §3 scenarios → doc 12 §1 architecture diagram services + doc 13 phase Definitions of Done.
- §4 edge cases → doc 12 §7 security controls (idempotency, rate limit, refund) + doc 13 phase 5 (production hardening).
- §5 anti-scenarios → doc 12 §10 non-goals.
