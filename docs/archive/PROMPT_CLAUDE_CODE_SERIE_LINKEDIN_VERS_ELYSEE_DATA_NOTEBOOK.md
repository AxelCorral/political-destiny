# PROMPT MAÎTRE — SÉRIE LINKEDIN « VERS L’ÉLYSÉE — DATA NOTEBOOK »

## RÈGLE D’EXÉCUTION — À LIRE AVANT TOUT

Ce document contient un **socle commun** et **trois épisodes distincts**.

**Tu ne traites qu’un seul épisode par exécution.**

Axel lancera trois runs séparés en t’indiquant explicitement :

```text
Partie 0 + Partie 1
```

ou :

```text
Partie 0 + Partie 2
```

ou :

```text
Partie 0 + Partie 3
```

Pour chaque run :

1. appliquer intégralement la **Partie 0 — Socle commun** ;
2. appliquer uniquement la partie épisode demandée ;
3. ne pas produire les autres épisodes ;
4. ne pas supposer qu’un épisode précédent a été lu par le public ;
5. ne dépendre d’un autre run que pour le **socle de rendu HTML/CSS/Puppeteer**, produit ou consolidé pendant l’Épisode 01 puis réutilisé ensuite.

Chaque épisode doit être compréhensible **indépendamment** par un lecteur qui découvre « Vers l’Élysée » pour la première fois.

---

# PARTIE 0 — SOCLE COMMUN

## 0.1 Rôle

Tu interviens comme :

- **Data Storyteller** ;
- **analyste data** ;
- **éditeur LinkedIn** ;
- **designer éditorial** ;
- **ingénieur de rendu HTML/CSS/Puppeteer** ;
- **auditeur de provenance des métriques**.

Ta mission n’est pas seulement de produire un joli carrousel.

Tu dois :

1. établir les faits à partir du dépôt ;
2. vérifier les métriques ;
3. construire une narration accessible ;
4. réutiliser le système de rendu déjà existant ;
5. produire les PNG, le PDF, le texte du post, le premier commentaire, les hashtags et les alt-texts ;
6. ne jamais sacrifier l’honnêteté méthodologique pour rendre le post plus spectaculaire.

## 0.2 Qui publie

Le post est publié par **Axel Corral, Data Analyst**.

Contexte professionnel :

- Master 2 MIASHS, parcours ISMAG ;
- Université Toulouse Jean Jaurès ;
- alternance chez DSM-Firmenich, équipe DMI, jusqu’à fin août 2026 ;
- recherche un premier poste **Data Engineer / Analytics Engineer junior** ;
- disponible en septembre 2026 ;
- stack : SQL, Python, dbt, Power BI / DAX, AWS S3 / Athena, Next.js / TypeScript, Git.

### Objectif de la série

L’objectif réel est :

> **générer des vues de profil et des conversations avec des recruteurs data d’ici fin septembre 2026.**

Ce n’est :

- ni un post de vanité ;
- ni une série militante ;
- ni une série d’opinion politique ;
- ni une démonstration de prédiction électorale.

Tout arbitrage éditorial doit être tranché avec cette question :

> **Est-ce que cela aide un recruteur Data / Analytics / Data Engineering à comprendre comment Axel structure, mesure, teste, valide et améliore un système ?**

## 0.3 Le projet

**« Vers l’Élysée »** est un simulateur narratif et probabiliste de campagne présidentielle française développé en PWA.

Le joueur :

- dirige une candidature pendant environ un an ;
- prend une trentaine de décisions ;
- fait face à des conséquences partiellement probabilistes ;
- traverse un premier puis un second tour simulés ;
- joue une partie d’environ 10 à 15 minutes.

Le jeu utilise :

- des partis réels ;
- des candidats pseudonymisés ;
- des événements ;
- des relations ;
- des électorats ;
- des sondages ;
- des alliances ;
- des retraits ;
- des reports ;
- des simulations de résultats.

**Ce projet est un simulateur de jeu calibré et audité, pas un modèle de prévision politique.**

## 0.4 La série

Le nom de série est :

> **VERS L’ÉLYSÉE — DATA NOTEBOOK**

Chaque épisode explore un problème data différent du même projet.

Les épisodes doivent fonctionner ensemble visuellement, mais pas dépendre les uns des autres narrativement.

Chaque carrousel doit réinstaller brièvement :

1. ce qu’est le projet ;
2. pourquoi le problème présenté existe ;
3. ce qui est mesuré.

## 0.5 Ce qui existe déjà

Un premier carrousel de 8 slides a déjà été produit.

Il est :

- **réussi graphiquement** ;
- **insuffisant narrativement** ;
- **à ne pas publier en l’état**.

### Acquis à conserver

Le dépôt contient déjà un socle de rendu comprenant probablement :

- templates HTML ;
- CSS ;
- script Puppeteer ;
- export PNG 1080×1350 ;
- assemblage PDF ;
- structure de fichiers dédiée au carrousel LinkedIn.

### Tâche obligatoire au début de l’Épisode 01

Localiser précisément ce socle.

Inspecter :

