import { parseDashboardFilters, type RawSearchParams } from "@/analytics/server/dashboardFilters";
import { getContentExposure, getVersionHealth } from "@/analytics/server/dashboardQueries";
import {
  getSupabaseAdminClient,
  isAnalyticsStorageConfigured,
} from "@/analytics/server/supabaseAdmin";

import { DashboardFilterBar } from "../_components/filter-bar";
import { EmptyState, SectionCaution } from "../_components/dashboard-ui";
import { NotConfiguredNotice } from "../_components/not-configured";

export default async function VersionsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseDashboardFilters(await searchParams);

  if (!isAnalyticsStorageConfigured()) {
    return (
      <div>
        <DashboardFilterBar pathname="/admin/analytics/versions" filters={filters} />
        <NotConfiguredNotice />
      </div>
    );
  }

  const supabase = getSupabaseAdminClient()!;
  const [versions, exposure] = await Promise.all([
    getVersionHealth(supabase, filters),
    getContentExposure(supabase, filters),
  ]);
  const leastExposed = [...exposure]
    .sort((a, b) => a.n_runs_exposed - b.n_runs_exposed)
    .slice(0, 20);

  return (
    <div>
      <DashboardFilterBar pathname="/admin/analytics/versions" filters={filters} />
      <SectionCaution>
        Une baisse du taux de complétion après un déploiement est un signal à investiguer, pas une
        preuve automatique de régression — le volume (n_runs) et la période comptent.
      </SectionCaution>
      {versions.length === 0 ? (
        <EmptyState>Aucune donnée sur ces filtres.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-[var(--surface-raised)] text-xs uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-2">app_version</th>
                <th className="px-3 py-2">engine_version</th>
                <th className="px-3 py-2">content_version</th>
                <th className="px-3 py-2">n_runs</th>
                <th className="px-3 py-2">n_completed</th>
                <th className="px-3 py-2">Taux de complétion</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((row) => (
                <tr
                  key={`${row.app_version}:${row.engine_version}:${row.content_version}`}
                  className="border-t border-[var(--line)]"
                >
                  <td className="px-3 py-2 font-mono text-xs">{row.app_version}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.engine_version}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.content_version}</td>
                  <td className="px-3 py-2">{row.n_runs}</td>
                  <td className="px-3 py-2">{row.n_completed}</td>
                  <td className="px-3 py-2">
                    {row.completion_rate !== null
                      ? `${(row.completion_rate * 100).toFixed(0)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-lg font-black">
        Contenu le moins exposé (20 événements les plus rares)
      </h2>
      <SectionCaution>
        Un événement peu exposé n’est pas nécessairement un problème — il peut avoir des conditions
        d’apparition rares par conception.
      </SectionCaution>
      {leastExposed.length === 0 ? (
        <EmptyState>Aucune donnée sur ces filtres.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-[var(--surface-raised)] text-xs uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-2">Événement</th>
                <th className="px-3 py-2">Catégorie</th>
                <th className="px-3 py-2">Runs exposés</th>
                <th className="px-3 py-2">Expositions totales</th>
              </tr>
            </thead>
            <tbody>
              {leastExposed.map((row) => (
                <tr key={row.event_id} className="border-t border-[var(--line)]">
                  <td className="px-3 py-2 font-mono text-xs">{row.event_id}</td>
                  <td className="px-3 py-2">{row.event_category}</td>
                  <td className="px-3 py-2">{row.n_runs_exposed}</td>
                  <td className="px-3 py-2">{row.n_total_exposures}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
