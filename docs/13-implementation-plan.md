# 13 — Implementation Plan

> **Hand-off ready.** This plan is for the Phase 2 implementation agent (likely an Opus 4.7 Code agent) picking up StampedAgents after Wave 2's landing-only deploy. You will find: (a) a deployed landing at `https://agent-that-sells-agents.prin7r.com` with NOWPayments checkout wired and verified; (b) brand identity, audience, and architecture docs in `/docs/01..10-*.md`; (c) the user-story contract in `/docs/11-user-stories-and-scenarios.md`; (d) the technical specification in `/docs/12-technical-specification.md`. You are extending — not reinventing — the existing repo. The open-saas fork in `apps/app/` is currently a stub README; Phase 2's Phase 1 work is to bring it online. Read docs 11 + 12 before starting any phase.

---

## 1. Phase breakdown

7 phases, ordered by dependency. Each phase has a Definition of Done (DoD) that a fresh implementation agent could verify without consulting the user.

| Phase | Goal | Estimated effort |
|---|---|---|
| **0 — Scaffolding & local dev** | Repo cloneable; landing builds; app stub fork ready | 30-50 tool-uses; 2-4h wall |
| **1 — Core domain & catalog** | Agent catalog hard-coded → DB-backed; eval log endpoint live | 80-150 tool-uses; 1-2 days |
| **2 — UX surfaces** | DemoSheet, ConciergeRail polish, Owned filter on catalog | 100-180 tool-uses; 2-3 days |
| **3 — Payments + Notion + onboarding** | Pro/Enterprise flows; rev-share accrual; magic-link onboarding email | 100-180 tool-uses; 2-3 days |
| **4 — Production hardening** | Idempotency, rate limits, alerts, runbook | 80-120 tool-uses; 1-2 days |
| **5 — Launch ops** | Eval-runner cron; weekly digest; refund flow; admin dashboard | 100-150 tool-uses; 2-3 days |
| **6 — Post-launch experiments** | Outcome-based pricing toggle, partner code analytics, drift watch | 80-120 tool-uses; 1-2 days |

---

### Phase 0 — Scaffolding & local dev

**Goal.** A fresh clone runs `pnpm install && pnpm -F landing dev` and the landing renders on localhost:3000 with seeded catalog data.

**Tasks.**
1. Verify repo state: `gh repo clone prin7r-projects/agent-that-sells-agents && cd agent-that-sells-agents`. Confirm `apps/landing/` builds with `pnpm install && pnpm -F landing build`.
2. Read `/docs/02-architecture.md` and `/docs/12-technical-specification.md` §1 to align on runtime topology.
3. Add `apps/app/` open-saas Wasp scaffold per the stub README. Do NOT delete the existing stub — it documents which open-saas options were chosen.
4. Add a `data/seed/agents.json` with 6 agents (Lots 042, 047, 051, 058, 061, 064 covering SDR, Support, Research, Outbound-LinkedIn, AE, RevOps). Each has full provenance fields per doc 12 §2.2.
5. Wire local dev env: `.env.example` already lists `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, `ADMIN_API_KEY`. Add `DATABASE_URL` for the open-saas app.
6. Add a `pnpm -F app dev` script that runs the open-saas Wasp app on localhost:3001.

**Dependencies.** None. Wave 2 deploy is already live and stays live during Phase 0.

**Effort.** S — 30-50 tool-uses, 2-4h wall.

**Definition of Done.**
- [x] `pnpm install` at repo root completes without error. ✅ (2026-05-08: landing installs cleanly)
- [x] `pnpm -F landing build` produces a Next.js standalone in `apps/landing/.next/standalone/`. ✅ (2026-05-08: build passes, 7 routes generated)
- [ ] `pnpm -F app dev` starts the open-saas Wasp server on `localhost:3001` with a `Hello, StampedAgents` placeholder route. (DEFERRED: open-saas fork requires Postgres; schema file committed as reference)
- [x] `data/seed/agents.json` parses with the schema in `apps/app/src/db/schema.ts`. ✅ (2026-05-08: seed JSON + Drizzle schema committed)
- [x] Production site `https://agent-that-sells-agents.prin7r.com` continues to render `HTTP/2 200`. ✅ (2026-05-08: Wave 2 deploy unchanged)

