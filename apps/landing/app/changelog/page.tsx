import { loadAgents, getEvalsForAgent } from "@/lib/catalog-data";
import { OrderService, RevShareService } from "@/lib/server/orders";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

interface ChangelogEvent {
  date: string;
  type: "agent_added" | "drift_event" | "payout" | "eval_run";
  title: string;
  description: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ChangelogPage() {
  const agents = loadAgents();
  const orders = await OrderService.listAll();
  const allRevShare = await RevShareService.listAll();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const events: ChangelogEvent[] = [];

  for (const agent of agents) {
    const deployed = new Date(agent.deployedSince);
    if (deployed >= cutoff) {
      events.push({
        date: agent.deployedSince,
        type: "agent_added",
        title: `${agent.displayName} added to catalog`,
        description: `Lot ${agent.lotNumber} · ${agent.category.toUpperCase()} · trained by ${agent.provenance.trainedBy}`,
      });
    }

    const evals = getEvalsForAgent(agent.id, 30);
    for (const ev of evals) {
      events.push({
        date: ev.runDate,
        type: "eval_run",
        title: `${agent.displayName} evaluated — ${(ev.scoreBps / 100).toFixed(1)}%`,
        description: `Corpus: ${ev.corpus} · Evaluator: ${ev.evaluator}`,
      });
    }

    if (agent.driftStatus !== "green") {
      events.push({
        date: agent.lastAudit,
        type: "drift_event",
        title: `${agent.displayName} drift status: ${agent.driftStatus}`,
        description: `Last audit ${formatDate(agent.lastAudit)}. Score trends available in eval log.`,
      });
    }
  }

  for (const order of orders) {
    if (order.status === "paid" && order.paidAt) {
      const paid = new Date(order.paidAt);
      if (paid >= cutoff) {
        events.push({
          date: order.paidAt,
          type: "payout",
          title: `Order paid — $${order.priceAmountUsd}`,
          description: `${order.tier} tier · ${order.agentLot ?? "custom"}`,
        });
      }
    }
  }

  for (const entry of allRevShare) {
    const created = new Date(entry.createdAt);
    if (created >= cutoff) {
      events.push({
        date: entry.createdAt,
        type: "payout",
        title: `Rev-share accrued — $${entry.amountUsd}`,
        description: `Partner code ${entry.referralCode}`,
      });
    }
  }

  events.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const typeLabel: Record<string, string> = {
    agent_added: "Agent",
    drift_event: "Drift",
    payout: "Payout",
    eval_run: "Eval",
  };

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-canvas text-ink">
        <div className="max-w-content mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="lot-label mb-4">LOT 001 · CHANGELOG</div>
          <h1 className="text-[40px] lg:text-[56px] font-bold leading-[1.07] tracking-[-0.016em] mb-3">
            Changelog
          </h1>
          <p className="text-[17px] leading-[1.47] text-graphite mb-12 max-w-[60ch]">
            Last 30 days of agent additions, drift events, eval runs, and payouts.
          </p>

          {events.length === 0 ? (
            <p className="text-ash italic">No events in the last 30 days.</p>
          ) : (
            <ul className="space-y-4">
              {events.map((ev, idx) => (
                <li
                  key={idx}
                  // [STAMPED_AGENTS_WAVE2] hover state retokenized to ink (no azure).
                  className="flex gap-4 items-start bg-canvas rounded-[10px] p-5 border border-silver-mist transition-colors hover:border-ink/35"
                >
                  <span className="inline-block px-2.5 py-0.5 rounded-[6px] text-[11px] font-mono font-medium uppercase tracking-[0.18em] shrink-0 mt-0.5 bg-fog text-graphite border border-silver-mist">
                    {typeLabel[ev.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ash mb-1 font-mono tracking-[0.18em] uppercase">
                      {formatDate(ev.date)}
                    </div>
                    <h3 className="text-[17px] font-semibold leading-[1.47] tracking-[-0.003em]">
                      {ev.title}
                    </h3>
                    <p className="text-[15px] text-slate mt-1 leading-[1.55]">
                      {ev.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