- dossier du carrousel actuel ;
- HTML ;
- CSS ;
- scripts de rendu ;
- dépendances ;
- conventions de nommage ;
- PDF existant ;
- slides PNG existantes.

**Réutiliser et améliorer ce système. Ne jamais repartir de zéro si le pipeline existant est fonctionnel.**

Pour les Épisodes 02 et 03 :

- réutiliser le même moteur de rendu ;
- réutiliser la même grille ;
- réutiliser la même charte ;
- ne pas créer un second design system.

## 0.6 Charte visuelle — FIGÉE POUR LES TROIS ÉPISODES

### Direction

Style :

- éditorial ;
- data-journalisme ;
- sobre ;
- premium ;
- très lisible sur mobile.

### Palette

Conserver la palette déjà validée :

- fond graphite très sombre et chaud ;
- accent ambre ;
- texte principal crème ;
- textes secondaires brun clair / gris chaud à contraste suffisant.

### Typographies

- **Fraunces** : titres ;
- **Inter** : texte courant ;
- **JetBrains Mono** : chiffres, métriques, kickers, légendes techniques.

Ne pas exporter ni distribuer les fichiers de police dans les livrables.

### Header

Le header de série doit conserver :

```text
VERS L’ÉLYSÉE — DATA NOTEBOOK
```

### Kicker

Pour les slides internes :

```text
NN — NOM DE SECTION
```

en mono ambre.

### Footer

Conserver :

- titre court / nom du projet à gauche ;
- pagination `NN / TT` à droite.

### Signature

Slide d’ouverture et slide de clôture :

```text
Axel Corral — Data Analyst
```

### Interdictions graphiques

- aucun emoji ;
- aucune icône décorative gratuite ;
- pas d’esthétique SaaS générique ;
- pas de néon ;
- pas de cyberpunk ;
- pas de drapeaux / symboles militants ;
- pas d’illustrations politiques caricaturales ;
- pas de surcharge.

## 0.7 Défauts du premier carrousel à NE JAMAIS reproduire

### Défaut 1 — le projet n’était pas présenté

Le premier carrousel parlait de :

- courses ;
- partis ;
- groupes d’électeurs ;

avant que le lecteur comprenne ce qu’était « Vers l’Élysée ».

**Correction structurante :**

Chaque épisode doit présenter l’objet très tôt, avec au moins un visuel du jeu.

### Défaut 2 — le modèle n’était pas posé

Le premier carrousel expliquait une erreur d’agrégation avant d’avoir expliqué que les scores reposaient sur des blocs d’électeurs et des variables de modèle.

**Correction :**

Avant tout diagnostic technique, poser le modèle en langage courant.

### Défaut 3 — le résultat était révélé trop tôt

Le premier carrousel révélait le comparatif avant/après sur le slide « constat », puis le répétait sur le slide « validation ».

**Correction :**

Séparer strictement :

```text
constat = état avant
correction = intervention
validation = révélation après
```

### Défaut 4 — vocabulaire interne non défini

Interdiction d’utiliser directement :

- contrefactuel ;
- eta² ;
- latent support ;
- bloc électoral ;
- seed ;
- agent ;
- dispersion ;
- source of truth ;

sans les avoir d’abord expliqués en français courant.

Règle :

> **expliquer d’abord, nommer ensuite.**

## 0.8 Règles d’honnêteté — BLOQUANTES

### 1. Aucune prétention prédictive

Interdictions :

- « prédire 2027 » ;
- « IA électorale » ;
- « modèle de prévision » ;
- « résultats scientifiquement exacts » ;
- « causalité prouvée ».

Le projet est un **simulateur de jeu**.

### 2. Aucune personnalité politique réelle nommée

Ne montrer ni :

- nom réel de personnalité politique ;
- portrait réel ;
- citation réelle utilisée comme décor ;
- capture qui contient un nom réel.

Les noms de partis peuvent apparaître s’ils sont nécessaires à une capture du jeu, mais la politique doit rester le décor.

### 3. Dérive de version des métriques

Le dépôt contient plusieurs générations d’audits.

Pour chaque chiffre publié :

- retrouver sa source ;
- retrouver son état / commit ;
- vérifier s’il décrit le HEAD ;
- vérifier si le comparatif avant/après utilise le même protocole.

Ne jamais mélanger deux métriques issues de versions différentes comme si elles appartenaient au même corpus.

### 4. Rôle de l’IA assumé

Le code a été largement implémenté avec **Claude Code**.

La formulation honnête doit être :

> Axel a piloté la conception, les hypothèses, les métriques, les audits, les playtests, l’interprétation et les itérations ; Claude Code a servi d’outil agentique d’implémentation et d’exécution.

Cette idée doit apparaître dans la conclusion de chaque épisode.

### 5. Pas de sur-vente des scores automatisés

Si une métrique de « fun » ou de rejouabilité automatisée apparaît :

- préciser qu’elle est produite par des agents / heuristiques ;
- ne jamais la présenter comme une enquête humaine.

### 6. Mesuré ≠ schématique

Convention visuelle obligatoire :

#### Données mesurées
Afficher :
- unité ;
- `n` ;
- contexte ;
- état / avant / après si nécessaire.

