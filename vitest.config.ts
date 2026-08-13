import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    exclude: [
      "e2e/**",
      "scripts/gameplay-audit/ux/**",
      "node_modules/**",
      ".next/**",
      "playwright-report/**",
      "test-results/**",
      // Editorial/LinkedIn carousel artifacts, each with their own
      // node_modules — not part of this project's application code.
      // Without this, Vitest discovers internal test files shipped inside
      // their nested zod dependency (datetime.test.ts, file.test.ts) that
      // import packages (recheck, @web-std/file) this repo never installs,
      // producing 4 permanently-failing 0-test suites that have nothing to
      // do with "Vers l'Élysée" itself (docs/analytics/PHASE2_AUDIT.md).
      "linkedin/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
