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
  projects: [
    {
      name: "default",
      testMatch: /^(?!.*\.browser\.)/,
    },
    {
      name: "browser",
      testMatch: /\.browser\.spec\.ts$/,
      use: { browserName: "chromium" },
    },
  ],
});
