# Plan d'architecture — Couche Product Analytics + Dashboard

Document produit avant toute implémentation, à l'issue de l'audit du dépôt prescrit en
section 1 de la mission. Aucun fichier de moteur ou de données de jeu n'a été modifié pour
produire ce document.

## 1. Constat d'audit (état réel du dépôt, vérifié dans cette session)

- **Framework** : Next.js `^16.3.0`, App Router (`src/app/**`), Turbopack (`next.config.ts`),
  React 19.2. Aucune route API n'existe actuellement (`src/app/api` absent).
- **Package manager** : npm (`package-lock.json`, scripts `npm run …`).
- **Moteur de jeu** : `src/game/engine/**` — fonctions pures (`createGame`,
  `resolveCurrentChoice`, `currentEvent`, `validateGameState`, exportées depuis
  `src/game/engine/index.ts`). Aucun effet de bord, aucun accès réseau, RNG explicite et
  immuable (`RngState = { seedHash, state, draws }`, thread dans `GameState.rng`, dérivé via
  `hashSeed`/`deriveStableId` dans `src/game/engine/rng.ts`).
- **Couche UI/controller** : `src/features/campaign/gameStore.ts` (store Zustand,
  `useGameStore`) appelle le moteur (`createGame`, `resolveCurrentChoice`) et détient l'état UI
  (écran courant, setup). `src/features/campaign/game-app.tsx` orchestre le cycle de vie
  (chargement, autosave, archivage) via des `useEffect` déjà non bloquants et déjà tolérants à
  l'échec (try/catch → `warning`, jamais d'exception qui casse le jeu). **C'est le point
  d'intégration retenu pour l'instrumentation** — aucun fichier sous `src/game/engine/**` ne
  sera touché.
- **Sauvegarde locale** : IndexedDB via `idb` (déjà une dépendance) —
  `src/lib/storage/game-database.ts`. Bases `active` (partie en cours), `archives` (parties
  terminées), `meta` (profil), `settings` (préférences). `idb` sera réutilisé tel quel pour la
  file d'attente analytics offline (aucune nouvelle dépendance de stockage).
- **Identifiants existants dans `GameState`** (`src/game/types/index.ts:912`) :
  - `runId: string` — stable, dérivé (`deriveStableId`) de `seed + playerPartyId +
runInstanceId` ; persiste à travers reload/resume car il fait partie de l'état sauvegardé.
    **Réutilisé tel quel comme `run_id` analytics** — aucune réinvention.
  - `runInstanceId: string` — généré une fois à la création de la partie
    (`freshRunInstanceId()` dans `gameStore.ts`), lui aussi persisté. Sert de garde anti-doublon
    (`archivedRunIds` dans `game-app.tsx`) : le même pattern sera repris pour éviter de ré-émettre
    `run_started` sur un simple remount.
  - `seed: string`, `version: number` (= `GAME_CONFIG.schemaVersion`, schéma de sauvegarde, pas
    un numéro de version applicative).
  - `decisionIndex`, `decisionHistory: DecisionRecord[]` (un enregistrement par décision
    résolue, avec `eventId`, `choiceId`, `outcomeId`, `internalRoll`,
    `internalProbabilities` — déjà exactement les champs nécessaires aux événements
    `decision_resolved`, aucun champ à inventer).
  - `phase: GamePhase` (9 valeurs : `setup → pre_campaign → campaign → official_campaign →
first_round → between_rounds → second_round → government_epilogue → finished`).
  - `pollHistory: PollSnapshot[]`, `firstRoundResult`/`secondRoundResult: ElectionRoundResult`,
    `finalResult: FinalResult` (score, `breakdown`, `won`, `qualified`, `endingId`,
    `progressionNormalized`, etc.) — source unique pour les snapshots de course et l'événement
    `run_completed`.
  - Partis : 9 identifiants stables (`lfi`, `ps`, `ecologistes`, `renaissance`, `horizons`,
    `lr`, `rn`, `reconquete`, `nouvelle_energie`, `src/game/data/parties.ts`).
- **Versionnage existant, source unique par concept** :
  - `app_version` ← `BRANDING.version` (`src/config/branding.ts`) = `"0.1.0"`, identique à
    `package.json.version`. Réutilisé tel quel.
  - `content_version` ← `gameContent.contentVersion` (`src/game/data/index.ts`) = `2`. Réutilisé
    tel quel.
  - `engine_version` : aucune constante dédiée n'existe. `GAME_CONFIG.schemaVersion`
    (`src/config/game.ts`) = `2` désigne le schéma de sauvegarde (compatibilité des
    `GameState` persistés), pas la logique du moteur. Décision : exposer
    `GAME_CONFIG.schemaVersion` comme `engine_version` dans le module analytics (une seule
    ligne de mapping, documentée), plutôt que créer une deuxième constante manuelle qui
    dériverait dans le temps.
  - `analytics_schema_version` : nouvelle constante, propre au module analytics (`v1`).
  - `build_sha` : aucun mécanisme existant. Lu depuis `process.env.NEXT_PUBLIC_BUILD_SHA`
    (à renseigner par la plateforme de déploiement) avec repli sur `"dev"` en local — pas de
    `git rev-parse` au runtime (romprait un build sans `.git`).
