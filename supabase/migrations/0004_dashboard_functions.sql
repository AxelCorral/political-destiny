-- Filtered dashboard queries — Vers l'Élysée analytics
--
-- The views in 0002_analytics_views.sql are fixed, unfiltered aggregates —
-- useful on their own, but a view's GROUP BY can't take a WHERE clause
-- built from a dashboard filter bar. Rather than pull filtered raw rows out
-- of Postgres and aggregate them in JS (which the mission explicitly wants
-- to avoid, for both correctness and performance reasons), each dashboard
-- tab that needs arbitrary filters gets a small SQL function instead —
-- still server/SQL-side aggregation, just parametrized. Every filter
-- parameter is nullable and follows the same `(param IS NULL OR ...)`
-- pattern, so an unset filter is simply a no-op rather than an error.

create or replace function fn_overview(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_app_version text default null,
  p_engine_version text default null,
  p_content_version text default null
)
returns table (
  day date,
  runs_started bigint,
  runs_completed bigint,
  distinct_anonymous_users bigint,
  decisions_total bigint
)
language sql
stable
as $$
  select
    date_trunc('day', started_at)::date as day,
    count(*) as runs_started,
    count(*) filter (where completed_at is not null) as runs_completed,
    count(distinct anonymous_user_id) as distinct_anonymous_users,
    sum(decisions_count) as decisions_total
  from analytics_runs
  where (p_start is null or started_at >= p_start)
    and (p_end is null or started_at <= p_end)
    and (p_app_version is null or app_version = p_app_version)
    and (p_engine_version is null or engine_version = p_engine_version)
    and (p_content_version is null or content_version = p_content_version)
  group by 1
  order by 1;
$$;

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
  n_qualified bigint,
  n_won bigint,
  qualification_rate numeric,
  win_rate numeric
)
language sql
stable
as $$
  select
    party_id,
    count(*) as n_runs,
    count(*) filter (where completed_at is not null) as n_completed,
    avg(final_score) filter (where completed_at is not null) as avg_final_score,
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
    ) as win_rate
  from analytics_run_status
  where (p_start is null or started_at >= p_start)
    and (p_end is null or started_at <= p_end)
    and (p_app_version is null or app_version = p_app_version)
    and (p_engine_version is null or engine_version = p_engine_version)
    and (p_content_version is null or content_version = p_content_version)
    and (p_status is null or status = p_status)
  group by party_id;
$$;

create or replace function fn_run_funnel(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_app_version text default null,
  p_engine_version text default null,
  p_content_version text default null
)
returns table (
  runs_started bigint,
  reached_first_decision bigint,
  reached_first_round bigint,
  qualified_for_runoff bigint,
  reached_second_round bigint,
  completed bigint
)
language sql
stable
as $$
  select
    count(*) as runs_started,
    count(*) filter (where decisions_count >= 1) as reached_first_decision,
    count(*) filter (where first_round_player_rank is not null) as reached_first_round,
    count(*) filter (where qualified) as qualified_for_runoff,
    count(*) filter (where second_round_player_rank is not null) as reached_second_round,
    count(*) filter (where completed_at is not null) as completed
  from analytics_runs
  where (p_start is null or started_at >= p_start)
    and (p_end is null or started_at <= p_end)
    and (p_app_version is null or app_version = p_app_version)
    and (p_engine_version is null or engine_version = p_engine_version)
    and (p_content_version is null or content_version = p_content_version);
$$;

create or replace function fn_version_health(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  app_version text,
  engine_version text,
  content_version text,
  n_runs bigint,
  n_completed bigint,
  completion_rate numeric
)
language sql
stable
as $$
  select
    app_version,
    engine_version,
    content_version,
    count(*) as n_runs,
    count(*) filter (where completed_at is not null) as n_completed,
    round(
      count(*) filter (where completed_at is not null)::numeric / nullif(count(*), 0),
      4
    ) as completion_rate
  from analytics_runs
  where (p_start is null or started_at >= p_start)
    and (p_end is null or started_at <= p_end)
  group by app_version, engine_version, content_version
  order by n_runs desc;
$$;

create or replace function fn_replay_behavior(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  anonymous_user_id uuid,
  n_runs bigint,
  n_runs_with_resume bigint,
  max_resumed_count int
)
language sql
stable
as $$
  select
    anonymous_user_id,
    count(*) as n_runs,
    count(*) filter (where resumed_count > 0) as n_runs_with_resume,
    max(resumed_count) as max_resumed_count
  from analytics_runs
  where (p_start is null or started_at >= p_start)
    and (p_end is null or started_at <= p_end)
  group by anonymous_user_id;
$$;

create or replace function fn_runoff_matchups(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_party_id text default null
)
returns table (
  player_party_id text,
  second_round_player_rank int,
  n_runoffs bigint,
  n_won bigint
)
language sql
stable
as $$
  select
    party_id as player_party_id,
    second_round_player_rank,
    count(*) as n_runoffs,
    count(*) filter (where won) as n_won
  from analytics_runs
  where second_round_player_rank is not null
    and (p_start is null or started_at >= p_start)
    and (p_end is null or started_at <= p_end)
    and (p_party_id is null or party_id = p_party_id)
  group by party_id, second_round_player_rank;
$$;

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
  n_picked bigint
)
language sql
stable
as $$
  select
    d.event_id,
    d.choice_id,
    d.choice_tag,
    d.choice_strategy,
    count(*) as n_picked
  from analytics_decisions d
  join analytics_runs r on r.run_id = d.run_id
  where (p_start is null or d.occurred_at >= p_start)
    and (p_end is null or d.occurred_at <= p_end)
    and (p_phase is null or d.phase = p_phase)
    and (p_party_id is null or r.party_id = p_party_id)
  group by d.event_id, d.choice_id, d.choice_tag, d.choice_strategy;
$$;

create or replace function fn_decision_health(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_phase text default null
)
returns table (
  event_id text,
  event_category text,
  n_exposures bigint,
  n_distinct_choices_taken bigint,
  avg_internal_roll numeric,
  stddev_internal_roll numeric
)
language sql
stable
as $$
  select
    event_id,
    event_category,
    count(*) as n_exposures,
    count(distinct choice_id) as n_distinct_choices_taken,
    avg(internal_roll) as avg_internal_roll,
    stddev_samp(internal_roll) as stddev_internal_roll
  from analytics_decisions
  where (p_start is null or occurred_at >= p_start)
    and (p_end is null or occurred_at <= p_end)
    and (p_phase is null or phase = p_phase)
  group by event_id, event_category;
$$;

create or replace function fn_content_exposure(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  event_id text,
  event_category text,
  n_runs_exposed bigint,
  n_total_exposures bigint
)
language sql
stable
as $$
  select
    event_id,
    event_category,
    count(distinct run_id) as n_runs_exposed,
    count(*) as n_total_exposures
  from analytics_decisions
  where (p_start is null or occurred_at >= p_start)
    and (p_end is null or occurred_at <= p_end)
  group by event_id, event_category;
$$;
