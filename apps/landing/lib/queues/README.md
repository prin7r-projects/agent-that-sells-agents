# BullMQ digest-runner

Phase 5.1 worker — sends weekly activity digest emails to active license holders.

## Schedule

- **Repeatable job:** Every Monday 09:00 UTC (`0 9 * * 1`)
- **Queue name:** `digest`
- **Job name:** `send-digest`

## Local development

### 1. Start Redis

If you use the repo's `docker-compose.yml`:

```bash
docker compose up -d redis
```

Or point `REDIS_URL` to any Redis 7+ instance.

### 2. Start the worker

```bash
pnpm -F landing queue:digest
```

The worker will:
- Connect to Redis (`REDIS_URL`, default `redis://localhost:6379`)
- Upsert the weekly cron scheduler
- Wait for jobs and process them

### 3. Enqueue a one-off run (smoke test)

In another terminal:

```bash
pnpm -F landing queue:digest:trigger
```

This adds a single `send-digest` job immediately. The worker will pick it up and:
1. Query all active (non-revoked, not-expired) licenses from Postgres
2. Generate deterministic seeded activity counts per license
3. Send an email via Postmark/Resend (falls back to `console.log` if no provider key is set)

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string |
| `DATABASE_URL` | Yes | — | Postgres connection string |
| `POSTMARK_API_KEY` | No | — | Preferred email provider |
| `RESEND_API_KEY` | No | — | Fallback email provider |
| `FROM_EMAIL` | No | `hello@stampedagents.com` | Sender address |

## Architecture notes

- **Seeded data:** Wave 3 does not integrate real activity sources. Counts are deterministically generated from `hash(orderId + weekKey)` so they are stable within a week and vary week-to-week.
- **Retries:** Scheduled jobs retry up to 3 times with exponential backoff (1 min base).
- **Concurrency:** Set to 1 to avoid overwhelming the email provider.
- **Graceful shutdown:** Handles `SIGINT`/`SIGTERM` by closing the Worker and Queue cleanly.
