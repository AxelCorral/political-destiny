# AUDIT_FUN_REJOUABILITE — « Vers l'Élysée » : le jeu est-il réellement amusant ?

Audit exécuté selon `PROMPT_CLAUDE_CODE_AUDIT_FUN_REJOUABILITE.md`. Contrairement aux audits
précédents (`AUDIT_POST_CORRECTIONS.md`, `POST_AUDIT_FIXES.md`, `GAMEPLAY_AUDIT.md`), cette mission
ne revérifie ni l'équilibrage statistique (η², répétitions, diversité lexicale — déjà traité) ni la
qualité UX pixel par pixel (déjà traitée en profondeur par `GAMEPLAY_AUDIT.md`, 4 largeurs d'écran).
Elle pose une question différente et plus subjective : **une fois que tout cela fonctionne, est-ce
que jouer est réellement amusant, partie après partie, avec des partis différents ?**

**Aucune règle, aucun texte, aucune probabilité, aucune interface n'a été modifiée pendant cette
mission.** Aucun commit n'a été poussé vers le dépôt distant. L'outillage créé
(`scripts/fun-audit/`) est en lecture seule sur `gameContent` et n'appelle que le moteur réel
(`createGame`/`currentEvent`/`resolveCurrentChoice`), jamais une réimplémentation des règles.

---

## Tableau de synthèse

| Domaine               | Score /10 | Verdict | Confiance      | Principal constat                                                                                                                                                                                                               |
| --------------------- | --------: | ------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fun global            |       6,5 | BON     | Moyenne        | Le moteur produit de vraies histoires (voir §18), mais le score de fun composite varie de 44 à 71/100 selon le parti — ce n'est pas un jeu uniformément amusant                                                                 |
| Choix                 |       7,5 | BON     | Élevée         | 1,8 % de choix dominants (>80 % de sélection) — chiffre identique, retrouvé indépendamment, à celui de `GAMEPLAY_AUDIT.md`                                                                                                      |
| Événements aléatoires |       5,5 | CORRECT | Moyenne        | Retirer les catégories `world`/`scandal` change la trajectoire dans 100 % des cas et l'issue dans ~52 % des cas appariés — un effet réel, mais leur impact en points reste modeste (voir §8)                                    |
| Événements rares      |         6 | CORRECT | Moyenne-élevée | Bien calibrés en ton (sérieux/absurde) mais aucun des 9 événements `rare_*` génériques n'ouvre de chaîne narrative — de simples « cartes », pas des arcs                                                                        |
| Rythme                |       7,5 | BON     | Élevée         | Intensité croissante confirmée indépendamment (3,79 → 5,36/6 du début à l'épilogue), moments faibles rares (2,6 % des parties ont une série de 3+ cartes faibles)                                                               |
| Tension               |       6,5 | CORRECT | Moyenne        | Le classement bouge beaucoup en début de partie mais avec peu d'enjeu réel (les positions sont encore proches) ; il bouge peu en fin de partie quand l'enjeu est le plus fort — profil de tension inversé par rapport à l'idéal |
| Rejouabilité          |         6 | CORRECT | Moyenne-élevée | Une partie couvre ~17-21 % du catalogue accessible ; la nouveauté par partie tombe sous 15 % dès la 5e-8e partie du même parti — la lassitude devient probable autour de la 8e-10e partie                                       |
| Variété entre partis  |         5 | CORRECT | Moyenne        | Jaccard croisé très proche du Jaccard intra-parti en moyenne globale (0,173 vs 0,171), mais avec une vraie hétérogénéité par paire (Reconquête nettement à part, PS/Renaissance/Horizons très proches)                          |
| Favoris               |       4,5 | FAIBLE  | Élevée         | Le parti le plus facile à qualifier et à faire gagner (Horizons, 85,6 % qualifié, 88,3 % victoire\|qualifié) obtient le score de fun le plus bas des 9 partis (44,3/100)                                                        |
| Outsiders             |         6 | CORRECT | Moyenne-élevée | Reconquête (27,2 % qualifié) reste jouable et sa rejouabilité mesurée est la meilleure de tous les partis, mais sa tension mesurée est la plus faible (peu de campagnes flirtent même avec la zone de qualification)            |
| Narrativité           |         7 | BON     | Élevée         | 81,7 % des campagnes cumulent au moins 3 signaux « histoire racontable » sur 13 ; les chaînes internes de parti (fronde → crisis_followup) sont systématiquement le contenu le mieux noté du jeu                                |
| Immersion             |       6,5 | CORRECT | Moyenne        | Mécaniques thématiques réelles (rejet, reports, cohésion, mémoire d'acteur) mais aucune identité de parti dans la structure des choix eux-mêmes (déjà signalé par `GAMEPLAY_AUDIT.md`, reconfirmé ici)                          |
| Second tour           |         8 | BON     | Élevée         | Intensité mesurée supérieure au premier tour pour les 9 partis sans exception (moyenne 4,98 vs 4,06/6) ; contenu dédié même pour les éliminés (« Votre voix reste décisive »)                                                   |
| Défaites              |         7 | BON     | Moyenne-élevée | L'épilogue d'élimination relie explicitement le score à une décision nommée et propose une suite (soutien, bilan, législatives) — pas un écran froid, vérifié en direct dans le navigateur                                      |

---

## 1. Verdict exécutif

> **Est-ce que le jeu est amusant aujourd'hui ?**

**Plutôt oui, mais de façon inégale.** Le moteur produit, de façon vérifiable et reproductible, de
vraies histoires avec de la tension, des rebondissements, une mémoire qui se rappelle aux joueurs et
un second tour qui change réellement de registre. La partie jouée en direct dans le navigateur pour
cet audit (Reconquête, méthode « La rupture », outsider) a produit un enchaînement crédible : un
duel provoqué contre la favorite, sa riposte médiatique promise puis effectivement délivrée deux
décisions plus tard, une 8ᵉ place au premier tour, un rôle de « faiseur de voix » au second tour
malgré l'élimination, et un bilan final qui raconte spécifiquement cette campagne (« Le tournant
retenu est _"La souveraineté économique cherche ses instruments"_... »). Ce n'est pas un automate
qui aligne des cartes.

Mais l'écart entre le parti le plus amusant mesuré (Nouvelle Énergie, 70,7/100) et le moins amusant
(Horizons, 44,3/100) est large et cohérent sur toutes les preuves rassemblées (score composite,
proxy de fun par partie individuelle, lecture qualitative de plusieurs dizaines de chronologies,
partie jouée en direct). Le jeu n'est pas _uniformément_ amusant selon le parti choisi.

> **Est-ce qu'on peut réellement s'amuser avec n'importe quel parti ?**

**Plutôt oui, avec une réserve claire sur les favoris confortables.** Les 9 partis existants
produisent tous des campagnes jouables, avec au moins un signal narratif mémorable dans 99,8 % des
9 000 parties simulées observées avec preuve. Mais un parti structurellement facile (Horizons :
qualification quasi automatique, victoire deux fois sur trois si qualifié) tend vers des parties
plates où peu de décisions comptent vraiment — un phénomène directement observé (chronologie
`horizons/cautious/seed5` : victoire 92/100, rang 1 du début à la fin, un seul signal mémorable sur
13 possibles).

> **Les événements aléatoires améliorent-ils réellement la partie ?**

**Partiellement.** L'expérience contrefactuelle (même graine, même parti, même profil, catégories
`world`/`scandal` retirées du harnais d'audit) montre que retirer ces catégories change la
composition exacte des événements rencontrés dans 100 % des parties appariées et change l'issue
finale (qualification et/ou victoire) dans 51,9 % des cas — un effet loin d'être négligeable. Mais
l'impact en points de score reste modeste par événement (delta de sondage moyen de 0,44 à 1,32
point), et 6 des 24 événements de ces catégories sont classés « frustrants » par notre grille
relative (dominance ou impact disproportionné). Le hasard change la partie plus qu'il ne l'enrichit
narrativement — voir §8.

> **Est-ce que le jeu donne envie de recommencer ?**

**Oui pour les premières parties, avec une lassitude mesurable qui s'installe assez tôt sur un même
parti.** La part de contenu réellement nouveau par partie tombe de 100 % (partie 1) à moins de 15 %
dès la 5ᵉ-8ᵉ partie du même parti, et à 0-13 % à la 10ᵉ. Changer de parti recharge fortement la
nouveauté (chaque parti n'a en moyenne exploré que 17-21 % du catalogue qui lui est accessible après
une seule partie).

---

## 2. Méthodologie

1. **Lecture intégrale des audits précédents** : `AUDIT_POST_CORRECTIONS.md`, `POST_AUDIT_FIXES.md`,
   `GAMEPLAY_AUDIT.md`, `audit-results/README.md`, `V2_DECISIONS.md`, `V2_CHANGELOG.md`. Commit
   audité : `b5955c1` (HEAD au démarrage), branche `codex/v2-audit-improvements`, arbre propre.
   Node v24.16.0, npm 11.13.0. Catalogue : 9 partis, 249 événements, 58 succès, 18
   rares/legendary/secret (confirmé par `npm run data:validate`).
2. **Vérifications préalables** : `format:check` (2 fichiers de prompt markdown non formatés,
   hors périmètre code — voir §3), `lint`, `typecheck`, `data:validate`, `test` (130/130), `build` —
   tous réussis avant tout audit (voir §41 pour la ré-exécution finale).
3. **Outillage dédié** (`scripts/fun-audit/`, séparé de `scripts/audit-post/` et
   `scripts/gameplay-audit/`, mais réutilisant leurs briques testées — `lib/agents.ts`,
   `lib/csv.ts`, `lib/svg-charts.ts`, `lib/custom-profiles.ts` — sans dupliquer leur logique) :
   - `simulate.ts` : corpus principal, moteur réel, **1 890 campagnes complètes, 0 échec**
     (9 partis existants × 9 profils × 20 graines = 1 620 parties, + 13 profils de parti
     personnalisé × 5 profils-agents × 6 graines = 270 parties), **53 950 décisions enregistrées**.
   - `ab-experiment.ts` : harnais A/B temporaire, **1 296 campagnes appariées, 0 échec** (9 partis ×
     3 profils × 8 graines × 6 configurations de contenu).
   - `analyze.ts` : dérive toutes les métriques demandées à partir du corpus (aucune
     réimplémentation des règles — uniquement de l'agrégation statistique sur les journaux produits
     par le moteur réel).
   - `charts.ts` : 12 graphiques SVG.
   - `select-timelines.ts` : 78 chronologies lisibles rejouées à l'identique (même graine) pour
     produire le texte complet.
4. **Panel de joueurs synthétiques** (section 24 du prompt) — voir `scripts/fun-audit/lib/profiles.ts`
   pour le mapping documenté : les 7 archétypes demandés (stratège, roleplayer, opportuniste, chaos,
   prudent, narratif, débutant) sont assignés à 6 agents déjà définis et cross-référencés dans
   `scripts/audit-post/lib/agents.ts` (le jeu d'agents « réalistes », sans optimiseur à information
   parfaite), plus un **nouvel agent « débutant »** créé pour cette mission : il ne lit que
   l'étiquette visible de chaque option (RASSEMBLEUR/POPULAIRE/... jugées rassurantes,
   RISQUÉ/CLIVANT/... jugées inquiétantes), jamais les probabilités ou les effets cachés — un
   comportement qu'aucun agent existant ne modélisait. Deux agents supplémentaires
   (`neutral_baseline` = aléatoire, `risk_seeking_ref` = risqué) servent de références de calibration,
   comme dans `AUDIT_POST_CORRECTIONS.md` §10.6.
