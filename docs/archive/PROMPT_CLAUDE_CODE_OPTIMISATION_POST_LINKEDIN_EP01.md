# PROMPT CLAUDE CODE — OPTIMISATION DU TEXTE LINKEDIN
## Vers l’Élysée — Data Notebook · Épisode 01

Tu interviens comme **Senior LinkedIn Copywriter**, **Data Storyteller**, **Technical Editor** et **Product/Portfolio Reviewer**.

Tu connais déjà très bien le projet **Vers l’Élysée**, mais pour cette mission tu dois **repartir des sources réelles présentes dans le dépôt** et ne jamais te fier uniquement à ta mémoire.

L’objectif est de produire **le meilleur texte possible pour accompagner sur LinkedIn le carrousel “Vers l’Élysée — Data Notebook · Épisode 01”**.

Ce texte doit être prêt à publier tel quel.

---

# 1. UTILISER LES SKILLS DISPONIBLES

Avant d’écrire, inspecte les skills / instructions disponibles dans l’environnement Claude Code.

Cherche notamment, sans inventer leur existence :

```text
.claude/skills/
.claude/
skills/
```

et toute documentation disponible pour :

- copywriting ;
- LinkedIn ;
- social media ;
- personal branding ;
- data storytelling ;
- editorial writing ;
- technical writing ;
- portfolio / career positioning.

Si des skills pertinents existent :

1. lis-les ;
2. applique-les réellement ;
3. indique brièvement dans le rapport final lesquels ont été utilisés.

Si aucun skill pertinent n’existe, continue sans en inventer ni en installer arbitrairement.

---

# 2. IDENTIFIER LE BON CARROUSEL

Localise la version finale de :

```text
Vers l’Élysée — Data Notebook · Épisode 01
```

Le carrousel final est celui qui raconte notamment :

- ce qu’est Vers l’Élysée ;
- le fonctionnement probabiliste des décisions ;
- le retour de playtest disant que les résultats « sonnaient faux » ;
- la formalisation du problème ;
- le protocole de 10 008 campagnes ;
- le constat des 76,2 % de premiers tours artificiellement serrés ;
- le diagnostic ;
- la correction ;
- la validation à 17,8 % ;
- l’apparition de favoris nets dans 22,5 % des simulations selon la définition retenue ;
- la conclusion « mesurer avant de corriger, valider après ».

ATTENTION :

Il existe potentiellement une ancienne version / un ancien carrousel plus court qui raconte quasiment la même histoire.

Ne mélange pas les deux.

Utilise uniquement **l’épisode 01 final** comme référence éditoriale principale.

---

# 3. VÉRIFIER TOUS LES CHIFFRES

Avant d’écrire le post, vérifie dans les sources du dépôt :

- le nombre exact de campagnes simulées ;
- le nombre de partis ;
- le nombre de stratégies / agents ;
- le nombre de seeds ;
- la définition exacte d’une « course artificiellement serrée » ;
- 76,2 % ;
- 17,8 % ;
- 22,5 % ;
- la définition exacte d’un « favori net » ;
- la nature de la correction ;
- toute nuance méthodologique importante.

Sources possibles :

```text
AUDIT_POST_CORRECTIONS.md
REALITY_GROUNDING_BASELINE.md
REALITY_GROUNDED_CAMPAIGN_REPORT.md
rapports d’audit électoral
scripts de simulation
storyboard / metrics review de l’épisode 01
sources du carrousel
```

Ne prends aucun chiffre depuis ce prompt s’il est contredit par la version finale du dépôt.

Créer une mini table interne :

| Claim | Valeur | Source | Utilisable publiquement ? |
|---|---:|---|---|

Le texte LinkedIn final ne doit contenir **aucune affirmation non vérifiée**.

---

# 4. OBJECTIF DU POST

Le texte LinkedIn doit faire trois choses :

### A. Donner envie d’ouvrir le carrousel

Le texte ne doit pas résumer les 11 slides au point de rendre le swipe inutile.

### B. Montrer une démarche Data crédible

Le lecteur doit comprendre naturellement la démarche :

```text
feedback qualitatif
→ question mesurable
→ protocole reproductible
→ simulation à grande échelle
→ diagnostic
→ correction
→ validation
```

### C. Positionner l’auteur comme quelqu’un capable de :

- construire un produit ;
- formaliser un problème flou ;
- instrumenter / mesurer ;
- raisonner sur un modèle probabiliste ;
- tester une hypothèse ;
- valider un correctif ;
- communiquer clairement les résultats.

Le texte ne doit PAS ressembler à une candidature ou à un CV déguisé.

---

# 5. PUBLIC CIBLE

Le post doit fonctionner pour plusieurs types de lecteurs :

- recruteurs Data / Analytics / Data Engineering ;
- Data Analysts / Data Scientists / Analytics Engineers ;
- Product / Tech ;
- personnes intéressées par la simulation ou le game design ;
- public LinkedIn non technique.

Le lecteur ne doit pas avoir besoin de connaître le projet auparavant.

---

# 6. PREMIÈRE PHRASE

