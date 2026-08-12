# Analytics — Vers l'Élysée

Couche produit-analytics et dashboard privé, ajoutée au-dessus du jeu existant. **Le jeu
fonctionne intégralement sans cette couche** : zéro variable d'environnement Supabase configurée
= analytics silencieusement désactivée, aucune erreur, aucun impact joueur. C'est le principe
directeur de toute cette implémentation, vérifié par tests (`src/analytics/__tests__/
determinism.test.ts`) et par un build/dev/test réussis sans aucun secret configuré.

## 1. Vue d'ensemble

```
Jeu (React) → src/analytics/client.ts (non bloquant)
  → file persistante IndexedDB (src/analytics/storage.ts)
    → POST /api/analytics/events (validation Zod stricte)
      → Supabase Postgres (clé de service, jamais côté client)
        → analytics_events (log brut) → analytics_runs / analytics_decisions (dérivées)
          → vues et fonctions SQL → /admin/analytics (lecture seule, authentifiée)
```

Détail complet : `docs/analytics/ARCHITECTURE_PLAN.md`.

## 2. Statut de ce déploiement — À LIRE AVANT TOUTE AUTRE CHOSE

**Aucune base Supabase réelle n'a été configurée ni utilisée durant cette mission.** Toutes les
migrations, tous les tests et tout le code ont été écrits et validés contre une base _simulée_
(fixtures en mémoire en test, `fake-indexeddb` côté client) — jamais contre un projet Supabase
réellement déployé. Rien n'a été « déployé ». La section 3 donne les commandes exactes pour le
faire.

## 3. Mettre en service (commandes exactes, à exécuter par vous)

1. Créer un projet Supabase (ou une base Postgres compatible).
2. Appliquer les migrations, dans l'ordre, via le SQL Editor de Supabase ou `psql` :
   ```
   supabase/migrations/0001_analytics_core.sql
   supabase/migrations/0002_analytics_views.sql
   supabase/migrations/0003_data_quality.sql
   supabase/migrations/0004_dashboard_functions.sql
   ```
   (Avec la CLI Supabase installée et un projet lié : `supabase db push`.)
3. Copier `.env.example` vers `.env.local` et renseigner : `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ANALYTICS_ADMIN_PASSWORD`, `ANALYTICS_ADMIN_SESSION_SECRET`.
4. `npm run build && npm start` (ou `npm run dev` en local).
5. Vérifier : jouer une campagne avec les statistiques anonymes activées (Paramètres), puis
   ouvrir `/admin/analytics/overview` et confirmer qu'au moins un run apparaît.
6. Optionnel, pour peupler le dashboard avant tout trafic réel :
   `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run analytics:seed` (voir §11).

## 4. Isolation du moteur de jeu

Aucun fichier sous `src/game/engine/**`, `src/game/data/**` ou `src/game/schemas/**` n'a été
modifié. L'instrumentation observe les transitions de `GameState` depuis l'extérieur
(`src/features/campaign/game-app.tsx`), jamais depuis l'intérieur du moteur. Garantie vérifiée par
`src/analytics/__tests__/determinism.test.ts` : même graine + mêmes choix ⇒ même `GameState` final,
analytics actif ou non.

## 5. Identifiants

`anonymous_user_id` (UUID local persistant, IndexedDB), `session_id` (par onglet), `run_id`
(réutilise directement `GameState.runId`, pas de réinvention), `event_uuid` (idempotence),
`client_sequence` (ordonnancement). Détail : `docs/analytics/ARCHITECTURE_PLAN.md` §5.

## 6. Versions

`app_version`, `engine_version`, `content_version`, `analytics_schema_version`, `build_sha` — tous
lus depuis une source existante unique, jamais dupliqués en dur. Détail :
`src/analytics/versions.ts`.

## 7. Catalogue d'événements

`docs/analytics/EVENT_CATALOG.md`. Pas d'événement `game_abandoned` — statut de run dérivé
côté lecture (`ongoing` / `completed` / `stale_incomplete`).

## 8. Schéma de données

`docs/analytics/DATA_DICTIONARY.md`. Trois tables (`analytics_events`, `analytics_runs`,
`analytics_decisions`), RLS activé, aucun accès direct du navigateur.