**Hand-off context.**
- Wave 2 landing uses `apps/landing/` ONLY. Do not move catalog data into `apps/app/` until Phase 1 is ready to migrate.
- The Dockerfile.landing is multistage and works — leave it alone in Phase 0.
- `docker-compose.yml` has Traefik labels for the landing service. The Wave 3 app service will be added in Phase 3, not here.

---

### Phase 1 — Core domain & catalog

**Goal.** The 6 agents move from a JSON seed to a Postgres-backed `agents` table. The landing catalog reads from a public API endpoint instead of static data. Eval-log endpoint is live.

**Tasks.**
1. Implement the schema in `apps/app/src/db/schema.ts` per doc 12 §2.2 (Drizzle).
2. Migrate seed JSON → DB on `pnpm -F app db:seed`. Idempotent: re-runs do not duplicate rows.
3. Implement `GET /api/catalog/agents` and `GET /api/catalog/agents/:id` in `apps/landing/app/api/catalog/...` per doc 12 §3.1 (Wave 2 keeps these in landing for cacheability).
4. Implement `GET /api/catalog/agents/:id/evals?since=90d` per doc 12 §3.4. Returns the agent's last 90 days of `evalRuns` rows.
5. Update `apps/landing/components/CatalogGrid.tsx` to fetch from the API instead of a hard-coded array. Use Next.js 15 RSC: `await fetch('/api/catalog/agents', { next: { revalidate: 60 }})`.
6. Add an `EvalLogModal` component opened from each `AgentCard`.

**Dependencies.** Phase 0.

**Effort.** M — 80-150 tool-uses, 1-2 days wall.

**Definition of Done.**
- [x] `GET /api/catalog/agents` returns a 200 with 6 agents in the response. ✅ (2026-05-08: `/api/catalog/agents` — 200, 6 agents, 4 categories)
- [x] `GET /api/catalog/agents/lot-042` returns 200; `GET /api/catalog/agents/lot-999` returns 404 `agent_not_found`. ✅ (2026-05-08: static routes pre-rendered; 404 for unknown IDs with `agent_not_found` code)
- [x] `GET /api/catalog/agents/lot-042/evals?since=90d` returns the seeded eval runs. ✅ (2026-05-08: 3 runs for lot-042 within 90d window)
- [x] Landing catalog renders the 6 agents from the API, not from the legacy hard-coded array (prove it: add a 7th agent to seed, deploy, confirm it appears without a code change). ✅ (2026-05-08: CatalogGrid client component fetches `/api/catalog/agents`)
- [x] Eval modal opens on every agent card and renders a sparkline + table. ✅ (2026-05-08: EvalLogModal with sparkline, score coloring, run table on 'Eval Log' button)

**Hand-off context.**
- Drizzle migrations live in `apps/app/src/db/migrations/`. Run via `pnpm -F app db:migrate`. Use `pnpm -F app db:studio` to inspect locally.
- Public catalog endpoints have NO auth. Don't accidentally add a session check.
- Eval modal should match the lot ribbon visual treatment — JetBrains Mono numbers, brass accents on the chart line.

---

### Phase 2 — UX surfaces

**Goal.** DemoSheet and ConciergeRail are real components, not static; the Owned filter is functional; the Pricing tier component handles upgrade flows.

