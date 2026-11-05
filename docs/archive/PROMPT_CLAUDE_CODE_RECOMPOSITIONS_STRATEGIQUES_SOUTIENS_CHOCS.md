# PROMPT MAÎTRE — PASSE FINALE SUR LES RECOMPOSITIONS STRATÉGIQUES, CHOCS ÉLECTORAUX ET SOUTIENS MAJEURS
## Projet : « Vers l’Élysée »
### Mission post-`REALITY_GROUNDED_CAMPAIGN_REPORT.md`

Tu interviens comme **lead political simulation designer**, **game systems designer**, **analyste électoral**, **narrative systems designer**, **senior TypeScript engineer**, **QA lead**, **statisticien** et **éditeur politique**.

La mission précédente a réussi l’essentiel du passage à une campagne ancrée dans le réel :

- baseline politique datée du 18 avril 2026 ;
- hiérarchie initiale devenue plausible ;
- `CandidateProfile` pour les candidatures réellement incertaines ;
- redistribution des électorats lors d’un retrait ;
- alliances ayant désormais un effet électoral réel ;
- `MajorEndorsement` ;
- personnages pseudonymisés cohérents avec leur contexte politique ;
- suppression des mentions répétées « fictif » dans le flux joueur ;
- 10 080 campagnes post-implémentation ;
- agence du joueur préservée ;
- tests/E2E/build verts.

Cette mission ne doit PAS refaire ces systèmes depuis zéro.

Elle doit traiter les **problèmes résiduels identifiés dans `REALITY_GROUNDED_CAMPAIGN_REPORT.md`**, en particulier :

1. le moteur confond encore trop facilement **retrait par effondrement** et **désistement stratégique** ;
2. les Écologistes n’ont jamais été observés en retrait naturel dans les campagnes testées, alors que des scénarios de coalition / union de la gauche doivent pouvoir émerger sans manipulation artificielle ;
3. un retrait a produit un choc extrême de **45,79 points** et un autre diagnostic a observé un delta agrégé de **+37,1 points en un seul pas** ;
4. le système `MajorEndorsement` ne contient encore **aucun soutien national pseudonymisé** ;
5. le premier bulletin ne précise toujours pas explicitement que les rapports de force sont calibrés au **18 avril 2026** ;
6. `RaceBulletin` et la sidebar n’ont pas été retestés explicitement pendant la précédente mission ;
7. les recompositions doivent devenir plus intelligentes politiquement, pas simplement plus fréquentes.

Principe directeur :

> **Une grande variation dans les sondages doit avoir une cause politique visible et intelligible.**

---

# 1. DOCUMENTS À LIRE INTÉGRALEMENT

Avant toute modification, lire intégralement :

- `REALITY_GROUNDED_CAMPAIGN_REPORT.md`
- `REALITY_GROUNDING_BASELINE.md`
- `docs/POLITICAL_BASELINE_2026-04.md`
- `docs/FICTIONAL_POLITICAL_ARCHETYPES.md`
- `docs/REALITY_GROUNDED_SIMULATION.md` si présent
- `ELECTORAL_COHERENCE_FIXES_REPORT.md`
- `AUDIT_ELECTORAL_COHERENCE.md`
- `FINAL_ELECTORAL_CALIBRATION_REPORT.md` si présent
- `AUDIT_RUNOFF_FINAL_CALIBRATION.md` si présent
- `TARGETED_GAMEPLAY_PASS_REPORT.md`
- `FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md`
- `AUDIT_FUN_REJOUABILITE.md`
- `FUN_IMPROVEMENTS_REPORT.md`
- `PARTY_GAMEPLAY_IDENTITIES.md`
- `V2_CHANGELOG.md`
- `docs/EDITORIAL_POLICY.md`
- `docs/CONTENT_QUALITY_RULES.md`.

Inspecter ensuite directement :

- `src/game/engine/opponentSimulation.ts`
- `src/game/engine/redistribution.ts`
- `src/game/engine/electorate.ts`
- `src/game/engine/polls.ts`
- `src/game/engine/conditions.ts`
- `src/game/data/majorEndorsements.ts`
- `src/game/data/worldFigures.ts`
- `src/game/data/candidateProfiles.ts`
- événements d’alliance/retrait/endgame/partis
- feed d’actualités
- `RaceBulletinScreen`
- sidebar / `MainStats`
- dashboard campagne
- tests de cohérence politique existants.

