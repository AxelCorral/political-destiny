// Smoke test against a REAL Supabase project — never run automatically, only
// via `npm run analytics:verify:remote` by a human who has already
// completed docs/analytics/REMOTE_ENABLEMENT_CHECKLIST.md. Creates a run
// tagged `analytics-smoke-*`, exercises the full event catalog, verifies
// the raw log / derived tables / views, checks idempotency by re-sending
// the same event_uuid, then deletes only the rows it created — never any
// other data. Prints no secrets.
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import type { AnalyticsEventEnvelope } from "../src/analytics/events";
import { ingestEvents } from "../src/analytics/server/ingest";

const SMOKE_RUN_PREFIX = "analytics-smoke-";

const versions = {
  appVersion: "0.1.0",
  engineVersion: "1",
  saveSchemaVersion: "2",
  contentVersion: "2",
  analyticsSchemaVersion: "1",
  buildSha: "verify-remote",
};

function fail(message: string): never {
  console.error(`[analytics:verify:remote] FAIL — ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function ok(message: string): void {
  console.log(`[analytics:verify:remote] OK — ${message}`);
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    console.error(
      "[analytics:verify:remote] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. " +
        "Complete docs/analytics/REMOTE_ENABLEMENT_CHECKLIST.md first.",
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("[analytics:verify:remote] connecting (URL/key not printed)…");

  // --- 1. Schema presence -----------------------------------------------
  const expectedTables = [
    "analytics_events",
    "analytics_runs",
    "analytics_decisions",
    "analytics_ingestion_batches",
  ];
  for (const table of expectedTables) {
    const { error } = await supabase
      .from(table)
      .select("*", { head: true, count: "exact" })
      .limit(1);
    if (error) fail(`table "${table}" is not reachable: ${error.message}`);
    ok(`table "${table}" reachable`);
  }

  const expectedViews = [
    "analytics_run_status",
    "party_performance",
    "decision_health",
    "event_choice_distribution",
    "content_exposure",
    "analytics_data_quality",
  ];
  for (const view of expectedViews) {
    const { error } = await supabase
      .from(view)
      .select("*", { head: true, count: "exact" })
      .limit(1);
    if (error) fail(`view "${view}" is not reachable: ${error.message}`);
    ok(`view "${view}" reachable`);
  }

  const expectedFunctions: [string, Record<string, unknown>][] = [
    ["fn_overview_summary", {}],
    ["fn_party_performance", {}],
    ["fn_runoff_matchups", {}],
    ["fn_event_choice_distribution", {}],
    ["fn_decision_health", {}],
    ["fn_content_exposure", {}],
    ["fn_dashboard_usage", {}],
    ["fn_ingestion_health", {}],
    ["fn_game_error_summary", {}],
  ];
  for (const [fnName, args] of expectedFunctions) {
    const { error } = await supabase.rpc(fnName, args);
    if (error) fail(`function "${fnName}" call failed: ${error.message}`);
    ok(`function "${fnName}" callable`);
  }

  // --- 2. Full-catalog smoke run ------------------------------------------
  const runId = `${SMOKE_RUN_PREFIX}${randomUUID()}`;
  const anonymousUserId = randomUUID();
  const sessionId = randomUUID();
  const now = () => new Date().toISOString();
  let sequence = 0;
  const envelope = (
    eventType: AnalyticsEventEnvelope["eventType"],
    payload: Record<string, unknown>,
  ): AnalyticsEventEnvelope => {
    sequence += 1;
    return {
      eventUuid: randomUUID(),
      eventType,
      anonymousUserId,
      sessionId,
      runId,
      clientSequence: sequence,
      occurredAt: now(),
      payload,
      versions,
    };
  };

  const smokeEvents: AnalyticsEventEnvelope[] = [
    envelope("run_started", { mode: "existing_party", partyId: "lfi", seed: "smoke-seed" }),
    envelope("decision_viewed", {
      decisionIndex: 0,
      phase: "campaign",
      eventId: "smoke-event",
      eventCategory: "campaign",
      numberOfAvailableChoices: 2,
      flags: { rare: false, chain: false, decisive: false, risky: false },
    }),
    envelope("choice_selected", {
      decisionIndex: 0,
      eventId: "smoke-event",
      choiceId: "smoke-choice",
    }),
    envelope("decision_resolved", {
      decisionIndex: 0,
      phase: "campaign",
      eventId: "smoke-event",
      eventCategory: "campaign",
      choiceId: "smoke-choice",
      outcomeId: "smoke-outcome",
      internalRoll: 0.5,
      playerPollBefore: 10,
      playerPollAfter: 11,
      popularityBefore: 20,
      popularityAfter: 21,
      momentumBefore: 0,
      momentumAfter: 0.5,
    }),
    envelope("first_round_result", { score: 22, playerRank: 1, qualified: true, turnout: 0.7 }),
    envelope("run_completed", {
      score: 60,
      won: false,
      qualified: true,
      endingId: "smoke-ending",
      progressionNormalized: 0.1,
      decisionsCount: 1,
    }),
  ];

  const firstIngest = await ingestEvents(supabase, smokeEvents);
  if (firstIngest.accepted !== smokeEvents.length) {
    fail(`expected ${smokeEvents.length} events accepted, got ${firstIngest.accepted}`);
  }
  ok(`ingested ${firstIngest.accepted} smoke events for run ${runId}`);

  // --- 3. Verify raw log ---------------------------------------------------
  const { data: rawEvents, error: rawError } = await supabase
    .from("analytics_events")
    .select("event_uuid")
    .eq("run_id", runId);
  if (rawError) fail(`could not read back raw events: ${rawError.message}`);
  if ((rawEvents?.length ?? 0) !== smokeEvents.length) {
    fail(`expected ${smokeEvents.length} raw events, found ${rawEvents?.length ?? 0}`);
  }
  ok("raw analytics_events rows verified");

  // --- 4. Verify derived run ------------------------------------------------
  const { data: runRow, error: runError } = await supabase
    .from("analytics_runs")
    .select("run_id, party_id, qualified, final_score, decisions_count")
    .eq("run_id", runId)
    .maybeSingle();
  if (runError) fail(`could not read back analytics_runs: ${runError.message}`);
  if (!runRow || runRow.party_id !== "lfi" || runRow.decisions_count !== 1) {
    fail(`analytics_runs row missing or incorrect: ${JSON.stringify(runRow)}`);
  }
  ok("derived analytics_runs row verified");

  // --- 5. Verify derived decision -------------------------------------------
  const { data: decisionRow, error: decisionError } = await supabase
    .from("analytics_decisions")
    .select("viewed_at, selected_at, resolved_at, outcome_id")
    .eq("run_id", runId)
    .eq("decision_index", 0)
    .maybeSingle();
  if (decisionError) fail(`could not read back analytics_decisions: ${decisionError.message}`);
  if (!decisionRow?.viewed_at || !decisionRow.selected_at || !decisionRow.resolved_at) {
    fail(
      `analytics_decisions row missing viewed/selected/resolved: ${JSON.stringify(decisionRow)}`,
    );
  }
  ok("derived analytics_decisions row verified (viewed/selected/resolved all present)");

  // --- 6. Idempotency: re-send the exact same batch -------------------------
  const secondIngest = await ingestEvents(supabase, smokeEvents);
  const { data: rawEventsAfterRetry } = await supabase
    .from("analytics_events")
    .select("event_uuid")
    .eq("run_id", runId);
  if ((rawEventsAfterRetry?.length ?? 0) !== smokeEvents.length) {
    fail(
      `idempotency check failed: expected ${smokeEvents.length} raw events after retry, ` +
        `found ${rawEventsAfterRetry?.length ?? 0}`,
    );
  }
  ok(`idempotent re-ingestion verified (${secondIngest.accepted} events, 0 new rows created)`);

  // --- 7. Clean up — strictly this smoke run only ---------------------------
  const { error: cleanupDecisionsError } = await supabase
    .from("analytics_decisions")
    .delete()
    .eq("run_id", runId);
  if (cleanupDecisionsError) fail(`cleanup (decisions) failed: ${cleanupDecisionsError.message}`);
  const { error: cleanupEventsError } = await supabase
    .from("analytics_events")
    .delete()
    .eq("run_id", runId);
  if (cleanupEventsError) fail(`cleanup (events) failed: ${cleanupEventsError.message}`);
  const { error: cleanupRunError } = await supabase
    .from("analytics_runs")
    .delete()
    .eq("run_id", runId);
  if (cleanupRunError) fail(`cleanup (run) failed: ${cleanupRunError.message}`);
  ok(`cleaned up smoke run ${runId} — no other data touched`);

  console.log("[analytics:verify:remote] ALL CHECKS PASSED.");
}

void main().catch((error) => {
  if (!process.exitCode) process.exitCode = 1;
  console.error(
    "[analytics:verify:remote] unexpected failure:",
    error instanceof Error ? error.message : error,
  );
});
