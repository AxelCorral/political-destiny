import { parseDashboardFilters, type RawSearchParams } from "@/analytics/server/dashboardFilters";
import {
  getDecisionHealth,
  getEventChoiceDistribution,
  getRunFunnel,
} from "@/analytics/server/dashboardQueries";
import {
  getSupabaseAdminClient,
  isAnalyticsStorageConfigured,
} from "@/analytics/server/supabaseAdmin";

import { DashboardFilterBar } from "../_components/filter-bar";
import { EmptyState, KpiCard, SectionCaution } from "../_components/dashboard-ui";
import { NotConfiguredNotice } from "../_components/not-configured";

export default async function GameplayPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseDashboardFilters(await searchParams);

  if (!isAnalyticsStorageConfigured()) {
    return (
      <div>
        <DashboardFilterBar
          pathname="/admin/analytics/gameplay"
          filters={filters}
          showParty
          showPhase
        />
        <NotConfiguredNotice />
      </div>
    );
  }

  const supabase = getSupabaseAdminClient()!;
  const [funnel, choices, health] = await Promise.all([
    getRunFunnel(supabase, filters),
    getEventChoiceDistribution(supabase, filters),
    getDecisionHealth(supabase, filters),
  ]);

  const topChoices = [...choices].sort((a, b) => b.n_picked - a.n_picked).slice(0, 30);
  const topHealth = [...health].sort((a, b) => b.n_exposures - a.n_exposures).slice(0, 30);

  return (
    <div>
      <DashboardFilterBar
        pathname="/admin/analytics/gameplay"
        filters={filters}
        showParty
        showPhase
      />
      <SectionCaution>
        Chaque étape est un volume, jamais une explication de la baisse observée : le funnel ne dit
        pas pourquoi une campagne s’arrête à une étape donnée.
      </SectionCaution>
      {funnel ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Commencées" value={funnel.runs_started} />
          <KpiCard label="1ère décision" value={funnel.reached_first_decision} />
          <KpiCard label="1er tour atteint" value={funnel.reached_first_round} />
          <KpiCard label="Qualifiées 2nd tour" value={funnel.qualified_for_runoff} />
          <KpiCard label="2nd tour atteint" value={funnel.reached_second_round} />
          <KpiCard label="Terminées" value={funnel.completed} />
        </div>
      ) : (
        <EmptyState>Aucune donnée de funnel sur ces filtres.</EmptyState>
      )}

      <h2 className="mt-8 text-lg font-black">Choix les plus pris (top 30)</h2>
      <SectionCaution>
        « Part de sélection » = sélections / expositions réelles (decision_viewed), pas sur le
        nombre de fois où un choix a été pris parmi les autres choix. Signalé à titre indicatif
        au-delà de 80 % (dominant), au-delà de 90 % (très dominant) ou en dessous de 5 % (quasi
        jamais choisi) — un signal à examiner, jamais une preuve de déséquilibre.
      </SectionCaution>
      {topChoices.length === 0 ? (
        <EmptyState>Aucune décision sur ces filtres.</EmptyState>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--surface-raised)] text-xs uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-2">Événement</th>
                <th className="px-3 py-2">Choix</th>
                <th className="px-3 py-2">Tag</th>
                <th className="px-3 py-2">Stratégie</th>
                <th className="px-3 py-2">n expositions</th>
                <th className="px-3 py-2">n pris</th>
                <th className="px-3 py-2">Part de sélection</th>
              </tr>
            </thead>
            <tbody>
              {topChoices.map((row) => {
                const share = row.selection_share;
                const flagged = share !== null && (share > 0.9 || share > 0.8 || share < 0.05);
                return (
                  <tr
                    key={`${row.event_id}:${row.choice_id}`}
                    className="border-t border-[var(--line)]"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{row.event_id}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.choice_id}</td>
                    <td className="px-3 py-2">{row.choice_tag ?? "—"}</td>
                    <td className="px-3 py-2">{row.choice_strategy ?? "—"}</td>
                    <td className="px-3 py-2">{row.n_event_exposures}</td>
                    <td className="px-3 py-2">{row.n_picked}</td>
                    <td
                      className={`px-3 py-2 ${flagged ? "font-black text-[var(--warning)]" : ""}`}
                    >
                      {share !== null ? `${(share * 100).toFixed(0)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-lg font-black">Santé des décisions (top 30 par exposition)</h2>
      <SectionCaution>
        Un écart-type d’internal_roll proche de zéro sur un fort volume peut indiquer une décision
        dont l’issue est presque toujours la même — un signal à vérifier, pas une preuve de bug. La
        latence médiane exclut les décisions restées visibles plus de 2 heures (onglet oublié).
      </SectionCaution>
      {topHealth.length === 0 ? (
        <EmptyState>Aucune donnée sur ces filtres.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--surface-raised)] text-xs uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-2">Événement</th>
                <th className="px-3 py-2">Catégorie</th>
                <th className="px-3 py-2">n expositions</th>
                <th className="px-3 py-2">n résolues</th>
                <th className="px-3 py-2">Latence médiane</th>
                <th className="px-3 py-2">Choix distincts</th>
                <th className="px-3 py-2">roll moyen</th>
                <th className="px-3 py-2">écart-type</th>
              </tr>
            </thead>
            <tbody>
              {topHealth.map((row) => (
                <tr key={row.event_id} className="border-t border-[var(--line)]">
                  <td className="px-3 py-2 font-mono text-xs">{row.event_id}</td>
                  <td className="px-3 py-2">{row.event_category}</td>
                  <td className="px-3 py-2">{row.n_exposures}</td>
                  <td className="px-3 py-2">{row.n_resolved}</td>
                  <td className="px-3 py-2">
                    {row.median_latency_ms !== null
                      ? `${(row.median_latency_ms / 1000).toFixed(1)}s`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{row.n_distinct_choices_taken}</td>
                  <td className="px-3 py-2">{row.avg_internal_roll?.toFixed(3) ?? "—"}</td>
                  <td className="px-3 py-2">{row.stddev_internal_roll?.toFixed(3) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
