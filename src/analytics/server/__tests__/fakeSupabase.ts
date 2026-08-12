/**
 * Minimal in-memory stand-in for the exact slice of the Supabase JS client
 * that src/analytics/server/ingest.ts actually calls, including the two
 * merge-on-conflict RPCs (fn_upsert_analytics_run,
 * fn_upsert_analytics_decision) whose real implementation lives in
 * supabase/migrations/0006_analytics_ingestion_observability.sql. This fake
 * reimplements the same merge rules in JS purely for unit-testing
 * ingest.ts's call sequencing and payload shaping — it is not a substitute
 * for actually running the SQL against Postgres (see docs/analytics/
 * PHASE2_IMPLEMENTATION_REPORT.md for what was and wasn't verified against
 * a real database). Never imported by application code, test-only.
 */
export interface FakeRunRow {
  run_id: string;
  [key: string]: unknown;
}

export interface FakeDecisionRow {
  run_id: string;
  decision_index: number;
  [key: string]: unknown;
}

export interface FakeEventRow {
  event_uuid: string;
  [key: string]: unknown;
}

export interface FakeIngestionBatchRow {
  batch_uuid: string;
  [key: string]: unknown;
}

export class FakeSupabaseStore {
  events = new Map<string, FakeEventRow>();
  decisions = new Map<string, FakeDecisionRow>();
  runs = new Map<string, FakeRunRow>();
  ingestionBatches: FakeIngestionBatchRow[] = [];
}

function decisionKey(runId: string, decisionIndex: number): string {
  return `${runId}:${decisionIndex}`;
}

function coalesce<T>(existing: T | null | undefined, incoming: T | null | undefined): T | null {
  return existing ?? incoming ?? null;
}