#### Schéma pédagogique
Afficher explicitement :

```text
Illustration schématique — pas des données mesurées
```

## 0.9 Phase obligatoire d’établissement des faits

Chaque épisode commence par cette phase.

### Étape 1 — situer le HEAD

Exécuter :

```powershell
git status
git branch --show-current
git log --oneline --decorate -n 30
```

Documenter :

- branche ;
- HEAD ;
- changements locaux ;
- rapports les plus récents.

### Étape 2 — lire les sources pertinentes

Lire :

- les rapports d’audit utiles à l’épisode ;
- les rapports plus récents susceptibles d’avoir modifié les conclusions ;
- la baseline politique si pertinente ;
- documentation éditoriale ;
- changelog ;
- code / configuration du moteur concerné.

Ne pas considérer une fonctionnalité comme livrée seulement parce qu’un prompt demandait de l’implémenter.

Chercher le **rapport final ou le code au HEAD**.

### Étape 3 — produire un tableau de métriques

Avant toute production visuelle, créer dans le dossier de l’épisode :

```text
METRICS_REVIEW.md
```

avec :

| Métrique / fait | Valeur candidate | Source | Section / ligne | Commit / état | Reproduit ? | Vérification | Confiance | Usage |
|---|---|---|---|---|---|---|---|---|

Inclure :

- métriques candidates ;
- définitions ;
- comparabilité ;
- réserves ;
- captures disponibles ;
- risques éditoriaux.

### POINT D’ARRÊT N°1 — OBLIGATOIRE

Afficher :

```text
POINT DE CONTRÔLE MÉTRIQUES — EN ATTENTE DE VALIDATION D’AXEL
```

Puis s’arrêter.

Ne produire :

- aucun storyboard final ;
- aucune slide ;
- aucun PDF ;
- aucun texte de post final.

Attendre validation explicite d’Axel.

## 0.10 Storyboard

Après validation du tableau de métriques :

Créer :

```text
STORYBOARD.md
```

avec :

| Slide | Idée unique | Titre provisoire | Preuve / métrique | Visuel | Rôle narratif |
|---|---|---|---|---|---|

Chaque slide doit avoir **une seule idée**.

### POINT D’ARRÊT N°2 — OBLIGATOIRE

Afficher :

```text
POINT DE CONTRÔLE STORYBOARD — EN ATTENTE DE VALIDATION D’AXEL
```

Puis s’arrêter.

Attendre validation avant :
- rédaction finale ;
- rendu ;
- PDF.

## 0.11 Format

### Dimensions

Chaque slide :

```text
1080 × 1350 px
ratio 4:5
PNG
```

### PDF

Créer un PDF unique regroupant les mêmes pages, dans le même ordre.

### Nombre de slides

Respecter le nombre défini par chaque épisode.

### Mobile first

- corps de texte ≥32 px ;
- marges généreuses ;
- contraste élevé ;
- idéalement ≤40 mots par slide ;
- aucune réduction de typo pour faire entrer trop de texte.

### Graphiques

Toujours :

- axes légendés ;
- unités ;
- `n` ;
- zéro axe tronqué pour dramatiser ;
- zéro faux relief 3D.

## 0.12 Rendu

Utiliser :

```text
HTML + CSS + Puppeteer
```

Réutiliser le pipeline existant.

Le rendu doit être reproductible sous Windows / PowerShell.

Les scripts doivent :

- attendre le chargement des polices ;
- produire exactement les dimensions demandées ;
- assembler le PDF ;
- ne pas nécessiter de retouche manuelle après rendu.

## 0.13 Texte LinkedIn

Pour chaque épisode produire :

```text
POST.md
```

contenant :

1. texte du post ;
2. premier commentaire ;
3. 3 à 5 hashtags.

### Ton

- français ;
- première personne ;
- direct ;
- humain ;
- factuel ;
- pas de ton corporate artificiel.

### Hook

Les deux premières lignes doivent :
- nommer le projet ou l’objet ;
- porter la tension ;
- rester autour de 200 caractères maximum avant la coupure.

Un hook qui ne permet pas de comprendre qu’on parle de « Vers l’Élysée » est raté.

### Longueur

```text
900 à 1400 caractères
```

### Interdits stylistiques

- emojis de puces ;
- `🚀` ;
- « Voici pourquoi 👇 » ;
- empilement de questions rhétoriques ;
- « game-changer » ;
- triades artificielles ;
- ton « personal branding » excessif ;
- phrases toutes de même longueur.

## 0.14 Premier commentaire

Le premier commentaire porte :
- lien vers le projet jouable ;
- lien vers dépôt / portfolio si pertinent.

Chercher les URLs publiques dans :
- README ;
- package metadata ;
- remote GitHub ;
- documentation de déploiement.

Si aucune URL certaine n’est trouvée :

```text
[À CONFIRMER PAR AXEL]
```

Ne jamais inventer d’URL.

## 0.15 Alt-texts

Créer :

```text
ALT_TEXTS.md
```

avec un texte alternatif par slide.

Pour chaque graphique :
- décrire le sens ;
- donner les valeurs importantes ;
- ne pas décrire seulement le style graphique.

