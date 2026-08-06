/**
 * Orchestrates the full post-corrections audit pipeline in order:
 * catalog audit (static) -> simulation grid -> counterfactual branches ->
 * statistical analysis -> timelines -> charts.
 *
 * Usage: npm run audit:game
 * Env vars (all optional, forwarded to the sub-scripts):
 *   AUDIT_SEEDS_PER_COMBO, AUDIT_INCLUDE_CUSTOM, AUDIT_CUSTOM_SEEDS,
 *   AUDIT_BRANCH_CHECKPOINT, AUDIT_BRANCH_SAMPLES_PER_PARTY, AUDIT_COMMIT
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const STEPS = [
  "scripts/audit-post/catalog-audit.ts",
  "scripts/audit-post/simulate.ts",
  "scripts/audit-post/branch-experiment.ts",
  "scripts/audit-post/analyze.ts",
  "scripts/audit-post/timelines.ts",
  "scripts/audit-post/charts.ts",
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
console.log("\nAudit post-corrections terminé. Voir audit-results/ et AUDIT_POST_CORRECTIONS.md.");
