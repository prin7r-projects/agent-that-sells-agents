# DESIGN.md — Provenance

> Canonical design + style guide for `agent-that-sells-agents.prin7r.com`. Owned by Chief of Design. The 15 sections below are mandatory; if a decision is deferred, the section is marked **TBD** and inherits the ShadCN baseline.

## 1. Product and audience

**Product.** A storefront for ready-to-deploy AI agents: sales SDR, support concierge, research analyst, ops auditor, and others. Each agent has a real provenance card — trained-by, deployed-since, last-30-day outcomes, references, win-rate. The catalog itself is sold by an agent: a "Concierge" module on the landing answers questions, qualifies the buyer, and walks them to a hosted-invoice checkout.

**Primary audience.** Operators at companies between 5M and 100M ARR who already use one or two AI tools, are tired of pilots that never ship, and want named-and-numbered outcomes. They don't want a marketplace. They want a vetted shelf.

**Secondary audience.** Agency owners and fractional operators who resell agent labor to their own clients and want a catalog they can stand behind. They care about provenance and rev-share clarity.

**Anti-audience.** Builders looking for a no-code playground. Marketplaces of marketplaces. Anyone who would describe an AI agent with a robot avatar.

## 2. Visual positioning

**Reference points (mood, not copying).**
- **HashiCorp release pages** — restrained, technical, honest. Tables that read like specs.
- **Sotheby's catalog** — provenance language, lot numbers, "trained by" attribution.
- **Bloomberg Terminal** at low saturation — dense data, a single signal-blue accent, no chrome.
- **Pentagram studio site** — typographic confidence; quiet ornament.

**Anti-references (we do not look like).** ChatGPT marketing, Replit, Lovable, agent.ai, generic "AI marketplace" gradients, robot mascots, neon purple/teal. None of those.

**Positioning statement.** For operators who need named outcomes, Provenance is a vetted catalog of working AI agents that you can demo and buy in under ten minutes — unlike no-code marketplaces, because every agent ships with a provenance record (who trained it, what it has done, what it costs to run).

## 3. ShadCN baseline and local component policy

We follow the **Prin7r Component Library Baseline: ShadCN-first**. Components are added with `pnpm dlx shadcn@latest add <component>` and live under `apps/landing/components/ui/`. Once added, the project owns the source — we review, edit, and ship from `components/ui` like any other code.

**Used now.** `Button`, `Card`, `Badge`, `Separator`, `Tabs`, `Accordion`, `Input`, `ScrollArea`, `Sheet`. Each one is the stock ShadCN file with no custom variants; tokens come from `tailwind.config.ts` and `globals.css`.

**Custom components live under `apps/landing/components/`** with descriptive names: `AgentCard.tsx`, `ConciergeRail.tsx`, `ProvenanceTable.tsx`, `PricingTier.tsx`. They compose ShadCN primitives — they do not re-implement them.

**Exceptions to baseline.** None. We deliberately avoid pro/paid component libraries for Wave 2.

## 4. Color tokens

A "ledger" palette: paper, ink, brass, signal. No purple, no teal, no neon. Tokens map to Tailwind via `tailwind.config.ts` and to runtime CSS via `globals.css`.

| Token              | Hex        | Role                                                           |
|--------------------|------------|----------------------------------------------------------------|
| `paper`            | `#F4EFE6`  | Page background. Slight warmth — not white.                    |
| `ink`              | `#161513`  | Primary text and chrome. Deep neutral, not pure black.         |
| `ink-2`            | `#2C2925`  | Secondary text, table borders.                                 |
| `graphite`         | `#3F3B36`  | Card borders on dark sections.                                 |
| `brass`            | `#A88646`  | Accent. Used sparingly — provenance ribbons, lot numbers.      |
| `brass-2`          | `#C9A35E`  | Hover/highlight state for `brass`.                             |
| `signal`           | `#1F4FE0`  | The single interaction blue. CTAs, focus rings, active tabs.   |
| `signal-2`         | `#3766F0`  | Hover state for `signal`.                                      |
| `vermilion`        | `#B5331A`  | Reserved for delete/danger only. Never decorative.             |
| `wax`              | `#E9E0CF`  | Surface for cards on `paper`.                                  |
| `vellum`           | `#FBF7EE`  | Surface for elevated cards.                                    |
| `night`            | `#0E0D0B`  | Dark sections (Provenance, Pricing).                           |

