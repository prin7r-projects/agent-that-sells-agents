import { agents, tiers } from "@/lib/agents";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AgentCard } from "@/components/AgentCard";
import { ConciergeRail } from "@/components/ConciergeRail";
import { ProvenanceTable } from "@/components/ProvenanceTable";
import { PricingTierCard } from "@/components/PricingTier";
import { SectionHeading } from "@/components/SectionHeading";

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <Hero />
      <RibbonRow />
      <Catalog />
      <Provenance />
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
    <section className="border-b border-ink/10">
      <div className="max-w-content mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-20 lg:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <div className="lot-label">LOT 001 · OPENING</div>
          <h1 className="mt-3 text-[44px] sm:text-[56px] lg:text-[68px] font-semibold leading-[0.98] tracking-tightest">
            A vetted shelf of working AI agents.
            <br />
            <span className="text-ink-2">Sold by an agent.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-ink-2">
            Six agents on the shelf — sales SDR, support concierge, research analyst,
            ops auditor. Each one ships with a real provenance record: who trained it,
            what it shipped last month, and a price tag. Demo it in your data, vet it,
            buy it in under ten minutes. The Concierge on your right runs the demo.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#catalog"
              className="bg-signal text-paper text-[14px] font-semibold px-5 py-3 rounded-sm hover:bg-signal-2 transition-colors"
            >
              Browse the catalog
            </a>
            <a
              href="#concierge"
              className="text-[14px] font-semibold px-5 py-3 rounded-sm border border-ink/20 hover:border-signal hover:text-signal transition-colors"
            >
              Talk to the Concierge
            </a>
            <span className="lot-label">avg time-to-buy · under 10 min</span>
          </div>

          <div className="mt-12 relative h-[260px] sm:h-[300px]">
            <div aria-hidden className="absolute inset-0">
              {peek.map((a, i) => (
                <div
                  key={a.lot}
                  className="absolute rounded-[10px] bg-vellum border border-ink/10 shadow-[0_1px_0_rgba(22,21,19,0.04),0_0_0_1px_rgba(22,21,19,0.05)] p-5 w-[280px] sm:w-[340px]"
                  style={{
                    left: `${i * 56}px`,
                    top: `${i * 18}px`,
                    transform: `rotate(${(i - 1) * 1.6}deg)`,
                    zIndex: 10 - i,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="lot-label">LOT {a.lot} · {a.role.toUpperCase()}</div>
                    <span className="text-[11px] font-mono text-ink-2">
                      {a.deployedSince}
                    </span>
                  </div>
                  <div className="text-[18px] font-semibold mt-1">{a.name}</div>
                  <div className="text-[12px] text-ink-2 mt-1 line-clamp-2">
                    {a.blurb}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-2 font-mono">
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
    <section aria-label="Provenance ribbons" className="border-b border-ink/10 bg-wax/60">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ribbons.map((r) => (
          <div key={r.lot} className="flex items-baseline gap-3 text-[13px]">
            <span className="lot-label whitespace-nowrap">LOT {r.lot}</span>
            <span className="text-ink-2 leading-snug">{r.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Catalog() {
  return (
    <section id="catalog" className="border-b border-ink/10">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <SectionHeading
          lot="02"
          label="CATALOG"
          title="Six agents on the shelf, each with a price tag."
          description="Filter by function — Sales, Support, Research, Ops. Each card lists the named operator, when the agent was deployed, and the last 30 days of outcomes."
        />
        <div className="flex gap-2 mb-8 text-[13px] flex-wrap">
          {["All", "Sales", "Support", "Research", "Ops"].map((f, i) => (
            <button
              key={f}
              type="button"
              className={
                i === 0
                  ? "px-3 py-1.5 rounded-sm bg-ink text-paper"
                  : "px-3 py-1.5 rounded-sm border border-ink/15 hover:border-signal hover:text-signal transition-colors"
              }
            >
              {f}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((a) => (
            <AgentCard key={a.lot} agent={a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Provenance() {
  return (
    <section id="provenance" className="bg-night text-paper">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <SectionHeading
          dark
          lot="03"
          label="PROVENANCE"
          title="How they're built — with names attached."
          description="No black boxes. Every agent ships with the corpus it was trained on, the model family it runs on, and the evaluation method that catches drift before you do."
        />
        <ProvenanceTable />
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-[14px] text-paper/80">
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
    <div className="border-l-2 border-brass pl-4">
      <div className="text-[15px] font-semibold text-paper">{title}</div>
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
    <section id="outcomes" className="border-b border-ink/10">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <SectionHeading
          lot="04"
          label="OUTCOMES"
          title="Last 30 days. Real numbers. Named operators."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((it) => (
            <article
              key={it.lot}
              className="rounded-[10px] bg-vellum border border-ink/10 p-6 flex flex-col gap-3"
            >
              <div className="lot-label">LOT {it.lot} · 30D</div>
              <h3 className="text-[18px] font-semibold leading-snug">{it.title}</h3>
              <p className="text-[14px] text-ink-2 leading-relaxed">{it.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="bg-night text-paper">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-20 lg:py-28">
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
    <section id="faq" className="border-b border-ink/10">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <SectionHeading
          lot="06"
          label="FAQ"
          title="Eight honest answers."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="text-[16px] font-semibold tracking-tight">{f.q}</h3>
              <p className="mt-2 text-[14px] text-ink-2 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
