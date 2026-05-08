# 01 — Brand Identity

## Brand pyramid

- **Essence (1 word)** — Provenance.
- **Personality (3 traits)** — Restrained. Specific. Owned.
- **Values (3)** — Named outcomes over abstract capability. Shelf over marketplace. Provenance over personality.
- **Attributes (5)** — Catalog-grade typography. Lot numbers. Brass-on-paper. Single signal-blue accent. No mascots.

## Positioning statement

For operators who need named outcomes, **Provenance** is a vetted catalog of working AI agents that you can demo and buy in under ten minutes — unlike no-code agent marketplaces, because every agent ships with a real provenance record (who trained it, what it has shipped, what it costs to run).

## Audience

**Primary persona — Mira, VP RevOps, 7M ARR SaaS.** Ran two AI pilots last year; one stalled, one shipped. She doesn't have time to scope another. She wants three SDR options on a shelf, with reference customers and a price tag, by Friday.

**Secondary persona — Alex, agency principal, 14-person shop.** Resells agent labor under his brand. He needs to be able to point at "Lot 042 — Anders, SDR" and say "I run that for three of my clients" without making it up.

**Anti-persona — the no-code dabbler.** Someone who wants a playground to wire prompts. We are not for them.

## Voice and tone

**Do.** Use specific numbers ("18 ops teams since Feb"), name a person not a model ("trained by Mira's team"), use the word "lot."
**Don't.** Use the words "revolutionary," "game-changing," or "AI-powered."
**Don't.** Use exclamation points outside of FAQ answers.
**Don't.** Write copy a startup landing page in 2024 would have written.

**Sample sentence.** "Lot 042 — Anders works the inbox for eighteen B2B teams; thirty-day acceptance rate is 42% across the cohort. You can demo him in your data, not ours."

## Visual system

**Palette.** `paper #F4EFE6`, `ink #161513`, `wax #E9E0CF`, `vellum #FBF7EE`, `night #0E0D0B`, accents `brass #A88646`, `signal #1F4FE0`. The accents do exactly one job each — `brass` for provenance ribbons and lot numbers, `signal` for interaction.

**Typography.** **Inter Display** (display + UI, weights 400-700) and **JetBrains Mono** (lot numbers, agent IDs). The grotesk + mono pair reads like a release note, not like an ad.

**Logo concept.** Word-mark "PROVENANCE" in Inter Display 600, all caps, tracked -20. A single 6px brass dot sits to the left of the P, on the baseline. Inline SVG, no raster:

```svg
<svg width="220" height="20" viewBox="0 0 220 20" xmlns="http://www.w3.org/2000/svg">
  <circle cx="6" cy="10" r="3" fill="#A88646" />
  <text x="20" y="15" font-family="Inter Display, Inter, sans-serif"
        font-weight="600" font-size="14" letter-spacing="-0.02em" fill="#161513">
    PROVENANCE
  </text>
</svg>
```

**Spacing & radius.** Spacing scale `2/4/8/12/16/24/32/48/64/96/128`. Radius `6/10/14`. Buttons `6`, cards `10`, sheets `14`. Nothing fully rounded.

**Motion.** Color and border only. No translate, scale, or shadow lift on hover.

## Forbidden

- Robot avatars or stylized neural-net iconography.
- Purple, teal, or "AI gradient." Single signal blue is enough.
- Lorem ipsum or "TODO" copy in shipped views.
- Mimicking Vercel, OpenAI, Anthropic, or generic "marketplace gradient" identities.
