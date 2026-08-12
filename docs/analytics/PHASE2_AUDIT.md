# Audit Phase 2 — état réel au HEAD

Réalisé avant toute écriture de code de cette phase, par confrontation directe entre les
documents `docs/analytics/*.md` produits en Phase 1 et le code réellement présent au HEAD
(`cb247ce`). Aucune affirmation ci-dessous n'est reprise d'un document sans relecture du fichier
source cité.

## État git au démarrage de la Phase 2

```
On branch main
Your branch is ahead of 'origin/main' by 6 commits.
```

Les 6 commits Phase 1 (`f0771e0` → `cb247ce`) sont bien au HEAD, aucun push effectué. `next.config.ts`
reste modifié depuis avant la Phase 1 (tunnel Cloudflare de dev, non lié à l'analytics — inchangé
ici). `linkedin/`, `release/PUBLICATION_GATE.md`, `PROMPT_CLAUDE_CODE_SERIE_LINKEDIN_*.md` restent
non trackés depuis avant la Phase 1, non touchés par cette phase.

## Matrice question produit → disponibilité → gap → action

| Question produit                                      | Donnée nécessaire                                                                                                                                                                                        | Disponible aujourd'hui ?                                                                                                                                                        | Gap                                                                                                                                                                       | Action Phase 2                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Runs commencés/terminés                               | `run_started`, `run_completed`                                                                                                                                                                           | Oui (Phase 1)                                                                                                                                                                   | Aucun                                                                                                                                                                     | —                                              |
| Navigateurs anonymes récurrents / runs par navigateur | `analytics_runs.anonymous_user_id`                                                                                                                                                                       | Oui (vue `replay_behavior`)                                                                                                                                                     | Aucun                                                                                                                                                                     | —                                              |
| Durée de campagne                                     | Différence `completed_at` − `started_at`                                                                                                                                                                 | Colonnes présentes, jamais exposées en KPI                                                                                                                                      | Pas de médiane calculée                                                                                                                                                   | Ajouter au mart Overview                       |
| Runs devenus inactifs                                 | `analytics_run_status.status`                                                                                                                                                                            | Oui (Phase 1)                                                                                                                                                                   | Deux sources doc (env + table) prêtaient à confusion                                                                                                                      | Clarifier source unique (§15)                  |
| Score simulé T1 joueur                                | `ElectionRoundResult.results[playerPartyId]`                                                                                                                                                             | **Non stocké** — seul le rang l'est                                                                                                                                             | Gap confirmé                                                                                                                                                              | Ajouter `first_round_player_score`             |
| Score simulé T2 joueur                                | `secondRoundResult.results[playerPartyId]`                                                                                                                                                               | **Non stocké**                                                                                                                                                                  | Gap confirmé                                                                                                                                                              | Ajouter `second_round_player_score`            |
| Adversaire T2                                         | `secondRoundResult.ranking` (2 partis)                                                                                                                                                                   | **Non stocké**                                                                                                                                                                  | Gap confirmé                                                                                                                                                              | Ajouter `runoff_opponent_party_id`             |
| Turnout T1/T2                                         | `ElectionRoundResult.turnout`                                                                                                                                                                            | Envoyé dans le payload d'événement (Phase 1), **jamais persisté** en colonne `analytics_runs`                                                                                   | Gap partiel                                                                                                                                                               | Ajouter colonnes                               |
| Victoire \| qualifié                                  | `won`, `qualified` déjà en base                                                                                                                                                                          | Oui, calculable en SQL                                                                                                                                                          | Aucun                                                                                                                                                                     | Ajouter au mart                                |
| Combien de fois un événement a été affiché            | Un événement "vu"                                                                                                                                                                                        | **N'existe pas** — `decision_resolved` ne capture qu'un choix déjà résolu, jamais une simple exposition                                                                         | Gap confirmé, pas de proxy fiable (un joueur peut voir un événement sans le résoudre immédiatement)                                                                       | Ajouter `decision_viewed` (§3)                 |
| Taux de sélection d'un choix parmi ses expositions    | `n_picked / n_exposures`                                                                                                                                                                                 | **Dénominateur manquant** (pas d'événement d'exposition) — la vue Phase 1 `event_choice_distribution` ne divise que par la somme des choix pris, pas par les vraies expositions | Gap confirmé                                                                                                                                                              | `decision_viewed` comme dénominateur réel      |
| Temps de décision                                     | `viewed_at` → `selected_at`/`resolved_at`                                                                                                                                                                | **N'existe pas**                                                                                                                                                                | Gap confirmé                                                                                                                                                              | §4                                             |
| Choix dominants                                       | Partage de sélection par choix                                                                                                                                                                           | Partiellement calculable (Phase 1), dénominateur faux (voir ci-dessus)                                                                                                          | Gap partiel                                                                                                                                                               | Recalculer sur `decision_viewed`               |
| Événements rares/jamais vus                           | `content_exposure` (Phase 1) compte les **résolutions**, pas les expositions                                                                                                                             | Partiel                                                                                                                                                                         | Un événement vu puis abandonné (reload sans choisir) n'apparaît nulle part                                                                                                | `decision_viewed`                              |
| Exposition aux chaînes/rares/décisifs                 | Flags `rare`/`chain`/`decisive`                                                                                                                                                                          | **Non capturés** en télémétrie (existent seulement dans `decision-card-variant.ts`, purement UI)                                                                                | Gap confirmé                                                                                                                                                              | Ajouter au payload `decision_viewed`           |
| Effets avant/après                                    | `PartyStats.polling/popularity/momentum` avant/après une décision                                                                                                                                        | **Non capturé**                                                                                                                                                                 | Gap confirmé, mais **directement lisible** dans `GameState.parties[playerPartyId].stats` avant/après `resolveCurrentChoice` — aucun recalcul de formule moteur nécessaire | §5                                             |
| Ouverture du tableau de bord joueur                   | Un vrai composant `CampaignDashboard` existe (`src/features/campaign/campaign-dashboard.tsx`), ouvert via deux boutons dans `campaign-screens.tsx` (état local `dashboardOpen`, jamais dans `GameState`) | **Non instrumenté**                                                                                                                                                             | Gap confirmé, UI réelle existante                                                                                                                                         | Ajouter `player_dashboard_opened` au clic (§8) |
| Erreurs techniques catégorisées                       | 7 sites `catch`/`.catch()` réels déjà présents (`gameStore.ts` ×2, `game-app.tsx` ×5, dont 3 discriminables uniquement via `game-database.ts`)                                                           | **Aucun événement analytics associé** — seuls des messages UI (`setWarning`/`error`)                                                                                            | Gap confirmé                                                                                                                                                              | §9, liste fermée de 5 `errorCode`              |
| Contenu jamais exposé                                 | `content_exposure` (Phase 1)                                                                                                                                                                             | Mesure les résolutions, pas les expositions                                                                                                                                     | Gap partiel                                                                                                                                                               | Recalculer sur `decision_viewed`               |
| Comparaison entre versions                            | `version_health` (Phase 1)                                                                                                                                                                               | Fonctionnelle mais `engine_version` sémantiquement ambiguë (`GAME_CONFIG.schemaVersion` = schéma de sauvegarde, pas logique moteur)                                             | Gap confirmé                                                                                                                                                              | §10                                            |