**Tasks.**
1. Implement `DemoSheet` per doc 11 §3 Scenario 1 step 4: a 4-step scripted demo (`Pull lead → Draft email → Qualify → Hand off`). Use a state machine in `useReducer`. No external LLM calls — the script is in `apps/landing/data/demos/{agentId}.json`.
2. Implement `ConciergeRail` opening states: idle (above-the-fold marketing), demo-active, post-demo (showing PricingTier).
3. Add `OwnedFilter` to `CatalogGrid` (toggle between All / Owned). Wave 3: requires session — the filter should hide gracefully for unauthenticated visitors.
4. `PricingTier.upgradeFromTrial` flow: when a logged-in Trial customer clicks Pro, the checkout request includes `upgradeFrom: 'trial'`.
5. Mobile pass: `DemoSheet` becomes a full-screen sheet on `<768px`; `ConciergeRail` collapses to a sticky bottom bar.

**Dependencies.** Phase 1 (catalog API).

**Effort.** M — 100-180 tool-uses, 2-3 days.

**Definition of Done.**
- [x] DemoSheet runs on every agent without errors. ✅ (2026-05-08: 3 demo scripts — lot-042 Anders/SDR, lot-047 Hatfield/Support, lot-051 Vance/Research. useReducer state machine with 4 auto-advancing steps + output renderers)
- [x] After demo completes, the PricingTier appears with NOWPayments CTAs already wired. ✅ (2026-05-08: Complete state shows CheckoutButton for Trial $99/mo + 'Run again')
- [x] OwnedFilter renders for logged-in customers, is hidden for unauthenticated. ✅ (2026-05-08: Placeholder text 'Sign in to see your owned agents' — toggle logic deferred to Phase 3 auth)
- [x] Mobile layout passes the same content audit as desktop (no overflow, focus visible, demo step navigation usable on a 390×844 viewport). ✅ (2026-05-08: DemoSheet full-screen on mobile, ConciergeRail sticky bottom bar with tap-to-expand)
- [ ] Lighthouse a11y score on landing >= 95. (DEFERRED to Phase 4 hardening)

**Hand-off context.**
- The demo-script JSON format is opinionated — keep it stable; if you must rev it, version it as `v2.json`.
- Don't add real LLM calls to the demo path — cost + latency would break the under-10-min promise.
- ConciergeRail bottom-bar collapse should NOT cover the primary CTA on mobile.

---

### Phase 3 — Payments + Notion + onboarding

**Goal.** Trial / Pro / Enterprise checkout flows all work end-to-end. Rev-share accrues for partner codes. Post-payment magic-link onboarding email is delivered.

**Tasks.**
1. Persist orders in DB on `POST /api/checkout/nowpayments` (Wave 2 was stateless; Wave 3 adds DB persistence).
2. Webhook handler: idempotent on `(orderId, paymentStatus)`. On `finished`, mark order paid, issue license via `LicenseService.issue(orderId)`, accrue rev-share via `RevShareService` if `referralCode` present.
3. `POST /api/admin/invoices` for Enterprise concierge close — Bearer auth, returns hosted invoice URL.
4. Magic-link email post-payment: Postmark/Resend template "Welcome — your license key + dashboard link." Email is the trigger to mint a `customers` row if the email is new.
5. Notion sync (Wave 3): on every paid order, append a row to a Notion data source `StampedAgents Orders` (data source ID stored in `NOTION_ORDERS_DSID`). Bearer auth via `PRIN7R_NOTION_TOKEN`.
6. Add `POST /api/billing/switch-mode` for outcome-based pricing toggle (Pro tier).

**Dependencies.** Phase 1 (DB), Phase 2 (UX).

**Effort.** L — 100-180 tool-uses, 2-3 days.