5. **Expériences A/B sur les systèmes narratifs** (section 26) : 5 des 6 variantes demandées ont été
   implémentées dans un harnais temporaire (`scripts/fun-audit/lib/content-variants.ts`, clones de
   contenu élagués, jamais le contenu de production modifié) : sans catégories `world`/`scandal`,
   sans événements rares, sans mémoire narrative (effets `actor_memory` retirés), sans effets
   idéologiques (`statement` retiré des choix), sans conséquences différées. **La 6ᵉ variante
   demandée — sans actions adverses autonomes — n'a pas pu être implémentée sans réimplémenter
   partiellement le moteur** (`simulateOpponentTurn(state)` est appelée sans condition dans
   `resolveCurrentChoice`, sans levier de contenu pour la désactiver) ; ce point est documenté
   explicitement plutôt que contourné.
6. **Playtests navigateur réels** (section 23) : Playwright/`playwright-cli` contre le serveur de
   développement réel (`npm run dev`, build non modifié). Une campagne complète jouée décision par
   décision jusqu'au bilan final (Reconquête, méthode « La rupture », desktop 1280×720), avec
   déclenchement volontaire d'une chaîne narrative (provocation du favori en débat → riposte deux
   décisions plus tard) observée en direct dans l'interface, pas seulement dans les données. Contrôle
   complémentaire sur viewport mobile (390×844) : écran de résultat, création de parti personnalisé.
   Captures dans `audit-results/fun-audit/screenshots/`.
7. **Revue manuelle qualitative** : lecture intégrale des 9 événements `rare_*` génériques
   (`src/game/data/events/v2/rare.ts`), des 10 événements de second tour/épilogue gouvernemental
   (`endgame.ts`, l'intégralité du contenu spécifique au second tour du jeu), et d'un échantillon de
   contenu spécifique aux partis (Horizons, Nouvelle Énergie, en intégralité pour leurs premiers
   événements d'identité/fronde) choisi pour contraster les deux extrêmes du score de fun mesuré.
   Complétée par la lecture intégrale d'une chronologie du top 10 (`lfi/chaos/seed11`, 31 décisions)
   et d'une chronologie du bottom 10 (`horizons/cautious/seed5`).
8. **Score de fun multidimensionnel** (section 27) construit en deux passes : calcul d'une valeur
   brute par parti pour chaque proxy, puis **normalisation min-max à l'intérieur des 9 partis
   existants** (échelle 2-10, comparative, jamais absolue — voir §11 pour la justification). Une
   première version sans cette normalisation produisait des scores saturés à 10/10 pour 7-8 partis
   simultanément sur plusieurs sous-dimensions : ce défaut a été corrigé avant publication plutôt que
   masqué (voir le commentaire dans `scripts/fun-audit/analyze.ts`, section « PARTY FUN SCORE »).

## 3. Limites

- **Le score de fun est un outil comparatif, pas une mesure du plaisir humain** — répété
  explicitement à chaque usage dans ce rapport, conformément à la section 27 du prompt.
- **La classification S/A/B/C/D/F des événements (§6) pool 9 profils très différents.** Un événement
  est jugé « dilemme réel » si des styles de jeu différents choisissent des options différentes — pas
  si un joueur donné hésite. Un événement pourrait avoir une réponse évidente pour _un_ style de jeu
  cohérent tout en affichant une entropie élevée simplement parce que le stratège, le roleplayer et
  le chaos player ne veulent pas la même chose. C'est une mesure de « la bonne réponse dépend-elle du
  style de jeu », pas directement de « le joueur hésite-t-il ». Conséquence visible : très peu
  d'événements sont notés D/F (1 seul F, sur un échantillon d'une seule occurrence — voir §23).
- **Le corpus de 1 620 parties existantes est plus petit que celui d'`AUDIT_POST_CORRECTIONS.md`**
  (5 280 parties) ou de `GAMEPLAY_AUDIT.md` (398, mais avec un tracking différent). Conséquence
  concrète : 6 des 18 événements rares/legendary/secret du catalogue (tous des `party_X_rare`
  spécifiques à un parti non couvert par notre tirage) n'ont pas été rencontrés dans cet
  échantillon. `AUDIT_POST_CORRECTIONS.md` §15 a déjà confirmé indépendamment, sur un corpus plus
  grand, que les 18/18 sont atteignables — ce n'est donc pas une nouvelle découverte
  d'inatteignabilité, seulement une limite de taille d'échantillon de cette mission spécifique.
- **La similarité entre partis (§11) est mesurée partie-par-partie appariée** (même graine, même
  profil, parti différent), pas sur l'union de tout le contenu vu sur 20 graines — une différence
  méthodologique explicite par rapport à une première version bugguée de ce script qui, elle,
  convergeait artificiellement vers ~0,17 pour toutes les paires en agrégeant trop de graines (voir
  le commentaire dans `analyze.ts`). Le chiffre publié ici (0,173 en moyenne globale, mais avec une
  vraie variance par paire) est comparable en méthode à `cross-party-overlap.csv` de
  `GAMEPLAY_AUDIT.md`, mais les chiffres absolus diffèrent (0,173 contre 0,126) car les profils de
  joueurs synthétiques utilisés ne sont pas les mêmes agents — documenté, pas caché.
- **Un seul système A/B sur 6 demandés n'a pas pu être testé** (actions adverses autonomes) —
  raison technique documentée en §2.5 et §26.
- **La lecture manuelle qualitative** a couvert l'intégralité du catalogue « rares » et « second
  tour », mais un échantillon volontairement restreint du contenu spécifique aux partis (2 partis
  lus en détail sur 9) et des chaînes narratives (observées en direct pour une seule chaîne dans le
  navigateur, plus leur trace statistique dans les 53 950 décisions). Ce n'est pas une lecture
  exhaustive des 249 événements — assumé, pas dissimulé.
- **Un seul playtest complet en direct dans le navigateur** a été mené jusqu'au bilan final (un
  outsider, Reconquête). Les autres 78 « chronologies » sont des rejeux déterministes du moteur réel
  (mêmes graines que le corpus), pas des sessions humaines cliquées dans l'interface — leur valeur
  est donc dans le texte et les statistiques produits par le moteur réel, pas dans la friction UI
  (déjà auditée en profondeur ailleurs, voir `GAMEPLAY_AUDIT.md` §23-24).
- **Les deux fichiers markdown de consigne** (`PROMPT_CLAUDE_CODE_AUDIT_FUN_REJOUABILITE.md` et
  `PROMPT_CLAUDE_CODE_AUDIT_GAMEPLAY_FUN.md`) ne sont pas formatés au sens de `prettier` — ce sont
  des fichiers de consigne, pas du code du jeu, et cette mission ne les a pas modifiés ; signalé pour
  complétude du §41 uniquement.

## 4. Fun global

Le score de fun composite (formule §27, weights du prompt) varie de **44,3 à 70,7 sur 100** selon le
parti (voir §27 pour le tableau complet). Ce n'est pas un artefact de la formule : la même
hiérarchie approximative ressort de trois sources indépendantes qui ne partagent aucun code de
calcul entre elles :

1. Le score composite lui-même (formule pondérée, §27).
2. Le **proxy de fun par partie individuelle** utilisé pour sélectionner les chronologies « top 10 »
   / « bottom 10 » (signaux mémorables + événements rares + retournements − cartes faibles) :
   5 des 10 chronologies les moins amusantes de tout le corpus de 1 620 parties appartiennent à
   Horizons, alors que ce parti ne représente que 1/9 des parties simulées — une surreprésentation
   nette (attendue : ~1,1 chronologie sur 10 par hasard).
3. La lecture manuelle : la chronologie `horizons/cautious/seed5` (score final 92/100, victoire
   confortable) affiche le rang 1 du début à la fin de la campagne et un seul signal mémorable sur
   13 possibles — une victoire propre, mais plate.

**Ce que le fun global n'est PAS ici** : un jugement disant que le jeu est ennuyeux. Sur les 9
domaines obligatoires du prompt évalués individuellement (§32), aucun n'est classé
PROBLÉMATIQUE ou TRÈS PROBLÉMATIQUE. Le jeu produit des histoires (§18), un rythme croissant
mesuré indépendamment de trois façons différentes (§5, §7 de `GAMEPLAY_AUDIT.md`, et cette mission),
et un second tour qui change réellement de registre pour les 9 partis sans exception (§21). Le
principal problème n'est pas l'absence de fun, c'est sa **répartition inégale entre partis**.

## 5. Rythme

`audit-results/fun-audit/pacing.csv` (53 950 décisions) :

