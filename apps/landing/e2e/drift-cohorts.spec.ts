import { test, expect } from "@playwright/test";

test.describe("Drift Cohorts Admin API", () => {
  test("GET /api/admin/drift-cohorts returns 401 without auth header", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/drift-cohorts");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
  });

  test("GET /api/admin/drift-cohorts returns 401 with wrong admin key", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/drift-cohorts", {
      headers: { Authorization: "Bearer wrong-key" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
  });

  test("GET /api/admin/drift-cohorts returns valid cohort structure with correct admin key", async ({
    request,
  }) => {
    const adminKey = process.env.ADMIN_API_KEY ?? "";
    if (!adminKey) {
      test.skip(true, "ADMIN_API_KEY not set — skipping authenticated test");
      return;
    }

    const res = await request.get("/api/admin/drift-cohorts", {
      headers: { Authorization: `Bearer ${adminKey}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();

    // Verify response shape per docs/13 Phase 6 spec
    expect(body).toHaveProperty("windowDays", 30);
    expect(body).toHaveProperty("generatedAt");
    expect(body).toHaveProperty("cohorts");
    expect(Array.isArray(body.cohorts)).toBe(true);

    // Verify each cohort entry has required fields
    const statusColors = ["green", "yellow", "red", "unknown"];
    for (const cohort of body.cohorts) {
      expect(cohort).toHaveProperty("driftStatus");
      expect(cohort).toHaveProperty("totalLicenses");
      expect(cohort).toHaveProperty("churned30d");
      expect(cohort).toHaveProperty("churnRate");
      expect(typeof cohort.totalLicenses).toBe("number");
      expect(typeof cohort.churned30d).toBe("number");
      expect(typeof cohort.churnRate).toBe("number");
      expect(cohort.churnRate).toBeGreaterThanOrEqual(0);
      expect(cohort.churnRate).toBeLessThanOrEqual(1);
      expect(cohort.churned30d).toBeLessThanOrEqual(cohort.totalLicenses);
      expect(statusColors).toContain(cohort.driftStatus);
    }

    // Verify all four status colors are present
    const presentColors = body.cohorts.map((c: any) => c.driftStatus);
    for (const color of statusColors) {
      expect(presentColors).toContain(color);
    }
  });
});
