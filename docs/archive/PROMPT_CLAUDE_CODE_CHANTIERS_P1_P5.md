# PROMPT MAÎTRE — CHANTIERS CIBLÉS P1 + P5

## « Vers l’Élysée » — agence électorale réelle et second tour crédible

Tu interviens comme lead game designer système, ingénieur TypeScript senior, spécialiste des simulations probabilistes, analyste statistique, spécialiste des modèles électoraux et responsable qualité.

Le projet est le jeu politique français **« Vers l’Élysée »**. Les problèmes historiques de répétition, de faux choix et de monde statique ont déjà été largement corrigés. Cette mission ne doit pas rouvrir tout le projet : elle vise exclusivement deux chantiers encore insuffisamment résolus.

1. **P1 — L’agence réelle du joueur sur la progression électorale.**
2. **P5 — L’équilibrage et la crédibilité du second tour.**

Tu dois diagnostiquer, corriger, mesurer, tester et documenter ces deux problèmes de manière autonome.

Ne t’arrête pas à un plan. Modifie réellement le code, lance les simulations, compare avant/après et poursuis jusqu’à une version validée.

Ne pousse rien vers le dépôt distant.

---

# 1. DOCUMENTS À LIRE AVANT TOUTE MODIFICATION

Commence par lire intégralement tous les fichiers disponibles parmi :

- `AUDIT_POST_CORRECTIONS.md`
- `POST_AUDIT_FIXES.md`
- `audit-results/post-fix/COMPARISON.md`
- `audit-results/post-fix/README.md`
- `audit-results/post-fix/summary.json`
- `audit-results/post-fix/variance-decomposition.csv`
- `audit-results/post-fix/second-round-report.csv`
- `audit-results/post-fix/duel-matrix.csv`
- `audit-results/post-fix/counterfactuals.csv`
- `audit-results/post-fix/raw-runs.csv`
- `audit-results/pre-fix-baseline/README.md`
- `V2_DECISIONS.md`
- `V2_CHANGELOG.md`
- les README et documents d’architecture du projet ;
- les scripts de `scripts/audit/` ;
- les scripts de `scripts/audit-post/` ;
- les tests du moteur électoral, du scoring et de l’interface.

Inspecte également l’historique Git récent et les commits locaux consacrés aux corrections post-audit.

Avant toute modification, consigne :

- branche courante ;
- hash du commit ;
- état de `git status` ;
- version de Node et npm ;
- commandes de validation existantes ;
- éventuelles modifications non commitées.

---

# 2. BASELINE À REPRODUIRE

## P1 — progression électorale

Version actuelle après le premier chantier :

- η² parti sur le score du premier tour : environ `45,02 %` ;
- η² agent sur le score du premier tour : environ `5,72 %` ;
- η² parti sur la progression brute : environ `76,10 %` ;
- η² agent sur la progression brute : environ `2,49 %` ;
- η² parti sur la progression normalisée : environ `73,10 %` ;
- η² agent sur la progression normalisée : environ `2,98 %` ;
- η² agent sur la surperformance par rapport à une baseline neutre inter-parties : environ `10,98 %` ;
- changement d’issue à parti + graine identiques, selon l’agent : environ `67,4 %`.

Le problème précis est le suivant :

> La surperformance calculée après des milliers de parties montre que l’agence existe, mais la progression réellement calculée et affichée dans une partie reste encore très fortement déterminée par le parti initial.

La correction précédente a donc amélioré la mesure d’audit plus que l’expérience de jeu directement observable.

## P5 — second tour

Après le premier chantier :

- Horizons : environ `93,2 %` de victoire conditionnellement à une qualification ;
- Nouvelle Énergie : environ `91,0 %` ;
- Renaissance : environ `84,1 %` ;
- LR : environ `82,6 %` ;
- PS : environ `80,0 %` ;
- Écologistes : environ `73,3 %` ;
- LFI : environ `55,5 %` ;
- RN : environ `39,1 %`.

La pénalité de rejet a déjà été rendue concave, mais certains partis centristes restent presque automatiquement vainqueurs une fois au second tour.

Le but n’est pas de forcer tous les duels vers 50/50. Le but est d’éviter qu’un parti gagne presque toujours uniquement parce qu’il occupe une position structurellement centrale ou possède un faible rejet de départ.

---

# 3. PRINCIPES NON NÉGOCIABLES

## 3.1 Préserver les acquis

