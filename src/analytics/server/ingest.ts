import type { SupabaseClient } from "@supabase/supabase-js";

import type { AnalyticsEventEnvelope } from "../events";

export interface IngestResult {
  accepted: number;
  runsTouched: number;
  decisionsTouched: number;
}

interface AnalyticsRunRow {
  run_id: string;
  anonymous_user_id: string;
  session_id: string;
  mode: string | null;
  party_id: string | null;
  method_id: string | null;
  candidate_profile_id: string | null;
  seed: string | null;
  started_at: string;
  last_event_at: string;
  completed_at: string | null;
  resumed_count: number;
  decisions_count: number;
  qualified: boolean | null;
  won: boolean | null;
  final_score: number | null;
  ending_id: string | null;
  first_round_player_rank: number | null;
  second_round_player_rank: number | null;
  app_version: string;
  engine_version: string;
  content_version: string;
  analytics_schema_version: string;
  build_sha: string;
  experiment_id: string | null;
  variant_id: string | null;
}

function isoMax(a: string | null | undefined, b: string): string {
  if (!a) return b;
  return new Date(b).getTime() > new Date(a).getTime() ? b : a;
}

/**
 * Folds every event addressed to one run_id into a single patch, so a run
 * touched by several events in the same batch (the common case: a decision
 * plus a race snapshot, say) costs one read + one upsert, not one per event.
 */
function reduceRunPatch(
  existing: AnalyticsRunRow | undefined,
  runId: string,
  events: AnalyticsEventEnvelope[],
): AnalyticsRunRow {
  const row: AnalyticsRunRow = existing ?? {
    run_id: runId,
    anonymous_user_id: events[0]!.anonymousUserId,
    session_id: events[0]!.sessionId,
    mode: null,
    party_id: null,
    method_id: null,
    candidate_profile_id: null,
    seed: null,
    started_at: events[0]!.occurredAt,
    last_event_at: events[0]!.occurredAt,
    completed_at: null,
    resumed_count: 0,
    decisions_count: 0,
    qualified: null,
    won: null,
    final_score: null,
    ending_id: null,
    first_round_player_rank: null,
    second_round_player_rank: null,
    app_version: events[0]!.versions.appVersion,
    engine_version: events[0]!.versions.engineVersion,
    content_version: events[0]!.versions.contentVersion,
    analytics_schema_version: events[0]!.versions.analyticsSchemaVersion,
    build_sha: events[0]!.versions.buildSha,
    experiment_id: events[0]!.experimentId ?? null,
    variant_id: events[0]!.variantId ?? null,
  };

  for (const event of events) {
    row.anonymous_user_id = event.anonymousUserId;
    row.session_id = event.sessionId;
    row.app_version = event.versions.appVersion;
    row.engine_version = event.versions.engineVersion;
    row.content_version = event.versions.contentVersion;
    row.analytics_schema_version = event.versions.analyticsSchemaVersion;
    row.build_sha = event.versions.buildSha;
    row.experiment_id = event.experimentId ?? row.experiment_id;
    row.variant_id = event.variantId ?? row.variant_id;
    row.last_event_at = isoMax(row.last_event_at, event.occurredAt);

    switch (event.eventType) {
      case "run_started": {
        const payload = event.payload as {
          mode: string;
          partyId: string;
          methodId?: string;
          candidateProfileId?: string;
          seed: string;
        };
        row.mode = payload.mode;
        row.party_id = payload.partyId;
        row.method_id = payload.methodId ?? null;
        row.candidate_profile_id = payload.candidateProfileId ?? null;
        row.seed = payload.seed;
        row.started_at = event.occurredAt;
        break;
      }
      case "run_resumed": {
        row.resumed_count += 1;
        break;
      }
      case "first_round_result": {
        const payload = event.payload as { playerRank: number; qualified: boolean };
        row.first_round_player_rank = payload.playerRank;
        row.qualified = payload.qualified;
        break;
      }
      case "second_round_result": {
        const payload = event.payload as { playerRank: number; won: boolean };
        row.second_round_player_rank = payload.playerRank;
        break;
      }
      case "run_completed": {
        const payload = event.payload as {
          score: number;
          won: boolean;
          qualified: boolean;
          endingId: string;
          decisionsCount: number;
        };
        row.completed_at = event.occurredAt;
        row.final_score = payload.score;
        row.won = payload.won;
        row.qualified = payload.qualified;
        row.ending_id = payload.endingId;
        break;
      }
      default:
        break;
    }
  }
  return row;
}