## 0.16 Arborescence

Identifier d’abord le dossier existant de la série.

Conserver une structure cohérente, par exemple :

```text
linkedin/
└── vers-elysee-data-notebook/
    ├── shared/
    │   ├── styles/
    │   ├── scripts/
    │   └── assets/
    ├── episode-01-model-audit/
    ├── episode-02-counterfactuals/
    └── episode-03-calibration/
```

Ne créer cette structure que si elle est compatible avec ce qui existe.

**Ne pas dupliquer un dossier déjà présent.**

## 0.17 Git

Règle permanente :

> **Claude Code ne commit jamais les carrousels.**

Ne pas :
- commit ;
- push ;
- modifier le moteur ;
- modifier les données ;
- modifier des métriques pour obtenir un meilleur storytelling.

# PARTIE 1 — ÉPISODE 01
# « Le simulateur qui sonnait faux »

## 1.1 Mission

Refondre complètement le carrousel existant.

Le rendu graphique actuel est la base à conserver.

La narration doit devenir un parcours en **11 slides**, structuré en trois actes :

```text
ACTE I — L’OBJET
ACTE II — LE MODÈLE
ACTE III — L’ENQUÊTE
```

Le lecteur doit comprendre :
- ce qu’est Vers l’Élysée ;
- comment il fonctionne ;
- quel modèle se trouve derrière ;
- comment un feedback qualitatif a été transformé en audit quantitatif ;
- comment le bug a été diagnostiqué ;
- comment la correction a été validée.

## 1.2 Phase de vérification spécifique

Avant `METRICS_REVIEW.md`, retrouver et lire notamment :

- le carrousel existant ;
- son storyboard ;
- le rapport de métriques précédent ;
- l’audit électoral ayant identifié la compression ;
- le rapport de correction ;
- les audits ultérieurs ayant revalidé ou modifié le mécanisme ;
- le code actuel d’agrégation électorale ;
- les captures Playwright / E2E actuelles ;
- les données du modèle nécessaires au slide « Sous le capot ».

Ne recopier **aucune valeur numérique depuis ce prompt**.

Tout nombre du jeu doit venir du dépôt.

## ACTE I — L’OBJET

### Slide 01 — Hook

Le hook doit contenir immédiatement :

1. l’objet ;
2. la tension.

Direction narrative :

> J’ai construit un simulateur de campagne présidentielle ; le plus difficile n’a pas été de le coder, mais de vérifier qu’il n’était pas cassé.

Claude Code doit proposer **trois variantes de hook** dans le storyboard.

Contraintes :
- pas de jargon ;
- pas de chiffre ;
- pas de résultat révélé ;
- comprendre « jeu/simulateur + problème data » immédiatement.

### Slide 02 — Ce que c’est

Objectif :

> pouvoir décrire le projet à quelqu’un après ce slide.

Contenu à vérifier depuis le dépôt / documentation :

- nature du jeu ;
- durée approximative d’une partie ;
- nombre de décisions ;
- PWA ;
- partis réels ;
- candidats pseudonymisés.

Inclure une **capture du jeu**.

#### Point de vigilance capture

Deux options doivent être proposées dans le storyboard :

**Option A — recommandée par défaut**
Capture d’une interface de décision / événement.

Avantages :
- montre le gameplay ;
- moins de risque d’être interprétée comme une projection politique.

**Option B**
Écran de résultat.

Si retenu :
- incruster directement sur l’image une mention du type :

```text
SIMULATION — RÉSULTATS FICTIFS
```

La mention doit être visible dans l’image elle-même.

**Ne pas trancher silencieusement : proposer les deux options à Axel au point de contrôle storyboard.**

### Slide 03 — Comment ça marche côté joueur

Montrer :

- un événement ;
- plusieurs décisions ;
- conséquences probabilistes.

Faire comprendre :

> le joueur choisit une ligne d’action, pas un résultat garanti.

Ne pas montrer :
- formule ;
- probabilités exactes si elles ne sont pas déjà visibles / pertinentes ;
- mécanismes internes complexes.

## ACTE II — LE MODÈLE

### Slide 04 — Sous le capot

C’est le slide qui manquait au premier carrousel.

Expliquer en langage courant :

> le score d’un parti n’est pas une simple valeur stockée : il résulte d’une agrégation de soutiens dans plusieurs groupes d’électeurs, eux-mêmes influencés par plusieurs dimensions du parti / candidat / contexte.

Claude Code doit vérifier au HEAD :

- nombre réel de blocs / segments ;
- noms / catégories si présentables ;
- axes idéologiques actifs ;
- variables principales réellement utilisées ;
- rôle du candidat ;
- rôle des relations si elles interviennent dans cette couche.

Ne pas tout lister.

Créer un schéma simple :

```text
groupes d’électeurs
      ↓
affinités / candidat / contexte
      ↓
soutiens
      ↓
agrégation nationale
      ↓
intention de vote simulée
```

Si le schéma n’est pas une visualisation de vraies observations :

```text
Illustration schématique — pas des données mesurées
```

## ACTE III — L’ENQUÊTE

