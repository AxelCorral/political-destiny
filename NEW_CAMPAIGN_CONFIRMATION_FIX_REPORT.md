# NEW_CAMPAIGN_CONFIRMATION_FIX_REPORT.md

Correctif UX/logique du CTA « Lancer une campagne » lorsqu'une campagne est déjà sauvegardée.

État de départ : `main`, HEAD `c7c096f` (« fix(game): allow starting a new campaign with an active
save »). Aucun fichier du moteur (`src/game/**`) n'a été modifié.

---

## A. Bug reproduit

**Non — le bug décrit dans le prompt n'existe plus au HEAD.**

Le prompt décrit ce comportement :

```text
clic « Lancer une campagne » → redirection automatique vers la campagne en cours
```

Il a été corrigé par le commit précédent `c7c096f`, qui a remplacé le `<Link href="/jouer">` du hero
par `NewCampaignButton`. Vérifié de deux façons avant toute modification :

1. **Lecture du code** — `src/app/page.tsx` L43 utilisait déjà `NewCampaignButton`, dont le handler
   `request()` intercepte le clic, détecte la sauvegarde et ouvre une confirmation au lieu de
   naviguer.
2. **Exécution de la suite E2E existante**, sur HEAD non modifié :

   ```text
   npx playwright test e2e/new-campaign-flow.spec.ts --project=chromium
   ok 1 · 14 · annuler la confirmation laisse la campagne sauvegardée strictement intacte (36.0s)
   ok 2 · 13 · « Nouvelle partie » et « Lancer une campagne » ne reprennent jamais la sauvegarde active (39.0s)
   2 passed
   ```

**Ce qui manquait réellement**, et qui fait l'objet de cette mission :

| Attendu (§1, §2, §8) | État au HEAD `c7c096f` |
|---|---|
| Trois issues : Annuler / Reprendre / Nouvelle campagne | Deux seulement : Annuler / Nouvelle campagne |
| Le dialogue nomme la campagne concernée | Aucune information sur la sauvegarde |
| Cadrage « une campagne est déjà en cours » | Cadrage purement destructif (« Démarrer une nouvelle campagne ? ») |

Conséquence concrète : un joueur qui cliquait « Lancer une campagne » sans savoir qu'une campagne
l'attendait n'avait aucun moyen de la reprendre depuis ce dialogue. Il devait annuler, puis repérer
le bouton « Reprendre » de la carte plus bas dans la page.

## B. Cause racine

Pas un bug de routing, de guard ni d'hydratation — une **lacune fonctionnelle du dialogue**.

`src/features/campaign/new-campaign-button.tsx` (HEAD `c7c096f`) :

- L56 — `hasActiveGame()` renvoyait un booléen. Le composant savait qu'une campagne existait, sans
  jamais lire laquelle : impossible de l'afficher (§8).
- L120-127 — la rangée d'actions ne contenait que `Annuler` et `Démarrer une nouvelle campagne`.
  Aucun chemin de reprise n'était offert depuis ce dialogue.
- L108-109 — le titre et la description posaient une question fermée (« Démarrer une nouvelle
  campagne ? »), ce qui interdisait d'y greffer une troisième issue sans incohérence de ton.

Le mécanisme de reprise, lui, existait déjà et fonctionnait : `router.push("/jouer")` sans toucher au
store ni à la base, `GameApp` restaurant la sauvegarde au montage. Il n'était simplement pas câblé au
dialogue.

## C. Avant

```text
Lancer une campagne :
  aucune save  → /jouer, flux de création
  save active  → dialogue « Démarrer une nouvelle campagne ? » [Annuler | Démarrer (destructif)]
                 aucune information sur la campagne concernée, aucune reprise possible

Reprendre :
  bouton de ActiveCampaignCard → /jouer, restauration de la sauvegarde. Correct.

Nouvelle partie :
  bouton de ActiveCampaignCard → même dialogue destructif à deux issues. Correct.
```

## D. Après

```text
Lancer une campagne :          (accueil + panthéon vide, offerResume)
  aucune save  → /jouer, flux de création          inchangé
  save active  → dialogue « Une campagne est déjà en cours »
                 identité de la campagne affichée
                 [Annuler | Reprendre la campagne | Démarrer une nouvelle campagne (destructif)]

Reprendre :
  inchangé → /jouer, restauration de la sauvegarde

Nouvelle partie :              (carte de sauvegarde, sans offerResume)
  save active  → dialogue « Démarrer une nouvelle campagne ? »
                 [Annuler | Démarrer une nouvelle campagne (destructif)]
                 + identité de la campagne, désormais affichée elle aussi
```

**Pourquoi deux dialogues et non un seul** (§9) : « Nouvelle partie » est rendu directement sous
« Reprendre » dans la carte de sauvegarde. Le joueur qui le clique a déjà vu et écarté la reprise ;
la lui reproposer n'ajouterait que du bruit. « Lancer une campagne » est le seul CTA dont l'intention
est ambiguë quand une sauvegarde existe. La distinction est portée par une prop explicite,
`offerResume`, et non par le libellé du bouton.

