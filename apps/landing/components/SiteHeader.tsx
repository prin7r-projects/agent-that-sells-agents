import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-ink/10 bg-paper/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-content mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span aria-hidden className="block w-2 h-2 rounded-sm bg-brass" />
          <span className="font-semibold tracking-[-0.02em] text-[15px]">
            PROVENANCE
          </span>
          <span className="lot-label hidden sm:inline">LOT 001 · 2026</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[14px]">
          <Link href="#catalog" className="hover:text-signal transition-colors">Catalog</Link>
          <Link href="#provenance" className="hover:text-signal transition-colors">Provenance</Link>
          <Link href="#pricing" className="hover:text-signal transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-signal transition-colors">FAQ</Link>
        </nav>
        <Link
          href="#concierge"
          className="text-[13px] font-medium px-3 py-1.5 rounded-sm border border-ink/20 hover:border-signal hover:text-signal transition-colors"
        >
          Talk to Concierge
        </Link>
      </div>
    </header>
  );
}
