# Vers l'Élysée — correctif « Nouvelle partie » accessible avec une sauvegarde active

Date : 17 août 2026 · Branche : `main` · Base : `b0317ab` · **Aucun push effectué.**

---

## A. Bug reproduit

Reproduit avant toute modification, avec un test Playwright temporaire sur Chromium
(campagne PS, graine `e2e-repro-new-campaign`, une décision jouée, retour à l'accueil
par le bouton « Sauvegarder et quitter » — donc par navigation applicative).

Trace réelle du run de reproduction :

```text
STEP 1 — accueil avec carte « Campagne sauvegardée » : OK
STEP 3 — Reprendre → URL /jouer → écran campagne
[NATIVE CONFIRM] Abandonner la sauvegarde active et commencer une nouvelle campagne ?
STEP 6 — Nouvelle partie → URL /jouer · flux initial=false · campagne existante=true
STEP 6bis — sauvegarde active après « Nouvelle partie » : {"runId":"run-1h1wp27","decisionIndex":1}
STEP 9 — Lancer une campagne → flux initial=false · campagne existante=true
```

Deux faits, et non un seul :

1. « Nouvelle partie » et « Lancer une campagne » retombent tous les deux sur la
   campagne existante (`flux initial=false`) ;
2. pire, la sauvegarde effacée à l'étape 6 est **réécrite en base** une seconde plus
   tard (STEP 6bis) : le joueur avait confirmé l'abandon, la campagne revenait quand même.

---

## B. Cause racine

```text
CAUSE RACINE
CTA Lancer une campagne : src/app/page.tsx — <Link href="/jouer"> sans intention ;
                          /jouer restaure systématiquement la sauvegarde trouvée.
CTA Nouvelle partie     : src/features/campaign/active-campaign-card.tsx — clearActiveGame()
                          puis router.push("/jouer"), sans jamais réinitialiser le store.
Redirection / guard     : aucun guard de route. La « reprise » est un effet de montage
                          de src/features/campaign/game-app.tsx (loadActiveGame → restoreGame).
State/persistence       : src/features/campaign/gameStore.ts est un singleton de module
                          (zustand sans persist) : il survit à toute navigation client.
                          src/lib/storage/game-database.ts : store IndexedDB `active`,
                          clé unique `current`.
```

Une partie active vit à **deux** endroits, et une seule était libérée :

- **IndexedDB** (`active/current`) — bien supprimée par `clearActiveGame()` ;
- **le store zustand** — jamais réinitialisé.

Comme le store est un singleton de module, il conserve `gameState` et `screen: "campaign"`
pendant toute la session SPA. En arrivant sur `/jouer`, `GameApp` rendait donc immédiatement
l'ancienne campagne depuis la mémoire, puis son effet d'autosauvegarde
(`game-app.tsx:109-126`) réécrivait ce `gameState` dans IndexedDB — la sauvegarde
« abandonnée » ressuscitait toute seule.

Le CTA du hero, lui, n'exprimait aucune intention : `/jouer` restaure toute sauvegarde
qu'il trouve, donc « Lancer une campagne » était par construction un alias de « Reprendre ».

> Note : le `window.confirm` de « Nouvelle partie » masquait partiellement le problème en
> environnement de test (Playwright rejette les dialogues natifs par défaut), ce qui explique
> qu'aucun test existant ne l'ait attrapé.

---

## C. Comportement avant

```text
Reprendre          : reprend la campagne active. ✔ (seul CTA correct)
Nouvelle partie    : confirm natif → efface la sauvegarde → /jouer réaffiche l'ancienne
                     campagne depuis le store → l'autosave la réécrit en base. ✘
Lancer une campagne: /jouer → restauration de la sauvegarde = « Reprendre ». ✘
```

## D. Comportement après

```text
Reprendre          : inchangé — charge exactement le run actif (runId, graine,
                     progression, décisions identiques ; vérifié en lisant IndexedDB).
Nouvelle partie    : dialogue de confirmation → startNewCampaign() → flux initial
                     (sélection du mode) avec un état de partie neuf.
Lancer une campagne: même intention et même dialogue que « Nouvelle partie ».
                     Ne reprend jamais silencieusement l'ancien run.
```

