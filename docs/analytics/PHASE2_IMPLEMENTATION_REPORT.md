# Rapport d'implémentation — Product Analytics Phase 2

## A. Résumé

Phase 2 comble les trous de télémétrie identifiés dans `docs/analytics/PHASE2_AUDIT.md` :
séparation exposition/sélection/résolution d'une décision, scores électoraux T1/T2 et adversaire
de second tour, ouverture du tableau de bord joueur, erreurs techniques catégorisées,
correction du versioning (`engine_version` ne représente plus le schéma de sauvegarde),
observabilité d'ingestion, extension de la Data Quality, durcissement de la concurrence
d'ingestion (upserts atomiques), et mise à jour du dashboard pour exploiter ces nouvelles
données. Aucune reconstruction de l'existant — tout ce qui fonctionnait en Phase 1 a été
conservé et étendu. Le moteur de jeu n'a subi aucune modification.

## B. Ce qui a été codé

- `docs/analytics/PHASE2_AUDIT.md` : audit ligne à ligne du HEAD Phase 1 contre le code réel,
  matrice question produit → gap → action, avant toute écriture.
- `decision_viewed` / `choice_selected` : nouveaux événements, dédupliqués côté client
  (`src/features/campaign/campaign-screens.tsx`), avec un test verrouillant la dédup sous
  React Strict Mode.
- `decision_resolved` enrichi (`playerPollBefore/After`, `popularityBefore/After`,
  `momentumBefore/After`), lu directement dans `GameState.parties[...].stats` avant/après
  résolution — jamais recalculé.
- `first_round_result`/`second_round_result` enrichis (`score`, `opponentPartyId`), lus
  directement sur `ElectionRoundResult.results`/`ranking`.
- `race_snapshot` enrichi (`phase`, `playerScore`).
- `player_dashboard_opened` : ajouté, l'UI possédait déjà un vrai tableau de bord joueur
  (`CampaignDashboard`) — l'événement est câblé sur les deux points d'ouverture réels.
- `game_error` : liste fermée de 5 `errorCode`, correspondant aux 7 sites `catch` réels déjà
  présents dans le code (`gameStore.ts`, `game-app.tsx`, `game-database.ts` via un nouveau
  discriminant `LoadGameWarningCode`) — jamais de message brut envoyé.
- **Bug réel trouvé et corrigé** : `DecisionRecord.decisionIndex` (moteur) est assigné après
  incrémentation de `state.decisionIndex`, donc décalé de 1 par rapport à la valeur que
  `decision_viewed`/`choice_selected` observent avant résolution. Sans correction, aucune
  décision n'aurait jamais fusionné correctement dans `analytics_decisions`. Trouvé par le test
  E2E ajouté dans cette phase, corrigé dans `game-app.tsx`, verrouillé par un test dédié
  (`decisionIndexConvention.test.ts`).
- Versioning : `ENGINE_LOGIC_VERSION` (nouvelle constante, logique moteur) distinct de
  `save_schema_version` (= `GAME_CONFIG.schemaVersion`, compatibilité de sauvegarde) — voir
  `docs/analytics/VERSIONING_POLICY.md`.
- Migrations `0005` (colonnes) et `0006` (fonctions/vues/Data Quality étendue), non destructives,
  `0001`–`0004` inchangées sur disque.
- `fn_upsert_analytics_run`/`fn_upsert_analytics_decision` : upserts atomiques remplaçant le
  select-puis-upsert Phase 1 documenté comme risque de concurrence.
- `analytics_ingestion_batches` + `recordIngestionBatch` : observabilité de lot sans jamais
  stocker de payload rejeté.
