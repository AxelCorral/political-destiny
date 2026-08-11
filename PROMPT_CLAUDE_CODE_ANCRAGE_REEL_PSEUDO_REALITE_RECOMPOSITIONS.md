# PROMPT MAÎTRE — ANCRAGE RÉEL DU MONDE POLITIQUE, CANDIDATS PSEUDONYMISÉS ET CHOCS ÉLECTORAUX STRUCTURELS
## Projet : « Vers l’Élysée »
### Mission autonome post-`ELECTORAL_COHERENCE_FIXES_REPORT.md`

Tu interviens comme **lead game systems designer**, **political simulation designer**, **analyste électoral**, **narrative systems designer**, **senior TypeScript engineer**, **QA lead**, **éditeur politique** et **responsable de cohérence du monde**.

L’objectif de cette mission est de faire franchir au jeu une étape majeure :

> **Le début d’une campagne doit ressembler au paysage politique français réel correspondant à la date de départ du jeu. Ensuite, la campagne peut diverger fortement, mais uniquement parce que quelque chose de compréhensible s’est produit : choix du candidat, retrait, alliance, primaire, soutien majeur, crise, campagne réussie ou effondrement.**

Le jeu ne doit plus générer dès J−365 un paysage électoral arbitraire où neuf partis sont artificiellement placés dans la même zone de sondage.

Le hasard reste important, mais :

> **le hasard doit transformer l’Histoire ; il ne doit pas remplacer le contexte de départ.**

---

# 0. PRINCIPES ÉDITORIAUX — À LIRE AVANT TOUT

## 0.1 Partis réels, personnages nommés fictifs, réalité politique reconnaissable

Les partis politiques peuvent rester réels :

- LFI
- PS
- Écologistes
- Renaissance
- Horizons
- LR
- RN
- Reconquête
- Nouvelle Énergie

Les personnages politiques nommés dans le gameplay doivent, sauf exception explicitement factuelle déjà prévue par la politique éditoriale du projet, utiliser des **noms inventés**.

Cependant :

> **un nom inventé ne signifie PAS un personnage politiquement aléatoire.**

Chaque personnage doit rester cohérent avec :
- le parti qu’il représente ;
- le type de personnalité réelle qu’il transpose ;
- sa fonction publique ;
- sa trajectoire ;
- son courant idéologique ;
- son électorat ;
- son image publique ;
- ses rapports plausibles avec les autres familles politiques.

Exemple conceptuel :

- si le président argentin de la période simulée appartient dans la réalité à une droite libertarienne / radicalement pro-marché, son analogue fictionnel ne doit pas être généré comme admirateur naturel d’un programme anticapitaliste français ;
- s’il prend position dans le jeu, cette position doit être compatible avec son orientation politique publique réelle, sauf événement exceptionnel explicitement justifié.

L’objectif est une **pseudo-réalité cohérente**, pas une collection de PNJ aléatoires.

---

## 0.2 Ne jamais écrire « personnage fictif » dans les événements

Supprimer dans le texte visible au joueur les formulations du type :

- « le cadre fictif Théo Dupont »
- « la ministre fictive »
- « le dirigeant fictif »
- « ce personnage fictif »
- tout badge `FICTIF` ou mention équivalente répétée dans les cartes.

Le joueur n’a pas besoin qu’on casse l’immersion à chaque événement.

Conserver en revanche :

1. les métadonnées internes permettant de savoir qu’un personnage est fictionnel ;
2. un **disclaimer global discret**, sur l’accueil / règles / mentions, expliquant une seule fois que :
   - les personnages et candidatures sont romancés/pseudonymisés ;
   - le jeu s’inspire d’un contexte politique réel ;
   - il ne constitue ni une prédiction ni une représentation factuelle des événements futurs.

Ne pas répéter ce disclaimer dans le flux normal de jeu.

---

## 0.3 Pseudonymisation ≠ liberté de rendre un analogue absurde

Un personnage analogue à une personnalité réelle peut conserver des éléments structurels publics utiles à la simulation :

- fonction ;
- ancrage territorial ;
- famille idéologique ;
- expérience ;
- génération ;
- profil socio-politique ;
- ligne économique ;
- style de campagne ;
- rapports connus entre familles politiques.

Exemple particulièrement important :

### Nouvelle Énergie

Le candidat / dirigeant analogue ne doit pas devenir arbitrairement :
- un grand aristocrate ;
- un ancien haut fonctionnaire de l’ENA ;
- un syndicaliste révolutionnaire ;
- un ancien ministre socialiste ;