Sans sauvegarde active, les deux CTA partent directement en campagne, sans confirmation.

---

## E. Sauvegarde

- **Modèle réel : un seul slot actif.** Object store `active`, clé unique `current`
  (`src/lib/storage/game-database.ts`).
- **Archives = campagnes terminées uniquement.** `archiveCompletedGame()` n'est appelé
  que lorsque `finalResult` apparaît ; une campagne non terminée n'est jamais archivée.
  **Ce modèle n'a pas été modifié** (§13 de la mission), il est seulement documenté ici.
- Démarrer une nouvelle campagne remplace donc réellement l'ancienne → **cas B** :
  **confirmation explicite obligatoire**, jamais de destruction silencieuse.
- **Données préservées** (`startNewCampaign` ne touche que `active/current`) :
  archives, profil, badges, succès, historique, réglages d'accessibilité, son,
  consentement analytics, avertissement de fiction. Aucun `clear()` global,
  aucun `localStorage.clear()` — vérifié par test unitaire.
- Une campagne **terminée** reste consultable dans `/archives` après « Nouvelle partie » :
  seul le raccourci « Voir le bilan » de l'accueil disparaît.

---

## F. Routing / hydratation

Pas de contournement de guard, pas de paramètre d'URL, pas de timeout.

L'intention est posée **avant** le changement de route, dans le même contexte JavaScript,
par une fonction métier unique :

```ts
// src/features/campaign/new-campaign.ts
export async function startNewCampaign(): Promise<void> {
  try {
    await clearActiveGame(); // le run actif, et lui seul
  } finally {
    useGameStore.getState().resetGame(); // l'autre moitié de la partie active
  }
}
```

Conséquences :

- pas de course avec l'hydratation : quand `GameApp` monte, `loadActiveGame()` ne trouve
  plus rien **et** le store est déjà vide ;
- pas de flash de l'ancienne partie avant le nouveau parcours ;
- l'autosauvegarde ne peut plus réécrire l'ancien état (`gameState` est `undefined`) ;
- **rechargement (§12)** : après « Nouvelle partie » puis `reload`, le flux initial reste
  affiché et IndexedDB reste vide — vérifié dans l'E2E.

`/jouer` conserve sa sémantique historique : un accès direct (nouvel onglet, favori,
clic milieu — non intercepté volontairement) reprend la sauvegarde si elle existe.

---

## G. Analytics

Catalogue analytics **inchangé**, aucune collecte supplémentaire.

- `run_id` n'est pas mémorisé côté client : `track(eventType, runId, payload)` le reçoit
  à chaque appel depuis `GameState.runId` (`src/analytics/client.ts`).
- `game-app.tsx` émet `run_started` quand un `runId` inconnu apparaît avec
  `decisionIndex === 0` et un historique vide, `run_resumed` sinon. Une nouvelle campagne
  produit donc bien un **nouveau run**, au moment du `launchCampaign()` réel — pas avant.
  Couvert par le test unitaire « crée une identité de run neuve, jamais celle de la
  campagne précédente » (nouveau `runId`, `decisionIndex` 0, historique vide).
- **Annulation** : aucun état n'est modifié, donc **aucun événement** n'est émis.
- **Aucun doublon avant confirmation** : rien n'est créé tant que le joueur n'a pas confirmé
  puis traversé le flux de création.

---

## H. Tests

| Suite                   | Commande                                        | Résultat                                                   |
| ----------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Lint                    | `npm run lint`                                  | 0 erreur (3 warnings préexistants dans `scripts/audit/**`) |
| Typecheck               | `npx tsc --noEmit`                              | ✅                                                         |
| Données                 | `npm run data:validate`                         | ✅ 9 partis, 290 événements, 58 succès                     |
| Unitaires / intégration | `npm run test`                                  | ✅ **66 fichiers, 357 tests**                              |
| E2E ciblé               | `playwright test e2e/new-campaign-flow.spec.ts` | ✅ 4/4 (chromium + mobile)                                 |
| E2E suite complète      | `playwright test --project=chromium`            | 33 ✅ · 2 skipped · **1 échec préexistant** (voir I)       |
| Build                   | `npm run build`                                 | ✅ 20 routes générées                                      |

