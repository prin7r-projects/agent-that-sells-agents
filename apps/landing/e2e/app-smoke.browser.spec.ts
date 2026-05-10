import { test, expect } from "@playwright/test";

test.describe("App dashboard smoke", () => {
  test("visits /app, renders heading, takes screenshot", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // The /app route currently re-exports the landing page.
    // Assert the main headline is visible.
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("vetted shelf");

    await page.screenshot({
      path: "test-results/app-smoke.png",
      fullPage: true,
    });
  });
});