si cela détruit l’identité réelle ayant servi de référence.

Conserver le profil structurel correspondant :
- élu local ;
- maire de Cannes comme ancrage politique public de référence ;
- droite libérale / réformatrice ;
- profil d’exécutif local et entrepreneurial ;
- identité distincte de LR traditionnel et du bloc central.

Le nom est inventé.
L’architecture politique du personnage reste cohérente.

---

## 0.4 Cas des analogues extrêmement reconnaissables

Un personnage pseudonymisé peut rester reconnaissable comme **archétype politique**, mais ne lui attribuer aucun élément sensible fictif qui pourrait être interprété comme une accusation visant la personne réelle ayant servi de référence.

Interdictions éditoriales :

- crimes inventés ;
- corruption inventée ;
- violences inventées ;
- affaires sexuelles inventées ;
- addictions inventées ;
- diagnostics médicaux inventés ;
- secrets familiaux inventés ;
- enrichissement illégal inventé ;
- propos discriminatoires inventés attribués à un analogue évident ;
- toute autre faute grave personnelle créée uniquement pour faire du drame.

Pour les scandales et intrigues sensibles :
- utiliser des personnages secondaires entièrement fictionnels ;
- ou des problèmes politiques/institutionnels non diffamatoires.

---

## 0.5 Les personnalités étrangères suivent la même règle

Le jeu peut afficher :

> « Mateo Álvarez, président argentin, salue votre projet de dérégulation. »

si `Mateo Álvarez` est un nom fictif cohérent avec le profil politique réel de la présidence argentine de la période simulée.

Le texte ne doit pas afficher :

> « Mateo Álvarez, président argentin fictif… »

L’information de fiction reste interne.

Créer une couche de données permettant de définir :

```ts
worldFigureProfile = {
  id,
  displayName,
  country,
  office,
  fictional: true,
  realWorldReferencePeriod,
  ideology,
  economicAxis,
  socialAxis,
  foreignPolicyAxis,
  affinityTags,
  hostilityTags,
  allowedNarrativeRoles,
  sensitiveContentPolicy
}
```

ou architecture équivalente.

Ne pas coder la compatibilité idéologique dans le texte libre.

---

# 1. COHÉRENCE TEMPORELLE : LA DATE DE DÉPART EST LA SOURCE DE VÉRITÉ

Le jeu commence actuellement autour du :

```text
18 avril 2026
```

pour un premier tour prévu le :

```text
18 avril 2027
```

Donc la baseline politique doit correspondre au **18 avril 2026**, pas arbitrairement à la date réelle d’exécution du code.

C’est fondamental.

Si le jeu conserve cette date :

> rechercher et utiliser l’état des rapports de force disponible autour de mars-avril 2026.

Ne pas injecter dans l’écran daté « 18 avril 2026 » des informations qui ne deviennent publiques qu’en août 2026.

Si une décision est prise de déplacer la date de départ vers une autre date, cette décision doit être :
- volontaire ;
- documentée ;
- propagée partout dans le calendrier ;
- et ne doit surtout pas être faite juste pour simplifier la calibration.

Par défaut :

**conserver le 18 avril 2026 et calibrer historiquement la baseline à cette période.**

---

# 2. SOURCES DE VÉRITÉ À LIRE

Avant modification, lire intégralement :

- `ELECTORAL_COHERENCE_FIXES_REPORT.md`
- `AUDIT_ELECTORAL_COHERENCE.md`
- `FINAL_ELECTORAL_CALIBRATION_REPORT.md` si ce fichier existe déjà
- `AUDIT_RUNOFF_FINAL_CALIBRATION.md` si ce fichier existe déjà
- `TARGETED_GAMEPLAY_PASS_REPORT.md`
- `FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md`
- `AUDIT_FUN_REJOUABILITE.md`
- `FUN_IMPROVEMENTS_REPORT.md`
- `AUDIT_POST_CORRECTIONS.md`
- `GAMEPLAY_AUDIT.md`
- `PARTY_GAMEPLAY_IDENTITIES.md`
- `V2_DECISIONS.md`
- `V2_CHANGELOG.md`
- `docs/EDITORIAL_POLICY.md`
- `docs/CONTENT_QUALITY_RULES.md`
- README.

Inspecter le code actuel avant de concevoir une nouvelle architecture.

---

# 3. RECHERCHE POLITIQUE RÉELLE OBLIGATOIRE

Utiliser les outils web disponibles dans l’environnement pour établir le paysage politique correspondant à la date de départ.