## E. Modal

```text
Titre :    Une campagne est déjà en cours

Message :  Vous pouvez la reprendre où vous l’aviez laissée, ou en démarrer une nouvelle.
           Démarrer une nouvelle campagne remplace celle-ci et sa progression est
           définitivement perdue.

Encart :   {nom du candidat} · {nom du parti}
           {n} décision(s) prise(s)
           — ou, si la partie est terminée : {titre du bilan} · {score}/100

Actions :  Annuler                          (secondaire)
           Reprendre la campagne            (primaire)
           Démarrer une nouvelle campagne   (danger)
```

Les données de l'encart sortent du `GameState` déjà chargé, sur le même modèle que
`ActiveCampaignCard` — aucune requête supplémentaire, aucun champ calculé pour l'occasion (§8).

## F. Sauvegarde

```text
modèle de stockage      : IndexedDB « vers-lelysee », object store « active »
single-slot / multi-slot : single-slot — une seule clé, ACTIVE_GAME_KEY = "current"
                           (src/lib/storage/game-database.ts L10, L228-269)
ancienne campagne        : remplacée lorsque le joueur choisit « Démarrer une nouvelle campagne »
confirmation destructive : oui — une seule, portée par le dialogue lui-même
```

**Pourquoi pas de seconde confirmation** (§2, §7) : le dialogue nomme la campagne concernée, annonce
le remplacement et la perte de progression dans sa description, et isole l'action destructive dans un
bouton `variant="danger"`. Empiler un second modal sur un dialogue qui est déjà une confirmation
explicite dégraderait l'UX sans rien ajouter à l'information. La règle du prompt (« uniquement si
nécessaire ») est donc lue comme : non nécessaire ici. Décision réversible en une prop si vous
préférez le double verrou.

**Données préservées** (§7) : `startNewCampaign()` n'appelle que `clearActiveGame()`, qui supprime la
seule clé `active/current`. Les object stores `archives`, `meta` (profil, badges) et `settings`
(réglages, consentement analytics) ne sont pas touchés. Aucun `localStorage.clear()` ni reset global
n'a été introduit — vérifié par le test unitaire « libère la sauvegarde active et le store, sans
toucher aux autres données locales », qui assert `analyticsConsent`, `reducedMotion`, le profil et la
liste des runs terminés après l'opération.

## G. Routing / hydration

Inchangé, et volontairement.

- **Reprendre** : `router.push("/jouer")`, aucune écriture. `GameApp` (L64-67) appelle
  `loadActiveGame()` puis `restoreGame()` au montage. Seed, `runId`, `decisionIndex` et historique
  viennent du disque.
- **Nouvelle campagne** : `startNewCampaign()` libère la base **et** le store zustand (singleton de
  module qui survit à la navigation client) avant la navigation, dans le même contexte JavaScript.
  Aucun paramètre d'URL, aucun `setTimeout`, aucune course avec l'hydratation.
- **Reload** : couvert par les tests 13 et 15, qui rechargent la page après démarrage d'une nouvelle
  campagne et vérifient que le flux initial est toujours affiché et que `active/current` reste vide.
- **Pas de redirect loop** : le CTA `asLink` garde son `href="/jouer"` natif pour le clic milieu et
  Ctrl+clic (nouvel onglet, store vierge, reprise de la sauvegarde — sémantique historique d'un accès
  direct), et n'intercepte que le clic gauche simple.

## H. Analytics

**Aucune modification du catalogue ni de l'instrumentation.** Vérifié que la garantie demandée est
structurelle : `run_started` / `run_resumed` sont émis par `src/features/campaign/game-app.tsx`
L166-186, un effet qui observe les transitions de `gameState`. `GameApp` n'est monté que sur `/jouer`,
donc rien ne peut être émis depuis l'accueil.

```text
Ouverture du modal : aucun événement — GameApp n'est pas monté
Annuler            : aucun événement, aucun reset
Reprendre          : run_resumed sur le runId existant
                     (branche decisionIndex > 0 || decisionHistory non vide)
Nouvelle campagne  : run_started sur un runId neuf, après la création réelle
                     (branche decisionIndex === 0 && decisionHistory vide)
```

Le test unitaire « crée une identité de run neuve, jamais celle de la campagne précédente » verrouille
les trois valeurs exactes dont dépend ce branchement.

## I. Tests

**Unitaires / intégration** — `src/features/campaign/__tests__/newCampaignFlow.test.tsx`, 5 cas
ajoutés aux 6 existants (11/11 verts) :

| Cas | Couverture |
|---|---|
| Trois issues et identité de la campagne | §1, §2, §8 — les trois boutons, nom du candidat, parti, nombre de décisions, aucune navigation |
| « Reprendre la campagne » | §2 — navigation vers /jouer, `runId`/`seed`/`decisionIndex` intacts en base et dans le store |
| « Démarrer une nouvelle campagne » | §2, §7 — mention du remplacement présente, save effacée, store remis à zéro |
| « Annuler » | §2 — dialogue fermé, save intacte, aucune navigation |
| Variante sans `offerResume` | §9 — la confirmation destructive à deux issues reste sans bouton de reprise |