---

# 2. BASELINE À PRÉSERVER

La dernière mission rapporte notamment :

```text
Retrait naturel :
0,02 % → 22,84 % des campagnes

Alliance PNJ :
~79 % → 76,62 %

Compression T1 :
stable

Favoris dominants :
23,7 % → 24,4 %

Agency :
0,796 → 0,794

Runoff incohérents :
0

Mentions « fictif » dans le flux joueur :
0

Tests :
277/277

E2E :
29/29
```

Et surtout :

```text
Écologistes retirés naturellement :
0 occurrence en 3 000 tentatives × 3 scénarios

Choc de retrait maximal observé :
45,79 pts

Delta national agrégé anormal observé :
+37,1 pts en un pas

Major endorsements nationaux :
0

Date de référence explicite dans le premier bulletin :
non implémentée

RaceBulletin/sidebar :
non retestés explicitement dans la mission précédente
```

Ne sacrifie pas les acquis pour corriger les résidus.

---

# 3. STRUCTURE DE LA MISSION

Deux blocs stricts :

```text
BLOC A — AUDIT CIBLÉ
→ causes racines
→ métriques
→ tests reproductibles
→ rapport intermédiaire
→ gate

BLOC B — CORRECTIONS CONFIRMÉES
→ simulations massives
→ playtests
→ non-régression
→ rapport final
```

Ne modifie aucune règle de production avant le gate.

---

# 4. BLOC A — DISTINGUER DEUX TYPES DE RETRAIT

Le moteur doit distinguer explicitement :

## A. Retrait par effondrement

Le candidat quitte la course parce que :
- score devenu très faible ;
- légitimité effondrée ;
- crise interne ;
- campagne devenue intenable ;
- candidat remplacé ou désavoué.

Ce retrait peut être subi.

## B. Désistement stratégique

Le candidat / parti peut encore avoir un socle réel, mais se retire parce que :
- aucune voie crédible vers le second tour ;
- risque de faire perdre son bloc ;
- accord électoral trouvé ;
- concession programmatique ;
- promesse de gouvernement / circonscriptions / influence politique ;
- pression de ses alliés ;
- dynamique du bloc.

Ce désistement doit être **politique**, pas simplement basé sur `polling < X`.

---

# 5. MODÈLE DE VIABILITÉ ÉLECTORALE

Créer ou auditer une notion générique de :

```ts
electoralViability
```

Elle ne doit pas se réduire au score brut.

Elle peut dépendre de :

- score actuel ;
- position dans le classement ;
- écart au top 2 ;
- jours restants ;
- momentum ;
- potentiel de soutien ;
- capacité d’alliance ;
- crédibilité ;
- rejet ;
- taille du socle électoral ;
- tendance récente ;
- concentration du bloc idéologique ;
- présence d’un candidat proche mieux placé.

Exemple :

```text
Écologistes à 5,5 %
PS à 11 %
LFI à 12 %
→ candidature écologiste non morte
→ mais voie vers le second tour très faible
→ désistement stratégique plausible si accord acceptable
```

À l’inverse :

```text
Écologistes à 7 %
PS 8 %
LFI 8,5 %
→ course ouverte
→ retrait beaucoup moins probable
```

---

# 6. RISQUE DE SPOILER / FRAGMENTATION DU BLOC

Créer une mesure de **bloc fragmentation pressure** ou équivalent.

Question :

> Le maintien de ce candidat réduit-il fortement les chances de qualification de son espace politique ?

Utiliser :
- proximité idéologique ;
- concurrence sur les mêmes blocs électoraux ;
- top 2 ;
- projections ;
- reports plausibles.

Cette pression doit pouvoir favoriser :
- Écologistes → PS/LFI ;
- Renaissance → Horizons ;
- LR → Horizons/NÉ ;
- Reconquête → RN / droite ;
- autre recomposition cohérente.

Ne pas imposer ces alliances comme script.

---

# 7. NÉGOCIATION AVANT DÉSISTEMENT

Un désistement stratégique ne doit pas apparaître comme :

> « X disparaît ».

