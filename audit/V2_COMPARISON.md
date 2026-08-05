# Comparatif V1 → V2

Généré le 6 août 2026 à partir de `audit/metrics.json` (V1, commit `96c0ae2`) et `audit/v2-metrics.json` (V2, commit `9acb5a0`, en cours de finalisation). Les chiffres V2 proviennent de simulations à grande échelle : 6 300 campagnes sur les neuf partis existants (9 partis × 7 stratégies, dont 5 réellement jouables), 2 000 campagnes de partis personnalisés et 900 campagnes de dynamique de contenu, soit 9 200 campagnes automatisées au total contre 7 900 pour le référentiel V1.

Aucun calcul n'a été ajusté pour améliorer artificiellement un résultat. Les écarts restants sont indiqués comme tels.

## Contenu et répétition

| Mesure                                             | V1             | V2            | Objectif                         | Statut             |
| -------------------------------------------------- | -------------- | ------------- | -------------------------------- | ------------------ |
| Événements                                         | 182            | 232           | ≥ 200 événements distincts       | Atteint            |
| Choix                                              | 533            | 633           | —                                | —                  |
| Textes de choix uniques                            | 72,23 %        | 100 %         | ≥ 95 %                           | Atteint            |
| Récits d'issue uniques                             | 17,73 %        | 100 %         | ≥ 70 %                           | Dépassé            |
| Titres d'issue uniques                             | 0,75 %         | 99,84 %       | —                                | Amélioration nette |
| Événements au triptyque prudent/risqué/rassembleur | 160/182 (88 %) | 2/232 (0,9 %) | Suppression du système répétitif | Atteint            |
| Jeux de conséquences réutilisés                    | 35             | 1             | —                                | Amélioration nette |
| Choix utilisant un jeu de conséquences réutilisé   | 471            | 2             | —                                | Amélioration nette |

Le triptyque « prudent/risqué/rassembleur » subsiste sur 2 événements sur 232 (moins de 1 %) ; les étiquettes de stratégie (`PRUDENT`, `RISQUÉ`, `RASSEMBLEUR`, etc.) restent utilisées comme balises secondaires pour le moteur et l'audit, jamais comme libellé principal du choix (voir décision D-003).

## Différenciation des partis et usage réel de l'idéologie

| Mesure                                                         | V1     | V2                                 | Statut                                             |
| -------------------------------------------------------------- | ------ | ---------------------------------- | -------------------------------------------------- |
| Événements propres à un parti                                  | 54     | 110                                | Doublé                                             |
| Événements conditionnés par l'idéologie ou une déclaration     | 0      | 41 (+ seuil qualité ≥ 30 appliqué) | Objectif « idéologie réellement utilisée » atteint |
| Part moyenne d'événements parti/idéologie par campagne         | 5,97 % | 25,94 %                            | Amélioration nette                                 |
| Événements avec déclaration idéologique de fond                | 0      | 58                                 | Système activé                                     |
| Campagnes avec mouvement idéologique mesurable (900 campagnes) | 0      | 900 (100 %)                        | Système actif, pas seulement déclaratif            |
| Mouvement idéologique maximal observé                          | —      | 36,5 points                        | —                                                  |

L'idéologie n'est plus un champ décoratif : elle conditionne l'éligibilité de 41 événements, et 100 % des campagnes échantillonnées montrent un mouvement idéologique mesurable pendant la partie.

## Mémoire des acteurs, alliances, remplacements

| Mesure                                                   | V1               | V2               | Statut             |
| -------------------------------------------------------- | ---------------- | ---------------- | ------------------ |
| Campagnes avec mémoire d'acteur non vide (900 campagnes) | 0                | 796 (88,4 %)     | Système actif      |
| Campagnes avec alliance du joueur                        | 170/900 (18,9 %) | 398/900 (44,2 %) | Amélioration nette |
| Alliances simultanées maximales                          | 1                | 3                | Amélioration nette |
| Remplacements de candidats adverses observés             | 0                | 115              | Système actif      |

## Chaînes narratives

| Mesure                              | V1  | V2  |
| ----------------------------------- | --- | --- |
| Chaînes (racines)                   | 11  | 21  |
| Liaisons de chaîne                  | 11  | 39  |
| Profondeur maximale                 | 1   | 2   |
| Événements participant à une chaîne | —   | 37  |

Note méthodologique : le détecteur de `scripts/audit/content-audit.ts` cherchait initialement un champ `enqueueEventIds` hérité de la V1 et ne voyait donc aucune chaîne V2, alors que le mécanisme réellement utilisé par les données V2 est `outcome.followUps` (14 fichiers d'événements l'utilisent). Le script a été corrigé dans cette session pour additionner les deux mécanismes ; les chiffres ci-dessus reflètent la version corrigée. La cible « au moins dix chaînes, dont une de profondeur trois » est atteinte en nombre de chaînes (21 ≥ 10) mais la profondeur maximale mesurée (2) reste sous la cible de profondeur 3 documentée dans `V2_IMPLEMENTATION_PLAN.md` — écart restant, non corrigé dans cette session faute de certitude sur la meilleure chaîne à approfondir sans ajouter de contenu non retenu.

## Entités réelles et fictives

| Mesure                                                                             | V1                                               | V2                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Entités classifiées / enregistrées                                                 | 76 (liste manuelle dupliquée)                    | 141 (registre typé `gameContent.entities`)               |
| Part réelle parmi les entités du monde (pays, institutions, médias, organisations) | 30,3 % (catégorie mélangée avec les personnages) | 100 % (99/99)                                            |
| Personnages secondaires fictifs                                                    | 41 (mélangés aux entités du monde)               | 42 (catégorie séparée, réservée aux scénarios sensibles) |

