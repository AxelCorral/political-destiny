# Simulation ancrée dans la réalité — guide de maintenance

Documente l'architecture introduite par
`PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md` : pourquoi une baseline réelle,
comment `CandidateProfile` fonctionne, comment ajouter un candidat/retrait/endorsement, comment
recalibrer, et les règles de sécurité éditoriale associées. Complète (ne remplace pas)
`docs/ELECTORAL_CALIBRATION.md` (constantes du moteur de second tour) et `docs/EDITORIAL_POLICY.md`
(règles éditoriales générales).

## 1. Pourquoi une baseline réelle

Avant cette mission, les neuf partis démarraient dans une bande de sondage arbitraire, sans lien avec
la situation politique française réelle au 18 avril 2026 (date de départ du jeu). Le jeu doit
ressembler au paysage réel *à cette date précise* — pas à une prédiction, pas à un instantané figé
plus tard dans l'année. Voir `docs/POLITICAL_BASELINE_2026-04.md` pour la recherche datée qui fonde
les valeurs actuelles de `src/game/data/parties.ts` (`baseSupport`, `politicalBaselineVersion`,
`politicalBaselineDate`).

## 2. Pourquoi une faible randomisation initiale

Le hasard doit transformer l'Histoire simulée, pas remplacer le contexte de départ. Le jitter
appliqué dans `src/game/engine/game.ts` (`createGame`, bloc « petite incertitude au départ ») est
volontairement petit (±6 % relatif, déterministe par graine) — voir
`REALITY_GROUNDING_BASELINE.md` §5 pour le diagnostic qui a fixé cette magnitude. Les grandes
divergences par rapport à la réalité doivent venir d'événements de campagne compréhensibles
(retrait, alliance, endorsement, crise), pas d'un tirage aléatoire à J-365.

## 3. Comment `CandidateProfile` fonctionne

- Type : `src/game/types/index.ts` (`CandidateProfile`).
- Données : `src/game/data/candidateProfiles.ts`. Seuls les partis avec une incertitude de
  candidature **réellement documentée** (`docs/POLITICAL_BASELINE_2026-04.md`) portent plusieurs
  profils — actuellement RN (2) et PS (2). Les sept autres partis n'ont aucune entrée : le
  comportement reste celui d'avant cette mission (un seul acteur candidat).
- Résolution : `src/game/engine/candidateProfiles.ts` (`resolveCandidateProfile`). Déterministe par
  graine + parti, pondérée par `probabilityWeight`. Le choix explicite du joueur
  (`NewGameOptions.candidateProfileId`) ne s'applique qu'à son propre parti.
- Application : `src/game/engine/game.ts` (`createGame`), bloc « résolution des CandidateProfile » —
  applique `baselineModifier` aux stats du parti, échange `party.candidateId`, trace la désignation
  dans `state.opponentActions` (kind `"primary"`) si le profil n'est pas celui par défaut.
- UI : `src/features/onboarding/setup-screens.tsx` (`PartyDetailScreen`) affiche un sélecteur de
  profil quand `gameContent.candidateProfiles` contient plusieurs entrées pour le parti choisi.

### Ajouter un candidat / un profil

1. Vérifier dans `docs/POLITICAL_BASELINE_2026-04.md` (ou une recherche datée équivalente) que
   l'incertitude est réelle, pas fabriquée pour ajouter du contenu (§8 du prompt de mission).
2. Créer ou réutiliser un `ActorState` dans `src/game/data/actors.ts` — réutiliser un cadre existant
   quand son profil politique correspond déjà (RN : Louis Ferran) ; créer un nouvel acteur seulement
   si aucun ne correspond structurellement (PS : Nadia Ferreira).
3. Ajouter les deux (ou plus) `CandidateProfile` dans `candidateProfiles.ts`, avec `probabilityWeight`
   reflétant la vraisemblance réelle documentée, pas un tirage 50/50 arbitraire.
4. `npm run data:validate` vérifie automatiquement : profil référencé pointe vers un parti/acteur
   existant, exactement un profil par défaut par parti, jamais un seul profil isolé.

## 4. Comment ajouter un retrait / une alliance (structurel)

Le moteur de redistribution est `src/game/engine/redistribution.ts` :

- `redistributeElectorate(state, blocs, withdrawingPartyId)` — redistribue, bloc par bloc, le soutien
  latent du parti retiré vers les autres partis actifs, pondéré par proximité idéologique, relation,
  alliance déjà active, endorsement explicite déjà posé, et rejet du destinataire — avec une part
  réservée à l'indécision/abstention. Fonction pure (retourne un état cloné).
