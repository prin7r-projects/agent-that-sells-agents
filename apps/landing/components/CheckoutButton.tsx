"use client";

import { useState } from "react";

type Props = {
  tierId: "trial" | "pro" | "enterprise";
  agentLot?: string;
  label: string;
  className?: string;
  upgradeFrom?: "trial";
  referralCode?: string;
};

export function CheckoutButton({ tierId, agentLot, label, className, upgradeFrom, referralCode }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/nowpayments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tierId, agentLot, upgradeFrom, referralCode }),
      });
      const data = (await res.json()) as { ok?: boolean; invoiceUrl?: string; message?: string };
      if (data.ok && data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
        return;
      }
      setError(data.message ?? `Checkout unavailable (HTTP ${res.status}).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        className={className}
      >
        {pending ? "Opening invoice…" : label}
      </button>
      {error ? (
        // [STAMPED_AGENTS_WAVE2] error state retokenized to ink (no red).
        <span role="alert" className="text-[11px] text-ink font-mono max-w-[16rem] text-right border-b border-ink/40">
          {error}
        </span>
      ) : null}
    </span>
  );
}
