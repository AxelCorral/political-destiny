-- Phase 2 — atomic ingestion merges, extended Data Quality, and dashboard
-- marts updated to use real exposure/selection/latency/electoral-score data
-- instead of the Phase 1 proxies. CREATE OR REPLACE only — 0001-0005 stay
-- untouched on disk.

-- ---------------------------------------------------------------------------
-- fn_upsert_analytics_run — atomic replacement for the Phase 1 select-then-
-- upsert in src/analytics/server/ingest.ts (documented there and in
-- docs/analytics/ANALYTICS_IMPLEMENTATION_REPORT.md §H as a known
-- concurrency gap). A single INSERT ... ON CONFLICT DO UPDATE is atomic
-- under Postgres regardless of how many concurrent requests touch the same
-- run_id — no read-modify-write race is possible. Merge rules:
--   - started_at   = earliest seen
--   - last_event_at = latest seen
--   - "set-once" fields (mode, party_id, scores, ranks, completed_at, won,
--     ending_id, opponent, turnouts, ...) never get overwritten once set —
--     a stale/duplicate/reordered event can only fill a gap, never clobber
--     an already-known value.
--   - resumed_count is a true additive delta, safe under concurrent writers.
--   - decisions_count is intentionally NOT set here — it stays derived from
--     a count(*) over analytics_decisions, refreshed by the caller.
-- ---------------------------------------------------------------------------
create or replace function fn_upsert_analytics_run(
  p_run_id text,
  p_anonymous_user_id uuid,
  p_session_id uuid,
  p_mode text,
  p_party_id text,
  p_method_id text,
  p_candidate_profile_id text,
  p_seed text,
  p_started_at timestamptz,
  p_last_event_at timestamptz,
  p_completed_at timestamptz,
  p_resumed_count_delta integer,
  p_qualified boolean,
  p_won boolean,
  p_final_score numeric,
  p_ending_id text,
  p_first_round_player_rank integer,
  p_second_round_player_rank integer,
  p_first_round_player_score numeric,
  p_second_round_player_score numeric,
  p_runoff_opponent_party_id text,
  p_first_round_turnout numeric,
  p_second_round_turnout numeric,
  p_app_version text,
  p_engine_version text,
  p_save_schema_version text,
  p_content_version text,
  p_analytics_schema_version text,
  p_build_sha text,
  p_experiment_id text,
  p_variant_id text
) returns void
language plpgsql
as $$
begin
  insert into analytics_runs (
    run_id, anonymous_user_id, session_id, mode, party_id, method_id,
    candidate_profile_id, seed, started_at, last_event_at, completed_at,
    resumed_count, decisions_count, qualified, won, final_score, ending_id,
    first_round_player_rank, second_round_player_rank,
    first_round_player_score, second_round_player_score,
    runoff_opponent_party_id, first_round_turnout, second_round_turnout,
    app_version, engine_version, save_schema_version, content_version,
    analytics_schema_version, build_sha, experiment_id, variant_id
  )
  values (
    p_run_id, p_anonymous_user_id, p_session_id, p_mode, p_party_id, p_method_id,
    p_candidate_profile_id, p_seed, p_started_at, p_last_event_at, p_completed_at,
    coalesce(p_resumed_count_delta, 0), 0, p_qualified, p_won, p_final_score, p_ending_id,
    p_first_round_player_rank, p_second_round_player_rank,
    p_first_round_player_score, p_second_round_player_score,
    p_runoff_opponent_party_id, p_first_round_turnout, p_second_round_turnout,
    p_app_version, p_engine_version, p_save_schema_version, p_content_version,
    p_analytics_schema_version, p_build_sha, p_experiment_id, p_variant_id
  )
  on conflict (run_id) do update set
    anonymous_user_id = excluded.anonymous_user_id,
    session_id = excluded.session_id,
    mode = coalesce(analytics_runs.mode, excluded.mode),
    party_id = coalesce(analytics_runs.party_id, excluded.party_id),
    method_id = coalesce(analytics_runs.method_id, excluded.method_id),
    candidate_profile_id =
      coalesce(analytics_runs.candidate_profile_id, excluded.candidate_profile_id),
    seed = coalesce(analytics_runs.seed, excluded.seed),
    started_at = least(analytics_runs.started_at, excluded.started_at),
    last_event_at = greatest(analytics_runs.last_event_at, excluded.last_event_at),
    completed_at = coalesce(analytics_runs.completed_at, excluded.completed_at),
    resumed_count = analytics_runs.resumed_count + coalesce(p_resumed_count_delta, 0),
    qualified = coalesce(analytics_runs.qualified, excluded.qualified),
    won = coalesce(analytics_runs.won, excluded.won),
    final_score = coalesce(analytics_runs.final_score, excluded.final_score),
    ending_id = coalesce(analytics_runs.ending_id, excluded.ending_id),
    first_round_player_rank =
      coalesce(analytics_runs.first_round_player_rank, excluded.first_round_player_rank),
    second_round_player_rank =
      coalesce(analytics_runs.second_round_player_rank, excluded.second_round_player_rank),
    first_round_player_score =
      coalesce(analytics_runs.first_round_player_score, excluded.first_round_player_score),
    second_round_player_score =
      coalesce(analytics_runs.second_round_player_score, excluded.second_round_player_score),
    runoff_opponent_party_id =
      coalesce(analytics_runs.runoff_opponent_party_id, excluded.runoff_opponent_party_id),
    first_round_turnout = coalesce(analytics_runs.first_round_turnout, excluded.first_round_turnout),
    second_round_turnout =
      coalesce(analytics_runs.second_round_turnout, excluded.second_round_turnout),
    app_version = excluded.app_version,
    engine_version = excluded.engine_version,
    save_schema_version = excluded.save_schema_version,
    content_version = excluded.content_version,
    analytics_schema_version = excluded.analytics_schema_version,
    build_sha = excluded.build_sha,
    experiment_id = coalesce(analytics_runs.experiment_id, excluded.experiment_id),
    variant_id = coalesce(analytics_runs.variant_id, excluded.variant_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- fn_upsert_analytics_decision — same atomicity guarantee for the
-- viewed/selected/resolved merge. Idempotent and order-independent: tested
-- against resolved->viewed->selected as well as the natural
-- viewed->selected->resolved order (src/analytics/server/__tests__/
-- ingest.test.ts).
-- ---------------------------------------------------------------------------
create or replace function fn_upsert_analytics_decision(
  p_run_id text,
  p_decision_index integer,
  p_phase text,
  p_event_id text,
  p_event_category text,
  p_choice_id text,
  p_choice_tag text,
  p_choice_strategy text,
  p_outcome_id text,
  p_internal_roll numeric,
  p_viewed_at timestamptz,
  p_selected_at timestamptz,
  p_resolved_at timestamptz,
  p_number_of_available_choices integer,
  p_flag_rare boolean,
  p_flag_chain boolean,
  p_flag_decisive boolean,
  p_flag_risky boolean,
  p_player_poll_before numeric,
  p_player_poll_after numeric,
  p_popularity_before numeric,
  p_popularity_after numeric,
  p_momentum_before numeric,
  p_momentum_after numeric,
  p_app_version text,
  p_engine_version text,
  p_save_schema_version text,
  p_content_version text
) returns void
language plpgsql
as $$
begin
  insert into analytics_decisions (
    run_id, decision_index, occurred_at, phase, event_id, event_category,
    choice_id, choice_tag, choice_strategy, outcome_id, internal_roll,
    viewed_at, selected_at, resolved_at, number_of_available_choices,
    flag_rare, flag_chain, flag_decisive, flag_risky,
    player_poll_before, player_poll_after, popularity_before, popularity_after,
    momentum_before, momentum_after,
    app_version, engine_version, save_schema_version, content_version
  )
  values (
    p_run_id, p_decision_index,
    coalesce(p_resolved_at, p_selected_at, p_viewed_at),
    p_phase, p_event_id, p_event_category,
    p_choice_id, p_choice_tag, p_choice_strategy, p_outcome_id, p_internal_roll,
    p_viewed_at, p_selected_at, p_resolved_at, p_number_of_available_choices,
    p_flag_rare, p_flag_chain, p_flag_decisive, p_flag_risky,
    p_player_poll_before, p_player_poll_after, p_popularity_before, p_popularity_after,
    p_momentum_before, p_momentum_after,
    p_app_version, p_engine_version, p_save_schema_version, p_content_version
  )
  on conflict (run_id, decision_index) do update set
    occurred_at = coalesce(
      coalesce(analytics_decisions.resolved_at, excluded.resolved_at),
      coalesce(analytics_decisions.selected_at, excluded.selected_at),
      coalesce(analytics_decisions.viewed_at, excluded.viewed_at)
    ),
    phase = coalesce(analytics_decisions.phase, excluded.phase),
    event_id = coalesce(analytics_decisions.event_id, excluded.event_id),
    event_category = coalesce(analytics_decisions.event_category, excluded.event_category),
    choice_id = coalesce(analytics_decisions.choice_id, excluded.choice_id),
    choice_tag = coalesce(analytics_decisions.choice_tag, excluded.choice_tag),
    choice_strategy = coalesce(analytics_decisions.choice_strategy, excluded.choice_strategy),
    outcome_id = coalesce(analytics_decisions.outcome_id, excluded.outcome_id),
    internal_roll = coalesce(analytics_decisions.internal_roll, excluded.internal_roll),
    viewed_at = coalesce(analytics_decisions.viewed_at, excluded.viewed_at),
    selected_at = coalesce(analytics_decisions.selected_at, excluded.selected_at),
    resolved_at = coalesce(analytics_decisions.resolved_at, excluded.resolved_at),
    number_of_available_choices = coalesce(
      analytics_decisions.number_of_available_choices, excluded.number_of_available_choices
    ),
    flag_rare = coalesce(analytics_decisions.flag_rare, excluded.flag_rare),
    flag_chain = coalesce(analytics_decisions.flag_chain, excluded.flag_chain),
    flag_decisive = coalesce(analytics_decisions.flag_decisive, excluded.flag_decisive),
    flag_risky = coalesce(analytics_decisions.flag_risky, excluded.flag_risky),
    player_poll_before = coalesce(analytics_decisions.player_poll_before, excluded.player_poll_before),
    player_poll_after = coalesce(analytics_decisions.player_poll_after, excluded.player_poll_after),
    popularity_before = coalesce(analytics_decisions.popularity_before, excluded.popularity_before),
    popularity_after = coalesce(analytics_decisions.popularity_after, excluded.popularity_after),
    momentum_before = coalesce(analytics_decisions.momentum_before, excluded.momentum_before),
    momentum_after = coalesce(analytics_decisions.momentum_after, excluded.momentum_after),
    app_version = coalesce(analytics_decisions.app_version, excluded.app_version),
    engine_version = coalesce(analytics_decisions.engine_version, excluded.engine_version),
    save_schema_version =
      coalesce(analytics_decisions.save_schema_version, excluded.save_schema_version),
    content_version = coalesce(analytics_decisions.content_version, excluded.content_version);
end;
$$;

-- ---------------------------------------------------------------------------
-- party_performance / fn_party_performance — add T1 score mean/median.
--
-- analytics_run_status (0002) was defined as `select r.*, case ... end`.
-- Postgres freezes a view's column list (including a `*` expansion) at
-- CREATE VIEW time — the new analytics_runs columns added in 0005 (electoral
-- scores, save_schema_version, ...) do NOT appear in this view until it is
-- recreated. fn_party_performance and fn_overview_summary below both read
-- from this view and need those columns, so it must be rebuilt first — and
-- since the *0004* fn_party_performance already depends on this view, that
-- old function has to be dropped before the view can be, or Postgres
-- refuses the DROP with "other objects depend on it".
-- ---------------------------------------------------------------------------
drop function if exists fn_party_performance(timestamptz, timestamptz, text, text, text, text);
drop view if exists analytics_run_status;
create view analytics_run_status as
select
  r.*,
  case
    when r.completed_at is not null then 'completed'
    when r.last_event_at <
      now() - (
        (select value from analytics_settings where key = 'stale_run_hours')::int
        * interval '1 hour'
      )
      then 'stale_incomplete'
    else 'ongoing'
  end as status
from analytics_runs r;

-- The four views below add/reorder columns from their 0002 definitions.
-- CREATE OR REPLACE VIEW only allows appending columns at the very end
-- without changing any existing position — reordering (as these do, to keep
-- related columns adjacent) requires DROP + CREATE instead. Nothing in this
-- codebase queries these plain "all-time" views directly (the dashboard
-- uses the filtered fn_* functions below, which have their own explicit
-- DROP FUNCTION where needed) — dropping and recreating them is safe.
drop view if exists party_performance;
create view party_performance as
select
  party_id,
  count(*) as n_runs,
  count(*) filter (where completed_at is not null) as n_completed,
  avg(final_score) filter (where completed_at is not null) as avg_final_score,
  avg(first_round_player_score) as avg_first_round_score,
  percentile_cont(0.5) within group (order by first_round_player_score) as median_first_round_score,
  count(*) filter (where qualified) as n_qualified,
  count(*) filter (where won) as n_won,
  round(
    count(*) filter (where qualified)::numeric
      / nullif(count(*) filter (where completed_at is not null), 0),
    4
  ) as qualification_rate,
  round(
    count(*) filter (where won)::numeric
      / nullif(count(*) filter (where completed_at is not null), 0),
    4
  ) as win_rate,
  round(
    count(*) filter (where won)::numeric / nullif(count(*) filter (where qualified), 0),
    4
  ) as win_rate_given_qualified
from analytics_runs
group by party_id;

-- CREATE OR REPLACE FUNCTION cannot change a return signature — these five
-- functions gain/rename output columns in Phase 2, so the old signature is
-- dropped first. Safe: functions carry no state, and 0004's version keeps
-- existing on disk for history — this is a new migration replacing what a
-- function returns, not editing 0004.sql.
drop function if exists fn_party_performance(timestamptz, timestamptz, text, text, text, text);

create or replace function fn_party_performance(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_app_version text default null,
  p_engine_version text default null,
  p_content_version text default null,
  p_status text default null
)
returns table (
  party_id text,
  n_runs bigint,
  n_completed bigint,
  avg_final_score numeric,
  avg_first_round_score numeric,
  median_first_round_score numeric,
  n_qualified bigint,
  n_won bigint,
  qualification_rate numeric,
  win_rate numeric,
  win_rate_given_qualified numeric
)
language sql
stable
as $$
  select
    party_id,
    count(*) as n_runs,
    count(*) filter (where completed_at is not null) as n_completed,
    avg(final_score) filter (where completed_at is not null) as avg_final_score,
    avg(first_round_player_score) as avg_first_round_score,
    percentile_cont(0.5) within group (order by first_round_player_score) as median_first_round_score,
    count(*) filter (where qualified) as n_qualified,
    count(*) filter (where won) as n_won,
    round(
      count(*) filter (where qualified)::numeric
        / nullif(count(*) filter (where completed_at is not null), 0),
      4
    ) as qualification_rate,
    round(
      count(*) filter (where won)::numeric
        / nullif(count(*) filter (where completed_at is not null), 0),
      4
    ) as win_rate,
    round(
      count(*) filter (where won)::numeric / nullif(count(*) filter (where qualified), 0),
      4
    ) as win_rate_given_qualified
  from analytics_run_status
  where (p_start is null or started_at >= p_start)
    and (p_end is null or started_at <= p_end)
    and (p_app_version is null or app_version = p_app_version)
    and (p_engine_version is null or engine_version = p_engine_version)
    and (p_content_version is null or content_version = p_content_version)
    and (p_status is null or status = p_status)
  group by party_id;
$$;

-- ---------------------------------------------------------------------------
-- decision_health — was built from "one row = one resolved decision"; now
-- distinguishes real exposures (viewed_at) from resolutions (resolved_at),
-- and reports a latency median clipped at 2 hours so an abandoned tab can't
-- distort it (documented in docs/analytics/DATA_DICTIONARY.md).
-- ---------------------------------------------------------------------------
drop view if exists decision_health;
create view decision_health as
select
  event_id,
  event_category,
  count(*) filter (where viewed_at is not null) as n_exposures,
  count(*) filter (where resolved_at is not null) as n_resolved,
  count(distinct choice_id) filter (where choice_id is not null) as n_distinct_choices_taken,
  count(distinct outcome_id) filter (where outcome_id is not null) as n_distinct_outcomes,
  avg(internal_roll) filter (where internal_roll is not null) as avg_internal_roll,
  stddev_samp(internal_roll) filter (where internal_roll is not null) as stddev_internal_roll,
  percentile_cont(0.5) within group (
    order by decision_latency_ms
  ) filter (where decision_latency_ms is not null and decision_latency_ms < 7200000) as median_latency_ms
from analytics_decisions
where event_id is not null
group by event_id, event_category;

drop function if exists fn_decision_health(timestamptz, timestamptz, text);

create or replace function fn_decision_health(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_phase text default null
)
returns table (
  event_id text,
  event_category text,
  n_exposures bigint,
  n_resolved bigint,
  n_distinct_choices_taken bigint,
  avg_internal_roll numeric,
  stddev_internal_roll numeric,
  median_latency_ms numeric
)
language sql
stable
as $$
  select
    event_id,
    event_category,
    count(*) filter (where viewed_at is not null) as n_exposures,
    count(*) filter (where resolved_at is not null) as n_resolved,
    count(distinct choice_id) filter (where choice_id is not null) as n_distinct_choices_taken,
    avg(internal_roll) filter (where internal_roll is not null) as avg_internal_roll,
    stddev_samp(internal_roll) filter (where internal_roll is not null) as stddev_internal_roll,
    percentile_cont(0.5) within group (
      order by decision_latency_ms
    ) filter (where decision_latency_ms is not null and decision_latency_ms < 7200000) as median_latency_ms
  from analytics_decisions
  where event_id is not null
    and (p_start is null or occurred_at >= p_start)
    and (p_end is null or occurred_at <= p_end)
    and (p_phase is null or phase = p_phase)
  group by event_id, event_category;
$$;

-- ---------------------------------------------------------------------------
-- event_choice_distribution — denominator is now real exposures
-- (decision_viewed), not "however many choices were taken for this event",
-- which is what the mission calls out as the previously-wrong denominator.
-- ---------------------------------------------------------------------------
drop view if exists event_choice_distribution;
create view event_choice_distribution as
select
  d.event_id,
  d.choice_id,
  d.choice_tag,
  d.choice_strategy,
  count(*) filter (where d.selected_at is not null or d.resolved_at is not null) as n_picked,
  exposures.n_event_exposures,
  round(
    count(*) filter (where d.selected_at is not null or d.resolved_at is not null)::numeric
      / nullif(exposures.n_event_exposures, 0),
    4
  ) as selection_share
from analytics_decisions d
join (
  select event_id, count(*) as n_event_exposures
  from analytics_decisions
  where viewed_at is not null
  group by event_id
) exposures on exposures.event_id = d.event_id
where d.choice_id is not null
group by d.event_id, d.choice_id, d.choice_tag, d.choice_strategy, exposures.n_event_exposures;

drop function if exists fn_event_choice_distribution(timestamptz, timestamptz, text, text);

create or replace function fn_event_choice_distribution(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_phase text default null,
  p_party_id text default null
)
returns table (
  event_id text,
  choice_id text,
  choice_tag text,
  choice_strategy text,
  n_picked bigint,
  n_event_exposures bigint,
  selection_share numeric
)
language sql
stable
as $$
  with scoped as (
    select d.*
    from analytics_decisions d
    join analytics_runs r on r.run_id = d.run_id
    where (p_start is null or d.occurred_at >= p_start)
      and (p_end is null or d.occurred_at <= p_end)
      and (p_phase is null or d.phase = p_phase)
      and (p_party_id is null or r.party_id = p_party_id)
  ),
  exposures as (
    select event_id, count(*) as n_event_exposures
    from scoped
    where viewed_at is not null
    group by event_id
  )
  select
    s.event_id,
    s.choice_id,
    s.choice_tag,
    s.choice_strategy,
    count(*) filter (where s.selected_at is not null or s.resolved_at is not null) as n_picked,
    e.n_event_exposures,
    round(
      count(*) filter (where s.selected_at is not null or s.resolved_at is not null)::numeric
        / nullif(e.n_event_exposures, 0),
      4
    ) as selection_share
  from scoped s
  join exposures e on e.event_id = s.event_id
  where s.choice_id is not null
  group by s.event_id, s.choice_id, s.choice_tag, s.choice_strategy, e.n_event_exposures;
$$;

-- ---------------------------------------------------------------------------
-- content_exposure — based on viewed_at (real exposure), not resolved rows.
-- "Never exposed" (an event in the game's own catalog with zero rows here)
-- can't be computed in SQL — the catalog lives in the app, not the
-- database — the dashboard page cross-references this result against
-- gameContent.events in JS (see docs/analytics/PRODUCT_ANALYTICS_COVERAGE.md).
-- ---------------------------------------------------------------------------
drop view if exists content_exposure;
create view content_exposure as
select
  event_id,
  event_category,
  count(distinct run_id) as n_runs_exposed,
  count(*) filter (where viewed_at is not null) as n_total_exposures,
  bool_or(coalesce(flag_rare, false)) as is_rare,
  bool_or(coalesce(flag_chain, false)) as is_chain,
  bool_or(coalesce(flag_decisive, false)) as is_decisive
from analytics_decisions
where event_id is not null
group by event_id, event_category;

drop function if exists fn_content_exposure(timestamptz, timestamptz);

create or replace function fn_content_exposure(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  event_id text,
  event_category text,
  n_runs_exposed bigint,
  n_total_exposures bigint,
  is_rare boolean,
  is_chain boolean,
  is_decisive boolean
)
language sql
stable
as $$
  select
    event_id,
    event_category,
    count(distinct run_id) as n_runs_exposed,
    count(*) filter (where viewed_at is not null) as n_total_exposures,
    bool_or(coalesce(flag_rare, false)) as is_rare,
    bool_or(coalesce(flag_chain, false)) as is_chain,
    bool_or(coalesce(flag_decisive, false)) as is_decisive
  from analytics_decisions
  where event_id is not null
    and (p_start is null or occurred_at >= p_start)
    and (p_end is null or occurred_at <= p_end)
  group by event_id, event_category;
$$;

-- ---------------------------------------------------------------------------
-- fn_overview_summary — the KPI-level aggregates the Overview tab needs
-- beyond the existing per-day fn_overview breakdown: stale count (via
-- analytics_run_status), completion rate, runs/browser, median duration,
-- qualification/victory rates. Duration is completed_at - started_at for
-- completed runs only — an incomplete run has no meaningful duration yet.
-- ---------------------------------------------------------------------------
create or replace function fn_overview_summary(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_app_version text default null,
  p_engine_version text default null,
  p_content_version text default null
)
returns table (
  runs_started bigint,
  runs_completed bigint,
  runs_stale bigint,
  runs_ongoing bigint,
  completion_rate numeric,
  distinct_anonymous_users bigint,
  runs_per_browser numeric,
  median_duration_seconds numeric,
  qualification_rate numeric,
  win_rate numeric
)
language sql
stable
as $$
  with scoped as (
    select *
    from analytics_run_status
    where (p_start is null or started_at >= p_start)
      and (p_end is null or started_at <= p_end)
      and (p_app_version is null or app_version = p_app_version)
      and (p_engine_version is null or engine_version = p_engine_version)
      and (p_content_version is null or content_version = p_content_version)
  )
  select
    count(*) as runs_started,
    count(*) filter (where status = 'completed') as runs_completed,
    count(*) filter (where status = 'stale_incomplete') as runs_stale,
    count(*) filter (where status = 'ongoing') as runs_ongoing,
    round(
      count(*) filter (where status = 'completed')::numeric / nullif(count(*), 0), 4
    ) as completion_rate,
    count(distinct anonymous_user_id) as distinct_anonymous_users,
    round(count(*)::numeric / nullif(count(distinct anonymous_user_id), 0), 2) as runs_per_browser,
    percentile_cont(0.5) within group (
      order by extract(epoch from (completed_at - started_at))
    ) filter (where completed_at is not null) as median_duration_seconds,
    round(
      count(*) filter (where qualified)::numeric
        / nullif(count(*) filter (where status = 'completed'), 0),
      4
    ) as qualification_rate,
    round(
      count(*) filter (where won)::numeric
        / nullif(count(*) filter (where status = 'completed'), 0),
      4
    ) as win_rate
  from scoped;
$$;

-- ---------------------------------------------------------------------------
-- fn_runoff_matchups — a real player x opponent matrix (was only grouped by
-- player_party_id + rank before opponent tracking existed).
-- ---------------------------------------------------------------------------
drop function if exists fn_runoff_matchups(timestamptz, timestamptz, text);

create or replace function fn_runoff_matchups(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_party_id text default null
)
returns table (
  player_party_id text,
  opponent_party_id text,
  n_runoffs bigint,
  n_won bigint,
  win_rate numeric,
  avg_player_score numeric
)
language sql
stable
as $$
  select
    party_id as player_party_id,
    coalesce(runoff_opponent_party_id, 'unknown') as opponent_party_id,
    count(*) as n_runoffs,
    count(*) filter (where won) as n_won,
    round(count(*) filter (where won)::numeric / nullif(count(*), 0), 4) as win_rate,
    avg(second_round_player_score) as avg_player_score
  from analytics_runs
  where second_round_player_rank is not null
    and (p_start is null or started_at >= p_start)
    and (p_end is null or started_at <= p_end)
    and (p_party_id is null or party_id = p_party_id)
  group by party_id, coalesce(runoff_opponent_party_id, 'unknown');
$$;

-- ---------------------------------------------------------------------------
-- Dashboard usage (§8/§16) — opens per run, % of runs with >=1 open.
-- ---------------------------------------------------------------------------
create or replace function fn_dashboard_usage(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  n_runs_with_open bigint,
  n_total_opens bigint,
  n_runs_total bigint,
  share_runs_with_open numeric
)
language sql
stable
as $$
  with opens as (
    select run_id, count(*) as n_opens
    from analytics_events
    where event_type = 'player_dashboard_opened'
      and run_id is not null
      and (p_start is null or occurred_at >= p_start)
      and (p_end is null or occurred_at <= p_end)
    group by run_id
  ),
  runs as (
    select count(*) as n_runs_total
    from analytics_runs
    where (p_start is null or started_at >= p_start)
      and (p_end is null or started_at <= p_end)
  )
  select
    count(opens.run_id) as n_runs_with_open,
    coalesce(sum(opens.n_opens), 0) as n_total_opens,
    runs.n_runs_total,
    round(count(opens.run_id)::numeric / nullif(runs.n_runs_total, 0), 4) as share_runs_with_open
  from runs
  left join opens on true
  group by runs.n_runs_total;
$$;

-- ---------------------------------------------------------------------------
-- Ingestion observability (§12) — summary for the Qualité tab.
-- ---------------------------------------------------------------------------
create or replace function fn_ingestion_health(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  n_batches bigint,
  accepted_total bigint,
  rejected_total bigint,
  duplicate_total bigint,
  rejection_rate numeric,
  top_rejection_reason_codes text[],
  p50_processing_duration_ms numeric,
  p95_processing_duration_ms numeric
)
language sql
stable
as $$
  select
    count(*) as n_batches,
    coalesce(sum(accepted_count), 0) as accepted_total,
    coalesce(sum(rejected_count), 0) as rejected_total,
    coalesce(sum(duplicate_count), 0) as duplicate_total,
    round(
      sum(rejected_count)::numeric / nullif(sum(accepted_count) + sum(rejected_count), 0),
      4
    ) as rejection_rate,
    (
      select array_agg(code order by code)
      from (
        select distinct unnest(rejection_reason_codes) as code
        from analytics_ingestion_batches
        where (p_start is null or received_at >= p_start)
          and (p_end is null or received_at <= p_end)
        limit 10
      ) codes
    ) as top_rejection_reason_codes,
    percentile_cont(0.5) within group (order by processing_duration_ms) as p50_processing_duration_ms,
    percentile_cont(0.95) within group (order by processing_duration_ms) as p95_processing_duration_ms
  from analytics_ingestion_batches
  where (p_start is null or received_at >= p_start)
    and (p_end is null or received_at <= p_end);
$$;

-- ---------------------------------------------------------------------------
-- fn_game_error_summary — counts by errorCode for the Qualité tab. Reads
-- only the closed errorCode field out of the jsonb payload, never the full
-- payload — game_error's payload has no free text to begin with (see
-- src/analytics/events.ts), but this keeps the query itself minimal too.
-- ---------------------------------------------------------------------------
create or replace function fn_game_error_summary(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  error_code text,
  n_occurrences bigint
)
language sql
stable
as $$
  select
    payload->>'errorCode' as error_code,
    count(*) as n_occurrences
  from analytics_events
  where event_type = 'game_error'
    and (p_start is null or occurred_at >= p_start)
    and (p_end is null or occurred_at <= p_end)
  group by payload->>'errorCode'
  order by n_occurrences desc;
$$;

-- ---------------------------------------------------------------------------
-- Extended Data Quality checks (§13). Each is a signal to inspect, never an
-- automatic verdict — see docs/analytics/DATA_QUALITY.md.
-- ---------------------------------------------------------------------------
create or replace view analytics_data_quality as
select
  'runs_decisions_count_mismatch' as check_name,
  count(*) as n_anomalies
from analytics_runs r
where r.decisions_count <> (
  select count(*) from analytics_decisions d where d.run_id = r.run_id
)

union all

select
  'events_occurred_at_after_received_at' as check_name,
  count(*) as n_anomalies
from analytics_events
where occurred_at > received_at + interval '5 minutes'

union all

select
  'runs_completed_without_final_score' as check_name,
  count(*) as n_anomalies
from analytics_runs
where completed_at is not null and final_score is null

union all

select
  'runs_qualified_without_first_round_rank' as check_name,
  count(*) as n_anomalies
from analytics_runs
where qualified is true and first_round_player_rank is null

union all

select
  'decisions_with_out_of_range_roll' as check_name,
  count(*) as n_anomalies
from analytics_decisions
where internal_roll is not null and (internal_roll < 0 or internal_roll > 1)

union all

select
  'decisions_resolved_without_viewed' as check_name,
  count(*) as n_anomalies
from analytics_decisions
where resolved_at is not null and viewed_at is null

union all

select
  'decisions_selected_without_viewed' as check_name,
  count(*) as n_anomalies
from analytics_decisions
where selected_at is not null and viewed_at is null

union all

-- The player UI always fires choice_selected synchronously before
-- resolving (src/features/campaign/campaign-screens.tsx), so a resolved
-- decision with no selected_at should not normally happen.
select
  'decisions_resolved_without_selected' as check_name,
  count(*) as n_anomalies
from analytics_decisions
where resolved_at is not null and selected_at is null

union all

select
  'runs_qualified_without_first_round_score' as check_name,
  count(*) as n_anomalies
from analytics_runs
where qualified is true and first_round_player_score is null

union all

select
  'runs_with_second_round_rank_without_opponent' as check_name,
  count(*) as n_anomalies
from analytics_runs
where second_round_player_rank is not null and runoff_opponent_party_id is null

union all

select
  'decisions_missing_version_columns' as check_name,
  count(*) as n_anomalies
from analytics_decisions
where resolved_at is not null and (app_version is null or engine_version is null or content_version is null)

union all

-- Only ever expected to be non-zero during local development/seeding — a
-- non-zero count against real traffic likely means NEXT_PUBLIC_BUILD_SHA
-- was never set on the deploy platform.
select
  'events_with_dev_build_sha' as check_name,
  count(*) as n_anomalies
from analytics_events
where build_sha = 'dev'

union all

-- Gaps in client_sequence per (run_id, or session_id when no run_id yet)
-- can indicate events lost before ever reaching the ingestion endpoint
-- (queue overflow, a crashed tab). A gap is not proof of loss — the queue's
-- own overflow policy (src/analytics/storage.ts) can also explain it.
select
  'client_sequence_gaps' as check_name,
  count(*) as n_anomalies
from (
  select
    coalesce(run_id, session_id::text) as scope,
    client_sequence,
    client_sequence - lag(client_sequence) over (
      partition by coalesce(run_id, session_id::text) order by client_sequence
    ) as gap
  from analytics_events
) gaps
where gap > 1;