La mission ne doit pas réintroduire :

- répétitions de titres ou de récits ;
- triptyques génériques prudent/risqué/rassembleur ;
- faux dilemmes ;
- textes clonés ;
- conséquences mécaniquement équivalentes au sein d’un même événement ;
- événements morts ;
- chaînes cassées ;
- non-déterminisme ;
- états invalides ;
- monde adverse statique ;
- idéologie sans conséquences ;
- tests E2E flaky.

## 3.2 Ne pas tricher avec les résultats

Interdictions absolues :

- bonus ou malus codés directement par identifiant de parti pour atteindre une courbe cible ;
- quotas de victoire ;
- résultats prédéfinis ;
- filtrage des simulations défavorables ;
- modification des graines après observation des résultats ;
- suppression d’une métrique gênante ;
- changement des scripts d’audit uniquement pour embellir les chiffres ;
- métrique d’audit présentée comme mécanique de jeu alors qu’elle ne s’applique pas dans une partie réelle ;
- augmentation arbitraire du hasard pour masquer un déséquilibre ;
- homogénéisation de tous les partis.

## 3.3 Préserver les identités politiques

Les partis doivent rester différents en socle de départ, potentiel électoral, rejet, réserves de voix, implantation, crédibilité, mobilisation, cohésion, électorats accessibles, difficulté, capacité de qualification et capacité de rassemblement au second tour.

Un parti difficile doit rester difficile. Un parti central doit conserver un avantage potentiel au second tour, mais cet avantage ne doit pas devenir une garantie presque automatique.

## 3.4 Réalisme éditorial

Ne crée aucune accusation criminelle, sexuelle, financière ou judiciaire précise attribuée à une personnalité réelle.

Les corrections de cette mission doivent être principalement systémiques. Si du contenu est ajouté, utilise des personnages fictifs ou des situations génériques.

---

# 4. MÉTHODE DE TRAVAIL

Travaille en deux branches conceptuelles dans le même dépôt :

1. chantier P1 ;
2. chantier P5.

Pour chaque chantier :

1. reproduis la baseline ;
2. écris des tests qui mettent le défaut en évidence ;
3. analyse la cause racine ;
4. implémente une correction minimale et systémique ;
5. exécute les tests ciblés ;
6. simule à petite échelle ;
7. abandonne les variantes qui améliorent seulement une métrique au détriment du jeu ;
8. exécute la simulation complète ;
9. compare avant/après avec les mêmes graines ;
10. documente les compromis ;
11. crée un commit local atomique.

Aucun push distant.

---

# PHASE 0 — BASELINE ET OUTILLAGE

## 5. Valider l’état initial

Exécute les commandes disponibles correspondant à :

```bash
npm run format:check
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
npm run audit:smoke
npm run audit:game
npm run test:e2e
```

Adapte seulement les noms des scripts si nécessaire.

Archive les résultats avant correction dans :

```text
audit-results/p1-p5-baseline/
```

Inclure au minimum :

- `summary.json`
- `variance-decomposition.csv`
- `second-round-report.csv`
- `duel-matrix.csv`
- `counterfactuals.csv`
- paramètres de simulation ;
- commit ;
- graines ;
- définition des agents ;
- résultats des tests.

## 6. Étendre l’outillage si nécessaire

L’audit doit produire séparément :

### Pour P1

- progression brute ;
- progression normalisée ;
- surperformance vs baseline neutre ;
- progression visible dans une partie ;
- évolution du soutien structurel ;
- évolution du soutien gagné par la campagne ;
- contribution cumulée des décisions ;
- variance expliquée par parti, agent, interaction et graine ;
- divergence contrefactuelle à plusieurs horizons ;
- trajectoires de sondage par agent.

### Pour P5

- qualification ;
- victoire globale ;
- victoire conditionnelle à qualification ;
- matrice de duels ;
- taille d’échantillon de chaque duel ;
- reports par électorat éliminé ;
- abstention ;
- rétention du vote du premier tour ;
- rejet ;
- proximité idéologique ;
- crédibilité ;
- cohérence ;
- alliances ;
- consignes de vote ;
- bruit final ;
- influence de l’agent dans un même duel.

Ne réimplémente pas le moteur dans les scripts d’audit. Utilise le moteur réel.

---

# CHANTIER P1 — AGENCE RÉELLE SUR LA PROGRESSION

# 7. Objectif exact

