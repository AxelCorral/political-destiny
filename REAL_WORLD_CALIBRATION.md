# REAL_WORLD_CALIBRATION — comparaison externe des rapports de force initiaux

Document produit pour `AUDIT_RUNOFF_FINAL_CALIBRATION.md` §9/§12-13
(PROMPT_CLAUDE_CODE_CALIBRATION_FINALE_ELECTORALE_SECOND_TOUR.md). Compare la hiérarchie
structurelle des 9 partis jouables de « Vers l'Élysée » à des fourchettes construites à partir de
sondages français récents et publics, pour distinguer une **bonne dispersion mathématique** (déjà
établie par la mission précédente) d'une **bonne calibration politique** (objet de ce document).

## Sources

- OpinionWay, intentions de vote pour la présidentielle 2027, publication datée par la recherche du
  10 août 2026 (sondage réalisé début-mi juillet 2026, plusieurs hypothèses de candidatures
  testées) — [opinion-way.com](https://www.opinion-way.com/fr/publications/les-intentions-de-vote-a-lelection-presidentielle-de-2027-2026-23706/).
- Elabe, « Les Français et l'élection présidentielle 2027 » — [elabe.fr](https://elabe.fr/presidentielle-2027-iv3/) / [elabe.fr (vague précédente)](https://elabe.fr/presidentielle-2027-iv2/).
- Liste de sondages sur l'élection présidentielle française de 2027, Wikipédia (agrégat de plusieurs
  instituts, sondages du 7 au 10 juillet 2026, dernière vague avant la date de cette recherche) —
  [fr.wikipedia.org](https://fr.wikipedia.org/wiki/Liste_de_sondages_sur_l%27%C3%A9lection_pr%C3%A9sidentielle_fran%C3%A7aise_de_2027).
- Ifop, « Les intentions de vote dans la perspective de la prochaine élection présidentielle » —
  [ifop.com](https://www.ifop.com/en/article/voting-intentions-for-the-next-presidential-election).

## Date de la recherche et limite méthodologique

Recherche effectuée le 10 août 2026. La page Wikipédia elle-même avertit : « les sondages conduits
un an avant le scrutin se sont révélés peu conformes aux résultats finaux » depuis 1995. Le champ
de candidats 2027 n'est pas définitivement arrêté (plusieurs scénarios testés selon la présence ou
non de tel ou tel candidat, notamment côté « camp présidentiel » et gauche non-LFI). Les chiffres
ci-dessous sont donc traités comme des **fourchettes indicatives à une date donnée**, jamais comme
une vérité à répliquer.

## Fourchettes par bloc (premier tour, hypothèses combinées, sondages du 7-12 juillet 2026)

| Bloc réel | Personnalité testée | Fourchette | Équivalent fictif le plus proche dans le jeu |
|---|---|---:|---|
| RN | Marine Le Pen | 34–37 % | RN |
| Horizons | Édouard Philippe | 16–19 % | Horizons |
| LFI | Jean-Luc Mélenchon | 13–16 % | LFI |
| Renaissance / camp présidentiel | Gabriel Attal (très variable selon scénario) | 7–18 % | Renaissance |
| PS / gauche non-LFI | Raphaël Glucksmann | 8–12 % | PS |
| LR | Bruno Retailleau | 7–9 % | LR |
| Écologistes | Marine Tondelier | 2–5 % | Écologistes |
| Reconquête | Éric Zemmour | 2,5–4 % | Reconquête |
| — | — | — | Nouvelle Énergie (aucun équivalent réel — parti explicitement fictif, cf. D-006) |

Le champ le plus incertain est le pôle central/présidentiel : selon que Hollande, Ruffin ou Villepin
sont testés dans le même scénario, Renaissance/Attal varie de 7 à 18 points — la fourchette large
reflète une incertitude réelle du champ politique, pas une imprécision de cette recherche.

## Comparaison au jeu (post-correctif DISPERSION_POWER, corpus de 10 008 campagnes)

| Parti | `baseSupport` (données) | Score initial moyen (jeu) | Score moyen au résultat T1 simulé | Fourchette réelle | Statut |
|---|---:|---:|---:|---:|---|
| RN | 12,5 | 15,47 % | 22,65 % | 34–37 % | **nettement bas** |
| Horizons | 4,5 | 13,09 % | 19,50 % | 16–19 % | plausible |
| LFI | 13 | 11,77 % | 18,61 % | 13–16 % | plausible (bas au tout départ, dans la fourchette au résultat) |
| Renaissance | 14 | 12,87 % | 18,43 % | 7–18 % | plausible (fourchette réelle très large) |
| PS | 4,5 | 12,31 % | 20,21 % | 8–12 % | un peu haut au résultat T1 |
| LR | 6,5 | 11,00 % | 17,18 % | 7–9 % | un peu haut au résultat T1 |
| Écologistes | 6,5 | 9,97 % | 17,07 % | 2–5 % | **nettement haut** |
| Reconquête | 5 | 4,12 % | 8,83 % | 2,5–4 % | plausible au départ, un peu haut au résultat |
| Nouvelle Énergie | 4,5 | 12,29 % | 17,92 % | — | impossible à conclure (fictif) |

## Lecture

Deux écarts nets, dans des sens opposés :

1. **RN nettement sous-pondéré.** Dans le paysage réel de juillet 2026, RN domine largement (34–37
   %, souvent le double du deuxième). Dans le jeu, RN démarre à peine devant les autres partis
   (15,47 % contre 9,97–13,09 % pour le reste du peloton) et ne devient dominant qu'à l'issue de la
   campagne (22,65 % en moyenne au résultat, avec un maximum observé de 37,5 % sur 10 008
   campagnes — donc la fourchette réelle RESTE atteignable, juste rarement dès le départ).
2. **Écologistes nettement sur-pondérés.** Le score initial moyen du jeu (9,97 %) dépasse déjà le
   haut de la fourchette réelle (5 %) ; le résultat T1 moyen (17,07 %) la dépasse largement.

Les autres partis (Horizons, LFI, Renaissance, Reconquête) restent dans un ordre de grandeur
défendable, avec des écarts explicables par l'incertitude propre du sondage lui-même (fourchettes
réelles de plusieurs points, scénarios multiples).

## Conclusion — bonne dispersion mathématique ≠ bonne calibration politique

La mission précédente a corrigé un vrai défaut structurel (la dispersion mathématique était plate,
quelle que soit la hiérarchie voulue). Cette comparaison externe montre que la **hiérarchie de
départ** elle-même (indépendamment de la dispersion) ne reflète pas fidèlement le rapport de force
réel de juillet 2026 : RN devrait être identifiable comme le favori net dès le début, Écologistes
comme une force plus modeste. Ce n'est PAS une régression de la mission précédente (le problème
préexistait, simplement masqué par la compression générale qui empêchait n'importe quel parti de
sortir du lot) — c'est une dette de calibration distincte, déjà nommée par ce prompt comme
« question encore ouverte » plutôt que comme un défaut nouveau.

**Recommandation** (développée dans `AUDIT_RUNOFF_FINAL_CALIBRATION.md` §12 et appliquée en BLOC B
si confirmée) : un ajustement **modeste et documenté** des `baseSupport` structurels — resserrer
l'écart RN vers le haut et Écologistes vers le bas — sans reproduire l'écart réel de ~30 points (ce
qui detruirait la jouabilité et l'agence pour 8 partis sur 9, et transformerait le jeu en simulateur
de sondage quotidien, explicitement proscrit par la section 25 du prompt). Le jeu doit rester une
fiction politique alternative avec des candidats inventés, pas une réplique d'un sondage daté.
