# Rapport d'implémentation — Couche Product Analytics + Dashboard

## A. Résumé

Ajout d'une couche analytics produit complète (télémétrie de jeu anonyme, opt-in, non
bloquante) et d'un dashboard privé `/admin/analytics`, au-dessus du jeu « Vers l'Élysée »
existant. Le moteur de jeu n'a subi aucune modification. Le jeu fonctionne intégralement sans
cette couche — vérifié par build/dev/test réussis avec zéro variable Supabase configurée.

## B. Ce qui a été construit

- **Audit du dépôt** : `docs/analytics/ARCHITECTURE_PLAN.md` — état réel du code avant toute
  écriture (Next.js 16.3 App Router, aucune route API préexistante, aucune infra Supabase,
  identifiants `runId`/`seed` déjà présents dans `GameState`, `idb`/`zod` déjà en dépendances).
- **Schéma Postgres** : 4 migrations SQL versionnées (`supabase/migrations/0001` à `0004`) —
  `analytics_events` (log brut append-only), `analytics_runs`, `analytics_decisions`, vues
  d'agrégation, contrôles de qualité, fonctions SQL filtrables pour le dashboard. RLS activé,
  aucune policy accordée à `anon`/`authenticated`.
- **Client analytics** : `src/analytics/` — `track()` non bloquant, file persistante IndexedDB
  (réutilise `idb`, déjà une dépendance), consentement opt-in, identifiants indépendants du
  moteur, versions lues depuis une source unique existante.