function toDecisionRow(event: AnalyticsEventEnvelope) {
  const payload = event.payload as {
    decisionIndex: number;
    phase: string;
    eventId: string;
    eventCategory: string;
    choiceId: string;
    choiceTag?: string;
    choiceStrategy?: string;
    outcomeId: string;
    internalRoll: number;
  };
  return {
    run_id: event.runId!,
    decision_index: payload.decisionIndex,
    occurred_at: event.occurredAt,
    phase: payload.phase,
    event_id: payload.eventId,
    event_category: payload.eventCategory,
    choice_id: payload.choiceId,
    choice_tag: payload.choiceTag ?? null,
    choice_strategy: payload.choiceStrategy ?? null,
    outcome_id: payload.outcomeId,
    internal_roll: payload.internalRoll,
    app_version: event.versions.appVersion,
    engine_version: event.versions.engineVersion,
    content_version: event.versions.contentVersion,
  };
}

/**
 * Ingests a validated batch. Idempotent: safe to receive the same
 * event_uuid twice (client retries after a network timeout are expected).
 * Never throws for data reasons — a Postgres-level failure propagates to
 * the caller, which is expected to respond 5xx without ever letting that
 * reach the player (see src/app/api/analytics/events/route.ts).
 */
export async function ingestEvents(
  supabase: SupabaseClient,
  events: AnalyticsEventEnvelope[],
): Promise<IngestResult> {
  if (events.length === 0) return { accepted: 0, runsTouched: 0, decisionsTouched: 0 };

  const sorted = [...events].sort((a, b) => a.clientSequence - b.clientSequence);

  const { error: rawInsertError } = await supabase.from("analytics_events").upsert(
    sorted.map((event) => ({
      event_uuid: event.eventUuid,
      event_type: event.eventType,
      anonymous_user_id: event.anonymousUserId,
      session_id: event.sessionId,
      run_id: event.runId ?? null,
      client_sequence: event.clientSequence,
      occurred_at: event.occurredAt,
      app_version: event.versions.appVersion,
      engine_version: event.versions.engineVersion,
      content_version: event.versions.contentVersion,
      analytics_schema_version: event.versions.analyticsSchemaVersion,
      build_sha: event.versions.buildSha,
      experiment_id: event.experimentId ?? null,
      variant_id: event.variantId ?? null,
      payload: event.payload,
    })),
    { onConflict: "event_uuid", ignoreDuplicates: true },
  );
  if (rawInsertError) throw rawInsertError;

  const decisionEvents = sorted.filter(
    (event): event is AnalyticsEventEnvelope & { runId: string } =>
      event.eventType === "decision_resolved" && Boolean(event.runId),
  );
  let decisionsTouched = 0;
  if (decisionEvents.length > 0) {
    const { error: decisionError, count } = await supabase
      .from("analytics_decisions")
      .upsert(decisionEvents.map(toDecisionRow), {
        onConflict: "run_id,decision_index",
        ignoreDuplicates: true,
        count: "exact",
      });
    if (decisionError) throw decisionError;
    decisionsTouched = count ?? decisionEvents.length;
  }

  const runScopedByRunId = new Map<string, AnalyticsEventEnvelope[]>();
  for (const event of sorted) {
    if (!event.runId) continue;
    const list = runScopedByRunId.get(event.runId) ?? [];
    list.push(event);
    runScopedByRunId.set(event.runId, list);
  }

  let runsTouched = 0;
  for (const [runId, runEvents] of runScopedByRunId) {
    const { data: existing, error: fetchError } = await supabase
      .from("analytics_runs")
      .select("*")
      .eq("run_id", runId)
      .maybeSingle<AnalyticsRunRow>();
    if (fetchError) throw fetchError;

    const patch = reduceRunPatch(existing ?? undefined, runId, runEvents);

    const { count: decisionCount, error: countError } = await supabase
      .from("analytics_decisions")
      .select("run_id", { count: "exact", head: true })
      .eq("run_id", runId);
    if (countError) throw countError;
    patch.decisions_count = decisionCount ?? patch.decisions_count;

    const { error: upsertError } = await supabase
      .from("analytics_runs")
      .upsert(patch, { onConflict: "run_id" });
    if (upsertError) throw upsertError;
    runsTouched += 1;
  }

  return { accepted: sorted.length, runsTouched, decisionsTouched };
}