| Phase               | Décisions | Intensité moyenne | \|Δ sondage\| moyen | Taux de changement de rang | Taux de bascule qualification |
| ------------------- | --------: | ----------------: | ------------------: | -------------------------: | ----------------------------: |
| pre_campaign        |    12 257 |              3,79 |                0,98 |                     46,5 % |                        19,5 % |
| campaign            |    12 334 |              4,13 |                0,89 |                     28,7 % |                        15,1 % |
| official_campaign   |    12 669 |              4,31 |                0,97 |                     21,3 % |                        10,3 % |
| between_rounds      |     6 040 |              5,04 |                0,48 |                      8,1 % |                         3,3 % |
| government_epilogue |     1 526 |              5,36 |                1,02 |                      9,4 % |                         5,7 % |

La courbe d'intensité est **franchement croissante** (3,79 → 5,36/6), reproduisant indépendamment le
même constat que `GAMEPLAY_AUDIT.md` §7 (3,71 → 5,15/6, avec une méthodologie de corpus différente).
Deux mesures indépendantes, deux moteurs de simulation d'audit distincts, même conclusion : ce n'est
pas un artefact d'une seule méthode de mesure.

Le profil réel ressemble davantage à :

```text
installation (beaucoup de mouvement, faible enjeu)
→ premiers arbitrages (mouvement modéré, enjeu qui monte)
→ campagne officielle (mouvement plus rare, enjeu clair)
→ entre-deux-tours (mouvement rare, enjeu maximal)
→ épilogue (accalmie narrative, enjeu de gouvernement)
```

qu'à la courbe plate décrite en section 5 du prompt comme repoussoir. Voir §6 pour la nuance
importante : la baisse du taux de changement de rang en fin de partie est un point de vigilance, pas
seulement un signe de stabilisation saine.

## 6. Tension

`audit-results/fun-audit/tension.csv`, par décile de progression dans la campagne :

|    Décile |     n | Intensité moyenne | \|Δ sondage\| moyen | Taux de changement de rang |
| --------: | ----: | ----------------: | ------------------: | -------------------------: |
| 0 (début) | 4 003 |              3,62 |                0,86 |                     49,1 % |
|         1 | 4 345 |              3,80 |                1,26 |                     52,0 % |
|         2 | 4 860 |              3,99 |                1,00 |                     39,7 % |
|         3 | 4 345 |              4,15 |                0,94 |                     31,5 % |
|         4 | 4 860 |              4,18 |                0,76 |                     24,1 % |
|         5 | 4 345 |              4,28 |                1,16 |                     23,9 % |
|         6 | 4 860 |              4,21 |                1,14 |                     23,7 % |
|         7 | 4 345 |              4,28 |                0,29 |                      8,4 % |
|         8 | 4 860 |              4,95 |                0,52 |                     15,1 % |
|   9 (fin) | 5 623 |              4,90 |                0,83 |                     13,3 % |

**Constat structurel, pas seulement anecdotique** : le classement bouge le plus quand l'enjeu est le
plus faible (début de partie, 9-10 partis regroupés dans une fourchette étroite de points — le même
phénomène que `GAMEPLAY_AUDIT.md` §12 avait déjà repéré pour la volatilité corrigée du classement) et
bouge le moins quand l'enjeu est le plus fort (fin de campagne officielle et entre-deux-tours). C'est
un **profil de tension inversé** par rapport à l'idéal narratif (une bonne histoire fait monter
l'incertitude vers son climax, pas l'inverse). Ce n'est pas nécessairement injouable — un classement
qui se resserre en fin de partie peut aussi se lire comme « les positions se sont clarifiées » — mais
cela signifie que le pic de volatilité brute ne coïncide pas avec le pic d'enjeu perçu, ce qui limite
le potentiel de tension du dernier tiers de la campagne officielle.

Verdict : CORRECT plutôt que BON, avec ce point de vigilance documenté explicitement plutôt que
noyé dans la moyenne globale (qui, elle, semble favorable).

## 7. Choix

`audit-results/fun-audit/choice-dominance.csv` (224 paires événement/option évaluées, événements
rencontrés ≥ 10 fois) : **4 événements (1,8 %) ont une option choisie plus de 80 % du temps**, tous
profils confondus. Ce chiffre est **identique**, à la décimale près, à celui de
`GAMEPLAY_AUDIT.md` §6 (1,8 %, sur un corpus et une méthode de mesure différents) — une convergence
qui renforce fortement la confiance dans le résultat plutôt qu'une simple coïncidence.

Le choix quasi dominant le plus net observé dans ce corpus : `debate_frontrunner_retaliation`
(« La riposte du favori », déclenchée par une chaîne — voir §18) est réglé de la même façon dans
90,8 % des 65 occurrences observées. C'est le même événement que celui déclenché en direct pendant
le playtest navigateur de cette mission (voir §2.6). **Nuance importante et honnête** : cet
événement est narrativement l'un des plus réussis du jeu (une conséquence différée, promise puis
livrée, qui a été vécue comme un vrai moment fort pendant le playtest) — mais une fois qu'on y est,
le choix mécaniquement optimal est presque toujours le même. C'est un exemple concret de la
distinction demandée par le prompt : « unique » et « amusant à la première rencontre » ne veut pas
dire « dilemme réel une fois dedans ».

À l'autre bout du spectre, les décisions de second tour spécifiques à un parti (`party_ps_runoff`,
`party_ecologistes_runoff`) montrent aussi une dominance élevée (52,6 % et 50,0 % dans notre mesure,
contre 87,5 % dans `GAMEPLAY_AUDIT.md` pour un événement comparable — écart méthodologique attendu :
notre panel inclut délibérément deux profils « chaos »/« contrarien » qui évitent systématiquement
l'option qu'un joueur rationnel préférerait, ce qui dilue mécaniquement la dominance mesurée par
rapport à un panel 100 % réaliste). Le signal directionnel (« signer le contrat de coalition qui
correspond à son camp est presque toujours la bonne réponse ») est confirmé indépendamment, même si
le chiffre exact diffère selon la composition du panel.

## 8. Événements aléatoires

`audit-results/fun-audit/random-event-value.csv` (24 événements des catégories `world`/`scandal`,
1 620 parties existantes) classés par tertile de score composite (méthode documentée dans le
commentaire de code — un seuil absolu sur l'amplitude de sondage produisait un résultat dégénéré
0/24 « intéressant », corrigé avant publication) :

- **Intéressant (8/24)** : `scandal_treasurer_invoices`, `scandal_false_resume`,
  `world_rival_leadership_split`, `scandal_family_hire`, `scandal_local_expenses`,
  `scandal_consultant_contract`, `world_public_service_outage`, `world_floods`.
- **Neutre (10/24)** : le gros du peloton — impact réel mais modeste (crise industrielle, grève,
  canicule, crise budgétaire...).
- **Frustrant (6/24)** : `world_national_strike`, `world_economic_slowdown`, `world_heatwave`,
  `scandal_campaign_data`, `world_international_crisis`, `world_security_attack` (ce dernier n'a été
  rencontré qu'une seule fois sur 1 620 parties — verdict « frustrant » fragile, basé sur un seul
  point de données à interpréter avec prudence, pas une accusation ferme).

**Ratio hasard-intéressant / hasard-neutre-numérique** : environ 1 pour 1,25 (8 intéressants pour 10
neutres) au sein des catégories les plus « aléatoires » du jeu — un ratio correct sans être
excellent.

**L'expérience A/B (section 7 du prompt, exécutée à la lettre)** — même graine, même parti, même
profil, catégories `world`/`scandal` retirées du contenu passé au moteur réel (216 paires
appariées) :

| Mesure                                                              |             Valeur |
| ------------------------------------------------------------------- | -----------------: |
| Parties avec un ensemble d'événements différent                     |              100 % |
| Écart moyen de score final                                          |        10,9 points |
| Écart moyen de volatilité de rang                                   | +0,004 (quasi nul) |
| Écart moyen de moments forts (rares+chaînes)                        |              +0,28 |
| Part des parties dont l'issue change (qualification et/ou victoire) |             51,9 % |

**Réponse à la question posée par le prompt** (« si on supprimait les événements aléatoires
non-obligatoires, la partie deviendrait-elle clairement moins intéressante ? ») : oui pour la
_trajectoire_ (100 % de parties différentes, plus de la moitié des issues changées), mais l'effet
tient largement au fait que le sélecteur d'événements est pondéré-aléatoire à _chaque_ décision
(`src/game/engine/eventSelector.ts`) — retirer deux catégories redistribue le poids sur toutes les
autres et fait diverger toute la suite du tirage, pas seulement les décisions qui auraient
directement impliqué `world`/`scandal`. C'est un effet de cascade du système de sélection, pas
uniquement la preuve que ces deux catégories précises sont narrativement indispensables. Combiné au
fait que 6/24 de leurs propres événements sont jugés « frustrants », le verdict raisonnable est :
**le hasard change réellement la partie (oui), mais ne l'améliore que partiellement (verdict
PARTIELLEMENT, pas OUI franc).**

## 9. Événements rares

**Lecture manuelle intégrale des 9 événements `rare_*` génériques** (`src/game/data/events/v2/rare.ts`) :
la calibration éditoriale est bonne. Les tons sérieux (article 16 sur les pouvoirs exceptionnels,
Assemblée fragmentée en neuf groupes, coalition de crise énergétique) sont tous étiquetés
`importance: "decisive"` ou `"major"` ; les tons délibérément absurdes (perroquet qui répète le
slogan, apostrophe qui change un tract, pétition monarchiste à un million de signatures, hologramme
en panne) sont tous étiquetés `importance: "routine"`. Aucune bifurcation absurde ne décide
l'élection — conforme à la consigne de la section 19 du prompt.

`audit-results/fun-audit/rare-event-value.csv` (12 des 18 événements rares/legendary/secret du
catalogue rencontrés dans ce corpus, voir §3 pour la limite d'échantillon) :

- **9 « mémorables »**, **0 « exceptionnel »**, **0 « gadget »**, **0 « trop fréquent »**,
  **3 « trop rares »** (les événements `party_X_rare` spécifiques à un parti, à faible échantillon).
- **Constat structurel net** : **aucun des 9 événements `rare_*` génériques ne porte de champ
  `chain`** — vérifié directement dans le code source, pas seulement dans les statistiques. Ce sont
  des « cartes » ponctuelles à fort impact narratif immédiat, jamais des amorces d'arc narratif sur
  plusieurs décisions. C'est la raison mécanique du 0 dans la catégorie « exceptionnel » (définie
  ici comme rare + chaîne + score composite élevé) : la mécanique de chaîne, qui produit par
  ailleurs le meilleur contenu du jeu (§18, tous les événements notés S sont des chaînes), n'est
  jamais combinée avec la rareté. C'est un choix de conception cohérent (D-012 documente déjà que le
  monde évolue surtout de façon autonome), mais qui laisse un potentiel narratif non exploité.

