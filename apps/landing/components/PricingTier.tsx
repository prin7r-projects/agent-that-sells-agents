import { Tier } from "@/lib/agents";
import { cn } from "@/lib/cn";
import { CheckoutButton } from "./CheckoutButton";

export function PricingTierCard({ tier }: { tier: Tier }) {
  return (
    <article
      className={cn(
        "rounded-[28px] border p-7 flex flex-col gap-5 transition-colors",
        tier.highlight
          ? "bg-snow text-ink border-ink"
          : "bg-snow/[0.04] text-snow border-snow/15 hover:border-snow/35",
      )}
    >
      <header className="flex items-baseline justify-between">
        <div>
          <div className={cn("lot-label", tier.highlight ? "text-graphite" : "text-snow/60")}>
            {tier.id.toUpperCase()}
          </div>
          <h3 className="text-[28px] font-semibold tracking-[-0.016em] mt-2">{tier.name}</h3>
        </div>
      </header>
      <div>
        <div className={cn("text-[40px] font-bold tracking-[-0.022em]", tier.highlight ? "text-ink" : "text-snow")}>
          {tier.priceLabel}
        </div>
        <div className={cn("text-[13px]", tier.highlight ? "text-graphite" : "text-snow/60")}>
          {tier.cadence}
        </div>
      </div>
      <ul className="flex flex-col gap-2.5 text-[15px] flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-3 items-start">
            <span aria-hidden className={cn("mt-2 inline-block w-2 h-px", tier.highlight ? "bg-ink/40" : "bg-snow/40")} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <CheckoutButton
        tierId={tier.id}
        label={tier.ctaLabel}
        className={cn(
          "text-[15px] font-medium px-6 py-3 rounded-full transition-opacity",
          tier.highlight
            ? "bg-azure text-snow hover:opacity-88"
            : "bg-snow text-ink hover:opacity-88",
        )}
      />
      <p
        className={cn(
          "text-[11px] font-mono",
          tier.highlight ? "text-graphite" : "text-snow/50",
        )}
      >
        Outcome pricing available on Pro and Enterprise; capped at 1.5x.
      </p>
    </article>
  );
}