Le problème ne doit pas être corrigé uniquement dans le score final ou dans un indicateur calculé après plusieurs milliers de campagnes.

Le moteur réel doit faire en sorte que :

> Pour un même parti, une même graine et des événements comparables, une campagne cohérente et bien jouée fasse progresser les intentions de vote de manière sensiblement différente d’une campagne incohérente ou mal jouée.

Le résultat absolu peut rester très lié au parti. La progression acquise pendant la campagne doit dépendre davantage des choix.

# 8. Diagnostic approfondi obligatoire

Inspecte notamment :

- `src/game/engine/electorate.ts`
- `src/game/engine/election.ts`
- `src/game/engine/game.ts`
- `src/game/engine/scoring.ts`
- `src/game/engine/progression.ts`
- `src/game/engine/effectProcessor.ts`
- les statistiques de parti ;
- `hidden.potentialSupport` ;
- les blocs électoraux ;
- les multiplicateurs de crédibilité, popularité et mobilisation ;
- la cohérence idéologique ;
- les déclarations et revirements ;
- la mémoire ;
- les caps, clamps et arrondis ;
- la saturation des stats ;
- les événements différés.

Réponds précisément dans le rapport :

1. Quelle part du vote est structurelle et quelle part est réellement déplaçable par la campagne ?
2. Les effets des choix modifient-ils surtout des statistiques indirectes trop faibles ?
3. Les statistiques positives convergent-elles encore vers les mêmes plages ?
4. Les différents agents font-ils réellement évoluer des variables différentes ?
5. Les variables de campagne sont-elles utilisées plusieurs fois ou presque ignorées ?
6. `potentialSupport` agit-il réellement sur le vote ou uniquement sur la métrique ?
7. La progression est-elle écrasée par le bruit, les adversaires ou le socle initial ?
8. Les effets positifs et négatifs sont-ils asymétriques ?
9. Les choix ont-ils un effet cumulatif, ou leurs effets convergent-ils rapidement ?
10. La cohérence, les contradictions, la crédibilité thématique et les relations produisent-elles un effet électoral visible ?
11. Un joueur peut-il gagner des électeurs dans un bloc précis grâce à plusieurs décisions cohérentes sur un même thème ?
12. Les campagnes d’agents opposés produisent-elles des séries de sondages réellement distinctes ?

# 9. Architecture recommandée pour P1

Ne te contente pas d’ajuster un coefficient.

Évalue une refonte limitée du soutien électoral en trois composantes :

```text
soutien total =
  socle structurel
  + soutien gagné par la campagne
  + chocs temporaires
```

## 9.1 Socle structurel

Il dépend principalement du parti, de son électorat fidèle, de son implantation, de son candidat et du contexte initial. Il doit rester relativement stable.

## 9.2 Soutien gagné par la campagne

Cette composante doit être réellement pilotée par :

- cohérence des décisions ;
- crédibilité thématique ;
- qualité des débats ;
- mobilisation ;
- popularité ;
- traitement des crises ;
- contradictions ;
- alliances ;
- mémoire ;
- positionnement idéologique ;
- adéquation avec les blocs électoraux ;
- effets différés.

Elle doit posséder une marge par parti, des rendements décroissants, une possible régression, une mémoire cumulative, une inertie raisonnable et une capacité de différenciation entre agents.

## 9.3 Chocs temporaires

Ils regroupent scandales, débats, événements viraux, crises, sondages et actualité adverse. Ils doivent pouvoir monter puis se dissiper.

Évite que tous les effets temporaires deviennent permanents.

# 10. Crédibilité thématique et accumulation

Ajoute ou renforce, si l’architecture le permet, une notion de capital de campagne par thème ou bloc :

- économie ;
- services publics ;
- sécurité ;
- écologie ;
- immigration ;
- Europe ;
- société ;
- institutions.

Une décision cohérente sur un thème doit pouvoir augmenter la crédibilité sur ce thème, rendre les futures prises de parole plus efficaces, attirer certains blocs, en éloigner d’autres, créer un coût de revirement et produire une conséquence différée.

Un seul choix ne doit pas déplacer massivement le vote. Une suite cohérente de choix doit produire un effet cumulatif. Une suite contradictoire doit réduire ou annuler ce gain.

# 11. Éviter la convergence des agents

Mesure, par agent, la distribution finale de :