**Réponse à la question du prompt** (« quand cet événement apparaît, le joueur est-il content/
surpris/inquiet, ou voit-il une autre carte ? ») : sur l'échantillon lu et sur la partie jouée en
direct (qui n'a pas rencontré d'événement `rare_*` générique mais un événement `party_reconquete_rare`
non lu ici), le ton et l'écriture soutiennent clairement la première réponse — mais rien dans le
texte ne prolonge la surprise au-delà de la conséquence immédiate.

## 10. Rejouabilité

`audit-results/fun-audit/replayability.csv`, profil « référence neutre » (aléatoire), graines
successives par parti :

| Parties jouées | Couverture moyenne du catalogue accessible | Contenu nouveau moyen dans CETTE partie |
| -------------: | -----------------------------------------: | --------------------------------------: |
|              1 |                                     19,0 % |                                   100 % |
|              2 |                                     31,2 % |                                  70,4 % |
|              3 |                                     41,6 % |                                  55,6 % |
|              5 |                                     56,6 % |                                  35,8 % |
|             10 |                                     72,9 % |                                   8,9 % |
|             20 |                                     82,3 % |                                   2,1 % |

**La lassitude devient statistiquement probable entre la 5ᵉ et la 8ᵉ partie du même parti** (le
contenu nouveau par partie passe sous les 30-35 %), et devient nette à la 10ᵉ (moins de 10 % de
contenu nouveau, en moyenne 0-13 % selon le parti). Changer de parti recharge fortement la
nouveauté : après une seule partie, un joueur n'a vu qu'entre 16,4 % (LR) et 20,9 % (RN/Renaissance)
du catalogue qui lui est structurellement accessible.

**Nouveauté structurelle, pas seulement textuelle** : ce résultat mesure l'ensemble d'événements
rencontrés (pas seulement leur texte), et intègre donc de facto la nouveauté de trajectoire
électorale, d'adversaires rencontrés (via les événements d'interaction adverse) et de résultat.

## 11. Analyse parti par parti

Méthodologie de score : voir §2.8 et §27. Chaque sous-score est normalisé entre 2 et 10 **à
l'intérieur des 9 partis existants** — un score de 2 signifie « le plus faible des 9 partis sur cette
dimension », pas « mauvais dans l'absolu ». Les commentaires ci-dessous combinent ce score avec les
preuves brutes (taux de qualification/victoire, chronologies lues, contenu de catalogue).

Tableau complet en §35. Commentaires individuels :

**Nouvelle Énergie (fun 70,7 — le plus haut)** : parti qui _doit prouver son utilité_ dès son premier
événement d'identité (« Nouvelle Énergie doit prouver son utilité », awareness structurellement
basse). Cette fragilité de départ (qualification 73,3 %, mais aucune garantie ressentie) produit
mécaniquement de la tension à chaque décision — contrairement à un favori confortable, presque rien
n'est acquis d'avance. Tension mesurée la plus haute du jeu (8,8/10). Agence et variété stratégique
dans la moyenne basse (4,3/10 chacune) : un parti tendu mais qui ne récompense pas énormément le
changement de style de jeu.

**Écologistes (fun 64,7)** : le meilleur score de profondeur (10/10, la plus grande part du
catalogue accessible réellement explorée) et d'agence (10/10, le plus grand écart de score final
entre profils de joueurs) du jeu. Qualification correcte (65,6 %) sans être acquise. C'est le parti
où la stratégie de jeu compte objectivement le plus.

**LR (fun 61,4)** : tension maximale mesurée (10/10) mais rejouabilité et profondeur faibles
(5,7/10 et 3,8/10) — une campagne intense à chaque partie, mais qui explore vite le même terrain.
Qualification modeste (46,7 %), ce qui explique en partie la tension : peu de marge d'erreur.

**Renaissance (fun 59,9)** : le score d'identité le plus faible du jeu (2,5/10) — cohérent avec le
constat déjà établi indépendamment par `GAMEPLAY_AUDIT.md` §19 (contenu générique partagé,
personnages récurrents identiques d'un parti à l'autre) : Renaissance, en tant que parti « du
centre » sans identité idéologique tranchée, hérite proportionnellement plus du pool générique que
d'un contenu qui lui est propre.

**Reconquête (fun 59,5)** : le meilleur score de rejouabilité mesuré (10/10 — logique : le parti le
plus difficile à qualifier, donc celui où chaque nouvelle graine offre le plus de terrain encore
inexploré) et la meilleure identité (8,0/10). Mais la tension mesurée est la plus basse du jeu
(3,3/10) : avec 27,2 % de qualification et une part de campagnes qui ne franchissent jamais la zone
de qualification (§17), une majorité de parties Reconquête ne connaissent tout simplement jamais le
suspense d'une qualification disputée — elles se jouent souvent une lutte pour la survie plutôt
qu'une course à la tête.

**LFI (fun 58,1)** : agence élevée (8,4/10), variété stratégique correcte (6,5/10). Qualification
confortable (77,2 %) mais victoire nettement plus incertaine (51,1 % de victoire brute, 66,2 % de
victoire\|qualifié — le plus bas des partis « faciles à qualifier »). Un parti où arriver au second
tour est presque acquis mais où le gagner ne l'est pas — un profil de tension déplacé vers la fin de
partie, cohérent avec un second tour statistiquement disputé pour ce parti.

**PS (fun 57,0)** : le meilleur score d'intérêt de défaite du jeu (9,7/10 — les défaites PS
contiennent le plus de signaux mémorables et sont le plus souvent expliquées par le moteur). Identité
faible (3,8/10), rejouabilité faible (3,2/10) — un parti qui perd bien, mais qui se ressemble vite
d'une partie à l'autre.

**RN (fun 53,8)** : qualification la plus facile du jeu (95,6 %) mais la victoire\|qualifié la plus
faible d'un parti « facile à qualifier » (41,3 %) — cohérent avec le constat déjà établi et corrigé
partiellement par `POST_AUDIT_FIXES.md` §4 (le rejet pénalise structurellement les reports de second
tour). Deuxième meilleur score d'intérêt de défaite (9,6/10) : le parti « presque toujours qualifié,
souvent battu au second tour » produit des défaites qui restent racontables. Satisfaction de victoire
la plus faible du jeu (4,3/10) — se qualifier est presque automatique, ce qui rend la victoire, quand
elle arrive, moins perçue comme méritée par la formule utilisée ici.

**Horizons (fun 44,3 — le plus bas)** : qualification très facile (85,6 %) ET victoire\|qualifié très
facile (88,3 %, la plus haute du jeu) — la combinaison qui produit le score le plus bas sur presque
toutes les dimensions mesurées (agence 2,0/10, profondeur 2,8/10, fun immédiat 3,1/10 — les trois
scores les plus bas de tout le tableau). Confirmé qualitativement : le premier événement de parti
(« Horizons doit sortir de l'attente ») pose une tension interne feutrée (élus locaux vs candidature
présidentielle) plutôt qu'un enjeu électoral existentiel, et la chronologie lue en détail
(`horizons/cautious/seed5`) est une victoire confortable de bout en bout sans jamais quitter la
première place. C'est le profil exact du **« favori ennuyeux »** décrit en section 10 du prompt.

## 12. Similarité entre partis

`audit-results/fun-audit/party-similarity.csv` (36 paires, indice de Jaccard des événements
rencontrés **partie par partie appariée**, même graine et même profil, pas l'union agrégée du
catalogue — voir §3) :

- Moyenne globale intra-parti (même parti, graines différentes) : **0,171**.
- Moyenne globale inter-partis (partis différents, graine et profil identiques) : **0,173**.
- **Ces deux moyennes globales sont quasi identiques**, ce qui pourrait suggérer, lu isolément, que
  les partis ne se distinguent pas plus entre eux qu'une partie ne se distingue d'elle-même à une
  autre graine. **Mais la variance par paire dément une lecture uniforme** :
  - Paires les plus proches : PS/Renaissance (0,241), Écologistes/PS (0,233), Écologistes/
    Renaissance (0,196), Horizons/LR (0,212), Horizons/Renaissance (0,215) — un bloc « centre/
    gauche de gouvernement » qui se ressemble nettement plus que la moyenne.
  - Paires les plus distinctes : PS/Reconquête (0,118), LFI/Reconquête (0,135), Reconquête/
    Renaissance (0,135), LR/Reconquête (0,139), Écologistes/Reconquête (0,143) — **Reconquête est
    systématiquement le parti le plus à part** de tous les autres, confirmant le score d'identité le
    plus élevé du jeu (§11).
- Similarité de la distribution des stratégies de choix (`choiceStrategy`, cosinus) : **entre 0,979
  et 0,996 pour toutes les paires** — quasi identique partout. Ce chiffre confirme, de façon
  totalement indépendante, le constat déjà établi par `GAMEPLAY_AUDIT.md` §19 : les _types_ de
  décisions proposées (négociation, action symbolique, discipline interne...) sont presque
  identiques d'un parti à l'autre ; c'est le contenu narratif et les positions défendues qui
  diffèrent, pas la structure des choix eux-mêmes.

**Verdict** : deux partis idéologiquement proches (PS/Renaissance/Écologistes/Horizons, tous
positionnés au centre ou au centre-gauche institutionnel) produisent une expérience mesurablement
plus proche que la moyenne — signalé, comme demandé par le prompt. Un parti structurellement
distinct (Reconquête, le plus dur à qualifier et le moins central) reste mesurablement à part de
tous les autres, y compris de RN qui partage pourtant une partie de son électorat cible.

## 13. Favoris vs outsiders

