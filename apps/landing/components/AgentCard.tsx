"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CheckoutButton } from "./CheckoutButton";
import { EvalLogModal } from "./EvalLogModal";

export interface AgentCardProps {
  lot: string;
  name: string;
  role: string;
  blurb: string;
  trainedBy: string;
  deployedSince: string;
  outcomes?: { label: string; value: string }[];
  references?: number;
  lastAudit?: string;
  driftStatus?: string;
  compact?: boolean;
}

const DRIFT_CONFIG: Record<string, { label: string; classes: string }> = {
  // [STAMPED_AGENTS_WAVE2] drift states retokenized to neutral gray (no amber/red).
  // "watch" uses the fog surface; "alert" uses the obsidian surface for the
  // strongest available contrast within the black/white/neutral-gray rule.
  watch: {
    label: "Drift watch — eval variance detected",
    classes: "bg-fog border-silver-mist text-graphite",
  },
  alert: {
    label: "Drift alert — performance below threshold",
    classes: "bg-obsidian/[0.04] border-ink text-ink",
  },
  // Back-compat: legacy keys ("yellow", "red") are mapped to the new neutral
  // tokens so any persisted data carrying the old names still renders cleanly.
  yellow: {
    label: "Drift watch — eval variance detected",
    classes: "bg-fog border-silver-mist text-graphite",
  },
  red: {
    label: "Drift alert — performance below threshold",
    classes: "bg-obsidian/[0.04] border-ink text-ink",
  },
};

export function AgentCard({ agent, compact = false }: { agent: AgentCardProps; compact?: boolean }) {
  const [evalOpen, setEvalOpen] = useState(false);
  const drift = agent.driftStatus && DRIFT_CONFIG[agent.driftStatus];

  return (
    <>
      <article
        className={cn(
          "group rounded-[28px] bg-vellum border border-silver-mist hover:border-graphite transition-colors p-7 flex flex-col gap-5",
          compact && "p-6",
        )}
      >
        {drift && (
          <div className={cn("-mx-7 -mt-7 mb-2 px-7 py-2 text-[12px] font-medium border-b rounded-t-[28px]", drift.classes)}>
            {drift.label}
          </div>
        )}
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
          {(agent.outcomes ?? []).map((o) => (
            <div key={o.label} className="flex flex-col">
              <dt className="text-graphite text-[11px] uppercase tracking-[0.18em]">{o.label}</dt>
              <dd className="font-mono text-[16px] text-ink">{o.value}</dd>
            </div>
          ))}
          <div className="flex justify-between col-span-2 pt-3 mt-1 border-t border-silver-mist">
            <dt className="text-graphite">References</dt>
            <dd className="text-ink">{agent.references ?? 0} named teams</dd>
          </div>
        </dl>
        <footer className="flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={() => setEvalOpen(true)}
            className="text-[13px] font-mono text-graphite hover:text-ink transition-colors px-3 py-1.5 rounded-full border border-silver-mist"
          >
            Eval Log
          </button>
          <CheckoutButton
            tierId="trial"
            agentLot={agent.lot}
            // [STAMPED_AGENTS_WAVE2] primary CTA retokenized to ink (black) per
            // black/white/neutral-gray rule; azure is no longer used for fills.
            className="text-[14px] font-medium bg-ink text-snow hover:opacity-88 transition-opacity px-4 py-2 rounded-full"
            label="Buy Trial"
          />
        </footer>
      </article>

      <EvalLogModal
        agentId={`lot-${agent.lot}`}
        agentName={agent.name}
        open={evalOpen}
        onClose={() => setEvalOpen(false)}
      />
    </>
  );
}