### Slide 05 — Le déclencheur

Titre / angle :

> **Un ressenti n’est pas une métrique**

Raconter :
- feedback de playtest ;
- résultat « qui sonne faux » ;
- refus de modifier les coefficients au hasard.

Le projet a maintenant été posé : cette slide peut être plus concise que l’ancienne.

### Slide 06 — Le protocole

Expliquer :

- corpus reproductible ;
- moteur réel ;
- plusieurs configurations ;
- seeds / graines expliquées en langage courant.

Si le protocole est décomposé en facteurs :
- vérifier chaque nombre à la source ;
- afficher le calcul uniquement si cela reste lisible.

L’idée principale :

> ne pas juger un simulateur sur trois parties jouées à la main.

### Slide 07 — Le constat
#### ÉTAT AVANT UNIQUEMENT

C’est une règle absolue :

**NE PAS afficher le résultat après correction sur cette slide.**

Montrer uniquement :

- métrique du problème avant ;
- définition en français courant ;
- distribution / graphique avant si disponible.

Créer une tension :

> le problème n’est plus une impression, il est mesuré.

Ne pas montrer :
- valeur après ;
- flèche avant → après ;
- screenshot post-correctif présenté comme preuve.

### Slide 08 — Le diagnostic

Expliquer la cause racine.

Le slide 04 ayant déjà expliqué le modèle, cette slide peut maintenant montrer :

> où l’agrégation écrase les écarts.

Faire le lien explicitement avec le modèle posé plus tôt.

Utiliser un schéma si nécessaire.

Mention obligatoire si schématique :

```text
Illustration schématique — pas des données mesurées
```

### Slide 09 — La correction

Expliquer :

- nature du correctif ;
- caractère uniforme ;
- absence de bonus spécifique à un parti ;
- position de la correction dans le pipeline.

Le nom technique exact du paramètre peut apparaître en bas de slide **uniquement après l’explication en langage courant**.

Ne pas présenter une formule sans explication.

### Slide 10 — La validation

C’est **ici uniquement** que le comparatif avant → après est révélé.

Rejouer le protocole post-correctif.

Afficher :
- comparatif principal ;
- éventuellement une métrique secondaire si elle apporte une information différente ;
- `n`.

Le slide doit être compréhensible en une demi-seconde.

C’est le « stop-scroll » de l’épisode.

### Slide 11 — Ce que j’en retiens

Relier l’histoire au profil Data :

- transformer un ressenti en métrique ;
- définir un protocole ;
- identifier une cause racine ;
- corriger ;
- revalider.

Mention obligatoire du rôle de Claude Code :

> code implémenté avec Claude Code comme outil agentique ; conception, hypothèses, métriques, audits, playtests et interprétation pilotés par Axel.

CTA :
- jouer ;
- projet en commentaire.

Ne pas transformer cette slide en CV.

## 1.3 Critères de réussite de l’Épisode 01

Le lecteur doit pouvoir répondre à :

1. Qu’est-ce que Vers l’Élysée ?
2. Que fait le joueur ?
3. Pourquoi le système est probabiliste ?
4. Comment un score électoral est-il produit à haut niveau ?
5. Quel ressenti de playtest a déclenché l’audit ?
6. Comment l’audit a-t-il été construit ?
7. Quel était le problème avant correction ?
8. Quelle était la cause ?
9. Qu’a changé la correction ?
10. Comment la correction a-t-elle été validée ?

## 1.4 Checklist Épisode 01

- [ ] 11 slides exactement.
- [ ] Projet présenté avant toute métrique.
- [ ] Capture du jeu dans l’Acte I.
- [ ] Le modèle est expliqué avant le diagnostic.
- [ ] Aucun jargon interne avant définition.
- [ ] Slide 07 = état avant uniquement.
- [ ] Slide 10 = révélation avant → après.
- [ ] Chaque chiffre est tracé à une source.
- [ ] Aucun nom de personnalité réelle.
- [ ] Toute capture de résultat est explicitement marquée comme simulation.
- [ ] Aucun langage prédictif.
- [ ] Schémas marqués comme schématiques.
- [ ] Données mesurées avec `n` et unités.
- [ ] Corps ≥32 px.
- [ ] PNG 1080×1350.
- [ ] PDF complet.
- [ ] Alt-text pour chaque slide.
- [ ] Hook contenant l’objet en ~200 caractères maximum.
- [ ] Mention du rôle de Claude Code présente.
- [ ] Aucun commit.
- [ ] Aucun fichier du moteur modifié.

# PARTIE 2 — ÉPISODE 02
# « Si je change une seule décision, que se passe-t-il ? »

## 2.1 Angle

Cet épisode traite de **l’agence du joueur**.

Question centrale :

> **Comment vérifier que les choix du joueur changent réellement la partie, et que l’issue n’est pas principalement déterminée par le parti de départ ou le hasard ?**

Le concept différenciant :

> rejouer deux versions de la même campagne avec la même graine aléatoire et le même historique, en modifiant uniquement une décision.

## 2.2 Intérêt professionnel

Cet épisode doit valoriser :

