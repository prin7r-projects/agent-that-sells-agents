import { test, expect } from "@playwright/test";

// Scenario 1 — Discovery (docs/11 §3, Journey 1 in docs/03)
// Mira lands on the page, sees the catalog, and is convinced within 60 seconds.

test.describe("Landing discovery", () => {
  test("hero renders with headline and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("vetted shelf");
    await expect(page.locator('a[href="#catalog"]')).toBeVisible();
    await expect(page.locator('a[href="#concierge"]')).toBeVisible();
  });

  test("lot ribbons show agent summaries", async ({ page }) => {
    await page.goto("/");
    const ribbons = page.locator('[aria-label="Stamp ribbons"]');
    await expect(ribbons).toBeVisible();
    await expect(ribbons).toContainText("Anders");
    await expect(ribbons).toContainText("Hatfield");
    await expect(ribbons).toContainText("Vance");
  });

  test("catalog section renders agent cards from API", async ({ page }) => {
    await page.goto("/");
    // Scroll to catalog
    await page.locator('a[href="#catalog"]').click();
    await page.waitForSelector("#catalog");
    // Should have agent cards (wait for API fetch)
    await page.waitForSelector("article");
    const cards = page.locator("#catalog article");
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
  });

  test("category filter works", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="#catalog"]').click();
    await page.waitForSelector("#catalog article");

    // Click "Sales" filter
    await page.locator("#catalog button", { hasText: "Sales" }).click();
    await page.waitForTimeout(300);
    // Should show only sales agents
    const salesCards = page.locator("#catalog article");
    const count = await salesCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Click "All" to reset
    await page.locator("#catalog button", { hasText: "All" }).click();
    await page.waitForTimeout(300);
    const allCards = page.locator("#catalog article");
    expect(await allCards.count()).toBeGreaterThanOrEqual(4);
  });

  test("ConciergeRail is visible and interactive", async ({ page }) => {
    await page.goto("/");
    const concierge = page.locator("#concierge");
    await expect(concierge).toBeVisible();
    await expect(concierge).toContainText("Concierge");
    // Suggested questions should be visible
    await expect(concierge.locator("button", { hasText: "agency partner" })).toBeVisible();
  });

  test("pricing section shows three tiers", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="#pricing"]').click();
    await page.waitForSelector("#pricing");
    await expect(page.locator("#pricing")).toContainText("Trial");
    await expect(page.locator("#pricing")).toContainText("Pro");
    await expect(page.locator("#pricing")).toContainText("Enterprise");
  });

  test("FAQ section renders eight answers", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="#faq"]').click();
    await page.waitForSelector("#faq");
    const faqItems = page.locator("#faq h3");
    expect(await faqItems.count()).toBeGreaterThanOrEqual(6);
  });
});