Créer un processus minimal :

```text
sondages faibles
→ ouverture de négociations
→ accord possible / refus
→ retrait ou maintien
→ consigne / endorsement
→ redistribution
```

Le processus peut tenir sur 1 à 3 événements selon importance.

Il doit pouvoir échouer.

---

# 8. CONDITIONS D’ACCORD

La probabilité / éligibilité d’un accord peut dépendre de :

- distance idéologique ;
- relation entre partis ;
- mémoire des attaques passées ;
- alliances existantes ;
- candidat ;
- exigences programmatiques ;
- crédibilité du partenaire ;
- risque de disparition politique ;
- ambition du dirigeant ;
- proximité du premier tour.

Le joueur doit pouvoir influencer ces variables au fil de sa campagne.

---

# 9. CAS ÉCOLOGISTES — TEST OBLIGATOIRE

Le moteur doit naturellement pouvoir produire les cas suivants :

### Scénario 1 — PS mieux placé, relations correctes
Écologistes négocient puis se retirent au profit du PS.

### Scénario 2 — LFI mieux placé, relation écologique favorable
LFI reçoit une part importante du report.

### Scénario 3 — LFI agressif envers les Écologistes
Le report vers LFI est réduit, même si idéologiquement proche.

### Scénario 4 — gauche extrêmement fragmentée et serrée
Les Écologistes peuvent décider de se maintenir.

L’objectif n’est pas de garantir un retrait.

L’objectif est qu’il puisse apparaître **naturellement** dans un corpus libre.

---

# 10. CAS DROITE / CENTRE — TEST OBLIGATOIRE

Tester naturellement :

- LR faible → négociation Horizons ;
- LR faible → négociation NÉ ;
- Renaissance faible → accord avec Horizons ;
- Reconquête faible → soutien RN ;
- NÉ faible mais en forte progression → maintien possible malgré petit score.

Le moteur doit comprendre qu’un petit score n’implique pas toujours un retrait.

---

# 11. FRÉQUENCE DES DÉSISTEMENTS STRATÉGIQUES

Ne pas fixer arbitrairement une fréquence cible.

Mesurer la fréquence émergente.

Le corpus doit contenir :
- campagnes sans désistement ;
- un désistement ;
- plusieurs recompositions rares ;
- accords avortés ;
- maintien malgré pression.

Si presque toutes les campagnes ont une union majeure : problème.

Si aucune n’en a : problème.

---

# 12. AUDIT DES CHOCS EXTRÊMES

Reproduire et caractériser :

```text
45,79 pts
+37,1 pts en un pas
```

Tracer à chaque étape :

```text
latentSupport par bloc avant
redistribution brute
undecided/abstention
agrégation nationale
DISPERSION_POWER
normalisation finale
bruit du sondage
score affiché
```

Créer un script :

```text
scripts/audit/structural-shock-trace.ts
```

qui peut expliquer exactement d’où vient chaque point.

---

# 13. CONSERVATION DE MASSE

Pour tout retrait / désistement / alliance :

vérifier formellement :

```text
voter mass before
=
voter mass after
+ abstention/undecided delta
```

à epsilon numérique près.

Tests par bloc ET national.

Pas seulement un test final de somme à 100.

---

# 14. INTERACTION AVEC `DISPERSION_POWER`

Le correctif `DISPERSION_POWER = 2` est utile.

Mais vérifier s’il amplifie excessivement les grands transferts.

Harness d’audit uniquement :

```text
1.6
1.8
2.0
2.2
```

sur les mêmes états structurels.

Mesurer :

- choc brut avant power ;
- choc après power ;
- ratio amplification ;
- changement de rang ;
- changement du top2.

Ne modifie pas `DISPERSION_POWER = 2` sans preuve robuste.

---

# 15. PAS DE CAP ARBITRAIRE PAR DÉFAUT

Ne corrige PAS un choc extrême par :

```text
if delta > 10 then delta = 10
```

sauf preuve irréfutable que le moteur exige une borne explicite.

Préférer :
- corriger une double redistribution ;
- corriger une renormalisation répétée ;
- réduire une source d’amplification ;
- distinguer support transférable et support captif ;
- introduire abstention / indécision ;
- diminishing returns politiques.

---

