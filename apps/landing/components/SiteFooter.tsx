import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 mt-32">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-12 grid gap-10 md:grid-cols-4 text-[14px]">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span aria-hidden className="block w-2 h-2 rounded-sm bg-brass" />
            <span className="font-semibold tracking-[-0.02em]">PROVENANCE</span>
          </div>
          <p className="text-ink-2 leading-relaxed">
            A vetted shelf of working AI agents. Demo, vet, buy in under ten minutes.
          </p>
        </div>
        <div>
          <div className="lot-label mb-3">Catalog</div>
          <ul className="space-y-2">
            <li><Link href="#catalog" className="hover:text-signal">All agents</Link></li>
            <li><Link href="#provenance" className="hover:text-signal">How they're built</Link></li>
            <li><Link href="#outcomes" className="hover:text-signal">Outcomes</Link></li>
          </ul>
        </div>
        <div>
          <div className="lot-label mb-3">Buy</div>
          <ul className="space-y-2">
            <li><Link href="#pricing" className="hover:text-signal">Pricing</Link></li>
            <li><Link href="#faq" className="hover:text-signal">FAQ</Link></li>
            <li><Link href="#concierge" className="hover:text-signal">Concierge</Link></li>
          </ul>
        </div>
        <div>
          <div className="lot-label mb-3">Build</div>
          <ul className="space-y-2 font-mono text-[12px]">
            <li>BUILD · 2026-05-08</li>
            <li>STACK · NEXT 15</li>
            <li>RAIL · NOWPAYMENTS</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink/10">
        <div className="max-w-content mx-auto px-6 lg:px-12 py-5 flex justify-between items-center text-[12px] text-ink-2">
          <span>&copy; 2026 Provenance · Prin7r Wave 2</span>
          <span className="font-mono">agent-that-sells-agents.prin7r.com</span>
        </div>
      </div>
    </footer>
  );
}
