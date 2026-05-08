// Feature flag service — Phase 6 (docs/13 §6)
// In-memory store. Deterministic 50/50 bucketing by hashing customerId.

export interface FeatureFlag {
  id: string;
  enabled: boolean;
  rolloutPct: number; // 0–100
  description?: string;
  targetTier?: string; // e.g. "pro"
}

// Canonical flags
const flags: Map<string, FeatureFlag> = new Map([
  [
    "outcomePricingToggle",
    {
      id: "outcomePricingToggle",
      enabled: true,
      rolloutPct: 50,
      description: "Show outcome-based pricing toggle to Pro customers",
      targetTier: "pro",
    },
  ],
]);

/** Simple deterministic hash (djb2) of a string into 0–99 */
function hashToBucket(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 100;
}

/** Determine whether a flag is enabled for a given customer.
 *  If customerId is omitted, falls back to disabled. */
export function isFlagEnabled(
  flagId: string,
  customerId?: string,
  customerTier?: string,
): boolean {
  const flag = flags.get(flagId);
  if (!flag || !flag.enabled) return false;

  // Tier gating
  if (flag.targetTier && customerTier !== flag.targetTier) {
    return false;
  }

  // Rollout bucketing
  if (!customerId) return false;
  const bucket = hashToBucket(customerId);
  return bucket < flag.rolloutPct;
}

/** List all flags with their raw config (admin) */
export function listFlags(): FeatureFlag[] {
  return Array.from(flags.values());
}

/** Analytics pipe: record a conversion event for a flag */
const conversions: Array<{
  flagId: string;
  customerId: string;
  event: "exposed" | "converted";
  timestamp: string;
  meta?: Record<string, unknown>;
}> = [];

export function recordFlagEvent(
  flagId: string,
  customerId: string,
  event: "exposed" | "converted",
  meta?: Record<string, unknown>,
) {
  conversions.push({
    flagId,
    customerId,
    event,
    timestamp: new Date().toISOString(),
    meta,
  });
  console.log(
    `[FEATURE_FLAG] flag=${flagId} customer=${customerId} event=${event}`,
    meta ? JSON.stringify(meta) : "",
  );
}

/** Summarise conversion rate for a flag */
export function flagConversionSummary(flagId: string): {
  exposed: number;
  converted: number;
  rate: number | null;
} {
  const relevant = conversions.filter((c) => c.flagId === flagId);
  const exposed = relevant.filter((c) => c.event === "exposed").length;
  const converted = relevant.filter((c) => c.event === "converted").length;
  return {
    exposed,
    converted,
    rate: exposed > 0 ? Math.round((converted / exposed) * 10000) / 10000 : null,
  };
}
