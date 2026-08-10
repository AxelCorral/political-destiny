# FINAL_ELECTORAL_CALIBRATION_REPORT — Calibration finale électorale et second tour

Rapport final de `PROMPT_CLAUDE_CODE_CALIBRATION_FINALE_ELECTORALE_SECOND_TOUR.md`, BLOC B. Fait
suite à `AUDIT_RUNOFF_FINAL_CALIBRATION.md` (BLOC A, diagnostic, aucun paramètre modifié) après
franchissement explicite du gate. Aucun push vers le dépôt distant n'a été effectué.

## 1. Résumé exécutif

Le diagnostic BLOC A a infirmé l'hypothèse de départ du prompt (`RUNOFF_SHARE_DAMPING = 0,62`
comprimant artificiellement vers 50/50) et identifié le problème inverse : la part **conservée** de
chaque finaliste au second tour (son propre score de premier tour × rétention) n'était jamais
amortie, ce qui laissait passer presque intact — et mécaniquement élargi par `DISPERSION_POWER = 2`
de la mission précédente — l'écart de premier tour vers le second tour. Conséquence mesurée sur
15 567 seconds tours : marge moyenne 11,9 points, 54 % des duels au-delà de 10 points, un favori
dominant du duel (score >22 %, avance >5 pts) gagnant le second tour dans 97,7 % des cas.

BLOC B introduit un correctif ciblé et unique : `RETAINED_GAP_DAMPING = 0,75`, qui amortit l'écart
entre les deux bases conservées (sans jamais toucher leur somme, sans plafond arbitraire, sans
égalité forcée), calibré empiriquement sur 5 040 reconstructions. Sur un nouveau corpus de 15 801
seconds tours : marge moyenne 9,9 points (-2,0), duels au-delà de 10 points 44,2 % (-9,8 pts),
favori dominant gagnant 93,5 % du temps (-4,2 pts, soit un taux de défaite du favori presque triplé,
de 2,3 % à 6,5 %). `DISPERSION_POWER` n'a pas été modifié (confirmé robuste en BLOC A). Deux
corrections secondaires ont été appliquées : un ajustement modeste et documenté des `baseSupport`
(RN 12,5→15, Écologistes 6,5→5) vers les fourchettes réelles de juillet 2026, et l'ajout d'une règle
de validation bloquante automatisant le contrôle `party_not_opponent`, jusqu'ici manuel.

Aucune régression détectée sur l'agence entre-deux-tours, la variance parti/agent, la cohérence
narrative du contenu de second tour, ou les suites de tests (245 tests unitaires verts, 29 tests E2E
verts, build et lint verts).

## 2. Rappel du diagnostic BLOC A

Voir `AUDIT_RUNOFF_FINAL_CALIBRATION.md` pour l'analyse complète (18 sections). Points clés
repris ici : `DISPERSION_POWER = 2` robuste (testé 1,6–2,4, gradient continu) et non remis en cause ;
cause racine du problème de marge identifiée dans la part conservée non amortie ; `party_not_opponent`
fonctionnellement correct (0 événement incohérent sur 13 événements de second tour spécifiques à un
parti, 10 référençant un tiers) mais non protégé par une règle automatique ; rapports de force
initiaux RN/Écologistes nettement écartés des fourchettes réelles de juillet 2026.

## 3. Corrections appliquées (exhaustif)

1. **`RETAINED_GAP_DAMPING = 0,75`** (`src/game/engine/election.ts`) — nouvelle fonction
   `dampRetainedGap`, amortit l'écart entre les totaux conservés des deux finalistes avant l'ajout
   des reports transférés.
2. **`baseSupport` RN 12,5→15, Écologistes 6,5→5** (`src/game/data/parties.ts`) — documenté en
   commentaire (`politicalBaselineVersion`, `calibrationDate`, `sourceRange`), voir
   `REAL_WORLD_CALIBRATION.md`.
3. **Règle de validation bloquante `party_not_opponent`** (`src/game/data/qualityValidation.ts`) —
   tout événement de second tour propre à un parti qui référence mécaniquement un tiers (effet
   `alliance`/`party_relation`) doit désormais porter une condition `party_not_opponent`, sinon
   `validateContentQuality` échoue.
