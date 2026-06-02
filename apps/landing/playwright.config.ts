import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3456";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: [
          "pnpm build",
          "rm -rf .next/standalone/.next/static .next/standalone/public",
          "cp -R .next/static .next/standalone/.next/static",
          "cp -R public .next/standalone/public",
          "HOSTNAME=127.0.0.1 PORT=3456 node .next/standalone/server.js",
        ].join(" && "),
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
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
