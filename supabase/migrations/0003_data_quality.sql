-- Data quality checks — Vers l'Élysée analytics
-- One row per check, each exposing a count of anomalies. The dashboard sums
-- n_anomalies across rows for the single "anomalies de données" counter
-- required in the Qualité tab. A check firing does not by itself mean the
-- game is broken — it means the row deserves a look before trusting it.

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
where internal_roll < 0 or internal_roll > 1;
