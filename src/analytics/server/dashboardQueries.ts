import type { SupabaseClient } from "@supabase/supabase-js";

import type { DashboardFilters } from "./dashboardFilters";

function commonArgs(filters: DashboardFilters) {
  return {
    p_start: filters.start ?? null,
    p_end: filters.end ?? null,
  };
}

function versionArgs(filters: DashboardFilters) {
  return {
    ...commonArgs(filters),
    p_app_version: filters.appVersion ?? null,
    p_engine_version: filters.engineVersion ?? null,
    p_content_version: filters.contentVersion ?? null,
  };
}

export interface OverviewRow {
  day: string;
  runs_started: number;
  runs_completed: number;
  distinct_anonymous_users: number;
  decisions_total: number;
}

export async function getOverview(
  supabase: SupabaseClient,
  filters: DashboardFilters,
): Promise<OverviewRow[]> {
  const { data, error } = await supabase.rpc("fn_overview", versionArgs(filters));
  if (error) throw error;
  return (data ?? []) as OverviewRow[];
}

export interface PartyPerformanceRow {
  party_id: string;
  n_runs: number;
  n_completed: number;
  avg_final_score: number | null;
  n_qualified: number;
  n_won: number;
  qualification_rate: number | null;
  win_rate: number | null;
}

export async function getPartyPerformance(
  supabase: SupabaseClient,
  filters: DashboardFilters,
): Promise<PartyPerformanceRow[]> {
  const { data, error } = await supabase.rpc("fn_party_performance", {
    ...versionArgs(filters),
    p_status: filters.status ?? null,
  });
  if (error) throw error;
  return (data ?? []) as PartyPerformanceRow[];
}

export interface RunFunnelRow {
  runs_started: number;
  reached_first_decision: number;
  reached_first_round: number;
  qualified_for_runoff: number;
  reached_second_round: number;
  completed: number;
}

export async function getRunFunnel(
  supabase: SupabaseClient,
  filters: DashboardFilters,
): Promise<RunFunnelRow | undefined> {
  const { data, error } = await supabase.rpc("fn_run_funnel", versionArgs(filters));
  if (error) throw error;
  return (data as RunFunnelRow[] | null)?.[0];
}

export interface VersionHealthRow {
  app_version: string;
  engine_version: string;
  content_version: string;
  n_runs: number;
  n_completed: number;
  completion_rate: number | null;
}

export async function getVersionHealth(
  supabase: SupabaseClient,
  filters: DashboardFilters,
): Promise<VersionHealthRow[]> {
  const { data, error } = await supabase.rpc("fn_version_health", commonArgs(filters));
  if (error) throw error;
  return (data ?? []) as VersionHealthRow[];
}

export interface ReplayBehaviorRow {
  anonymous_user_id: string;
  n_runs: number;
  n_runs_with_resume: number;
  max_resumed_count: number;
}

export async function getReplayBehavior(
  supabase: SupabaseClient,
  filters: DashboardFilters,
): Promise<ReplayBehaviorRow[]> {
  const { data, error } = await supabase.rpc("fn_replay_behavior", commonArgs(filters));
  if (error) throw error;
  return (data ?? []) as ReplayBehaviorRow[];
}

export interface RunoffMatchupRow {
  player_party_id: string;
  second_round_player_rank: number;
  n_runoffs: number;
  n_won: number;
}

export async function getRunoffMatchups(
  supabase: SupabaseClient,
  filters: DashboardFilters,
): Promise<RunoffMatchupRow[]> {
  const { data, error } = await supabase.rpc("fn_runoff_matchups", {
    ...commonArgs(filters),
    p_party_id: filters.partyId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as RunoffMatchupRow[];
}

export interface EventChoiceDistributionRow {
  event_id: string;
  choice_id: string;
  choice_tag: string | null;
  choice_strategy: string | null;
  n_picked: number;
}

export async function getEventChoiceDistribution(
  supabase: SupabaseClient,
  filters: DashboardFilters,
): Promise<EventChoiceDistributionRow[]> {
  const { data, error } = await supabase.rpc("fn_event_choice_distribution", {
    ...commonArgs(filters),
    p_phase: filters.phase ?? null,
    p_party_id: filters.partyId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as EventChoiceDistributionRow[];
}

export interface DecisionHealthRow {
  event_id: string;
  event_category: string;
  n_exposures: number;
  n_distinct_choices_taken: number;
  avg_internal_roll: number | null;
  stddev_internal_roll: number | null;
}

export async function getDecisionHealth(
  supabase: SupabaseClient,
  filters: DashboardFilters,
): Promise<DecisionHealthRow[]> {
  const { data, error } = await supabase.rpc("fn_decision_health", {
    ...commonArgs(filters),
    p_phase: filters.phase ?? null,
  });
  if (error) throw error;
  return (data ?? []) as DecisionHealthRow[];
}

export interface ContentExposureRow {
  event_id: string;
  event_category: string;
  n_runs_exposed: number;
  n_total_exposures: number;
}

export async function getContentExposure(
  supabase: SupabaseClient,
  filters: DashboardFilters,
): Promise<ContentExposureRow[]> {
  const { data, error } = await supabase.rpc("fn_content_exposure", commonArgs(filters));
  if (error) throw error;
  return (data ?? []) as ContentExposureRow[];
}

export interface DataQualityRow {
  check_name: string;
  n_anomalies: number;
}

export async function getDataQuality(supabase: SupabaseClient): Promise<DataQualityRow[]> {
  const { data, error } = await supabase.from("analytics_data_quality").select("*");
  if (error) throw error;
  return (data ?? []) as DataQualityRow[];
}
