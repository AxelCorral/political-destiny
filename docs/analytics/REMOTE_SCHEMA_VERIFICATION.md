# Vérification du schéma distant — Phase 3

Projet Supabase réel, inspecté le 2026-08-13 via `supabase db query` (CLI officielle,
`--db-url` construit depuis le mot de passe Postgres fourni par Axel — jamais affiché,
jamais committé). Aucun credential dans ce document.

## Migrations appliquées

`supabase db push --include-all` (après `--dry-run` cohérent) a appliqué les 6 migrations dans
l'ordre. `supabase migration list` confirme `local = remote` pour chacune :

| Migration | Appliquée | Résultat |
|---|---|---|
| `0001_analytics_core.sql` | ✅ | OK |
| `0002_analytics_views.sql` | ✅ | OK |
| `0003_data_quality.sql` | ✅ | OK |
| `0004_dashboard_functions.sql` | ✅ | OK |
| `0005_analytics_telemetry_enrichment.sql` | ✅ | OK |
| `0006_analytics_ingestion_observability.sql` | ✅ | OK |

Aucune correction de migration n'a été nécessaire — les 6 fichiers ont été interprétés par un
vrai moteur PostgreSQL sans erreur de syntaxe ni de dépendance.

## Tables

| Objet | Attendu | Distant | Verdict |
|---|---|---|---|
| `analytics_events` | colonnes de `DATA_DICTIONARY.md` + `save_schema_version` | 17 colonnes, toutes présentes, types conformes (`payload jsonb`, `event_uuid uuid` PK) | ✅ PASS |
| `analytics_runs` | colonnes Phase 1 + Phase 2 (scores T1/T2, opponent, turnouts, `save_schema_version`) | 32 colonnes, toutes présentes | ✅ PASS |
| `analytics_decisions` | colonnes Phase 1 + Phase 2 (`viewed_at`/`selected_at`/`resolved_at`, `decision_latency_ms` généré, flags, poll/popularité/momentum) | 30 colonnes, toutes présentes ; `occurred_at` et les colonnes historiquement `NOT NULL` sont bien devenues nullable (`is_nullable = YES`) comme prévu par la migration 0005 | ✅ PASS |
| `analytics_ingestion_batches` | colonnes de 0005 | 10 colonnes présentes, `rejection_reason_codes` bien de type tableau (`ARRAY`/`text[]`) | ✅ PASS |
| `analytics_settings` | `key`, `value` | présentes | ✅ PASS (schéma) — ⚠️ voir « RLS » ci-dessous |

## Vues

| Objet | Distant | Verdict |
|---|---|---|
| `analytics_run_status` | présente | ✅ PASS |
| `analytics_data_quality` | présente | ✅ PASS |
| `overview_daily` | présente | ✅ PASS |
| `party_performance` | présente | ✅ PASS |
| `run_funnel` | présente | ✅ PASS |
| `version_health` | présente | ✅ PASS |
| `replay_behavior` | présente | ✅ PASS |
| `runoff_matchups` | présente | ✅ PASS |
| `decision_health` | présente | ✅ PASS |
| `event_choice_distribution` | présente | ✅ PASS |
| `content_exposure` | présente | ✅ PASS |

11/11 vues attendues présentes, aucune vue inattendue.

## Fonctions

| Objet | Distant | Verdict |
|---|---|---|
| `fn_upsert_analytics_run` | présente | ✅ PASS |
| `fn_upsert_analytics_decision` | présente | ✅ PASS |
| `fn_overview` | présente | ✅ PASS |
| `fn_overview_summary` | présente | ✅ PASS |
| `fn_party_performance` | présente | ✅ PASS |
| `fn_run_funnel` | présente | ✅ PASS |
| `fn_version_health` | présente | ✅ PASS |
| `fn_replay_behavior` | présente | ✅ PASS |
| `fn_runoff_matchups` | présente | ✅ PASS |
| `fn_event_choice_distribution` | présente | ✅ PASS |
| `fn_decision_health` | présente | ✅ PASS |
| `fn_content_exposure` | présente | ✅ PASS |
| `fn_dashboard_usage` | présente | ✅ PASS |
| `fn_ingestion_health` | présente | ✅ PASS |
| `fn_game_error_summary` | présente | ✅ PASS |