4. **`docs/ELECTORAL_CALIBRATION.md`** (nouveau) — garde-fou durable documentant les constantes de
   calibration, les principes à ne pas régresser, et le protocole pour toute future modification.
5. Aucun changement à `DISPERSION_POWER`, `RUNOFF_SHARE_DAMPING`, ni à la logique de premier tour.
6. Aucun hardcoding par parti, aucun plafond arbitraire d'écart, aucune manipulation post-hoc du
   résultat, aucun forçage de 50/50 — vérifié par relecture du diff et par les tests d'invariants
   ajoutés (§7).

## 4. `RETAINED_GAP_DAMPING` — méthode et calibration

Options A–E du prompt évaluées : l'option retenue (équivalent d'un damping plus léger, spécifique à
la part conservée, distinct du damping des reports) correspond le mieux à l'intention du prompt —
amortir sans supprimer la structure. Calibration empirique
(`scripts/audit/retained-gap-damping-search.ts`, 5 040 reconstructions, candidats
1,0/0,95/0,9/0,85/0,8/0,75/0,7) :

| `RETAINED_GAP_DAMPING` | Marge moyenne | Marge médiane | % >10 pts | % >20 pts |
|---|---|---|---|---|
| 1,0 (non amorti) | 9,75 | 9,22 | 45,4 | 5,4 |
| 0,9 | 9,24 | 8,76 | 42,6 | 3,3 |
| 0,8 | 8,73 | 8,3 | 39,1 | 1,6 |
| **0,75 (retenu)** | **8,48** | **8,1** | **37,4** | **1,0** |
| 0,7 | 8,24 | 7,92 | 35,5 | 0,6 |

0,75 réduit fortement la fréquence des marges >20 pts (5,4 %→1,0 %, conforme à « très rarement ») et
notablement celle des marges >10 pts (45,4 %→37,4 %), tout en laissant quasi inchangée la fréquence
des duels serrés <4 pts (20,5 %→21,9 % — pas d'égalités forcées). Reste structurellement moins
agressif que le damping des reports (1 − 0,75 = 25 % de l'écart absorbé contre 1 − 0,62 = 38 % côté
reports), conformément à l'intention : une voix conservée est plus « sûre » qu'une voix transférée.

## 5. Recalibration des rapports de force initiaux

Ajustement modeste (RN +2,5 pts, Écologistes −1,5 pt de `baseSupport`) vers les fourchettes réelles
de juillet 2026 (`REAL_WORLD_CALIBRATION.md`) sans y coller exactement — le jeu reste un scénario
fictif, pas un simulateur de sondage en direct. Documenté par parti avec date de calibration et
fourchette source. Effet secondaire mesuré : le corpus post-correctif compte 15 801 seconds tours
contre 15 567 avant (population de campagnes légèrement différente, cohérent avec un déplacement
modeste des probabilités de qualification).

## 6. Règle de validation `party_not_opponent`

Ajoutée à `validateContentQuality` (`src/game/data/qualityValidation.ts`) : pour tout événement dont
`eligibility` contient `{kind:"qualified", value:true}` et `eligibleParties` est défini, si un choix
référence un tiers via un effet `alliance`/`party_relation`, l'événement doit porter une condition
`party_not_opponent` couvrant ce tiers. Réutilise la logique déjà éprouvée dans
`scripts/audit/runoff-coherence-audit.ts`. Test de non-régression ajouté
(`src/game/data/__tests__/qualityValidation.test.ts`) reproduisant le bug (échec sans la condition)
puis démontrant le correctif (succès avec la condition). `npm run data:validate` confirme 0 erreur
sur le contenu de production (278 événements).

## 7. Tests ajoutés

`src/game/engine/__tests__/election.test.ts` (+9 tests, `src/game/data/__tests__/qualityValidation.test.ts`
+1 test) :

- Le second tour ne contient jamais que les deux finalistes (jamais un tiers éliminé).
- La distribution des marges n'est pas dégénérée (au moins deux valeurs distinctes, pas de 50/50
  systématique) sur un échantillon de campagnes réelles.