- crédibilité ;
- popularité ;
- mobilisation ;
- rejet ;
- cohérence ;
- notoriété ;
- relations ;
- soutien latent ;
- soutien gagné par campagne ;
- progression.

Si plusieurs agents finissent encore dans les mêmes plages, corrige la cause.

Techniques possibles : rendement décroissant dépendant de la source, effets conditionnels à la cohérence, multiplicateurs thématiques, inertie des électorats, coût cumulatif des contradictions, plafond de progression distinct du plafond structurel, effets différés, interactions entre choix successifs et perte de dynamique après plusieurs décisions incohérentes.

Ne transforme pas chaque choix en bonus de sondage direct.

# 12. Progression affichée au joueur

La progression visible doit être calculable dans une partie unique.

Elle peut distinguer :

- progression brute en points ;
- progression ajustée à la marge atteignable ;
- surperformance estimée par rapport à une trajectoire neutre pré-calibrée.

Une baseline neutre pré-calibrée peut être utilisée en jeu uniquement si elle est générée par un script reproductible, versionnée, documentée, indépendante de la partie en cours, recalculée lorsque le moteur change et utilisée comme repère plutôt que comme bonus caché.

Exemple :

```text
surperformanceDeCampagne =
  progressionNormaliseeReelle
  - progressionNeutreAttendueDuParti
```

Mais cette métrique ne suffit pas à elle seule : le moteur de vote réel doit aussi mieux différencier les campagnes.

# 13. Expériences causales P1

Pour chaque parti et plusieurs graines :

1. amène l’état au même événement ;
2. duplique l’état ;
3. résous des choix différents ;
4. continue avec le même agent ;
5. compare sondage immédiat, +3 décisions, +8 décisions, premier tour, qualification, victoire, progression visible, soutien gagné et blocs électoraux.

Fais aussi des campagnes complètes appariées : même parti, même graine, agents différents.

Ajoute une analyse des courbes de sondage, pas seulement du résultat final.

# 14. Critères d’acceptation P1

## Obligatoire

- η²(agent) sur la progression réellement utilisée ou affichée dans une partie doit dépasser clairement la valeur actuelle d’environ `2,98 %`.
- Cible minimale : `≥ 5 %`.
- Cible souhaitée : `7–15 %`.
- η²(parti) sur cette progression doit descendre nettement sous `73,10 %`.
- Cible souhaitée : `< 65 %`.
- Le taux de changement d’issue apparié ne doit pas descendre sous `67,4 %`.
- L’influence du parti sur le score absolu du premier tour peut rester entre environ `35 % et 55 %`.
- Aucun parti ne doit perdre son identité.
- Les courbes de sondage de deux agents opposés doivent diverger de manière mesurable avant la fin.
- Une campagne cohérente doit pouvoir dépasser une campagne faible du même parti de plusieurs points dans une proportion significative des graines.
- Une décision isolée reste modérée ; les différences se construisent par accumulation.
- Pas de nouvelle option dominante.
- Pas d’inflation généralisée des scores.

Si la cible `≥ 5 %` est impossible sans dégrader le jeu, documente les variantes testées, montre les effets négatifs, conserve la meilleure architecture et ne déclare pas P1 corrigé.

---

# CHANTIER P5 — SECOND TOUR CRÉDIBLE ET NON AUTOMATIQUE

# 15. Objectif exact

Le second tour doit conserver l’importance du rejet, des réserves de voix, de la proximité idéologique, des alliances, des consignes, de la crédibilité, de la campagne et de l’abstention.

Mais aucun parti ne doit gagner presque automatiquement la quasi-totalité de ses seconds tours uniquement en raison d’un profil structurel de faible rejet et de centralité.

# 16. Diagnostic approfondi obligatoire

Pour chaque parti, puis chaque duel, mesure :

- taux de qualification ;
- taux de victoire ;
- victoire conditionnelle à qualification ;
- nombre de duels ;
- score moyen ;
- variance ;
- adversaires rencontrés ;
- reports reçus ;
- reports refusés ;
- abstention ;
- rétention de son propre électorat ;
- rejet propre et adverse ;
- crédibilité ;
- mobilisation ;
- cohérence ;
- proximité idéologique ;
- alliances ;
- consignes ;
- bruit final ;
- agent utilisé.

Réponds notamment :

