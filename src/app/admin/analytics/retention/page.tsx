import { parseDashboardFilters, type RawSearchParams } from "@/analytics/server/dashboardFilters";
import { getReplayBehavior, getRunoffMatchups } from "@/analytics/server/dashboardQueries";
import {
  getSupabaseAdminClient,
  isAnalyticsStorageConfigured,
} from "@/analytics/server/supabaseAdmin";

import { DashboardFilterBar } from "../_components/filter-bar";
import { EmptyState, KpiCard, SectionCaution } from "../_components/dashboard-ui";
import { NotConfiguredNotice } from "../_components/not-configured";

export default async function RetentionPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseDashboardFilters(await searchParams);

  if (!isAnalyticsStorageConfigured()) {
    return (
      <div>
        <DashboardFilterBar pathname="/admin/analytics/retention" filters={filters} showParty />
        <NotConfiguredNotice />
      </div>
    );
  }

  const supabase = getSupabaseAdminClient()!;
  const [replay, matchups] = await Promise.all([
    getReplayBehavior(supabase, filters),
    getRunoffMatchups(supabase, filters),
  ]);

  const usersWithMultipleRuns = replay.filter((row) => row.n_runs > 1).length;
  const usersWithResume = replay.filter((row) => row.n_runs_with_resume > 0).length;

  return (
    <div>
      <DashboardFilterBar pathname="/admin/analytics/retention" filters={filters} showParty />
      <SectionCaution>
        anonymous_user_id est un identifiant de navigateur, pas une personne : une seule personne
        peut apparaître plusieurs fois (plusieurs appareils), et un identifiant peut être partagé
        entre plusieurs personnes (appareil commun). Ces chiffres décrivent des navigateurs, pas des
        joueurs uniques au sens strict.
      </SectionCaution>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard label="Navigateurs distincts (période)" value={replay.length} />
        <KpiCard label="Avec plus d’une campagne" value={usersWithMultipleRuns} />
        <KpiCard label="Avec au moins une reprise" value={usersWithResume} />
      </div>

      <h2 className="mt-8 text-lg font-black">Confrontations au second tour</h2>
      <SectionCaution>
        « n_runoffs » et « n_won » comptent des campagnes simulées, jamais un résultat électoral
        réel.
      </SectionCaution>
      {matchups.length === 0 ? (
        <EmptyState>Aucun second tour enregistré sur ces filtres.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-[var(--surface-raised)] text-xs uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-2">Parti joueur</th>
                <th className="px-3 py-2">Rang au 2nd tour</th>
                <th className="px-3 py-2">n_runoffs</th>
                <th className="px-3 py-2">n_won</th>
              </tr>
            </thead>
            <tbody>
              {matchups.map((row) => (
                <tr
                  key={`${row.player_party_id}:${row.second_round_player_rank}`}
                  className="border-t border-[var(--line)]"
                >
                  <td className="px-3 py-2 font-bold">{row.player_party_id}</td>
                  <td className="px-3 py-2">{row.second_round_player_rank}</td>
                  <td className="px-3 py-2">{row.n_runoffs}</td>
                  <td className="px-3 py-2">{row.n_won}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
