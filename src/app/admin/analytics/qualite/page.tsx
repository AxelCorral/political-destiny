import {
  getDataQuality,
  getGameErrorSummary,
  getIngestionHealth,
} from "@/analytics/server/dashboardQueries";
import {
  getSupabaseAdminClient,
  isAnalyticsStorageConfigured,
} from "@/analytics/server/supabaseAdmin";

import { EmptyState, KpiCard, SectionCaution } from "../_components/dashboard-ui";
import { NotConfiguredNotice } from "../_components/not-configured";

// No searchParams-based filters on this tab (unlike the others), so Next.js
// has no implicit signal to render per-request — without this, the page
// gets statically prerendered at BUILD time, executing a real Supabase call
// (with the build machine's credentials/clock) instead of on each admin
// request, and baking a permanently stale snapshot into the static output.
// Found via a real Vercel build failure (PGRST303 "JWT issued at future"),
// never reproducible locally where .env.local happens to be valid at build
// time too.
export const dynamic = "force-dynamic";

export default async function QualitePage() {
  if (!isAnalyticsStorageConfigured()) {
    return <NotConfiguredNotice />;
  }

  const supabase = getSupabaseAdminClient()!;
  const [checks, ingestion, errors] = await Promise.all([
    getDataQuality(supabase),
    getIngestionHealth(supabase, {}),
    getGameErrorSummary(supabase, {}),
  ]);
  const totalAnomalies = checks.reduce((sum, check) => sum + Number(check.n_anomalies), 0);

  return (
    <div>
      <SectionCaution>
        Un contrôle qui remonte un chiffre non nul signale une ligne à vérifier, pas automatiquement
        un bug — voir docs/analytics/DATA_QUALITY.md pour l’interprétation de chaque contrôle.
      </SectionCaution>
      <KpiCard label="Anomalies de données détectées (total)" value={totalAnomalies} />

      <h2 className="mt-8 text-lg font-black">Ingestion (§12)</h2>
      {ingestion ? (
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="Lots reçus" value={ingestion.n_batches} />
          <KpiCard label="Événements acceptés" value={ingestion.accepted_total} />
          <KpiCard label="Événements rejetés" value={ingestion.rejected_total} />
          <KpiCard
            label="Taux de rejet"
            value={
              ingestion.rejection_rate !== null
                ? `${(ingestion.rejection_rate * 100).toFixed(1)}%`
                : "—"
            }
          />
        </div>
      ) : (
        <EmptyState>Aucune donnée d’ingestion enregistrée.</EmptyState>
      )}

      <h2 className="mt-8 text-lg font-black">Erreurs techniques (game_error)</h2>
      {errors.length === 0 ? (
        <EmptyState>Aucune erreur technique enregistrée.</EmptyState>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-[var(--surface-raised)] text-xs uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-2">Code d’erreur</th>
                <th className="px-3 py-2">Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((row) => (
                <tr key={row.error_code} className="border-t border-[var(--line)]">
                  <td className="px-3 py-2 font-mono text-xs">{row.error_code}</td>
                  <td className="px-3 py-2">{row.n_occurrences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-lg font-black">Contrôles de qualité</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-[var(--surface-raised)] text-xs uppercase text-[var(--ink-muted)]">
            <tr>
              <th className="px-3 py-2">Contrôle</th>
              <th className="px-3 py-2">n_anomalies</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr key={check.check_name} className="border-t border-[var(--line)]">
                <td className="px-3 py-2 font-mono text-xs">{check.check_name}</td>
                <td className="px-3 py-2">{check.n_anomalies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
