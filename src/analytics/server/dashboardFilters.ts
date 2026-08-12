import { parties } from "@/game/data/parties";

/**
 * Same 9 phase values as GamePhase (src/game/types/index.ts) — copied here
 * (not imported) because it's a union type with no runtime array, and this
 * is the one place that needs one. Any drift would be caught by the
 * gamePhaseOptions test in dashboardFilters.test.ts.
 */
export const PHASE_OPTIONS = [
  "setup",
  "pre_campaign",
  "campaign",
  "official_campaign",
  "first_round",
  "between_rounds",
  "second_round",
  "government_epilogue",
  "finished",
] as const;

export const STATUS_OPTIONS = ["ongoing", "completed", "stale_incomplete"] as const;

export const PARTY_OPTIONS = parties.map((party) => ({
  id: party.id,
  label: party.shortName,
}));

export interface DashboardFilters {
  start?: string;
  end?: string;
  partyId?: string;
  appVersion?: string;
  engineVersion?: string;
  contentVersion?: string;
  status?: (typeof STATUS_OPTIONS)[number];
  phase?: (typeof PHASE_OPTIONS)[number];
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

function readString(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single && single.length > 0 ? single : undefined;
}

export function parseDashboardFilters(searchParams: RawSearchParams): DashboardFilters {
  const status = readString(searchParams, "status");
  const phase = readString(searchParams, "phase");
  return {
    start: readString(searchParams, "start"),
    end: readString(searchParams, "end"),
    partyId: readString(searchParams, "party"),
    appVersion: readString(searchParams, "app_version"),
    engineVersion: readString(searchParams, "engine_version"),
    contentVersion: readString(searchParams, "content_version"),
    status: (STATUS_OPTIONS as readonly string[]).includes(status ?? "")
      ? (status as DashboardFilters["status"])
      : undefined,
    phase: (PHASE_OPTIONS as readonly string[]).includes(phase ?? "")
      ? (phase as DashboardFilters["phase"])
      : undefined,
  };
}

/** Serializes filters back to a query string, used by tab links and CSV export hrefs. */
export function filtersToSearchParams(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  if (filters.partyId) params.set("party", filters.partyId);
  if (filters.appVersion) params.set("app_version", filters.appVersion);
  if (filters.engineVersion) params.set("engine_version", filters.engineVersion);
  if (filters.contentVersion) params.set("content_version", filters.contentVersion);
  if (filters.status) params.set("status", filters.status);
  if (filters.phase) params.set("phase", filters.phase);
  return params;
}
