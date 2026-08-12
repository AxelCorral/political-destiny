import { getDataQuality } from "@/analytics/server/dashboardQueries";
import {
  getSupabaseAdminClient,
  isAnalyticsStorageConfigured,
} from "@/analytics/server/supabaseAdmin";

import { KpiCard, SectionCaution } from "../_components/dashboard-ui";
import { NotConfiguredNotice } from "../_components/not-configured";

export default async function QualitePage() {
  if (!isAnalyticsStorageConfigured()) {
    return <NotConfiguredNotice />;
  }

  const supabase = getSupabaseAdminClient()!;
  const checks = await getDataQuality(supabase);
  const totalAnomalies = checks.reduce((sum, check) => sum + Number(check.n_anomalies), 0);

  return (
    <div>
      <SectionCaution>
        Un contrôle qui remonte un chiffre non nul signale une ligne à vérifier, pas automatiquement
        un bug — voir docs/analytics/DATA_QUALITY.md pour l’interprétation de chaque contrôle.
      </SectionCaution>
      <KpiCard label="Anomalies de données détectées (total)" value={totalAnomalies} />
      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--line)]">
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
