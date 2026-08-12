import {
  filtersToSearchParams,
  parseDashboardFilters,
  type RawSearchParams,
} from "@/analytics/server/dashboardFilters";
import { getPartyPerformance } from "@/analytics/server/dashboardQueries";
import {
  getSupabaseAdminClient,
  isAnalyticsStorageConfigured,
} from "@/analytics/server/supabaseAdmin";

import { DashboardFilterBar } from "../_components/filter-bar";
import { EmptyState, SectionCaution, SimpleBar } from "../_components/dashboard-ui";
import { NotConfiguredNotice } from "../_components/not-configured";

export default async function EquilibragePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseDashboardFilters(await searchParams);

  if (!isAnalyticsStorageConfigured()) {
    return (
      <div>
        <DashboardFilterBar pathname="/admin/analytics/equilibrage" filters={filters} showStatus />
        <NotConfiguredNotice />
      </div>
    );
  }

  const supabase = getSupabaseAdminClient()!;
  const rows = await getPartyPerformance(supabase, filters);

  return (
    <div>
      <DashboardFilterBar pathname="/admin/analytics/equilibrage" filters={filters} showStatus />
      <SectionCaution>
        Ce tableau ne constitue jamais un classement officiel des partis, et un taux de victoire ou
        de qualification bas ne signifie pas qu’un parti est « cassé » ou « déséquilibré » — la
        méthode de jeu du joueur, la taille d’échantillon (n) et la période comptent tout autant.
        Toujours lire n_runs et n_completed avant d’interpréter un taux.
      </SectionCaution>
      <div className="mb-2 flex justify-end">
        <a
          href={`/api/admin/analytics/export?view=party_performance&${filtersToSearchParams(filters).toString()}`}
          className="text-xs font-bold text-[var(--blue-600)] underline"
        >
          Exporter en CSV
        </a>
      </div>
      {rows.length === 0 ? (
        <EmptyState>Aucune donnée sur ces filtres.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--surface-raised)] text-xs uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-2">Parti</th>
                <th className="px-3 py-2">n_runs</th>
                <th className="px-3 py-2">n_completed</th>
                <th className="px-3 py-2">Score T1 moyen / médian</th>
                <th className="px-3 py-2">Score final moyen</th>
                <th className="px-3 py-2">Taux de qualification</th>
                <th className="px-3 py-2">Taux de victoire</th>
                <th className="px-3 py-2">Victoire | qualifié</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.party_id} className="border-t border-[var(--line)]">
                  <td className="px-3 py-2 font-bold">{row.party_id}</td>
                  <td className="px-3 py-2">{row.n_runs}</td>
                  <td className="px-3 py-2">{row.n_completed}</td>
                  <td className="px-3 py-2">
                    {row.avg_first_round_score?.toFixed(1) ?? "—"} /{" "}
                    {row.median_first_round_score?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-3 py-2">{row.avg_final_score?.toFixed(1) ?? "—"}</td>
                  <td className="px-3 py-2">
                    <SimpleBar
                      ratio={row.qualification_rate ?? 0}
                      label={
                        row.qualification_rate !== null
                          ? `${(row.qualification_rate * 100).toFixed(0)}% (n=${row.n_completed})`
                          : `n=${row.n_completed}`
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <SimpleBar
                      ratio={row.win_rate ?? 0}
                      label={
                        row.win_rate !== null
                          ? `${(row.win_rate * 100).toFixed(0)}% (n=${row.n_completed})`
                          : `n=${row.n_completed}`
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    {row.win_rate_given_qualified !== null
                      ? `${(row.win_rate_given_qualified * 100).toFixed(0)}% (n=${row.n_qualified})`
                      : `n=${row.n_qualified}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
