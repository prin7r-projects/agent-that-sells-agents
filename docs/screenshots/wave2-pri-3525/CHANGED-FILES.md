# PRI-3525 — Changed files (Wave 2 color retokenization)

This is the diff for the `agent-that-sells-agents` repository, scoped to the
Wave 2 / PRI-3525 color purging work. Other in-flight edits in the working
tree (`apps/landing/src/db/index.ts`, `apps/landing/package.json`,
`apps/landing/playwright.config.ts`) are NOT part of this change.

## Token table (tailwind.config.ts)

| Token | Before | After | Reason |
|-------|--------|-------|--------|
| `vermilion` | `#B5331A` (red) | **removed** | Rejected color (red). |
| `azure-2` | `#3387EA` | **removed** | Unused duplicate of azure. |
| `signal-2` | `#3387EA` | **removed** | Unused duplicate of azure. |
| `azure` | `#0071E3` | retained | Demoted to micro-accent only. |
| `signal` | `#0071E3` | retained | Legacy alias kept for back-compat. |
| everything else | (unchanged) | (unchanged) | Apple-aligned scale stays. |

## Files (15)

### Design system
- `DESIGN.md` — §4 retokenized (neutral-palette rule, status-indicator color
  rule); §8 `AgentCard` description updated (signal/30 → ink/35);
  §15 changelog entry added for 2026-06-02 retokenization.
- `apps/landing/tailwind.config.ts` — `vermilion`, `azure-2`, `signal-2` removed.
- `apps/landing/app/globals.css` — file-level comment retokenized;
  `--azure` comment updated to mark it as micro-accent; `--signal`
  legacy-alias comment updated.

### Components (UI tokens swapped)
- `apps/landing/components/AgentCard.tsx` — drift states retokenized
  (`amber-50/200/800` → `bg-fog border-silver-mist text-graphite`,
  `vermilion/5/20/100` → `bg-obsidian/[0.04] border-ink text-ink`); legacy
  keys (`yellow`/`red`) mapped to the new neutral tokens for back-compat;
  "Buy Trial" CTA fill changed from `bg-azure` → `bg-ink`.
- `apps/landing/components/PricingTier.tsx` — Pro tier CTA fill changed
  from `bg-azure` → `bg-ink`; non-highlighted tier CTA fill changed
  from `bg-snow` → `bg-snow text-ink border border-ink`.
- `apps/landing/components/CatalogGrid.tsx` — error state retokenized
  (`text-vermilion border-vermilion/30` → `text-ink border-ink bg-fog`).
- `apps/landing/components/CheckoutButton.tsx` — error message
  (`text-vermilion` → `text-ink border-b border-ink/40`).
- `apps/landing/components/ConciergeRail.tsx` — "Try a demo" inline CTAs
  retokenized (`text-azure` → `text-ink hover:underline`); concierge input
  focus border retokenized (`focus:border-azure` → `focus:border-ink`).
  Two 8px Concierge status dots (`bg-azure`) retained as the documented
  micro-accent.
- `apps/landing/components/DemoSheet.tsx` — primary CTAs
  ("Demo in your data", "Buy Trial — $99/mo") retokenized
  (`bg-azure` → `bg-ink`); progress dots retokenized
  (`bg-azure` → `bg-ink`/`bg-obsidian`/`bg-silver-mist`); error state
  retokenized; lead-card micro-text retokenized
  (`text-azure` → `text-graphite`); summary checkmark retokenized
  (`text-azure` → `text-ink`).
- `apps/landing/components/EvalLogModal.tsx` — `scoreColor` retokenized
  (azure/green/vermilion graphite → obsidian/ink/graphite/ash);
  error state retokenized to ink/fog/ink-border.

### Pages
- `apps/landing/app/page.tsx` — Hero "Browse the catalog" CTA fill
  (`bg-azure` → `bg-ink`); Hero "Talk to the Concierge" secondary CTA
  border (`border-silver-mist` → `border-ink`).
- `apps/landing/app/changelog/page.tsx` — hover border
  (`hover:border-azure/35` → `hover:border-ink/35`).
- `apps/landing/app/admin/page.tsx` — `STATUS_COLORS` retokenized
  (paid/azure, refunded/vermilion, expired/ash → all on the
  ink/snow/fog/silver-mist scale); Sign-in CTA fill
  (`bg-azure` → `bg-ink`); focus ring (`focus:ring-azure` → `focus:ring-ink`);
  admin-key input border (`border-silver-mist` → `border-ink`);
  error banner retokenized (vermilion → ink/fog/ink-border);
  active tab retokenized (`border-azure text-azure` → `border-ink text-ink`);
  refund button retokenized (`text-vermilion hover:underline` →
  `text-ink underline underline-offset-2 hover:opacity-80`);
  license status badge retokenized (revoked-vermilion, active-azure,
  expired-ash → all on the neutral scale);
  rev-share amount cell retokenized (negative-vermilion → ink, also
  positive already ink — the ternary is now a no-op).

### Server / backend
- `apps/landing/lib/server/alerts.ts` — Slack severity color map retokenized
  (`#FF0000 / #FFA500 / #36A64F` → `#000000 / #1D1D1F / #707070`).
  These are the only colors a Slack webhook can use; severity now reads
  via weight (filled → ink, hollow → graphite), not via hue.

### Tests
- `apps/landing/__tests__/alerts.test.ts` — three assertions updated
  to expect the new neutral Slack severity colors
  (`#000000` / `#1D1D1F` / `#707070`).

## Verification

See `AUDIT.txt` for exit codes, route smoke, and HTML grep audit results.
