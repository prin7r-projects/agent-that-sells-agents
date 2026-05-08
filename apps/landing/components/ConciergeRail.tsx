export function ConciergeRail() {
  return (
    <aside
      id="concierge"
      aria-label="Concierge agent"
      className="rounded-[28px] border border-silver-mist bg-vellum p-6 flex flex-col gap-4 min-h-[440px]"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span aria-hidden className="block w-2 h-2 rounded-full bg-azure" />
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.010em] text-ink">Concierge</div>
            <div className="lot-label">ON · LOT 001 META</div>
          </div>
        </div>
        <span className="text-[11px] font-mono text-graphite">avg reply 18s</span>
      </header>

      <div className="flex flex-col gap-3 flex-1">
        <Bubble who="concierge">
          Hi — I run the catalog. Tell me your function and I&rsquo;ll surface the
          two lots that best fit. Or pick one yourself below.
        </Bubble>
        <Bubble who="visitor">
          We&rsquo;re a 7M ARR SaaS. Two SDRs, no inbound team yet. What fits?
        </Bubble>
        <Bubble who="concierge">
          Lot 042 — Anders — works the inbox for 18 B2B teams. 30-day reply rate
          42%. Or Lot 058 — Lermontov — for inbound qualification. Both Trial
          starts at $99 and you can demo against your own data.
        </Bubble>
        <Bubble who="concierge" typing />
      </div>

      <div className="border-t border-silver-mist pt-4 flex flex-col gap-2">
        <div className="lot-label">Suggested questions</div>
        <ul className="flex flex-col gap-1.5 text-[13px]">
          <li>
            <Suggested>How do I price the SDR by outcome instead of seat?</Suggested>
          </li>
          <li>
            <Suggested>Can I keep the model in our VPC?</Suggested>
          </li>
          <li>
            <Suggested>What&rsquo;s the rev-share if I&rsquo;m an agency partner?</Suggested>
          </li>
        </ul>
      </div>

      <div className="border-t border-silver-mist pt-4">
        <label htmlFor="concierge-input" className="lot-label block mb-2">
          Reply to Concierge
        </label>
        <div className="flex items-stretch gap-2">
          <input
            id="concierge-input"
            type="text"
            placeholder="What does your week look like?"
            className="flex-1 bg-snow border border-silver-mist rounded-full px-4 py-2 text-[14px] focus:border-azure focus:outline-none"
          />
          <button
            type="button"
            className="bg-ink text-snow text-[14px] font-medium px-4 py-2 rounded-full hover:opacity-88 transition-opacity"
          >
            Send
          </button>
        </div>
        <p className="text-[12px] text-graphite mt-2 leading-relaxed">
          The Concierge is a scripted demo on the public landing. Real
          replies are answered by the named operator on your tier.
        </p>
      </div>
    </aside>
  );
}

function Bubble({
  who,
  children,
  typing = false,
}: {
  who: "concierge" | "visitor";
  children?: React.ReactNode;
  typing?: boolean;
}) {
  const isConcierge = who === "concierge";
  return (
    <div className={isConcierge ? "flex" : "flex justify-end"}>
      <div
        className={
          isConcierge
            ? "max-w-[92%] rounded-[18px] bg-snow border border-silver-mist px-4 py-2.5 text-[14px] leading-relaxed text-slate"
            : "max-w-[88%] rounded-[18px] bg-ink text-snow px-4 py-2.5 text-[14px] leading-relaxed"
        }
      >
        {typing ? (
          <span className="inline-flex gap-1 py-1" aria-label="Concierge is typing">
            <span aria-hidden className="dot-1 inline-block w-1.5 h-1.5 rounded-full bg-graphite" />
            <span aria-hidden className="dot-2 inline-block w-1.5 h-1.5 rounded-full bg-graphite" />
            <span aria-hidden className="dot-3 inline-block w-1.5 h-1.5 rounded-full bg-graphite" />
          </span>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function Suggested({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="text-left w-full text-slate hover:text-ink transition-colors"
    >
      <span className="text-graphite mr-2">›</span>
      {children}
    </button>
  );
}
