import { loadAgents, getEvalsForAgent } from "@/lib/catalog-data";
import { OrderService, RevShareService } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

interface ChangelogEvent {
  date: string;
  type: "agent_added" | "drift_event" | "payout" | "eval_run";
  title: string;
  description: string;
  agentId?: string;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ChangelogPage() {
  const agents = loadAgents();
  const orders = OrderService.listAll();
  const revShare = (RevShareService as { getByCode?: (c: string) => { createdAt: string; amountUsd: number; referralCode: string }[] }).getByCode?.("AGENCY-NYC-014") ?? [];

  const events: ChangelogEvent[] = [];

  // Agent additions (deployedSince within last 30 days)
  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() - 30);
  for (const agent of agents) {
    const deployed = new Date(agent.deployedSince);
    if (deployed >= cutoff30) {
      events.push({
        date: agent.deployedSince,
        type: "agent_added",
        title: `Agent ${agent.displayName} added to catalog`,
        description: `Lot ${agent.lotNumber} · ${agent.category.toUpperCase()} · trained by ${agent.provenance.trainedBy}`,
        agentId: agent.id,
      });
    }
  }

  // Drift events (eval runs within last 30 days)
  for (const agent of agents) {
    const evals = getEvalsForAgent(agent.id, 30);
    for (const ev of evals) {
      events.push({
        date: ev.runDate,
        type: "eval_run",
        title: `${agent.displayName} evaluated — ${ev.scoreBps / 100}%`,
        description: `Corpus: ${ev.corpus} · Evaluator: ${ev.evaluator}`,
        agentId: agent.id,
      });
    }
    if (agent.driftStatus !== "green") {
      events.push({
        date: agent.lastAudit,
        type: "drift_event",
        title: `${agent.displayName} drift status: ${agent.driftStatus}`,
        description: `Last audit ${formatDate(agent.lastAudit)}. Score trends available in eval log.`,
        agentId: agent.id,
      });
    }
  }

  // Paid orders (payouts) within last 30 days
  for (const order of orders) {
    if (order.status === "paid" && order.paidAt) {
      const paid = new Date(order.paidAt);
      if (paid >= cutoff30) {
        events.push({
          date: order.paidAt,
          type: "payout",
          title: `Order paid — $${order.priceAmountUsd}`,
          description: `${order.tier} tier · ${order.agentLot ?? "custom"}`,
        });
      }
    }
  }

  // Rev-share payouts
  for (const entry of revShare) {
    const created = new Date(entry.createdAt);
    if (created >= cutoff30) {
      events.push({
        date: entry.createdAt,
        type: "payout",
        title: `Rev-share accrued — $${entry.amountUsd}`,
        description: `Partner code ${entry.referralCode}`,
      });
    }
  }

  // Sort descending by date
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const typeBadge: Record<string, string> = {
    agent_added: "bg-emerald-100 text-emerald-800",
    drift_event: "bg-amber-100 text-amber-800",
    payout: "bg-sky-100 text-sky-800",
    eval_run: "bg-violet-100 text-violet-800",
  };

  const typeLabel: Record<string, string> = {
    agent_added: "Agent",
    drift_event: "Drift",
    payout: "Payout",
    eval_run: "Eval",
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Changelog</h1>
        <p className="text-stone-500 mb-10">
          Last 30 days of agent additions, drift events, and payouts.
        </p>

        {events.length === 0 ? (
          <p className="text-stone-400 italic">No events in the last 30 days.</p>
        ) : (
          <ul className="space-y-6">
            {events.map((ev, idx) => (
              <li
                key={idx}
                className="flex gap-4 items-start bg-white rounded-xl p-5 shadow-sm border border-stone-100"
              >
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 mt-0.5 ${typeBadge[ev.type]}`}
                >
                  {typeLabel[ev.type]}
                </span>
                <div className="flex-1">
                  <div className="text-xs text-stone-400 mb-1">{formatDate(ev.date)}</div>
                  <h3 className="text-lg font-semibold leading-snug">{ev.title}</h3>
                  <p className="text-stone-500 text-sm mt-1">{ev.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition"
          >
            ← Back to catalog
          </a>
        </div>
      </div>
    </main>
  );
}
