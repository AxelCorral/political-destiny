import type { SupabaseClient } from "@supabase/supabase-js";

import type { AnalyticsEventEnvelope } from "../events";

export interface IngestResult {
  accepted: number;
  duplicates: number;
  runsTouched: number;
  decisionsTouched: number;
}

function isoMin(a: string, b: string): string {
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

function isoMax(a: string, b: string): string {
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

interface RunDelta {
  runId: string;
  anonymousUserId: string;
  sessionId: string;
  mode: string | null;
  partyId: string | null;
  methodId: string | null;
  candidateProfileId: string | null;
  seed: string | null;
  startedAt: string;
  lastEventAt: string;
  completedAt: string | null;
  resumedCountDelta: number;
  qualified: boolean | null;
  won: boolean | null;
  finalScore: number | null;
  endingId: string | null;
  firstRoundPlayerRank: number | null;
  secondRoundPlayerRank: number | null;
  firstRoundPlayerScore: number | null;
  secondRoundPlayerScore: number | null;
  runoffOpponentPartyId: string | null;
  firstRoundTurnout: number | null;
  secondRoundTurnout: number | null;
  appVersion: string;
  engineVersion: string;
  saveSchemaVersion: string;
  contentVersion: string;
  analyticsSchemaVersion: string;
  buildSha: string;
  experimentId: string | null;
  variantId: string | null;
}

/**
 * Builds one delta per run_id touched by this batch. Deliberately does NOT
 * read the existing DB row first — merge-on-conflict rules (set-once
 * fields never clobbered, started_at = earliest, last_event_at = latest)
 * are expressed directly in fn_upsert_analytics_run
 * (supabase/migrations/0006_analytics_ingestion_observability.sql), so the
 * whole merge is a single atomic statement instead of the Phase 1
 * select-then-upsert race (documented in docs/analytics/
 * ANALYTICS_IMPLEMENTATION_REPORT.md §H).
 */
function buildRunDelta(runId: string, events: AnalyticsEventEnvelope[]): RunDelta {
  const first = events[0]!;
  const delta: RunDelta = {
    runId,
    anonymousUserId: first.anonymousUserId,
    sessionId: first.sessionId,
    mode: null,
    partyId: null,
    methodId: null,
    candidateProfileId: null,
    seed: null,
    startedAt: first.occurredAt,
    lastEventAt: first.occurredAt,
    completedAt: null,
    resumedCountDelta: 0,
    qualified: null,
    won: null,
    finalScore: null,
    endingId: null,
    firstRoundPlayerRank: null,
    secondRoundPlayerRank: null,
    firstRoundPlayerScore: null,
    secondRoundPlayerScore: null,
    runoffOpponentPartyId: null,
    firstRoundTurnout: null,
    secondRoundTurnout: null,
    appVersion: first.versions.appVersion,
    engineVersion: first.versions.engineVersion,
    saveSchemaVersion: first.versions.saveSchemaVersion,
    contentVersion: first.versions.contentVersion,
    analyticsSchemaVersion: first.versions.analyticsSchemaVersion,
    buildSha: first.versions.buildSha,
    experimentId: first.experimentId ?? null,
    variantId: first.variantId ?? null,
  };

  for (const event of events) {
    delta.anonymousUserId = event.anonymousUserId;
    delta.sessionId = event.sessionId;
    delta.appVersion = event.versions.appVersion;
    delta.engineVersion = event.versions.engineVersion;
    delta.saveSchemaVersion = event.versions.saveSchemaVersion;
    delta.contentVersion = event.versions.contentVersion;
    delta.analyticsSchemaVersion = event.versions.analyticsSchemaVersion;
    delta.buildSha = event.versions.buildSha;
    delta.experimentId = event.experimentId ?? delta.experimentId;
    delta.variantId = event.variantId ?? delta.variantId;
    delta.startedAt = isoMin(delta.startedAt, event.occurredAt);
    delta.lastEventAt = isoMax(delta.lastEventAt, event.occurredAt);

    switch (event.eventType) {
      case "run_started": {
        const payload = event.payload as {
          mode: string;
          partyId: string;
          methodId?: string;
          candidateProfileId?: string;
          seed: string;
        };
        delta.mode = payload.mode;
        delta.partyId = payload.partyId;
        delta.methodId = payload.methodId ?? null;
        delta.candidateProfileId = payload.candidateProfileId ?? null;
        delta.seed = payload.seed;
        delta.startedAt = isoMin(delta.startedAt, event.occurredAt);
        break;
      }
      case "run_resumed": {
        delta.resumedCountDelta += 1;
        break;
      }
      case "first_round_result": {
        const payload = event.payload as { score: number; playerRank: number; qualified: boolean };
        delta.firstRoundPlayerRank = payload.playerRank;
        delta.firstRoundPlayerScore = payload.score;
        delta.qualified = payload.qualified;
        break;
      }
      case "second_round_result": {
        const payload = event.payload as {
          score: number;
          playerRank: number;
          won: boolean;
          opponentPartyId: string;
        };
        delta.secondRoundPlayerRank = payload.playerRank;
        delta.secondRoundPlayerScore = payload.score;
        delta.runoffOpponentPartyId = payload.opponentPartyId;
        break;
      }
      case "run_completed": {
        const payload = event.payload as {
          score: number;
          won: boolean;
          qualified: boolean;
          endingId: string;
        };
        delta.completedAt = event.occurredAt;
        delta.finalScore = payload.score;
        delta.won = payload.won;
        delta.qualified = payload.qualified;
        delta.endingId = payload.endingId;
        break;
      }
      default:
        break;
    }

    // Turnout travels on the same first/second_round_result events but is
    // read here unconditionally so a payload shape change to either case
    // above can't silently drop it.
    if (event.eventType === "first_round_result") {
      delta.firstRoundTurnout = (event.payload as { turnout: number }).turnout;
    }
    if (event.eventType === "second_round_result") {
      delta.secondRoundTurnout = (event.payload as { turnout: number }).turnout;
    }
  }
  return delta;
}

interface DecisionDelta {
  runId: string;
  decisionIndex: number;
  phase: string | null;
  eventId: string | null;
  eventCategory: string | null;
  choiceId: string | null;
  choiceTag: string | null;
  choiceStrategy: string | null;
  outcomeId: string | null;
  internalRoll: number | null;
  viewedAt: string | null;
  selectedAt: string | null;
  resolvedAt: string | null;
  numberOfAvailableChoices: number | null;
  flagRare: boolean | null;
  flagChain: boolean | null;
  flagDecisive: boolean | null;
  flagRisky: boolean | null;
  playerPollBefore: number | null;
  playerPollAfter: number | null;
  popularityBefore: number | null;
  popularityAfter: number | null;
  momentumBefore: number | null;
  momentumAfter: number | null;
  appVersion: string | null;
  engineVersion: string | null;
  saveSchemaVersion: string | null;
  contentVersion: string | null;
}

/**
 * One delta per (run_id, decisionIndex), folding whichever of
 * decision_viewed / choice_selected / decision_resolved appear in this
 * batch — in any order. The atomic merge-on-conflict rules (first-write-wins
 * per field) live in fn_upsert_analytics_decision, so resolved->viewed->
 * selected and viewed->selected->resolved converge to the same row either
 * way (src/analytics/server/__tests__/ingest.test.ts).
 */
function buildDecisionDelta(
  runId: string,
  decisionIndex: number,
  events: AnalyticsEventEnvelope[],
): DecisionDelta {
  const delta: DecisionDelta = {
    runId,
    decisionIndex,
    phase: null,
    eventId: null,
    eventCategory: null,
    choiceId: null,
    choiceTag: null,
    choiceStrategy: null,
    outcomeId: null,
    internalRoll: null,
    viewedAt: null,
    selectedAt: null,
    resolvedAt: null,
    numberOfAvailableChoices: null,
    flagRare: null,
    flagChain: null,
    flagDecisive: null,
    flagRisky: null,
    playerPollBefore: null,
    playerPollAfter: null,
    popularityBefore: null,
    popularityAfter: null,
    momentumBefore: null,
    momentumAfter: null,
    appVersion: null,
    engineVersion: null,
    saveSchemaVersion: null,
    contentVersion: null,
  };

  for (const event of events) {
    delta.appVersion = event.versions.appVersion;
    delta.engineVersion = event.versions.engineVersion;
    delta.saveSchemaVersion = event.versions.saveSchemaVersion;
    delta.contentVersion = event.versions.contentVersion;

    if (event.eventType === "decision_viewed") {
      const payload = event.payload as {
        phase: string;
        eventId: string;
        eventCategory: string;
        numberOfAvailableChoices: number;
        flags: { rare: boolean; chain: boolean; decisive: boolean; risky: boolean };
      };
      delta.viewedAt = event.occurredAt;
      delta.phase = payload.phase;
      delta.eventId = payload.eventId;
      delta.eventCategory = payload.eventCategory;
      delta.numberOfAvailableChoices = payload.numberOfAvailableChoices;
      delta.flagRare = payload.flags.rare;
      delta.flagChain = payload.flags.chain;
      delta.flagDecisive = payload.flags.decisive;
      delta.flagRisky = payload.flags.risky;
    } else if (event.eventType === "choice_selected") {
      const payload = event.payload as {
        eventId: string;
        choiceId: string;
        choiceTag?: string;
        choiceStrategy?: string;
      };
      delta.selectedAt = event.occurredAt;
      delta.eventId = delta.eventId ?? payload.eventId;
      delta.choiceId = payload.choiceId;
      delta.choiceTag = payload.choiceTag ?? null;
      delta.choiceStrategy = payload.choiceStrategy ?? null;
    } else if (event.eventType === "decision_resolved") {
      const payload = event.payload as {
        phase: string;
        eventId: string;
        eventCategory: string;
        choiceId: string;
        choiceTag?: string;
        choiceStrategy?: string;
        outcomeId: string;
        internalRoll: number;
        playerPollBefore: number;
        playerPollAfter: number;
        popularityBefore: number;
        popularityAfter: number;
        momentumBefore: number;
        momentumAfter: number;
      };
      delta.resolvedAt = event.occurredAt;
      delta.phase = delta.phase ?? payload.phase;
      delta.eventId = delta.eventId ?? payload.eventId;
      delta.eventCategory = delta.eventCategory ?? payload.eventCategory;
      delta.choiceId = delta.choiceId ?? payload.choiceId;
      delta.choiceTag = delta.choiceTag ?? payload.choiceTag ?? null;
      delta.choiceStrategy = delta.choiceStrategy ?? payload.choiceStrategy ?? null;
      delta.outcomeId = payload.outcomeId;
      delta.internalRoll = payload.internalRoll;
      delta.playerPollBefore = payload.playerPollBefore;
      delta.playerPollAfter = payload.playerPollAfter;
      delta.popularityBefore = payload.popularityBefore;
      delta.popularityAfter = payload.popularityAfter;
      delta.momentumBefore = payload.momentumBefore;
      delta.momentumAfter = payload.momentumAfter;
    }
  }
  return delta;
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
  if (events.length === 0)
    return { accepted: 0, duplicates: 0, runsTouched: 0, decisionsTouched: 0 };

  const sorted = [...events].sort((a, b) => a.clientSequence - b.clientSequence);

  // count: "exact" reflects rows actually returned by the upsert's implicit
  // RETURNING clause — with ignoreDuplicates (ON CONFLICT DO NOTHING), a
  // duplicate event_uuid is never returned, so
  // (sorted.length - insertedCount) is exactly the duplicate count.
  const { error: rawInsertError, count: insertedCount } = await supabase
    .from("analytics_events")
    .upsert(
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
        save_schema_version: event.versions.saveSchemaVersion,
        content_version: event.versions.contentVersion,
        analytics_schema_version: event.versions.analyticsSchemaVersion,
        build_sha: event.versions.buildSha,
        experiment_id: event.experimentId ?? null,
        variant_id: event.variantId ?? null,
        payload: event.payload,
      })),
      { onConflict: "event_uuid", ignoreDuplicates: true, count: "exact" },
    );
  if (rawInsertError) throw rawInsertError;
  const duplicates = Math.max(0, sorted.length - (insertedCount ?? sorted.length));

  const decisionEvents = sorted.filter(
    (event): event is AnalyticsEventEnvelope & { runId: string } =>
      (event.eventType === "decision_viewed" ||
        event.eventType === "choice_selected" ||
        event.eventType === "decision_resolved") &&
      Boolean(event.runId),
  );
  const decisionsByKey = new Map<string, AnalyticsEventEnvelope[]>();
  for (const event of decisionEvents) {
    const decisionIndex = (event.payload as { decisionIndex: number }).decisionIndex;
    const key = `${event.runId}:${decisionIndex}`;
    const list = decisionsByKey.get(key) ?? [];
    list.push(event);
    decisionsByKey.set(key, list);
  }

  let decisionsTouched = 0;
  for (const [key, keyEvents] of decisionsByKey) {
    const [runId, decisionIndexRaw] = key.split(":");
    const decisionIndex = Number(decisionIndexRaw);
    const delta = buildDecisionDelta(runId!, decisionIndex, keyEvents);
    const { error } = await supabase.rpc("fn_upsert_analytics_decision", {
      p_run_id: delta.runId,
      p_decision_index: delta.decisionIndex,
      p_phase: delta.phase,
      p_event_id: delta.eventId,
      p_event_category: delta.eventCategory,
      p_choice_id: delta.choiceId,
      p_choice_tag: delta.choiceTag,
      p_choice_strategy: delta.choiceStrategy,
      p_outcome_id: delta.outcomeId,
      p_internal_roll: delta.internalRoll,
      p_viewed_at: delta.viewedAt,
      p_selected_at: delta.selectedAt,
      p_resolved_at: delta.resolvedAt,
      p_number_of_available_choices: delta.numberOfAvailableChoices,
      p_flag_rare: delta.flagRare,
      p_flag_chain: delta.flagChain,
      p_flag_decisive: delta.flagDecisive,
      p_flag_risky: delta.flagRisky,
      p_player_poll_before: delta.playerPollBefore,
      p_player_poll_after: delta.playerPollAfter,
      p_popularity_before: delta.popularityBefore,
      p_popularity_after: delta.popularityAfter,
      p_momentum_before: delta.momentumBefore,
      p_momentum_after: delta.momentumAfter,
      p_app_version: delta.appVersion,
      p_engine_version: delta.engineVersion,
      p_save_schema_version: delta.saveSchemaVersion,
      p_content_version: delta.contentVersion,
    });
    if (error) throw error;
    decisionsTouched += 1;
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
    const delta = buildRunDelta(runId, runEvents);
    const { error } = await supabase.rpc("fn_upsert_analytics_run", {
      p_run_id: delta.runId,
      p_anonymous_user_id: delta.anonymousUserId,
      p_session_id: delta.sessionId,
      p_mode: delta.mode,
      p_party_id: delta.partyId,
      p_method_id: delta.methodId,
      p_candidate_profile_id: delta.candidateProfileId,
      p_seed: delta.seed,
      p_started_at: delta.startedAt,
      p_last_event_at: delta.lastEventAt,
      p_completed_at: delta.completedAt,
      p_resumed_count_delta: delta.resumedCountDelta,
      p_qualified: delta.qualified,
      p_won: delta.won,
      p_final_score: delta.finalScore,
      p_ending_id: delta.endingId,
      p_first_round_player_rank: delta.firstRoundPlayerRank,
      p_second_round_player_rank: delta.secondRoundPlayerRank,
      p_first_round_player_score: delta.firstRoundPlayerScore,
      p_second_round_player_score: delta.secondRoundPlayerScore,
      p_runoff_opponent_party_id: delta.runoffOpponentPartyId,
      p_first_round_turnout: delta.firstRoundTurnout,
      p_second_round_turnout: delta.secondRoundTurnout,
      p_app_version: delta.appVersion,
      p_engine_version: delta.engineVersion,
      p_save_schema_version: delta.saveSchemaVersion,
      p_content_version: delta.contentVersion,
      p_analytics_schema_version: delta.analyticsSchemaVersion,
      p_build_sha: delta.buildSha,
      p_experiment_id: delta.experimentId,
      p_variant_id: delta.variantId,
    });
    if (error) throw error;

    // decisions_count stays a derived count(*), never a blindly incremented
    // counter — recomputed after the decision upserts above so it is
    // correct even under retries/duplicates.
    const { count: decisionCount, error: countError } = await supabase
      .from("analytics_decisions")
      .select("run_id", { count: "exact", head: true })
      .eq("run_id", runId);
    if (countError) throw countError;
    const { error: countUpdateError } = await supabase
      .from("analytics_runs")
      .update({ decisions_count: decisionCount ?? 0 })
      .eq("run_id", runId);
    if (countUpdateError) throw countUpdateError;

    runsTouched += 1;
  }

  return { accepted: sorted.length, duplicates, runsTouched, decisionsTouched };
}

export interface IngestionBatchRecord {
  batchUuid: string;
  acceptedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  rejectionReasonCodes: string[];
  processingDurationMs: number;
  appVersion?: string;
  engineVersion?: string;
  contentVersion?: string;
}

/**
 * Best-effort observability write — never a payload, only aggregate counts
 * (src/app/api/analytics/events/route.ts calls this in a try/catch and
 * never lets a failure here affect the response already sent to the
 * client).
 */
export async function recordIngestionBatch(
  supabase: SupabaseClient,
  record: IngestionBatchRecord,
): Promise<void> {
  const { error } = await supabase.from("analytics_ingestion_batches").insert({
    batch_uuid: record.batchUuid,
    accepted_count: record.acceptedCount,
    rejected_count: record.rejectedCount,
    duplicate_count: record.duplicateCount,
    rejection_reason_codes: record.rejectionReasonCodes,
    processing_duration_ms: record.processingDurationMs,
    app_version: record.appVersion ?? null,
    engine_version: record.engineVersion ?? null,
    content_version: record.contentVersion ?? null,
  });
  if (error) throw error;
}