# 16. ÉLECTORAT CAPTIF / TRANSFÉRABLE

Lorsqu’un parti se retire, tout son électorat ne doit pas être également transférable.

Créer éventuellement une décomposition :

```ts
coreLoyalists
transferableVoters
volatileVoters
abstentionProne
```

ou utiliser les blocs existants pour obtenir le même effet.

Exemple :
- une fraction d’électeurs très identitaires peut préférer l’abstention ;
- une fraction peut suivre la consigne ;
- une fraction choisit idéologiquement.

Cela peut réduire les redistributions irréalistes sans cap artificiel.

---

# 17. IMPACT D’UNE CONSIGNE DE VOTE

Séparer :

```text
retrait sans consigne
retrait + soutien explicite
retrait + accord de coalition
```

Les trois ne doivent pas redistribuer de la même façon.

Ordre conceptuel attendu :

```text
accord fort
> soutien explicite
> retrait neutre
```

mais toujours modulé par les électeurs.

---

# 18. SOUTIENS NATIONAUX PSEUDONYMISÉS

Créer un petit catalogue de **figures nationales pseudonymisées**.

Ne pas utiliser des noms réels.

Ne pas écrire « fictif ».

Le personnage doit avoir :
- profil ;
- courant ;
- fonction passée/présente ;
- électorat d’influence ;
- affinités ;
- hostilités ;
- niveau de notoriété ;
- coût potentiel du soutien.

---

# 19. TYPES DE FIGURES NATIONALES

Créer uniquement des archétypes politiquement utiles, par exemple :

- ancien Premier ministre de centre droit ;
- grande figure historique de la droite ;
- ancien ministre social-démocrate ;
- figure intellectuelle de gauche ;
- entrepreneur/libéral connu ;
- figure souverainiste ;
- élu local influent ;
- ancien responsable écologiste.

Ne crée pas 50 personnages.

Commencer par environ 6 à 10 figures très différenciées si le corpus le justifie.

---

# 20. ENDORSEMENT NATIONAL ≠ BONUS UNIVERSEL

Exemple :

> une grande figure libérale soutient NÉ.

Effets plausibles :
- + crédibilité économique ;
- + cadres/libéraux ;
- + présence médiatique ;
- éventuellement - électorat populaire ;
- éventuellement + rejet chez certains blocs.

Même logique pour :
- soutien d’une figure radicale ;
- soutien d’un ancien président analogue ;
- soutien d’un responsable de gauche.

Chaque soutien doit avoir des effets mixtes ou contextualisés.

---

# 21. COHÉRENCE DES SOUTIENS

Réutiliser :

```text
affinityTags
hostilityTags
ideologicalPosition
relations
candidateProfile
```

Un soutien national doit être impossible si politiquement absurde, sauf événement exceptionnel justifié.

Ne pas reposer sur la prose libre.

---

# 22. EFFET DU CANDIDAT SUR LE SOUTIEN

La même figure peut :
- soutenir un candidat d’un parti ;
- refuser l’autre profil du même parti.

Exemple conceptuel :

> une figure libérale de droite peut accepter un profil RN économiquement plus ouvert mais refuser un profil social-étatiste.

Cela doit être possible grâce aux métadonnées.

---

# 23. PAS DE SCANDALES SENSIBLES SUR LES ARCHÉTYPES RECONNAISSABLES

Conserver strictement la politique éditoriale :

- pas de corruption inventée ;
- pas de crimes ;
- pas de sexualité ;
- pas de santé ;
- pas de secrets personnels graves ;

sur des personnages qui correspondent structurellement à des personnalités publiques réelles reconnaissables.

Les soutiens et désaccords politiques sont acceptables dans le cadre pseudonymisé.

---

# 24. PREMIER BULLETIN — DATE DE RÉFÉRENCE

Implémenter enfin l’amélioration UX manquante.

Sur le premier bulletin / premier état de la course :

afficher discrètement :

```text
Rapports de force estimés au 18 avril 2026
```

ou formulation équivalente.

Optionnel :
un tooltip ou lien méthodologique vers la page méthode.

Ne pas afficher les instituts réels dans l’interface principale si cela surcharge.

Le but est simplement de faire comprendre :

> « le monde commence à partir d’une photographie politique datée ».

---

