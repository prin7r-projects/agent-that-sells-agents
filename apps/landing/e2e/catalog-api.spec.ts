import { test, expect } from "@playwright/test";

// Scenario 5 — Eval-log audit (docs/11 §3)
// API-level tests for catalog endpoints. All use `request` fixture (no browser).

test.describe("Catalog API", () => {
  test("GET /api/catalog/agents returns 6 agents", async ({ request }) => {
    const res = await request.get("/api/catalog/agents");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.agents).toHaveLength(6);
    expect(body.total).toBe(6);
    expect(body.categories).toContain("sdr");
    expect(body.categories).toContain("support");
    expect(body.categories).toContain("research");
  });

  test("GET /api/catalog/agents/lot-042 returns agent detail", async ({ request }) => {
    const res = await request.get("/api/catalog/agents/lot-042");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("lot-042");
    expect(body.displayName).toBe("Anders");
    expect(body.lotNumber).toBe(42);
    expect(body.provenance.trainedBy).toBe("Mira Rao");
    expect(body.provenance.shipCount).toBe(18);
  });

  test("GET /api/catalog/agents/lot-999 returns 404 with agent_not_found", async ({ request }) => {
    const res = await request.get("/api/catalog/agents/lot-999");
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("agent_not_found");
  });

  test("GET /api/catalog/agents/lot-042/evals returns eval runs", async ({ request }) => {
    const res = await request.get("/api/catalog/agents/lot-042/evals?since=90d");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.agentId).toBe("lot-042");
    expect(body.runs.length).toBeGreaterThanOrEqual(1);
    expect(body.baselineBps).toBeGreaterThan(0);
    for (const run of body.runs) {
      expect(run.corpus).toBeTruthy();
      expect(run.scoreBps).toBeGreaterThan(0);
      expect(run.evaluator).toBeTruthy();
      expect(run.runDate).toBeTruthy();
    }
  });

  test("eval data exists for all 6 agents", async ({ request }) => {
    const agentsRes = await request.get("/api/catalog/agents");
    const { agents } = await agentsRes.json();

    for (const agent of agents) {
      const evalsRes = await request.get(`/api/catalog/agents/${agent.id}/evals?since=0`);
      expect(evalsRes.status()).toBe(200);
      const evalsBody = await evalsRes.json();
      expect(evalsBody.agentId).toBe(agent.id);
      // Each agent should have at least 1 eval run
      expect(evalsBody.runs.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("checkout API returns valid response status", async ({ request }) => {
    const res = await request.post("/api/checkout/nowpayments", {
      data: { tierId: "trial", agentLot: "042" },
    });
    // 200 = API key set, 503 = API key missing (dev env)
    expect([200, 503]).toContain(res.status());
  });

  test("checkout API with upgradeFrom + referralCode", async ({ request }) => {
    const res = await request.post("/api/checkout/nowpayments", {
      data: {
        tierId: "pro",
        agentLot: "042",
        upgradeFrom: "trial",
        referralCode: "AGENCY-NYC-014",
      },
    });
    expect([200, 503]).toContain(res.status());
  });

  test("webhook endpoint returns 200 (logs, no DB persistence yet)", async ({ request }) => {
    const res = await request.post("/api/webhooks/nowpayments", {
      data: {
        order_id: "test-order-123",
        payment_status: "finished",
        pay_amount: 99,
        pay_currency: "USDT",
      },
    });
    expect(res.status()).toBe(200);
  });
});
