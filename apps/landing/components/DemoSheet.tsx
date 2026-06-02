"use client";

import { useReducer, useEffect, useCallback } from "react";
import { CheckoutButton } from "./CheckoutButton";

// ── Types ──────────────────────────────────────────────────────────────────
interface DemoStep {
  id: string;
  title: string;
  durationMs: number;
  narration: string;
  output: {
    type: "lead-card" | "email-preview" | "score-card" | "summary";
    data: Record<string, unknown>;
  };
}

interface DemoData {
  steps: DemoStep[];
  catalog: {
    agentId: string;
    displayName: string;
    category: string;
    provenance: { trainedBy: string; shipCount: number; costPerAction: number };
    tier: "trial" | "pro" | "enterprise";
    priceUsd: number;
  };
}

interface DemoState {
  phase: "loading" | "error" | "idle" | "playing" | "complete";
  currentStep: number;
  demo: DemoData | null;
  error: string | null;
}

type DemoAction =
  | { type: "LOADED"; demo: DemoData }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "START" }
  | { type: "NEXT_STEP" }
  | { type: "COMPLETE" }
  | { type: "RESET" };

function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "LOADED":
      return { ...state, phase: "idle", demo: action.demo, error: null };
    case "LOAD_ERROR":
      return { ...state, phase: "error", error: action.error };
    case "START":
      return { ...state, phase: "playing", currentStep: 0 };
    case "NEXT_STEP": {
      if (!state.demo) return state;
      const next = state.currentStep + 1;
      if (next >= state.demo.steps.length) {
        return { ...state, phase: "complete" };
      }
      return { ...state, currentStep: next };
    }
    case "COMPLETE":
      return { ...state, phase: "complete" };
    case "RESET":
      return { ...state, phase: "idle", currentStep: 0 };
    default:
      return state;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────
function LeadCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-[20px] bg-fog border border-silver-mist p-5 space-y-2">
      <div className="lot-label">LEAD PROFILE</div>
      <div className="text-[20px] font-semibold">{String(data.name ?? "")}</div>
      <div className="text-[15px] text-graphite">{String(data.title ?? "")}</div>
      <div className="text-[14px] text-slate">{String(data.company ?? "")}</div>
      <div className="text-[13px] font-mono text-graphite mt-2">{String(data.recentTrigger ?? "")}</div>
    </div>
  );
}

function EmailPreview({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-[20px] bg-fog border border-silver-mist p-5 space-y-3">
      <div className="lot-label">DRAFT EMAIL</div>
      <div className="text-[14px] font-semibold text-ink">
        Subject: {String(data.subject ?? "")}
      </div>
      <div className="text-[13px] text-slate leading-relaxed whitespace-pre-wrap font-mono text-[12px] max-h-[200px] overflow-y-auto">
        {String(data.body ?? "")}
      </div>
    </div>
  );
}

