import { test, expect } from "@playwright/test";
import {
  isFlagEnabled,
  recordFlagEvent,
  flagConversionSummary,
} from "@/lib/server/feature-flags";

const FLAG_ID = "outcomePricingToggle";

test.describe("Feature flag bucketing — outcomePricingToggle", () => {
  test("control bucket: tier mismatch returns false", () => {
    expect(isFlagEnabled(FLAG_ID, "any-customer", "free")).toBe(false);
    expect(isFlagEnabled(FLAG_ID, "any-customer", undefined)).toBe(false);
  });

  test("missing customerId returns false even when tier matches", () => {
    expect(isFlagEnabled(FLAG_ID, undefined, "pro")).toBe(false);
  });

  test("unknown flag returns false", () => {
    expect(isFlagEnabled("doesNotExist", "cust-1", "pro")).toBe(false);
  });

  test("deterministic bucketing — same customerId always lands in the same bucket", () => {
    const ids = ["cust_alpha", "cust_beta", "cust_gamma", "cust_delta", "cust_epsilon"];
    for (const id of ids) {
      const first = isFlagEnabled(FLAG_ID, id, "pro");
      for (let i = 0; i < 5; i++) {
        expect(isFlagEnabled(FLAG_ID, id, "pro")).toBe(first);
      }
    }
  });

  test("specific control + treatment ids yield opposite buckets", () => {
    let controlId: string | null = null;
    let treatmentId: string | null = null;
    for (let i = 0; i < 1000; i++) {
      const id = `cust_${i}`;
      const enabled = isFlagEnabled(FLAG_ID, id, "pro");
      if (enabled && !treatmentId) treatmentId = id;
      if (!enabled && !controlId) controlId = id;
      if (controlId && treatmentId) break;
    }

    expect(controlId).not.toBeNull();
    expect(treatmentId).not.toBeNull();
    expect(isFlagEnabled(FLAG_ID, controlId!, "pro")).toBe(false);
    expect(isFlagEnabled(FLAG_ID, treatmentId!, "pro")).toBe(true);
  });

  test("~50% rollout — 200 random ids land within ±10pp of 50% enabled", () => {
    const sample = 200;
    let enabled = 0;
    for (let i = 0; i < sample; i++) {
      const id = `random_${i}_${Math.random().toString(36).slice(2)}`;
      if (isFlagEnabled(FLAG_ID, id, "pro")) enabled++;
    }
    const pct = (enabled / sample) * 100;
    expect(pct).toBeGreaterThanOrEqual(40);
    expect(pct).toBeLessThanOrEqual(60);
  });

  test("recordFlagEvent updates the conversion summary deterministically", () => {
    const before = flagConversionSummary(FLAG_ID);
    const id = `cust_evt_${Date.now()}`;
    recordFlagEvent(FLAG_ID, id, "exposed", { test: true });
    recordFlagEvent(FLAG_ID, id, "converted", { test: true });
    const after = flagConversionSummary(FLAG_ID);
    expect(after.exposed).toBe(before.exposed + 1);
    expect(after.converted).toBe(before.converted + 1);
    expect(after.rate).not.toBeNull();
  });
});