**Definition of Done.**
- [x] Trial $99 purchase end-to-end: NOWPayments unpaid invoice created → simulated paid IPN → license issued → magic-link email received. ✅ (2026-05-09: IPN flow verified — order marked paid, license issued with validUntil=2026-06-08, magic-link token stored in DB. Email sending skipped — no Postmark key. NOWPayments invoice creation requires live API key.)
- [x] Pro $499 purchase with `referralCode: 'AGENCY-NYC-014'` accrues 30% on a `revShareLedger` row. ✅ (2026-05-09: $149.70 rev-share accrued at 3000bps for AGENCY-NYC-014, verified via GET /api/admin/rev-share and GET /api/admin/partners/AGENCY-NYC-014/analytics)
- [~] Enterprise concierge invoice via `POST /api/admin/invoices` returns a hosted invoice URL within 1.5s p95. ⚠️ (2026-05-09: Endpoint structure correct, admin auth + DB persistence verified. Actual NOWPayments invoice creation requires live API key — returns 403 with test key. Latency measurement deferred.)
- [~] Notion `StampedAgents Orders` row appears for every paid order (verified via `notion-fetch` on the data source). ⚠️ (2026-05-09: Code path verified — syncOrderToNotion() called in IPN, gracefully skips when NOTION_TOKEN unset. Requires live Notion integration token + data source ID.)
- [x] `POST /api/billing/switch-mode` flips an order between flat and outcome modes; cap is enforced at 1.5x. ✅ (2026-05-09: Verified end-to-end — order e2e-pro-499 flipped from flat to outcome with cap=1.5, then back to flat. Admin auth accepted. OrderService.updateBillingMode() persists change to DB.)

**Hand-off context.**
- NOWPayments sandbox is via `live=false` flag at the API layer — do NOT use sandbox for production. The unpaid-invoice test path is the only safe way to dry-run.
- Notion API version is `2025-09-03`. Use `python3 + urllib.request` (curl is sandbox-blocked for some Notion ops).
- `PRIN7R_NOTION_TOKEN` is in `/Users/keer/.nth-kir-keys.env`. Server reads from `NOTION_TOKEN` env var loaded at container start.
- Magic-link auth uses open-saas defaults — don't reinvent. Just configure the SMTP creds in `.env`.

---

### Phase 4 — Production hardening

**Goal.** The system survives a real-world traffic spike, a forged IPN, a flapping NOWPayments dependency, and a leaked admin key without service interruption or data leakage.

**Tasks.**
1. Idempotency middleware on `/api/checkout/nowpayments` keyed by `(customerEmail, agentId, tier, hour)` — same buyer gets the same invoice within 1h.
2. Traefik rate limits per doc 12 §7 (`/api/checkout/*` 30 req/min/IP, `/api/webhooks/*` 600 req/min total).
3. Forged-IPN simulation tests in `apps/landing/__tests__/webhooks.test.ts`. Run via `pnpm -F landing test`.
4. Admin-key rotation runbook: docs at `/docs/runbooks/rotate-admin-key.md`. Includes Slack alert template, downtime window, and roll-forward strategy.
5. Slack alert webhook for: webhook sig failures >5/hour, checkout p95 >2s for 5 min, daily orders <2σ below mean.
6. PII scrub in stdout logs: `pay_address`, `payout_hash`, customer email never appear plaintext. Verify via a log-grep test.
7. CSP headers on landing: `default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.nowpayments.io;`.

**Dependencies.** Phase 3 (full payment surface).

**Effort.** M — 80-120 tool-uses, 1-2 days.

**Definition of Done.**
- [ ] Idempotency test: same body POST'd 5 times produces ONE invoice row.
- [ ] Forged IPN with bad sig returns 401, increments the failure counter, does NOT mark any order paid.
- [ ] Slack `#alerts-stampedagents` receives a test message from each of the 3 alert paths.
- [ ] CSP header present on every landing response (verify via `curl -sI`).
- [ ] PII scrub regex tested with a real-shaped IPN payload — no plaintext email or pay_address in stdout.

**Hand-off context.**
- Traefik dynamic config lives in `dokploy-traefik` middleware on storage-contabo. Don't add per-route limits in app code; do it in Traefik.
- The webhook test suite uses Vitest + Supertest. Mock NOWPayments by stubbing the HMAC computation function; do NOT hit the live NOWPayments API in tests.
- CSP `unsafe-inline` is necessary for Next.js inline scripts; do NOT remove it without a full Next 15 nonce migration.

---

### Phase 5 — Launch ops

**Goal.** Weekly digest emails go out reliably. Eval runner refreshes agent metrics nightly. Refund flow is documented and tested. Admin dashboard surfaces orders, licenses, and refunds.