- `redistributeAllianceBoost(state, blocs, partyId, partnerId)` — transfert modeste et immédiat entre
  deux partis alliés, dirigé vers celui qui est structurellement le mieux placé dans chaque bloc.

Ces fonctions sont réutilisées (jamais réimplémentées) par :

- `src/game/engine/opponentSimulation.ts` (`maybeWithdrawAndRally`, `replaceCandidate`,
  `formAlliance`) — retraits et alliances des PNJ pendant la campagne.
- Tout script d'audit qui a besoin d'un contrefactuel retrait/maintien (voir
  `scripts/audit/reality-grounded-counterfactuals.ts`).

Pour ajouter un nouveau déclencheur de retrait structurel (par exemple un événement de contenu
explicite plutôt que la logique probabiliste de `maybeWithdrawAndRally`) : appeler
`redistributeElectorate` avec le moteur réel, ne jamais coder une redistribution fixe (§12 du prompt
de mission : « ne pas imposer une redistribution fixe 50/50 »).

## 5. Comment ajouter un endorsement majeur

1. Si la figure est étrangère : ajouter un `WorldFigureProfile` dans
   `src/game/data/worldFigures.ts` avec des `affinityTags`/`hostilityTags` structurés — jamais coder
   la compatibilité idéologique dans le texte libre d'un événement (§0.5 du prompt de mission).
2. Ajouter un `MajorEndorsementDefinition` dans `src/game/data/majorEndorsements.ts` :
   `eligiblePartyIds` doit être idéologiquement cohérent avec les axes du figure (vérifié
   structurellement par `politicalConsistency.test.ts`), `negativeEffects` doit toujours être non vide
   (§18 : un soutien n'est jamais un bonus universel).
3. Créer l'événement correspondant dans `src/game/data/events/v2/endorsements.ts`, avec
   `eligibleParties` identique à `eligiblePartyIds`. Priorité à la qualité, pas au volume (§31) — ne
   pas remplir artificiellement le catalogue.

## 6. Comment recalibrer

1. Rechercher des sources datées (Ipsos, Ifop, Elabe, OpinionWay, Cluster17, CEVIPOF, résultats
   officiels) — jamais un sondage unique, jamais Wikipédia comme source numérique principale.
2. Mettre à jour `docs/POLITICAL_BASELINE_2026-04.md` (ou créer un nouveau document versionné si la
   date de référence change) avec les fourchettes et leurs sources.
3. Ajuster `baseSupport` dans `src/game/data/parties.ts`, avec un commentaire citant la fourchette
   source et `politicalBaselineVersion`/`politicalBaselineDate` à jour.
4. Rejouer les corpus massifs (`scripts/audit/reality-grounded-massive-corpus.ts`) et les tests de
   non-régression avant/après.

## 7. Comment conserver la pseudo-réalité

- Un nom inventé n'est pas un personnage aléatoire : vérifier la cohérence avec
  `docs/FICTIONAL_POLITICAL_ARCHETYPES.md` avant de créer ou modifier un personnage lié à un parti.
- Ne jamais faire de « reskin » 1:1 (nom réel → nom inventé sans rien changer d'autre) : le monde doit
  être inspiré, pas photocopié (§24 du prompt de mission).
- Nouvelle Énergie conserve un ancrage exécutif-local/entrepreneurial et une identité économique
  libérale distincte de LR et du bloc central — verrouillé par
  `politicalConsistency.test.ts` (« Nouvelle Énergie conserve une identité économique libérale »).

## 8. Règles de sécurité éditoriale

Voir `docs/EDITORIAL_POLICY.md` pour les règles complètes. Rappel spécifique à cette mission :

- Aucun contenu sensible (crime, corruption, violence, affaire sexuelle, addiction, diagnostic
  médical, secret familial, enrichissement illégal, propos discriminatoire inventé) ne doit jamais
  être attribué à un personnage correspondant à un archétype réel (candidat, cadre documenté, figure
  étrangère). Ces intrigues utilisent exclusivement les personnages secondaires du groupe
  `sensitiveFictionalActors` (`src/game/data/actors.ts`), pour lesquels aucune correspondance réelle
  n'est recherchée — c'est la seule catégorie de personnages où cette absence de correspondance est
  voulue.
- Aucune mention répétée de « fictif »/« fictive » dans le flux normal de jeu (titres, résumés,
  libellés de choix, narratifs de résultat) — bloqué par `validateContentQuality`
  (`src/game/data/qualityValidation.ts`). Le disclaimer global reste dans
  `src/features/onboarding/fiction-notice.tsx` (affiché une seule fois) et dans les pages dédiées
  (`/a-propos`, `/methodologie`, `/parametres`).
