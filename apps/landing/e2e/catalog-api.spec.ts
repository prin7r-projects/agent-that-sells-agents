import { test, expect } from "@playwright/test";

// Scenario 5 — Eval-log audit (docs/11 §3)
// A prospect clicks "Eval Log" on an agent card, sees the sparkline + table.

test.describe("Eval log audit", () => {
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

  test("GET /api/catalog/agents/lot-999 returns 404", async ({ request }) => {
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
    // Each run should have required fields
    for (const run of body.runs) {
      expect(run.corpus).toBeTruthy();
      expect(run.scoreBps).toBeGreaterThan(0);
      expect(run.evaluator).toBeTruthy();
      expect(run.runDate).toBeTruthy();
    }
  });

  test("eval log modal opens from agent card and shows data", async ({ page, browserName }) => {
    test.skip(browserName === "chromium" && !process.env.CI, "Chromium headless requires libglib-2.0; run in CI or with --ui");
    await page.goto("/");
    await page.locator('a[href="#catalog"]').click();
    await page.waitForSelector("#catalog article");

    // Click "Eval Log" on first agent card
    const evalButton = page.locator("#catalog article button", { hasText: "Eval Log" }).first();
    await evalButton.click();

    // Modal should appear
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toContainText("Public eval log");

    // Should have summary stats
    await expect(modal).toContainText("Runs");
    await expect(modal).toContainText("Baseline");

    // Should have a table
    const tableRows = modal.locator("table tbody tr");
    expect(await tableRows.count()).toBeGreaterThanOrEqual(1);

    // Close the modal
    await modal.locator('button[aria-label="Close"]').click();
    await expect(modal).not.toBeVisible();
  });

  test("eval log for agent with drift (lot-058, yellow) shows data", async ({ page, request, browserName }) => {
    test.skip(browserName === "chromium" && !process.env.CI, "Chromium headless requires libglib-2.0");
    const res = await request.get("/api/catalog/agents/lot-058/evals?since=90d");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.runs.length).toBeGreaterThanOrEqual(1);
    expect(body.agentId).toBe("lot-058");
  });
});