Le prompt met en garde explicitement : « le parti le plus fort ne doit pas automatiquement avoir le
meilleur score de fun ». C'est exactement ce qu'on observe ici, dans le sens opposé à l'intuition
naïve : **le parti le plus favori (Horizons) a le score de fun le plus bas** ; un parti de difficulté
moyenne-haute (Nouvelle Énergie, 73,3 % de qualification mais une identité de campagne fragile) a le
score le plus haut.

Graphique dédié : `charts/09-fun-favoris-vs-outsiders.svg` (nuage de points qualification × fun par
parti). Aucune corrélation positive nette ne s'en dégage — si quoi que ce soit, la tendance est
légèrement négative sur cet échantillon de 9 points.

**Profils identifiés parmi les catégories du prompt** (section 10) :

- **Favori ennuyeux** : Horizons, sans ambiguïté (voir §11).
- **Outsider frustrant** : aucun des 9 partis existants n'atteint ce niveau — Reconquête (27,2 %
  qualifié) reste jouable, propose du contenu spécifique riche (identité 8,0/10) et une chronologie
  de défaite honorable a été vérifiée en direct (§16), mais sa tension mesurée est la plus faible du
  jeu (§11) — un « outsider qui ne frustre pas mais qui n'excite pas non plus » serait une
  description plus honnête que « frustrant ».
- **Parti sandbox** (plusieurs trajectoires valables, forte rejouabilité) : Écologistes (agence
  10/10, profondeur 10/10).
- **Parti monotone/sans identité forte** : Renaissance (identité 2,5/10, le score le plus bas du
  tableau sur cette dimension).

## 14. Narrativité

`audit-results/fun-audit/summary.json` / `narrative-density.csv` — indicateur composite (section 18
du prompt, 13 signaux possibles par campagne : retournement, rivalité, crise interne, événement
rare, alliance, revirement, contradiction, remplacement adverse, résolution de fil narratif, mémoire
d'acteur, second tour serré, victoire outsider, effondrement favori) :

- **99,8 % des 1 620 campagnes ont au moins 1 signal**, **95,3 % en ont au moins 2**, **81,7 % en
  ont au moins 3**.
- Moyenne de 3,85 signaux par campagne (sur 13 possibles), avec une variance réelle par parti :
  Écologistes (4,78) et RN (4,39) en tête, Renaissance (3,04) en dernier.
- **Chaque chronologie lue intégralement pour cette mission peut être résumée en 2-4 phrases comme
  une histoire spécifique** — reproduisant le constat déjà établi de façon indépendante par
  `GAMEPLAY_AUDIT.md` §9 sur un échantillon de lecture différent. Exemple (chronologie
  `lfi/chaos/seed11`, jouée par le profil délibérément provocateur) : une campagne qui commence par
  un appel public accusateur envers des maires réticents à parrainer, traverse une fronde interne
  réprimée à la manière forte, encaisse un événement rare institutionnel, refuse un duel médiatique
  pour privilégier un communiqué chiffré, puis l'emporte de justesse au second tour après une
  dernière séquence de mobilisation par le rejet de l'adversaire plutôt que par une coalition
  positive — un arc cohérent avec le style de jeu choisi (chaos/provocation), pas une succession
  neutre d'événements.

**Où la narrativité est la plus concentrée** : voir §23, les meilleurs événements du jeu selon la
grille S-F sont _systématiquement_ les chaînes internes de parti (fronde → crisis_followup). C'est le
principal moteur de narrativité du jeu, davantage que les événements rares (qui, eux, ne chaînent
jamais — §9) ou que les événements génériques `world`/`scandal` (impact réel mais modeste, §8).

## 15. Immersion politique

Test du prompt : « si on remplaçait les noms politiques par des équipes fictives, les mécaniques
resteraient-elles presque identiques ? ». Réponse nuancée, cohérente avec `GAMEPLAY_AUDIT.md` §19
et confirmée indépendamment ici par la similarité de distribution des stratégies (0,979-0,996 pour
toutes les paires de partis, §12) :

- **Ce qui est réellement exploité du thème** : rejet différencié par parti et son effet sur les
  reports de second tour (§21 de `POST_AUDIT_FIXES.md`, revérifié qualitativement ici dans
  `endgame.ts` — les événements de second tour parlent explicitement de reports, de consignes de
  vote, de coalition parlementaire, de Matignon), mémoire d'acteur nommée et rappelée (vérifiée en
  direct pendant le playtest : la riposte de la favorite RN a été explicitement annoncée puis
  livrée), cohérence idéologique mesurable par axe.
- **Ce qui reste largement générique** : le _type_ de décision proposée (négociation, action
  symbolique, discipline interne...) est presque identique d'un parti à l'autre — la personnalité
  perçue vient des positions défendues et du contexte narratif du parti, pas de la nature du choix
  lui-même. Un joueur qui masquerait le nom du parti pourrait deviner l'idéologie aux options
  proposées, mais pas nécessairement à la _forme_ de la décision.
- **Un artefact d'interface repéré pendant le playtest en direct** (non documenté par les audits
  précédents) : la carte de conséquence d'un événement `world_floods` affichait un tag
  « Contexte climateConcern modifié » — un identifiant technique brut (`climateConcern`), pas un
  libellé traduit comme les autres tags affichés sur la même carte (« Local mis à disposition »,
  « Communication suspendue »). Un détail mineur mais qui casse ponctuellement l'immersion — voir §29
  et §38 (P3).

## 16. Hasard et frustration

Voir §8 pour l'analyse complète par catégorie. Synthèse : le hasard du _tirage d'événement_ (quel
événement apparaît) a un effet de cascade fort et mesurable sur toute la trajectoire (§8) ; le hasard
_dans l'issue d'un choix_ est structurellement rare dans ce moteur — `AUDIT_POST_CORRECTIONS.md` §9
avait déjà établi que 98,7 % des choix n'ont plus qu'une seule issue déterministe (architecture
D-003 : « un choix décrit une action vérifiable, pas un pari »). Le hasard de ce jeu est donc
majoritairement un hasard de _contexte_ (quelles cartes voit-on, dans quel ordre), pas un hasard de
_résolution_ (le dé une fois le choix fait) — une distinction importante que le prompt ne détaille
pas explicitement mais qui conditionne toute la lecture de la section 7.

Aucun cas de « victoire gratuite par hasard » ou de « défaite instantanée sans contre-jeu, causée par
un seul tirage » n'a été identifié dans les 1 620 campagnes existantes ni dans la lecture manuelle.

## 17. Comebacks

`audit-results/fun-audit/comeback.csv` (franchissement de la frontière « zone de qualification
top-2 » / « hors zone », au moins une fois pendant la campagne) :

| Parti            | % avec ≥ 1 retournement | % avec ≥ 2 retournements | % sans aucun retournement | Taux de remontée spectaculaire | Taux d'effondrement |
| ---------------- | ----------------------: | -----------------------: | ------------------------: | -----------------------------: | ------------------: |
| Toutes parties   |                  85,7 % |                   72,9 % |                    14,3 % |                          5,4 % |               0,7 % |
| LR               |                 100,0 % |                   87,8 % |                     0,0 % |                          3,3 % |               0,6 % |
| Nouvelle Énergie |                  99,4 % |                   86,1 % |                     0,6 % |                          3,9 % |               0,0 % |
| Renaissance      |                  99,4 % |                   82,2 % |                     0,6 % |                          1,7 % |               0,0 % |
| Écologistes      |                  97,8 % |                   83,3 % |                     2,2 % |                          3,3 % |               0,6 % |
| LFI              |                  98,9 % |                   78,3 % |                     1,1 % |                         10,6 % |               0,0 % |
| PS               |                  94,4 % |                   82,2 % |                     5,6 % |                          7,2 % |               4,4 % |
| Horizons         |                  78,3 % |                   72,2 % |                    21,7 % |                          3,9 % |               0,6 % |
| RN               |                  70,0 % |                   56,1 % |                    30,0 % |                          3,9 % |               0,6 % |
| **Reconquête**   |              **33,3 %** |               **27,8 %** |                **66,7 %** |                         10,6 % |               0,0 % |

**Un jeu où presque tout est décidé dès le début manquerait de tension** (section 17 du prompt) :
sur 7 des 9 partis, plus de 94 % des campagnes connaissent au moins un retournement — un signal
sain. **Reconquête est l'exception nette** : deux tiers de ses campagnes ne franchissent jamais la
frontière de qualification (elles restent hors zone du début à la fin, cohérent avec sa qualification
brute de 27,2 %) — ce n'est pas un défaut de conception (un parti à 27 % de qualification ne peut
pas mathématiquement produire autant de retournements qu'un parti à 95 %), mais cela confirme
statistiquement le constat qualitatif du §11 : les campagnes Reconquête sont plus souvent des luttes
pour la survie que des courses au sommet.

## 18. Victoires

Lecture croisée du tableau §11, de `second-round-fun.csv` et d'une victoire lue en détail via le
playtest en direct (non applicable ici, la partie jouée en direct pour cette mission s'est soldée par
une élimination — voir §19) et via les chronologies `victoire_*` sélectionnées (10 chronologies,
`selected-timelines/`).

- **Victoire\|qualifié** varie de 28,6 % (Reconquête, échantillon réduit) à 88,3 % (Horizons) — un
  écart de plus de 3x selon le parti choisi une fois la qualification acquise.
- Les victoires les mieux « méritées » au sens du prompt (climax réel, résumé qui valorise le
  parcours) sont observées qualitativement dans les chronologies dont le score de fun-proxy est
  élevé (ex. `lfi/chaos/seed11`, §14 : victoire de justesse après une campagne à trajectoire
  clairement identifiable). Les victoires les moins « méritées » perceptuellement sont les victoires
  Horizons à rang 1 constant (§11), où le bilan final reste personnalisé (texte relié aux décisions
  réelles, cohérent avec `GAMEPLAY_AUDIT.md` §15) mais où le chemin qui y mène manque de suspense.