1. Horizons et Nouvelle Énergie gagnent-ils parce qu’ils affrontent plus souvent certains partis ?
2. Ont-ils une meilleure rétention de leur propre vote ?
3. Reçoivent-ils une part excessive de presque tous les électorats éliminés ?
4. L’abstention est-elle trop faible chez les électeurs éloignés des deux finalistes ?
5. La proximité idéologique est-elle calculée sur des axes trop simplifiés ?
6. Le rejet est-il encore trop important, ou insuffisant pour les partis modérés ?
7. Les alliances et consignes se cumulent-elles trop fortement ?
8. Certains facteurs sont-ils comptés deux fois ?
9. Le candidat central bénéficie-t-il mécaniquement des deux côtés sans coût ?
10. Le choix de l’adversaire au second tour crée-t-il un biais d’échantillon ?
11. Les campagnes de second tour sont-elles réellement simulées ou presque fixées dès le premier tour ?
12. Les décisions du joueur avant le second tour peuvent-elles encore modifier les reports ?

# 17. Modèle recommandé pour les reports de voix

Évalue une refonte du second tour par électorat éliminé.

Pour chaque parti ou bloc éliminé :

```text
électorat éliminé
→ part qui vote finaliste A
→ part qui vote finaliste B
→ part qui s’abstient
```

La somme doit être égale à 100 % de cet électorat.

Utilise un modèle normalisé, par exemple un softmax/logit à trois issues : finaliste A, finaliste B, abstention.

Les utilités peuvent dépendre de :

- distance idéologique ;
- rejet ;
- crédibilité ;
- cohérence ;
- alliance ;
- consigne ;
- relation ;
- proximité programmatique ;
- campagne de second tour ;
- mémoire ;
- fatigue ou démobilisation ;
- bruit contrôlé.

Cette approche est préférable à deux scores indépendants puis normalisés tardivement si le moteur actuel produit des reports excessifs.

# 18. Abstention crédible

L’abstention doit augmenter lorsque les deux finalistes sont éloignés de l’électorat, fortement rejetés, sans consigne claire, incohérents ou démobilisateurs.

Elle doit diminuer lorsqu’une alliance existe, une consigne crédible est donnée, un finaliste est proche idéologiquement, un enjeu de barrage est fort ou le joueur a construit une relation durable.

Prévoir un plancher, un plafond et des rendements décroissants.

# 19. Centralité politique

Un parti central peut recevoir des voix venant de plusieurs directions, mais cela doit avoir des limites.

Ajoute ou vérifie les coûts possibles de la centralité : manque de mobilisation, électorat moins fidèle, contradiction perçue, difficulté à satisfaire plusieurs blocs, abstention des électeurs peu convaincus, rejet lié à l’incarnation ou au bilan, faible enthousiasme et dispersion des reports.

La centralité ne doit pas signifier que tous les électeurs éliminés choisissent automatiquement le candidat le plus proche du centre.

# 20. Rétention du premier tour

Sépare clairement :

- rétention de l’électorat propre ;
- conquête des électorats éliminés.

Un parti modéré peut recevoir de bons reports tout en perdant une partie de son électorat de premier tour s’il est démobilisé ou déçu.

Un parti clivant peut conserver fortement son socle tout en recevant peu de reports.

Teste les deux composantes séparément.

# 21. Campagne entre les deux tours

Si le jeu comporte des décisions de second tour, elles doivent réellement affecter rejet, crédibilité, alliances, consignes, mobilisation, abstention et reports.

Si le jeu n’en comporte pas assez, ajoute un petit ensemble d’événements spécifiques : débat final, ralliement d’un éliminé, refus de consigne, erreur de rassemblement, ouverture programmatique, mobilisation contre l’adversaire, contradiction sur une promesse, choix de Premier ministre ou accord de coalition.

Ne crée pas un mini-jeu trop long. Quelques décisions fortes suffisent.

# 22. Tests de sensibilité P5

Pour chaque duel fréquent :

- même duel, même graine, agents différents ;
- rejet ±5 ;
- crédibilité ±5 ;
- alliance oui/non ;
- consigne oui/non ;
- distance idéologique modifiée ;
- abstention plus forte/faible ;
- cohérence forte/faible.

Mesure différence de score, probabilité de victoire, reports, abstention et rétention.

Le résultat ne doit être ni insensible aux décisions, ni chaotique.

# 23. Critères d’acceptation P5

Pour les partis avec un échantillon suffisant de qualifications :

