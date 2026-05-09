// Slack alert webhook — Phase 4 Task 5 (docs/13 §Phase 4)
// Posts to SLACK_WEBHOOK_URL_ALERTS for sig failures, checkout latency, and daily order anomalies.

interface AlertParams {
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  fields?: Record<string, string>;
}

// ── In-memory counters ──────────────────────────────────────────────

const sigFailures: number[] = []; // timestamps (ms)
let sigFailureAlerted = false;

const checkoutLatencies: { ts: number; ms: number }[] = [];
let checkoutLatencyAlerted = false;

const dailyOrders: { date: string; count: number }[] = [];
let dailyOrdersAlerted = false;

// ── Helpers ─────────────────────────────────────────────────────────

function cleanSigFailures(now: number) {
  const cutoff = now - 3_600_000;
  while (sigFailures.length > 0 && sigFailures[0] < cutoff) {
    sigFailures.shift();
  }
}

function cleanCheckoutLatencies(now: number) {
  const cutoff = now - 300_000;
  while (checkoutLatencies.length > 0 && checkoutLatencies[0].ts < cutoff) {
    checkoutLatencies.shift();
  }
}

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

// ── Slack sender ────────────────────────────────────────────────────

export async function sendSlackAlert(params: AlertParams): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL_ALERTS?.trim();
  if (!url) {
    console.warn("[alerts] SLACK_WEBHOOK_URL_ALERTS not set — cannot send alert:", params.title);
    return;
  }

  const color =
    params.severity === "critical" ? "#FF0000"
    : params.severity === "warning" ? "#FFA500"
    : "#36A64F";

  const fieldBlocks = params.fields
    ? Object.entries(params.fields).map(([k, v]) => ({
        type: "mrkdwn" as const,
        text: `*${k}:* ${v}`,
      }))
    : [];

  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: { type: "plain_text", text: `[${params.severity.toUpperCase()}] ${params.title}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: params.body },
    },
  ];

  if (fieldBlocks.length > 0) {
    blocks.push({ type: "section", fields: fieldBlocks });
  }

  const payload = {
    text: `[${params.severity.toUpperCase()}] ${params.title}`,
    attachments: [
      {
        color,
        blocks,
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[alerts] Slack webhook returned ${res.status}: ${await res.text().catch(() => "")}`);
    }
  } catch (e) {
    console.error("[alerts] Failed to send Slack alert:", e);
  }
}

// ── Sig failure counter ─────────────────────────────────────────────

export function incrementSigFailure(): void {
  const now = Date.now();
  cleanSigFailures(now);
  sigFailures.push(now);

  const count = sigFailures.length;
  if (count > 5 && !sigFailureAlerted) {
    sigFailureAlerted = true;
    sendSlackAlert({
      severity: "warning",
      title: "Webhook signature failure threshold exceeded",
      body: `${count} signature failures in the last hour (threshold: >5).`,
      fields: { "Failures (1h)": String(count) },
    });
  } else if (count <= 5 && sigFailureAlerted) {
    sigFailureAlerted = false;
  }
}

// ── Checkout latency tracker ────────────────────────────────────────

export function incrementCheckoutLatency(ms: number): void {
  const now = Date.now();
  cleanCheckoutLatencies(now);
  checkoutLatencies.push({ ts: now, ms });

  if (checkoutLatencies.length < 5) return;

  const p95ms = p95(checkoutLatencies.map((e) => e.ms));

  if (p95ms > 2000 && !checkoutLatencyAlerted) {
    checkoutLatencyAlerted = true;
    sendSlackAlert({
      severity: "warning",
      title: "Checkout latency P95 exceeded threshold",
      body: `P95 checkout latency is ${p95ms}ms (threshold: 2000ms) over the last 5 minutes.`,
      fields: {
        "P95 Latency": `${p95ms}ms`,
        Samples: String(checkoutLatencies.length),
      },
    });
  } else if (p95ms <= 2000 && checkoutLatencyAlerted) {
    checkoutLatencyAlerted = false;
  }
}

// ── Daily order anomaly detector ────────────────────────────────────

export function recordDailyOrder(): void {
  const today = new Date().toISOString().slice(0, 10);

  let existing = dailyOrders.find((d) => d.date === today);
  if (existing) {
    existing.count++;
  } else {
    existing = { date: today, count: 1 };
    dailyOrders.push(existing);
  }

  // Keep rolling 30-day window
  while (dailyOrders.length > 30) {
    dailyOrders.shift();
  }

  // Need at least 7 days of data before anomaly detection makes sense
  if (dailyOrders.length < 7) return;

  const counts = dailyOrders.map((d) => d.count);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, c) => sum + (c - mean) ** 2, 0) / counts.length;
  const stddev = Math.sqrt(variance);
  const threshold = mean - 2 * stddev;
  const todayCount = existing.count;

  if (todayCount < threshold && !dailyOrdersAlerted) {
    dailyOrdersAlerted = true;
    sendSlackAlert({
      severity: "critical",
      title: "Daily orders below 2σ threshold",
      body: `Today's orders (${todayCount}) are below 2σ from the mean.`,
      fields: {
        Today: String(todayCount),
        "Mean (μ)": mean.toFixed(1),
        "StdDev (σ)": stddev.toFixed(1),
        "Threshold (μ−2σ)": threshold.toFixed(1),
      },
    });
  } else if (todayCount >= threshold && dailyOrdersAlerted) {
    dailyOrdersAlerted = false;
  }
}

// ── Test helpers (exposed for vitest) ───────────────────────────────

export function __resetAlerts(): void {
  sigFailures.length = 0;
  sigFailureAlerted = false;
  checkoutLatencies.length = 0;
  checkoutLatencyAlerted = false;
  dailyOrders.length = 0;
  dailyOrdersAlerted = false;
}

export function __getSigFailureCount(): number {
  cleanSigFailures(Date.now());
  return sigFailures.length;
}

export function __getCheckoutLatencies(): { ts: number; ms: number }[] {
  cleanCheckoutLatencies(Date.now());
  return [...checkoutLatencies];
}

export function __getDailyOrders(): { date: string; count: number }[] {
  return [...dailyOrders];
}
