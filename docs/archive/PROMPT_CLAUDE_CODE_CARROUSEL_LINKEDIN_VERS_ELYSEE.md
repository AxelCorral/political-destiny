# Mission Claude Code — Carrousel LinkedIn « Vers l’Élysée » : un bug de modèle débusqué par la donnée

## 1. Rôle et mission

Tu interviens comme **analyste data, éditeur LinkedIn, designer éditorial et ingénieur de rendu**. Ta mission est de vérifier dans le dépôt les faits et métriques exacts relatifs à un bug de compression du modèle électoral, puis de transformer cette histoire en un carrousel LinkedIn technique, sobre et crédible, accompagné du texte du post et de tous les livrables nécessaires. **Ne jamais produire ni rendre de slide avant le point de contrôle humain obligatoire sur les métriques.**

---

## 2. Contexte

### Qui publie

Le post est publié par **Axel Corral, Data Analyst**.

Contexte professionnel à utiliser pour calibrer l’angle, le niveau de technicité et le CTA :

- termine un **Master 2 MIASHS, parcours ISMAG**, à l’Université Toulouse Jean Jaurès ;
- alternance chez **DSM-Firmenich**, équipe DMI, jusqu’à fin août 2026 ;
- cherche un premier poste **Data Engineer / Analytics Engineer junior** ;
- disponible à partir de **septembre 2026** ;
- stack à valoriser naturellement quand elle est pertinente : **SQL, Python, dbt, Power BI/DAX, AWS S3/Athena, Next.js/TypeScript, Git** ;
- travaille sous **Windows / PowerShell** ;
- utilise **Claude Code comme outil agentique principal** ;
- ses projets locaux sont généralement sous `D:\Project_claude_code\`.

### Objectif réel du post

L’objectif est de **générer des vues de profil et des conversations avec des recruteurs data d’ici fin septembre 2026**.

Ce n’est :
- ni un post de vanité ;
- ni un post militant ;
- ni un post visant à commenter l’élection française ;
- ni un post visant à promouvoir une opinion politique.

Tout arbitrage éditorial doit être tranché selon cette question :

> **Est-ce que cela aide un recruteur Data / Analytics / Data Engineering à comprendre comment Axel raisonne, expérimente, mesure et améliore un système ?**

### Ce qui a déjà été publié

Axel a déjà publié un carrousel LinkedIn sur son mémoire de fin d’études consacré à la **soutenabilité du système de retraites français**, avec :
- modélisation Python ;
- dépôt public `axelcorral/retraites-cor2026` ;
- 7 slides ;
- format 1080×1350 ;
- figures matplotlib ;
- ton pédagogique, sobre et factuel.

Conséquences pour le nouveau carrousel :

1. Il doit être **visuellement reconnaissable comme venant de la même personne**, afin de créer une cohérence de série.
2. Il ne doit pas être une copie graphique exacte du précédent.
3. Le précédent sujet étant déjà socio-politique, ce nouveau post ne doit surtout pas sembler être un deuxième post d’opinion politique.
4. **La politique est uniquement le décor ; le sujet est la démarche data.**

### Le projet

Le projet s’appelle **« Vers l’Élysée »**.

C’est un simulateur narratif et probabiliste de campagne présidentielle française, développé en PWA. Le moteur gère notamment des partis, des candidats pseudonymisés, des électorats, des sondages, des événements, des décisions, des alliances, des reports de voix, des relations, des retraits et des résultats électoraux.

**Ce carrousel ne doit pas raconter tout le jeu.**

Il raconte un problème précis :

> **un bug de modèle débusqué grâce à la simulation massive et à l’analyse de distribution.**

### Angle éditorial validé

Trame narrative à respecter :

> Un retour de playtest indique que les résultats « sonnent faux ». Plutôt que de modifier des coefficients à l’instinct, Axel transforme ce ressenti en métrique, lance un corpus massif de simulations, mesure la distribution, remonte à la cause dans l’agrégation du modèle, corrige le mécanisme, puis revalide sur un corpus comparable.

Structure logique obligatoire :

> **problème → mesure → diagnostic → correction → validation**

Le carrousel doit être compréhensible par quelqu’un qui :
- ne connaît pas le jeu ;
- ne connaît pas les partis français ;
- ne connaît pas les détails du moteur.

Les chiffres clés de cette histoire existent dans le dépôt. **Ne jamais les prendre de mémoire ou les déduire à partir de ce prompt. Les relire à la source.**

### Angles explicitement écartés

Ne pas dériver vers :

- **« J’ai créé un jeu politique »** : trop générique, trop produit, pas assez data ;
- **« Un modèle qui prédit 2027 »** : faux, à proscrire ;
- le moteur de reports de voix : bon futur sujet, pas celui-ci ;
- l’analyse eta² de l’agence : bon futur sujet, pas celui-ci ;
- la mesure du fun / rejouabilité : bon futur sujet, pas celui-ci ;
- une présentation exhaustive du projet : trop large ;
- un débat politique : hors objectif.

Un seul fil narratif ici.

---

## 3. Phase 1 — Établissement des faits
### OBLIGATOIRE AVANT TOUTE PRODUCTION

### 3.1 Commencer par situer précisément le HEAD

Exécuter au minimum :

```powershell
git status
git branch --show-current
git log --oneline --decorate -n 30
git remote -v
```

Identifier :

- branche courante ;
- commit HEAD ;
- présence éventuelle de changements non commités ;
- rapports plus récents que ceux listés ci-dessous ;
- éventuelle dernière passe fonctionnelle terminée après les rapports connus.

**Ne rien commiter.**

### 3.2 Localiser et lire les rapports pertinents

Rechercher puis lire intégralement, s’ils existent :

```text
REALITY_GROUNDED_CAMPAIGN_REPORT.md
REALITY_GROUNDING_BASELINE.md
ELECTORAL_COHERENCE_FIXES_REPORT.md
AUDIT_ELECTORAL_COHERENCE.md
FINAL_ELECTORAL_CALIBRATION_REPORT.md
AUDIT_RUNOFF_FINAL_CALIBRATION.md
STRATEGIC_REALIGNMENTS_REPORT.md
AUDIT_STRATEGIC_REALIGNMENTS.md
TARGETED_GAMEPLAY_PASS_REPORT.md
FUN_IMPROVEMENTS_REPORT.md
AUDIT_FUN_REJOUABILITE.md
AUDIT_POST_CORRECTIONS.md
GAMEPLAY_AUDIT.md
FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md
AUDIT_FORME_GAME_FEEL.md
V2_CHANGELOG.md
```

Lire également, s’ils existent :

```text
docs/POLITICAL_BASELINE_2026-04.md
docs/FICTIONAL_POLITICAL_ARCHETYPES.md
docs/REALITY_GROUNDED_SIMULATION.md
docs/EDITORIAL_POLICY.md
docs/CONTENT_QUALITY_RULES.md
```

Inspecter aussi les répertoires d’audit correspondants, notamment ceux contenant :
- résultats CSV/JSON ;
- distributions avant/après ;
- scripts de corpus ;
- paramètres de simulation ;
- captures déjà produites.

### 3.3 Identifier la version exacte de l’histoire « compression électorale »

Reconstituer la chronologie exacte du bug :

1. Quel état du jeu constitue le **« avant »** ?
2. Quel rapport / commit mesure ce « avant » ?
3. Avec quel script ?
4. Combien de campagnes contient le corpus ?
5. Quelle définition exacte est utilisée pour qualifier une course de « comprimée » ?
6. Quelle métrique résume le problème ?
7. Quel mécanisme mathématique / algorithmique est identifié comme cause racine ?
8. Quel fichier et quelle fonction de production sont concernés ?
9. Quelle correction a été appliquée ?
10. Quel est le corpus **« après »** ?
11. Est-il comparable au corpus « avant » ?
12. Les mêmes seuils / définitions ont-ils été utilisés ?
13. Quels résultats après correction sont suffisamment robustes pour être publiés ?
14. Existe-t-il une régression ultérieure ou un recalibrage qui rend ces valeurs historiques mais plus représentatives du HEAD ?
15. Si oui, comment faut-il les présenter honnêtement ?

### 3.4 Vérifier le code, pas seulement les rapports

Pour la cause et la correction, retrouver le code correspondant.

Inspecter les fichiers pertinents, probablement autour de :

```text
src/game/engine/electorate.ts
src/game/engine/polls.ts
src/game/engine/election.ts
src/game/engine/scoring.ts
```

Ne pas supposer que ces chemins sont encore exacts : les retrouver si l’architecture a changé.

Identifier :

- la fonction qui agrège le soutien national ;
- le mécanisme ayant produit la compression ;
- le correctif réellement présent dans le code ;
- le nom exact du paramètre ou de la transformation ;
- l’état actuel de ce paramètre au HEAD.

Si la correction a évolué depuis le rapport historique, le noter.

### 3.5 Vérifier les scripts d’audit et la reproductibilité

Trouver le ou les scripts ayant généré les corpus publiables.

Documenter :

- commande exacte ;
- nombre de seeds ;
- nombre de partis / agents ;
- nombre total de campagnes ;
- runtime si disponible ;
- format de sortie ;
- caractère déterministe / reproductible.

Si raisonnable en temps, relancer un **échantillon de vérification** ou le corpus complet si le script est prévu pour cela.

Ne pas altérer le modèle pour obtenir un résultat plus esthétique.

### 3.6 Vérifier les métriques candidates pour le carrousel

Chercher des métriques candidates limitées à l’histoire principale :

- taille du corpus avant ;
- définition et fréquence des courses comprimées avant ;
- taille du corpus après ;
- fréquence des courses comprimées après ;
- éventuellement fréquence des favoris dominants avant/après si elle est strictement issue du même protocole et aide réellement à comprendre ;
- éventuellement score maximal / dispersion si la provenance est parfaitement homogène ;
- nature exacte de la correction ;
- caractérisation de la cause racine.

Ne retenir que les métriques :
- simples ;
- traçables ;
- comparables ;
- pédagogiques.

**Deux bons chiffres valent mieux que six métriques secondaires.**

### 3.7 Vérifier les captures disponibles

Rechercher les captures du jeu déjà présentes dans le dépôt :

- bulletin / état de la course ;
- premier tour ;
- écrans de sondage ;
- éventuelles captures avant/après ;
- UI sans personnalité politique réelle visible.

Créer un inventaire des captures utilisables.

Contraintes :
- aucune personnalité politique réelle nommée ;
- aucun nom réel dans un screenshot ;
- aucune donnée incompatible avec la narration du slide ;
- aucune capture provenant d’un état obsolète présentée comme actuelle sans étiquette.

### 3.8 Vérifier la possibilité de régénérer des captures propres

Si nécessaire, identifier :
- seed ;
- parcours ;
- route ;
- fixture ;
- script Playwright ;
- environnement local.

Préférer des captures régénérées au HEAD si elles sont faciles à produire.

Ne jamais modifier le moteur du jeu pour fabriquer une capture.

---

## 4. Livrable intermédiaire — Tableau de métriques
### POINT DE CONTRÔLE HUMAIN OBLIGATOIRE

Avant tout storyboard, avant tout texte final et avant tout rendu de slide, produire un fichier :

```text
linkedin/vers-elysee-model-bug/METRICS_REVIEW.md
```

avec ce tableau minimal :

| Métrique / fait | Valeur ou formulation candidate | Fichier source | Ligne / section | Commit ou état du dépôt | Reproduit ? | Statut de vérification | Niveau de confiance | Usage envisagé |
|---|---|---|---|---|---|---|---|---|

Inclure également :

### A. Provenance du comparatif principal

```text
AVANT
- état / commit :
- script :
- corpus :
- définition de la métrique :