- aucun taux de victoire conditionnelle ne doit dépasser environ `90 %` sans justification exceptionnelle et robuste ;
- cible souhaitée pour Horizons et Nouvelle Énergie : sous `85–88 %` ;
- aucun duel avec au moins 30 observations ne doit être à `100 % / 0 %` ;
- un même duel doit présenter une variance selon l’agent et la graine ;
- les alliances et consignes doivent modifier les reports ;
- l’abstention doit être non triviale ;
- le rejet doit rester important sans être le seul facteur ;
- le RN ne doit pas être artificiellement renforcé ;
- les partis centristes ne doivent pas être artificiellement affaiblis ;
- aucun coefficient par identifiant de parti ;
- aucune randomisation excessive.

Inspecte qualitativement au moins 5 seconds tours Horizons, 5 Nouvelle Énergie, 5 RN, 5 LFI, 5 PS/LR/Renaissance et plusieurs duels identiques avec agents différents.

---

# PHASE COMMUNE — TESTS ET NON-RÉGRESSION

# 24. Tests unitaires à ajouter

## P1

- séparation socle / soutien gagné / choc ;
- accumulation de décisions cohérentes ;
- coût des contradictions ;
- rendements décroissants ;
- progression négative ;
- progression normalisée ;
- déterminisme ;
- absence de dépassement des bornes ;
- effets thématiques ;
- divergence entre deux politiques de décision.

## P5

- conservation des masses électorales ;
- somme reports A + B + abstention = 100 % ;
- monotonie raisonnable du rejet ;
- augmentation de l’abstention quand les deux finalistes sont éloignés ;
- effet d’une alliance ;
- effet d’une consigne ;
- rétention propre ;
- absence de division par zéro ;
- symétrie lorsque les deux finalistes sont strictement identiques ;
- absence de coefficient spécifique au parti ;
- stabilité avec seed identique.

Utilise des tests de propriété avec `fast-check` si déjà présent.

# 25. Simulations obligatoires

## Itération rapide

- 10 à 20 graines par combinaison ;
- mêmes graines avant/après ;
- au moins les 9 partis ;
- agents réalistes ;
- agents extrêmes uniquement comme borne secondaire.

## Validation finale

- au moins `5 280` parties ;
- mêmes graines que la baseline ;
- 0 erreur ;
- 0 état invalide ;
- davantage de simulations si certains duels restent trop rares.

# 26. Contrôles de non-régression

La version finale doit conserver :

- 0 titre répété ;
- 0 récit répété ;
- 0 faux dilemme intra-événement ;
- unicité narrative élevée ;
- 18/18 événements rares atteignables ;
- déterminisme parfait ;
- 0 erreur de simulation ;
- 0 état invalide ;
- lint vert ;
- typecheck vert ;
- build vert ;
- tests unitaires verts ;
- Playwright sans flaky.

Exécute à la fin :

```bash
npm run format:check
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
npm run audit:smoke
npm run audit:game
npx playwright test --repeat-each=10 --retries=0
```

Adapte les noms si nécessaire.

---

# 27. INTERFACE

Ne surcharge pas l’interface.

Pour P1, rends lisible : progression brute, progression ajustée, dynamique de campagne, éventuelle surperformance et principaux blocs gagnés ou perdus.

Pour P5, rends lisible : principaux reports, abstention, soutien d’alliés, poids du rejet et événements décisifs.

Ne révèle pas toutes les statistiques cachées.

Ne présente jamais une métrique normalisée comme un pourcentage de vote réel.

---

# 28. LIVRABLES

Crée ou mets à jour :

## `P1_P5_FINAL_FIXES.md`

Sections obligatoires :

1. résumé exécutif ;
2. baseline reproduite ;
3. diagnostic P1 ;
4. variantes P1 testées ;
5. correction P1 retenue ;
6. résultats P1 avant/après ;
7. diagnostic P5 ;
8. variantes P5 testées ;
9. correction P5 retenue ;
10. résultats P5 avant/après ;
11. tests ;
12. non-régressions ;
13. compromis ;
14. limites restantes ;
15. verdict final.

## `audit-results/p1-p5-final/`

Inclure :

- `README.md`
- `summary.json`
- `variance-decomposition.csv`
- `counterfactuals.csv`
- `poll-trajectories.csv`
- `second-round-report.csv`
- `duel-matrix.csv`
- `transfer-breakdown.csv`
- `retention-abstention.csv`
- graphiques ;
- paramètres ;
- commit ;
- graines.

