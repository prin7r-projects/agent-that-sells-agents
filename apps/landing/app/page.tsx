import { agents, tiers } from "@/lib/agents";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CatalogGrid } from "@/components/CatalogGrid";
import { ConciergeRail } from "@/components/ConciergeRail";
import { StampTable } from "@/components/StampTable";
import { PricingTierCard } from "@/components/PricingTier";
import { SectionHeading } from "@/components/SectionHeading";

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <Hero />
      <RibbonRow />
      <CatalogGrid />
      <Stamp />
      <Outcomes />
      <Pricing />
      <Faq />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  const peek = agents.slice(0, 3);
  return (
    <section className="border-b border-silver-mist bg-canvas">
      <div className="max-w-content mx-auto px-6 lg:px-12 pt-20 lg:pt-32 pb-12 lg:pb-16">
        {/* Apple-style centered hero: lot label, enormous headline, lede, CTAs */}
        <div className="text-center mx-auto max-w-5xl">
          <div className="lot-label">LOT 001 · OPENING</div>
          <h1 className="mt-6 mx-auto max-w-[18ch] text-[56px] sm:text-[80px] lg:text-[112px] font-bold leading-[1.04] tracking-[-0.022em] text-ink">
            A vetted shelf of working AI agents.
          </h1>
          <p className="mt-8 mx-auto max-w-[44ch] text-[20px] lg:text-[22px] font-light leading-[1.4] tracking-[-0.010em] text-graphite">
            Sold by an agent. Six agents on the shelf — sales SDR, support concierge,
            research analyst, ops auditor. Demo it in your data, vet it, buy it in
            under ten minutes.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#catalog"
              // [STAMPED_AGENTS_WAVE2] primary CTA retokenized to ink (black).
              // Azure is no longer used for CTA fills — see DESIGN.md §4.
              className="bg-ink text-snow text-[16px] font-medium h-12 inline-flex items-center px-6 rounded-full hover:opacity-88 transition-opacity"
            >
              Browse the catalog
            </a>
            <a
              href="#concierge"
              className="text-[16px] font-medium h-12 inline-flex items-center px-6 rounded-full border border-ink text-ink hover:bg-fog transition-colors"
            >
              Talk to the Concierge
            </a>
          </div>
          <p className="mt-7 lot-label">avg time-to-buy · under 10 min</p>
        </div>
      </div>

      {/* Below-fold: gallery card stack of 3 peek agents on the left, Concierge on the right */}
      <div className="max-w-content mx-auto px-6 lg:px-12 pb-20 lg:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <div className="relative h-[300px] sm:h-[340px]">
            <div aria-hidden className="absolute inset-0">
              {peek.map((a, i) => (
                <div
                  key={a.lot}
                  className="absolute rounded-[28px] bg-vellum border border-silver-mist p-6 w-[280px] sm:w-[360px]"
                  style={{
                    left: `${i * 64}px`,
                    top: `${i * 22}px`,
                    transform: `rotate(${(i - 1) * 1.4}deg)`,
                    zIndex: 10 - i,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="lot-label">LOT {a.lot} · {a.role.toUpperCase()}</div>
                    <span className="text-[11px] font-mono text-graphite">
                      {a.deployedSince}
                    </span>
                  </div>
                  <div className="text-[20px] font-semibold mt-2 tracking-[-0.016em]">{a.name}</div>
                  <div className="text-[14px] text-slate mt-1 line-clamp-2">
                    {a.blurb}
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-[11px] text-graphite font-mono">
                    <span>{a.outcomes[0].label}: {a.outcomes[0].value}</span>
                    <span>·</span>
                    <span>{a.outcomes[1].label}: {a.outcomes[1].value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <ConciergeRail />
        </div>
      </div>
    </section>
  );
}

function RibbonRow() {
  const ribbons = [
    { lot: "042", text: "Anders, SDR — eighteen ops teams since Feb." },
    { lot: "047", text: "Hatfield, Support — eleven SaaS teams." },
    { lot: "051", text: "Vance, Research — sixty-three reports last month." },
    { lot: "058", text: "Lermontov, Inbound — 188 demos booked in April." },
  ];
  return (
    <section aria-label="Stamp ribbons" className="border-b border-silver-mist bg-fog">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ribbons.map((r) => (
          <div key={r.lot} className="flex items-baseline gap-3 text-[13px]">
            <span className="lot-label whitespace-nowrap">LOT {r.lot}</span>
            <span className="text-slate leading-snug">{r.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stamp() {
  return (
    <section id="stamp" className="bg-obsidian text-snow">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <SectionHeading
          dark
          lot="03"
          label="STAMP"
          title="How they're built — with names attached."
          description="No black boxes. Every agent ships with the corpus it was trained on, the model family it runs on, and the evaluation method that catches drift before you do."
        />
        <StampTable />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-[15px] text-snow/75">
          <Pillar
            title="Named operators"
            body="Each agent is owned by a real human. Their handle is on the page. Drift is their problem first, yours second."
          />
          <Pillar
            title="Public eval"
            body="A monthly eval log per agent — replies sampled, false-positives traced, audit dates published."
          />
          <Pillar
            title="BYO model"
            body="Pro and Enterprise can route Anders, Hatfield, or Vance through your VPC endpoint. Trial uses our hosted stack."
          />
        </div>
      </div>
    </section>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-snow/30 pl-5">
      <div className="text-[16px] font-semibold text-snow tracking-[-0.010em]">{title}</div>
      <p className="mt-2 leading-relaxed">{body}</p>
    </div>
  );
}

function Outcomes() {
  const items = [
    {
      lot: "042",
      title: "Anders shipped 312 first-touch emails for an 8-person fintech.",
      detail: "42% reply rate · 8 booked meetings · zero list-burn flags · operator sign-off Mira Rao.",
    },
    {
      lot: "047",
      title: "Hatfield closed 71% of inbound tickets without human handoff.",
      detail: "428 tickets / week · CSAT 4.7 · operator sign-off Sara Okereke.",
    },
    {
      lot: "051",
      title: "Vance shipped a 42-source competitor brief in 28 hours.",
      detail: "9% rework rate · cited claims audited weekly · operator sign-off Theo Kapoor.",
    },
  ];
  return (
    <section id="outcomes" className="border-b border-silver-mist bg-fog">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <SectionHeading
          lot="04"
          label="OUTCOMES"
          title="Last 30 days. Real numbers. Named operators."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((it) => (
            <article
              key={it.lot}
              className="rounded-[28px] bg-snow border border-silver-mist p-7 flex flex-col gap-3"
            >
              <div className="lot-label">LOT {it.lot} · 30D</div>
              <h3 className="text-[19px] font-semibold tracking-[-0.016em] leading-snug">{it.title}</h3>
              <p className="text-[15px] text-slate leading-relaxed">{it.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="bg-obsidian text-snow">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <SectionHeading
          dark
          lot="05"
          label="PRICING"
          title="A price on the page."
          description="Subscription is the headline. Outcome pricing — per meeting, per resolved ticket — is available on Pro and Enterprise, capped at 1.5×. Crypto stablecoin (USDT/USDC) via NOWPayments is the v1 rail."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {tiers.map((t) => (
            <PricingTierCard key={t.id} tier={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const faqs = [
    {
      q: "Why crypto checkout in v1?",
      a: "Stablecoin rails via NOWPayments are faster than card pilots for our buyer cohort — most of them already pay an OpenAI or Anthropic invoice in USD-equivalent. Wire and ACH are coming later this year. We don't take cards in v1.",
    },
    {
      q: "Can I demo the agent against my own data?",
      a: "Yes. The Concierge will ask whether you want to demo against your data or ours. Yours is slower (we connect to a sandbox account first); ours is instant.",
    },
    {
      q: "What is the SLO?",
      a: "Pro: 99.5% reachability across the agent's surface. Enterprise: hard targets per agent (e.g., SDR — 100 actions/day, 30-day reply rate ≥ 25%). Trial has no SLO.",
    },
    {
      q: "How do you handle drift and retraining?",
      a: "Pro includes one monthly retraining slot per agent, owned by the named human operator. Each agent has a public monthly eval log. Enterprise can pin a model version and lock the corpus.",
    },
    {
      q: "Can I run the model in our VPC?",
      a: "Pro and Enterprise support BYO endpoint — Bedrock, Vertex, or Azure OpenAI. Trial uses our hosted stack only.",
    },
    {
      q: "Is this a marketplace?",
      a: "No. It's a vetted shelf. Six lots in v1, all owned by named operators inside Prin7r. We add lots quarterly; we sunset lots that don't ship.",
    },
    {
      q: "What's the rev-share for agencies?",
      a: "Alex's program: 30% rev-share to the agency on Pro and Enterprise referrals, with a co-branded partner page. Email concierge to register.",
    },
    {
      q: "What if my Trial doesn't ship?",
      a: "Cancel anytime in the first 14 days, full refund of the Trial fee. After that, Trial is month-to-month — same cancel-anytime policy.",
    },
  ];
  return (
    <section id="faq" className="border-b border-silver-mist bg-canvas">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <SectionHeading
          lot="06"
          label="FAQ"
          title="Eight honest answers."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="text-[18px] font-semibold tracking-[-0.016em]">{f.q}</h3>
              <p className="mt-3 text-[15px] text-slate leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
