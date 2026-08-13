# Qualité de données — Analytics

Contrôles définis dans `supabase/migrations/0003_data_quality.sql`, vue `analytics_data_quality`.
Affichés dans l'onglet **Qualité** du dashboard (`/admin/analytics/qualite`) sous la forme d'un
compteur unique « anomalies de données » (somme de `n_anomalies` sur toutes les lignes) plus le
détail par contrôle.

Un contrôle qui remonte un chiffre non nul est **un signal à vérifier, jamais une preuve
automatique de bug** — la volumétrie (n) et le contexte (une seule campagne test, un déploiement
récent, un identifiant réutilisé délibérément) comptent.

## Contrôles définis

| `check_name`                              | Ce qu'il détecte                                                                                                    | Cause plausible si non nul                                                                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runs_decisions_count_mismatch`           | `analytics_runs.decisions_count` ne correspond pas au nombre réel de lignes dans `analytics_decisions` pour ce run. | Ingestion partielle (un lot a échoué en cours de traitement), ou un bug d'agrégation à corriger côté `src/analytics/server/ingest.ts`.                                                                                             |
| `events_occurred_at_after_received_at`    | Un événement a un `occurred_at` postérieur de plus de 5 minutes à son `received_at`.                                | Horloge client désynchronisée — pas nécessairement un problème de donnée en soi, mais utile à surveiller si le volume grossit.                                                                                                     |
| `runs_completed_without_final_score`      | Un run a `completed_at` renseigné mais `final_score` null.                                                          | `run_completed` reçu avec un payload partiellement invalide (rejeté par Zod côté ingestion) alors qu'un autre champ a néanmoins marqué `completed_at`.                                                                             |
| `runs_qualified_without_first_round_rank` | `qualified = true` mais `first_round_player_rank` absent.                                                           | `first_round_result` jamais reçu pour ce run (perte réseau), alors qu'un `run_completed` ultérieur a positionné `qualified`.                                                                                                       |
| `decisions_with_out_of_range_roll`        | `internal_roll` hors de `[0, 1]`.                                                                                   | Ne devrait jamais arriver : le schéma Zod (`analyticsPayloadSchemas.decision_resolved`) rejette déjà ces valeurs à l'ingestion. Un résultat non nul ici signalerait un contournement de la validation — à investiguer en priorité. |

## Limites connues de ces contrôles

- Ils portent sur `analytics_runs`/`analytics_decisions` (les tables dérivées), pas sur
  `analytics_events` (le journal brut) — un événement rejeté à l'ingestion (payload invalide)
  n'apparaît dans aucun de ces contrôles ; il est seulement compté dans la réponse HTTP
  `rejected` de `POST /api/analytics/events`, actuellement non historisée côté serveur au-delà des
  logs (`console.error`/`console.info`).
- Aucun contrôle de complétude globale (« combien d'événements attendus ont réellement été
  reçus ») n'existe : la couche est déclarative côté client (fire-and-forget), il n'y a pas
  d'attente serveur d'un nombre d'événements fixe par run.

## Contrôle distinct : intégrité d'accès (RLS/GRANTs), pas de qualité de données

`npm run analytics:verify:security` (`scripts/analytics-verify-security.ts`) n'est **pas** un
contrôle de qualité de données — il vérifie que le schéma `public` distant n'expose aucun objet
analytics à `anon`/`authenticated`. Ajouté après un incident réel (RLS manquant sur
`analytics_settings`, vues sans `security_invoker`, GRANTs par défaut du projet Supabase — détail
dans `docs/analytics/REMOTE_SCHEMA_VERIFICATION.md` et `docs/analytics/PRIVACY.md` §Sécurité côté
serveur). À exécuter après toute migration qui ajoute une table, une vue ou une fonction
analytics.
