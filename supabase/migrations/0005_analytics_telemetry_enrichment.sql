-- Phase 2 — decision exposure/selection/resolution telemetry, electoral
-- scores, corrected versioning, ingestion observability.
-- Non-destructive: only ADD COLUMN / DROP NOT NULL / CREATE TABLE IF NOT
-- EXISTS. Never rewrites 0001-0004. Safe against an empty database (applies
-- 0001-0004 first) or a database that already has 0001-0004 applied.

-- ---------------------------------------------------------------------------
-- Versioning fix (see docs/analytics/VERSIONING_POLICY.md): `engine_version`
-- used to carry GAME_CONFIG.schemaVersion (a save-file compatibility
-- number), not a genuine engine-logic version. Going forward, `engine_version`
-- carries the real logic version (src/analytics/versions.ts
-- ENGINE_LOGIC_VERSION) and the old meaning moves to a new, explicitly named
-- column. No rows exist yet from real traffic (see docs/analytics/
-- ANALYTICS_IMPLEMENTATION_REPORT.md §J), so no backfill is needed — this is
-- purely additive for forward compatibility.
-- ---------------------------------------------------------------------------
alter table analytics_events add column if not exists save_schema_version text;
alter table analytics_runs add column if not exists save_schema_version text;
alter table analytics_decisions add column if not exists save_schema_version text;

-- ---------------------------------------------------------------------------
-- analytics_runs — electoral scores directly available on ElectionRoundResult
-- (src/game/types/index.ts), never recomputed.
-- ---------------------------------------------------------------------------
alter table analytics_runs add column if not exists first_round_player_score numeric;
alter table analytics_runs add column if not exists second_round_player_score numeric;
alter table analytics_runs add column if not exists runoff_opponent_party_id text;
alter table analytics_runs add column if not exists first_round_turnout numeric;
alter table analytics_runs add column if not exists second_round_turnout numeric;

-- ---------------------------------------------------------------------------
-- analytics_decisions — was "one row per RESOLVED decision"; becomes "one
-- row per decision index, progressively enriched by decision_viewed /
-- choice_selected / decision_resolved, in any arrival order". Columns that
-- used to be guaranteed by decision_resolved alone can no longer be NOT
-- NULL, because a row may now exist from decision_viewed only (a decision
-- shown but never resolved — reload, abandoned run, etc).
-- ---------------------------------------------------------------------------
alter table analytics_decisions alter column occurred_at drop not null;
alter table analytics_decisions alter column phase drop not null;
alter table analytics_decisions alter column event_id drop not null;
alter table analytics_decisions alter column event_category drop not null;
alter table analytics_decisions alter column choice_id drop not null;
alter table analytics_decisions alter column outcome_id drop not null;
alter table analytics_decisions alter column internal_roll drop not null;
alter table analytics_decisions alter column app_version drop not null;
alter table analytics_decisions alter column engine_version drop not null;
alter table analytics_decisions alter column content_version drop not null;

-- occurred_at keeps its historical role for existing queries/order-by: it is
-- now maintained as coalesce(resolved_at, selected_at, viewed_at) by the
-- ingestion code (src/analytics/server/ingest.ts) rather than being tied to
-- decision_resolved specifically. Documented in DATA_DICTIONARY.md.
alter table analytics_decisions add column if not exists viewed_at timestamptz;
alter table analytics_decisions add column if not exists selected_at timestamptz;
alter table analytics_decisions add column if not exists resolved_at timestamptz;

-- Generated column, not application-computed: always consistent with
-- viewed_at/selected_at regardless of which arrived first or how the row
-- was upserted, and never needs an extra read at ingestion time. Null
-- whenever either timestamp is missing (viewed then abandoned, or resolved
-- without a distinct viewed_at on old data). Reporting views must still clip
-- extreme values (see decision_health in 0006) rather than trust the raw
-- column for a median — a tab left open for hours would otherwise wreck it.
alter table analytics_decisions add column if not exists decision_latency_ms bigint
  generated always as (
    case
      when viewed_at is not null and selected_at is not null
        then round(extract(epoch from (selected_at - viewed_at)) * 1000)::bigint
      else null
    end
  ) stored;

alter table analytics_decisions add column if not exists number_of_available_choices integer;
alter table analytics_decisions add column if not exists flag_rare boolean;
alter table analytics_decisions add column if not exists flag_chain boolean;
alter table analytics_decisions add column if not exists flag_decisive boolean;
alter table analytics_decisions add column if not exists flag_risky boolean;

-- Read directly off GameState.parties[playerPartyId].stats immediately
-- before/after resolveCurrentChoice (src/features/campaign/game-app.tsx) —
-- never a recomputed engine formula.
alter table analytics_decisions add column if not exists player_poll_before numeric;
alter table analytics_decisions add column if not exists player_poll_after numeric;
alter table analytics_decisions add column if not exists popularity_before numeric;
alter table analytics_decisions add column if not exists popularity_after numeric;
alter table analytics_decisions add column if not exists momentum_before numeric;
alter table analytics_decisions add column if not exists momentum_after numeric;

create index if not exists analytics_decisions_viewed_idx
  on analytics_decisions (viewed_at) where viewed_at is not null;
create index if not exists analytics_decisions_resolved_idx
  on analytics_decisions (resolved_at) where resolved_at is not null;

-- ---------------------------------------------------------------------------
-- analytics_ingestion_batches — one row per POST /api/analytics/events
-- request that reached a configured Supabase project. Never stores rejected
-- payloads (§12 of the Phase 2 mission) — only aggregate counts and codes,
-- so a rejected event's content is still only ever in the response the
-- client already saw, never persisted.
-- ---------------------------------------------------------------------------
create table if not exists analytics_ingestion_batches (
  batch_uuid uuid primary key,
  received_at timestamptz not null default now(),
  accepted_count integer not null,
  rejected_count integer not null,
  duplicate_count integer not null default 0,
  rejection_reason_codes text[] not null default '{}',
  processing_duration_ms integer,
  app_version text,
  engine_version text,
  content_version text
);

create index if not exists analytics_ingestion_batches_received_idx
  on analytics_ingestion_batches (received_at);
alter table analytics_ingestion_batches enable row level security;
