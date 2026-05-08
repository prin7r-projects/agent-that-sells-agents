import { Tier } from "@/lib/agents";
import { cn } from "@/lib/cn";
import { CheckoutButton } from "./CheckoutButton";

export function PricingTierCard({ tier }: { tier: Tier }) {
  return (
    <article
      className={cn(
        "rounded-[10px] border p-7 flex flex-col gap-5 transition-colors",
        tier.highlight
          ? "bg-paper text-ink border-brass"
          : "bg-night/40 text-paper border-graphite hover:border-brass",
      )}
    >
      <header className="flex items-baseline justify-between">
        <div>
          <div className={cn("lot-label", tier.highlight ? "text-brass" : "text-brass-2")}>
            {tier.id.toUpperCase()}
          </div>
          <h3 className="text-[28px] font-semibold tracking-tight mt-1">{tier.name}</h3>
        </div>
      </header>
      <div>
        <div className={cn("text-[40px] font-semibold tracking-tight", tier.highlight && "text-ink")}>
          {tier.priceLabel}
        </div>
        <div className={cn("text-[13px]", tier.highlight ? "text-ink-2" : "text-paper/70")}>
          {tier.cadence}
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-[14px] flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-3 items-start">
            <span aria-hidden className="text-brass mt-0.5 leading-none">
              ◆
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <CheckoutButton
        tierId={tier.id}
        label={tier.ctaLabel}
        className={cn(
          "text-[14px] font-semibold px-4 py-3 rounded-sm transition-colors",
          tier.highlight
            ? "bg-signal text-paper hover:bg-signal-2"
            : "bg-paper text-ink hover:bg-brass-2",
        )}
      />
      <p
        className={cn(
          "text-[11px] font-mono",
          tier.highlight ? "text-ink-2" : "text-paper/50",
        )}
      >
        Outcome pricing available on Pro and Enterprise; capped at 1.5×.
      </p>
    </article>
  );
}
