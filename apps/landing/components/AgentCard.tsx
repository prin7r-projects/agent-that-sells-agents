import { Agent } from "@/lib/agents";
import { cn } from "@/lib/cn";
import { CheckoutButton } from "./CheckoutButton";

export function AgentCard({ agent, compact = false }: { agent: Agent; compact?: boolean }) {
  return (
    <article
      className={cn(
        "group rounded-[10px] bg-vellum border border-ink/10 hover:border-signal/40 transition-colors p-6 flex flex-col gap-5",
        compact && "p-5",
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="lot-label">LOT {agent.lot} · {agent.role.toUpperCase()}</div>
          <h3 className="text-[20px] font-semibold tracking-tight mt-1">
            {agent.name}
          </h3>
          <p className="text-[14px] text-ink-2 leading-snug mt-1 max-w-sm">
            {agent.blurb}
          </p>
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] border-t border-ink/10 pt-4">
        <div className="flex justify-between col-span-2">
          <dt className="text-ink-2">Trained by</dt>
          <dd className="font-medium">{agent.trainedBy}</dd>
        </div>
        <div className="flex justify-between col-span-2">
          <dt className="text-ink-2">Deployed since</dt>
          <dd className="font-mono text-[12px]">{agent.deployedSince}</dd>
        </div>
        {agent.outcomes.map((o) => (
          <div key={o.label} className="flex flex-col">
            <dt className="text-ink-2 text-[11px] uppercase tracking-wider">{o.label}</dt>
            <dd className="font-mono text-[15px]">{o.value}</dd>
          </div>
        ))}
        <div className="flex justify-between col-span-2 pt-2 mt-1 border-t border-ink/10">
          <dt className="text-ink-2">References</dt>
          <dd>{agent.references} named teams</dd>
        </div>
      </dl>
      <footer className="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          className="text-[13px] font-medium border border-ink/20 hover:border-signal hover:text-signal transition-colors px-3 py-1.5 rounded-sm"
        >
          Demo
        </button>
        <CheckoutButton
          tierId="trial"
          agentLot={agent.lot}
          className="text-[13px] font-medium bg-signal text-paper hover:bg-signal-2 transition-colors px-3 py-1.5 rounded-sm"
          label="Buy Trial"
        />
      </footer>
    </article>
  );
}
