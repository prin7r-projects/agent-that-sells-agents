"use client";

import { useEffect, useState } from "react";
import { AgentCard } from "@/components/AgentCard";

interface CatalogAgent {
  id: string;
  lotNumber: number;
  displayName: string;
  category: string;
  blurb: string;
  provenance: { trainedBy: string; shipCount: number; costPerAction: number };
  deployedSince: string;
  driftStatus: string;
  recentEvalsSummary: { count: number; avgScoreBps: number | null; lastRunDate?: string };
}

export function CatalogGrid() {
  const [agents, setAgents] = useState<CatalogAgent[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/catalog/agents");
        const data = await res.json();
        setAgents(data.agents ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load catalog");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categoryMap: Record<string, string> = {
    sdr: "Sales",
    support: "Support",
    research: "Research",
    ops: "Ops",
  };

  const filtered =
    activeFilter === "All"
      ? agents
      : agents.filter((a) => categoryMap[a.category] === activeFilter);

  const filters = ["All", "Sales", "Support", "Research", "Ops"];

  return (
    <section id="catalog" className="border-b border-silver-mist bg-canvas">
      <div className="max-w-content mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <div className="mb-12">
          <div className="lot-label">LOT 02</div>
          <h2 className="mt-3 text-[64px] lg:text-[80px] font-bold leading-[1.04] tracking-[-0.022em] text-ink">
            CATALOG
          </h2>
          <p className="mt-4 max-w-[48ch] text-[18px] lg:text-[20px] leading-[1.4] text-graphite">
            Six agents on the shelf, each with a price tag. Filter by function —
            Sales, Support, Research, Ops. Each card lists the named operator,
            when the agent was deployed, and the last 30 days of outcomes.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-10">
          <div className="flex gap-2 text-[14px] flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={
                  activeFilter === f
                    ? "px-4 py-2 rounded-full bg-ink text-snow"
                    : "px-4 py-2 rounded-full border border-silver-mist text-ink hover:bg-fog transition-colors"
                }
              >
                {f}
              </button>
            ))}
          </div>
          {/* OwnedFilter — hidden for unauthenticated; Phase 3: conditionally show */}
          <span className="text-[12px] font-mono text-graphite">
            Sign in to see your owned agents
          </span>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-[28px] bg-vellum border border-silver-mist p-7 h-64 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          // [STAMPED_AGENTS_WAVE2] error state retokenized to obsidian/ink
          // (no red). Mirrors the neutral-palette rule from DESIGN.md §4.
          <div className="text-ink text-[15px] font-mono p-6 border border-ink rounded-[20px] bg-fog">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((a) => (
              <AgentCard
                key={a.id}
                agent={{
                  lot: a.id.replace("lot-", ""),
                  name: a.displayName,
                  role: categoryMap[a.category] ?? a.category,
                  blurb: a.blurb,
                  trainedBy: a.provenance.trainedBy,
                  deployedSince: a.deployedSince,
                  references: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