Tests ajoutés :

- `src/features/campaign/__tests__/newCampaignFlow.test.tsx` — 6 tests :
  libération du run actif sans toucher aux autres données, confirmation obligatoire,
  annulation sans effet de bord, confirmation destructive complète, identité de run neuve,
  absence de confirmation quand il n'y a rien à détruire.
- `e2e/new-campaign-flow.spec.ts` — 2 scénarios × 2 projets :
  - **13** : Reprendre (run identique, décision 1 conservée) → Nouvelle partie (confirmation,
    flux initial, IndexedDB vide) → reload (rien ne revient) → Lancer une campagne (même
    intention, pas de reprise) ;
  - **14** : annulation — aucune clé modifiée, aucune navigation, focus rendu au déclencheur,
    campagne toujours reprenable ensuite.
- `e2e/helpers/campaign.ts` — helpers `dismissFictionNotice` / `startExistingCampaign`
  extraits de `game.spec.ts` et partagés par les deux specs.

**Déterminisme du moteur** : `src/game/engine/**`, `createGame`, `freshSeed` et la création
de graine n'ont pas été touchés. Les suites de déterminisme du moteur restent vertes.

---

## I. Limites

- **P2 — capture visuelle obsolète, préexistante et hors périmètre.**
  `e2e/visual-regression.spec.ts` → `government-card-1920.png` échoue (882 px, 1 %). Le diff
  ne porte que sur le libellé du bandeau de consentement en pied de page, modifié par les
  commits `256a09d` / `b0317ab`. **Vérifié en stashant le correctif : l'échec est identique
  sur `main` sans aucune de ces modifications.** La capture de référence doit être régénérée
  (`playwright test e2e/visual-regression.spec.ts --update-snapshots`) — non fait ici pour ne
  pas mélanger un artefact binaire hors sujet à ce correctif.
- **P3 — mobile** : sur un viewport 412 px, le titre du dialogue « Démarrer une nouvelle
  campagne ? » renvoie le « ? » seul en troisième ligne. Rien n'est coupé ni chevauché ;
  c'est le comportement du composant `Dialog` partagé pour les titres longs, laissé tel quel
  pour ne pas modifier la DA.
- **P3 — `/archives` (état vide)** : le CTA « Lancer une campagne » du panthéon vide portait
  le même libellé que celui de l'accueil avec un comportement différent. Il utilise désormais
  le même composant intentionnel. Aucun autre écran n'a été modifié.
- **P3 — clic milieu / Ctrl+clic** sur le CTA du hero : volontairement non intercepté, la
  navigation native est conservée. Un onglet neuf part d'un store vide et `/jouer` y reprend
  la sauvegarde, ce qui reste la sémantique d'un accès direct à la route.
- **Hors périmètre, non traité** : calibration, sondages et dynamique électorale (audit séparé).

---

## J. Git

Fichiers du correctif :

```text
A  src/features/campaign/new-campaign.ts                       (API métier unique)
A  src/features/campaign/new-campaign-button.tsx               (CTA + dialogue de confirmation)
A  src/features/campaign/__tests__/newCampaignFlow.test.tsx    (6 tests)
A  e2e/new-campaign-flow.spec.ts                                (2 scénarios E2E)
A  e2e/helpers/campaign.ts                                      (helpers partagés)
M  src/app/page.tsx                                             (CTA hero intentionnel)
M  src/features/campaign/active-campaign-card.tsx               (window.confirm → dialogue)
M  src/features/meta/archive-pages.tsx                          (CTA du panthéon vide)
M  src/components/ui/button.tsx                                 (prop `ref`, React 19)
M  e2e/game.spec.ts                                             (helpers extraits)
```

Non committé : prompts de mission, carrousels LinkedIn, `next.config.ts` (réglage local
de tunnel préexistant), artefacts `test-results/`.

Commit : `fix(game): allow starting a new campaign with an active save` — Axel Corral.
**Push : NON.**
