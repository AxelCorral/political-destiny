-- Analytics dashboard views — Vers l'Élysée
-- All aggregation happens here, server-side in SQL, never client-side. Every
-- view that reports a rate or an average also exposes the underlying n, so
-- the dashboard can (and must) show sample size next to any percentage.

-- ---------------------------------------------------------------------------
-- analytics_settings — small key/value config table, so operational
-- thresholds (like the stale-run window) can be tuned without a redeploy.
-- A plain SQL view has no access to a Next.js env var at read time, so this
-- table — not ANALYTICS_STALE_RUN_HOURS — is the actual source of truth at
-- query time. ANALYTICS_STALE_RUN_HOURS (.env.example) only documents the
-- intended default; applying a change means running the SQL in
-- docs/analytics/DATA_DICTIONARY.md against this table.
-- ---------------------------------------------------------------------------
create table if not exists analytics_settings (
  key text primary key,
  value text not null
);

insert into analytics_settings (key, value)
values ('stale_run_hours', '48')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- analytics_run_status — derives ongoing / completed / stale_incomplete.
-- "stale_incomplete" is never rendered or reasoned about as "abandoned": a
-- resumed run simply starts producing events again and reverts to "ongoing"
-- on its next event, because status is computed at read time, not stored.
-- ---------------------------------------------------------------------------
create or replace view analytics_run_status as
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

-- ---------------------------------------------------------------------------
-- overview_daily — top-level daily activity, for the "Overview" tab.
-- ---------------------------------------------------------------------------
create or replace view overview_daily as
select
  date_trunc('day', started_at) as day,
  count(*) as runs_started,
  count(*) filter (where completed_at is not null) as runs_completed,
  count(distinct anonymous_user_id) as distinct_anonymous_users,
  sum(decisions_count) as decisions_total,
  app_version,
  engine_version,
  content_version
from analytics_runs
group by 1, app_version, engine_version, content_version;

-- ---------------------------------------------------------------------------
-- party_performance — one row per party. Always carries n; never labels a
-- party "cassé"/"déséquilibré" in the data itself — that judgment stays out
-- of SQL and out of the dashboard copy.
-- ---------------------------------------------------------------------------
create or replace view party_performance as
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
from analytics_runs
group by party_id;

-- ---------------------------------------------------------------------------
-- run_funnel — coarse step counts for the Gameplay tab. Each step is a
-- strict count, never presented as a "drop-off caused by X" — only as a
-- volume at each stage, since the underlying cause is not observable.
-- ---------------------------------------------------------------------------
create or replace view run_funnel as
select
  app_version,
  engine_version,
  content_version,
  count(*) as runs_started,
  count(*) filter (where decisions_count >= 1) as reached_first_decision,
  count(*) filter (where first_round_player_rank is not null) as reached_first_round,
  count(*) filter (where qualified) as qualified_for_runoff,
  count(*) filter (where second_round_player_rank is not null) as reached_second_round,
  count(*) filter (where completed_at is not null) as completed
from analytics_runs
group by app_version, engine_version, content_version;

-- ---------------------------------------------------------------------------
-- event_choice_distribution — per (event_id, choice_id): how often each
-- choice is picked among runs that saw that event. n_event_exposures is the
-- denominator, always shown alongside the share.
-- ---------------------------------------------------------------------------
create or replace view event_choice_distribution as
select
  event_id,
  choice_id,
  choice_tag,
  choice_strategy,
  count(*) as n_picked,
  sum(count(*)) over (partition by event_id) as n_event_exposures,
  round(
    count(*)::numeric / nullif(sum(count(*)) over (partition by event_id), 0),
    4
  ) as share_of_event
from analytics_decisions
group by event_id, choice_id, choice_tag, choice_strategy;

-- ---------------------------------------------------------------------------
-- decision_health — per event_id: exposure volume and dispersion of the
-- internal roll, useful to spot an event whose outcome distribution looks
-- degenerate (e.g. always the same roll bucket) without asserting why.
-- ---------------------------------------------------------------------------
create or replace view decision_health as
select
  event_id,
  event_category,
  count(*) as n_exposures,
  count(distinct choice_id) as n_distinct_choices_taken,
  count(distinct outcome_id) as n_distinct_outcomes,
  avg(internal_roll) as avg_internal_roll,
  stddev_samp(internal_roll) as stddev_internal_roll
from analytics_decisions
group by event_id, event_category;

-- ---------------------------------------------------------------------------
-- runoff_matchups — pairs of parties reaching the second round together, and
-- how often the player's party won that runoff. n always shown; never
-- rendered as a ranking of parties.
-- ---------------------------------------------------------------------------
create or replace view runoff_matchups as
select
  party_id as player_party_id,
  second_round_player_rank,
  count(*) as n_runoffs,
  count(*) filter (where won) as n_won
from analytics_runs
where second_round_player_rank is not null
group by party_id, second_round_player_rank;

-- ---------------------------------------------------------------------------
-- replay_behavior — per anonymous_user_id: how many runs, how many were
-- resumed after a gap. anonymous_user_id is a browser-scoped identifier, not
-- a person — documented again here so the dashboard never overstates it.
-- ---------------------------------------------------------------------------
create or replace view replay_behavior as
select
  anonymous_user_id,
  count(*) as n_runs,
  count(*) filter (where resumed_count > 0) as n_runs_with_resume,
  max(resumed_count) as max_resumed_count,
  min(started_at) as first_run_started_at,
  max(started_at) as last_run_started_at
from analytics_runs
group by anonymous_user_id;

-- ---------------------------------------------------------------------------
-- version_health — volume and completion rate per version triple, so a
-- deploy that regresses completion is visible without guessing why.
-- ---------------------------------------------------------------------------
create or replace view version_health as
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
group by app_version, engine_version, content_version;

-- ---------------------------------------------------------------------------
-- content_exposure — how many distinct runs saw each event_id, useful to
-- spot content that is rarely or never reached given current selection
-- weights, without asserting that this is a problem.
-- ---------------------------------------------------------------------------
create or replace view content_exposure as
select
  event_id,
  event_category,
  count(distinct run_id) as n_runs_exposed,
  count(*) as n_total_exposures
from analytics_decisions
group by event_id, event_category;
