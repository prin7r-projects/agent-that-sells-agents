import { Agent } from "@/lib/agents";
import { cn } from "@/lib/cn";
import { CheckoutButton } from "./CheckoutButton";

export function AgentCard({ agent, compact = false }: { agent: Agent; compact?: boolean }) {
  return (
    <article
      className={cn(
        "group rounded-[28px] bg-vellum border border-silver-mist hover:border-graphite transition-colors p-7 flex flex-col gap-5",
        compact && "p-6",
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="lot-label">LOT {agent.lot} · {agent.role.toUpperCase()}</div>
          <h3 className="text-[22px] font-semibold tracking-[-0.016em] mt-2">
            {agent.name}
          </h3>
          <p className="text-[15px] text-slate leading-snug mt-2 max-w-sm">
            {agent.blurb}
          </p>
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] border-t border-silver-mist pt-5">
        <div className="flex justify-between col-span-2">
          <dt className="text-graphite">Trained by</dt>
          <dd className="font-medium text-ink">{agent.trainedBy}</dd>
        </div>
        <div className="flex justify-between col-span-2">
          <dt className="text-graphite">Deployed since</dt>
          <dd className="font-mono text-[12px] text-slate">{agent.deployedSince}</dd>
        </div>
        {agent.outcomes.map((o) => (
          <div key={o.label} className="flex flex-col">
            <dt className="text-graphite text-[11px] uppercase tracking-[0.18em]">{o.label}</dt>
            <dd className="font-mono text-[16px] text-ink">{o.value}</dd>
          </div>
        ))}
        <div className="flex justify-between col-span-2 pt-3 mt-1 border-t border-silver-mist">
          <dt className="text-graphite">References</dt>
          <dd className="text-ink">{agent.references} named teams</dd>
        </div>
      </dl>
      <footer className="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          className="text-[14px] font-medium border border-silver-mist text-ink hover:bg-fog transition-colors px-4 py-2 rounded-full"
        >
          Demo
        </button>
        <CheckoutButton
          tierId="trial"
          agentLot={agent.lot}
          className="text-[14px] font-medium bg-azure text-snow hover:opacity-88 transition-opacity px-4 py-2 rounded-full"
          label="Buy Trial"
        />
      </footer>
    </article>
  );
}
