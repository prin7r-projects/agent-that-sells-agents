# Runbook: Restore NOWPAYMENTS_API_KEY on StampedAgents landing

**Service:** StampedAgents landing (`agent-that-sells-agents.prin7r.com`)  
**Owner:** On-call / Concierge  
**Last reviewed:** 2026-06-02

---

## 1. Symptom

The public checkout endpoint returns HTTP 503 with the payload:

```json
{
  "ok": false,
  "mode": "disabled",
  "code": "missing_env",
  "env": "NOWPAYMENTS_API_KEY",
  "envFile": "/opt/prin7r-deploys/agent-that-sells-agents/.env",
  "runbook": "docs/runbooks/restore-nowpayments-key.md",
  "message": "Live checkout is temporarily disabled. ..."
}
```

Quick public probe:

```bash
curl -sS -i -X POST https://agent-that-sells-agents.prin7r.com/api/checkout/nowpayments \
  -H "content-type: application/json" \
  --data '{"tierId":"pro","agentLot":"042"}'
```

If the response is 503 with `mode: "disabled"` and `env: "NOWPAYMENTS_API_KEY"`, follow this runbook.

## 2. Pre-flight checklist

- [ ] Confirm the deployed env file exists at `/opt/prin7r-deploys/agent-that-sells-agents/.env` on `storage-contabo` (IP `144.91.94.91`).
- [ ] Verify who has SSH access to that host (the project uses the `prin7r-vps-dev` ed25519 key — see `docs/runbooks/rotate-admin-key.md` for the rotation pattern).
- [ ] Pull the production NOWPayments API key from the project password manager (1Password vault **Prin7r / StampedAgents / NOWPayments**). Never commit the key, never paste it into Slack.
- [ ] Notify `#alerts-stampedagents` that you are starting a 2-minute restore window.

## 3. Step-by-step restore procedure

1. **Confirm the file exists and inspect its current state** (do **not** print the value, only confirm the line is present or absent):

   ```bash
   ssh storage-contabo
   cd /opt/prin7r-deploys/agent-that-sells-agents
   grep -E '^NOWPAYMENTS_API_KEY=' .env || echo "MISSING"
   ```

   - If `MISSING` → proceed to step 2 (append).
   - If present but blank (`NOWPAYMENTS_API_KEY=`) → proceed to step 2 (replace).

2. **Update the env file**. Two safe options — both write atomically (`mktemp + mv`):

   ```bash
   cd /opt/prin7r-deploys/agent-that-sells-agents
   cp -p .env .env.bak.$(date -u +%Y%m%dT%H%M%SZ)
   ```

   Then, with the key in your clipboard (read from 1Password, do **not** echo it back):

   ```bash
   # If the line is missing
   echo "NOWPAYMENTS_API_KEY=<paste-here>" >> .env
   # If the line is present (sed replaces in place; backup above covers the old value)
   sed -i 's|^NOWPAYMENTS_API_KEY=.*|NOWPAYMENTS_API_KEY=<paste-here>|' .env
   chmod 600 .env
   ```

3. **Restart the landing service** so the new env is read on container start:

   ```bash
   docker compose restart landing
   ```

4. **Verify the key is loaded inside the container** (no value printed):

   ```bash
   docker compose exec -T landing \
     sh -c 'test -n "$NOWPAYMENTS_API_KEY" && echo "loaded: yes (len=${#NOWPAYMENTS_API_KEY})" || echo "loaded: no"'
   ```

5. **Verify the public endpoint no longer 503s**:

   ```bash
   curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
     -X POST https://agent-that-sells-agents.prin7r.com/api/checkout/nowpayments \
     -H "content-type: application/json" \
     --data '{"tierId":"pro","agentLot":"042"}'
   ```

   Expected: `HTTP 200` with a JSON body containing `mode: "live"`, `orderId` starting with `stmp_pro_`, and an `invoiceUrl` on `nowpayments.io`. If you get `HTTP 502` with a NOWPayments error body, the key is loaded but the upstream rejected it (rotate the key with NOWPayments and retry).

6. **Verify the admin path** (requires `ADMIN_API_KEY` in your local env or curl `-H "x-admin-key: …"`):

   ```bash
   curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
     -X POST https://agent-that-sells-agents.prin7r.com/api/admin/invoices \
     -H "content-type: application/json" \
     -H "x-admin-key: $ADMIN_API_KEY" \
     --data '{"tier":"enterprise","agentIds":["042"],"customerEmail":"smoke@example.com"}'
   ```

   Expected: `HTTP 201`.

7. **Post a Slack update** in `#alerts-stampedagents` (do not paste the key):

   ```
   :white_check_mark: NOWPAYMENTS_API_KEY restored
   - Live checkout: HTTP 200, mode=live
   - Admin invoice: HTTP 201
   - Backup: .env.bak.<UTC timestamp>
   ```

## 4. Roll-forward strategy (key not picked up)

If the public endpoint still returns 503 after step 5:

1. Confirm the container actually restarted:

   ```bash
   docker compose ps landing
   docker compose logs --tail=50 landing | grep -E "NOWPAYMENTS|env"
   ```

2. If the env is loaded (`loaded: yes`) but the route still 503s, the key may be malformed (truncated, copied with whitespace). Re-pull the key from 1Password and repeat step 2.

3. If the env is **not** loaded, double-check `.env` is being read by compose:

   ```bash
   docker compose config | grep -A2 NOWPAYMENTS_API_KEY
   ```

   The line should appear under `services.landing.environment`. If it does not, the env file is not on the expected path — re-check `env_file: .env` in `docker-compose.yml`.

4. Page Concierge if the key is loaded and the route still 503s after a container restart cycle.

## 5. When to rotate vs. restore

- **Restore (this runbook).** The key was accidentally cleared, or the file was overwritten by a bad deploy, and you still have the same valid key in 1Password.
- **Rotate.** The key has leaked, is older than 90 days, or NOWPayments has issued a new one. Generate a fresh value with `openssl rand -hex 32` (NOWPayments ignores this format — instead, create a new API key in the NOWPayments dashboard and copy the issued value).

## 6. Related runbooks

- [Rotate ADMIN_API_KEY](./rotate-admin-key.md) — same VPS, same `.env` file, different key.
- [Wave 2 retokenization (PRI-3525)](../changelog.md) — design token changes that touched the same checkout response shape.