- design expérimental ;
- reproductibilité ;
- comparaison appariée ;
- raisonnement contrefactuel ;
- analyse de variance ;
- distinction signal / bruit ;
- prudence sur l’interprétation causale.

C’est probablement l’épisode le plus proche d’une démarche **Data Science / experimentation**.

## 2.3 Phase de vérification spécifique

Chercher dans le dépôt :

- audits d’agence ;
- branches contrefactuelles ;
- scripts de simulation ;
- rapports post-corrections ;
- protocoles « même seed / décision différente » ;
- analyses eta² ;
- agents de décision ;
- distinction entre agents réalistes et agents artificiellement extrêmes ;
- éventuels rapports plus récents qui ont re-mesuré l’agence.

Identifier précisément :

1. le protocole le plus propre ;
2. le corpus ;
3. les métriques ;
4. la définition de l’issue ;
5. ce qui peut être affirmé ;
6. ce qui ne doit pas être appelé causalité.

Ne pas reprendre de valeur numérique depuis ce prompt.

## 2.4 Structure narrative

Construire **9 à 11 slides**.

### Slide 01 — Hook

Objet + tension.

Direction :

> J’ai construit un jeu où les décisions sont probabilistes. Mais comment vérifier qu’elles comptent vraiment ?

Proposer trois hooks.

### Slide 02 — Le jeu en 20 secondes

Réinstaller :
- Vers l’Élysée ;
- campagne ;
- choix ;
- conséquences probabilistes.

Inclure une capture.

### Slide 03 — Le problème

Expliquer :

> si une partie se termine différemment, est-ce à cause de ma décision ou simplement du hasard ?

Pas encore de mot « contrefactuel ».

### Slide 04 — Le privilège du simulateur

Expliquer :

> dans le monde réel, on ne peut pas rejouer la même élection en ne changeant qu’une décision. Dans un simulateur déterministe par graine, on peut.

Expliquer « graine » simplement :

> un identifiant qui fige tous les tirages aléatoires d’une partie.

Ensuite seulement introduire :
- seed / graine ;
- expérience contrefactuelle.

### Slide 05 — Le protocole

Schéma :

```text
même état
même graine
même historique
        ↓
     décision A
        │
        └── décision B
        ↓
comparaison des trajectoires
```

Préciser :
- ce qui est contrôlé ;
- ce qui change ;
- horizon observé.

### Slide 06 — Ce qu’on mesure

Expliquer en langage courant :
- différence de score ;
- différence de qualification ;
- différence de victoire ;
- éventuellement effet après plusieurs décisions.

Ne montrer que les métriques réellement disponibles.

### Slide 07 — Résultat

Montrer le résultat principal vérifié au dépôt.

Une seule idée :
> une décision isolée produit-elle un effet mesurable ?

Le graphique doit privilégier la compréhension.

### Slide 08 — Parti, stratégie ou hasard ?

Introduire l’analyse de variance seulement ici.

D’abord :

> On peut aussi demander quelle part des écarts vient du parti choisi, de la manière de jouer et de ce qu’on ne contrôle pas.

Ensuite seulement :

```text
eta²
```

si cette métrique est retenue.

Ne pas exiger qu’elle apparaisse si elle complexifie inutilement le carrousel.

### Slide 09 — Ce que cela ne prouve pas

Slide d’honnêteté méthodologique.

Dire explicitement :

> ce n’est pas de l’inférence causale académique sur des données observées.

C’est :
- un protocole expérimental interne ;
- rendu possible par un simulateur déterministe ;
- impossible à reproduire de la même manière sur une vraie élection.

Transformer cette limite en intérêt pédagogique.

### Slide 10 — Ce que j’en retiens

Relier à :
- A/B testing ;
- expériences appariées ;
- reproductibilité ;
- analyse du bruit ;
- validation d’une mécanique produit.

Mention Claude Code.

CTA.

### Slide 11 — Optionnelle

N’ajouter une onzième slide que si elle est réellement nécessaire pour :
- un graphique d’agence important ;
- une comparaison entre agents ;
- ou une explication visuelle essentielle.

Sinon rester à 10.

## 2.5 Règles de vulgarisation

Ne jamais écrire un slide dont le lecteur doit déjà connaître :

- contrefactuel ;
- eta² ;
- seed ;
- variance inter/intra ;
- agent de décision.

Toujours :

```text
explication courante
→ terme technique
```

Le parallèle conseillé :

> **un A/B test dans lequel on peut contrôler absolument tout sauf une décision.**

Ne pas écrire :

> « J’ai prouvé causalement que… »

## 2.6 Checklist Épisode 02