**E2E** — `e2e/new-campaign-flow.spec.ts`, test 15 ajouté, scénario complet du §15 : création d'une
campagne sauvegardée, retour à l'accueil, ouverture du dialogue, vérification des informations
affichées et des trois actions, Annuler (URL, save, focus), Reprendre (progression réelle relue dans
l'onglet Décisions), Démarrer une nouvelle campagne, puis reload. Le test 13 a été mis à jour pour le
nouveau titre du dialogue du hero.

**Suites complètes** :

```text
npx tsc --noEmit                                    0 erreur
npx eslint .                                        0 erreur, 3 warnings préexistants (scripts/audit/**)
npm run test                          66 fichiers, 362/362 verts
npm run build                                       succès, 11 routes
npx playwright test --project=chromium   34 passed, 2 skipped, 1 failed (préexistant, voir K)
```

## J. UX / accessibilité

Primitive existante `src/components/ui/dialog.tsx` (Radix `@radix-ui/react-dialog`) réutilisée telle
quelle. Aucun style global, aucun token, aucune variante de bouton créés — `secondary`, primaire par
défaut et `danger` existaient déjà.

- Focus trap, Escape et navigation clavier : fournis par Radix.
- Retour du focus au déclencheur à la fermeture : conservé (mécanisme explicite de `c7c096f`,
  nécessaire parce que Radix suppose un déclencheur focalisé à l'ouverture, faux au clic tactile).
  Vérifié par les tests E2E 14 et 15 (`toBeFocused`).
- Titre et description accessibles : `DialogPrimitive.Title` / `.Description`.
- Hiérarchie des actions : reprise en primaire, destruction en `danger`, annulation en secondaire.
- **QA visuelle desktop (1366×768) et mobile (390×844)** : dialogue centré, aucun débordement
  horizontal (`scrollWidth - clientWidth ≤ 0` vérifié), boîte contenue dans le viewport, aucun texte
  coupé. Les captures ont été relues puis les fichiers temporaires supprimés.
- Largeur : la variante à trois actions passe de `max-w-lg` à la largeur par défaut du dialogue. À
  `max-w-lg` puis `max-w-xl`, « Reprendre la campagne » et « Démarrer une nouvelle campagne »
  passaient à la ligne et la rangée devenait illisible sur desktop.
- Noms longs : `break-words` sur la ligne d'identité. Les champs de saisie sont bornés
  (`maxLength` 50 à 80 dans `src/features/onboarding/setup-screens.tsx`), mais un nom de parti d'un
  seul tenant aurait débordé sur mobile.

## K. Limites restantes

**P2 — `government-card-1920.png` échoue en régression visuelle. Préexistant, hors périmètre.**
882 pixels diffèrent (ratio 0,01), uniquement sur la mention de consentement analytics du pied de
page. Introduit par `b0317ab` (« fix(analytics): reword the consent buttons for the opt-out default »)
sans régénération de cette capture. **Vérifié préexistant** : le test échoue à l'identique sur HEAD
propre, mes modifications remisées. Non corrigé ici, §18 excluant explicitement le sujet analytics.
Correction : `npx playwright test e2e/visual-regression.spec.ts --update-snapshots -g "government"`,
à faire dans une mission dédiée.

**P3 — le dialogue ne distingue pas une campagne terminée d'une campagne en cours dans son titre.**
Si la partie sauvegardée est au stade « bilan », l'encart affiche bien le titre du bilan et le score,
mais le titre reste « Une campagne est déjà en cours » et le bouton « Reprendre la campagne ». La
carte de sauvegarde, elle, bascule sur « Bilan disponible » et « Voir le bilan ». Cosmétique, aucun
risque de perte de données.

**P3 — Ctrl+clic / clic milieu sur « Lancer une campagne » ouvre `/jouer` dans un nouvel onglet et y
reprend la sauvegarde**, sans passer par le dialogue. Comportement natif du lien, documenté et
volontaire depuis `c7c096f` ; le signaler ici pour mémoire, pas pour le changer.

Aucun P0, aucun P1.

## L. Git

```text
commit : 1 commit local sur main
push   : NON
```

Périmètre du diff : 5 fichiers, tous dans le périmètre de la mission.

```text
e2e/new-campaign-flow.spec.ts
src/app/page.tsx
src/features/campaign/__tests__/newCampaignFlow.test.tsx
src/features/campaign/new-campaign-button.tsx
src/features/meta/archive-pages.tsx
```

Aucun fichier `src/game/**` touché. `next.config.ts`, `release/PUBLICATION_GATE.md`, `linkedin/` et
les prompts de mission restent hors commit, comme dans les missions précédentes.

Le message recommandé par le prompt (`fix(game): confirm before starting a new campaign`) n'a pas été
retenu : la confirmation existait déjà avant cette mission, un tel message décrirait le commit
précédent et non celui-ci.