- **Confidentialité / consentement** : `src/app/confidentialite/page.tsx` affirme aujourd'hui
  explicitement _« sans outil d'analytics »_ — cette page devra être réécrite pour rester
  honnête une fois la couche opt-in en place (section Privacy strategy ci-dessous).
  `src/features/meta/settings-page.tsx` + `LocalSettings`
  (`src/lib/storage/game-database.ts`) offrent déjà le patron d'UI (Card/Button/Dialog,
  `saveLocalSettings`) pour ajouter un contrôle de consentement sans nouveau composant
  générique.
- **Tests** : Vitest (`vitest.config.ts`, jsdom, `src/tests/setup.ts`) avec `fake-indexeddb` et
  `fast-check` déjà en devDependencies (utilisables tels quels pour tester la file offline et
  l'idempotence). Playwright (`playwright.config.ts`, dossier `e2e/`, `baseURL
127.0.0.1:3100`, `webServer` démarre `npm run dev`).
- **PWA / offline** : `public/sw.js` + `public/manifest.webmanifest`, enregistrés par
  `src/components/pwa-registrar.tsx`. Cache technique de ressources statiques uniquement,
  aucune interaction avec les données de jeu — pas de changement nécessaire pour l'analytics
  (la file offline analytics est un mécanisme distinct, en IndexedDB, pas dans le cache SW).
- **Graphiques** : aucune bibliothèque de charts en dépendance. Le seul pattern existant est du
  SVG à la main (`src/features/results/final-screen.tsx`). Décision : pas de nouvelle
  dépendance de charting — le dashboard réutilisera des primitives SVG/CSS à la main,
  cohérentes avec l'existant et suffisantes pour les visualisations demandées (barres, lignes,
  répartitions).
- **Auth** : aucun système d'authentification existant (jeu 100 % local, sans compte). Un
  système de session admin dédié sera créé (cookie signé), pas de réutilisation possible.
- **Infra distante** : aucune trace de Supabase/PostgreSQL dans le dépôt (`grep` négatif).
  Tout sera créé from scratch ; `@supabase/supabase-js` sera la seule nouvelle dépendance
  runtime ajoutée (client d'écriture serveur uniquement, jamais exposé au navigateur).

## 2. Points d'intégration retenus

| Besoin                       | Fichier                                                                                                       | Nature du changement                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Émission d'événements de jeu | `src/features/campaign/game-app.tsx`                                                                          | Ajout de `useEffect` supplémentaires (mêmes garanties non bloquantes que l'autosave existant), observant les transitions de `gameState` déjà exposées par le store. Aucun changement au store ni au moteur. |
| Client analytics             | nouveau `src/analytics/**`                                                                                    | Module isolé, aucune dépendance vers `src/game/engine/**`.                                                                                                                                                  |
| Ingestion                    | nouveau `src/app/api/analytics/events/route.ts`                                                               | Route Next.js isolée.                                                                                                                                                                                       |
| Consentement                 | `src/lib/storage/game-database.ts` (extension de `LocalSettings`), `src/features/meta/settings-page.tsx` (UI) | Ajout additif d'un champ optionnel, migration IndexedDB non destructive.                                                                                                                                    |
| Page confidentialité         | `src/app/confidentialite/page.tsx`                                                                            | Réécriture de la section analytics pour rester honnête.                                                                                                                                                     |
| Dashboard admin              | nouveau `src/app/admin/**`                                                                                    | Espace isolé, exclu de la nav publique.                                                                                                                                                                     |

Aucun fichier sous `src/game/engine/**`, `src/game/data/**`, `src/game/schemas/**` ne sera
modifié. Le test de non-régression déterministe (section 4) fait de cette garantie une
assertion vérifiée, pas seulement une intention.

## 3. Architecture analytics proposée

```
Jeu (composants React)
  → src/analytics/client.ts (API track() synchrone, jamais throw)
    → src/analytics/queue.ts (file persistante IndexedDB, "idb")
      → flush par lot (démarrage / online / interval / pagehide-beacon)
        → POST /api/analytics/events (batch 1..50, Zod)
          → validation stricte, échec item par item, jamais 500 sur payload partiellement
            invalide
            → Supabase (service role, serveur uniquement) → analytics_events (log brut,
              append-only)
              → upsert dérivé → analytics_runs, analytics_decisions
                → vues SQL (agrégations) → /admin/analytics (lecture seule, paginée)
```

Rien dans cette chaîne n'est sur le chemin critique du jeu : `track()` écrit dans la file
locale et retourne immédiatement ; un échec réseau, un Supabase absent, ou un 500 serveur ne
produisent qu'un log console en dev, jamais une exception visible du joueur.

## 4. Isolation moteur — garanties et vérification

- Aucun `await`/`fetch`/`import` réseau dans `src/game/engine/**`.
- Aucune fonction pure existante ne devient async.
- `track()` ne consomme jamais le RNG du jeu (`RngState`) ; les `event_uuid` analytics sont
  générés via `crypto.randomUUID()` côté client, un générateur totalement indépendant.
- Test dédié (`src/analytics/__tests__/determinism.test.ts`) : rejoue la même séquence
  seed + choix avec `track()` actif puis avec `track()` remplacé par un no-op, et assert
  `JSON.stringify` identique du `GameState` final (hors champs volontairement exclus comme les
  timestamps `Date.now()` déjà présents avant cette mission, s'il y en a).

## 5. Identifiants

| Identifiant         | Origine                                                                                                                        | Portée                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| `anonymous_user_id` | généré côté client (`crypto.randomUUID()`), persisté en IndexedDB (`meta` store, nouvelle clé), jamais dérivé d'un fingerprint | par navigateur/appareil       |
| `session_id`        | généré à l'ouverture de l'app, persisté en `sessionStorage`                                                                    | par onglet/session navigateur |
| `run_id`            | **réutilise `GameState.runId`** (déjà stable, déjà persisté avec la sauvegarde)                                                | par campagne                  |
| `event_uuid`        | `crypto.randomUUID()` par événement                                                                                            | idempotence d'ingestion       |
| `client_sequence`   | compteur local croissant par run                                                                                               | ordonnancement                |

## 6. Statut de run — pas d'événement "abandon"

`analytics_runs.status ∈ {ongoing, completed, stale_incomplete}`, dérivé côté lecture (vue SQL)
de `last_event_at` vs `ANALYTICS_STALE_RUN_HOURS` (variable d'env, défaut documenté dans
`.env.example`). Une reprise (le joueur recharge une sauvegarde) fait réapparaître le run comme
`ongoing` au prochain événement — aucun événement `game_abandoned` n'existe dans le catalogue.

## 7. Tables planifiées (migrations SQL versionnées, `supabase/migrations/`)

- `analytics_events` — log brut append-only, toutes les colonnes d'enveloppe communes
  - `payload jsonb`.
- `analytics_runs` — 1 ligne par `run_id`, upsert idempotent, colonnes dérivées des champs
  réels de `GameState`/`FinalResult` seulement (pas de `GameState` brut stocké).
- `analytics_decisions` — 1 ligne par décision résolue, dédupliquée sur
  `(run_id, decision_index)`, champs alignés sur `DecisionRecord` existant.
- `experiment_id`, `variant_id` nullable sur `analytics_events`/`analytics_runs` — groundwork
  A/B uniquement, aucune expérience active.
- Index : `analytics_events(run_id)`, `(event_type, created_at)`, `analytics_runs(status)`,
  `(app_version, engine_version, content_version)`, `analytics_decisions(run_id,
decision_index)` unique.

## 8. Offline / consentement / vie privée

- File IndexedDB (`idb`, déjà en dépendance) — retries au démarrage, sur `online`, sur
  intervalle, et un dernier essai `navigator.sendBeacon` sur `pagehide`.
- Consentement : `off` par défaut en dev, `opt-in` par défaut en prod ; rien n'est mis en file
  avant consentement explicite ; refus → file vidée ; retrait → envois stoppés immédiatement.
  Accès au jeu jamais conditionné au consentement.
- Aucune PII : pas de nom, email, IP stockée, user-agent complet ou fingerprint. Uniquement
  l'UUID anonyme local.
- `docs/analytics/PRIVACY.md` ne revendiquera jamais de conformité RGPD.

## 9. Risques de régression identifiés et mitigations

| Risque                                     | Mitigation                                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ralentir le rendu de `CampaignEventScreen` | `track()` synchrone non bloquant, écriture IndexedDB en tâche de fond, aucun `await` sur le chemin de rendu.                                                         |
| Casser le jeu si Supabase absent           | Toute la chaîne serveur est déjà conçue fail-open ; `npm run build`/`dev`/`test` doivent réussir avec zéro variable Supabase (vérifié en section validation finale). |
| Dupliquer des runs sur reload              | `run_id` réutilisé tel quel depuis `GameState`, upsert idempotent côté serveur.                                                                                      |
| Fuite de PII                               | Schémas Zod stricts côté API, revue explicite dans `DATA_DICTIONARY.md`.                                                                                             |
| Dérive de version non tracée               | Toutes les versions lues depuis une source unique existante (section 1), jamais dupliquées en dur.                                                                   |

## 10. Fichiers probablement modifiés ou créés

Créés : `docs/analytics/**`, `supabase/migrations/**`, `src/analytics/**`,
`src/app/api/analytics/events/route.ts`, `src/app/admin/**`, `middleware.ts` (protection
`/admin/analytics`), `scripts/analytics-seed.ts`, tests associés, `e2e/analytics-*.spec.ts`.

Modifiés (additif uniquement) : `src/features/campaign/game-app.tsx`,
`src/lib/storage/game-database.ts` (extension `LocalSettings`),
`src/features/meta/settings-page.tsx`, `src/app/confidentialite/page.tsx`, `.env.example`,
`package.json` (nouveau script `analytics:seed`, nouvelle dépendance
`@supabase/supabase-js`).

Aucune incompatibilité structurelle majeure n'a été trouvée — la mission continue
automatiquement vers l'implémentation, sans point d'arrêt utilisateur à ce stade.
