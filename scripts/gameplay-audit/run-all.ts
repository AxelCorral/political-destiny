/**
 * Orchestrates the full gameplay audit pipeline in order: corpus generation
 * -> quantitative analysis -> timeline selection -> charts.
 *
 * Usage: npm run audit:gameplay
 * Env vars (optional): GAMEPLAY_SEEDS_PER_COMBO (default 4), AUDIT_COMMIT
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const STEPS = [
  "scripts/gameplay-audit/generate-corpus.ts",
  "scripts/gameplay-audit/analyze.ts",
  "scripts/gameplay-audit/select-timelines.ts",
  "scripts/gameplay-audit/charts.ts",
];

const TSX_CLI = resolve(ROOT, "node_modules/tsx/dist/cli.mjs");

function run(script: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    console.log(`\n=== ${script} ===`);
    const child = spawn(process.execPath, [TSX_CLI, resolve(ROOT, script)], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${script} a échoué (code ${code}).`));
    });
  });
}

for (const step of STEPS) {
  await run(step);
}
console.log("\nAudit gameplay terminé. Voir audit-results/gameplay/ et GAMEPLAY_AUDIT.md.");
