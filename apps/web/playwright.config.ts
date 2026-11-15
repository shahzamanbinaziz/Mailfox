import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against an already running app (CI starts the standalone server; locally run
 * `docker compose up` or `pnpm dev`). Set E2E_BASE_URL to point elsewhere and
 * PW_CHROMIUM_PATH to use an installed Chrome instead of Playwright's bundled browser.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PW_CHROMIUM_PATH && {
          launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH },
        }),
      },
    },
  ],
});