- [ ] 9 à 11 slides.
- [ ] Projet réinstallé avant le protocole.
- [ ] Capture du jeu tôt dans le parcours.
- [ ] « Graine » expliquée avant « seed ».
- [ ] Principe contrefactuel expliqué avant le terme.
- [ ] Aucun chiffre non sourcé.
- [ ] Protocole exact retrouvé dans le dépôt.
- [ ] Comparaison issue d’états comparables.
- [ ] Aucune prétention de causalité académique.
- [ ] eta² expliqué en langage courant s’il apparaît.
- [ ] Agents automatisés identifiés comme tels.
- [ ] Aucun nom politique réel.
- [ ] Aucun langage prédictif.
- [ ] Schémas identifiés comme schématiques.
- [ ] `n` et unités sur les graphiques mesurés.
- [ ] Corps ≥32 px.
- [ ] PNG 1080×1350.
- [ ] PDF complet.
- [ ] Alt-text par slide.
- [ ] Hook contenant l’objet.
- [ ] Mention Claude Code.
- [ ] Aucun commit.
- [ ] Aucun moteur / donnée modifié.

# PARTIE 3 — ÉPISODE 03
# « Un sondage n’est pas la réalité »

## 3.1 Angle

Cet épisode traite de **calibration, source de vérité et mesure bruitée**.

Question centrale :

> **Comment ancrer un simulateur politique dans le réel sans copier un seul sondage ni transformer le jeu en modèle de prédiction ?**

Le projet a travaillé sur :

- baseline politique datée ;
- versionnement ;
- plusieurs sources ;
- fourchettes plausibles ;
- état latent ;
- bruit de mesure ;
- distinction entre paramètres du monde simulé et sondage affiché.

Toutes ces affirmations doivent être vérifiées au dépôt avant utilisation.

## 3.2 Intérêt professionnel

Cet épisode doit parler directement à un profil :

- Analytics Engineer ;
- Data Engineer ;
- Data Analyst.

Concepts à faire ressortir dans la conclusion :

- **source of truth** ;
- **versioning** ;
- **calibration multi-source** ;
- **latent state vs observed measurement** ;
- **documentation d’une règle de modélisation**.

## 3.3 Phase de vérification spécifique

Lire et vérifier au HEAD :

- baseline politique ;
- date de référence ;
- version ;
- sources ;
- fourchettes ;
- code d’initialisation ;
- code de sondage ;
- bruit de sondage ;
- distinction état latent / affichage ;
- rapports reality grounding ;
- rapports ultérieurs ayant modifié la calibration.

Chercher notamment les documents dont les noms évoquent :

```text
POLITICAL_BASELINE
REALITY_GROUNDING
REALITY_GROUNDED
CALIBRATION
polls
electorate
```

Vérifier :
- si la baseline actuelle est toujours active ;
- si sa date / version ont changé ;
- si les valeurs publiables correspondent bien à l’état actuel.

## 3.4 Prudence politique renforcée

Cet épisode peut utiliser des données réelles comme **entrée de calibration historique**.

Toute valeur politique réelle doit être présentée comme :

> **paramètre d’entrée daté du jeu**

et jamais comme :

- intention de vote actuelle ;
- projection ;
- prévision ;
- scénario attendu pour 2027.

Si des fourchettes politiques sont affichées :

- date visible ;
- rôle de calibration visible ;
- sources citées ;
- mention « paramètres d’entrée du simulateur » ou équivalent.

## 3.5 Structure narrative

Construire **9 à 11 slides**.

### Slide 01 — Hook

Objet + tension.

Direction :

> Pour rendre mon simulateur crédible, je ne pouvais pas simplement copier le dernier sondage.

Proposer trois hooks.

### Slide 02 — Le jeu

Réinstaller :
- Vers l’Élysée ;
- campagne ;
- sondages internes ;
- décisions.

Capture tôt dans le parcours.

### Slide 03 — Le problème

Expliquer les deux mauvaises solutions :

#### Mauvaise solution A
Tout randomiser au départ.

Résultat :
- monde peu crédible.

#### Mauvaise solution B
Copier une enquête ponctuelle.

Résultat :
- surajustement ;
- dépendance au scénario exact de candidats ;
- baseline vite obsolète.

Pas besoin d’utiliser le mot « overfitting » tout de suite.

### Slide 04 — Construire une baseline

Expliquer :

> plusieurs sources + plusieurs scénarios → fourchettes structurelles.

Ensuite seulement nommer :

- calibration ;
- baseline.

Afficher uniquement les sources / valeurs vérifiées.

### Slide 05 — Une source de vérité datée

Présenter :
- version ;
- date ;
- documentation ;
- règles de mise à jour.

Vocabulaire Analytics Engineering possible après vulgarisation :

> **source of truth versionnée**

### Slide 06 — La réalité du jeu n’est pas le sondage

Poser deux couches :

```text
état électoral latent
        ↓
bruit de mesure
        ↓
sondage affiché
```

D’abord expliquer en français courant.

Ensuite nommer :

```text
latent state
observed measurement
```

si cela apporte de la valeur.

Schéma :

```text
Illustration schématique — pas des données mesurées
```

### Slide 07 — Pourquoi ajouter du bruit

Expliquer :
- un sondage n’observe pas parfaitement l’état du monde ;
- le joueur ne doit pas connaître la vérité exacte ;
- l’incertitude fait partie du gameplay.

Ne pas dériver vers une explication académique complète des marges d’erreur réelles si le moteur ne les reproduit pas explicitement.

### Slide 08 — Comment éviter le surajustement

Expliquer :
- fourchettes ;
- scénarios ;
- petite variabilité ;
- documentation ;
- mise à jour versionnée.