Priorité aux sources primaires :

- Ipsos
- Ifop
- Elabe
- OpinionWay
- Harris Interactive / Toluna si pertinent
- Cluster17 si méthodologie exploitable
- CEVIPOF
- résultats électoraux officiels
- sites officiels des partis pour candidatures/primaires
- presse uniquement pour compléter les faits de contexte.

Ne pas utiliser :
- un tweet isolé ;
- Wikipédia comme source de calibration numérique principale ;
- une seule enquête ;
- un agrégateur opaque ;
- une intuition du modèle.

Pour chaque donnée :
- date de terrain ;
- scénario de candidatures ;
- institut ;
- taille d’échantillon si disponible ;
- valeur ;
- incertitude / limites.

Créer :

```text
docs/POLITICAL_BASELINE_2026-04.md
```

---

# 4. NE PAS COPIER UN SONDAGE UNIQUE

Construire une baseline à partir de plusieurs scénarios.

Les intentions de vote dépendent énormément de :
- qui est candidat au RN ;
- qui représente le bloc central ;
- présence simultanée de Renaissance et Horizons ;
- candidat PS / social-démocrate ;
- candidature LFI ;
- présence LR ;
- présence Reconquête ;
- offre écologiste ;
- offre libérale de Nouvelle Énergie.

Créer des **fourchettes structurelles** plutôt que neuf nombres arbitraires.

Exemple de modèle :

```ts
initialSupportRange: {
  low,
  central,
  high,
  confidence
}
```

La valeur réelle d’une partie doit être tirée dans une bande réduite autour de cette baseline, et dépendre du profil de candidat effectivement présent.

---

# 5. PETITE INCERTITUDE AU DÉPART, PAS DE LOTERIE STRUCTURELLE

À J−365 :

- petite variation naturelle entre seeds : OUI ;
- inversion complète de la hiérarchie sans raison : NON.

Objectif conceptuel :

```text
baseline 15 %
→ partie A : 14,2
→ partie B : 15,4
→ partie C : 16,0
```

et non :

```text
baseline 15 %
→ partie A : 7
→ partie B : 14
→ partie C : 22
```

La largeur de variation doit dépendre de l’incertitude réelle autour de la candidature.

---

# 6. LE CANDIDAT COMPTE DÈS LE DÉPART

Créer un système de **CandidateProfile** séparé du parti.

Un parti ne possède pas une seule force électorale intrinsèque.

Exemple générique :

```ts
CandidateProfile {
  id
  partyId
  displayName
  fictional
  generation
  currentOffice
  territorialBase
  governingExperience
  economicPosition
  socialPosition
  authorityPosition
  europePosition
  ecologyPosition
  communicationStyle
  charisma
  credibility
  rejection
  coreMobilization
  crossoverAppeal
  electorateModifiers
  allianceAffinity
  transferability
  initialPollingModifier
  tags
}
```

Adapter aux types existants du projet au lieu de dupliquer inutilement des axes déjà présents.

---

# 7. CANDIDATURES INCERTAINES — ELLES DOIVENT DEVENIR UNE MÉCANIQUE

Au 18 avril 2026, certaines candidatures ne doivent pas être considérées comme déjà figées si la réalité de cette date ne permet pas de le faire.

Créer pour les principaux partis concernés un petit pool de profils plausibles.

## Exemple RN

Ne pas utiliser les vrais noms dans le jeu.

Créer deux profils pseudonymisés correspondant aux deux options politiques plausibles de la période :

### Profil A — figure historique / ligne plus sociale-étatiste
Caractéristiques possibles, à valider par recherche :
- électorat populaire plus solide ;
- intervention économique davantage assumée ;
- protectionnisme plus marqué ;
- meilleure fidélité historique de certains segments ;
- rejet personnel spécifique ;
- crossover différent vers la droite libérale.

### Profil B — jeune dauphin / ligne plus générationnelle et économiquement plus ouverte
Caractéristiques possibles, à valider par recherche :
- style plus communicationnel ;
- électorat plus jeune ;
- meilleure compatibilité avec certains électeurs de droite ;
- image économique différente ;
- rejet / expérience / crédibilité gouvernementale différents.

Le choix du candidat doit modifier réellement :
- baseline ;
- électorats ;
- reports ;
- alliances ;
- rejet ;
- second tour.

Ne pas créer deux skins avec les mêmes chiffres.

---

# 8. MÊME LOGIQUE POUR LES AUTRES ESPACES POLITIQUES

Auditer au minimum :

