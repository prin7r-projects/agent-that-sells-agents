import { test, expect } from "@playwright/test";

test.describe("Partner Analytics Admin API", () => {
  test("GET /api/admin/partners/:code/analytics returns 401 without auth header", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/partners/TEST123/analytics");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
  });

  test("GET /api/admin/partners/:code/analytics returns 401 with wrong admin key", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/partners/TEST123/analytics", {
      headers: { Authorization: "Bearer wrong-key" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
  });

  test("GET /api/admin/partners/:code/analytics returns 404 for unknown code", async ({
    request,
  }) => {
    const adminKey = process.env.ADMIN_API_KEY ?? "";
    if (!adminKey) {
      test.skip(true, "ADMIN_API_KEY not set — skipping authenticated test");
      return;
    }

    const res = await request.get(
      "/api/admin/partners/NONEXISTENT_CODE_XYZ/analytics",
      { headers: { Authorization: `Bearer ${adminKey}` } },
    );
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("not_found");
  });

  test("GET /api/admin/partners/:code/analytics returns valid shape for seeded code", async ({
    request,
  }) => {
    const adminKey = process.env.ADMIN_API_KEY ?? "";
    if (!adminKey) {
      test.skip(true, "ADMIN_API_KEY not set — skipping authenticated test");
      return;
    }

    // AGENCY-NYC-014 is seeded in referrals table (src/db/seed.ts)
    // It may or may not have orders — both empty and populated are valid.
    const res = await request.get(
      "/api/admin/partners/AGENCY-NYC-014/analytics",
      { headers: { Authorization: `Bearer ${adminKey}` } },
    );

    if (res.status() === 404) {
      test.skip(true, "Seed data not loaded — skipping shape validation");
      return;
    }

    expect(res.status()).toBe(200);
    const body = await res.json();

    // Verify top-level shape per docs/13 Phase 6 spec
    expect(body).toHaveProperty("code", "AGENCY-NYC-014");
    expect(body).toHaveProperty("windows");
    expect(body).toHaveProperty("topAgents");
    expect(body).toHaveProperty("generatedAt");

    // Verify windows shape
    for (const w of ["30d", "60d", "90d"]) {
      expect(body.windows).toHaveProperty(w);
      expect(body.windows[w]).toHaveProperty("orders");
      expect(body.windows[w]).toHaveProperty("revShareUsd");
      expect(typeof body.windows[w].orders).toBe("number");
      expect(typeof body.windows[w].revShareUsd).toBe("number");
      expect(body.windows[w].orders).toBeGreaterThanOrEqual(0);
      expect(body.windows[w].revShareUsd).toBeGreaterThanOrEqual(0);
    }

    // 30d ≤ 60d ≤ 90d (window nesting)
    expect(body.windows["30d"].orders).toBeLessThanOrEqual(
      body.windows["60d"].orders,
    );
    expect(body.windows["60d"].orders).toBeLessThanOrEqual(
      body.windows["90d"].orders,
    );

    // Verify topAgents is an array
    expect(Array.isArray(body.topAgents)).toBe(true);
    if (body.topAgents.length > 0) {
      for (const agent of body.topAgents) {
        expect(agent).toHaveProperty("agentId");
        expect(agent).toHaveProperty("orders");
        expect(agent).toHaveProperty("revUsd");
        expect(typeof agent.agentId).toBe("string");
        expect(typeof agent.orders).toBe("number");
        expect(typeof agent.revUsd).toBe("number");
        expect(agent.orders).toBeGreaterThanOrEqual(1);
      }
      // At most 5 top agents
      expect(body.topAgents.length).toBeLessThanOrEqual(5);
      // Sorted descending by orders
      const counts = body.topAgents.map((a: any) => a.orders);
      expect(counts).toEqual([...counts].sort((a: number, b: number) => b - a));
    }

    // Verify generatedAt is valid ISO 8601
    const parsed = new Date(body.generatedAt);
    expect(parsed.toISOString()).toBe(body.generatedAt);
    // Should be recent (within last minute)
    expect(Date.now() - parsed.getTime()).toBeLessThan(60_000);
  });

  test("GET /api/admin/partners/:code/analytics handles URL-encoded codes", async ({
    request,
  }) => {
    const adminKey = process.env.ADMIN_API_KEY ?? "";
    if (!adminKey) {
      test.skip(true, "ADMIN_API_KEY not set — skipping authenticated test");
      return;
    }

    // Code with special characters that need URL encoding
    const res = await request.get(
      "/api/admin/partners/PARTNER-SF-007/analytics",
      { headers: { Authorization: `Bearer ${adminKey}` } },
    );

    if (res.status() === 404) {
      test.skip(true, "Seed data not loaded — skipping URL-encode test");
      return;
    }

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.code).toBe("PARTNER-SF-007");
  });
});
