# Runbook: Rotate ADMIN_API_KEY

**Service:** StampedAgents landing  
**Owner:** On-call / Concierge  
**Last reviewed:** 2026-05-09

---

## 1. Pre-rotation checklist

- [ ] Confirm the current `ADMIN_API_KEY` location: `/opt/prin7r-deploys/agent-that-sells-agents/.env` on `storage-contabo` VPS.
- [ ] Verify who has access: list SSH keys on the VPS and any secret managers (1Password, Vault, etc.).
- [ ] Schedule a downtime window: **5 minutes** — the landing service restarts to pick up the new key.
- [ ] Notify `#alerts-stampedagents` (see Slack template below).
- [ ] Confirm no active admin operations are in flight (check `/api/admin/orders` latency or recent requests in logs).

---

## 2. Step-by-step rotation procedure

1. **Generate a new key** on the VPS (or locally):
   ```bash
   openssl rand -hex 32
   ```
   Copy the output — this is your new `ADMIN_API_KEY`.

2. **Update the env file** on the VPS:
   ```bash
   ssh storage-contabo
   cd /opt/prin7r-deploys/agent-that-sells-agents
   sed -i 's/^ADMIN_API_KEY=.*/ADMIN_API_KEY=<new-key>/' .env
   ```

3. **Restart the landing service:**
   ```bash
   docker compose restart landing
   ```

4. **Verify the new key works:**
   ```bash
   curl -s -H "x-admin-key: <new-key>" https://agent-that-sells-agents.prin7r.com/api/admin/orders | head -c 200
   ```
   Expect a JSON response (order list or empty array). A `401` means the key did not take effect — check the `.env` and restart again.

5. **Post-rotation Slack message** (see template below).

---

## 3. Slack alert template

Copy-paste into `#alerts-stampedagents`:

**Before rotation:**
```
:rotating_light: ADMIN_API_KEY rotation starting
- Agent: @oncall
- Downtime: ~5 min
- Reason: [leak suspected / quarterly cadence / post-incident]
```

**After rotation:**
```
:white_check_mark: ADMIN_API_KEY rotation complete
- New key verified on /api/admin/orders
- Old key invalidated
- Please update any local scripts or integrations using the old key
```

---

## 4. Roll-forward strategy (new key rejected)

If the new key is rejected after restart:

1. **Revert to the previous key:**
   ```bash
   cd /opt/prin7r-deploys/agent-that-sells-agents
   sed -i 's/^ADMIN_API_KEY=.*/ADMIN_API_KEY=<old-key>/' .env
   docker compose restart landing
   ```
2. **Verify:**
   ```bash
   curl -s -H "x-admin-key: <old-key>" https://agent-that-sells-agents.prin7r.com/api/admin/orders | head -c 200
   ```
3. **Page Concierge** — the new key may have been truncated or corrupted during generation. Repeat the rotation with a freshly generated key.
4. If the old key also fails, check that the `.env` file is being loaded by the container (`docker compose exec landing env | grep ADMIN`).

---

## 5. When to rotate

- **Leak suspected** — key exposed in logs, screenshots, public repo, or shared via insecure channel. Rotate immediately.
- **Quarterly cadence** — rotate every 90 days as a hygiene measure. Set a calendar reminder.
- **Post-incident** — rotate after any security incident involving the admin API surface.