- RN
- Renaissance
- Horizons
- LR
- PS / espace social-démocrate
- LFI
- Écologistes
- Reconquête
- Nouvelle Énergie.

Pour chaque parti :

1. Quelle candidature est déjà certaine au 18 avril 2026 ?
2. Quelle candidature est incertaine ?
3. Quelles variantes sont réellement plausibles ?
4. Quel profil électoral chaque variante change-t-elle ?
5. Quel événement ou processus décide la candidature ?

Ne jamais créer artificiellement plusieurs candidats juste pour ajouter du contenu.

---

# 9. CAS DU JOUEUR

Le système doit rester cohérent lorsque le joueur choisit un parti dont la candidature est incertaine.

Inspecter d’abord le flow actuel.

Deux options acceptables :

### Option A
Le joueur choisit également son profil de candidat au lancement si cela reste fluide.

### Option B
La campagne commence par une courte séquence interne de désignation, avec choix ou événements.

Choisir la meilleure solution en fonction de l’architecture actuelle.

Contraintes :
- pas de mini-jeu inutile ;
- pas de 10 écrans supplémentaires ;
- choix du candidat réellement conséquent ;
- explication claire.

---

# 10. LES PNJ DOIVENT POUVOIR CHANGER DE CANDIDAT

Pour les partis non joués :

- primaire ;
- renoncement ;
- arbitrage interne ;
- retrait ;
- remplacement ;
- désignation.

doivent pouvoir résoudre le profil final.

La décision doit être :
- déterministe par seed + état ;
- probabiliste si nécessaire ;
- influencée par crédibilité, relations, sondages ou contexte ;
- cohérente avec la réalité du parti.

---

# 11. ÉVÉNEMENTS STRUCTURELS : LE CŒUR DE LA NOUVELLE DYNAMIQUE

Créer un type explicite ou une convention forte pour les événements qui **recomposent réellement l’offre politique**.

Exemples :

- retrait de candidature ;
- fusion de candidatures ;
- primaire ;
- accord de gouvernement ;
- alliance électorale ;
- ralliement d’un parti ;
- rupture d’une alliance ;
- exclusion/dissidence importante ;
- soutien d’une personnalité publique majeure ;
- crise nationale exceptionnelle ;
- changement de candidat.

Ces événements doivent être rares mais capables de produire de gros mouvements.

---

# 12. RETRAIT D’UN PARTI : NE PAS « AJOUTER +5 » À LA MAIN

Lorsqu’un candidat/parti se retire :

```text
ses électeurs ne disparaissent pas
```

Créer une vraie redistribution.

Concept :

```ts
redistributeElectorate({
  withdrawingParty,
  eligibleRecipients,
  ideologicalDistance,
  candidateAffinity,
  partyRelations,
  endorsements,
  existingAlliances,
  rejection,
  voterBloc,
  abstentionProbability
})
```

Chaque bloc électoral du parti retiré doit choisir entre :

- autre candidat ;
- indécision ;
- abstention.

---

# 13. EXEMPLE LR / RECONQUÊTE / RENAISSANCE

Le système doit être capable de produire des histoires du type :

> À l’automne, LR renonce après une campagne en échec.

ou :

> Reconquête se retire et appelle à soutenir une autre candidature de droite.

ou :

> Renaissance choisit un accord avec le candidat du bloc central.

Puis leurs électorats sont réellement redistribués.

Cela peut provoquer :

```text
Horizons + plusieurs points
Nouvelle Énergie + plusieurs points
RN + une fraction
abstention + une fraction
```

selon :
- ligne politique ;
- candidat ;
- événements déjà joués ;
- relation ;
- endorsement.

Ne pas imposer une redistribution fixe 50/50.

---

# 14. EXEMPLE ÉCOLOGISTES → PS / LFI

Le jeu doit pouvoir produire :

> Les Écologistes retirent leur candidature.

Puis :
- PS récupère une partie ;
- LFI récupère une partie ;
- éventuellement centre-gauche / abstention récupèrent le reste.

La répartition dépend de :

- accord signé ;
- proximité programmatique ;
- comportement passé du joueur ;
- relations ;
- candidat PS ;
- candidat LFI ;
- rejet.

Si LFI a agressivement attaqué les Écologistes pendant un an, le report ne doit pas être identique à une campagne où une coopération écologique a été construite.

---

# 15. LES RETRAITS NE DOIVENT PAS ÊTRE TROP FRÉQUENTS

L’objectif n’est pas qu’à chaque partie quatre partis disparaissent.

