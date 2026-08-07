import { defineConfig, devices } from "@playwright/test";

/**
 * Separate config for the gameplay/UX audit (PROMPT_CLAUDE_CODE_AUDIT_GAMEPLAY_FUN.md
 * section 26, 47) — screenshots and manual-inspection notes across viewports,
 * not correctness assertions. Kept out of e2e/ so it never runs as part of
 * `npm run test:e2e` and never affects that suite's pass/fail signal.
 */
export default defineConfig({
  testDir: "./scripts/gameplay-audit/ux",
  fullyParallel: false,
  timeout: 180_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 850 } },
    },
    // WebKit isn't installed in this environment (only Chromium, matching
    // e2e/'s "mobile" project) — use Chromium with device-matched viewports
    // instead of the WebKit-backed iPhone SE / iPad Mini presets.
    {
      name: "mobile-etroit",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
    { name: "mobile-large", use: { ...devices["Pixel 7"] } },
    {
      name: "tablette",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
