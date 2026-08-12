import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 120_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Test-only fixture values for the /admin/analytics E2E suite
      // (e2e/admin-analytics-auth.spec.ts) — not a real credential, never
      // used outside this local/CI test server.
      ANALYTICS_ADMIN_PASSWORD: "e2e-test-password-only",
      ANALYTICS_ADMIN_SESSION_SECRET: "e2e-test-session-secret-only-not-a-real-secret",
      // Analytics defaults to "off" outside production (src/analytics/config.ts);
      // the telemetry E2E suite (e2e/analytics-telemetry.spec.ts) needs the
      // consent UI and track() actually active to exercise the real flow.
      NEXT_PUBLIC_ANALYTICS_MODE: "opt-in",
    },
  },
});