Mesurer la fréquence.

Créer des scénarios :

- aucune recomposition majeure ;
- un retrait ;
- alliance centrale ;
- alliance gauche ;
- recomposition droite ;
- scénario exceptionnel à plusieurs mouvements.

Les parties doivent rester variées.

---

# 16. SOUTIENS DE PERSONNALITÉS CONNUES / INTERNATIONALES

Créer une mécanique de **MajorEndorsement**.

Un soutien peut venir :

- d’une grande figure économique ;
- d’un ancien responsable politique ;
- d’un dirigeant étranger pseudonymisé ;
- d’une figure culturelle ;
- d’un intellectuel ;
- d’un syndicat / organisation ;
- d’un élu majeur.

Mais l’impact dépend de la crédibilité du soutien.

---

# 17. COHÉRENCE IDÉOLOGIQUE DES SOUTIENS

Chaque personnalité doit avoir :

```text
affinityTags
hostilityTags
ideologicalPosition
```

Un endorsement ne doit être éligible que si :

- proximité minimale ;
- relation ou événement permettant le rapprochement ;
- contexte cohérent.

Un président étranger analogue à un libertarien pro-marché pourrait :
- saluer une dérégulation ;
- soutenir symboliquement une rupture libérale ;
- féliciter une orientation économique proche.

Il ne doit pas naturellement :
- appeler à une révolution anticapitaliste ;
- devenir soutien de LFI sans justification extraordinaire ;
- défendre l’exact opposé de son identité juste parce qu’un événement rare a été tiré.

---

# 18. UN SOUTIEN NE DOIT PAS TOUJOURS ÊTRE POSITIF

Exemple :

un soutien international très clivant peut :

```text
+ mobilisation de certains libéraux
+ présence médiatique
- crédibilité auprès d’autres électorats
+ rejet chez certains blocs
```

Même chose pour une personnalité nationale controversée.

Donc :

> soutien prestigieux ≠ bonus universel.

---

# 19. IMPACT DES ÉVÉNEMENTS SUR LES SONDAGES

Créer une hiérarchie claire.

## Routine
Effets généralement faibles et progressifs.

## Important
Peut modifier sensiblement une dynamique.

## Major
Peut déplacer plusieurs points.

## Structural
Peut redistribuer un électorat entier parce que l’offre électorale elle-même change.

Ne pas coder des fourchettes rigides universelles.
Utiliser les électorats et le moteur.

Mais vérifier empiriquement que :
- une interview mineure ne fait pas +5 ;
- un retrait de candidat ne fait pas +0,2.

---

# 20. INERTIE DES SONDAGES

Le nouveau modèle doit éviter deux extrêmes :

### Trop volatile
chaque choix provoque un yo-yo.

### Trop figé
seuls les retraits changent les chiffres.

Créer ou conserver une inertie cohérente :
- décisions ordinaires → accumulation ;
- débats/major events → variation visible ;
- structural events → rupture de série.

Les courbes doivent raconter une histoire.

---

# 21. LE JOUEUR DOIT COMPRENDRE POURQUOI UNE COURBE CASSE

Lorsqu’un événement structurel produit une forte variation :

afficher un feedback narratif clair :

```text
RECOMPOSITION DE LA COURSE
Le retrait de X redistribue son électorat.
```

Puis éventuellement :

```text
Votre progression est particulièrement forte chez :
- droite libérale
- retraités
- cadres
```

Ne jamais afficher les formules cachées.

---

# 22. POLLS : BASELINE ET ÉVOLUTION

À la première ouverture du bulletin :

indiquer discrètement :

```text
Rapports de force estimés au 18 avril 2026
```

ou formulation cohérente.

L’institut fictif peut rester fictif.

Le contenu doit cependant venir de la calibration réelle.

Le bruit du sondage peut rester présent, mais il ne doit pas masquer totalement la baseline.

---

# 23. DOCUMENT DE CORRESPONDANCE INTERNE

Créer un fichier NON affiché au joueur :

```text
docs/FICTIONAL_POLITICAL_ARCHETYPES.md
```

Pour chaque personnage important :

```text
ID :
Nom affiché :
Fonction :
Parti/pays :
Type de personnage :
Période de référence :
Profil politique réel de référence :
Traits à préserver :
Traits qui peuvent varier :
Événements compatibles :
Événements incohérents :
Contenu sensible interdit :
```

Ne pas nécessairement écrire le nom d’une personne réelle si cela n’est pas utile.
Mais la logique doit être documentée.

---