# 25. DISTINGUER BASELINE ET SONDAGE FICTIF

Le joueur doit pouvoir comprendre :

- la baseline est ancrée dans une photographie réelle ;
- le bulletin lui-même reste une estimation fictive bruitée.

Exemple :

```text
Observatoire Hexagone
18 avril 2026

Rapports de force de départ calibrés sur les données publiques disponibles à cette date.
Ce bulletin reste une estimation fictive.
```

Garder cela concis.

---

# 26. RETEST EXPLICITE SIDEBAR

Créer/rejouer un test E2E qui vérifie :

1. avant premier tour ;
2. résultat du premier tour ;
3. entrée entre-deux-tours ;
4. décision entre-deux-tours ;
5. score sidebar ;
6. gouvernement éventuel.

Assertions :
- seuls les finalistes participent au sondage de second tour ;
- total ≈100 ;
- valeur réactualisée ;
- aucun candidat éliminé recrédité.

---

# 27. RETEST EXPLICITE `RaceBulletin`

Vérifier :

### Avant premier tour
autorisé.

### Après premier tour
interdit comme écran multi-candidats.

Tester :
- joueur qualifié ;
- joueur éliminé ;
- gouvernement.

Ajouter test de non-régression si couverture actuelle insuffisante.

---

# 28. BLOC A — RAPPORT INTERMÉDIAIRE

Créer :

```text
AUDIT_STRATEGIC_REALIGNMENTS.md
```

Il doit contenir :

1. retrait effondrement vs stratégique ;
2. viabilité électorale ;
3. fragmentation de bloc ;
4. fréquence des désistements ;
5. cas Écologistes ;
6. cas LR/NÉ/Horizons ;
7. choc 45,79 ;
8. delta +37,1 ;
9. conservation de masse ;
10. interaction `DISPERSION_POWER` ;
11. endorsements nationaux manquants ;
12. UX baseline ;
13. sidebar/RaceBulletin ;
14. recommandations ;
15. P0/P1/P2/P3.

Créer :

```text
audit-results/strategic-realignments/
  baseline/
  withdrawal-types.csv
  strategic-withdrawals.csv
  bloc-fragmentation.csv
  shock-traces.csv
  shock-power-sensitivity.csv
  mass-conservation.csv
  national-endorsement-gaps.csv
  sidebar-regression.csv
  racebulletin-regression.csv
  README.md
```

---

# 29. GATE

Avant toute correction :

```text
BLOC A TERMINÉ — RECOMPOSITIONS STRATÉGIQUES DIAGNOSTIQUÉES — DÉMARRAGE BLOC B
```

Ne franchir le gate qu’après avoir reproduit les comportements.

---

# 30. BLOC B — IMPLÉMENTER UN DÉSISTEMENT STRATÉGIQUE

Créer une mécanique générique distincte du retrait d’effondrement.

Exemple de structure :

```ts
StrategicWithdrawalDecision {
  partyId
  viability
  blocFragmentationPressure
  preferredPartners
  negotiationOutcome
  endorsementStrength
  concessions
  withdrawalReason
}
```

Adapter au code existant.

---

# 31. PAS DE SCRIPT PAR PARTI

Ne pas écrire :

```ts
if party === "ecologistes" then allyWith = "ps"
```

Le système doit faire émerger :
- PS ou LFI ;
- maintien ;
- accord impossible ;

selon l’état.

Même logique à droite/centre.

---

# 32. ÉVÉNEMENTS NARRATIFS DÉDIÉS

Ajouter quelques événements contextuels :

- ouverture des négociations ;
- accord trouvé ;
- accord échoué ;
- retrait stratégique ;
- ralliement ;
- crise du bloc.

Les textes doivent refléter les vraies variables :
- sondages ;
- relation ;
- candidat ;
- accord.

Pas de phrase générique indépendante de l’état.

---

# 33. REDISTRIBUTION POST-ACCORD

Utiliser `redistributeElectorate`.

Ajouter si nécessaire un paramètre :

```text
endorsementStrength
coalitionAgreementStrength
```

pour modifier la propension des électeurs à suivre l’accord.

Ne pas dupliquer le moteur.

---

# 34. CHOCS EXTRÊMES — CORRECTION UNIQUEMENT SI BUG CONFIRMÉ