- **Ingestion** : `POST /api/analytics/events` — validation Zod par événement (un événement
  invalide n'invalide pas le lot), idempotente sur `event_uuid`, fail-open si Supabase n'est pas
  configuré.
- **Instrumentation de jeu** : `src/features/campaign/game-app.tsx` observe les transitions de
  `GameState` depuis l'extérieur du moteur ; aucun fichier sous `src/game/engine/**` ou
  `src/game/data/**` n'a été touché.
- **Consentement et confidentialité** : bascule opt-in dans Paramètres, page Confidentialité
  réécrite pour rester honnête, `docs/analytics/PRIVACY.md`.
- **Authentification et dashboard admin** : `/admin/login`, cookie de session signé
  (HMAC-SHA256, `node:crypto`), protection via `src/proxy.ts` (Next.js 16 a renommé
  `middleware.ts` en `proxy.ts`), six onglets (`overview`, `equilibrage`, `gameplay`,
  `retention`, `qualite`, `versions`), filtres dans l'URL, export CSV protégé.
- **Outillage DEV** : `npm run analytics:seed` (données synthétiques, refuse de tourner en
  production ou sans Supabase configuré).
- **Tests** : unitaires (identité, consentement, file, dédup/attempts), déterminisme moteur,
  API d'ingestion, E2E Playwright (télémétrie de jeu + authentification admin).
- **Documentation** : `README.md`, `EVENT_CATALOG.md`, `DATA_DICTIONARY.md`, `DATA_QUALITY.md`,
  `PRIVACY.md`, `EXPERIMENTATION.md`, ce rapport.

## C. Isolation du moteur de jeu

Aucun fichier sous `src/game/engine/**`, `src/game/data/**` ou `src/game/schemas/**` n'a été
modifié (vérifié par audit du diff, section K). Garantie testée explicitement :
`src/analytics/__tests__/determinism.test.ts` rejoue la même graine avec les mêmes choix, avec
et sans la couche analytics active, et compare le `GameState` final — identique dans les deux
cas. Un second test confirme que `track()` ne modifie jamais `state.rng`.

## D. Identifiants et versions

`run_id` réutilise directement `GameState.runId` (déjà stable, déjà persisté) — aucune
réinvention. `anonymous_user_id`/`session_id`/`event_uuid` générés indépendamment du RNG du
moteur. `app_version`/`engine_version`/`content_version` lus depuis des constantes existantes
(`BRANDING.version`, `GAME_CONFIG.schemaVersion`, `gameContent.contentVersion`), jamais dupliqués
en dur. Détail : `docs/analytics/ARCHITECTURE_PLAN.md` §5-6.

## E. Catalogue d'événements et statut de run

11 types d'événements (`docs/analytics/EVENT_CATALOG.md`), tous traçables à un champ réel du
moteur — aucun champ inventé. Pas d'événement `game_abandoned` : le statut
(`ongoing`/`completed`/`stale_incomplete`) est dérivé côté lecture par la vue
`analytics_run_status`, à partir de `last_event_at` et d'un seuil configurable
(`analytics_settings.stale_run_hours`, documenté en parallèle de la variable d'env
`ANALYTICS_STALE_RUN_HOURS` — voir §H sur la limite de ce mécanisme).

## F. Sécurité

Aucun accès direct du navigateur à la base : tous les écrits passent par l'API serveur, validés
par schéma strict. `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur, jamais dans une variable
`NEXT_PUBLIC_*`. RLS activé sur les trois tables analytics sans policy `anon`/`authenticated`.
Session admin : cookie signé HMAC-SHA256, HttpOnly, `Secure` en production, `SameSite=Strict`,
comparaison de mot de passe en temps constant (`crypto.timingSafeEqual`). Aucun secret réel commité
— `.env.example` ne contient que des placeholders (`change-me`, valeurs vides).

## G. Tests — résultats réels de cette session

- Unitaire/intégration (Vitest) : **3160 tests passés** sur 335 fichiers de suite réels, y
  compris tous les tests analytics ajoutés (identité, consentement, file, dédup, ingestion,
  session admin, déterminisme). 0 échec sur du code de la mission.
  _Limite pré-existante notée, non causée par cette mission_ : 4 « suites » à 0 test échouent en
  tentant de résoudre des dépendances de test internes à `zod` situées dans
  `linkedin/*/node_modules/` (répertoire non lié au dépôt principal, présent avant cette
  mission) — `vitest.config.ts` n'a pas été modifié pour l'exclure, car hors périmètre de la
  mission analytics.
- `npm run lint` : 0 erreur (3 avertissements pré-existants, dans des scripts d'audit non liés
  à cette mission).
- `npx tsc --noEmit` : aucune erreur.
- `npm run data:validate` : validation structurelle et éditoriale réussie (inchangée).
- `npm run build` : build de production réussi, **avec zéro variable Supabase configurée** —
  toutes les routes admin/API compilent, `proxy` (middleware) détecté.
- Playwright, suite complète chromium (30 tests, incluant les 2 nouvelles suites analytics et
  les 13 suites de jeu/accessibilité/regression visuelle préexistantes) : **30/30 passés**. Les
  2 nouvelles suites (`admin-analytics-auth.spec.ts`, `analytics-telemetry.spec.ts`) ont aussi
  été vérifiées sur le projet `mobile` (7/7 passés).

## H. Limites connues (à ne jamais présenter comme résolues)

- **`anonymous_user_id` n'identifie pas une personne précise** — c'est un identifiant de
  navigateur. Une même personne sur deux appareils apparaît deux fois ; un appareil partagé peut
  représenter plusieurs personnes. Rappelé dans `PRIVACY.md`, `DATA_DICTIONARY.md` et directement
  dans les onglets « Overview » et « Rétention » du dashboard.
- **Un run `stale_incomplete` n'est pas une preuve d'abandon** — seulement l'absence d'événement
  depuis le seuil configuré ; une reprise fait redevenir le run `ongoing`.
- **L'opt-in limite structurellement la couverture** : les métriques ne représentent jamais
  100 % des parties jouées, seulement celles des joueurs ayant explicitement activé les
  statistiques. Ce biais de sélection n'est mesuré nulle part dans cette implémentation.
- **Volume initial nul** : aucune donnée réelle n'existe. Toutes les vérifications de cette
  session ont porté sur des fixtures de test ou sur `npm run analytics:seed` (données
  synthétiques, jamais mêlées à des données réelles grâce au préfixe `run_id` dédié).
- **`ANALYTICS_STALE_RUN_HOURS` n'est pas lu par le code applicatif** : le seuil réellement
  utilisé par les vues SQL vit dans la table `analytics_settings` ; la variable d'environnement
  n'est qu'une valeur par défaut documentée, à synchroniser manuellement (commande SQL fournie
  dans `DATA_DICTIONARY.md`). Décision assumée plutôt que camouflée : une vue SQL ne peut pas lire
  une variable d'environnement Next.js au moment de la lecture.
- **Cohérence multi-run sous forte concurrence non garantie** : l'agrégation d'un run
  (`src/analytics/server/ingest.ts`) fait un `select` puis un `upsert` non transactionnels — une
  même campagne ouverte simultanément dans deux onglets pourrait, dans de rares cas, produire une
  écrasement partiel d'un champ par l'autre. Non critique pour de l'analytics agrégé à ce stade,
  documenté plutôt que corrigé par une infrastructure disproportionnée.
- **Aucun événement `setup_step_viewed` de sortie** : seule la première apparition de chaque écran
  de configuration est comptée par session d'application, pas chaque étape d'un funnel utilisateur
  par utilisateur — signal grossier, explicitement documenté comme tel.
- **Charge testée uniquement sur le chemin de validation, pas sur de vraies écritures Postgres**
  (voir §I) — aucune affirmation de performance à l'échelle production n'est faite.

## I. Test de charge local (léger)

5000 événements envoyés à `POST /api/analytics/events` par lots de 50 (100 requêtes), contre un
serveur `next dev` local, **sans Supabase configuré** (chemin de validation/réponse uniquement,
aucune écriture réelle en base — aucune affirmation de performance de stockage n'est faite ici) :

```
Total events sent: 5000
Batches: 100 (size 50) — ok: 100, error: 0
Total wall time: 1.18s
Throughput: 4221 events/s
Batch latency p50/p95/p99 (ms): 9.3 / 15.6 / 190.7
```

100 % des lots acceptés (0 erreur). Résultat cohérent avec un chemin fail-open léger ; ne
présume rien du débit réel d'écriture Postgres, qui dépendra du projet Supabase choisi.

## J. Statut de déploiement — honnête

**Aucune base Supabase réelle n'a été créée, configurée ni utilisée durant cette session.**
Aucune migration n'a été appliquée à un projet réel. Toute la validation ci-dessus s'est faite
contre des fixtures en mémoire (tests) ou contre le chemin fail-open (aucun Supabase configuré).
Les commandes exactes pour déployer réellement sont dans `docs/analytics/README.md` §3.

## K. Audit du diff — confirmation finale

- `git status --porcelain` avant et après cette mission : identique en dehors des fichiers créés
  par cette mission (`src/analytics/**`, `src/app/admin/**`, `src/app/api/**`, `supabase/**`,
  `docs/analytics/**`, `e2e/admin-analytics-auth.spec.ts`, `e2e/analytics-telemetry.spec.ts`,
  `scripts/analytics-seed.ts`) et des modifications additives listées en §B. `next.config.ts`
  reste modifié depuis avant cette mission (tunnel Cloudflare de dev, non lié) — non touché ici.
- Aucun fichier sous `src/game/**` ou `scripts/audit*/**` modifié.
- Aucun secret commité (`.env.example` ne contient que des placeholders).
- Aucune donnée personnelle identifiable collectée par construction (schémas Zod stricts, revue
  explicite dans `DATA_DICTIONARY.md`).
- Un artefact de test généré par inadvertance
  (`audit-results/form-improvement/post/accessibility-post.csv`, régénéré par l'exécution de la
  suite Playwright préexistante `accessibility-audit.spec.ts`) a été identifié et rétabli à son
  état commité — non lié à cette mission, non conservé.

## L. Commits locaux (aucun push)

5 commits atomiques, auteur `Axel Corral <axel.corral.pro@gmail.com>`, aucune mention
Claude/Anthropic (vérifié par `git show` sur chacun) :

1. `feat(analytics): add Postgres schema, migrations, and architecture plan`
2. `feat(analytics): add non-blocking client, offline queue, and ingestion API`
3. `feat(analytics): instrument gameplay telemetry and consent UI`
4. `feat(analytics): add admin authentication and /admin/analytics dashboard`
5. `test(analytics), docs(analytics): add test suite, dev seed, and documentation`

Ce rapport constitue un commit distinct, postérieur aux cinq ci-dessus.

## M. Checklist de succès

- [x] Le jeu fonctionne sans aucune variable Supabase configurée (build/dev/test vérifiés).
- [x] Aucun fichier moteur/données modifié.
- [x] Test de déterminisme moteur présent et vert.
- [x] `run_id` réutilisé depuis `GameState`, pas réinventé.
- [x] Versions lues depuis des sources uniques existantes.
- [x] Pas d'événement `game_abandoned` ; statut dérivé à la lecture.
- [x] Aucun champ analytics inventé — traçabilité documentée événement par événement.
- [x] RLS activé, clé de service jamais exposée au client.
- [x] Ingestion idempotente, fail-open, jamais bloquante pour le joueur (prouvé par test E2E).
- [x] Consentement opt-in, désactivé par défaut, file vidée au refus/retrait, accès jeu jamais
      conditionné.
- [x] Page Confidentialité honnête (ne prétend plus « sans outil d'analytics »).
- [x] Dashboard protégé, non lié dans la navigation publique.
- [x] Six onglets, filtres dans l'URL, export CSV protégé.
- [x] Aucune nouvelle dépendance de charting.
- [x] Script de seed DEV, refuse la production/l'absence de Supabase.
- [x] Suite de tests complète (unitaire, déterminisme, API, E2E) verte.
- [x] `.env.example` à jour, sans secret réel.
- [x] `npm run check`-équivalent (format/lint/typecheck/data/tests/build) exécuté et vert sur le
      périmètre de la mission.
- [x] Diff audité : aucune donnée de jeu, aucune probabilité, aucun secret modifié.
- [x] Test de charge léger exécuté et documenté honnêtement (chemin de validation uniquement).
- [x] 5 commits atomiques locaux, aucun push, auteur correct, aucune mention Claude/Anthropic.
- [x] Ce rapport, avec une section « Limites connues » qui ne minimise rien.

## N. Verdict final

**READY FOR CONFIGURATION**

Justification : l'ensemble de la chaîne (jeu → événements anonymes → ingestion → schéma
versionné → modèle analytique → contrôles qualité → dashboard) est codé, testé et documenté de
bout en bout, et le jeu reste prouvé fonctionnel sans cette couche. Le verdict « READY FOR
PRODUCTION DATA » n'est pas utilisé car aucune base Supabase réelle n'a été configurée ni
vérifiée durant cette session — seule une vraie mise en service (§ J, commandes dans
`docs/analytics/README.md` §3) permettrait de le revendiquer honnêtement.