# 24. NE PAS FAIRE DE « RESKIN » 1:1 ABSURDE

Le but n’est pas :

```text
Marine Le Pen → Marie Dupont
Jordan Bardella → Julien Bernard
```

avec uniquement un changement de chaîne de caractères.

Le but est :

> conserver les **profils et incertitudes politiques utiles à la simulation**, tout en faisant des personnages du jeu des créations propres.

Le monde doit être inspiré, pas photocopié.

---

# 25. AUDIT DU CORPUS NARRATIF EXISTANT

Scanner les 278+ événements.

Chercher :

- `fictif`
- `fictive`
- `fictionnel`
- `fictionnelle`
- formulations cassant l’immersion ;
- personnages dont idéologie contredit le parti ;
- personnages étrangers incohérents avec leur pays ;
- fonctions impossibles ;
- soutiens absurdes ;
- biographies incompatibles ;
- alliances idéologiquement inexplicables.

Créer :

```text
audit-results/reality-grounding/content-consistency.csv
```

Classer :
- OK
- à reformuler
- incohérent
- sensible
- à supprimer.

---

# 26. BASELINE : AUDIT AVANT IMPLÉMENTATION

Avant de modifier le moteur :

simuler au moins 5 000 campagnes actuelles.

Sauvegarder :

- distribution initiale ;
- classement initial ;
- écart leader/2e ;
- score par parti ;
- dispersion ;
- variations dues uniquement aux seeds ;
- fréquence de changements majeurs ;
- retraits actuels ;
- alliances actuelles.

Créer :

```text
REALITY_GROUNDING_BASELINE.md
```

---

# 27. PHASE A — RECHERCHE ET MODÉLISATION

Livrer avant implémentation :

```text
docs/POLITICAL_BASELINE_2026-04.md
docs/FICTIONAL_POLITICAL_ARCHETYPES.md
REALITY_GROUNDING_BASELINE.md
```

Puis écrire :

```text
PHASE A TERMINÉE — BASELINE RÉELLE ET ARCHÉTYPES VALIDÉS — DÉMARRAGE IMPLÉMENTATION
```

Ne pas modifier la production avant ce gate.

---

# 28. PHASE B — CALIBRATION INITIALE

Implémenter :

- baseline datée ;
- faible incertitude seed ;
- CandidateProfile ;
- impact candidat ;
- initialisation cohérente.

Tests :
- même profil + différentes seeds → variation limitée ;
- profils différents → variation explicable ;
- somme des intentions correcte ;
- déterminisme préservé.

---

# 29. PHASE C — RÉSOLUTION DES CANDIDATURES

Implémenter les candidatures incertaines réellement justifiées.

Ajouter :
- sélection NPC ;
- impact sur sondages ;
- candidat final ;
- historique ;
- événements de désignation.

Tests par parti.

---

# 30. PHASE D — RETRAITS / ALLIANCES / RECOMPOSITION

Implémenter le moteur de redistribution.

Tests :

```text
total voter mass conserved
no NaN
no negative share
withdrawn candidate no longer active
abstention allowed
eligible recipients only
ideological sensitivity
relation sensitivity
endorsement sensitivity
determinism
```

---

# 31. PHASE E — MAJOR ENDORSEMENTS

Implémenter une mécanique générique de soutien.

Créer au moins quelques événements réellement contextuels.

Ne pas remplir artificiellement le catalogue.

Priorité à la qualité.

---

# 32. PHASE F — NETTOYAGE DES PERSONNAGES / TEXTES

Supprimer les mentions répétées de fiction dans l’UI narrative.

Conserver :
- disclaimer global ;
- métadonnées internes.

Corriger les incohérences détectées.

Relancer le test d’apostrophes existant.

---

# 33. PHASE G — VALIDATION MASSIVE

Simuler au moins 10 000 campagnes post-implémentation.

Mesurer :

## Départ
- score moyen par parti ;
- p10/p50/p90 ;
- écart à baseline ;
- dispersion seed.

## Fin
- qualification ;
- victoire ;
- score ;
- favoris ;
- outsiders.

## Recomposition
- % avec retrait ;
- % avec alliance ;
- % avec candidature différente ;
- taille moyenne des chocs ;
- plus gros choc ;
- bénéficiaires.

---

# 34. MESURER LA CAUSALITÉ DES GRANDS CHOCS

Pour chaque événement structurel :

mesurer le sondage :

```text
T-1
événement
T+1
```

et attribuer l’évolution aux transferts.

Exemple :

