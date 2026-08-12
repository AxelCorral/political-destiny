export function NotConfiguredNotice() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
      <p className="font-black">Analytics non configuré</p>
      <p className="mt-2">
        Aucune base Supabase n’est reliée à ce déploiement (variables <code>SUPABASE_URL</code> /{" "}
        <code>SUPABASE_SERVICE_ROLE_KEY</code> absentes). Le jeu continue de fonctionner normalement
        — cette page affichera des données dès qu’une base sera configurée et que des événements
        auront été ingérés. Voir <code>docs/analytics/README.md</code>.
      </p>
    </div>
  );
}
