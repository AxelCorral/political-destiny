# Dictionnaire de données — Analytics

Colonnes réellement créées par `supabase/migrations/0001_analytics_core.sql`. Toute colonne
listée ici existe dans une migration committée ; rien n'est décrit par anticipation.

## `analytics_events` — journal brut, append-only

| Colonne                        | Type           | Description                                                                                                                                                      |
| ------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `event_uuid`                   | uuid, PK       | Généré côté client (`crypto.randomUUID()`), clé d'idempotence — un retry client avec le même `event_uuid` ne crée pas de doublon (`ON CONFLICT ... DO NOTHING`). |
| `event_type`                   | text           | Une valeur du catalogue — `docs/analytics/EVENT_CATALOG.md`.                                                                                                     |
| `anonymous_user_id`            | uuid           | Identifiant local persistant. **N'identifie pas une personne précise** — voir `PRIVACY.md`.                                                                      |
| `session_id`                   | uuid           | Identifiant d'onglet/session navigateur, régénéré à chaque nouvelle session.                                                                                     |
| `run_id`                       | text, nullable | `GameState.runId` — absent seulement pour les événements non liés à une campagne (`session_started`, `consent_updated`).                                         |
| `client_sequence`              | integer        | Ordonnancement local, croissant par run.                                                                                                                         |
| `occurred_at`                  | timestamptz    | Horodatage déclaré par le client au moment de l'événement.                                                                                                       |
| `received_at`                  | timestamptz    | Horodatage serveur à l'ingestion (`default now()`).                                                                                                              |
| `app_version`                  | text           | `BRANDING.version` (= `package.json`).                                                                                                                           |
| `engine_version`               | text           | `GAME_CONFIG.schemaVersion`.                                                                                                                                     |
| `content_version`              | text           | `gameContent.contentVersion`.                                                                                                                                    |
| `analytics_schema_version`     | text           | `ANALYTICS_SCHEMA_VERSION` (`src/analytics/versions.ts`), indépendante des trois précédentes.                                                                    |
| `build_sha`                    | text           | `NEXT_PUBLIC_BUILD_SHA`, ou `"dev"` en local.                                                                                                                    |
| `experiment_id` / `variant_id` | text, nullable | Groundwork A/B — toujours `null` tant qu'aucune expérience n'est active. Voir `EXPERIMENTATION.md`.                                                              |
| `payload`                      | jsonb          | Champs spécifiques à `event_type`, validés par le schéma Zod correspondant avant écriture.                                                                       |

## `analytics_runs` — un run par `run_id`, upserté au fil de la partie

| Colonne                                                         | Type                     | Description                                                                                                                                                                                                                            |
| --------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run_id`                                                        | text, PK                 | = `GameState.runId`.                                                                                                                                                                                                                   |
| `anonymous_user_id`, `session_id`                               | uuid                     | Dernières valeurs vues pour ce run.                                                                                                                                                                                                    |
| `mode`, `party_id`, `method_id`, `candidate_profile_id`, `seed` | text, **nullable**       | Remplis par `run_started`. Nullable pour tolérer un `decision_resolved` qui arriverait avant `run_started` sous réordonnancement réseau entre deux requêtes d'ingestion distinctes — un cas limite documenté, pas une donnée inventée. |
| `started_at`                                                    | timestamptz              | Horodatage de `run_started`.                                                                                                                                                                                                           |
| `last_event_at`                                                 | timestamptz              | Maximum des `occurred_at` vus pour ce run — base du calcul de `status` (voir plus bas).                                                                                                                                                |
| `completed_at`                                                  | timestamptz, nullable    | Rempli par `run_completed`.                                                                                                                                                                                                            |
| `resumed_count`                                                 | integer                  | Nombre de `run_resumed` reçus.                                                                                                                                                                                                         |
| `decisions_count`                                               | integer                  | Recalculé à chaque ingestion comme `count(*)` réel sur `analytics_decisions` pour ce run — jamais un compteur incrémenté à l'aveugle, donc robuste aux retries.                                                                        |
| `qualified`, `won`                                              | boolean, nullable        | `first_round_result.qualified`, dérivé de `second_round_result.won`/`run_completed.won`.                                                                                                                                               |
| `final_score`, `ending_id`                                      | numeric / text, nullable | `run_completed.score` / `.endingId`.                                                                                                                                                                                                   |
| `first_round_player_rank`, `second_round_player_rank`           | integer, nullable        | Dérivés du classement (`ranking.indexOf`), pas un champ direct du moteur.                                                                                                                                                              |
| `app_version` … `build_sha`                                     | —                        | Dernières versions vues pour ce run.                                                                                                                                                                                                   |
| `experiment_id`, `variant_id`                                   | text, nullable           | Groundwork A/B.                                                                                                                                                                                                                        |

`status` (`ongoing` / `completed` / `stale_incomplete`) n'est **pas une colonne** — c'est une
valeur calculée à la lecture par la vue `analytics_run_status`
(`supabase/migrations/0002_analytics_views.sql`), à partir de `last_event_at`, `completed_at` et
du seuil configurable `stale_run_hours` (table `analytics_settings`, valeur par défaut `48`).
Une vue SQL ne peut pas lire une variable d'environnement Next.js au moment de la lecture : cette
table, pas `ANALYTICS_STALE_RUN_HOURS_DEFAULT` (`.env.example`), fait foi en pratique. Pour changer le
seuil en production, exécuter :

```sql
update analytics_settings set value = '<heures>' where key = 'stale_run_hours';
```

et mettre à jour `ANALYTICS_STALE_RUN_HOURS_DEFAULT` en parallèle, pour que la documentation et la base
restent alignées.

## `analytics_decisions` — une ligne par décision résolue

| Colonne                                            | Type                               | Description                                                                                                 |
| -------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `run_id`, `decision_index`                         | text, integer — PK composite       | Déduplication : une même décision d'un même run n'est jamais dupliquée, quel que soit le nombre de retries. |
| `occurred_at`                                      | timestamptz                        | —                                                                                                           |
| `phase`                                            | text                               | `GameState.phase` au moment de la décision.                                                                 |
| `event_id`, `event_category`                       | text                               | Identifiants stables du contenu (`GameEventDefinition`).                                                    |
| `choice_id`, `choice_tag`, `choice_strategy`       | text, text nullable, text nullable | `EventChoice.id` / `.visibleTag` / `.strategy`.                                                             |
| `outcome_id`                                       | text                               | `WeightedOutcome.id` effectivement tiré.                                                                    |
| `internal_roll`                                    | numeric                            | Tirage aléatoire moteur ayant déterminé l'issue (0..1) — **jamais** le texte narratif de l'issue.           |
| `app_version`, `engine_version`, `content_version` | text                               | Versions au moment de la décision.                                                                          |

## Ce qui n'est jamais stocké

Nom réel, e-mail, adresse IP conservée, user-agent complet, empreinte de navigateur,
identifiant publicitaire, texte narratif d'un événement/d'une issue (`narrative`,
`visibleEffects`), `GameState` brut, contenu d'une déclaration de campagne (`statementLedger`).
