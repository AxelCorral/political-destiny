// Non-regression check for the RLS/grants gap found and fixed in
// supabase/migrations/0007_analytics_access_hardening.sql (see
// docs/analytics/REMOTE_SCHEMA_VERIFICATION.md and
// docs/analytics/DATA_QUALITY.md for the full incident writeup).
//
// The public schema of this Supabase project is dedicated entirely to
// analytics (5 tables, 11 views, 15 functions today — verified in Phase 3;
// nothing else lives there). This script queries pg_catalog /
// information_schema directly over a Postgres connection (via the official
// `supabase db query` CLI, same workflow used to apply migrations — no ad
// hoc `pg` client) and fails if ANY object in public violates one of the
// four rules that made analytics_settings + all 11 views exploitable:
//   1. every table must have row level security enabled
//   2. every view must set security_invoker = true
//   3. no table/view may grant anything to anon/authenticated
//   4. no function may grant EXECUTE to PUBLIC/anon/authenticated
//
// Run manually via `npm run analytics:verify:security` against a real
// Supabase project — never runs automatically, prints no secrets (only the
// DB URL's presence/absence, never its value).
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SUPABASE_BIN = fileURLToPath(
  new URL(`../node_modules/.bin/supabase${process.platform === "win32" ? ".cmd" : ""}`, import.meta.url),
);

const SECURITY_QUERY = `
with rls_violations as (
  select 'rls_disabled' as check_type, c.relname as object_name,
         'table has row level security disabled' as detail
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false
),
invoker_violations as (
  select 'security_invoker_missing' as check_type, c.relname as object_name,
         'view does not set security_invoker = true' as detail
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'v'
    and not exists (
      select 1 from unnest(coalesce(c.reloptions, '{}')) opt
      where opt = 'security_invoker=true'
    )
),
grant_violations as (
  select 'table_grant_exposed' as check_type, table_name as object_name,
         grantee || ' has ' || privilege_type || ' on this table/view' as detail
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee in ('anon', 'authenticated')
),
execute_violations as (
  select 'function_execute_exposed' as check_type, routine_name as object_name,
         grantee || ' has EXECUTE on this function' as detail
  from information_schema.routine_privileges
  where routine_schema = 'public' and grantee in ('PUBLIC', 'anon', 'authenticated')
)
select * from rls_violations
union all select * from invoker_violations
union all select * from grant_violations
union all select * from execute_violations
order by check_type, object_name;
`.trim();

function fail(message: string): never {
  console.error(`[analytics:verify:security] FAIL — ${message}`);
  process.exit(1);
}

function main(): void {
  const dbUrl = process.env.SUPABASE_DB_URL?.trim();
  if (!dbUrl) {
    fail(
      "SUPABASE_DB_URL is not set. This check requires a direct Postgres connection string " +
        "(see docs/analytics/REMOTE_ENABLEMENT_CHECKLIST.md) — it inspects pg_catalog directly " +
        "and cannot run over the PostgREST/anon-key surface it is verifying.",
    );
  }

  console.log("[analytics:verify:security] connecting (DB URL not printed)…");
  const tmpDir = mkdtempSync(join(tmpdir(), "analytics-verify-security-"));
  const queryFile = join(tmpDir, "check.sql");
  writeFileSync(queryFile, SECURITY_QUERY, "utf8");

  let stdout: string;
  let stderr: string;
  let status: number | null;
  try {
    const result = spawnSync(
      process.platform === "win32" ? `"${SUPABASE_BIN}"` : SUPABASE_BIN,
      ["db", "query", "--db-url", dbUrl!, "--output-format", "json", "-f", queryFile],
      { encoding: "utf8", shell: process.platform === "win32" },
    );
    stdout = result.stdout;
    stderr = result.stderr;
    status = result.status;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }

  if (status !== 0) {
    fail(`supabase db query exited with code ${status}: ${stderr || stdout}`);
  }

  let parsed: { rows?: Array<{ check_type: string; object_name: string; detail: string }> };
  try {
    parsed = JSON.parse(stdout);
  } catch {
    fail(`could not parse CLI output as JSON: ${stdout}`);
  }

  const violations = parsed.rows ?? [];
  if (violations.length > 0) {
    console.error(
      `[analytics:verify:security] FAIL — ${violations.length} public-schema object(s) ` +
        "violate the analytics access-hardening rules from migration 0007:",
    );
    for (const v of violations) {
      console.error(`  - [${v.check_type}] ${v.object_name}: ${v.detail}`);
    }
    console.error(
      "\nFix: add the missing `enable row level security` / `security_invoker = true` to the " +
        "object's migration, and/or add a `revoke ... from anon, authenticated` — see " +
        "supabase/migrations/0007_analytics_access_hardening.sql for the pattern.",
    );
    process.exit(1);
  }

  console.log(
    "[analytics:verify:security] OK — no public-schema object grants anon/authenticated " +
      "access, all tables have RLS enabled, all views set security_invoker = true.",
  );
}

main();