## 9. Confidentialité et consentement

`docs/analytics/PRIVACY.md`. Opt-in en production, désactivé par défaut en dev, aucune
revendication de conformité légale.

## 10. Ingestion

`POST /api/analytics/events` (`src/app/api/analytics/events/route.ts`) : lot de 1 à 50
événements, 256 Ko max, validation par événement (un événement invalide n'invalide pas le lot),
idempotent sur `event_uuid`, jamais de crash — répond toujours un statut défini. Si Supabase n'est
pas configuré, répond `200 { stored: false }` : le client vide sa file locale au lieu de retenter
indéfiniment.

## 11. Génération de données de démo (DEV uniquement)

```
npm run analytics:seed          # 9 partis × 15 campagnes synthétiques
npm run analytics:seed -- --clean   # supprime uniquement les runs seedés (run_id préfixé "seed-")
```

Refuse de s'exécuter si `NODE_ENV=production` ou si les variables Supabase sont absentes. Ne
touche jamais aux données réelles (préfixe `seed-` dédié).

## 12. Authentification admin

Pas de système d'auth préexistant dans ce dépôt (jeu 100 % local, sans compte) — mécanisme dédié
et minimal : `/admin/login` vérifie `ANALYTICS_ADMIN_PASSWORD`, pose un cookie signé HttpOnly/
Secure(prod)/SameSite=Strict (`src/analytics/server/adminSession.ts`, HMAC-SHA256 avec
`ANALYTICS_ADMIN_SESSION_SECRET`). `/admin/analytics/**` et `/api/admin/analytics/**` sont
protégés par `src/proxy.ts` (Next.js 16 a renommé `middleware.ts` en `proxy.ts` — voir
`node_modules/next/dist/docs/.../proxy.md`). `/admin/analytics` n'apparaît dans aucune navigation
publique.

## 13. Dashboard

Six onglets sous `/admin/analytics/` : `overview`, `equilibrage`, `gameplay`, `retention`,
`qualite`, `versions`. Filtres (période, parti, versions, statut, phase) en formulaire GET simple
— reflétés dans l'URL, partageables, fonctionnent sans JavaScript. Export CSV sécurisé (session
admin requise) pour `overview` et `equilibrage` via `/api/admin/analytics/export?view=...`.
Aucune nouvelle bibliothèque de graphiques : les visualisations réutilisent le motif SVG/CSS déjà
présent dans `src/features/results/final-screen.tsx`.

## 14. Qualité de données

`docs/analytics/DATA_QUALITY.md` — compteur d'anomalies visible dans l'onglet Qualité.

## 15. Expérimentation

`docs/analytics/EXPERIMENTATION.md` — groundwork seulement (`experiment_id`/`variant_id`),
aucune expérience active.

## 16. Tests

- Unitaires : identité, consentement, file offline, dédup/attempts, versions
  (`src/analytics/__tests__/**`, `src/analytics/server/__tests__/**`).
- Déterminisme moteur (mission-critical) : `src/analytics/__tests__/determinism.test.ts`.
- API d'ingestion : `src/app/api/analytics/events/__tests__/route.test.ts`.
- E2E Playwright : `e2e/analytics-telemetry.spec.ts` (consentement, non-blocage sur échec
  d'ingestion), `e2e/admin-analytics-auth.spec.ts` (login/logout/protection).

```
npm run test        # unitaire + intégration (Vitest)
npm run test:e2e     # Playwright, y compris les deux suites ci-dessus
```

## 17. Variables d'environnement

Voir `.env.example` pour la liste complète et les placeholders. Résumé :
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement), `ANALYTICS_ADMIN_PASSWORD`,
`ANALYTICS_ADMIN_SESSION_SECRET`, `ANALYTICS_STALE_RUN_HOURS_DEFAULT` (valeur par défaut documentée, la
valeur qui compte réellement à l'exécution vit dans la table `analytics_settings` — voir
`DATA_DICTIONARY.md`), `NEXT_PUBLIC_ANALYTICS_MODE` (`off` par défaut hors production, `opt-in`
en production), `NEXT_PUBLIC_BUILD_SHA` (optionnel, renseigné par la plateforme de déploiement).