La première phrase doit immédiatement expliquer l’objet.

Elle doit donner envie de continuer sans être clickbait.

Évalue plusieurs hooks.

Les familles possibles à tester :

### Hook objet

```text
J’ai construit un simulateur de campagne présidentielle.
```

### Hook problème

```text
Un playtest m’a dit que les résultats de mon simulateur « sonnaient faux ».
```

### Hook résultat

```text
76,2 % des premiers tours de mon simulateur étaient artificiellement serrés.
```

### Hook démarche

```text
Quand un utilisateur me dit que « les résultats sonnent faux », je peux retoucher le modèle à l’instinct — ou mesurer le problème.
```

Ne garde pas automatiquement l’un de ces exemples.

Compare-les en fonction :

- arrêt du scroll ;
- compréhension immédiate ;
- crédibilité ;
- curiosité ;
- cohérence avec la première slide du carrousel ;
- risque de surpromesse.

---

# 7. TON

Le ton doit être :

```text
personnel
professionnel
curieux
factuel
confiant
sans arrogance
```

Éviter :

- ton « influenceur LinkedIn » ;
- faux suspense ;
- phrases artificielles du type « Et là, tout a changé » ;
- excès de storytelling ;
- superlatifs ;
- vocabulaire corporate vide ;
- emojis décoratifs ;
- hooks du type « Vous ne devinerez jamais... » ;
- listes artificiellement longues ;
- abus de retours à la ligne.

Le texte doit donner l’impression d’avoir été écrit par une personne qui a réellement fait le travail.

---

# 8. NE PAS DUPLIQUER LE CARROUSEL

Le post doit donner :

- le contexte ;
- la question ;
- 1 ou 2 résultats forts ;
- la démarche générale ;
- une raison de swiper.

Mais il doit **laisser au carrousel** :

- le détail du pipeline ;
- le diagnostic précis ;
- l’explication graphique ;
- la correction détaillée ;
- une partie de la validation.

Le lecteur qui lit seulement le post doit comprendre l’intérêt.

Le lecteur qui ouvre le carrousel doit encore apprendre quelque chose.

---

# 9. FORMAT RECOMMANDÉ

Vise une longueur naturelle de :

```text
1 000 à 1 800 caractères environ
```

Tu peux dépasser légèrement si cela améliore réellement le texte.

Structure recommandée :

```text
Hook

Contexte du projet

Problème observé

Démarche de mesure

1 ou 2 résultats forts

Ce que raconte le carrousel

Leçon / conclusion

CTA
```

Ne force pas cette structure si une meilleure version apparaît.

---

# 10. CHIFFRES

Les chiffres doivent être rares et mémorables.

Priorité aux nombres qui racontent réellement l’histoire.

Par exemple, si les sources les confirment :

```text
10 008 campagnes
76,2 %
17,8 %
```

Le chiffre `22,5 %` peut être ajouté uniquement si :

- il améliore la narration ;
- il reste facile à comprendre ;
- sa définition ne demande pas un paragraphe d’explication.

Sinon, laisse-le au carrousel.

Ne transforme pas le post en tableau de résultats.

---

# 11. PRÉSENTATION DE CLAUDE CODE / IA

Le carrousel contient déjà une note de transparence sur Claude Code.

Décide si cette information doit ou non apparaître dans le texte du post.

Critère :

- ne pas détourner le sujet vers « j’ai utilisé une IA » ;
- ne pas donner l’impression que le travail analytique a été délégué sans supervision ;
- rester transparent si cela est utile.

Si mentionné, la formulation doit rester cohérente avec le projet :

```text
Claude Code comme outil agentique d’implémentation ;
conception, hypothèses, métriques, protocoles, audits et interprétation pilotés par l’auteur.
```

Ne consacre pas plus d’une phrase à ce sujet.

---

# 12. CTA

Le CTA doit être sobre.

Le jeu étant testable en ligne, privilégier quelque chose du type :

```text
Le jeu est testable dans le navigateur — lien en commentaire.
```

ou :

```text
Vous pouvez tester Vers l’Élysée — lien en commentaire.
```

Évite :

- « Qu’en pensez-vous ? » par réflexe ;
- demandes artificielles de likes/commentaires ;
- « N’hésitez pas à partager » ;
- CTA multiples.

Le carrousel lui-même possède déjà son CTA.

---

# 13. HASHTAGS

Décide si les hashtags apportent réellement quelque chose.

Si oui :

- maximum 3 à 4 ;
- uniquement pertinents ;
- placés à la fin ;
- ne pas utiliser des hashtags génériques inutiles.

Exemples possibles :

```text
#DataScience
#DataAnalytics
#Simulation
#GameDesign
```

Ne les utilise pas automatiquement.

---

# 14. LIEN

Le lien vers Vers l’Élysée doit être prévu pour être placé **en premier commentaire**, sauf si les règles / pratiques retenues par les skills disponibles recommandent explicitement autre chose.

Prépare également le texte exact du premier commentaire :

```text
Tester Vers l’Élysée : <URL>
```

Utilise l’URL de production réelle si elle est connue dans le dépôt/configuration.

