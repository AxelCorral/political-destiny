/**
 * Orchestrates the full fun/replayability audit pipeline in order: main
 * corpus -> A/B experiments -> analysis -> charts -> timeline selection.
 *
 * Usage: npm run audit:fun
 * Env vars (optional): FUN_SEEDS_PER_COMBO (default 20), FUN_CUSTOM_SEEDS
 * (default 6), FUN_AB_SEEDS (default 8).
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const STEPS = [
  "scripts/fun-audit/simulate.ts",
  "scripts/fun-audit/ab-experiment.ts",
  "scripts/fun-audit/analyze.ts",
  "scripts/fun-audit/charts.ts",
  "scripts/fun-audit/select-timelines.ts",
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
console.log("\nAudit fun terminé. Voir audit-results/fun-audit/ et AUDIT_FUN_REJOUABILITE.md.");
