# REALITY_GROUNDING_BASELINE — audit du modèle actuel (avant implémentation)

Mesure l'état du modèle électoral et de recomposition **avant** toute modification de cette mission,
pour servir de point de comparaison au rapport final. Corpus : 5 472 campagnes complètes (9 partis ×
8 agents de décision × 76 graines), moteur de production réel, aucune modification de code.
Reproductible : `npx tsx scripts/audit/reality-grounding-baseline.ts`. Durée : 870,8 s (~14,5 min).

## 1. Distribution initiale (avant toute décision de campagne)

Contrairement à l'hypothèse de départ (« le socle initial est un nombre fixe sans variation »), le
socle **affiché** à la toute première carte d'événement varie déjà avec la graine, même à parti et
méthode de campagne strictement identiques. Cause exacte identifiée par lecture du code (pas
seulement supposée) : `generatePoll` (`src/game/engine/polls.ts`) applique un bruit de sondage
±3,8 pts **uniquement au parti joué** (`playerParty.stats.polling = currentPlayerScore`, ligne 58) et
écrase ainsi la valeur affichée avec ce bruit dès le premier sondage — avant toute décision. La vérité
sous-jacente (`nationalLatentSupport` calculée par `initializeElectorate`/`recalculateElectorate`)
reste, elle, strictement déterministe à la création (aucun appel RNG dans ces deux fonctions) : deux
parties identiques (même parti, même graine) partagent aujourd'hui exactement le même socle « vérité »
pour tous les partis. Le tableau ci-dessous mesure donc le **bruit d'affichage du sondage du parti
joué**, pas une variation de la réalité électorale sous-jacente — distinction importante pour ne pas
corriger le mauvais mécanisme en Phase B (mesuré sur 3 graines/parti, méthode fixe `field_first`) :

| Parti | Min | Max | Moyenne | Écart relatif (max-min)/moyenne |
|---|---:|---:|---:|---:|
| LFI | 10,2 | 12,7 | 11,4 | 22 % |
| PS | 11,1 | 13,9 | 12,77 | 22 % |
| Écologistes | 8,4 | 11,8 | 9,6 | 35 % |
| Renaissance | 11,1 | 13,6 | 12,23 | 20 % |
| Horizons | 12,4 | 16,4 | 14,3 | 28 % |
| LR | 9,6 | 13,4 | 11,37 | 33 % |
| RN | 11,5 | 16,7 | 14,27 | 36 % |
| Reconquête | 4,6 | 6,3 | 5,63 | 30 % |
| Nouvelle Énergie | 9,7 | 16,1 | 12,8 | **50 %** |