## `audit-results/p1-p5-final/COMPARISON.md`

Tableau obligatoire :

| Mesure                                     | Avant | Après | Évolution |             Cible | Verdict |
| ------------------------------------------ | ----: | ----: | --------: | ----------------: | ------- |
| η² parti — 1er tour                        |       |       |           |                   |         |
| η² agent — 1er tour                        |       |       |           |                   |         |
| η² parti — progression réelle              |       |       |           |                   |         |
| η² agent — progression réelle              |       |       |           |              ≥5 % |         |
| Changement d’issue apparié                 |       |       |           |           ≥67,4 % |         |
| Horizons victoire \| qualification         |       |       |           | <85–88 % souhaité |         |
| Nouvelle Énergie victoire \| qualification |       |       |           | <85–88 % souhaité |         |
| RN victoire \| qualification               |       |       |           |         non forcé |         |
| Duels 100/0 avec n≥30                      |       |       |           |                 0 |         |
| Abstention moyenne second tour             |       |       |           |        documentée |         |
| Titres répétés                             |     0 |       |           |                 0 |         |
| Récits répétés                             |     0 |       |           |                 0 |         |
| Erreurs de simulation                      |     0 |       |           |                 0 |         |
| E2E flaky                                  |     0 |       |           |                 0 |         |

# 29. GRAPHIQUES À PRODUIRE

Au minimum :

1. variance expliquée par parti/agent avant-après ;
2. progression réelle par agent ;
3. trajectoires moyennes de sondage par agent ;
4. divergence contrefactuelle par horizon ;
5. qualification et victoire par parti ;
6. victoire conditionnelle à qualification ;
7. matrice des duels ;
8. reports par bloc électoral ;
9. abstention par duel ;
10. effet du rejet ;
11. effet des alliances et consignes ;
12. relation score premier tour / score second tour.

Chaque graphique doit indiquer commit, taille d’échantillon, unité, source et définition exacte de la métrique.

# 30. COMMITS LOCAUX

Crée des commits atomiques, par exemple :

```text
test(p1): capture weak player influence on polling progression
refactor(p1): separate structural and campaign-earned support
feat(p1): add cumulative thematic campaign capital
test(p5): add runoff transfer and abstention invariants
refactor(p5): allocate eliminated electorates through normalized transfers
balance(p5): reduce automatic centrist runoff dominance
docs(audit): add final P1/P5 comparison and methodology
```

Ne pousse rien.

# 31. VERDICT FINAL DANS LE TERMINAL

À la fin, affiche une synthèse structurée :

```text
P1 + P5 — VERDICT FINAL

P1 — Agence sur la progression
Baseline :
Après :
η² parti :
η² agent :
Changement d’issue apparié :
Correction réellement visible dans une partie :
Verdict : CORRIGÉ / LARGEMENT CORRIGÉ / PARTIELLEMENT CORRIGÉ / NON CORRIGÉ

P5 — Second tour
Horizons victoire | qualification :
Nouvelle Énergie victoire | qualification :
RN victoire | qualification :
Duels 100/0 avec n >= 30 :
Abstention :
Sensibilité aux agents :
Verdict : CORRIGÉ / LARGEMENT CORRIGÉ / PARTIELLEMENT CORRIGÉ / NON CORRIGÉ

Non-régressions
Titres répétés :
Récits répétés :
Faux dilemmes :
Événements rares :
Erreurs de simulation :
États invalides :
Tests unitaires :
Playwright :
Build :
Déterminisme :

Commits locaux :
Fichiers principaux modifiés :
Commandes de reproduction :
Limites restantes :
```

Ne déclare pas un chantier corrigé si les chiffres ne le démontrent pas.

# 32. DÉMARRAGE IMMÉDIAT

Commence maintenant par :

1. lire tous les documents ;
2. reproduire la baseline ;
3. créer `P1_P5_FINAL_FIXES.md` avec le plan initial ;
4. écrire les tests reproduisant les défauts P1 et P5 ;
5. diagnostiquer P1 ;
6. implémenter et mesurer P1 ;
7. diagnostiquer P5 ;
8. implémenter et mesurer P5 ;
9. relancer l’audit complet ;
10. valider toutes les non-régressions ;
11. produire les livrables ;
12. ne rien pousser vers le dépôt distant.

Ne demande l’intervention de l’utilisateur que si une information absolument indispensable est absente du dépôt et impossible à déduire.