APRÈS
- état / commit :
- script :
- corpus :
- définition de la métrique :

Comparabilité :
- identique / comparable / non strictement comparable
- justification :
```

### B. Cause racine

```text
Cause racine confirmée :
Fichier :
Fonction :
Mécanisme :
Niveau de confiance :
```

### C. Correction

```text
Correction confirmée :
Fichier :
Fonction :
Paramètre / transformation :
État au HEAD :
```

### D. Captures disponibles

| Capture | Source | État / seed | Nom réel visible ? | Réutilisable ? | Commentaire |
|---|---|---|---|---|---|

### E. Risques éditoriaux détectés

Lister :
- métriques venant de versions différentes ;
- chiffre difficile à reproduire ;
- slide potentiel qui pourrait donner une impression prédictive ;
- screenshot contenant une personnalité réelle ;
- formulation pouvant exagérer le rôle de l’auteur ;
- toute ambiguïté.

---

### STOP OBLIGATOIRE

Après avoir produit `METRICS_REVIEW.md`, afficher dans le terminal :

```text
POINT DE CONTRÔLE MÉTRIQUES — EN ATTENTE DE VALIDATION D’AXEL
```

Puis **s’arrêter**.

Ne pas :
- créer le storyboard final ;
- écrire le post final ;
- créer les slides ;
- lancer Puppeteer ;
- générer de PNG ;
- générer de PDF.

Attendre une validation explicite d’Axel.

---

## 5. Phase 2 — Narration
### À EXÉCUTER UNIQUEMENT APRÈS VALIDATION DU TABLEAU DE MÉTRIQUES

Une fois les métriques validées par Axel, proposer un plan de **7 à 9 slides maximum**.

### 5.1 Principe

Chaque slide porte **une seule idée**.

La narration doit respecter :

> **problème → mesure → diagnostic → correction → validation**

Default recommandé : **8 slides**, si cela permet de raconter l’histoire sans surcharge.

### 5.2 Intention narrative recommandée

Ne pas copier aveuglément, mais utiliser cette structure comme garde-fou :

1. **Hook** — le retour de playtest / le problème.
2. **Pourquoi je n’ai pas corrigé à l’instinct** — transformer le ressenti en métrique.
3. **Le protocole** — corpus de simulations reproductibles.
4. **Le constat** — slide avant/après ou distribution faisant arrêter le scroll.
5. **La cause** — agrégation / modèle, expliquée simplement.
6. **La correction** — ce qui change dans le modèle, sans noyer dans le code.
7. **La validation** — nouveau corpus comparable, résultats.
8. **Ce que j’en retiens côté data** — démarche transférable + invitation à jouer.

Si 9 slides sont réellement nécessaires, ajouter uniquement une slide qui renforce :
- la méthodologie ;
- ou le rôle des seeds / de la reproductibilité.

Ne pas ajouter une slide « fonctionnalités du jeu ».

### 5.3 Règle de lisibilité

Une personne qui ne lit que :
- les titres ;
- les gros chiffres ;
- les légendes principales ;

doit comprendre l’histoire complète.

### 5.4 Présenter le plan avant rédaction finale

Créer :

```text
linkedin/vers-elysee-model-bug/STORYBOARD.md
```

avec :

| Slide | Idée unique | Titre provisoire | Preuve / métrique | Type de visuel | Rôle narratif |
|---|---|---|---|---|---|

### 5.5 Deuxième point d’arrêt uniquement si nécessaire

Si le storyboard respecte strictement la trame validée, poursuivre vers la Phase 3.

Si le storyboard nécessite de dévier substantiellement de :
> problème → mesure → diagnostic → correction → validation

alors afficher :

```text
POINT DE CONTRÔLE NARRATION — DÉVIATION À VALIDER
```

et attendre Axel.

Ne pas demander une validation inutile si le plan reste dans le cadre.

---

## 6. Phase 3 — Production

Après validation du tableau de métriques et validation éventuelle du storyboard, produire l’ensemble des livrables.

### 6.1 Slides

Produire **7 à 9 pages** maximum.

Dimensions exactes :

```text
1080 × 1350 px
ratio 4:5
PNG
```

Nommer :

```text
slide-01.png
slide-02.png
...
slide-0N.png
```

### 6.2 PDF

Assembler exactement les mêmes slides, dans le même ordre, dans :

```text
vers-elysee-data-model-linkedin-carousel.pdf
```

Le PDF doit être prêt pour un upload LinkedIn comme « document ».

### 6.3 Pipeline de rendu

Utiliser **HTML/CSS + Puppeteer**.

Contraintes :
- compatible Windows / PowerShell ;
- script reproductible ;
- attendre le chargement complet des polices ;
- rendre à 1080×1350 ;
- aucun redimensionnement destructeur post-rendu ;
- PDF généré à partir des mêmes pages / mêmes dimensions.

Produire :
- templates HTML ;
- CSS ;
- script de rendu ;
- éventuel script d’assemblage PDF ;
- instructions de reproduction.

Exécuter réellement le rendu.

### 6.4 Figures / graphiques

Les graphiques doivent être simples.

Privilégier :
- histogramme / distribution avant-après ;
- barres avant-après ;
- schéma minimal de l’agrégation.

Interdits :
- axes tronqués pour amplifier artificiellement un changement ;
- graphiques 3D ;
- jauges décoratives ;
- chiffres sans unité ;
- données synthétiques présentées comme mesurées ;
- courbes inutilement complexes.

Chaque graphique doit indiquer clairement :
- unité ;
- période / état ;
- avant / après ;
- taille du corpus si utile.

### 6.5 Le slide « stop-scroll »

Au moins une slide doit permettre de comprendre le résultat principal en **moins d’une demi-seconde**.

Elle doit mettre en avant un comparatif avant/après **uniquement avec les valeurs validées dans `METRICS_REVIEW.md`**.

Le chiffre doit dominer visuellement.

### 6.6 Captures du jeu

Utiliser les captures uniquement si elles servent l’histoire.

Bon usage :
- montrer le problème tel qu’un joueur peut le percevoir ;
- montrer que le sujet vient d’un produit réel.

Mauvais usage :
- transformer le carousel en visite guidée du jeu ;
- multiplier les screenshots ;
- afficher des éléments politiques non nécessaires.

Toutes les captures doivent être vérifiées pour l’absence de noms de personnalités politiques réelles.

---

## 7. Contraintes éditoriales et d’honnêteté
### BLOQUANTES

### 7.1 Jamais de prétention prédictive

Le projet est un **simulateur de jeu calibré et audité**, pas un modèle de prévision de l’élection présidentielle.

Interdictions absolues :

- « prédire 2027 » ;
- « prédiction présidentielle » ;
- « IA électorale » ;
- « modèle scientifique de l’élection » ;
- « résultats scientifiquement exacts » ;
- toute formulation laissant penser que le moteur estime ce qui va réellement se produire.

### 7.2 Aucune personnalité politique réelle nommée

Les candidats du jeu sont pseudonymisés.

Ne mettre :
- aucun nom réel dans le texte du carrousel ;
- aucun nom réel dans une capture ;
- aucun nom réel dans une légende ;
- aucun portrait réel.

Si une capture en contient un, la régénérer ou ne pas l’utiliser.

### 7.3 Ne jamais mélanger des métriques provenant d’états différents

Le dépôt contient plusieurs générations de rapports et plusieurs versions du moteur.

Interdiction de combiner deux chiffres provenant de commits différents comme s’ils décrivaient le même système.

Chaque métrique publiée doit être :

- soit vérifiée sur le HEAD courant ;
- soit explicitement présentée comme une mesure historique « avant correction » ;
- soit explicitement présentée comme une mesure « après correction » issue d’un corpus directement comparable.

Si la comparabilité n’est pas parfaite, le dire ou ne pas utiliser la métrique.

### 7.4 Rôle de l’IA assumé franchement

Le projet a été largement développé avec **Claude Code**.

La formulation juste est :

> Axel a conçu le système, posé les hypothèses, défini les métriques, commandé et structuré les audits, challengé les résultats, réalisé des playtests et piloté les itérations ; Claude Code a été utilisé comme outil agentique de développement et d’exécution.

Ne jamais suggérer :

> « J’ai écrit seul des dizaines de milliers de lignes de TypeScript. »

La mention de l’utilisation de Claude Code doit apparaître **clairement dans le texte du post**, pas cachée en commentaire ou en note de bas de page.

### 7.5 Pas de sur-vente des scores automatisés

Si une métrique de fun / rejouabilité apparaît malgré tout — ce qui n’est pas recommandé pour ce post — préciser qu’elle provient d’agents / heuristiques automatisés et non d’une enquête humaine.

Pour ce carrousel, éviter ces métriques sauf nécessité absolue.

---

## 8. Contraintes visuelles et de format

### 8.1 Support

Carrousel LinkedIn :

```text
1080×1350 px
ratio 4:5
PNG + PDF unique
7 à 9 slides
```

### 8.2 Mobile first

Considérer qu’une majorité des lecteurs verra les slides sur téléphone.

Règles :

- corps de texte **32 px minimum** dans le référentiel 1080×1350 ;
- titres nettement plus grands ;
- marges généreuses ;
- contraste élevé ;
- pas de pavé dense ;
- idéalement moins de **40 mots par slide** ;
- une seule idée par slide ;
- ne jamais réduire la typo pour faire entrer trop de texte.

### 8.3 Identité visuelle

Cohérence avec le portfolio / précédent post LinkedIn.

Direction :

**Ambré — éditorial data premium**

Palette :
- fond : graphite profond / sombre chaud ;
- accent : ambre ;
- texte principal : blanc cassé / crème ;
- textes secondaires : gris chaud à contraste suffisant.

Typographies :
- **Fraunces** — titres ;
- **Inter** — texte courant ;
- **JetBrains Mono** — chiffres, métriques, éléments de code / labels techniques.

Ne pas partager ou exporter les fichiers de police eux-mêmes dans les livrables.

### 8.4 Style

Rechercher :
- sobre ;
- éditorial ;
- data-journalisme ;
- premium ;
- lisible ;
- beaucoup d’espace négatif ;
- hiérarchie nette.

Éviter :
- esthétique cyberpunk ;
- néons ;
- cartes SaaS génériques ;
- gradients gratuits ;
- illustration politique caricaturale ;
- effets « election night » trop patriotiques ;
- surcharge d’icônes ;
- emojis dans les visuels ;
- icônes décoratives sans fonction.

### 8.5 Cohérence avec le précédent carrousel

Le nouveau carrousel doit sembler appartenir à la même « collection » que le post sur les retraites grâce à :
- même rigueur ;
- même sobriété ;
- même format ;
- même sens de la hiérarchie ;
- même goût pour les figures simples.

Mais il peut être plus sombre, plus éditorial et plus technique.

### 8.6 Premier slide

Le premier slide doit contenir :
- le hook ;
- **Axel Corral** ;
- une indication visuelle discrète du thème data/simulation.

Il doit fonctionner comme couverture autonome.

### 8.7 Dernier slide

Le dernier slide doit contenir :
- conclusion courte ;
- invitation à jouer / découvrir le projet ;
- signature discrète ;
- URL du portfolio : `[À CONFIRMER PAR AXEL]`.

Ne pas mettre le lien externe principal dans le corps du post LinkedIn : il ira en premier commentaire.

---

## 9. Texte du post LinkedIn

Produire :

```text
linkedin/vers-elysee-model-bug/POST.md
```

### 9.1 Langue et voix

- français ;
- première personne ;
- direct ;
- factuel ;
- sans esbroufe ;
- niveau technique compréhensible par un recruteur data non spécialiste du jeu.

### 9.2 Hook

Les deux premières lignes sont prioritaires.

Objectif :
- environ 200 caractères maximum avant la coupure ;
- tension immédiate ;
- pas de longue mise en contexte.

Le hook doit partir du problème / feedback / découverte.

Ne pas commencer par :

> « Je suis ravi de vous présenter… »

### 9.3 Longueur

Cible :

```text
900 à 1400 caractères
```

Paragraphes :
- 1 à 3 lignes ;
- rythmes variés.

### 9.4 Interdits stylistiques

Ne pas utiliser :
- emojis en puces ;
- `🚀` ;
- « Voici pourquoi 👇 » ;
- questions rhétoriques empilées ;
- « game-changer » ;
- « incroyable » ;
- phrases artificiellement construites en triades rythmiques ;
- tirets cadratins décoratifs partout ;
- ton motivational LinkedIn générique ;
- jargon pour le jargon.

Le texte doit ressembler à une personne qui décrit un vrai problème qu’elle a rencontré.

### 9.5 Rôle de Claude Code

Inclure naturellement une phrase claire indiquant que Claude Code a servi d’outil agentique pour implémenter / exécuter une partie importante du projet, tout en explicitant le rôle d’Axel dans :
- conception ;
- hypothèses ;
- protocoles ;
- métriques ;
- audits ;
- interprétation ;
- playtests ;
- itérations.

### 9.6 Fin

Terminer par :
- invitation à tester le jeu / regarder le projet ;
- mention que le lien est en premier commentaire ou formulation équivalente.

Ne pas mettre l’URL externe dans le corps du post.

---

## 10. Premier commentaire

Produire dans `POST.md` une section :

```text
## Premier commentaire
```

Contenant :
- lien vers le projet / dépôt / portfolio ;
- une phrase utile, pas juste l’URL.

URL exacte du projet ou dépôt public :
`[À CONFIRMER PAR AXEL]`

URL du portfolio :
`[À CONFIRMER PAR AXEL]`

Si le dépôt permet d’identifier de manière certaine un lien public destiné à être partagé, le proposer dans le tableau de validation mais ne pas deviner.

---

## 11. Hashtags

Fournir **3 à 5 hashtags maximum**.

Priorité à :
- data ;
- analytics ;
- data engineering / data science selon l’angle final ;
- éventuellement AI engineering si le rôle de Claude Code est réellement pertinent.

Éviter les hashtags politiques.

---

## 12. Alt-texts

Créer :

```text
linkedin/vers-elysee-model-bug/ALT_TEXTS.md
```

Fournir **un texte alternatif par slide**.

Chaque alt-text doit :
- expliquer le contenu informationnel ;
- expliciter le sens d’un graphique ;
- donner les chiffres importants ;
- éviter les descriptions décoratives inutiles.

---

## 13. Arborescence de sortie

Créer exactement un sous-dossier dédié :

```text
linkedin/
└── vers-elysee-model-bug/
    ├── METRICS_REVIEW.md
    ├── STORYBOARD.md
    ├── POST.md
    ├── ALT_TEXTS.md
    ├── README.md
    ├── evidence/
    │   ├── METRICS_SOURCES.md
    │   └── SCREENSHOT_INVENTORY.md
    ├── src/
    │   ├── carousel.html
    │   └── carousel.css
    ├── scripts/
    │   ├── render-carousel.mjs
    │   └── build-pdf.mjs
    └── output/
        ├── slide-01.png
        ├── slide-02.png
        ├── ...
        ├── slide-0N.png
        └── vers-elysee-data-model-linkedin-carousel.pdf