Dark mode is reserved for the `Provenance` and `Pricing` sections; the rest of the page is light. We do not flip the entire site.

## 5. Typography

**Display & UI.** **Inter Display** (Google Fonts) — `400, 500, 600, 700`. Confident grotesk. Used for everything except code/numerical IDs.
**Mono.** **JetBrains Mono** (Google Fonts) — `400, 500`. Used for lot numbers, agent IDs, deploy versions, code.
**Fallbacks.** `ui-sans-serif, system-ui, sans-serif` and `ui-monospace, SFMono-Regular, monospace`.

**Type scale.**

| Role          | Size    | Line | Weight | Tracking | Notes                            |
|---------------|---------|------|--------|----------|----------------------------------|
| Display XL    | 64 / 80 | 0.95 | 600    | -0.02em  | Hero only.                       |
| Display L     | 48 / 56 | 1.0  | 600    | -0.02em  | Section headings.                |
| Heading M     | 28      | 1.15 | 600    | -0.01em  | Subsections.                     |
| Heading S     | 20      | 1.25 | 600    | -0.005em | Cards, list headers.             |
| Body L        | 18      | 1.55 | 400    | 0        | Long copy.                       |
| Body M        | 16      | 1.55 | 400    | 0        | Default.                         |
| Body S        | 14      | 1.5  | 500    | 0.005em  | Microcopy.                       |
| Mono          | 13      | 1.4  | 500    | 0        | Lot/agent IDs.                   |

## 6. Spacing, radius, shadows, and borders

**Spacing scale (px).** `2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128`. We do not use Tailwind's full ramp; only those steps.

**Radius.** `--radius-sm: 6px`, `--radius: 10px`, `--radius-lg: 14px`. Buttons and pills are `radius-sm`; cards are `radius`; modal/sheet is `radius-lg`. Nothing is fully rounded — we are a catalog, not a chat bubble.

**Borders.** `1px solid var(--ink-2 / 0.12)` on `paper`; `1px solid var(--graphite)` on `night`. Tables use a `2px` rule under their headers — ledger feel.

**Shadows.** Used sparingly. `--shadow-sm: 0 1px 0 rgba(22,21,19,0.04), 0 0 0 1px rgba(22,21,19,0.05)` on hovered cards. No big drop shadows.

## 7. Layout system and responsive rules

**Grid.** 12-column grid, `1280px` content max width, `24px` gutter on desktop. The hero uses a 7/5 split (catalog peek on the left, concierge rail on the right) on `lg+`, stacking to one column on `md` and below.

**Breakpoints.** `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1440`. Verified at 320, 768, 1024, 1440. The hero fits at 320px without overflow.

**Section rhythm.** Vertical section padding is `py-24 lg:py-32` on desktop, `py-16` on mobile. Section headings sit on a 4-column "Lot/Section" grid that reads "LOT 04 — PROVENANCE" in JetBrains Mono.

## 8. Component catalog

**`AgentCard`** — the unit of the catalog. Header: agent name + role (e.g., "Anders / SDR"). Body: a 4-row provenance table (`Trained by`, `Deployed since`, `30-day outcomes`, `References`). Footer: "Demo" (secondary) + "Buy" (primary signal CTA) + lot number in mono. Borders are 1px ink/12%; no hover lift, only border color change to `signal/30`.

**`ConciergeRail`** — sticky right rail on the hero. A single-column "agent talking" UI with a typing indicator and three suggested questions ("How do I price the SDR?", "Can I keep the model in our VPC?", "What's the rev-share?"). Pretends to be live; actually scripted.

**`ProvenanceTable`** — full-width data table on the dark "How they're built" section. 5 columns: agent, training corpus, model family, evaluation method, last audit date.

**`PricingTier`** — three tiers (Trial, Pro, Enterprise). Each has a NOWPayments crypto CTA and a stable "What's included" list. Outcome pricing is shown in a footnote; subscription is the headline.

**`FaqAccordion`** — ShadCN accordion, restrained. 8 items.