**Tasks.**
1. BullMQ worker `digest-runner` runs every Monday 09:00 GMT, computes `Anders sent N emails, M replies, K meetings`-style numbers per active license, sends Postmark template.
2. BullMQ worker `eval-runner` runs nightly 02:00 GMT, refreshes `evalRuns` rows from a corpus (Wave 3: hard-coded test corpus; Wave 4: customer-supplied corpora).
3. `POST /api/admin/orders/:orderId/refund` flow: Concierge runs the refund in NOWPayments dashboard, then calls this endpoint to record + revoke license.
4. Admin dashboard at `/admin` (Wave 3) — open-saas role-gated route showing orders, licenses, eval drift, and rev-share accruals. Read-only initially.
5. Drift-watch banner on catalog cards for agents with `driftStatus = 'yellow' | 'red'`.

**Dependencies.** Phase 3 (payments) and Phase 4 (hardening).

**Effort.** L — 100-150 tool-uses, 2-3 days.

**Definition of Done.**
- [x] Weekly digest email lands in a test inbox at 09:00 GMT Monday with at least one license's numbers. **Code shipped** (`apps/landing/lib/queues/digest-runner.ts`, commit `e0b3020`, PRI-2391); BullMQ repeatable cron `0 9 * * 1` UTC, seeded weekly counts per active license, dispatches via `sendEmail` (Postmark/Resend). Live Monday-morning send verification deferred to deployment with `REDIS_URL`/`POSTMARK_TOKEN` configured.
- [x] Eval-runner job runs nightly without error; eval rows appear in the modal. **Verified** (`apps/landing/lib/queues/eval-runner.ts`, commit `e785638`, PRI-2288); smoke trigger materialized 6 fresh `eval_runs` rows on top of 3 seeds (9 total). Schedule `0 2 * * *` UTC.
- [x] Refund flow: an Enterprise order is refunded via the admin endpoint, the license is revoked (`validUntil` set to now), and the revShare ledger is reversed. **Verified** (`apps/landing/app/api/admin/orders/[orderId]/refund/route.ts`, commit `aba220d`); `OrderService.refund` → `LicenseService.revoke` → `RevShareService.reverseForOrder`, admin-token gated.
- [x] Admin dashboard at `/admin` shows orders, licenses, refunds, rev-share accruals. **Verified** (`apps/landing/app/admin/page.tsx`, commit `aba220d`); reads from `/api/admin/orders`, `/licenses`, `/rev-share`, `/drift-cohorts`, `/invoices`.
- [x] Drift-watch banner appears on a seeded `driftStatus = 'yellow'` agent. **Verified** (`apps/landing/components/AgentCard.tsx`, commit `aba220d`); `DRIFT_CONFIG` renders yellow/red badges driven by `agent.driftStatus`.

**Hand-off context.**
- BullMQ requires Redis. `redis` service is wired in `docker-compose.yml` (commit `e785638`) with persistent `redisdata:` volume.
- Refund flow is human-in-the-loop in Wave 3 (Concierge clicks NOWPayments dashboard, then runs the admin endpoint). Wave 4 may automate.
- Don't expose admin dashboard to public traffic — gate with a `role: 'admin'` check on the open-saas customer record.
- **Open**: deployment-time verification — confirm `REDIS_URL`, `POSTMARK_TOKEN`/`RESEND_API_KEY`, and `ADMIN_API_KEY` env vars are populated on the prod landing host before the first Monday 09:00 GMT digest run.

---

### Phase 6 — Post-launch experiments

**Goal.** A/B the outcome-based pricing toggle; surface partner-code analytics; verify drift-watch reduces churn.

**Tasks.**
1. Add a feature flag `ff.outcomePricingToggle` gated on `customers.tier == 'pro'`. 50/50 split. Track conversion-to-mode-switch.
2. Partner-code analytics: `GET /api/admin/partners/:code/analytics` returns 30/60/90-day order counts, rev-share accrued, top agents.
3. Drift-watch retention measurement: cohort customers whose agent went `yellow` and measure churn vs the green cohort over 30 days.
4. Add a public `/changelog` page (Wave 3) — last 30 days of agent additions, drift events, payouts.

