import {
  filtersToSearchParams,
  parseDashboardFilters,
  type RawSearchParams,
} from "@/analytics/server/dashboardFilters";
import { getOverview } from "@/analytics/server/dashboardQueries";
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
  const rows = await getOverview(supabase, filters);
  const totals = rows.reduce(
    (acc, row) => ({
      started: acc.started + row.runs_started,
      completed: acc.completed + row.runs_completed,
      decisions: acc.decisions + row.decisions_total,
      users: Math.max(acc.users, row.distinct_anonymous_users),
    }),
    { started: 0, completed: 0, decisions: 0, users: 0 },
  );

  return (
    <div>
      <DashboardFilterBar pathname="/admin/analytics/overview" filters={filters} />
      <SectionCaution>
        Volumes bruts sur la période filtrée. anonymous_user_id désigne un navigateur, pas une
        personne précise — deux valeurs peuvent correspondre à la même personne sur deux appareils,
        une valeur peut aussi correspondre à plusieurs personnes sur un appareil partagé.
      </SectionCaution>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Campagnes commencées" value={totals.started} />
        <KpiCard label="Campagnes terminées" value={totals.completed} />
        <KpiCard label="Décisions résolues" value={totals.decisions} />
        <KpiCard label="Utilisateurs anonymes distincts (jour max)" value={totals.users} />
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
