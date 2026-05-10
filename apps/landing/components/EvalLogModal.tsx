"use client";

import { useEffect, useState } from "react";

interface EvalRun {
  corpus: string;
  scoreBps: number;
  evaluator: string;
  runDate: string;
}

interface EvalData {
  agentId: string;
  runs: EvalRun[];
  baselineBps: number;
  current30dMeanBps: number | null;
}

interface Props {
  agentId: string;
  agentName: string;
  open: boolean;
  onClose: () => void;
}

function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

function scoreColor(bps: number, baseline: number): string {
  if (bps >= baseline + 200) return "#0071E3"; // azure — exceeding baseline
  if (bps >= baseline) return "#34C759"; // green — meeting baseline (status indicator, retained)
  if (bps >= baseline - 300) return "#707070"; // graphite — borderline (neutral-palette rule: orange forbidden)
  return "#B5331A"; // vermilion — falling (DESIGN.md palette token)
}

/** Tiny inline sparkline bar chart */
function Sparkline({ runs, baselineBps }: { runs: EvalRun[]; baselineBps: number }) {
  if (runs.length === 0) return null;
  const maxBps = Math.max(baselineBps + 500, ...runs.map((r) => r.scoreBps));
  const minBps = Math.min(baselineBps - 500, ...runs.map((r) => r.scoreBps));
  const range = maxBps - minBps || 1;

  return (
    <div className="flex items-end gap-[3px] h-16 mt-4">
      {runs.map((r, i) => {
        const h = ((r.scoreBps - minBps) / range) * 100;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-[2px] transition-colors"
            style={{
              height: `${h}%`,
              backgroundColor: scoreColor(r.scoreBps, baselineBps),
              minWidth: 12,
            }}
            title={`${r.runDate}: ${formatBps(r.scoreBps)}`}
          />
        );
      })}
    </div>
  );
}

export function EvalLogModal({ agentId, agentName, open, onClose }: Props) {
  const [data, setData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`/api/catalog/agents/${agentId}/evals?since=0`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => setData(d as EvalData))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load evals"))
      .finally(() => setLoading(false));
  }, [agentId, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Eval log for ${agentName}`}
    >
      <div
        className="bg-snow border border-silver-mist rounded-[28px] p-8 w-[90vw] max-w-[640px] max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="lot-label">{agentId.toUpperCase()}</div>
            <h2 className="text-[28px] font-bold tracking-[-0.018em] mt-1">{agentName}</h2>
            <p className="text-[15px] text-graphite mt-1">Public eval log — all recorded runs</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-silver-mist flex items-center justify-center hover:bg-fog transition-colors text-[18px] text-graphite"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-fog rounded-[16px]" />
            <div className="h-32 bg-fog rounded-[16px]" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-vermilion text-[14px] font-mono p-4 border border-vermilion/30 rounded-[16px]">
            {error}
          </div>
        )}

        {/* Data */}
        {data && !loading && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-fog rounded-[16px] p-4 text-center">
                <div className="text-[12px] font-mono text-graphite uppercase tracking-wider">Runs</div>
                <div className="text-[28px] font-mono font-medium mt-1">{data.runs.length}</div>
              </div>
              <div className="bg-fog rounded-[16px] p-4 text-center">
                <div className="text-[12px] font-mono text-graphite uppercase tracking-wider">30D Mean</div>
                <div className="text-[28px] font-mono font-medium mt-1" style={{ color: data.current30dMeanBps !== null ? scoreColor(data.current30dMeanBps, data.baselineBps) : undefined }}>
                  {data.current30dMeanBps !== null ? formatBps(data.current30dMeanBps) : "—"}
                </div>
              </div>
              <div className="bg-fog rounded-[16px] p-4 text-center">
                <div className="text-[12px] font-mono text-graphite uppercase tracking-wider">Baseline</div>
                <div className="text-[28px] font-mono font-medium mt-1">{formatBps(data.baselineBps)}</div>
              </div>
            </div>

            {/* Sparkline */}
            <Sparkline runs={data.runs} baselineBps={data.baselineBps} />
            <div className="flex justify-between text-[11px] font-mono text-graphite mt-1 mb-6">
              <span>{data.runs[0]?.runDate ?? "—"}</span>
              <span className="text-silver-mist">— baseline {formatBps(data.baselineBps)} —</span>
              <span>{data.runs[data.runs.length - 1]?.runDate ?? "—"}</span>
            </div>

            {/* Table */}
            <div className="border border-silver-mist rounded-[16px] overflow-hidden">
              <table className="w-full text-[13px] font-mono">
                <thead className="bg-fog">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-graphite">Date</th>
                    <th className="text-left px-4 py-2 font-medium text-graphite">Corpus</th>
                    <th className="text-right px-4 py-2 font-medium text-graphite">Score</th>
                    <th className="text-left px-4 py-2 font-medium text-graphite">Evaluator</th>
                  </tr>
                </thead>
                <tbody>
                  {data.runs.map((r, i) => (
                    <tr key={i} className="border-t border-silver-mist/50 hover:bg-fog/50 transition-colors">
                      <td className="px-4 py-2.5 text-graphite">{r.runDate}</td>
                      <td className="px-4 py-2.5">{r.corpus}</td>
                      <td className="px-4 py-2.5 text-right" style={{ color: scoreColor(r.scoreBps, data.baselineBps) }}>
                        {formatBps(r.scoreBps)}
                      </td>
                      <td className="px-4 py-2.5 text-graphite">{r.evaluator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-graphite mt-4 text-right">
              {data.runs.length} runs · baseline {formatBps(data.baselineBps)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
