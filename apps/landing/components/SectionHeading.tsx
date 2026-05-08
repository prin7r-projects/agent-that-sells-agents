import { cn } from "@/lib/cn";

export function SectionHeading({
  lot,
  label,
  title,
  description,
  dark = false,
}: {
  lot: string;
  label: string;
  title: string;
  description?: string;
  dark?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-14">
      <div className={cn("md:col-span-3 lot-label", dark && "text-snow/60")}>
        LOT {lot} · {label}
      </div>
      <div className="md:col-span-9">
        <h2
          className={cn(
            "text-[44px] md:text-[64px] lg:text-[80px] font-bold leading-[1.04] tracking-[-0.022em]",
            dark ? "text-snow" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-6 max-w-3xl text-[19px] md:text-[22px] font-light leading-[1.4] tracking-[-0.010em]",
              dark ? "text-snow/70" : "text-graphite",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
