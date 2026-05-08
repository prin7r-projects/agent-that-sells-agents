import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-silver-mist mt-32 bg-canvas">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-14 grid gap-10 md:grid-cols-4 text-[14px]">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span aria-hidden className="block w-2.5 h-2.5 rounded-full bg-ink" />
            <span className="font-semibold tracking-[-0.016em] text-ink">StampedAgents</span>
          </div>
          <p className="text-slate leading-relaxed">
            A vetted shelf of working AI agents. Demo, vet, buy in under ten minutes.
          </p>
        </div>
        <div>
          <div className="lot-label mb-3">Catalog</div>
          <ul className="space-y-2 text-ink">
            <li><Link href="#catalog" className="hover:text-graphite">All agents</Link></li>
            <li><Link href="#stamp" className="hover:text-graphite">How they&rsquo;re built</Link></li>
            <li><Link href="#outcomes" className="hover:text-graphite">Outcomes</Link></li>
          </ul>
        </div>
        <div>
          <div className="lot-label mb-3">Buy</div>
          <ul className="space-y-2 text-ink">
            <li><Link href="#pricing" className="hover:text-graphite">Pricing</Link></li>
            <li><Link href="#faq" className="hover:text-graphite">FAQ</Link></li>
            <li><Link href="#concierge" className="hover:text-graphite">Concierge</Link></li>
          </ul>
        </div>
        <div>
          <div className="lot-label mb-3">Build</div>
          <ul className="space-y-2 font-mono text-[12px] text-graphite">
            <li>BUILD · 2026-05-08</li>
            <li>STACK · NEXT 15</li>
            <li>RAIL · NOWPAYMENTS</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-silver-mist">
        <div className="max-w-content mx-auto px-6 lg:px-12 py-5 flex justify-between items-center text-[12px] text-graphite">
          <span>&copy; 2026 StampedAgents · Prin7r Wave 2</span>
          <span className="font-mono">agent-that-sells-agents.prin7r.com</span>
        </div>
      </div>
    </footer>
  );
}