Si le choc 45,79 / +37,1 vient d’un bug :
corriger.

Si c’est un cas rare mais mathématiquement cohérent :
conserver, mais :

- vérifier lisibilité ;
- vérifier cause politique ;
- ajouter métriques/logs ;
- éventuellement feedback narratif plus fort.

Documenter la décision.

---

# 35. ENDORSEMENTS NATIONAUX

Ajouter un petit set de soutiens nationaux pseudonymisés.

Chaque figure doit être documentée dans :

```text
docs/FICTIONAL_POLITICAL_ARCHETYPES.md
```

avec :
- profil ;
- orientation ;
- rôle ;
- affinités ;
- hostilités ;
- événements compatibles ;
- contenu sensible interdit.

---

# 36. VALIDATION ÉDITORIALE DES ENDORSEMENTS

Étendre les règles de qualité :

- figure sans profil → erreur ;
- endorsement sans compatibilité → erreur ;
- soutien politiquement contradictoire → erreur si pas d’exception explicitement documentée ;
- mention « fictif » dans flux → erreur ;
- analogue reconnaissable + scandale sensible → erreur.

---

# 37. SIMULATIONS MASSIVES POST-CORRECTION

Minimum :

```text
10 000 campagnes
```

Mesurer :

### Retraits
- effondrement ;
- stratégique ;
- total ;
- par parti ;
- par phase.

### Accords
- proposés ;
- réussis ;
- échoués.

### Redistrib
- taille moyenne ;
- p90 ;
- p99 ;
- max.

### Chocs
- >5 pts ;
- >10 ;
- >20 ;
- >30.

### Endorsements
- fréquence ;
- delta moyen ;
- positif/négatif ;
- par bloc.

---

# 38. CRITÈRES SUR LE CAS ÉCOLOGISTES

Post-correction :

- au moins quelques retraits stratégiques écologistes doivent apparaître naturellement dans un corpus massif ;
- mais ils ne doivent pas devenir automatiques ;
- PS et LFI doivent tous deux pouvoir bénéficier selon contexte ;
- un mauvais rapport avec LFI doit réduire le report vers LFI ;
- maintien écologiste doit rester possible.

Ne fixe pas un taux précis à l’avance.

---

# 39. CONTREFACTUELS

Créer au moins :

```text
500 paires
```

pour :

### A
désistement stratégique vs maintien.

### B
accord PS vs accord LFI quand les deux sont plausibles.

### C
endorsement national présent vs absent.

Mesurer :
- score ;
- top2 ;
- qualification ;
- victoire ;
- électorat par bloc.

---

# 40. PLAYTESTS MANUELS OBLIGATOIRES

Jouer :

1. Écologistes → PS naturellement ;
2. Écologistes → LFI naturellement ;
3. Écologistes maintenus ;
4. LR → Horizons ;
5. LR → NÉ ;
6. Renaissance → Horizons ;
7. Reconquête → RN ;
8. accord stratégique échoué ;
9. soutien national à NÉ ;
10. soutien national clivant à un autre parti ;
11. campagne avec choc électoral >10 pts si disponible ;
12. parcours complet premier tour → second tour pour revalider sidebar/RaceBulletin.

---

# 41. NON-RÉGRESSION

Préserver :

- baseline 18/04/2026 ;
- faible jitter initial ;
- CandidateProfile ;
- RN/PS profils ;
- NÉ cohérent ;
- pseudonymisation ;
- 0 mention répétée « fictif » ;
- dispersion T1 ;
- favoris dominants ;
- agency ;
- runoff coherence ;
- sidebar ;
- RaceBulletin ;
- apostrophes ;
- game feel ;
- mobile.

---

# 42. TESTS

Ajouter au minimum :

### Strategic withdrawal
- viable candidate can still remain ;
- weak non-viable candidate can negotiate ;
- bloc fragmentation matters ;
- relation matters ;
- ideological distance matters ;
- failed negotiation possible.

### Redistribution
- mass conservation by bloc ;
- abstention/undecided accounted ;
- endorsement strength matters ;
- no negative support ;
- no NaN.

### Endorsements
- national figure compatibility ;
- mixed effects ;
- candidate-profile compatibility.