15/15 fonctions attendues présentes.

## Row Level Security et exposition anon/authenticated — finding de sécurité réel (corrigé)

### Constat initial (avant migration 0007)

| Table | RLS attendu | RLS distant | Verdict |
|---|---|---|---|
| `analytics_events` | activé | `true` | ✅ PASS |
| `analytics_runs` | activé | `true` | ✅ PASS |
| `analytics_decisions` | activé | `true` | ✅ PASS |
| `analytics_ingestion_batches` | activé | `true` | ✅ PASS |
| `analytics_settings` | activé (comme les 4 autres) | **`false`** | ❌ **FAIL — écart réel** |

`analytics_settings` a été créée dans `0002_analytics_views.sql` sans la ligne `alter table
analytics_settings enable row level security;` que les autres tables analytics reçoivent
toutes — un oubli réel de la Phase 1/2, jamais détecté avant cette inspection sur un vrai
Postgres.

### Investigation élargie — la portée réelle dépassait `analytics_settings`

À la demande d'Axel, deux vérifications complémentaires ont été menées avant toute correction,
puis étendues systématiquement à l'ensemble du schéma `public` (qui n'héberge que les objets
analytics — 5 tables, 11 vues, 15 fonctions, rien d'autre) :

1. **GRANTs directs** — `anon` et `authenticated` détenaient les privilèges complets
   (`SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER`) sur **les 5 tables et les 11
   vues**, pas seulement `analytics_settings`. Origine : le projet Supabase applique des
   `ALTER DEFAULT PRIVILEGES` pour le rôle `postgres` dans le schéma `public` (confirmé via
   `pg_default_acl`) qui accordent automatiquement ces droits à `anon`/`authenticated` sur
   **tout objet nouvellement créé** par ce rôle — c'est-à-dire toute future migration, puisque
   toutes tournent en tant que `postgres`.
2. **Vues et fonctions référençant `analytics_settings`** — aucune fonction ne la référence ;
   une seule vue (`analytics_run_status`) la référence. Mais l'examen des 11 vues a révélé
   qu'**aucune** n'avait `security_invoker = true` : toutes sont possédées par `postgres`, qui a
   `BYPASSRLS`, donc chaque vue s'exécutait avec les privilèges du propriétaire — contournant
   silencieusement le RLS des tables de base sous-jacentes (`analytics_runs`,
   `analytics_decisions`, `analytics_events`, `analytics_ingestion_batches`), indépendamment des
   GRANTs.