Ne devine pas l’URL.

---

# 15. ANALYSE ÉDITORIALE AVANT ÉCRITURE

Avant de produire les versions finales, évalue le post selon les critères suivants :

| Critère | Importance |
|---|---:|
| Hook | très élevée |
| Compréhension du jeu | très élevée |
| Curiosité pour le carrousel | très élevée |
| Crédibilité Data | très élevée |
| Naturel / humain | très élevée |
| Concision | élevée |
| Positionnement professionnel | élevée |
| Non-redondance avec le carrousel | élevée |
| CTA | moyenne |
| Hashtags | faible |

---

# 16. PRODUIRE 3 VERSIONS

Créer trois variantes réellement différentes.

## Version A — recommandée

La meilleure combinaison :

```text
storytelling
+
crédibilité Data
+
accessibilité
+
impact LinkedIn
```

C’est celle qui doit avoir le plus de chances d’être publiée.

## Version B — plus courte / plus percutante

Plus condensée.

Hook fort.

Moins de détails méthodologiques.

## Version C — plus Data / technique

Pour un lectorat plus professionnel Data.

Mettre davantage en avant :

- protocole ;
- reproductibilité ;
- validation ;
- modèle probabiliste.

Sans devenir académique.

---

# 17. NOTER LES 3 VERSIONS

Évaluer chaque version sur 10 :

| Version | Hook | Clarté | Crédibilité | Curiosité | Naturel | Positionnement Data | Total |
|---|---:|---:|---:|---:|---:|---:|---:|

Puis choisir une seule version :

```text
RECOMMANDATION FINALE
```

Expliquer en 3 à 6 lignes pourquoi elle est supérieure.

---

# 18. PAS DE « TEXTE IA »

Effectuer un dernier passage d’édition spécifiquement pour éliminer les marqueurs fréquents d’écriture générée :

- symétries artificielles ;
- phrases toutes de même longueur ;
- répétition de « plutôt que » ;
- multiplication des deux-points ;
- formules génériques ;
- transitions trop parfaites ;
- excès de punchlines ;
- répétition du même concept ;
- conclusion moralisatrice.

Le texte final doit être fluide à voix haute.

Lis-le mentalement comme un vrai post LinkedIn.

---

# 19. LIVRABLE

Créer :

```text
LINKEDIN_EP01_POST_FINAL.md
```

Structure :

```markdown
# Vers l’Élysée — Data Notebook · Épisode 01

## Sources vérifiées
...

## Version A — Recommandée
...

## Version B — Courte
...

## Version C — Data
...

## Évaluation
...

## Recommandation finale
...

## POST FINAL — PRÊT À COPIER-COLLER

[texte uniquement]

## PREMIER COMMENTAIRE

[texte du commentaire avec le lien]

## Hashtags retenus
...
```

La section :

```text
POST FINAL — PRÊT À COPIER-COLLER
```

ne doit contenir aucune annotation, aucune note, aucun commentaire éditorial.

Elle doit pouvoir être copiée directement dans LinkedIn.

---

# 20. INTERDICTIONS

Ne pas :

- modifier le carrousel ;
- modifier le moteur ;
- modifier les résultats ;
- inventer un chiffre ;
- utiliser une ancienne métrique incompatible avec l’épisode final ;
- présenter Vers l’Élysée comme un outil de prédiction ;
- présenter les résultats simulés comme des intentions de vote réelles ;
- inventer de retours utilisateurs ;
- inventer de citations ;
- exagérer la portée du projet ;
- écrire un post façon « hustle / personal branding » ;
- faire de la politique partisane ;
- réécrire le projet comme s’il s’agissait d’une startup.

---

# 21. CONTRÔLE FINAL

Avant de terminer, vérifie :

- [ ] le jeu est compréhensible pour quelqu’un qui ne le connaît pas ;
- [ ] le hook est fort sans clickbait ;
- [ ] tous les chiffres sont sourcés ;
- [ ] le post ne résume pas tout le carrousel ;
- [ ] le lecteur a une raison de swiper ;
- [ ] la démarche Data est évidente ;
- [ ] le texte sonne humain ;
- [ ] aucun jargon inutile ;
- [ ] aucun chiffre inutile ;
- [ ] aucun claim de prédiction ;
- [ ] CTA unique ;
- [ ] lien prévu en commentaire ;
- [ ] version finale réellement prête à publier.

---

# 22. SORTIE TERMINALE

À la fin, afficher uniquement un résumé :

```text
VERS L’ÉLYSÉE — LINKEDIN EP01

Carrousel final identifié : OUI/NON
Claims vérifiés : OUI/NON
Skills utilisés :
Longueur version finale :
Hook retenu :
Chiffres retenus :
Hashtags :
Premier commentaire préparé : OUI/NON

Version recommandée :
A / B / C

Livrable :
LINKEDIN_EP01_POST_FINAL.md

VERDICT :
READY TO PUBLISH / BLOCKED
```

Commence par identifier la version finale de l’épisode 01, lire les skills disponibles, puis vérifier les claims dans les rapports/source files avant de rédiger la moindre phrase du post.