function ScoreCard({ data }: { data: Record<string, unknown> }) {
  const scores = (data.scores as Array<{ label: string; value: string }>) ?? [];
  const overall = String(data.overall ?? "");

  return (
    <div className="rounded-[20px] bg-fog border border-silver-mist p-5 space-y-3">
      <div className="lot-label">QUALITY SCORE</div>
      <div className="text-[36px] font-mono font-bold text-ink">{overall}</div>
      <div className="space-y-1.5">
        {scores.map((s) => (
          <div key={s.label} className="flex justify-between text-[13px]">
            <span className="text-graphite">{s.label}</span>
            <span className="font-mono text-ink">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Summary({ data }: { data: Record<string, unknown> }) {
  const actions = (data.actions as string[]) ?? [];
  return (
    <div className="rounded-[20px] bg-fog border border-silver-mist p-5 space-y-3">
      <div className="lot-label">DEMO COMPLETE</div>
      <ul className="space-y-2">
        {actions.map((a, i) => (
          <li key={i} className="text-[14px] text-slate flex gap-2">
            <span className="text-ink shrink-0">✓</span>
            {a}
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderOutput(type: string, data: Record<string, unknown>) {
  switch (type) {
    case "lead-card": return <LeadCard data={data} />;
    case "email-preview": return <EmailPreview data={data} />;
    case "score-card": return <ScoreCard data={data} />;
    case "summary": return <Summary data={data} />;
    default: return null;
  }
}

// ── Progress dots ──────────────────────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        // [STAMPED_AGENTS_WAVE2] progress dots retokenized to ink/obsidian/silver-mist.
        // Micro-accents (≤8px) are reserved for focus rings and ::selection only.
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i < current ? "bg-ink" : i === current ? "bg-obsidian" : "bg-silver-mist"
          }`}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface Props {
  agentId: string;
  label?: string;
  className?: string;
}

export function DemoSheet({ agentId, label = "Demo in your data", className = "" }: Props) {
  const [state, dispatch] = useReducer(demoReducer, {
    phase: "idle",
    currentStep: 0,
    demo: null,
    error: null,
  });

  // Load demo script on mount
  useEffect(() => {
    // Static import of demo JSON
    import(`@/data/demos/${agentId}.json`)
      .then((mod) => dispatch({ type: "LOADED", demo: mod.default ?? mod }))
      .catch(() => dispatch({ type: "LOAD_ERROR", error: `No demo script for ${agentId}` }));
  }, [agentId]);

  // Auto-advance steps
  const autoNext = useCallback(() => {
    if (state.phase !== "playing" || !state.demo) return;
    const step = state.demo.steps[state.currentStep];
    if (!step) return;
    const timer = setTimeout(() => dispatch({ type: "NEXT_STEP" }), step.durationMs);
    return () => clearTimeout(timer);
  }, [state.phase, state.currentStep, state.demo]);

  useEffect(() => {
    const cleanup = autoNext();
    return cleanup;
  }, [autoNext]);

  const currentStep = state.demo?.steps[state.currentStep];
  const lotNum = agentId.replace("lot-", "");

  return (
    <div className={`rounded-[28px] bg-vellum border border-silver-mist p-7 max-sm:rounded-none max-sm:border-0 max-sm:p-5 max-sm:min-h-screen ${className}`}>
      {/* Idle state */}
      {state.phase === "idle" && (
        <div className="text-center py-6 space-y-4">
          <div className="lot-label">LOT {lotNum}</div>
          <div className="text-[20px] font-semibold">{state.demo?.catalog.displayName}</div>
          <p className="text-[15px] text-slate max-w-sm mx-auto leading-relaxed">
            Watch {state.demo?.catalog.displayName} pull a lead, draft an email,
            qualify the fit, and hand it off — all in 10 seconds.
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: "START" })}
            // [STAMPED_AGENTS_WAVE2] primary CTA retokenized to ink (black).
            className="bg-ink text-snow text-[15px] font-medium h-11 inline-flex items-center px-6 rounded-full hover:opacity-88 transition-opacity"
          >
            {label}
          </button>
        </div>
      )}

      {/* Playing state */}
      {state.phase === "playing" && currentStep && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="lot-label">STEP {state.currentStep + 1} OF {state.demo?.steps.length}</div>
            <button
              type="button"
              onClick={() => dispatch({ type: "COMPLETE" })}
              className="text-[12px] font-mono text-graphite hover:text-ink transition-colors"
            >
              Skip to end →
            </button>
          </div>

          <ProgressDots total={state.demo?.steps.length ?? 0} current={state.currentStep} />

          <h3 className="text-[22px] font-semibold tracking-[-0.016em]">{currentStep.title}</h3>

          <p className="text-[15px] text-slate leading-relaxed">{currentStep.narration}</p>

          <div className="animate-fadeIn">
            {renderOutput(currentStep.output.type, currentStep.output.data as Record<string, unknown>)}
          </div>
        </div>
      )}

      {/* Complete state */}
      {state.phase === "complete" && state.demo && (
        <div className="space-y-5">
          <div className="lot-label">DEMO COMPLETE</div>
          <div className="text-[20px] font-semibold">{state.demo.catalog.displayName} is ready for your team.</div>
          <p className="text-[15px] text-slate leading-relaxed">
            {state.demo.catalog.provenance.trainedBy} has been operating {state.demo.catalog.displayName} for{" "}
            {state.demo.catalog.provenance.shipCount} teams. Trial is $99/mo — cancel in the first 14 days for a full refund.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <CheckoutButton
              tierId="trial"
              agentLot={lotNum}
              label="Buy Trial — $99/mo"
              // [STAMPED_AGENTS_WAVE2] CTA retokenized to ink (black).
              className="bg-ink text-snow text-[14px] font-medium h-11 inline-flex items-center px-5 rounded-full hover:opacity-88 transition-opacity"
            />
            <button
              type="button"
              onClick={() => dispatch({ type: "RESET" })}
              className="text-[14px] font-medium h-11 inline-flex items-center px-5 rounded-full border border-silver-mist text-ink hover:bg-fog transition-colors"
            >
              Run again
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {state.phase === "error" && (
        <div className="text-center py-6">
          {/* [STAMPED_AGENTS_WAVE2] error state retokenized to ink (no red). */}
          <div className="text-ink text-[14px] font-mono">{state.error}</div>
          <p className="text-[13px] text-slate mt-2">Demo scripts are available for Lots 042, 047, 051.</p>
        </div>
      )}
    </div>
  );
}
