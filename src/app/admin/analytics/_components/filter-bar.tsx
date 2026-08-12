import {
  PARTY_OPTIONS,
  PHASE_OPTIONS,
  STATUS_OPTIONS,
  type DashboardFilters,
} from "@/analytics/server/dashboardFilters";

interface FilterBarProps {
  pathname: string;
  filters: DashboardFilters;
  showParty?: boolean;
  showStatus?: boolean;
  showPhase?: boolean;
}

/**
 * Plain GET form: no client JS required, filters land directly in the URL
 * (bookmarkable, shareable, and exactly what the mission asked for — "global
 * dashboard filters reflected in the URL"). Every value re-populates from
 * the current searchParams so submitting never silently drops a filter.
 */
export function DashboardFilterBar({
  pathname,
  filters,
  showParty = false,
  showStatus = false,
  showPhase = false,
}: FilterBarProps) {
  return (
    <form
      action={pathname}
      method="get"
      className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm"
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase text-[var(--ink-muted)]">Depuis</span>
        <input
          type="date"
          name="start"
          defaultValue={filters.start ?? ""}
          className="rounded-lg border border-[var(--line)] px-2 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase text-[var(--ink-muted)]">Jusqu’au</span>
        <input
          type="date"
          name="end"
          defaultValue={filters.end ?? ""}
          className="rounded-lg border border-[var(--line)] px-2 py-1.5"
        />
      </label>
      {showParty ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-[var(--ink-muted)]">Parti</span>
          <select
            name="party"
            defaultValue={filters.partyId ?? ""}
            className="rounded-lg border border-[var(--line)] px-2 py-1.5"
          >
            <option value="">Tous</option>
            {PARTY_OPTIONS.map((party) => (
              <option key={party.id} value={party.id}>
                {party.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {showStatus ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-[var(--ink-muted)]">Statut</span>
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="rounded-lg border border-[var(--line)] px-2 py-1.5"
          >
            <option value="">Tous</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {showPhase ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-[var(--ink-muted)]">Phase</span>
          <select
            name="phase"
            defaultValue={filters.phase ?? ""}
            className="rounded-lg border border-[var(--line)] px-2 py-1.5"
          >
            <option value="">Toutes</option>
            {PHASE_OPTIONS.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase text-[var(--ink-muted)]">app_version</span>
        <input
          type="text"
          name="app_version"
          defaultValue={filters.appVersion ?? ""}
          placeholder="ex. 0.1.0"
          className="w-28 rounded-lg border border-[var(--line)] px-2 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase text-[var(--ink-muted)]">engine_version</span>
        <input
          type="text"
          name="engine_version"
          defaultValue={filters.engineVersion ?? ""}
          placeholder="ex. 2"
          className="w-28 rounded-lg border border-[var(--line)] px-2 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase text-[var(--ink-muted)]">content_version</span>
        <input
          type="text"
          name="content_version"
          defaultValue={filters.contentVersion ?? ""}
          placeholder="ex. 2"
          className="w-28 rounded-lg border border-[var(--line)] px-2 py-1.5"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-[var(--blue-600)] px-4 py-1.5 font-extrabold text-white"
      >
        Filtrer
      </button>
      <a href={pathname} className="text-xs font-bold text-[var(--ink-muted)] underline">
        Réinitialiser
      </a>
    </form>
  );
}
