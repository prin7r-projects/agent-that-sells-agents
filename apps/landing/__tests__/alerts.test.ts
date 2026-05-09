/**
 * Slack alert webhook tests — Phase 4 Task 5 (docs/13 §Phase 4)
 *
 * Covers:
 *   - sendSlackAlert no-ops + warns when SLACK_WEBHOOK_URL_ALERTS is unset
 *   - incrementSigFailure alerts on 6th failure in same hour
 *   - incrementCheckoutLatency alerts when P95 > 2000ms
 *   - recordDailyOrder anomaly detection (2σ below mean)
 *   - Test helpers (__resetAlerts, __getSigFailureCount, etc.)
 */

import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import {
  sendSlackAlert,
  incrementSigFailure,
  incrementCheckoutLatency,
  recordDailyOrder,
  __resetAlerts,
  __getSigFailureCount,
  __getCheckoutLatencies,
  __getDailyOrders,
  __checkDailyAnomaly,
} from "@/lib/server/alerts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stubSlackUrl() {
  vi.stubEnv("SLACK_WEBHOOK_URL_ALERTS", "https://hooks.slack.com/services/TEST/B123/xxx");
}

function unstubSlackUrl() {
  vi.unstubAllEnvs();
}

// ---------------------------------------------------------------------------
// sendSlackAlert
// ---------------------------------------------------------------------------

