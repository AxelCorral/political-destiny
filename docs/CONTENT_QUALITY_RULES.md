# Règles de qualité du contenu V2

Le validateur `src/game/data/qualityValidation.ts` ne modifie jamais les données. Il est exécuté en mode bloquant par `validateGameContent` dès que la bibliothèque déclare `contentVersion: 2`. Une bibliothèque V1 peut donc être migrée par étapes sans rendre le jeu inutilisable ; elle ne pourra pas être promue en V2 tant que ces règles échouent.

## Seuils bloquants

| Mesure                                             |             Seuil V2 | Justification                                                                                                         |
| -------------------------------------------------- | -------------------: | --------------------------------------------------------------------------------------------------------------------- |
| Événements au triptyque prudent/risqué/rassembleur |        moins de 10 % | Le ton ne doit plus remplacer la décision.                                                                            |
| Textes de choix uniques                            |        au moins 95 % | Les actions doivent appartenir à leur contexte.                                                                       |
| Récits d’issue uniques                             |        au moins 70 % | Deux décisions différentes doivent raconter des suites différentes.                                                   |
| Choix reconnus comme concrets                      |        au moins 90 % | L’heuristique exige au moins quatre mots et un verbe d’action contextualisable. Une revue humaine complète la mesure. |
| Réutilisation d’un titre d’issue                   |       au plus 5 fois | Les titres récurrents effacent la mémoire de campagne.                                                                |
| Réutilisation exacte d’un récit                    |       au plus 2 fois | Une répétition ne reste admise que pour une formulation volontairement systémique.                                    |
| Réutilisation exacte d’un ensemble de choix        |          1 événement | Un événement ne peut pas reprendre intégralement les décisions d’un autre.                                            |
| Cooldown d’un événement répétable sans limite      | au moins 4 décisions | Une répétition rapprochée exige une limite ou une justification narrative explicite.                                  |

## Erreurs structurelles

La validation échoue aussi dans les cas suivants :

- deux choix d’un même événement possèdent le même vecteur complet de conséquences ;
- aucune phase n’a un poids positif, ou la borne minimale dépasse la borne maximale ;
- une suite, une incompatibilité ou une étape de chaîne pointe vers un événement absent ;
- le délai maximal d’une chaîne est inférieur à son délai minimal ;
- un événement de catégorie `party` n’a ni parti ni famille idéologique cible ;
- un événement dit spécifique cible en réalité tous les partis ;
- une entité référencée manque au registre ;
- une personnalité réelle apparaît comme sujet d’un événement déclaré sensible ou interdit ;
- un succès V2 n’a aucun critère typé, référence un parti ou une fin absente, ou dépasse une borne absolue du moteur ;
- un événement répétable n’a ni maximum d’apparitions ni cooldown suffisant.

## Avertissements

Un type d’effet pris en charge par le moteur mais absent de toute issue est signalé. Le rapport final doit justifier tout avertissement conservé : effet exclusivement systémique, contenu rare volontaire ou dette restante.

## Limites de l’heuristique

La présence d’un verbe ne suffit pas à garantir un bon choix. Le validateur détecte les faux choix évidents, les doublons et les incohérences mesurables ; la revue narrative vérifie encore la spécificité au contexte, l’intérêt stratégique, la cohérence idéologique et la crédibilité des conséquences.
