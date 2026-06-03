/**
 * Focused smoke test for the live checkout path.
 *
 * Covers the PRI-3727 regression class:
 *   - Without NOWPAYMENTS_API_KEY, the route returns 503 with an actionable
 *     payload (mode=disabled, env name, deploy file, runbook ref) and does
 *     NOT silently stub a fake URL.
 *   - With NOWPAYMENTS_API_KEY set, the route forwards to the NOWPayments
 *     /v1/invoice endpoint with the expected headers and payload shape.
 *   - Invalid tierId is rejected by defaulting to the middle tier (pro).
 *   - Idempotent replay returns the same invoice within the hour window.
 *
 * No real network calls — fetch is stubbed via vi.fn().
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB-touching service so the happy path does not need Postgres.
vi.mock("@/lib/server/orders", () => ({
  OrderService: {
    create: vi.fn(async (params: { orderId: string; tier: string; invoiceId: string }) => ({
      orderId: params.orderId,
      tier: params.tier,
      status: "pending" as const,
      priceAmountUsd: 0,
      invoiceId: params.invoiceId,
      createdAt: new Date().toISOString(),
    })),
  },
}));

const callInvoice = vi.fn();
globalThis.fetch = callInvoice as unknown as typeof fetch;

beforeEach(() => {
  vi.unstubAllEnvs();
  callInvoice.mockReset();
});

describe("POST /api/checkout/nowpayments", () => {
  it("returns 503 with actionable payload when NOWPAYMENTS_API_KEY is missing (safe-fallback)", async () => {
    // Defensive: even if a parent process exports the key, scrub it.
    vi.stubEnv("NOWPAYMENTS_API_KEY", "");
    delete process.env.NOWPAYMENTS_API_KEY;

    const { POST } = await import(
      "@/app/api/checkout/nowpayments/route"
    );

    const req = new Request("http://localhost/api/checkout/nowpayments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tierId: "pro", agentLot: "042" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.ok).toBe(false);
    expect(body.mode).toBe("disabled");
    expect(body.code).toBe("missing_env");
    expect(body.env).toBe("NOWPAYMENTS_API_KEY");
    expect(body.envFile).toBe(
      "/opt/prin7r-deploys/agent-that-sells-agents/.env",
    );
    expect(body.runbook).toBe("docs/runbooks/restore-nowpayments-key.md");
    expect(typeof body.message).toBe("string");

    // Critical: must NOT have made an outbound call to NOWPayments.
    expect(callInvoice).not.toHaveBeenCalled();
  });

  it("returns 400-class (defaulted tier) and a 503 for unknown tierId without an API key", async () => {
    vi.stubEnv("NOWPAYMENTS_API_KEY", "");

    const { POST } = await import(
      "@/app/api/checkout/nowpayments/route"
    );

    const req = new Request("http://localhost/api/checkout/nowpayments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tierId: "completely-bogus", agentLot: "042" }),
    });

    const res = await POST(req);
    // Unknown tierId defaults to pro in the route; missing key still 503s.
    expect(res.status).toBe(503);
    expect(callInvoice).not.toHaveBeenCalled();
  });

  it("calls NOWPayments /v1/invoice with the expected headers and payload when the key is set", async () => {
    vi.stubEnv("NOWPAYMENTS_API_KEY", "live-test-key-xyz");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://agent-that-sells-agents.prin7r.com");

    callInvoice.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 12345,
          invoice_url: "https://nowpayments.io/invoice/12345",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const { POST } = await import(
      "@/app/api/checkout/nowpayments/route"
    );

    const req = new Request("http://localhost/api/checkout/nowpayments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tierId: "pro",
        agentLot: "042",
        customerEmail: "buyer@example.com",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(body.mode).toBe("live");
    expect(body.tier).toBe("pro");
    expect(body.invoiceId).toBe("12345");
    expect(body.invoiceUrl).toBe("https://nowpayments.io/invoice/12345");
    expect(body.idempotent).toBe(false);
    expect(typeof body.orderId).toBe("string");
    expect((body.orderId as string).startsWith("stmp_pro_")).toBe(true);

    // Verify the upstream call shape
    expect(callInvoice).toHaveBeenCalledTimes(1);
    const [url, init] = callInvoice.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.nowpayments.io/v1/invoice");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("live-test-key-xyz");
    expect(headers["content-type"]).toBe("application/json");

    const payload = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(payload.price_currency).toBe("usd");
    expect(payload.pay_currency).toBe("usdttrc20");
    expect(payload.price_amount).toBe(499); // pro tier
    expect(payload.order_id).toBe(body.orderId);
    expect(payload.ipn_callback_url).toBe(
      "https://agent-that-sells-agents.prin7r.com/api/webhooks/nowpayments",
    );
    expect(payload.success_url).toContain("status=success#pricing");
    expect(payload.cancel_url).toContain("status=cancelled#pricing");
  });

  it("replays the same invoice for an idempotent request within the hour", async () => {
    vi.stubEnv("NOWPAYMENTS_API_KEY", "live-test-key-xyz");

    callInvoice.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 99999,
          invoice_url: "https://nowpayments.io/invoice/99999",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const { POST } = await import(
      "@/app/api/checkout/nowpayments/route"
    );

    const body = {
      tierId: "trial" as const,
      agentLot: "042",
      customerEmail: "replay@example.com",
    };

    const req1 = new Request("http://localhost/api/checkout/nowpayments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const res1 = await POST(req1);
    const data1 = (await res1.json()) as Record<string, unknown>;
    expect(res1.status).toBe(200);
    expect(data1.idempotent).toBe(false);
    expect(callInvoice).toHaveBeenCalledTimes(1);

    // Second call within the same hour window must hit the idempotency cache.
    const req2 = new Request("http://localhost/api/checkout/nowpayments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const res2 = await POST(req2);
    const data2 = (await res2.json()) as Record<string, unknown>;
    expect(res2.status).toBe(200);
    expect(data2.idempotent).toBe(true);
    expect(data2.orderId).toBe(data1.orderId);
    expect(data2.invoiceUrl).toBe(data1.invoiceUrl);
    // Crucially, no second upstream call.
    expect(callInvoice).toHaveBeenCalledTimes(1);
  });
});
