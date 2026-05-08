import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-silver-mist bg-canvas/85 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-content mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span aria-hidden className="block w-2.5 h-2.5 rounded-full bg-ink" />
          <span className="font-semibold tracking-[-0.016em] text-[16px] text-ink">
            StampedAgents
          </span>
          <span className="lot-label hidden sm:inline">LOT 001 · 2026</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[14px] text-ink">
          <Link href="#catalog" className="hover:text-graphite transition-colors">Catalog</Link>
          <Link href="#stamp" className="hover:text-graphite transition-colors">Stamp</Link>
          <Link href="#pricing" className="hover:text-graphite transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-graphite transition-colors">FAQ</Link>
        </nav>
        <Link
          href="#concierge"
          className="text-[14px] font-medium px-4 py-2 rounded-full border border-silver-mist text-ink hover:bg-fog transition-colors"
        >
          Talk to Concierge
        </Link>
      </div>
    </header>
  );
}