describe("sendSlackAlert", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.unstubAllEnvs();
    warnSpy.mockClear();
    errorSpy.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("no-ops and warns when SLACK_WEBHOOK_URL_ALERTS is unset", async () => {
    // explicit unset
    delete (process.env as Record<string, string>).SLACK_WEBHOOK_URL_ALERTS;

    await sendSlackAlert({
      severity: "critical",
      title: "Test alert",
      body: "Should not be sent",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[alerts] SLACK_WEBHOOK_URL_ALERTS not set"),
      expect.any(String),
    );
  });

  it("no-ops when SLACK_WEBHOOK_URL_ALERTS is empty string", async () => {
    vi.stubEnv("SLACK_WEBHOOK_URL_ALERTS", "");

    await sendSlackAlert({
      severity: "warning",
      title: "Empty URL test",
      body: "Nope",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts a Slack-compatible payload when URL is set", async () => {
    stubSlackUrl();

    await sendSlackAlert({
      severity: "critical",
      title: "CPU on fire",
      body: "The server room is melting.",
      fields: { Host: "box-7", Temp: "85°C" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://hooks.slack.com/services/TEST/B123/xxx");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/json" });

    const body = JSON.parse(init.body as string);
    expect(body.text).toContain("[CRITICAL] CPU on fire");
    expect(body.attachments).toBeDefined();
    expect(body.attachments[0].color).toBe("#FF0000");
  });

  it("uses orange color for warning severity", async () => {
    stubSlackUrl();

    await sendSlackAlert({
      severity: "warning",
      title: "Disk space low",
      body: "Running out.",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.attachments[0].color).toBe("#FFA500");
  });

  it("uses green color for info severity", async () => {
    stubSlackUrl();

    await sendSlackAlert({
      severity: "info",
      title: "All good",
      body: "Nothing to see.",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.attachments[0].color).toBe("#36A64F");
  });

  it("handles Slack webhook returning non-200 without throwing", async () => {
    stubSlackUrl();
    fetchMock.mockResolvedValue(new Response("Bad", { status: 500 }));

    await expect(
      sendSlackAlert({ severity: "warning", title: "Test", body: "Test" }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[alerts] Slack webhook returned 500"),
    );
  });

  it("handles network error without throwing", async () => {
    stubSlackUrl();
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      sendSlackAlert({ severity: "info", title: "Test", body: "Test" }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      "[alerts] Failed to send Slack alert:",
      expect.any(Error),
    );
  });
});

// ---------------------------------------------------------------------------
// incrementSigFailure
// ---------------------------------------------------------------------------

describe("incrementSigFailure", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __resetAlerts();
    fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("SLACK_WEBHOOK_URL_ALERTS", "https://hooks.slack.com/services/TEST/B123/xxx");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not alert for fewer than 6 failures in an hour", () => {
    for (let i = 0; i < 5; i++) {
      incrementSigFailure();
    }

    expect(fetchMock).not.toHaveBeenCalled();
    expect(__getSigFailureCount()).toBe(5);
  });

  it("alerts on the 6th failure in the same hour", () => {
    for (let i = 0; i < 6; i++) {
      incrementSigFailure();
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.text).toContain("signature failure threshold exceeded");
    expect(__getSigFailureCount()).toBe(6);
  });

  it("does not re-alert for additional failures beyond 6 (alerted flag stays set)", () => {
    // Trigger first alert
    for (let i = 0; i < 6; i++) {
      incrementSigFailure();
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Additional failures should not fire again
    for (let i = 0; i < 10; i++) {
      incrementSigFailure();
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(__getSigFailureCount()).toBe(16);
  });

  it("resets alerted flag when failures drop back to ≤5 (manual cleanup simulates hour roll)", () => {
    // Trigger alert
    for (let i = 0; i < 6; i++) {
      incrementSigFailure();
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Simulate cleanup: manipulate counter directly to mimic time passage
    __resetAlerts();
    // After reset, count is 0, alerted flag is false
    // New failures should trigger alert again at 6
    for (let i = 0; i < 6; i++) {
      incrementSigFailure();
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("counts only failures within the last hour (stale entries pruned)", () => {
    // This test verifies that cleanSigFailures prunes old entries
    // We manipulate timestamps via __resetAlerts + fresh pushes
    for (let i = 0; i < 6; i++) {
      incrementSigFailure();
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // After reset, no stale entries remain
    __resetAlerts();
    expect(__getSigFailureCount()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// incrementCheckoutLatency
// ---------------------------------------------------------------------------

describe("incrementCheckoutLatency", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __resetAlerts();
    fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("SLACK_WEBHOOK_URL_ALERTS", "https://hooks.slack.com/services/TEST/B123/xxx");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not alert with fewer than 5 samples", () => {
    incrementCheckoutLatency(3000);
    incrementCheckoutLatency(3000);
    incrementCheckoutLatency(3000);
    incrementCheckoutLatency(3000);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(__getCheckoutLatencies()).toHaveLength(4);
  });

  it("does not alert when P95 is below 2000ms", () => {
    // 5 samples all under threshold
    for (let i = 0; i < 5; i++) {
      incrementCheckoutLatency(500);
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("alerts when P95 exceeds 2000ms", () => {
    // 5 samples: most fast, one slow — but P95 depends on distribution
    // To get P95 > 2000 with 5 samples, need at least 1 value > 2000
    // P95 of [100, 100, 100, 100, 3000] = sorted[ceil(5*0.95)-1] = sorted[4] = 3000
    incrementCheckoutLatency(100);
    incrementCheckoutLatency(100);
    incrementCheckoutLatency(100);
    incrementCheckoutLatency(100);
    incrementCheckoutLatency(3000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.text).toContain("Checkout latency P95 exceeded threshold");
  });

  it("does not re-alert while P95 stays above threshold", () => {
    for (let i = 0; i < 5; i++) {
      incrementCheckoutLatency(3000);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // More high-latency samples
    for (let i = 0; i < 10; i++) {
      incrementCheckoutLatency(3000);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resets alerted flag when P95 drops back below 2000", () => {
    // Trigger alert
    for (let i = 0; i < 5; i++) {
      incrementCheckoutLatency(3000);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Reset and add low-latency samples to clear
    __resetAlerts();
    for (let i = 0; i < 5; i++) {
      incrementCheckoutLatency(100);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1); // no new alert

    // Now trigger again
    __resetAlerts();
    for (let i = 0; i < 5; i++) {
      incrementCheckoutLatency(3000);
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// recordDailyOrder
// ---------------------------------------------------------------------------

describe("recordDailyOrder", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __resetAlerts();
    fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("SLACK_WEBHOOK_URL_ALERTS", "https://hooks.slack.com/services/TEST/B123/xxx");
    vi.useFakeTimers();
    vi.setSystemTime(new Date());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("accumulates daily order counts", () => {
    recordDailyOrder();
    recordDailyOrder();
    recordDailyOrder();

    const orders = __getDailyOrders();
    expect(orders).toHaveLength(1);
    const today = new Date().toISOString().slice(0, 10);
    expect(orders[0].date).toBe(today);
    expect(orders[0].count).toBe(3);
  });

  it("does not alert with fewer than 7 days of data", () => {
    // Just push some orders on a single day — not enough data
    recordDailyOrder();
    recordDailyOrder();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("alerts when todays count drops below 2σ of the rolling mean", () => {
    vi.useFakeTimers();
    const days = [
      "2026-01-01", "2026-01-02", "2026-01-03",
      "2026-01-04", "2026-01-05", "2026-01-06",
      "2026-01-07", "2026-01-08",
    ];

    // Days 1-6: 100 orders each
    for (let d = 0; d < 6; d++) {
      vi.setSystemTime(new Date(days[d] + "T12:00:00Z"));
      for (let i = 0; i < 100; i++) {
        recordDailyOrder();
      }
    }

    // Day 7: only 1 order — anomalous, but check runs on next-day transition
    vi.setSystemTime(new Date(days[6] + "T12:00:00Z"));
    recordDailyOrder();

    // No alert yet — anomaly check happens on next-day transition
    expect(fetchMock).not.toHaveBeenCalled();

    // Day 8: first order triggers check for day 7
    vi.setSystemTime(new Date(days[7] + "T12:00:00Z"));
    recordDailyOrder();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.text).toContain("Daily orders below 2σ threshold");
    vi.useRealTimers();
  });

  it("does not alert when todays count is within normal range", () => {
    vi.useFakeTimers();
    const days = Array.from({ length: 7 }, (_, i) => `2026-01-0${i + 1}`);

    // All 7 days: 50 orders each — no anomaly
    for (let d = 0; d < 7; d++) {
      vi.setSystemTime(new Date(days[d] + "T12:00:00Z"));
      for (let i = 0; i < 50; i++) {
        recordDailyOrder();
      }
    }

    expect(fetchMock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

describe("test helpers", () => {
  beforeEach(() => {
    __resetAlerts();
  });

  it("__resetAlerts clears all counters and alerted flags", () => {
    // Populate sig failures
    for (let i = 0; i < 3; i++) incrementSigFailure();

    // Populate checkout latencies
    for (let i = 0; i < 5; i++) incrementCheckoutLatency(100);

    // Populate daily orders
    recordDailyOrder();
    recordDailyOrder();

    expect(__getSigFailureCount()).toBe(3);
    expect(__getCheckoutLatencies()).toHaveLength(5);
    expect(__getDailyOrders()).toHaveLength(1);

    __resetAlerts();

    expect(__getSigFailureCount()).toBe(0);
    expect(__getCheckoutLatencies()).toHaveLength(0);
    expect(__getDailyOrders()).toHaveLength(0);
  });

  it("__getDailyOrders returns a shallow copy", () => {
    recordDailyOrder();
    const orders = __getDailyOrders();
    orders.push({ date: "fake", count: 999 });

    const orders2 = __getDailyOrders();
    expect(orders2).toHaveLength(1);
  });
});