## Relecture ligne à ligne des fichiers cités par la mission

- **`docs/analytics/ANALYTICS_IMPLEMENTATION_REPORT.md`** : conclut honnêtement `READY FOR
CONFIGURATION`. Toujours exact — aucune base Supabase réelle n'a été touchée depuis. Section H
  (« Limites connues ») documente déjà la concurrence `select`-puis-`upsert` non transactionnelle
  sur `analytics_runs`, confirmée dans le code (`src/analytics/server/ingest.ts`, fonction
  `ingestEvents`, boucle `for (const [runId, runEvents] of runScopedByRunId)`).
- **`docs/analytics/ARCHITECTURE_PLAN.md`** : décrit l'architecture générale, toujours à jour.
  Ne mentionne pas de séparation exposition/sélection/résolution — normal, hors périmètre Phase 1.
- **`docs/analytics/EVENT_CATALOG.md`** : liste 11 événements, tous vérifiés présents dans
  `src/analytics/events.ts` (`analyticsEventTypes`). Aucun `decision_viewed`, `choice_selected`,
  `player_dashboard_opened`, `game_error`.
- **`docs/analytics/DATA_DICTIONARY.md`** : colonnes de `analytics_runs`/`analytics_decisions`
  vérifiées contre `supabase/migrations/0001_analytics_core.sql` — exactes. Aucune colonne
  `viewed_at`/`selected_at`/`decision_latency_ms`/score T1-T2/`opponent`.