function isoMin(a: string, b: string): string {
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

function isoMax(a: string, b: string): string {
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function upsertAnalyticsRun(store: FakeSupabaseStore, params: Record<string, unknown>): void {
  const runId = params.p_run_id as string;
  const existing = store.runs.get(runId);
  if (!existing) {
    store.runs.set(runId, {
      run_id: runId,
      anonymous_user_id: params.p_anonymous_user_id,
      session_id: params.p_session_id,
      mode: params.p_mode,
      party_id: params.p_party_id,
      method_id: params.p_method_id,
      candidate_profile_id: params.p_candidate_profile_id,
      seed: params.p_seed,
      started_at: params.p_started_at,
      last_event_at: params.p_last_event_at,
      completed_at: params.p_completed_at,
      resumed_count: (params.p_resumed_count_delta as number) ?? 0,
      decisions_count: 0,
      qualified: params.p_qualified,
      won: params.p_won,
      final_score: params.p_final_score,
      ending_id: params.p_ending_id,
      first_round_player_rank: params.p_first_round_player_rank,
      second_round_player_rank: params.p_second_round_player_rank,
      first_round_player_score: params.p_first_round_player_score,
      second_round_player_score: params.p_second_round_player_score,
      runoff_opponent_party_id: params.p_runoff_opponent_party_id,
      first_round_turnout: params.p_first_round_turnout,
      second_round_turnout: params.p_second_round_turnout,
      app_version: params.p_app_version,
      engine_version: params.p_engine_version,
      save_schema_version: params.p_save_schema_version,
      content_version: params.p_content_version,
      analytics_schema_version: params.p_analytics_schema_version,
      build_sha: params.p_build_sha,
      experiment_id: params.p_experiment_id,
      variant_id: params.p_variant_id,
    });
    return;
  }
  existing.anonymous_user_id = params.p_anonymous_user_id;
  existing.session_id = params.p_session_id;
  existing.mode = coalesce(existing.mode as string | null, params.p_mode as string | null);
  existing.party_id = coalesce(
    existing.party_id as string | null,
    params.p_party_id as string | null,
  );
  existing.method_id = coalesce(
    existing.method_id as string | null,
    params.p_method_id as string | null,
  );
  existing.candidate_profile_id = coalesce(
    existing.candidate_profile_id as string | null,
    params.p_candidate_profile_id as string | null,
  );
  existing.seed = coalesce(existing.seed as string | null, params.p_seed as string | null);
  existing.started_at = isoMin(existing.started_at as string, params.p_started_at as string);
  existing.last_event_at = isoMax(
    existing.last_event_at as string,
    params.p_last_event_at as string,
  );
  existing.completed_at = coalesce(
    existing.completed_at as string | null,
    params.p_completed_at as string | null,
  );
  existing.resumed_count =
    (existing.resumed_count as number) + ((params.p_resumed_count_delta as number) ?? 0);
  existing.qualified = coalesce(
    existing.qualified as boolean | null,
    params.p_qualified as boolean | null,
  );
  existing.won = coalesce(existing.won as boolean | null, params.p_won as boolean | null);
  existing.final_score = coalesce(
    existing.final_score as number | null,
    params.p_final_score as number | null,
  );
  existing.ending_id = coalesce(
    existing.ending_id as string | null,
    params.p_ending_id as string | null,
  );
  existing.first_round_player_rank = coalesce(
    existing.first_round_player_rank as number | null,
    params.p_first_round_player_rank as number | null,
  );
  existing.second_round_player_rank = coalesce(
    existing.second_round_player_rank as number | null,
    params.p_second_round_player_rank as number | null,
  );
  existing.first_round_player_score = coalesce(
    existing.first_round_player_score as number | null,
    params.p_first_round_player_score as number | null,
  );
  existing.second_round_player_score = coalesce(
    existing.second_round_player_score as number | null,
    params.p_second_round_player_score as number | null,
  );
  existing.runoff_opponent_party_id = coalesce(
    existing.runoff_opponent_party_id as string | null,
    params.p_runoff_opponent_party_id as string | null,
  );
  existing.first_round_turnout = coalesce(
    existing.first_round_turnout as number | null,
    params.p_first_round_turnout as number | null,
  );
  existing.second_round_turnout = coalesce(
    existing.second_round_turnout as number | null,
    params.p_second_round_turnout as number | null,
  );
  existing.app_version = params.p_app_version;
  existing.engine_version = params.p_engine_version;
  existing.save_schema_version = params.p_save_schema_version;
  existing.content_version = params.p_content_version;
  existing.analytics_schema_version = params.p_analytics_schema_version;
  existing.build_sha = params.p_build_sha;
  existing.experiment_id = coalesce(
    existing.experiment_id as string | null,
    params.p_experiment_id as string | null,
  );
  existing.variant_id = coalesce(
    existing.variant_id as string | null,
    params.p_variant_id as string | null,
  );
}

function upsertAnalyticsDecision(store: FakeSupabaseStore, params: Record<string, unknown>): void {
  const key = decisionKey(params.p_run_id as string, params.p_decision_index as number);
  const existing = store.decisions.get(key);
  const viewedAt = coalesce(
    existing?.viewed_at as string | null,
    params.p_viewed_at as string | null,
  );
  const selectedAt = coalesce(
    existing?.selected_at as string | null,
    params.p_selected_at as string | null,
  );
  const resolvedAt = coalesce(
    existing?.resolved_at as string | null,
    params.p_resolved_at as string | null,
  );
  store.decisions.set(key, {
    run_id: params.p_run_id as string,
    decision_index: params.p_decision_index as number,
    occurred_at: resolvedAt ?? selectedAt ?? viewedAt,
    phase: coalesce(existing?.phase as string | null, params.p_phase as string | null),
    event_id: coalesce(existing?.event_id as string | null, params.p_event_id as string | null),
    event_category: coalesce(
      existing?.event_category as string | null,
      params.p_event_category as string | null,
    ),
    choice_id: coalesce(existing?.choice_id as string | null, params.p_choice_id as string | null),
    choice_tag: coalesce(
      existing?.choice_tag as string | null,
      params.p_choice_tag as string | null,
    ),
    choice_strategy: coalesce(
      existing?.choice_strategy as string | null,
      params.p_choice_strategy as string | null,
    ),
    outcome_id: coalesce(
      existing?.outcome_id as string | null,
      params.p_outcome_id as string | null,
    ),
    internal_roll: coalesce(
      existing?.internal_roll as number | null,
      params.p_internal_roll as number | null,
    ),
    viewed_at: viewedAt,
    selected_at: selectedAt,
    resolved_at: resolvedAt,
    number_of_available_choices: coalesce(
      existing?.number_of_available_choices as number | null,
      params.p_number_of_available_choices as number | null,
    ),
    flag_rare: coalesce(
      existing?.flag_rare as boolean | null,
      params.p_flag_rare as boolean | null,
    ),
    flag_chain: coalesce(
      existing?.flag_chain as boolean | null,
      params.p_flag_chain as boolean | null,
    ),
    flag_decisive: coalesce(
      existing?.flag_decisive as boolean | null,
      params.p_flag_decisive as boolean | null,
    ),
    flag_risky: coalesce(
      existing?.flag_risky as boolean | null,
      params.p_flag_risky as boolean | null,
    ),
    player_poll_before: coalesce(
      existing?.player_poll_before as number | null,
      params.p_player_poll_before as number | null,
    ),
    player_poll_after: coalesce(
      existing?.player_poll_after as number | null,
      params.p_player_poll_after as number | null,
    ),
    popularity_before: coalesce(
      existing?.popularity_before as number | null,
      params.p_popularity_before as number | null,
    ),
    popularity_after: coalesce(
      existing?.popularity_after as number | null,
      params.p_popularity_after as number | null,
    ),
    momentum_before: coalesce(
      existing?.momentum_before as number | null,
      params.p_momentum_before as number | null,
    ),
    momentum_after: coalesce(
      existing?.momentum_after as number | null,
      params.p_momentum_after as number | null,
    ),
    app_version: coalesce(
      existing?.app_version as string | null,
      params.p_app_version as string | null,
    ),
    engine_version: coalesce(
      existing?.engine_version as string | null,
      params.p_engine_version as string | null,
    ),
    save_schema_version: coalesce(
      existing?.save_schema_version as string | null,
      params.p_save_schema_version as string | null,
    ),
    content_version: coalesce(
      existing?.content_version as string | null,
      params.p_content_version as string | null,
    ),
  });
}

export function createFakeSupabaseClient(store: FakeSupabaseStore) {
  return {
    rpc(fnName: string, params: Record<string, unknown>) {
      if (fnName === "fn_upsert_analytics_run") {
        upsertAnalyticsRun(store, params);
        return Promise.resolve({ error: null });
      }
      if (fnName === "fn_upsert_analytics_decision") {
        upsertAnalyticsDecision(store, params);
        return Promise.resolve({ error: null });
      }
      throw new Error(`FakeSupabaseClient: unexpected rpc "${fnName}"`);
    },
    from(table: string) {
      if (table === "analytics_events") {
        return {
          upsert(rows: FakeEventRow[]) {
            let inserted = 0;
            for (const row of rows) {
              if (!store.events.has(row.event_uuid)) {
                store.events.set(row.event_uuid, row);
                inserted += 1;
              }
            }
            return Promise.resolve({ error: null, count: inserted });
          },
        };
      }
      if (table === "analytics_decisions") {
        return {
          select(_columns: string, options?: { count?: string; head?: boolean }) {
            return {
              eq(_column: string, value: string) {
                const count = [...store.decisions.values()].filter(
                  (row) => row.run_id === value,
                ).length;
                if (options?.head) return Promise.resolve({ error: null, count });
                return Promise.resolve({ error: null, count, data: [] });
              },
            };
          },
        };
      }
      if (table === "analytics_runs") {
        return {
          update(patch: Record<string, unknown>) {
            return {
              eq(_column: string, value: string) {
                const existing = store.runs.get(value);
                if (existing) Object.assign(existing, patch);
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }
      if (table === "analytics_ingestion_batches") {
        return {
          insert(row: FakeIngestionBatchRow) {
            store.ingestionBatches.push(row);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`FakeSupabaseClient: unexpected table "${table}"`);
    },
  };
}
