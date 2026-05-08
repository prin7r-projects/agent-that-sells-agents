import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3456",
  },
  // Default: only run API-level tests (no browser needed)
  // Browser tests are in *.browser.spec.ts — run with: npx playwright test --project=browser
  projects: [
    {
      name: "default",
      testMatch: /^(?!.*\.browser\.)/,  // Exclude .browser.spec.ts files
    },
  ],
});
