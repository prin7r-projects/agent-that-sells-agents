# StampedAgents

**Agent that sells agents** — a catalog of pre-built AI agents (sales SDR, support, research, ops) that buyers can demo, vet, and purchase in under ten minutes. The catalog is sold by an agent: a self-driving sales module on the landing answers questions, qualifies the buyer, and walks them to checkout.

- Production: https://agent-that-sells-agents.prin7r.com
- Notion opportunity: https://www.notion.so/Agent-that-sells-agents-3543ceec2619812aacc6f17c90c0dd17
- Wave: Prin7r Wave 2 (landing) → Wave 3 (implementation) · Stack: SaaS · Stage: Qualified

## Spec docs

- [docs/12 — Technical Specification](docs/12-technical-specification.md) — API contracts, DB schema, auth, security
- [docs/13 — Implementation Plan](docs/13-implementation-plan.md) — Phased delivery plan (Phase 0–6)

## What this is

A working storefront where each AI agent carries a stamp the way fine art does: trained-by, deployed-since, last-30-day outcomes, references, win-rate. No robot avatars, no purple gradients. The visual language is closer to a HashiCorp release page meets a Sotheby's catalog.

## Repo layout

```
/DESIGN.md                        canonical 15-section design spec (root)
/docs/                            13 strategy + spec docs
  01-brand-identity.md            through 13-implementation-plan.md
/apps/
  landing/                        Next.js 15 + ShadCN + Tailwind, NOWPayments hosted invoice
    app/api/catalog/              → GET /api/catalog/agents (public, no auth)
    app/api/checkout/             → POST /api/checkout/nowpayments
    app/api/webhooks/             → POST /api/webhooks/nowpayments (HMAC-SHA512)
    app/api/admin/                → POST /api/admin/invoices (Bearer admin)
    app/api/internal/             → POST /api/internal/ipn (internal only)
    e2e/                          → Playwright test suite (7 API, 6 browser)
  app/                            stub for future SaaS dashboard (open-saas)
    src/db/schema.ts              → Drizzle ORM schema (reference)
/data/seed/                       seed data (agents.json, evals.json)
/Dockerfile.landing               multistage standalone Next build
/docker-compose.yml               Postgres 16 + Next.js + Traefik labels
/.env.example                     env names only — never commit live values
```

## Local dev

```bash
# 1. Install dependencies
cd apps/landing
pnpm install

# 2. Set up environment
cp ../../.env.example .env.local
# Edit .env.local — fill NOWPAYMENTS_API_KEY (optional for local dev)

# 3. (Optional) Start PostgreSQL for DB-backed features
docker compose up -d postgres

# 4. Start dev server
pnpm dev                           # http://localhost:3000
```

## Run tests

```bash
# API + browser tests (browser tests need libglib on host)
pnpm test:e2e

# Against live deploy
PLAYWRIGHT_BASE_URL=https://agent-that-sells-agents.prin7r.com pnpm test:e2e
```

## Deploy

The deploy host is the Prin7r VPS (`144.91.94.91`). The compose file uses host-mode Traefik.
After cloning into `/opt/prin7r-deploys/agent-that-sells-agents/`:

```bash
# Create .env with live secrets
cp .env.example .env
# Fill required: NEXT_PUBLIC_APP_URL, NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET, DB_PASSWORD, ADMIN_API_KEY

# Build and start
docker compose up -d --build
```

Traefik picks up the labels and issues a Let's Encrypt cert for the host rule.

## Environment variables

| Variable | Required | Used for |
|----------|----------|----------|
| `NEXT_PUBLIC_APP_URL` | Yes | Callback URLs, CORS origin |
| `NOWPAYMENTS_API_KEY` | Yes* | Hosted invoice creation |
| `NOWPAYMENTS_IPN_SECRET` | Yes* | Webhook HMAC verification |
| `DB_PASSWORD` | Phase 3+ | PostgreSQL password |
| `DATABASE_URL` | Phase 3+ | PostgreSQL connection (auto-set in docker-compose) |
| `ADMIN_API_KEY` | Phase 3+ | Bearer auth for /api/admin/* |
| `POSTMARK_API_KEY` | Phase 3+ | Transactional email |
| `NOTION_TOKEN` | Phase 3+ | Order sync to Notion |

*Not required for local dev — checkout returns 503 without them.

## Screenshots

![Landing — desktop](docs/screenshots/landing-desktop.png)
![Landing — mobile](docs/screenshots/landing-mobile.png)

## License

MIT — see [LICENSE](LICENSE).