### UI
- reference date visible on initial bulletin ;
- RaceBulletin phase-aware ;
- sidebar runoff sync.

---

# 43. RAPPORT FINAL

Créer :

```text
STRATEGIC_REALIGNMENTS_REPORT.md
```

Structure :

1. Résumé exécutif
2. Baseline
3. Retraits par effondrement
4. Désistements stratégiques
5. Viabilité
6. Fragmentation
7. Cas Écologistes
8. Cas droite/centre
9. Négociations
10. Redistribution
11. Chocs extrêmes
12. `DISPERSION_POWER`
13. Endorsements nationaux
14. Cohérence éditoriale
15. UX baseline
16. Sidebar/RaceBulletin
17. Simulations post
18. Contrefactuels
19. Playtests
20. Non-régressions
21. Problèmes ouverts
22. Verdict.

---

# 44. TABLEAU AVANT/APRÈS

| Mesure | Avant | Après | Verdict |
|---|---:|---:|---|
| Retraits effondrement | | | |
| Désistements stratégiques | 0 explicite | | |
| Retraits Écologistes naturels | 0 / 9 000 tentatives ciblées | | |
| Accords réussis | | | |
| Accords échoués | | | |
| Choc moyen retrait | 3,77 pts | | |
| Choc max | 45,79 pts | | |
| Deltas >10 pts | | | |
| Deltas >20 pts | | | |
| Conservation de masse failures | | | |
| Endorsements nationaux | 0 | | |
| Mentions « fictif » | 0 | 0 | |
| Baseline date visible | non | oui | |
| Sidebar sync failures | 0 historique | | |
| RaceBulletin post-R1 | 0 historique | | |
| Agency | 0,794 | | |
| Favoris dominants | 24,4 % | | |
| Tests | 277 | | |
| E2E | 29 | | |

---

# 45. VERDICT TERMINAL

Afficher :

```text
STRATEGIC REALIGNMENTS — VERDICT

RETRAITS
Effondrement :
Stratégique :
Fréquence totale :
Verdict :

ÉCOLOGISTES
Retraits naturels observés :
PS bénéficiaire :
LFI bénéficiaire :
Maintien :
Effet des relations :
Verdict :

DROITE / CENTRE
LR → Horizons :
LR → NÉ :
Renaissance → Horizons :
Reconquête → RN :
Verdict :

NÉGOCIATIONS
Accords proposés :
Réussis :
Échoués :
Concessions :
Verdict :

REDISTRIBUTION
Conservation de masse :
Abstention :
Relation :
Idéologie :
Endorsement :
Verdict :

CHOCS EXTRÊMES
Avant max : 45,79 pts
Après max :
Cause du +37,1 :
Bug confirmé :
Correction :
Verdict :

ENDORSEMENTS NATIONAUX
Nombre :
Profils :
Compatibilité :
Effets mixtes :
Verdict :

BASELINE UX
Mention 18 avril 2026 :
Méthodologie :
Verdict :

SIDEBAR / RACEBULLETIN
Sidebar :
RaceBulletin :
Tests :
Verdict :

NON-RÉGRESSIONS
Baseline :
Dispersion :
Favoris :
Agency :
Second tour :
Pseudonymisation :
Apostrophes :
Game feel :
Mobile :
Tests :
E2E :
Visual :
Build :

Commits locaux :
Problèmes ouverts :
```

---

# 46. RÈGLE FINALE

Le but n’est PAS de multiplier artificiellement les retraits.

Le but est de permettre deux histoires différentes :

> **« Je me retire parce que ma campagne s’effondre. »**

et :

> **« Je peux encore exister, mais je choisis de me retirer parce qu’une coalition est stratégiquement plus rationnelle. »**

Les recompositions doivent être rares, importantes et compréhensibles.

Un changement de 10 points peut être parfaitement acceptable s’il correspond à la disparition d’une candidature importante et à une redistribution cohérente.

Un changement de 30 points sans cause claire est un défaut.

Le joueur doit pouvoir regarder sa courbe de sondage et comprendre :

> **« C’est ici que l’élection a changé. »**

Travaille de manière autonome jusqu’au rapport final et au verdict terminal.

Ne demande pas de validation intermédiaire.

Ne pousse rien vers le dépôt distant.