3. **Audit des 15 fonctions** (à la demande d'Axel, avant toute correction) : les 15 sont
   `SECURITY INVOKER` (aucune `SECURITY DEFINER` — pas de contournement RLS par ce biais), toutes
   possédées par `postgres`, et toutes avaient `EXECUTE` accordé à `PUBLIC` (défaut implicite
   Postgres pour les nouvelles fonctions, jamais révoqué) ainsi qu'à `anon`/`authenticated`
   (mêmes default privileges Supabase que ci-dessus). Vérification du code (`grep` sur
   `src/`) : les 15 fonctions ne sont appelées que depuis
   `src/analytics/server/ingest.ts` et `src/analytics/server/dashboardQueries.ts`, via
   `src/analytics/server/supabaseAdmin.ts` — l'unique point de construction d'un client
   Supabase dans tout le projet, toujours avec `SUPABASE_SERVICE_ROLE_KEY`. Aucun
   `NEXT_PUBLIC_SUPABASE_*` n'existe nulle part dans `src/`. Aucune fonction n'a donc besoin
   d'un accès `anon`/`authenticated`/`PUBLIC` réel — aucune exception fonctionnelle trouvée.
4. **Default privileges** (`pg_default_acl`) : confirmé que le rôle `postgres` a des
   `ALTER DEFAULT PRIVILEGES` actifs dans `public` accordant accès complet à
   `anon`/`authenticated` sur les futures tables, vues (type `r`), séquences (type `S`) et
   `EXECUTE` sur les futures fonctions (type `f`) — c'est la cause racine systémique : sans
   correctif, **toute nouvelle table/vue/fonction analytics créée par une future migration
   recréerait automatiquement la même exposition**, y compris `analytics_settings` elle-même à
   l'origine.

Conclusion : le problème n'était pas limité à `analytics_settings` — c'était une exposition
projet-wide de toute la couche de reporting analytics (5 tables + 11 vues), plus un contournement
RLS actif via les vues, plus un risque de récidive automatique à chaque nouvelle migration.

### Correctif appliqué — `supabase/migrations/0007_analytics_access_hardening.sql`

Appliqué le 2026-08-13 via `supabase db push --db-url` (workflow CLI officiel), après
`--dry-run` cohérent. Migration non destructive (aucune donnée modifiée), contient :

1. `alter table public.analytics_settings enable row level security;`
2. `revoke all on all tables in schema public from anon, authenticated;` (couvre les 5 tables
   et les 11 vues)
3. `alter view ... set (security_invoker = true);` sur les 11 vues, pour qu'elles s'exécutent
   désormais avec les privilèges de l'appelant et non plus du propriétaire
4. `revoke execute on all functions in schema public from public, anon, authenticated;`
5. `alter default privileges for role postgres in schema public revoke ...` sur les tables, les
   séquences et les fonctions, pour empêcher toute récidive automatique sur les futurs objets

`supabase migration list --db-url` confirme `local = remote` pour les 7 migrations
(`0001`…`0007`).

### Tests de sécurité post-migration (réels, contre le projet distant)

Avec la **clé publishable** (`sb_publishable_...`) — tout doit être refusé :

| Surface testée | Résultat |
|---|---|
| `SELECT` direct sur les 5 tables analytics | `42501 permission denied` — **DENIED** (5/5) |
| `SELECT` sur les 11 vues analytics | `42501 permission denied` — **DENIED** (11/11) |
| Appel RPC sur un échantillon de fonctions (`fn_overview`, `fn_dashboard_usage`,
  `fn_ingestion_health`) | `42501 permission denied for function` — **DENIED** (3/3) |

Avec la **clé secrète** (`sb_secret_...`, côté serveur) — tout doit continuer à fonctionner :

| Surface testée | Résultat |
|---|---|
| `SELECT` sur les 5 tables | **OK** (5/5) |
| `SELECT` sur les 11 vues | **OK** (11/11) — confirme qu'aucune vue `security_invoker=true` ne
  casse le reporting serveur : `service_role` a `BYPASSRLS` directement (`rolbypassrls=true`
  confirmé via `pg_roles`), donc le passage en mode « invoker » n'introduit aucune dépendance à
  un privilège manquant |
| Appel RPC sur le même échantillon de fonctions | **OK** (3/3) |

Script de test jetable, supprimé après exécution (non committé) ; secrets jamais affichés dans
les logs (clés/mot de passe passés uniquement via `.env.local`).

### Non-régression

`npm run analytics:verify:security` (nouveau script, `scripts/analytics-verify-security.ts`)
interroge `pg_catalog`/`information_schema` via le CLI officiel (`supabase db query --db-url`)
et échoue si un objet du schéma `public` viole une des quatre règles ci-dessus (table sans RLS,
vue sans `security_invoker=true`, table/vue accordant un privilège à `anon`/`authenticated`,
fonction accordant `EXECUTE` à `PUBLIC`/`anon`/`authenticated`). Exécuté après application de la
migration 0007 : **OK — 0 violation**.
