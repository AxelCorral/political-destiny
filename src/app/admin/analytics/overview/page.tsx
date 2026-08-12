import {
  filtersToSearchParams,
  parseDashboardFilters,
  type RawSearchParams,
} from "@/analytics/server/dashboardFilters";
import { getOverview, getOverviewSummary } from "@/analytics/server/dashboardQueries";
import {
  getSupabaseAdminClient,
  isAnalyticsStorageConfigured,
} from "@/analytics/server/supabaseAdmin";

import { DashboardFilterBar } from "../_components/filter-bar";
import { EmptyState, KpiCard, SectionCaution } from "../_components/dashboard-ui";
import { NotConfiguredNotice } from "../_components/not-configured";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseDashboardFilters(await searchParams);

  if (!isAnalyticsStorageConfigured()) {
    return (
      <div>
        <DashboardFilterBar pathname="/admin/analytics/overview" filters={filters} />
        <NotConfiguredNotice />
      </div>
    );
  }

  const supabase = getSupabaseAdminClient()!;
  const [rows, summary] = await Promise.all([
    getOverview(supabase, filters),
    getOverviewSummary(supabase, filters),
  ]);
  const decisionsTotal = rows.reduce((sum, row) => sum + row.decisions_total, 0);

  return (
    <div>
      <DashboardFilterBar pathname="/admin/analytics/overview" filters={filters} />
      <p className="mb-4 rounded-lg border border-[var(--line)] bg-blue-50 p-3 text-xs font-bold text-[var(--blue-700)]">
        Statistiques basées uniquement sur les parties pour lesquelles les statistiques anonymes ont
        été activées.
      </p>
      <SectionCaution>
        Volumes bruts sur la période filtrée. anonymous_user_id désigne un navigateur, pas une
        personne précise — deux valeurs peuvent correspondre à la même personne sur deux appareils,
        une valeur peut aussi correspondre à plusieurs personnes sur un appareil partagé.
      </SectionCaution>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Campagnes commencées" value={summary?.runs_started ?? 0} />
        <KpiCard label="Campagnes terminées" value={summary?.runs_completed ?? 0} />
        <KpiCard label="Campagnes inactives (stale)" value={summary?.runs_stale ?? 0} />
        <KpiCard label="Campagnes en cours" value={summary?.runs_ongoing ?? 0} />
        <KpiCard
          label="Taux de complétion"
          value={
            summary?.completion_rate !== undefined && summary?.completion_rate !== null
              ? `${(summary.completion_rate * 100).toFixed(0)}%`
              : "—"
          }
        />
        <KpiCard
          label="Navigateurs anonymes distincts"
          value={summary?.distinct_anonymous_users ?? 0}
        />
        <KpiCard
          label="Campagnes / navigateur"
          value={summary?.runs_per_browser?.toFixed(2) ?? "—"}
        />
        <KpiCard
          label="Durée médiane (min)"
          value={
            summary?.median_duration_seconds !== undefined &&
            summary?.median_duration_seconds !== null
              ? Math.round(summary.median_duration_seconds / 60)
              : "—"
          }
        />
        <KpiCard
          label="Taux de qualification"
          value={
            summary?.qualification_rate !== undefined && summary?.qualification_rate !== null
              ? `${(summary.qualification_rate * 100).toFixed(0)}%`
              : "—"
          }
        />
        <KpiCard
          label="Taux de victoire"
          value={
            summary?.win_rate !== undefined && summary?.win_rate !== null
              ? `${(summary.win_rate * 100).toFixed(0)}%`
              : "—"
          }
        />
        <KpiCard label="Décisions résolues" value={decisionsTotal} />
      </div>
      <div className="mt-6 flex justify-end">
        <a
          href={`/api/admin/analytics/export?view=overview&${filtersToSearchParams(filters).toString()}`}
          className="text-xs font-bold text-[var(--blue-600)] underline"
        >
          Exporter en CSV
        </a>
      </div>
      <div className="mt-2">
        {rows.length === 0 ? (
          <EmptyState>Aucune donnée sur cette période/ces filtres.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[var(--surface-raised)] text-xs uppercase text-[var(--ink-muted)]">
                <tr>
                  <th className="px-3 py-2">Jour</th>
                  <th className="px-3 py-2">Commencées</th>
                  <th className="px-3 py-2">Terminées</th>
                  <th className="px-3 py-2">Utilisateurs distincts</th>
                  <th className="px-3 py-2">Décisions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.day} className="border-t border-[var(--line)]">
                    <td className="px-3 py-2 font-mono text-xs">{row.day}</td>
                    <td className="px-3 py-2">{row.runs_started}</td>
                    <td className="px-3 py-2">{row.runs_completed}</td>
                    <td className="px-3 py-2">{row.distinct_anonymous_users}</td>
                    <td className="px-3 py-2">{row.decisions_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