- **`docs/analytics/DATA_QUALITY.md`** : 5 contrôles vérifiés présents dans
  `supabase/migrations/0003_data_quality.sql` — exacts et toujours pertinents, à conserver tels
  quels.
- **`docs/analytics/PRIVACY.md`** : toujours exact sur le opt-in et l'absence de PII ; sera
  complété (avertissement Overview §24) sans changer les garanties déjà décrites.
- **`docs/analytics/EXPERIMENTATION.md`** : `experiment_id`/`variant_id` toujours groundwork
  seul, aucune expérience active — inchangé, sera juste revu pour compatibilité de schéma.
- **`src/analytics/**`** : `events.ts` (11 types), `client.ts`, `storage.ts`, `consent.ts`,
  `identity.ts`, `versions.ts`, `config.ts`, `server/{ingest,supabaseAdmin,csv,dashboardFilters,
dashboardQueries,adminSession}.ts` — tous vérifiés conformes à leur description Phase 1.
- **`src/app/api/analytics/**`**, **`src/app/api/admin/analytics/**`** : route d'ingestion et
  export CSV vérifiées, comportement fail-open confirmé par relecture (pas seulement par les
  tests).
- **`src/app/admin/**`** : auth cookie signé + 6 onglets vérifiés présents et fonctionnels.
- **`src/components/analytics-provider.tsx`** : déclenche `flush()` au montage/`online`/
  intervalle/`pagehide`, et `session_started` une fois par montage — inchangé, correct.
- **`src/features/campaign/game-app.tsx`** : point d'instrumentation principal Phase 1, observe
  les diffs de `GameState`. **Ne peut pas voir `dashboardOpen`** (état local à
  `CampaignEventScreen`, jamais remonté dans le store ni dans `GameState`) — confirme que
  `player_dashboard_opened` doit être câblé directement dans `campaign-screens.tsx`, un autre
  composant applicatif, toujours hors moteur.
- **`src/features/meta/settings-page.tsx`** : bascule de consentement vérifiée fonctionnelle,
  inchangée.
- **`src/lib/storage/game-database.ts`** : `LoadGameResult` a `{state?, warning?, recoveryJson?}`
  — **aucun discriminant machine-lisible** entre les 3 causes réelles de warning (stockage
  inaccessible, sauvegarde corrompue, sauvegarde d'une version trop récente). Nécessaire pour un
  `game_error.errorCode` propre sans parser un message humain (§9).
- **`supabase/migrations/**`** : 4 migrations (`0001`–`0004`) vérifiées, jamais appliquées à un
  projet réel (voir §J de `ANALYTICS_IMPLEMENTATION_REPORT.md`, reconfirmé en §20 de cette phase).
- **`scripts/analytics-seed.ts`** : génère `run_started` → `decision_resolved`×N →
  `first_round_result` → (`second_round_result`) → `run_completed`. Ne génère ni `decision_viewed`
  ni `choice_selected` ni erreurs ni ouvertures de dashboard — à mettre à jour (§17).
- **E2E analytics** (`e2e/admin-analytics-auth.spec.ts`, `e2e/analytics-telemetry.spec.ts`) :
  couvrent l'auth admin et le flux consentement/non-blocage. Aucun test ne vérifie
  `decision_viewed`/`choice_selected`/latence/scores T1 — à ajouter (§18).

## Conclusion de l'audit

Aucun des gaps listés ci-dessus n'est comblé par un proxy déjà existant qui serait fiable — chaque
ligne "Gap confirmé" correspond à une donnée réellement absente, jamais à une simple absence de
mise en forme. La mission continue automatiquement vers l'implémentation (section 2 et suivantes
du prompt de mission), sans reconstruction de l'existant.