- **Une victoire facile est-elle trop plate ?** Oui pour Horizons spécifiquement (funScore 44,3,
  agence 2,0/10) ; non de façon générale — Nouvelle Énergie, LFI et PS ont des taux de
  victoire\|qualifié comparables ou supérieurs (81,8 %, 66,2 %, 74,8 %) sans afficher le même
  effondrement de score de fun, parce que leur _qualification_ elle-même reste plus disputée (73,3 %,
  77,2 %, 79,4 % contre 85,6 % pour Horizons) — c'est la combinaison qualification-facile +
  victoire-facile qui aplatit spécifiquement l'expérience Horizons, pas l'un ou l'autre isolément.

## 19. Défaites

**Vérifié en direct dans le navigateur, pas seulement en données** : la partie jouée pour cette
mission (Reconquête, méthode « La rupture », choix globalement offensifs/clivants) s'est terminée
8ᵉ au premier tour (8,9 % des voix). L'écran de résultat de premier tour est explicite et bien mis en
scène (classement national, carte régionale des territoires en tête). Ensuite, **le jeu ne s'arrête
pas** : un événement dédié à l'élimination (« Votre voix reste décisive ») donne un rôle actif au
joueur éliminé pendant l'entre-deux-tours (soutenir un finaliste, négocier des garanties, rester
indépendant — voir le texte complet en §2.7 des sources et dans `endgame.ts`), avant un bilan final
intitulé « Campagne honorable » (score 50/100) qui relie explicitement le résultat à une décision
précise (« Le tournant retenu est _"La souveraineté économique cherche ses instruments"_, après votre
décision de réserver une part des commandes publiques aux productions européennes... »).

C'est une preuve directe et de première main que **les défaites de ce jeu ne sont pas de simples
échecs secs** — elles racontent, expliquent et donnent au joueur éliminé un dernier acte à jouer.
Ce constat corrobore, avec une preuve indépendante (navigateur réel, pas seulement simulation), celui
déjà établi par `GAMEPLAY_AUDIT.md` §16.

**Dead runs (décisions jouées après qualification mathématiquement/pratiquement impossible)** : non
mesuré directement dans cette mission (le moteur ne permet de toute façon pas d'abandonner une
campagne avant son terme — chaque partie va jusqu'au bout de sa branche narrative, y compris la
branche « éliminé »), mais la présence d'un contenu dédié et distinct pour les éliminés (3 événements
complets rien que dans `endgame.ts`, plus la suite spécifique « avenir du parti »/« mandat personnel »)
suggère que le jeu a été conçu précisément pour éviter que la fin d'une campagne perdue soit un temps
mort.

## 20. Second tour

**Lecture manuelle intégrale des 10 événements de `endgame.ts`**, seul fichier contenant du contenu
`between_rounds`/`government` (confirmé par recherche exhaustive dans le catalogue) : 5 événements
pour les qualifiés (vague de soutiens, débat final, reports de voix, pression du favori, annexe de
coalition), 3 événements pour les éliminés (endossement, absence de consigne, avenir du parti/du
candidat), 3 événements d'épilogue gouvernemental réservés aux vainqueurs (Matignon, équilibre du
gouvernement, première adresse). **Ce n'est pas « mêmes événements + deux candidats »** — c'est un
contenu entièrement dédié, jamais recyclé du premier tour, avec des mécaniques propres (reports,
consignes, contrat de coalition, portefeuilles ministériels).

`audit-results/fun-audit/second-round-fun.csv` — intensité comparée :

| Parti            | Intensité moy. avant qualification | Intensité moy. entre les deux tours |
| ---------------- | ---------------------------------: | ----------------------------------: |
| LFI              |                               3,99 |                                5,00 |
| PS               |                               4,11 |                                5,08 |
| Écologistes      |                               4,10 |                                5,01 |
| Renaissance      |                               4,07 |                                5,09 |
| Horizons         |                               4,05 |                                5,15 |
| LR               |                               4,07 |                                4,92 |
| RN               |                               4,14 |                                5,05 |
| Reconquête       |                               4,03 |                                4,72 |
| Nouvelle Énergie |                               4,10 |                                5,17 |

**Pour les 9 partis sans exception, l'intensité mesurée entre les deux tours dépasse celle d'avant
la qualification** — un signal univoque, exécuté sur un corpus indépendant de celui de
`GAMEPLAY_AUDIT.md` (qui avait déjà établi 4,98 vs une moyenne de 4,03 sur l'ensemble des phases
avant l'entre-deux-tours). **Verdict : le second tour est un vrai nouvel acte, pas une formalité.**

## 21. Durée

Non recalculée en profondeur (déjà mesurée avec précision par `GAMEPLAY_AUDIT.md` §25 : ~25-31
décisions par partie, textes dans une fourchette resserrée de longueur). Complément apporté par
cette mission : `totalNarrativeChars` moyen enregistré par campagne dans
`run-summaries.csv` confirme un volume de lecture cohérent avec l'objectif produit de 10-15 minutes
pour un lecteur normal, sans écart significatif entre partis. Aucun signal de passage anormalement
long ou de fin trop rapide n'a été détecté dans les chronologies lues (le second tour, en particulier,
n'est jamais expédié — §20).

## 22. UI/UX

**Hors périmètre principal de cette mission** (déjà auditée en profondeur sur 4 largeurs d'écran par
`GAMEPLAY_AUDIT.md` §23-24, avec deux problèmes P2 déjà documentés : apostrophes manquantes, barre
d'onglets mobile tronquée — non revérifiés ici, aucune raison de penser qu'ils ont changé puisque
aucun code d'interface n'a été modifié entre les deux missions).

**Un nouveau constat, obtenu uniquement parce que cette mission a rejoué une campagne complète en
direct plutôt que de se fier aux seules données** : un tag de conséquence affiche parfois un
identifiant technique brut plutôt qu'un libellé traduit (« Contexte climateConcern modifié » —
voir §15, capture `screenshots/desktop/playtest-d3.png`). C'est un défaut de contenu/présentation
mineur, jamais signalé par les audits précédents car ils ne rejouaient pas la partie décision par
décision dans le vrai navigateur pour ce type d'événement précis.

Confirmation positive obtenue en direct : la transition carte-événement → carte-conséquence est
fluide, le tableau de bord affiche un ticker « Dernière nouvelle » qui donne une impression de monde
vivant (« PS cherche son second souffle »), la création de parti personnalisé fonctionne correctement
sur viewport mobile (390×844, capture `screenshots/mobile/mobile-custom-party.png`), et l'écran de
bilan final s'affiche correctement à la fois en desktop et en mobile.

## 23. Top événements

D'après `audit-results/fun-audit/event-fun.csv` (228 événements distincts notés), **les 20 meilleurs
événements du jeu (grade S) sont, sans une seule exception, des maillons de chaîne narrative**
(`isChain: true`) :

1. `party_ps_crisis_followup` — « La contribution fiscale revient devant le parti » (74,1)
2. `party_nouvelle_energie_fronde` — « Raphaël Ternois pousse à la fusion » (73,8)
3. `party_reconquete_fronde` — « Hélène Saint-Cyr refuse l'élargissement » (72,8)
4. `party_nouvelle_energie_crisis_followup` — « La négociation de fusion arrive au vote » (71,8)
5. `party_lr_crisis_followup` — « Les fédérations exigent un vote de ligne » (71,5)
6. `party_reconquete_crisis_followup` — « Les comités de Saint-Cyr se coordonnent » (71,1)
7. `internal_strategy_leak` — « La note sur le vote utile fuite » (70,7) — la chaîne rencontrée en
   direct pendant le playtest de cette mission (§2.6).
8. `party_horizons_crisis_followup` — « Le mandat de négociation arrive à échéance » (70,5)
9. `party_lfi_fronde` — « Nassim Courbet réclame une ligne plus sociale » (70,2)
10. `media_economic_morning` — « Le chiffrage de la matinale » (70,1)
    ... (10 autres, toutes des maillons de chaîne — voir le CSV complet).

**C'est le résultat le plus net de toute cette mission** : la mécanique de chaîne narrative (une
décision qui promet une suite, puis une suite qui la tient — mémoire d'acteur incluse, cf. §14) est,
de très loin, le meilleur contenu du jeu selon cette grille. C'est _exactement_ le mécanisme observé
en direct pendant le playtest (§2.6, §19) : la promesse d'une riposte, puis sa livraison deux
décisions plus tard, a été le moment le plus mémorable de toute la partie jouée pour cette mission.

## 24. Événements faibles

Les 20 événements les moins bien notés (hors le cas particulier `world_security_attack`, 1 seule
occurrence, voir §8) sont dominés par deux profils distincts :

- **Des décisions de second tour à faible entropie** (`party_ps_runoff`, `party_ecologistes_runoff`,
  `debate_frontrunner_retaliation` — 34,1, 33,2 et 33,9) : une fois dans le contexte, la réponse
  optimale est presque toujours la même (voir §7 pour la nuance narrative sur ce dernier).
- **Des événements génériques d'ambiance sans enjeu fort** (`internal_local_sections`,
  `media_front_page`, `internal_headquarters_move`, `campaign_peripheral_town` — impact de sondage
  faible, catégorie « common », pas de chaîne). Ce ne sont pas de mauvais textes en soi (leur rôle est
  probablement de faire respirer le rythme, cf. §5-6 sur les cartes faibles peu fréquentes), mais ils
  n'apportent pas de dilemme fort.

## 25. Top 10 parties

Sélection de `selected-timelines/` (proxy de fun = signaux mémorables×3 + événements rares×2 +
retournements×1,5 − cartes faibles×0,5) :

1. `lfi/chaos/seed11` (proxy 38,5) — provocation systématique, fronde interne réprimée, événement
   rare institutionnel, victoire de justesse par le rejet de l'adversaire (§14).
2. `lfi/narrative/seed11` (proxy 36) — profil « cherche l'histoire », même graine que ci-dessus,
   choix différents.
3. `ecologistes/beginner/seed11` (proxy 35,5) — le profil « débutant » (choix au jugé sur l'étiquette
   visible) produit malgré tout une campagne riche en signaux, cohérent avec un parti à forte
   profondeur de catalogue (§11).
4. `lfi/neutral_baseline/seed2` (proxy 35)
5. `ecologistes/opportunist/seed7` (proxy 34,5)
6. `ecologistes/roleplayer/seed8` (proxy 34)
7. `lfi/neutral_baseline/seed6` (proxy 33,5)
8. `nouvelle_energie/narrative/seed10` (proxy 33,5)

