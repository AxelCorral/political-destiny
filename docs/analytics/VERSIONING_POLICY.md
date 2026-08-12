# Politique de versioning — Analytics

## Le problème corrigé en Phase 2

Le rapport Phase 1 mappait `engine_version` sur `GAME_CONFIG.schemaVersion`
(`src/config/game.ts`). Ce nombre décrit la compatibilité du **format de sauvegarde**
(`GameState` sérialisé en IndexedDB, voir `migrateGameState` dans
`src/lib/storage/game-database.ts`) — pas la logique de jeu. Deux versions du moteur avec des
probabilités ou des formules totalement différentes peuvent parfaitement partager le même
`schemaVersion` si la _forme_ de l'état sauvegardé n'a pas changé. Filtrer le dashboard sur cette
valeur pour comparer un changement de logique de jeu aurait été trompeur.

## Les cinq versions distinctes

| Champ                      | Source unique                                                   | Ce qu'il décrit                                                                                                                              | Bump quand                                                                                    |
| -------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `app_version`              | `BRANDING.version` (`src/config/branding.ts`, = `package.json`) | Version de l'application/du site.                                                                                                            | Toute release.                                                                                |
| `engine_version`           | `ENGINE_LOGIC_VERSION` (`src/analytics/versions.ts`)            | **Logique** du moteur : probabilités, poids de sélection d'événements/issues, formules de score, redistribution, négociation de second tour. | Tout changement qui peut faire diverger le résultat d'une campagne à graine+choix identiques. |
| `save_schema_version`      | `GAME_CONFIG.schemaVersion` (`src/config/game.ts`)              | Forme du `GameState` sérialisé (compatibilité de sauvegarde, migrations `migrateGameState`).                                                 | Tout changement de champ/structure dans `GameState`.                                          |
| `content_version`          | `gameContent.contentVersion` (`src/game/data/index.ts`)         | Contenu éditorial : événements, partis, acteurs, textes.                                                                                     | Tout ajout/retrait/modification de contenu de jeu.                                            |
| `analytics_schema_version` | `ANALYTICS_SCHEMA_VERSION` (`src/analytics/versions.ts`)        | Forme de l'enveloppe d'événement analytics et des colonnes des tables.                                                                       | Tout changement de schéma côté `src/analytics/events.ts` ou migrations SQL.                   |
| `build_sha`                | `NEXT_PUBLIC_BUILD_SHA` (déploiement), `"dev"` en local         | Identifiant exact du build déployé.                                                                                                          | Automatique à chaque déploiement — jamais géré à la main.                                     |

Ces cinq champs varient **indépendamment**. Un déploiement peut bumper `app_version` sans toucher
`engine_version` (un simple correctif d'UI, par exemple), et inversement.

## Politique de bump

- **`engine_version`** : bump manuel, obligatoire, à chaque modification de
  `src/game/engine/**` susceptible de changer un résultat de simulation — probabilités,
  pondérations, formules de score/redistribution/second tour. Ne PAS bumper pour un changement
  purement cosmétique du moteur (renommage interne, refactor sans changement de comportement) —
  seul un changement de _comportement observable_ justifie un bump. En cas de doute, bumper : un
  faux positif (bump inutile) coûte une comparaison de version en moins dans le dashboard ; un
  faux négatif (oubli) mélange silencieusement deux logiques différentes sous un même filtre.
- **`save_schema_version`** : déjà couvert par la politique existante de `GAME_CONFIG.schemaVersion`
  et `migrateGameState` (`src/lib/storage/game-database.ts`) — inchangée par cette mission.
- **`content_version`** : déjà couvert par la politique existante de `gameContent.contentVersion`
  — inchangée.
- **`analytics_schema_version`** : bump à chaque migration SQL qui change la forme d'une table
  analytics, ou à chaque changement de `analyticsEventEnvelopeSchema`/`analyticsPayloadSchemas`
  (`src/analytics/events.ts`) qui casserait la compatibilité d'un ancien client.
- **`build_sha`** : jamais géré manuellement — variable d'environnement posée par la plateforme
  de déploiement (`NEXT_PUBLIC_BUILD_SHA`). Une valeur `"dev"` en environnement de production
  signale un déploiement mal configuré (voir le contrôle `events_with_dev_build_sha` dans
  `docs/analytics/DATA_QUALITY.md`).

## Où ces valeurs sont utilisées

- **Enveloppe d'événement** (`src/analytics/events.ts` → `analyticsVersionsSchema`) : les cinq
  champs, sur chaque événement.
- **Tables Postgres** (`supabase/migrations/0001_analytics_core.sql`,
  `0005_analytics_telemetry_enrichment.sql`) : colonnes `app_version`, `engine_version`,
  `save_schema_version`, `content_version`, `analytics_schema_version`, `build_sha` sur
  `analytics_events`/`analytics_runs`/`analytics_decisions`.
- **Filtres du dashboard** (`src/analytics/server/dashboardFilters.ts`,
  `dashboardQueries.ts`) : filtrent sur `app_version`/`engine_version`/`content_version` —
  les versions _analytiquement pertinentes_ pour comparer un changement de gameplay. Le dashboard
  n'expose délibérément aucun filtre sur `save_schema_version` (détail de compatibilité de
  sauvegarde, pas un axe de comparaison produit) ni sur `analytics_schema_version` (détail
  d'infrastructure interne).

## Ce qui n'a PAS changé

`GAME_CONFIG.schemaVersion` lui-même, sa valeur actuelle, et `migrateGameState` restent
totalement inchangés — cette mission ne touche à aucun mécanisme de sauvegarde/migration de
partie. Seul le nom sous lequel cette valeur est _exposée côté analytics_ a changé (`engine_version`
→ `save_schema_version`), et uniquement dans la couche analytics.
