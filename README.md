# Provenance

**Agent that sells agents** — a catalog of pre-built AI agents (sales SDR, support, research, ops) that buyers can demo, vet, and purchase in under ten minutes. The catalog is sold by an agent: a self-driving sales module on the landing answers questions, qualifies the buyer, and walks them to checkout.

- Production: https://agent-that-sells-agents.prin7r.com
- Notion opportunity: https://www.notion.so/Agent-that-sells-agents-3543ceec2619812aacc6f17c90c0dd17
- Wave: Prin7r Wave 2 · Stack: SaaS · Stage: Qualified

## What this is

A working storefront where each AI agent has provenance the way fine art does: trained-by, deployed-since, last-30-day outcomes, references, win-rate. No robot avatars, no purple gradients. The visual language is closer to a HashiCorp release page meets a Sotheby's catalog.

## Repo layout

```
/DESIGN.md                        canonical 15-section design spec (root)
/docs/                            10 strategy docs + screenshots
  01-brand-identity.md
  02-architecture.md
  03-user-journeys.md
  04-pain-points.md
  05-audience-profile.md
  06-sales-channels.md
  07-sales-strategy.md
  08-marketing-strategy.md
  09-go-to-market.md
  10-pitch-deck.md
  pitch-deck.html
  screenshots/
    landing-desktop.png           1440 x 900
    landing-mobile.png            390  x 844
/apps/
  landing/                        Next.js 15 + ShadCN + Tailwind, NOWPayments hosted invoice
  app/                            stub for future SaaS dashboard (open-saas)
/Dockerfile.landing               multistage standalone Next build
/docker-compose.yml               Traefik labels, env_file: .env, expose: 3000
/patches/                         deploy patch packages (per CLAUDE.md policy)
/.env.example                     env names only — never commit live values
```

## Local dev

```bash
cd apps/landing
pnpm install
cp ../../.env.example .env.local   # fill NOWPAYMENTS_API_KEY
pnpm dev                           # http://localhost:3000
```

## Deploy

The deploy host is `storage-contabo` (`161.97.99.120`). The compose file uses host-mode Traefik (no `dokploy-network`). After cloning into `/opt/prin7r-deploys/agent-that-sells-agents/`, drop a server-only `.env` file (NOWPAYMENTS keys, copied from a sibling project), then `docker compose up -d --build`. Traefik picks up the labels and issues a Let's Encrypt cert for the host rule.

## Screenshots

![Landing — desktop](docs/screenshots/landing-desktop.png)
![Landing — mobile](docs/screenshots/landing-mobile.png)

## License

MIT — see [LICENSE](LICENSE).