- 8 nouveaux contrôles Data Quality.
- Dashboard : Overview (stale/completion/runs-par-navigateur/durée médiane/qualification/
  victoire + avertissement de couverture opt-in), Équilibrage (score T1 moyen/médian, victoire |
  qualifié), Gameplay (expositions réelles, part de sélection avec seuils 80/90/5 %, latence
  médiane bornée), Rétention (usage du tableau de bord, matrice second tour parti × adversaire),
  Versions (flags rare/chaîne/décisif, contenu jamais exposé sur la période), Qualité
  (observabilité d'ingestion, erreurs techniques par code).
- `npm run analytics:seed` réécrit pour couvrir viewed/selected/resolved, latences variées,
  scores T1/T2 + adversaire, ouvertures de dashboard, erreurs, deux profils de version, runs
  incomplets/stale, biais événements rares, mix choix dominants/équilibrés — auto-validé contre
  les schémas Zod réels avant toute écriture (22 711 événements générés vérifiés sans échec dans
  cette session).
- `npm run analytics:verify:remote` (`scripts/analytics-verify-remote.ts`) : smoke test complet
  contre un vrai Supabase (schéma, cycle complet du catalogue, idempotence, nettoyage ciblé) —
  écrit et relu, jamais exécuté faute de connexion réelle (voir §D).
- `docs/analytics/VERSIONING_POLICY.md`, `PRODUCT_ANALYTICS_COVERAGE.md`,
  `REMOTE_ENABLEMENT_CHECKLIST.md` créés ; `EVENT_CATALOG.md`, `DATA_DICTIONARY.md`, `README.md`
  mis à jour.

## C. Ce qui a été testé localement (résultats réels de cette session)

- **Déterminisme** : `src/analytics/__tests__/determinism.test.ts` — même graine + mêmes choix
  produit un `GameState` final strictement identique avec l'intégralité du catalogue Phase 2
  (`decision_viewed`, `choice_selected`, `decision_resolved` enrichi,
  `player_dashboard_opened`, `game_error`) actif ou non. **PASS.**
- **Unitaire/intégration (Vitest)** : 3180 tests passés sur 339 fichiers de suite réels (contre
  3160/335 avant cette phase), dont tous les nouveaux tests Phase 2 (schémas d'événements,
  convention `decisionIndex`, séparation `save_schema_version`/`engine_version`, dédup
  `decision_viewed` sous Strict Mode, `choice_selected`, `player_dashboard_opened`, ingestion
  hors-ordre `resolved→viewed→selected`, idempotence, observabilité de lot). 0 échec sur du code
  de cette mission. Même limite pré-existante que la Phase 1, non causée par cette mission : 4
  suites à 0 test échouent en résolvant des dépendances de test internes à `zod` dans
  `linkedin/*/node_modules/` (répertoire non lié, présent avant cette mission).
- **`npm run lint`** : 0 erreur (3 avertissements pré-existants, scripts d'audit non liés).
- **`npx tsc --noEmit`** : aucune erreur.
- **`npm run data:validate`** : inchangé, validation structurelle et éditoriale réussie (9
  partis, 290 événements — identique à avant cette mission, confirmant qu'aucune donnée de jeu
  n'a été touchée).
- **`npm run build`** : build de production réussi, avec zéro variable Supabase configurée.
- **Playwright, suite complète chromium (32 tests)** : **32/32 passés**, y compris les 2 nouveaux
  tests E2E Phase 2 (`decision_viewed → choice_selected → decision_resolved` dans l'ordre pour
  la décision jouée, `run_id` stable après rechargement — c'est ce dernier qui a révélé le bug de
  `decisionIndex` corrigé en §B). Suite E2E analytics (4 specs) revérifiée sur le projet
  `mobile` : **9/9 passés**.
- **Fuzzing léger du seed** : 22 711 événements générés par `buildRunEvents` (9 partis × 40
  itérations) validés un par un contre les schémas Zod réels — 0 échec.

## D. Ce qui a été réellement vérifié sur PostgreSQL distant

**Rien.** Aucune base Supabase réelle n'a été configurée, connectée ni interrogée durant cette
session — confirmé par une détection explicite (§20 de la mission) : aucun `.env.local`, aucune
variable `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` dans l'environnement, aucune CLI Supabase
installée, aucun projet lié (`supabase/config.toml` absent).

Les migrations `0005`/`0006` et le script `analytics-verify-remote.ts` ont été relus
attentivement (dépendances entre vues/fonctions vérifiées manuellement — par exemple,
`analytics_run_status` devait être reconstruite avant `fn_party_performance` pour exposer les
nouvelles colonnes, et l'ancienne `fn_party_performance` devait être supprimée avant de recréer
`analytics_run_status` sous peine d'erreur de dépendance Postgres), mais **jamais exécutées
contre un moteur Postgres réel** — ni local, ni distant. Aucun outil (`psql`, `docker`) n'était
disponible dans cet environnement pour une validation syntaxique par exécution.

Ceci n'a jamais été présenté comme fait dans ce rapport, dans les commits, ni dans la
documentation.

## E. Ce qui reste bloqué par une action externe

- **Application réelle des migrations `0001`–`0006`** sur un projet Supabase — nécessite les
  10 étapes de `docs/analytics/REMOTE_ENABLEMENT_CHECKLIST.md` (créer/choisir un projet, poser
  les variables, appliquer les migrations).
- **`npm run analytics:verify:remote`** — écrit, jamais exécuté faute de connexion.
- **Vérification réelle des 6 onglets du dashboard sur données réelles** (§23 de la mission) —
  nécessite l'étape précédente.
- **Consentement bout en bout sur backend réel** (§24) — la logique côté client
  (`unset`/`denied` ⇒ rien envoyé, `granted` ⇒ événements en file puis envoyés, retrait ⇒ arrêt
  immédiat) est testée unitairement et en E2E contre un serveur mocké/fail-open ; la vérification
  qu'un événement atterrit bien en base Postgres réelle après consentement nécessite la même
  connexion.
- **Test de charge PostgreSQL réel** (§22) — non applicable sans base réelle ; le test de charge
  Phase 1 (5000 événements, chemin de validation uniquement) reste la seule mesure disponible.

## F. Limites connues (Phase 2, en plus de celles de la Phase 1)

- **Distribution du rang T1** et **graphique dédié effets avant/après** : donnée intégralement
  captée en base, non exposée comme visualisation dédiée dans le dashboard actuel — voir
  `PRODUCT_ANALYTICS_COVERAGE.md`, statut `PARTIAL` explicite, pas un gap de télémétrie.
  Périmètre volontairement limité par la consigne « ne refais pas le dashboard visuellement ».
- **Identifiants event/choice inconnus** (§13 de la mission) : contrôle Data Quality non ajouté
  — validerait contre le catalogue de contenu du jeu, qui ne vit pas dans Postgres ; synchroniser
  ce catalogue en base est jugé disproportionné pour cette phase (« ne sur-ingénierie pas »).
  Documenté comme gap assumé dans `docs/analytics/DATA_QUALITY.md`.
- **Concurrence multi-onglets sur `analytics_decisions`/`analytics_runs`** : durcie par des
  upserts atomiques (§30), mais deux requêtes d'ingestion strictement simultanées pour le même
  run restent chacune une transaction Postgres séparée — l'atomicité est garantie par ligne, pas
  par une transaction unique enveloppant tout le lot. Non testé en conditions de charge réelle
  (aucune base disponible).
- **`ANALYTICS_STALE_RUN_HOURS_DEFAULT`** reste purement informationnel — aucun mécanisme
  automatique ne synchronise cette variable avec `analytics_settings.stale_run_hours` ; un
  changement de seuil reste une action manuelle en base (documentée).
- Toutes les limites de la Phase 1 restent valables et n'ont pas été réévaluées à la baisse :
  `anonymous_user_id` ≠ une personne précise, `stale_incomplete` ≠ abandon certain, couverture
  limitée aux joueurs ayant activé les statistiques, volume réel nul à ce jour.

## G. Commits locaux (aucun push)

4 commits atomiques Phase 2, auteur `Axel Corral <axel.corral.pro@gmail.com>`, aucune mention
Claude/Anthropic (vérifié par `git show` sur chacun) :

1. `bf50a93` `feat(analytics): add decision exposure/selection telemetry and correct versioning`
2. `04c9c0a` `feat(analytics): harden ingestion concurrency and add observability/quality checks`
3. `a4c8bb4` `feat(analytics): extend product analytics dashboard for phase 2 data`
4. `fa4fb1d` `test(analytics), docs(analytics): add phase 2 regression tests and docs`

Total dépôt : 10 commits d'avance sur `origin/main` (6 Phase 1 + 4 Phase 2), aucun push.

## H. Checklist de succès (§29 de la mission)

- [x] HEAD réaudité (`docs/analytics/PHASE2_AUDIT.md`)
- [x] docs/code comparés ligne à ligne avant toute écriture
- [x] `decision_viewed` disponible
- [x] `choice_selected` disponible
- [x] Exposition mesurable (dénominateur réel introduit)
- [x] Choice share calculable avec le bon dénominateur
- [x] Latence mesurable (colonne générée, bornée en reporting)
- [x] Décisions enrichies idempotemment (testé hors-ordre)
- [x] Score T1 joueur stocké
- [x] Score T2 joueur stocké
- [x] Adversaire T2 stocké
- [x] Trajectoire joueur mesurable (`race_snapshot` enrichi)
- [x] Usage dashboard joueur mesurable (UI réelle existante, câblée)
- [x] Erreurs techniques structurées (liste fermée, sites réels)
- [x] Save schema séparé d'engine logic version
- [x] Politique de versioning documentée
- [x] Rejected rate durablement observable (`analytics_ingestion_batches`)
- [x] Data Quality étendue (8 nouveaux contrôles)
- [x] Concurrence ingest durcie (upserts atomiques)
- [x] Source stale claire (table Postgres, env var informationnelle uniquement)
- [x] Dashboard Gameplay exploite exposures/choices/latency
- [x] Dashboard Équilibrage exploite score T1
- [x] Matchup T2 réel (parti × adversaire)
- [x] Seed DEV mis à jour et auto-validé
- [x] Couverture produit documentée
- [x] Déterminisme vert
- [x] Tests verts
- [x] Build vert
- [x] Aucun secret
- [x] Aucun changement gameplay
- [x] Aucun push

Section « Si Supabase réel disponible » : non applicable — aucune connexion réelle disponible
dans cette session (voir §D).

## I. Verdict final

**READY FOR REMOTE ENABLEMENT**

Le code local est complet, testé (déterminisme, unitaire, ingestion, E2E, build) et documenté de
bout en bout. `READY FOR PRODUCTION DATA` n'est pas utilisé : aucune connexion Supabase réelle
n'était disponible dans cette session, aucune migration n'a été réellement appliquée, et
`npm run analytics:verify:remote` n'a jamais été exécuté contre une base réelle. Les 10 étapes
exactes pour lever ce blocage sont dans `docs/analytics/REMOTE_ENABLEMENT_CHECKLIST.md`.