Si le code actuel fait autrement, utiliser le code réel plutôt que ce schéma attendu.

### Slide 09 — Ce que cela change

Montrer un résultat ou un exemple mesuré vérifié :
- hiérarchie initiale plus plausible ;
- réduction d’un écart de calibration ;
- autre métrique appropriée.

Ne pas afficher une liste de scores politiques si une métrique synthétique suffit.

### Slide 10 — Ce que j’en retiens

Faire explicitement le lien avec :

- Analytics Engineering ;
- source of truth ;
- versioning ;
- multi-source calibration ;
- séparation latent / observed ;
- documentation.

Mention Claude Code.

CTA.

### Slide 11 — Optionnelle

Ajouter seulement si nécessaire pour :
- expliquer les sources ;
- montrer une capture du bulletin ;
- ou isoler une distinction méthodologique majeure.

Sinon rester à 10.

## 3.6 Règles de présentation des sources

Si des instituts / sources réelles apparaissent :

- ne citer que les sources réellement présentes dans la documentation ;
- indiquer la période / date ;
- ne pas importer de nouvelles données web sans nécessité ;
- ne pas mettre en avant un chiffre actuel comme projection.

Si une vérification web s’avère nécessaire parce que la documentation renvoie vers une source externe :
- l’utiliser seulement pour confirmer la source ;
- ne pas remplacer la source versionnée du projet par une valeur plus récente.

Le sujet est :

> **comment le jeu a été calibré**

pas :

> **où en est l’élection aujourd’hui**.

## 3.7 Checklist Épisode 03

- [ ] 9 à 11 slides.
- [ ] Projet réinstallé au début.
- [ ] Capture du jeu tôt dans le parcours.
- [ ] Baseline vérifiée au HEAD.
- [ ] Date et version vérifiées.
- [ ] Sources vérifiées.
- [ ] Aucun chiffre politique utilisé hors de son contexte de calibration.
- [ ] Aucun chiffre présenté comme projection.
- [ ] « baseline » expliquée avant jargon.
- [ ] « latent » expliqué en français courant avant le terme.
- [ ] Différence réalité simulée / sondage affiché claire.
- [ ] Source of truth explicitement reliée à un concept Analytics Engineering.
- [ ] Toute mesure tracée à une source.
- [ ] Toute illustration schématique étiquetée.
- [ ] Aucun nom de personnalité réelle.
- [ ] Aucun langage prédictif.
- [ ] Corps ≥32 px.
- [ ] PNG 1080×1350.
- [ ] PDF complet.
- [ ] Alt-text par slide.
- [ ] Hook contenant le projet et la tension.
- [ ] Mention Claude Code.
- [ ] Aucun commit.
- [ ] Aucun moteur / donnée modifié.

# SORTIE ATTENDUE POUR CHAQUE RUN

À la fin d’un épisode, après validation des deux checkpoints, produire :

```text
METRICS_REVIEW.md
STORYBOARD.md
POST.md
ALT_TEXTS.md
README.md
PNG numérotés
PDF complet
HTML/CSS
scripts Puppeteer
```

Réutiliser le socle partagé si disponible.

# CHECKLIST GLOBALE DE SÉRIE

Avant de rendre un épisode :

- [ ] Il est compréhensible sans avoir lu les autres épisodes.
- [ ] « Vers l’Élysée » est présenté avant les détails techniques.
- [ ] Un visuel réel du produit apparaît tôt.
- [ ] Une seule histoire principale.
- [ ] Une seule idée par slide.
- [ ] Aucun terme interne non défini.
- [ ] Aucun chiffre inventé.
- [ ] Aucun mélange de versions.
- [ ] Aucun nom de personnalité politique réelle.
- [ ] Aucun message prédictif.
- [ ] Politique = décor, data = sujet.
- [ ] Rôle de Claude Code expliqué honnêtement.
- [ ] Charte visuelle « Data Notebook » respectée.
- [ ] Aucun commit.
- [ ] Aucun changement moteur / données.

# POINTS À CONFIRMER PAR AXEL

Uniquement si le dépôt ne permet pas de les établir :

1. URL publique exacte du jeu : `[À CONFIRMER PAR AXEL]`
2. URL publique du portfolio : `[À CONFIRMER PAR AXEL]`

# DÉCISION DE CADRAGE RETENUE

Pour l’Épisode 01 :

- **11 slides imposées** ;
- capture de décision recommandée par défaut en Acte I ;
- écran de résultat possible uniquement avec mention « simulation » incrustée.

Pour les Épisodes 02 et 03 :

- **10 slides par défaut** ;
- extension à 11 uniquement si une idée méthodologique indispensable ne peut pas être intégrée sans surcharge ;
- réduction à 9 possible si une slide est manifestement redondante.

# DÉMARRAGE

Commencer uniquement par l’épisode explicitement demandé par Axel.

La première action du run doit être :

1. appliquer la Partie 0 ;
2. appliquer la Partie N demandée ;
3. établir les faits ;
4. produire `METRICS_REVIEW.md` ;
5. afficher le point de contrôle ;
6. s’arrêter.
