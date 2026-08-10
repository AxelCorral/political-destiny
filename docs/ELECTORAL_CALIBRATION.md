# Calibration électorale

Garde-fou durable pour les constantes qui façonnent la distribution des résultats électoraux
(premier tour et second tour). Objectif : que toute future modification de ces constantes passe par
le même protocole que celui qui a produit les valeurs actuelles — audit avant correctif, corpus
massif (≥10 000 campagnes), avant/après documenté — plutôt que des ajustements ad hoc pour « faire
plus serré » ou « faire plus net ».

## Constantes actuelles

| Constante | Fichier | Valeur | Rôle |
|---|---|---|---|
| `DISPERSION_POWER` | `src/game/engine/electorate.ts` | 2 | Exposant appliqué aux totaux agrégés par parti avant normalisation du premier tour ; contrôle l'écart entre partis forts et faibles. |
| `RUNOFF_SHARE_DAMPING` | `src/game/engine/election.ts` | 0.62 | Amortit la **part transférée** des électorats éliminés vers chaque finaliste au second tour. |
| `RETAINED_GAP_DAMPING` | `src/game/engine/election.ts` | 0.75 | Amortit l'**écart entre les bases conservées** de chaque finaliste (leur propre score de premier tour × rétention) — préserve la masse totale, ne force jamais une égalité. |
| `baseSupport` (par parti) | `src/game/data/parties.ts` | voir fichier | Poids structurel de départ ; documenté par parti avec `politicalBaselineVersion`/`calibrationDate`/`sourceRange` quand ajusté depuis une fourchette réelle. |

## Principes de calibration (ne pas régresser)

1. **La distribution vient des mécanismes, jamais d'un objectif chiffré.** Aucun code ne doit forcer
   un 50/50, plafonner un écart, ou traiter un identifiant de parti comme cas spécial dans
   `simulateFirstRound`/`simulateSecondRound`.
2. **Un 50,0/50,0 exact reste rare**, pas la norme. Une distribution saine mélange duels serrés
   (48-52), victoires nettes (45-55, 40-60) et, rarement, de larges victoires (>60/40).
3. **Un favori dominant du premier tour (score >22 %, avance >5 pts) ne gagne jamais
   automatiquement le second tour** — une marge de défaite non négligeable doit rester mesurable sur
   un grand corpus (cf. `AUDIT_RUNOFF_FINAL_CALIBRATION.md` §13, corrigé en calibration finale
   2026-08-10).
4. **Les décisions d'entre-deux-tours doivent pouvoir changer l'issue**, sans que ce soit garanti à
   chaque fois — cf. tests d'agence dans `src/game/engine/__tests__/election.test.ts`.
5. **`baseSupport` ne réplique jamais un sondage figé.** Les ajustements vers une fourchette réelle
   (recherche web datée, par famille politique et non par candidat) restent modestes et documentés ;
   le jeu n'est pas un simulateur de sondage en direct.

## Protocole pour toute future modification

1. Auditer avant de corriger : corpus ≥10 000 campagnes via le moteur réel (jamais une
   réimplémentation), matrice de duels, décomposition des scores.
2. Isoler la variable testée (comparaisons contrefactuelles appariées à bruit identique) plutôt que
   de multiplier les runs complets à chaque hypothèse.
3. Documenter la valeur choisie dans le commentaire du code source **et** dans ce tableau, avec le
   fichier d'audit correspondant.
4. Rejouer les tests de non-régression (`src/game/engine/__tests__/election.test.ts`,
   `src/game/data/__tests__/qualityValidation.test.ts`), le corpus massif, et les playtests manuels
   avant/après.
5. Ne jamais viser à rendre tous les seconds tours serrés, ni à produire artificiellement des
   victoires larges — le suspense doit émerger de l'état de campagne, jamais d'un compresseur de
   score.

## Historique

- **2026-08-10 — calibration finale second tour.** Diagnostic (`AUDIT_RUNOFF_FINAL_CALIBRATION.md`)
  puis correctif (`FINAL_ELECTORAL_CALIBRATION_REPORT.md`) : ajout de `RETAINED_GAP_DAMPING` (0.75),
  ajustement modeste de `baseSupport` (RN 12.5→15, Écologistes 6.5→5), ajout de la règle de
  validation bloquante `party_not_opponent`. `DISPERSION_POWER` confirmé robuste, non modifié.
- **2026-08-10 (antérieur) — audit crédibilité électorale.** Introduction de `DISPERSION_POWER=2`
  (`AUDIT_ELECTORAL_COHERENCE.md`, `ELECTORAL_COHERENCE_FIXES_REPORT.md`), avant la mission de
  calibration finale ci-dessus.