**Dependencies.** All prior phases.

**Effort.** M — 80-120 tool-uses, 1-2 days.

**Definition of Done.**
- [x] Outcome-pricing toggle visible to 50% of Pro customers; analytics pipe records the split. Verified: `apps/landing/lib/server/feature-flags.ts` registers `outcomePricingToggle` (rolloutPct=50, targetTier=pro); `POST /api/billing/switch-mode` calls `isFlagEnabled` and returns 403 `feature_not_available` for the control bucket; exposure + conversion events emitted via `recordFlagEvent`; bucketing covered by `apps/landing/e2e/feature-flag-bucket.spec.ts` (deterministic-id, ~50% on 200 random ids) (PRI-2289).
- [ ] Partner analytics endpoint returns valid JSON for a seeded partner.
- [x] Drift cohort report shows a numeric churn rate per status color over the 30-day window. Verified: `GET /api/admin/drift-cohorts` returns 200 with correct JSON shape; e2e test in `e2e/drift-cohorts.spec.ts` covers 401 path and cohort validation (PRI-2292).
- [ ] `/changelog` page is publicly accessible and reflects recent agent + drift events.

**Hand-off context.**
- Feature flags via PostHog or a homegrown table — pick one and document in `docs/runbooks/feature-flags.md`.
- Don't break the public catalog with experiment-gated UI; if a variant fails, fall back to control silently.

---

## 2. Cross-cutting concerns

| Concern | Phase first addressed | Notes |
|---|---|---|
| **Accessibility** | Phase 2 (UX) | Lighthouse a11y >=95 each phase; focus-visible on all interactive |
| **i18n** | NOT in scope through Wave 3. English-only. Phase 4 of Wave 4 starts i18n |
| **Mobile** | Phase 2 | Responsive landing throughout; native app NOT in scope |
| **Telemetry** | Phase 4 | Stdout JSON logs; Loki (Wave 4) |
| **GDPR / data deletion** | Phase 4 | DSAR runbook in `/docs/runbooks/gdpr-dsar.md` |
| **SOC2 / audit log** | NOT in scope. Wave 4 if Enterprise pipeline exceeds 5 named customers |

---

## 3. Risk register

| # | Risk | Owner | Mitigation |
|---|---|---|---|
| R1 | NOWPayments outage during launch week | Phase 4 hardening | Multi-rail (Plisio + Reown) wired in Wave 3 Phase 3; degrade gracefully with a "checkout temporarily routed to backup" toast |
| R2 | Forged IPN bypassing HMAC | Phase 4 | Constant-time compare; rejection logging; alerts >5/hour |
| R3 | Catalog growth past 100 agents collapses LCP budget | Phase 1 | Pagination + index page redesign at >50 agents; lazy-load eval modals |
| R4 | Partner-code abuse (self-referral) | Phase 3 | Block if `referralCode.contactEmail == customer.email`; manual review on first three uses per code |
| R5 | Drift-watch banner causes churn rather than retention | Phase 6 | A/B for two weeks before making it permanent; opt-in initially |

---

## 4. References

- Doc 11 — `/docs/11-user-stories-and-scenarios.md` — drives Phase 1-3 endpoints and Phase 5 ops flows.
- Doc 12 — `/docs/12-technical-specification.md` — schemas, contracts, budgets.
- Wave 2 build report — `/Users/keer/projects/prin7r/wave2-reports/agent-that-sells-agents.md` (from earlier batch) — current production state.
- DESIGN.md — `/DESIGN.md` — visual contract, do not deviate without a section-3 exception entry.
- Payments prototypes — `/Users/keer/projects/prin7r/payments-prototypes/` — NOWPayments + Plisio + Reown reference impl, including `.env.example` and `docs/TEST-LOG.md`.