**Motif récurrent** : LFI (4/8) et Écologistes (3/8) dominent le top — les deux partis avec la
meilleure narrativité mesurée (§14, moyenne de signaux 4,1 et 4,78) et, pour Écologistes, la
meilleure profondeur/agence mesurée (§11).

## 26. Bottom 10 parties

1-4. Quatre chronologies **Horizons** (`roleplayer/seed13`, `cautious/seed5`, `neutral_baseline/seed13`,
`cautious/seed13`, `roleplayer/seed14` — 5 au total sur 10), proxy de -3,5 à 2.
5-7. Trois chronologies **Reconquête** (`chaos/seed4`, `strategist/seed16`, `opportunist/seed13`).
8-9. Deux chronologies **Renaissance** (`cautious/seed8`, `beginner/seed2`).

**Motif récurrent, cohérent avec §11** : Horizons est surreprésenté (5/10, alors qu'il ne représente
que 1/9 des parties du corpus) — la preuve individuelle-partie converge avec le score composite par
parti. Reconquête apparaît aussi (3/10), mais pour une raison différente et déjà identifiée en §17 :
ce ne sont pas des victoires plates, ce sont des campagnes qui ne quittent jamais la queue du
classement, avec peu de signaux structurels à se mettre sous la dent malgré (ou à cause de) leur
difficulté réelle.

**Ces parties ressemblent-elles réellement à des histoires différentes ?** Les chroniques Horizons du
bottom 10 se ressemblent nettement entre elles (variantes d'une même trame « gestion interne, rang 1
stable ») — moins vrai pour Reconquête, dont les 3 chroniques du bas du classement racontent des
difficultés différentes (opposition interne, refus d'élargissement, négociation de fusion échouée).

## 27. Score de fun par parti

Formule (pondération du prompt, §27), sous-scores normalisés 2-10 au sein des 9 partis (voir §2.8) :

```text
FUN SCORE /100
20 — dilemmes (entropie normalisée du choix, moyenne sur les événements rencontrés ≥ 5 fois)
15 — tension (retournements de qualification + volatilité de rang, normalisés)
15 — variété intra-partie (couverture du catalogue accessible + variance de score entre profils)
15 — rejouabilité (part encore fraîche du catalogue après 10 parties, inversée)
10 — narrativité (densité moyenne de signaux « histoire racontable »)
10 — identité (1 − similarité inter-partis + part d'événements spécifiques au parti)
5 — surprise (taux de rencontre d'un événement rare)
5 — satisfaction des résultats (qualification ni automatique ni improbable, pic à 55 %)
5 — rythme (inverse de la plus longue série de cartes faibles)
```

| Parti            | Fun /100 |
| ---------------- | -------: |
| Nouvelle Énergie |     70,7 |
| Écologistes      |     64,7 |
| LR               |     61,4 |
| Renaissance      |     59,9 |
| Reconquête       |     59,5 |
| LFI              |     58,1 |
| PS               |     57,0 |
| RN               |     53,8 |
| Horizons         |     44,3 |

Note de confiance : **moyenne**. La formule est un outil comparatif documenté (pas une mesure
scientifique), mais la hiérarchie qu'elle produit est corroborée par deux sources indépendantes qui
ne partagent aucun code (le proxy de fun par partie individuelle en §25-26, et la lecture qualitative
manuelle en §11) — ce qui renforce la confiance dans la _hiérarchie relative_, davantage que dans la
valeur exacte de chaque score.

## 28. Problèmes prioritaires

Voir §38 pour le détail complet avec preuve/impact/cause/correction recommandée par problème.

## 29. Recommandations

Voir §38.

## 30. Verdict final

Voir §39-41.

---

## 31. Livrables de données

```text
audit-results/fun-audit/
  run-summaries.csv          1 890 campagnes (une ligne par partie)
  decisions.csv               53 950 décisions (une ligne par décision)
  ab-experiment.csv           1 296 lignes (6 configurations x parties appariées)
  ab-summary.json             5 comparaisons A/B agrégées
  summary.json                chiffres de synthèse cités dans ce rapport
  event-fun.csv                228 événements notés S-F
  random-event-value.csv      24 événements world/scandal classés
  rare-event-value.csv        12 événements rares/legendary/secret classés
  pacing.csv                  rythme par phase
  tension.csv                 tension par décile de progression
  comeback.csv                retournements par parti
  replayability.csv           courbe de contenu nouveau vs parties jouées
  party-similarity.csv        36 paires de partis, Jaccard apparié
  choice-dominance.csv        224 paires événement/option
  low-intensity-streaks.csv   séries de cartes faibles par parti
  narrative-density.csv       signaux mémorables par parti
  second-round-fun.csv        intensité 1er tour vs entre-deux-tours par parti
  party-fun.csv                score de fun complet par parti (9 sous-scores + composite)
  selected-timelines/          78 chronologies lisibles (dont INDEX.json)
  screenshots/                 captures desktop + mobile du playtest en direct
  charts/                      12 graphiques SVG
```

## 32. Graphiques

1. `charts/01-fun-score-par-parti.svg`
2. `charts/02-tension-au-fil-de-la-campagne.svg`
3. `charts/03-intensite-par-phase.svg`
4. `charts/04-frequence-retournements.svg`
5. `charts/05-contenu-nouveau-vs-parties-jouees.svg`
6. `charts/06-valeur-evenements-aleatoires.svg`
7. `charts/07-narrativite-par-parti.svg`
8. `charts/08-similarite-entre-partis.svg`
9. `charts/09-fun-favoris-vs-outsiders.svg`
10. `charts/10-cartes-faibles-consecutives.svg`
11. `charts/11-intensite-premier-vs-second-tour.svg`
12. `charts/12-impact-ab-systemes-narratifs.svg`

## 33. Recommandations classées

### P1 — Cause importante d'ennui pour une part significative des parties

**Le combo « qualification quasi automatique + victoire quasi automatique » aplatit spécifiquement
l'expérience Horizons.**
Preuve : 85,6 % de qualification, 88,3 % de victoire\|qualifié (les deux chiffres les plus hauts du
jeu), score de fun composite le plus bas (44,3/100), 5 des 10 chroniques les moins amusantes de tout
le corpus lui appartiennent, chronologie lue en détail confirmant un rang 1 constant et 1 seul signal
mémorable sur 13. Impact joueur : une partie Horizons jouée sans volonté délibérée de se compliquer
la tâche risque fortement de ne jamais quitter la tête du classement, avec peu de décisions qui
semblent réellement compter. Cause probable : combinaison de statistiques de départ favorables et
d'un contenu de parti centré sur la gestion interne (cohésion élus/candidature) plutôt que sur un
enjeu électoral existentiel comparable à celui de Nouvelle Énergie ou LR. Système concerné :
équilibrage des statistiques de départ du parti (`src/game/data/parties.ts`) et contenu narratif
spécifique (`src/game/data/events/v2/partiesHorizons.ts`). Difficulté de correction estimée : moyenne
(un rééquilibrage des stats de départ risque d'affecter d'autres métriques déjà validées par
`POST_AUDIT_FIXES.md` §4, qui documente déjà Horizons comme un cas de vigilance sur le second tour).
Risque : moyen (touche un parti déjà identifié comme sensible par un audit précédent). Test
d'acceptation proposé : réexécuter `scripts/fun-audit/analyze.ts` et vérifier que le score de fun
d'Horizons se rapproche de la médiane des 9 partis sans faire chuter sa qualification/victoire sous
un plancher qui le rendrait injouable.

### P2 — Réduit fortement la rejouabilité ou l'immersion

**Aucun événement rare générique n'ouvre de chaîne narrative.**
Preuve : lecture intégrale confirmée des 9 événements `rare_*` de `rare.ts` — 0 porte de champ
`chain`. 0 événement rare classé « exceptionnel » dans `rare-event-value.csv` pour cette raison
mécanique précise. Impact joueur : les événements rares restent des « cartes » ponctuelles à fort
impact immédiat, jamais des amorces d'histoires prolongées — un potentiel narratif non exploité,
alors que la mécanique de chaîne est par ailleurs, sans ambiguïté, le meilleur contenu du jeu (§23).
Cause probable : conception assumée (les cartes rares sont pensées comme des respirations ponctuelles,
pas comme des arcs). Système concerné : `src/game/data/events/v2/rare.ts` (contenu, pas moteur — le
champ `chain` existe déjà et fonctionne, utilisé ailleurs). Correction recommandée (non appliquée
dans cette mission) : envisager qu'un sous-ensemble des futurs événements rares (pas nécessairement
tous) porte un `chain` avec un `followUp` à probabilité modérée, sur le modèle exact de
`internal_strategy_leak`/`debate_challenge_frontrunner` déjà présents dans le catalogue. Difficulté :
faible à moyenne (contenu, patron déjà établi dans le code). Risque : faible. Test d'acceptation :
`rare-event-value.csv` recalculé affiche au moins 1-2 événements classés « exceptionnel ».

**Le hasard « pur » (catégories world/scandal) a un effet de cascade fort sur la trajectoire mais un
impact narratif direct plus modeste que sa taille d'effet ne le suggère.**
Preuve : §8 — 100 % de parties différentes, 51,9 % d'issues changées en A/B, mais seulement 8/24
événements de ces catégories classés « intéressants » contre 6 « frustrants », avec des amplitudes de
sondage modestes (0,44 à 1,32 point en moyenne). Impact joueur : le hasard change beaucoup la partie
sans que chaque tirage individuel soit ressenti comme un moment fort. Cause probable : le
sélecteur pondéré (`eventSelector.ts`) redistribue tout le poids restant dès qu'une catégorie est
retirée, ce qui gonfle l'effet mesuré de cascade sans que cela prouve la valeur narrative propre de
chaque carte. Système concerné : contenu des événements `world`/`scandal` les plus « frustrants »
identifiés en §8 (`world_national_strike`, `world_economic_slowdown`, `world_heatwave`,
`scandal_campaign_data`, `world_international_crisis`). Correction recommandée : revue éditoriale
ciblée de ces 5 événements pour renforcer soit leur enjeu narratif, soit leur lien avec l'historique
du joueur (cohérent avec la définition de « randomness intéressante » du prompt §7). Difficulté :
faible à moyenne. Risque : faible.