**Constat** : le nombre que le joueur voit dès le premier sondage varie déjà, mais uniquement parce
qu'il s'agit d'un bruit de sondage sur SON parti, pas d'une variation de la réalité électorale
sous-jacente (qui reste aujourd'hui identique quelle que soit la graine). Ce n'est donc pas la
« loterie structurelle » que redoute la section 5 du prompt (aucune inversion de hiérarchie n'est
possible tant que la vérité sous-jacente ne bouge pas), mais ce n'est pas non plus le mécanisme que la
section 5 demande : un vrai « petit écart entre graines » doit venir d'une variation **réelle**, pas
seulement affichée. Décision de conception pour la Phase B : introduire un jitter réel, faible et
maîtrisé (proche de 6-12 % d'écart relatif, cohérent avec l'exemple « 15 % → 14,2/15,4/16,0 » de la
section 5) au niveau de la vérité électorale (`initializeElectorate`), tiré par graine ET par
`CandidateProfile` retenu — sans toucher au bruit d'affichage du sondage du joueur, qui reste un
mécanisme distinct et légitime (simuler la marge d'erreur d'un sondage, pas l'incertitude politique
réelle).

## 2. Premier tour — état après campagne complète

| Métrique | Valeur (5 472 campagnes) |
|---|---:|
| Score moyen du leader du premier tour | 19,34 % |
| Écart moyen leader/2e | 5,07 pts |
| Écart-type moyen entre partis (par campagne) | 4,289 |
| Favori dominant (>22 %, avance >5 pts) | 23,7 % des campagnes |

Cohérent avec les corpus des missions précédentes (`ELECTORAL_COHERENCE_FIXES_REPORT.md` :
compression T1 17,8 %, favori dominant ~22,5 % sur 10 008 campagnes ; `FINAL_ELECTORAL_CALIBRATION_REPORT.md` :
favori dominant 22,0-30,1 % selon la population mesurée) — validation croisée qui confirme que ce
nouveau corpus mesure le même phénomène de façon cohérente. Ces chiffres constituent la référence de
non-régression de la section 36 du prompt de mission (§36) : ne pas repasser sous ces niveaux de
dispersion après recalibrage réaliste.

## 3. Fréquence des recompositions (retrait, remplacement, alliance, dissidence)

| Type d'événement | Fréquence (au moins une occurrence sur la campagne) |
|---|---:|
| Retrait (`withdrawal`) | **0,02 %** (1 campagne sur 5 472) |
| Remplacement de candidat (`replacement`) | 9,54 % |
| Alliance (`alliance`) | 79,0 % |
| Dissidence (`dissidence`) | 0,2 % |
| Au moins une recomposition (retrait/remplacement/dissidence/alliance) | 81,18 % |

**Diagnostic** : la mécanique de retrait existe déjà dans le moteur
(`maybeWithdrawAndRally`, `src/game/engine/opponentSimulation.ts`) mais ses conditions de déclenchement
sont si restrictives (`party.stats.polling < 2` ET `actor.legitimacy < 35` ET `decisionIndex >= 18`,
probabilité plafonnée à 8 %/décision) qu'elle ne se produit quasiment jamais dans le corpus mesuré —
un retrait n'arrive qu'à un parti déjà quasi mort, jamais à un parti installé mais en échec de
campagne (le scénario « LR renonce après une campagne en échec » explicitement demandé en section 13
du prompt de mission n'est aujourd'hui pas accessible). Autre défaut structurel confirmé par lecture du
code (pas seulement par la mesure) : quand un retrait se produit, `party.active = false` retire
simplement le parti du dénominateur de `nationalLatentSupport` — ses électeurs sont
**redistribués de façon purement proportionnelle** par le mécanisme de normalisation
(`normalizePercentages`), sans aucune logique de proximité idéologique, de relation ou d'endorsement.
C'est exactement le défaut « ne pas ajouter +5 à la main » que la section 12 du prompt de mission
demande de corriger — sauf qu'ici, c'est encore plus arbitraire qu'un ajout manuel : c'est une
redistribution uniforme au prorata du poids courant de chaque parti restant.

Les alliances, à l'inverse, se produisent très fréquemment (79 %) mais n'ont aujourd'hui qu'un effet
mécanique mineur (`formAlliance` : petit bonus de transférabilité, +12 sur la relation) — aucune
redistribution immédiate de masse électorale, contrairement à ce qu'un accord de campagne réel
impliquerait.

## 4. Alliances actuelles

79 % des campagnes (NPC uniquement) voient au moins une alliance se former via
`chooseStrategy`/`prepare_alliance` → `formAlliance`. Le mécanisme est probabiliste (dépend de la
relation entre partis, du score de compétence en coalition de l'acteur) mais reste peu différencié :
aucune alliance n'est aujourd'hui bloquée ou favorisée par une incohérence/cohérence idéologique
explicite au-delà de la distance idéologique déjà utilisée pour choisir le partenaire
(`bestAlliancePartner`).

## 5. Ce que la Phase B doit corriger précisément

1. Réduire la variance initiale par graine (actuellement 20-50 % d'écart relatif) à une fourchette
   proche de l'objectif qualitatif de la section 5 (6-12 %), tout en introduisant une variation propre
   au `CandidateProfile` choisi — pas juste réduire le bruit existant à zéro.
2. Élargir et enrichir les conditions de déclenchement d'un retrait structurel pour qu'il puisse
   toucher un parti installé en échec de campagne, pas seulement un parti déjà à l'agonie — tout en
   restant rare (section 15 du prompt de mission : ne pas transformer chaque partie en recomposition
   généralisée).
3. Remplacer la redistribution proportionnelle implicite par un vrai moteur `redistributeElectorate`
   opérant au niveau des blocs électoraux (`state.electorate.latentSupport`), avec logique de distance
   idéologique, relation, alliance, endorsement, rejet et abstention.
4. Donner aux alliances un effet de redistribution immédiat et mesurable, pas seulement un bonus de
   transférabilité différé au second tour.

## 6. Non-régression à préserver (référence chiffrée figée avant implémentation)

```
Score moyen du leader T1        : 19,34 %
Écart moyen leader/2e            : 5,07 pts
Favori dominant (T1)             : 23,7 %
Fréquence alliance (NPC)         : 79,0 %
```

Ces quatre chiffres serviront de référence « avant » dans le tableau du rapport final
(`REALITY_GROUNDED_CAMPAIGN_REPORT.md`).
