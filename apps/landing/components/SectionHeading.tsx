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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
      <div className={cn("md:col-span-3 lot-label", dark && "text-brass-2")}>
        LOT {lot} · {label}
      </div>
      <div className="md:col-span-9">
        <h2
          className={cn(
            "text-[40px] md:text-[48px] font-semibold leading-[1.05] tracking-tightest",
            dark ? "text-paper" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-4 max-w-3xl text-[18px] leading-relaxed",
              dark ? "text-paper/70" : "text-ink-2",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