```text
Retrait LR :
LR -7.4
Horizons +2.8
NÉ +2.1
RN +1.1
Renaissance +0.4
indécis/abstention +1.0
```

Les valeurs doivent venir du moteur, pas être hardcodées pour ressembler à cet exemple.

---

# 35. CONTREFACTUELS

À seed et état identiques :

- scénario retrait ;
- scénario maintien.

Comparer :
- scores ;
- top2 ;
- qualification ;
- alliances ;
- second tour.

Faire au moins 500 paires.

La recomposition doit réellement avoir un effet.

---

# 36. NON-RÉGRESSION DU CORRECTIF DE DISPERSION

Conserver approximativement les gains déjà obtenus :

```text
compression T1 ≈ 17,8 % et en tout cas pas retour à 76 %
favoris dominants présents
course fragmentée non obligatoire
score max > ancien plafond artificiel
```

Si la nouvelle baseline réelle modifie ces chiffres, expliquer pourquoi.

Ne pas réintroduire une compression juste pour suivre un sondage.

---

# 37. NON-RÉGRESSION SECOND TOUR

Préserver :

```text
runoff events incohérents = 0
sidebar sync failures = 0
RaceBulletin post-R1 = 0
regional map incoherences = 0
party_not_opponent fonctionnel
```

Si `FINAL_ELECTORAL_CALIBRATION_REPORT.md` existe déjà, respecter également ses conclusions.

---

# 38. FUN / AGENCE

Relancer une version ciblée des audits existants.

Le nouveau réalisme ne doit pas rendre :

- RN automatique ;
- NÉ injouable ;
- Reconquête mort dès J−365 ;
- Horizons toujours qualifié ;
- LFI/PS interchangeables ;
- campagne prédéterminée.

Mesurer :
- qualification/victoire ;
- party eta² ;
- strategy eta² ;
- counterfactual outcome changes ;
- progression ;
- fun proxy.

---

# 39. LE RÉALISME N’EST PAS UNE DIFFICULTÉ FIXE

Un parti faible au départ peut être difficile.

Mais il doit avoir :
- trajectoires ;
- opportunités ;
- recompositions compatibles ;
- conditions de percée.

Un NÉ à faible score initial peut devenir compétitif si :
- droite traditionnelle se retire ;
- soutien majeur ;
- bonne campagne ;
- alliance cohérente.

C’est beaucoup plus satisfaisant que commencer artificiellement à 14 %.

---

# 40. PLAYTESTS OBLIGATOIRES

Faire en navigateur :

1. NÉ depuis son baseline faible/réaliste → campagne sans choc ;
2. NÉ → retrait LR / recomposition favorable ;
3. Horizons → recomposition du centre ;
4. PS → retrait écologiste ;
5. LFI → retrait écologiste avec relations favorables ;
6. LFI → même retrait avec relations mauvaises ;
7. RN profil A ;
8. RN profil B ;
9. campagne sans aucun retrait majeur ;
10. campagne avec soutien international idéologiquement cohérent.

Pour chaque :
- début ;
- événement ;
- avant/après sondage ;
- causalité ;
- cohérence narrative ;
- résultat.

---

# 41. TEST DE NON-SENS POLITIQUE

Créer une suite dédiée :

```text
politicalConsistency.test.ts
```

ou équivalent.

Elle doit vérifier autant que possible structurellement :

- figure pro-marché ne reçoit pas des endorsements incompatibles sans tag d’exception ;
- candidat retiré jamais présenté comme candidat actif ;
- parti allié/opposant cohérent ;
- fonction publique cohérente ;
- personnage étranger associé au bon pays et au bon mandat ;
- NÉ conserve ses traits structurels ;
- profils candidats restent dans les axes de leur parti.

Ne pas prétendre qu’un test peut « comprendre la politique ».
Utiliser des métadonnées explicites.

---

# 42. QUALITÉ ÉDITORIALE

Étendre `npm run data:validate`.

Ajouter des règles pour :

- personnage politique sans profil ;
- endorsement sans `affinityTags` ;
- événement structurel sans redistribution ;
- candidat retiré sans transition ;
- personnage pseudonymisé étiqueté « fictif » dans le texte visible ;
- référence à une personnalité réelle non autorisée par la politique éditoriale ;
- incohérence de phase.

---

# 43. VERSION DE CALIBRATION

Ajouter aux données :

```text
politicalBaselineVersion
politicalBaselineDate
```

Exemple :

```text
2026-04-v1
2026-04-18
```

L’objectif est qu’un futur recalibrage soit explicite.

---