```

Créer les fichiers de Phase 2/3 uniquement après le point de contrôle métriques.

`README.md` doit expliquer en quelques commandes PowerShell comment reproduire le rendu.

---

## 14. Règles de source et de traçabilité

Créer :

```text
evidence/METRICS_SOURCES.md
```

Pour chaque chiffre réellement publié :

```text
Métrique :
Valeur affichée :
État :
Source :
Section / ligne :
Script :
Commande :
Commit :
Remarque méthodologique :
```

Un lecteur interne doit pouvoir retrouver chaque chiffre sans interprétation.

Pour chaque graphique :
- préciser le fichier de données source ;
- préciser si les données ont été recalculées ou extraites ;
- conserver les unités.

---

## 15. Checklist d’auto-vérification finale

Avant de rendre la main, exécuter et **cocher explicitement** la checklist suivante dans :

```text
linkedin/vers-elysee-model-bug/README.md
```

### Données

- [ ] Chaque chiffre visible dans un slide est relié à une source précise.
- [ ] Chaque chiffre du post est relié à une source précise.
- [ ] Les valeurs avant/après proviennent d’états comparables ou sont clairement qualifiées.
- [ ] Aucun chiffre provenant d’un ancien rapport n’est présenté comme mesure du HEAD sans justification.
- [ ] Aucune métrique n’a été inventée.
- [ ] Aucun paramètre du moteur n’a été modifié pour améliorer le storytelling.

### Honnêteté

- [ ] Aucune formulation prédictive sur 2027.
- [ ] Le projet est présenté comme simulateur / modèle de jeu, pas comme modèle de prévision.
- [ ] Le rôle de Claude Code est mentionné clairement dans le texte du post.
- [ ] Le rôle d’Axel n’est pas exagéré ni minimisé.
- [ ] Aucun score automatisé de fun n’est présenté comme une mesure humaine.

### Politique / confidentialité éditoriale

- [ ] Aucun nom de personnalité politique réelle dans les slides.
- [ ] Aucun nom réel dans les screenshots.
- [ ] Aucun portrait réel.
- [ ] Aucun ton militant.
- [ ] La politique reste le contexte, pas la conclusion.

### Narration

- [ ] La structure problème → mesure → diagnostic → correction → validation est intacte.
- [ ] Une seule idée par slide.
- [ ] Aucun slide « fonctionnalités du jeu » hors sujet.
- [ ] Le slide avant/après se comprend en moins d’une seconde.
- [ ] Le dernier slide possède un CTA simple.

### Texte LinkedIn

- [ ] Hook d’environ 200 caractères maximum avant coupure.
- [ ] Corps entre 900 et 1400 caractères.
- [ ] Pas d’emoji de remplissage.
- [ ] Pas de « Voici pourquoi 👇 ».
- [ ] Pas de jargon marketing.
- [ ] Lien externe prévu en premier commentaire.
- [ ] 3 à 5 hashtags maximum.

### Visuel

- [ ] 7 à 9 slides.
- [ ] Chaque PNG fait exactement 1080×1350.
- [ ] Corps de texte ≥32 px.
- [ ] Contraste lisible.
- [ ] Marges cohérentes.
- [ ] Fraunces / Inter / JetBrains Mono utilisés comme prévu.
- [ ] Aucun texte déborde.
- [ ] Aucun graphique ne tronque son axe pour dramatiser.
- [ ] Unités et légendes visibles.
- [ ] Pas d’emoji dans les visuels.
- [ ] Aucun élément purement décoratif qui gêne la lecture.

### Fichiers

- [ ] Tous les PNG sont présents et numérotés dans l’ordre.
- [ ] Le PDF contient exactement les mêmes pages dans le même ordre.
- [ ] Le PDF s’ouvre correctement.
- [ ] `POST.md` est complet.
- [ ] `ALT_TEXTS.md` contient un alt-text par slide.
- [ ] Le script Puppeteer permet de régénérer le carousel sous Windows.
- [ ] Le README contient les commandes de reproduction.

### Git

- [ ] Aucun commit créé.
- [ ] Aucun push effectué.
- [ ] Aucun fichier du moteur du jeu modifié.
- [ ] `git status` final vérifié.

---

## 16. Ce que tu ne dois pas faire

### Interdictions absolues

- Ne **commiter aucun code ni aucun fichier**.
- Ne pousser aucun changement.
- Ne modifier aucune donnée ou règle du jeu.
- Ne modifier aucun paramètre pour obtenir un chiffre plus spectaculaire.
- Ne fabriquer aucun chiffre.
- Ne combiner des métriques de versions différentes sans qualification.
- Ne dépasser **9 slides**.
- Ne produire aucune slide avant validation explicite du tableau de métriques.
- Ne transformer le post en promotion générale du jeu.
- Ne transformer le post en opinion politique.
- Ne présenter le moteur comme prédictif.
- Ne nommer aucune personnalité politique réelle.
- Ne mettre de disclaimer juridique sur chaque slide.
- Ne cacher le rôle de Claude Code.
- Ne télécharger / distribuer des fichiers de police dans les livrables.
- Ne sacrifier la lisibilité mobile pour ajouter du contenu.

---

## 17. Critère de réussite

La mission est réussie si un recruteur Data / Analytics peut parcourir le carrousel en moins de deux minutes et comprendre :

1. qu’un feedback qualitatif a été transformé en problème mesurable ;
2. qu’un protocole reproductible de simulation massive a été utilisé ;
3. qu’une anomalie de distribution a été objectivée ;
4. qu’une cause racine dans le modèle a été identifiée ;
5. qu’une correction a été testée sur un corpus comparable ;
6. qu’Axel sait raisonner en termes de **modélisation, expérimentation, qualité de données, validation et produit** ;
7. que Claude Code a été utilisé comme outil agentique, sans que l’auteur prétende avoir tout codé manuellement.

Le lecteur doit repartir avec l’impression :

> **« Il ne s’est pas contenté de construire un projet. Il a instrumenté son système, mesuré ses défauts et itéré à partir des données. »**

---

## 18. Démarrage de la mission

Commencer maintenant par la **Phase 1 — Établissement des faits**.

Ne générer aucun carousel.

Ne rédiger aucun post final.

Produire uniquement l’audit de provenance et `METRICS_REVIEW.md`, puis s’arrêter au point de contrôle obligatoire.

---

## 19. Points externes à confirmer par Axel

Ces informations ne doivent pas être inventées si elles ne peuvent pas être établies de façon certaine depuis le dépôt :

1. **URL publique exacte du portfolio** : `[À CONFIRMER PAR AXEL]`
2. **URL publique exacte à mettre en premier commentaire pour « Vers l’Élysée »** : `[À CONFIRMER PAR AXEL]`
3. Si plusieurs liens publics existent, privilégier par défaut :
   - une version jouable publique si elle existe et fonctionne ;
   - sinon le dépôt public ;
   - puis le portfolio.

Option retenue par défaut pour le cadrage : **8 slides**, ajustables entre 7 et 9 uniquement si les faits vérifiés l’exigent.