- Comportement d'égalité : à score exactement égal, un vainqueur est désigné de façon déterministe
  (`ranking`, ordre alphabétique de l'identifiant).
- `dampRetainedGap` : conserve la masse totale, préserve l'ordre et le signe de l'écart, ne l'annule
  jamais ni ne le dépasse, ne perturbe pas un écart déjà nul.
- Agence entre-deux-tours : sur 20 fourches réelles (contenu de production), une politique de
  décision différente au même point de fourche change le score du second tour dans une fraction
  mesurable des cas (jamais 0, jamais garanti à 100 %).
- `party_not_opponent` obligatoire pour un événement runoff référençant mécaniquement un tiers.

Total : 245 tests unitaires verts (46 fichiers), contre un seuil de non-régression de 236+.

## 8. Corpus massif avant/après — méthodologie

Avant (BLOC A) : `runoff-final-calibration-corpus.ts`, `RUNOFF_SEEDS_PER_COMBO=280`, 20 160
campagnes tentées, 15 567 seconds tours atteints, 41,5 min.

Après (BLOC B) : même script, mêmes paramètres, rejoué avec les correctifs en place — 20 160
campagnes tentées, 15 801 seconds tours atteints, 44,9 min. Les fichiers CSV de sortie ont été
régénérés en place (voir note de cycle de vie des données,
`audit-results/runoff-final-calibration/README.md`) ; les valeurs « avant » proviennent de la prose
de `AUDIT_RUNOFF_FINAL_CALIBRATION.md`.

## 9. Tableau avant/après

| Métrique | Avant (BLOC A) | Après (BLOC B) |
|---|---|---|
| Marge de second tour — moyenne | 11,89 pts | 9,87 pts |
| Marge de second tour — médiane | non disponible¹ | 8,80 pts |
| Marge <0,5 pt | non disponible¹ | 3,08 % |
| Marge <1 pt | non disponible¹ | 5,56 % |
| Marge <2 pts | 8,4 % | 11,38 % |
| Marge >5 pts | non disponible¹ | 69,86 % |
| Marge >10 pts | 54 % | 44,19 % |
| 50,0/50,0 affiché (égalité exacte) | 0,39 % | 0,68 % |
| Choix entre-deux-tours change le vainqueur | 4,1 % (n=520) | 3,8 % (n=200)² |
| Contribution moyenne du damping à la marge | 2,77 pts | 2,05 pts |
| Favori dominant (T1 >22 %, avance >5 pts) gagne le second tour | 97,7 % | 93,5 % |
| Comeback (finaliste mené au T1, victorieux au T2) | non disponible¹ | 9,1 % |
| Compression du premier tour (T1) | 17,8 %³ | non retesté⁴ |
| Favori dominant au premier tour | 22,5 % (population totale)³ | 30,1 % (parmi les seconds tours)⁵ |
| η² parti — score premier tour | 0,4244 | 0,4065 |
| η² agent/stratégie — score premier tour | 0,2591 | 0,2684 |
| η² parti — score final | 0,3172 | 0,3136 |
| η² agent/stratégie — score final | 0,3356 | 0,3383 |
| Événements runoff incohérents (`party_not_opponent`) | 0 / 13 | 0 / 13 |
| Validation `party_not_opponent` | manuelle uniquement | règle bloquante + test de non-régression |
| Tests unitaires verts | 236+ (seuil) | 245 |
| Tests E2E verts | 29+ (seuil) | 29 (chromium), 17 skip (mobile, doublons par design) |

¹ Fichier source régénéré en place par le rerun BLOC B ; non conservé sous forme de CSV séparé,
non cité en toutes lettres dans la prose BLOC A.
² Échantillon réduit (200 contre 520) pour tenir le budget temps de cette session ; même ordre de
grandeur, aucune régression de l'agence.
³ Chiffres de la mission précédente (`ELECTORAL_COHERENCE_FIXES_REPORT.md`), non retestés en BLOC A
sauf robustesse de `DISPERSION_POWER` (stable).
⁴ `DISPERSION_POWER` inchangé ; la recalibration des `baseSupport` RN/Écologistes affecte en théorie
légèrement la compression T1, non revérifié dans cette session — recommandé pour un futur audit
(§20).
⁵ Dénominateur différent (uniquement les campagnes ayant atteint le second tour, pas la population
totale de campagnes) — pas directement comparable au chiffre ³, présenté à titre indicatif.

## 10. Distribution des marges — analyse après correctif

Profil qualitatif désormais plus proche de la cible de la section 24 du prompt : 11,4 % de duels
serrés (<2 pts), 29,9 % de victoires claires, 58,7 % de victoires larges — la classe « large » reste
majoritaire (un second tour reste structurellement plus tranché qu'un sondage bruité, ce qui est
attendu vu l'écart de premier tour souvent déjà substantiel), mais sa composante extrême (>20 pts)
est désormais rare par construction du damping (§4). Aucune tentative de forcer artificiellement plus
de duels serrés au-delà de ce que permet le mécanisme.

## 11. Favoris dominants — analyse après correctif

`P(victoire au second tour | favori dominant du duel)` = 93,5 % (n = 4 753), contre 97,7 % avant —
le taux de défaite d'un favori dominant est passé de 2,3 % à 6,5 %, presque triplé, sans pour autant
transformer un favori net en résultat incertain (93,5 % reste un net avantage, cohérent avec la
réalité électorale). `P(victoire | écart <1 pt au premier tour)` = 54,6 % (n = 1 475), proche d'un
tirage équilibré — comportement préservé.

## 12. Duels serrés et égalités

108 égalités exactes (50,0/50,0 affiché) sur 15 801 (0,68 %) — reste rare, légèrement au-dessus du
0,39 % pré-correctif (attendu : la compression accrue du damping conservé rapproche mécaniquement
davantage de duels du seuil, sans jamais forcer une égalité — `dampRetainedGap` ne produit une
égalité stricte que si l'écart d'entrée l'était déjà, propriété vérifiée par test unitaire, §7). Le
mécanisme de départage (`ranking`, tri par score puis ordre alphabétique de l'identifiant) reste
déterministe et testé.

## 13. Agence entre-deux-tours — non-régression

Rejoué à échelle réduite (200 fourches contre 520 en BLOC A, pour tenir le budget temps) :
vainqueur changé 3,8 % (contre 4,1 %), delta de score moyen 0,86 (contre 0,88). Aucune régression —
le correctif du damping conservé, qui n'agit que sur la part conservée du score, ne touche pas au
mécanisme de report qui porte l'essentiel de l'agence entre-deux-tours.

## 14. `DISPERSION_POWER` — non remis en cause

Non modifié dans cette mission. Le diagnostic de robustesse du BLOC A (1,6 à 2,4, gradient continu,
aucun effet de seuil) reste valide : c'est une propriété structurelle de la transformation de
puissance, indépendante des valeurs de `baseSupport` recalibrées en §5. Non rejoué à l'identique dans
cette session par choix de priorisation (le prompt ciblait explicitement le second tour) ; recommandé
en non-régression future si `baseSupport` est de nouveau ajusté (§20).

## 15. Calibration réelle — statut

`REAL_WORLD_CALIBRATION.md` conservé tel quel (recherche datée du 10/08/2026, fourchettes par
famille politique). Ajustement appliqué (§5) : modeste, documenté, sans réplique intégrale de l'écart
réel (le jeu reste un scénario fictif, jamais un simulateur de sondage en direct — rappelé
explicitement dans `docs/ELECTORAL_CALIBRATION.md`).

## 16. Qualité du contenu runoff — statut

0 événement incohérent confirmé après correctifs (13 événements de second tour spécifiques à un
parti, 10 référençant un tiers, `runoff-coherence-audit.ts` rejoué). Le contrôle est désormais
automatisé et bloquant (§6) ; l'audit exhaustif des dimensions plus fines (tiers déjà hostile,
alliance déjà active, endorsement contradictoire) reste hors périmètre de cette mission, signalé en
§20.

## 17. UX runoff — statut

Inchangé depuis le BLOC A (§16 de `AUDIT_RUNOFF_FINAL_CALIBRATION.md`) : finalistes toujours
identifiés par nom et emblème, scores toujours sommés à 100, sidebar synchronisée, aucune confusion
sondage/résultat officiel trouvée. L'amélioration mineure identifiée (expliciter un 50,0/50,0 affiché)
reste non appliquée — fréquence trop faible (0,68 % après correctif) pour justifier une modification
UI au regard du principe « corrections UI minimales uniquement ».

## 18. Playtests manuels (8 scénarios requis)

Générés via `scripts/audit/runoff-final-calibration-playtests.ts` (rejoue des campagnes complètes
avec le moteur réel jusqu'à trouver une occurrence du profil recherché ; aucun scripting du résultat).
Détail complet : `audit-results/runoff-final-calibration/playtests/pt1..pt8-*.md`.

1. **Duel serré LR vs Horizons** — trouvé en 212 tentatives : Horizons 49,7 % / LR 50,3 % (0,6 pt),
   LR gagne malgré un déficit de premier tour de 0,7 pt — comportement cohérent avec un écart de
   premier tour proche de zéro.
2. **RN contre la gauche** — trouvé immédiatement (PS vs RN dans le champ des finalistes).
3. **Centre contre la gauche** — trouvé immédiatement (LFI qualifiée face à un parti du centre).
4. **Favori dominant qui gagne** — Renaissance, trouvé en 3 tentatives.
5. **Favori dominant qui perd** — RN à 26,5 % au premier tour (avance de 12,7 pts sur son dauphin
   immédiat), battu 49,1/50,9 par Nouvelle Énergie après qu'Horizons a explicitement donné consigne
   pour Nouvelle Énergie — trouvé en 42 tentatives. Sa présence même dans cet échantillon (contre une
   quasi-impossibilité avant correctif, 2,3 % de probabilité) confirme le correctif.
6. **Comeback entre les deux tours** — Écologistes, trouvé en 2 tentatives.
7. **Duel avec alliance majeure** — Écologistes avec alliance active au moment du second tour,
   trouvé en 2 tentatives.
8. **Outsider qualifié** — Nouvelle Énergie qualifiée pour le second tour, trouvé en 8 tentatives.

Aucun scénario n'a nécessité plus de quelques dizaines de tentatives sauf le cas 5 (rare par
construction), confirmant qualitativement que la diversité de résultats requise par la section 24 du
prompt (duels serrés, victoires nettes, comebacks, favoris confirmés et battus, coalitions
décisives, outsiders qualifiés) émerge naturellement du moteur.

## 19. Non-régressions vérifiées

- `npx tsc --noEmit` : 0 erreur.
- `npm run lint` : 0 erreur (3 avertissements pré-existants dans des scripts d'audit, non liés à
  cette mission).
- `npm run data:validate` : validation structurelle et éditoriale réussie (278 événements, 9 partis).
- `npx vitest run` : 245/245 tests verts (46 fichiers), contre un seuil de 236+.
- `npx playwright test` : 29/29 tests verts (projet chromium ; 17 skip mobile par design), contre un
  seuil de 29+. Deux échecs transitoires observés lors d'une exécution à charge système élevée
  (flakiness de rendu de police/animation sous parallélisme, confirmée pré-existante et indépendante
  de cette mission par ré-exécution isolée immédiatement verte) — non retenus comme régression.
- `npm run build` : build de production réussi (Next.js 16, Turbopack).
- Suite de régression visuelle : captures de référence régénérées intentionnellement (les nombres
  affichés — sondages, scores — changent legitimement avec la recalibration) ; une graine e2e figée
  (`always-first-defeat-lfi-0`) a basculé de défaite à victoire sous le nouveau calibrage et a été
  remplacée par une graine vérifiée stable (`always-first-defeat-lfi-2`), de même qu'une graine
  équivalente dans `finalScreenTone.test.tsx`.
- Apostrophes, synchronisation sidebar, `party_not_opponent` : 0 problème (hérité du BLOC A, non
  retesté séparément car aucun code UI/texte modifié dans cette mission).

## 20. Problèmes encore ouverts

1. Compression du premier tour non retestée après le déplacement modeste de `baseSupport` (RN/Éco) —
   probabilité faible d'effet significatif (le déplacement est petit et redistribue surtout entre
   partis moyens), mais non confirmé par un corpus dédié (§9, note ⁴).
2. Qualité narrative des événements runoff au-delà de `party_not_opponent` (tiers déjà hostile,
   alliance déjà active, endorsement contradictoire) — non auditée exhaustivement, signalée dès le
   BLOC A comme chantier distinct.
3. Amélioration UX mineure (expliciter un 50,0/50,0 affiché) — non appliquée, fréquence jugée trop
   faible pour prioriser une modification d'interface.
4. Agence entre-deux-tours revalidée à échelle réduite (200 contre 520 fourches) pour tenir le
   budget temps de cette session — même ordre de grandeur observé, mais un futur audit pourrait
   reprendre l'échelle complète.

## 21. Verdict final

```
═══════════════════════════════════════════════════════════════════
VERDICT FINAL — CALIBRATION ÉLECTORALE ET SECOND TOUR
═══════════════════════════════════════════════════════════════════

PREMIER TOUR
  DISPERSION_POWER=2 non modifié, confirmé robuste (BLOC A, 1,6–2,4).
  baseSupport RN 12,5→15, Écologistes 6,5→5 (ajustement modeste documenté).
  Compression T1 non retestée après ce déplacement (voir problèmes ouverts).

SECOND TOUR
  Marge moyenne  : 11,89 → 9,87 pts
  Marge >10 pts  : 54,0 % → 44,2 %
  Favori dominant gagne : 97,7 % → 93,5 % (défaite du favori quasi triplée)
  50/50 exact affiché   : 0,39 % → 0,68 % (reste rare)
  Aucune égalité forcée, aucun plafond arbitraire, aucun hardcoding par parti.

RUNOFF DAMPING
  RUNOFF_SHARE_DAMPING=0,62 (reports) : inchangé.
  RETAINED_GAP_DAMPING=0,75 (base conservée) : nouveau, calibré sur 5 040
  reconstructions (scripts/audit/retained-gap-damping-search.ts).

REPORTS DE VOIX
  Mécanisme de transfert (runoffAppeal, alliances, endorsements) inchangé.
  Contribution moyenne du damping à la marge : 2,77 → 2,05 pts.

AGENCE ENTRE-DEUX-TOURS
  Vainqueur changé par un choix différent : 4,1 % → 3,8 % (n réduit).
  Aucune régression détectée ; tests unitaires d'agence ajoutés.

CALIBRATION RÉELLE
  REAL_WORLD_CALIBRATION.md conservé ; ajustement baseSupport modeste et
  documenté (politicalBaselineVersion/calibrationDate/sourceRange).
  Le jeu reste un scénario fictif, jamais un simulateur de sondage en direct.

DISPERSION_POWER
  Non modifié. Robustesse confirmée en BLOC A, non retestée en BLOC B
  (aucun changement du code de premier tour).

CONTENT QUALITY
  party_not_opponent : 0/13 événements incohérents, désormais protégé par
  une règle de validation bloquante (validateContentQuality) + test de
  non-régression (reproduit le bug, puis le corrige).

NON-RÉGRESSIONS
  tsc : 0 erreur | lint : 0 erreur | data:validate : OK
  vitest : 245/245 (seuil 236+) | playwright : 29/29 (seuil 29+)
  build : OK | visual regression : régénérée intentionnellement (calibrage)

Commits locaux : aucun commit créé dans cette session (changements non
commités, non poussés — conformément à la consigne « ne pousse rien vers
le dépôt distant »).

PROBLÈMES ENCORE OUVERTS
  1. Compression T1 non revalidée après le déplacement de baseSupport.
  2. Qualité narrative runoff au-delà de party_not_opponent — non auditée.
  3. UX 50,0/50,0 affiché — amélioration mineure non appliquée.
  4. Agence entre-deux-tours revalidée à échelle réduite (200 vs 520).

RÈGLE FINALE (§33 du prompt) — respectée : aucun second tour n'a été
forcé vers la parité, aucune victoire large n'a été produite
artificiellement. Le moteur laisse émerger duels serrés, victoires
nettes, comebacks, rejets décisifs, coalitions décisives, favoris
confirmés et favoris battus — illustré par les 8 playtests manuels
(§18), obtenus par rejeu réel, jamais par scripting du résultat.
═══════════════════════════════════════════════════════════════════
```
