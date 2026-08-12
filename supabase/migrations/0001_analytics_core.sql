-- Analytics core schema — Vers l'Élysée
-- Append-only raw event log + two derived fact tables. No PII. No gameplay data.
-- Written for Supabase Postgres. Idempotent: safe to re-run (IF NOT EXISTS guards).

-- ---------------------------------------------------------------------------
-- analytics_events — append-only raw log, one row per client-emitted event.
-- Ingestion is idempotent on event_uuid (client-generated, not server-derived).
-- ---------------------------------------------------------------------------
create table if not exists analytics_events (
  event_uuid uuid primary key,
  event_type text not null,
  anonymous_user_id uuid not null,
  session_id uuid not null,
  run_id text,
  client_sequence integer not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  app_version text not null,
  engine_version text not null,
  content_version text not null,
  analytics_schema_version text not null,
  build_sha text not null,
  experiment_id text,
  variant_id text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_run_id_idx on analytics_events (run_id);
create index if not exists analytics_events_type_created_idx
  on analytics_events (event_type, received_at);
create index if not exists analytics_events_user_idx on analytics_events (anonymous_user_id);
create index if not exists analytics_events_versions_idx
  on analytics_events (app_version, engine_version, content_version);

-- ---------------------------------------------------------------------------
-- analytics_runs — one row per campaign (run_id), upserted idempotently as the
-- run progresses. status is NOT stored here (see view analytics_run_status) —
-- storing a derived, time-dependent value as a plain column would go stale
-- between reads; it is computed at query time from last_event_at instead.
-- ---------------------------------------------------------------------------
create table if not exists analytics_runs (
  run_id text primary key,
  anonymous_user_id uuid not null,
  session_id uuid not null,
  -- mode/party_id/seed are nullable, not because they can be legitimately
  -- absent from a real run, but because a run-scoped event (e.g.
  -- decision_resolved) could in principle be ingested before its
  -- run_started event under network reordering across two separate
  -- ingestion requests. Rather than fabricate placeholder values, the
  -- column stays null until run_started is actually processed; see
  -- docs/analytics/DATA_QUALITY.md.
  mode text,
  party_id text,
  method_id text,
  candidate_profile_id text,
  seed text,
  started_at timestamptz not null,
  last_event_at timestamptz not null,
  completed_at timestamptz,
  resumed_count integer not null default 0,
  decisions_count integer not null default 0,
  qualified boolean,
  won boolean,
  final_score numeric,
  ending_id text,
  first_round_player_rank integer,
  second_round_player_rank integer,
  app_version text not null,
  engine_version text not null,
  content_version text not null,
  analytics_schema_version text not null,
  build_sha text not null,
  experiment_id text,
  variant_id text
);

create index if not exists analytics_runs_status_inputs_idx
  on analytics_runs (last_event_at, completed_at);
create index if not exists analytics_runs_party_idx on analytics_runs (party_id);
create index if not exists analytics_runs_versions_idx
  on analytics_runs (app_version, engine_version, content_version);

-- ---------------------------------------------------------------------------
-- analytics_decisions — one row per resolved decision. Deduplicated on
-- (run_id, decision_index): a given decision in a given run is recorded once.
-- Mirrors DecisionRecord (src/game/types/index.ts) — no narrative text stored.
-- ---------------------------------------------------------------------------
create table if not exists analytics_decisions (
  run_id text not null references analytics_runs (run_id) on delete cascade,
  decision_index integer not null,
  occurred_at timestamptz not null,
  phase text not null,
  event_id text not null,
  event_category text not null,
  choice_id text not null,
  choice_tag text,
  choice_strategy text,
  outcome_id text not null,
  internal_roll numeric not null,
  app_version text not null,
  engine_version text not null,
  content_version text not null,
  primary key (run_id, decision_index)
);

create index if not exists analytics_decisions_event_idx
  on analytics_decisions (event_id, choice_id, outcome_id);
create index if not exists analytics_decisions_strategy_idx
  on analytics_decisions (choice_strategy);

-- ---------------------------------------------------------------------------
-- Row Level Security — enabled with zero grants to anon/authenticated. All
-- reads and writes happen server-side with the Supabase service role, which
-- bypasses RLS by design. This is what "no direct client DB access" means in
-- practice: even if the anon key leaked, these tables are unreadable through
-- it because no policy grants anon/authenticated any access.
-- ---------------------------------------------------------------------------
alter table analytics_events enable row level security;
alter table analytics_runs enable row level security;
alter table analytics_decisions enable row level security;