**`SiteHeader` / `SiteFooter`** — header has logo (lockup with brass dot), nav (Catalog · Provenance · Pricing · FAQ), and a "Talk to Concierge" pill. Footer has the lot-number ID for this build.

## 9. Landing page structure

Top to bottom, in order:
1. **Hero** — left: catalog peek (3 visible AgentCards stacked on a slight angle, like a fan of vellum). Right: ConciergeRail with "Concierge — online" status and the script's first message. Below: a row of 4 provenance ribbons ("Lot 042 · Anders, SDR — sold to 18 ops teams since Feb").
2. **Catalog** — 6 AgentCards in a real grid. Filter pills: All · Sales · Support · Research · Ops.
3. **How they're built** — dark section, Provenance table.
4. **Outcomes** — three "Last 30 days" panels with named-customer outcomes (anonymized).
5. **Pricing** — three NOWPayments-CTA tiers (Trial / Pro / Enterprise).
6. **FAQ** — 8 questions, no marketing fluff.
7. **Footer** — lot ID, build date, sitemap.

## 10. Imagery and generated asset rules

**Imagery is mostly type and tables**, intentionally. We do not ship robot avatars, abstract gradients, or stock photography of people pointing at laptops. The "vellum fan" in the hero is an SVG built in code — three stacked rectangles with a 2-degree rotation, brass accent ribbon. No raster art is required for the v1 landing.

If we generate imagery later via the paperclip `prin7r-generate-image` tool, prompts must reference the palette names in this file (`paper`, `ink`, `brass`, `signal`) and an aspect ratio of 16:9 or 4:5. Every generated image must be saved at `apps/landing/public/generated/<name>.{png,webp}` with a sibling `<name>.prompt.txt` containing the prompt, model, and date.

**Status for v1.** No generative imagery used. Recorded here as a deliberate choice, not a blocker.

## 11. Motion and interaction rules

- **Transitions.** Only color and border. Default `transition-colors duration-150`. No layout shift on hover.
- **Card hover.** Border swaps from `ink/12%` to `signal/35%`. Lot number in footer fades from `ink-2/60%` to `ink-2/100%`. No translate, no scale, no shadow lift.
- **Concierge typing.** Three dots that fade in sequence on a 900ms cycle. No bounce.
- **Reduced motion.** Respect `prefers-reduced-motion` — typing dots stay static, fades become instant.
- **Focus.** 2px `signal` ring with 2px offset, on every interactive element. Always visible.

## 12. Accessibility and quality gates

- All text meets WCAG AA contrast on its surface (verified for `ink` on `paper` = 11.6:1, `ink` on `wax` = 9.8:1, `paper` on `night` = 13.4:1, `signal` on `paper` = 5.7:1).
- All images have meaningful `alt` text; decorative SVGs use `aria-hidden="true"`.
- Tab order: nav → hero CTAs → concierge input → catalog cards (left to right, top to bottom) → pricing CTAs → FAQ → footer.
- Headings cascade `h1 → h2 → h3` without skipping levels.
- Forms (the concierge input is presentational only) carry visible labels; nothing relies on placeholder-only labelling.
- Hit targets are at least 40 × 40px on mobile.

## 13. Screenshots and verification artifacts

- `docs/screenshots/landing-desktop.png` — captured at 1440 × 900 from the deployed URL.
- `docs/screenshots/landing-mobile.png` — captured at 390 × 844 from the deployed URL.
- Both linked from README.md and from this section.

If a section of the design changes, the screenshots are re-captured and committed in the same change.

## 14. External references and library sources

- ShadCN/UI — https://ui.shadcn.com/
- Tailwind CSS v4 — https://tailwindcss.com/
- Refero Styles — https://styles.refero.design/ (browseable DESIGN.md gallery)
- HashiCorp release pages — https://releases.hashicorp.com/
- Sotheby's catalog typography — public auction catalogs, structural reference only
- NOWPayments API docs — https://nowpayments.zendesk.com/hc/en-us/articles/21345824322717-API-and-endpoint-description

## 15. Changelog

- **2026-05-08** — v0.1. Initial spec drafted alongside the v1 landing build. All 15 sections decisions made; no `TBD` left.