La V1 mélangeait personnages fictifs et entités du monde dans un même calcul, aboutissant à seulement 30,3 % de réel apparent. La V2 sépare les deux catégories (décision D-006) : les entités du monde (pays, institutions, médias, organisations) sont réelles à 100 %, et la fiction reste cantonnée aux personnages secondaires nécessaires aux scénarios sensibles, conformément à l'objectif de réalisme français.

## Agence du joueur : influence du parti et de la stratégie

| Mesure                                                                  | V1 (5 400 campagnes) | V2 (6 300 campagnes) | Objectif                                    |
| ----------------------------------------------------------------------- | -------------------- | -------------------- | ------------------------------------------- |
| η² du parti sur le score du premier tour                                | 73,39 %              | 40,22 %              | Réduire sans supprimer l'avantage de départ |
| η² de la stratégie sur le score du premier tour                         | 3,00 %               | 14,18 %              | Augmenter significativement                 |
| Écart moyen de score de premier tour entre stratégies (seeds appariées) | 2,89 points          | 4,32 points          | Augmenter                                   |
| Groupes appariés où la stratégie change qualification ou victoire       | 311/900 (34,6 %)     | 696/900 (77,3 %)     | Augmenter                                   |

C'est l'amélioration la plus nette du chantier V2 : le parti de départ explique désormais 40 % de la variance du score au lieu de 73 %, et changer uniquement de stratégie modifie l'issue (qualification ou victoire) dans plus des trois quarts des paires de campagnes comparées, contre un tiers en V1.

### Équilibre des partis (limites connues)

À l'échelle des 6 300 campagnes, aucune des 5 stratégies réellement jouables (`random`, `coherent`, `prudent`, `risky`, `collective`) ne produit un résultat à 0 % ou supérieur à 90 % pour un parti donné. Les extrêmes restants concernent :

- la stratégie de diagnostic `greedy` (optimisation d'utilité parfaite, non disponible au joueur, utilisée comme borne haute d'audit) : 93-94 % de victoires pour renaissance, horizons et lr une fois qualifiés ;
- reconquête, le parti le plus outsider par construction (socle et crédibilité les plus bas des neuf partis), qui ne dépasse 12 % de victoires qu'en jouant `coherent` ou `greedy` ; les stratégies génériques lui réussissent rarement (1 % ou moins), ce qui correspond à l'objectif produit « des défaites intéressantes » plutôt qu'à un bug à corriger.

## Badges

| Mesure                                                   | V1                                                                                                                | V2             |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------- |
| Succès totaux                                            | 58                                                                                                                | 58             |
| Succès structurellement impossibles (bornes vérifiables) | 7 (`kingmaker`, `secret_ending`, `historic_score`, `perfect_campaign`, `coalition`, `solvent`, `million_members`) | 0              |
| Succès observés dans la simulation des partis existants  | 48/58 (82,8 %)                                                                                                    | 54/58 (93,1 %) |

Les 7 succès impossibles de la V1 sont corrigés depuis la Phase G (critères typés réellement évalués par le moteur, décision D-014). Deux régressions supplémentaires ont été trouvées et corrigées dans cette session : `million_members` demandait un gain de 150 000 adhérents alors que seuls des événements de parti personnalisé portent un effet positif sur les adhérents (~67 000 de plafond théorique) ; `viral` demandait un identifiant d'issue contenant « viral » qu'aucune issue ne portait réellement. Les 4 succès restants non observés dans cet audit (`new_party`, `random_destiny`, `million_members`, `viral`) sont chacun liés à un mode ou un événement rare non exercé par le harnais des 9 partis existants (mode personnalisé, mode aléatoire, événement rare) plutôt qu'à une impossibilité structurelle.

## Tests, couverture, performance

| Mesure                                                                     | V1                         | V2                                                        |
| -------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------- |
| Tests unitaires (Vitest)                                                   | 38 passés                  | 76 passés                                                 |
| Couverture — instructions                                                  | —                          | 78,3 %                                                    |
| Couverture — branches                                                      | —                          | 66,42 %                                                   |
| Couverture — fonctions                                                     | —                          | 74,62 %                                                   |
| Couverture — lignes                                                        | 79,38 %                    | 82,04 %                                                   |
| Suite E2E (Playwright, avec la politique de nouvelles tentatives de la CI) | 18 réussis / 24, 6 ignorés | 17 réussis, 1 flaky passé au second essai, 6 ignorés / 24 |
| `npm audit --audit-level=high`                                             | 0 vulnérabilité            | 0 vulnérabilité                                           |

Deux fixtures E2E de déterminisme électoral (`e2e-ps-1`, `e2e-rn-0`) ne produisaient plus l'issue attendue après le recalibrage de la Phase F et ont été remplacées par des graines revérifiées avec le moteur (voir `V2_CHANGELOG.md`, Phase H). La couverture par instructions/branches/fonctions n'était pas mesurée dans le référentiel V1 disponible ; seule la couverture par lignes est directement comparable.

## Écarts restants (honnêtes)

- Profondeur maximale de chaîne mesurée à 2 contre une cible de 3 documentée dans `V2_IMPLEMENTATION_PLAN.md`.
- Quelques liens de pied de page et boutons d'en-tête restent sous la cible tactile de 44 px (voir Phase H).
- Aucun lecteur d'écran réel n'a été exécuté dans cet environnement ; seuls les signaux structurels dont ils dépendent ont été vérifiés.
- `reconquête` reste un parti à faible taux de victoire hors stratégie cohérente ; accepté comme différenciation intentionnelle plutôt que corrigé, conformément à l'objectif « ne pas uniformiser les partis ».