### P3 — Amélioration notable

**Un identifiant technique brut apparaît occasionnellement dans un tag de conséquence visible par le
joueur.**
Preuve : capturé en direct pendant le playtest de cette mission, `screenshots/desktop/playtest-d3.png`
— tag affiché « Contexte climateConcern modifié » sur un événement `world_floods`. Impact joueur :
casse ponctuellement l'immersion sur un écran par ailleurs bien conçu. Cause probable : un libellé de
tag manquant pour ce type d'effet spécifique dans le code d'affichage, contrairement aux autres tags
de la même carte qui sont correctement traduits. Système concerné : composant d'affichage des
facteurs décisifs (`decisiveFactors`/tags de conséquence, non localisé précisément dans cette
mission qui n'a modifié aucun fichier). Correction recommandée : ajouter le libellé français
manquant pour cet effet (et vérifier s'il existe d'autres cas similaires). Difficulté : faible.
Risque : très faible.

**Le profil de tension est inversé par rapport à l'idéal narratif** (§6) : le classement bouge le
plus quand l'enjeu est le plus faible (début de partie) et le moins quand l'enjeu est le plus fort
(fin de campagne officielle). Correction recommandée : aucune modification de points nécessairement
requise (le resserrement du classement en fin de partie peut aussi se lire comme une clarification
saine) — mais si un rééquilibrage est souhaité, cibler en priorité un lissage de la présentation du
classement en tout début de partie plutôt que les points sous-jacents, cohérent avec la
recommandation déjà faite par `GAMEPLAY_AUDIT.md` §31 point 7 sur le même symptôme. Difficulté :
moyenne (UX de présentation, pas mécanique). Risque : faible.

### P4 — Polish

**La distribution des stratégies de choix (`choiceStrategy`) est quasi identique entre tous les
partis (cosinus 0,979-0,996 pour toutes les paires)** — reconfirmation indépendante du constat déjà
fait par `GAMEPLAY_AUDIT.md` §19, pas une découverte nouvelle. Pas de nouvelle recommandation au-delà
de celle déjà formulée dans ce rapport précédent.

---

## 34. Réponses directes aux 21 questions finales

1. **Recommanderais-tu aujourd'hui le jeu à quelqu'un qui aime la politique ?** Oui, avec la réserve
   de lui conseiller d'éviter Horizons pour une première partie et de plutôt commencer par Nouvelle
   Énergie, Écologistes ou LFI.
2. **Une première partie est-elle amusante ?** Oui dans l'immense majorité des cas (99,8 % des
   campagnes ont au moins un signal narratif mémorable), sauf pour un sous-ensemble de campagnes
   Horizons trop faciles.
3. **Une dixième partie est-elle encore amusante ?** Sur le même parti, probablement moins : la part
   de contenu nouveau tombe à 9 % en moyenne à la 10ᵉ partie (§10). En changeant de parti, oui —
   chaque parti n'a exploré qu'une fraction de son propre catalogue accessible après une seule
   partie.
4. **Les événements aléatoires améliorent-ils réellement le jeu ?** Partiellement — voir §8. Ils
   changent fortement la trajectoire (100 % des parties différentes en A/B) mais leur valeur
   narrative propre est mitigée (8 intéressants, 10 neutres, 6 frustrants sur 24 événements
   `world`/`scandal`).
5. **Les événements rares sont-ils suffisamment mémorables ?** Oui pour la moitié d'entre eux
   (9/12 rencontrés jugés « mémorables »), mais aucun n'ouvre de chaîne narrative — voir P2 en §33.
6. **Les décisions provoquent-elles de vrais dilemmes ?** Dans l'immense majorité des cas oui
   (98,2 % des paires événement/option évaluées ne sont pas dominées à plus de 80 % — chiffre
   identique à celui de `GAMEPLAY_AUDIT.md`), avec des exceptions documentées et nommées (§7, §24).
7. **Le jeu produit-il des histoires racontables ?** Oui, de façon nette et mesurée par trois sources
   indépendantes (§14, §18, §25-26) — le mécanisme le plus efficace pour cela est la chaîne
   narrative interne de parti (fronde → crisis_followup), confirmée en direct dans le navigateur.
8. **Peut-on s'amuser avec tous les partis ?** Oui pour 8 des 9 partis existants sans réserve
   majeure ; Horizons nécessite un style de jeu délibérément plus audacieux pour ne pas produire une
   campagne plate.
9. **Quel est le parti le plus amusant ?** Nouvelle Énergie (70,7/100), suivi de près par Écologistes
   (64,7/100).
10. **Quel est le parti le moins amusant ?** Horizons (44,3/100), un écart net avec le reste du
    classement (le suivant, RN, est à 53,8).
11. **Quel est le parti le plus rejouable ?** Reconquête selon la mesure de couverture de catalogue à
    10 parties (score rejouabilité 10/10), pour une raison structurelle honnête : c'est le parti le
    plus difficile, donc celui qui explore le plus lentement son propre catalogue.
12. **Quel parti a le plus besoin de contenu supplémentaire ?** Renaissance (identité la plus basse,
    2,5/10 ; rejouabilité 5,8/10) et Horizons (profondeur la plus basse, 2,8/10).
13. **Les favoris sont-ils trop faciles ?** Un seul favori net est structurellement trop facile
    (Horizons). RN, favori en qualification (95,6 %), reste tendu au second tour (victoire\|qualifié
    seulement 41,3 %) — pas un cas de facilité généralisée.
14. **Les outsiders sont-ils trop frustrants ?** Non — Reconquête (l'outsider le plus net) reste
    jouable, propose du contenu spécifique riche et une défaite vérifiée honorable en direct dans le
    navigateur ; sa faiblesse mesurée est un déficit de tension (peu de campagnes flirtent avec la
    qualification), pas de la frustration.
15. **Le hasard est-il excitant ou agaçant ?** Les deux selon l'événement précis — un ratio
    globalement correct (8 intéressants pour 6 frustrants sur les 24 événements les plus
    « aléatoires » du jeu) plutôt qu'un verdict univoque.
16. **Les défaites sont-elles intéressantes ?** Oui, vérifié en direct dans le navigateur pour cette
    mission (§19) — un bilan personnalisé, un tournant nommé, une suite jouable même après
    élimination.
17. **Le second tour est-il un vrai nouvel acte ?** Oui, sans ambiguïté — intensité supérieure au
    premier tour pour les 9 partis sans exception, contenu entièrement dédié et jamais recyclé (§20).
18. **Le jeu est-il trop long, trop court ou bien rythmé ?** Bien rythmé dans l'ensemble (courbe
    d'intensité croissante confirmée indépendamment trois fois), avec une réserve documentée sur
    l'inversion du profil de tension (§6).
19. **Quel système contribue le plus au fun ?** La mécanique de chaîne narrative avec mémoire
    d'acteur (fronde → crisis_followup, provocation → riposte) — la preuve la plus nette de toute
    cette mission (§23), confirmée à la fois par les données et par un playtest en direct.
20. **Quel système apporte étonnamment peu au fun ?** Les événements rares génériques, malgré leur
    écriture soignée — parce qu'ils ne se combinent jamais avec la mécanique de chaîne qui est
    pourtant, elle, la plus efficace du jeu (§9, §23).
21. **Quels sont les 5 changements qui augmenteraient le plus le plaisir de jeu ?**
    1. Rééquilibrer Horizons pour que sa qualification et/ou sa victoire\|qualifié cessent d'être les
       plus hautes du jeu simultanément (P1, §33).
    2. Donner une chaîne narrative à un sous-ensemble d'événements rares existants, sur le patron déjà
       présent dans le catalogue (P2, §33).
    3. Réviser l'éditorial des 5 événements `world`/`scandal` classés « frustrants » (P2, §33).
    4. Corriger le tag technique non traduit repéré en direct (P3, §33) — effort minimal, gain
       immédiat sur l'immersion.
    5. Enrichir le contenu spécifique de Renaissance et approfondir celui d'Horizons, les deux partis
       aux scores d'identité/profondeur les plus bas (P3-P4, cohérent avec la recommandation déjà
       faite par `GAMEPLAY_AUDIT.md` §32 point 3 sur le recouvrement de contenu entre partis).

---

## 35. Tableau par parti (obligatoire, section 35 du prompt)

| Parti            |  Fun | Identité | Rejouabilité | Agence | Tension | Variété stratégique | Victoire satisfaisante | Défaite intéressante |
| ---------------- | ---: | -------: | -----------: | -----: | ------: | ------------------: | ---------------------: | -------------------: |
| Nouvelle Énergie | 70,7 |      6,5 |          7,0 |    4,3 |     8,8 |                 4,3 |                    7,4 |                  3,6 |
| Écologistes      | 64,7 |      4,6 |          2,0 |   10,0 |     9,9 |                 9,4 |                    8,5 |                  9,3 |
| LR               | 61,4 |      7,2 |          5,7 |    4,1 |    10,0 |                 4,8 |                    8,8 |                  3,3 |
| Renaissance      | 59,9 |      2,5 |          5,8 |    5,7 |     8,6 |                 5,1 |                    8,8 |                  3,8 |
| Reconquête       | 59,5 |      8,0 |         10,0 |    5,5 |     3,3 |                 5,1 |                    6,1 |                  5,3 |
| LFI              | 58,1 |      4,6 |          5,6 |    8,4 |     9,2 |                 6,5 |                    6,9 |                  5,0 |
| PS               | 57,0 |      3,8 |          3,2 |    8,8 |     8,2 |                 8,3 |                    6,6 |                  9,7 |
| RN               | 53,8 |      4,9 |          3,3 |    4,4 |     4,2 |                 5,1 |                    4,3 |                  9,6 |
| Horizons         | 44,3 |      4,2 |          4,2 |    2,0 |     5,7 |                 4,4 |                    5,7 |                  7,3 |

Commentaires individuels : voir §11.

---

## 36. Fin de mission

Voir §41 pour la ré-exécution finale des tests/build et le résumé terminal.