# 44. DOCUMENTATION POUR FUTURES MISES À JOUR

Créer :

```text
docs/REALITY_GROUNDED_SIMULATION.md
```

Expliquer :

- pourquoi baseline réelle ;
- pourquoi faible randomisation initiale ;
- comment CandidateProfile fonctionne ;
- comment ajouter un candidat ;
- comment ajouter un retrait ;
- comment ajouter un endorsement ;
- comment recalibrer ;
- comment conserver la pseudo-réalité ;
- règles de sécurité éditoriale.

---

# 45. RAPPORT FINAL

Créer :

```text
REALITY_GROUNDED_CAMPAIGN_REPORT.md
```

Structure :

1. Résumé exécutif
2. Baseline réelle retenue
3. Sources et date
4. Architecture CandidateProfile
5. Candidatures incertaines
6. Personnages pseudonymisés
7. Nouvelle Énergie
8. RN et variantes de candidat
9. Retraits
10. Alliances
11. Redistribution des électorats
12. Soutiens majeurs
13. Figures étrangères
14. Nettoyage « fictif »
15. Cohérence éditoriale
16. Simulations avant/après
17. Contrefactuels
18. Fun / agence
19. Playtests
20. Non-régressions
21. Problèmes ouverts
22. Verdict.

---

# 46. TABLEAU AVANT/APRÈS

| Domaine | Avant | Après | Verdict |
|---|---:|---:|---|
| Écart baseline jeu / réalité | | | |
| Variation seed au départ | | | |
| Hiérarchie initiale plausible | | | |
| Candidatures ayant variantes réelles | | | |
| Retraits structurels fonctionnels | | | |
| Alliances avec redistribution | | | |
| Endorsements contextuels | | | |
| Événements politiquement incohérents | | | |
| Mentions « fictif » dans flux joueur | | | |
| Compression T1 | ~17,8 % | | |
| Favoris dominants | ~22,5 % | | |
| Party eta² | | | |
| Strategy eta² | | | |
| Runoff incohérents | 0 | | |
| Sidebar sync failures | 0 | | |
| Text-quality issues | 0 | | |
| Tests | 236+ | | |
| E2E | 29+ | | |

---

# 47. VERDICT TERMINAL

Afficher :

```text
REALITY-GROUNDED CAMPAIGN — VERDICT

BASELINE
Date politique :
Sources :
Partis calibrés :
Variation initiale :
Verdict :

CANDIDATS
Profils créés :
Candidatures incertaines :
Impact réel sur sondages :
Verdict :

PERSONNAGES PSEUDONYMISÉS
Mentions répétées « fictif » supprimées :
Métadonnées internes :
Cohérence idéologique :
Contenu sensible :
Verdict :

NOUVELLE ÉNERGIE
Profil structurel :
Ancrage territorial :
Identité politique :
Baseline :
Trajectoires de percée :
Verdict :

RN
Nombre de profils plausibles :
Différences électorales :
Résolution candidature :
Verdict :

RETRAITS / ALLIANCES
Nombre d’événements structurels :
Redistribution électorale :
Part d’abstention/indécision :
Contrefactuels :
Verdict :

ENDORSEMENTS
Figures nationales :
Figures internationales :
Compatibilité idéologique :
Effets non-universels :
Verdict :

SONDAGES
Départ :
Évolution :
Chocs :
Courbes :
Verdict :

RÉALISME VS FUN
Party eta² :
Strategy eta² :
Agence :
Outsiders :
Favoris :
Verdict :

NON-RÉGRESSIONS
Compression :
Second tour :
Sidebar :
RaceBulletin :
Apostrophes :
Mobile :
Game feel :
Tests :
E2E :
Visual :
Build :

Commits locaux :
Problèmes ouverts :
```

---

# 48. RÈGLE DE FIN

Ne déclare pas la mission terminée avant :

- recherche politique datée terminée ;
- baseline réelle documentée ;
- personnages pseudonymisés cohérents ;
- aucune mention répétée « fictif » dans le flux normal ;
- CandidateProfile fonctionnel ;
- candidatures incertaines réellement modélisées quand justifié ;
- retraits et alliances redistribuant vraiment les électorats ;
- endorsements cohérents ;
- NÉ conservant son identité structurelle réelle de référence ;
- simulations massives ;
- contrefactuels ;
- playtests ;
- tests verts ;
- rapport final.

Ne demande pas de validation intermédiaire.

Travaille de manière autonome jusqu’au verdict final.

Ne pousse rien vers le dépôt distant.
