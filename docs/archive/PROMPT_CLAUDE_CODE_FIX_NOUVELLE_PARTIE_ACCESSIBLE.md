# PROMPT CLAUDE CODE — CORRECTIF CIBLÉ « NOUVELLE PARTIE »
## Vers l’Élysée — rendre une nouvelle campagne réellement accessible lorsqu’une sauvegarde existe

Tu interviens comme **Senior Next.js Engineer**, **State Management Engineer**, **QA Lead** et **UX Reviewer**.

Cette mission est un **correctif ciblé** à exécuter avant le déploiement production final.

Le problème observé est reproductible sur la page d’accueil lorsqu’une campagne sauvegardée existe :

- le bouton principal **« Lancer une campagne »** ramène vers la campagne déjà en cours ;
- le bouton **« Nouvelle partie »** situé sous **« Reprendre »** ramène lui aussi vers la campagne déjà en cours ;
- résultat : il est impossible de démarrer volontairement une nouvelle campagne sans terminer la précédente.

Le correctif doit rendre les intentions utilisateur distinctes et fiables :

```text
Reprendre
≠
Nouvelle partie
```

Ne touche pas au problème de calibration / sondages / dynamique électorale dans cette mission. Il fera l’objet d’un audit séparé.

---

# 1. OBJECTIF PRODUIT

À la fin de la mission :

## « Reprendre »

Doit :

- charger exactement la campagne active existante ;
- conserver son état, sa seed, sa progression et ses décisions ;
- reprendre au bon écran.

## « Nouvelle partie »

Doit :

- démarrer réellement un nouveau parcours ;
- ne jamais rediriger silencieusement vers la campagne active ;
- repartir du flux initial approprié du jeu : sélection / création de candidature / configuration initiale selon l’architecture réelle du produit ;
- générer un nouvel état de partie propre.

## « Lancer une campagne »

Lorsqu’une sauvegarde active existe, ce bouton ne doit plus agir comme un alias implicite de « Reprendre ».

Il doit conduire vers le **même flux intentionnel de nouvelle campagne** que « Nouvelle partie », ou vers le mécanisme UX déjà prévu par le produit pour créer une nouvelle campagne.

Le CTA « Reprendre » reste l’unique action dont l’intention est de continuer la partie existante.

---

# 2. RÈGLE DE SÉCURITÉ DES SAUVEGARDES

Ne supprime jamais silencieusement une campagne en cours.

Avant de coder le comportement de « Nouvelle partie », inspecte l’architecture réelle :

- nombre de slots de sauvegarde ;
- archives ;
- historique de campagnes ;
- mécanisme de sauvegarde active ;
- comportement prévu lorsqu’une nouvelle partie est créée ;
- éventuelle conservation de l’ancienne campagne dans les archives.

## Cas A — l’architecture permet de conserver la campagne précédente

Utilise le mécanisme existant.

La nouvelle campagne devient active sans détruire inutilement l’ancienne.

## Cas B — le produit ne possède qu’un slot actif et démarrer une nouvelle campagne remplace réellement l’ancienne

Ajouter une confirmation explicite AVANT toute destruction :

```text
Démarrer une nouvelle campagne ?

Votre campagne en cours sera remplacée.
Cette action ne peut pas être annulée.
```

Les libellés exacts peuvent être adaptés à la terminologie réelle de l’application.

Boutons :

```text
Annuler
Démarrer une nouvelle campagne
```

### Annuler

Doit :

- fermer la confirmation ;
- laisser la sauvegarde strictement intacte ;
- laisser l’utilisateur sur la page courante.

### Confirmer

Doit ensuite appeler **une seule fonction métier explicite de démarrage d’une nouvelle partie**.

Ne disperse pas la suppression de state/localStorage dans plusieurs composants UI.

---

# 3. AUDIT INITIAL — OBLIGATOIRE

Avant toute écriture :

```powershell
git status
git branch --show-current
git log --oneline --decorate -n 20
```

Puis localise et lis tout le chemin réel associé à :

- page d’accueil ;
- CTA « Lancer une campagne » ;
- carte « Campagne sauvegardée » ;
- bouton « Reprendre » ;
- bouton « Nouvelle partie » ;
- route de campagne ;
- route de création / sélection initiale ;
- store du jeu ;
- persistance locale ;
- chargement de sauvegarde ;
- guard / redirect automatique ;
- hydration ;
- éventuel `resumeGame`, `startGame`, `newGame`, `resetGame`, `loadGame` ou équivalent.

Ne déduis pas la cause depuis l’interface.

**Trace le flux de clic jusqu’au state final.**

Créer une courte note dans le rapport final :

```text
CAUSE RACINE
CTA Lancer une campagne :
CTA Nouvelle partie :
Redirection / guard :
State/persistence impliqué :
```

---

# 4. REPRODUCTION AVANT CORRECTION

Avant de modifier le code, reproduis le bug avec une sauvegarde active.

Documente :

```text
1. campagne active présente
2. clic « Reprendre »
3. résultat
4. retour accueil
5. clic « Nouvelle partie »
6. résultat
7. retour accueil
8. clic « Lancer une campagne »
9. résultat
```

Le bug est considéré confirmé si les actions de nouvelle campagne retombent sur la campagne sauvegardée.

Si un E2E existant peut servir, utilise-le.

Sinon crée une fixture/test minimal reproductible.

---

# 5. TROUVER LA CAUSE RACINE

Audite notamment les scénarios suivants, sans en supposer aucun :

- les deux boutons partagent accidentellement le même handler ;
- les deux naviguent vers la même route ;
- une route de démarrage détecte automatiquement une sauvegarde et exécute un resume ;
- un guard global redirige toute navigation campagne vers le run actif ;
- le store hydrate une sauvegarde après qu’un reset a déjà été demandé ;
- `newGame` ne purge pas correctement l’état actif ;
- un flag « nouvelle partie » est perdu lors du changement de route ;
- une persistance locale réécrit l’ancien state après reset ;
- une condition d’accueil priorise systématiquement la sauvegarde existante ;
- un composant fait `router.push` vers une route qui auto-resume ;
- une logique de reprise existe à plusieurs endroits et entre en conflit.

Corrige la **cause métier**, pas seulement le symptôme visuel.

---

# 6. CONCEVOIR UNE API MÉTIER UNIQUE POUR « NOUVELLE PARTIE »

Si elle n’existe pas déjà, centralise le comportement dans une fonction métier claire, par exemple conceptuellement :

```text
startNewCampaign()
```

Le nom réel doit respecter les conventions du dépôt.

Cette fonction doit être la source de vérité du démarrage volontaire d’une nouvelle partie.

Elle doit :

1. gérer proprement l’ancienne partie selon le modèle de sauvegarde réel ;
2. supprimer/réinitialiser uniquement ce qui appartient au run actif ;
3. créer le nouvel état initial ;
4. créer une nouvelle seed lorsque c’est prévu par le moteur ;
5. initialiser le bon candidat / parti uniquement après le flux utilisateur normal ;
6. empêcher la réhydratation de l’ancienne campagne ;
7. naviguer vers le bon écran initial.

---

# 7. NE PAS EFFACER LES DONNÉES QUI NE SONT PAS UNE PARTIE ACTIVE

Un démarrage de nouvelle campagne ne doit pas supprimer par erreur :

- préférences utilisateur ;
- consentement analytics ;
- succès ;
- archives ;
- historique ;
- paramètres d’accessibilité ;
- réglages audio/visuels ;
- données Product Analytics ;
- configuration admin ;
- autres données persistées hors run actif.

Inspecte les clés/store réellement utilisés avant tout `clear()` global.

Interdiction :

```text
localStorage.clear()
```

ou équivalent global, sauf démonstration explicite qu’il n’existe absolument aucune autre donnée persistée — hypothèse à ne pas faire par défaut.

---

# 8. COMPORTEMENT DES TROIS CTA

Après correction :

## A. Aucun run actif

### « Lancer une campagne »

Doit ouvrir normalement le flux de création d’une campagne.

Aucune confirmation inutile.

## B. Run actif présent

### « Reprendre »

Doit reprendre ce run.

### « Nouvelle partie »

Doit déclencher le flux de nouvelle campagne.

Si remplacement destructif du run actif nécessaire :

```text
confirmation obligatoire
```

### « Lancer une campagne »

Doit suivre le même comportement intentionnel que « Nouvelle partie ».

Il ne doit jamais reprendre silencieusement l’ancien run.

---

# 9. ROUTING / REDIRECTS

Le correctif doit rester robuste même si le jeu possède un guard global.

Si une navigation volontaire « nouvelle partie » arrive sur une route qui auto-resume immédiatement :

ne contourne pas le guard avec un hack ponctuel.

Refactorise la logique afin qu’elle puisse distinguer :

```text
intention = resume
intention = new
```

ou utilise un état/route dédiée existante.

Le mécanisme choisi doit :

- survivre à la transition de route ;
- ne pas dépendre d’un timeout ;
- ne pas provoquer de race avec l’hydration ;
- ne pas faire flasher l’ancienne partie avant le nouveau parcours.

---

# 10. TESTS UNITAIRES / INTÉGRATION

Ajouter ou adapter des tests couvrant au minimum :

## Nouvelle campagne avec sauvegarde active

Vérifier que :

- l’ancienne partie n’est pas reprise ;
- le flux initial apparaît ;
- une nouvelle identité de run/seed est produite au moment approprié ;
- le state actif précédent n’est pas réinjecté.

## Reprendre

Vérifier que :

- le run existant reste identique ;
- seed/progression conservées ;
- aucune nouvelle partie n’est créée.

## Annulation de la confirmation

Si confirmation nécessaire :

- aucune clé modifiée ;
- aucune navigation destructrice ;
- campagne toujours reprenable.

## Aucune sauvegarde

« Lancer une campagne » doit fonctionner normalement.

---

# 11. E2E OBLIGATOIRES

Créer/adapter un test Playwright reproduisant le problème réel.

Scénario minimal :

```text
1. créer ou injecter une campagne sauvegardée non terminée
2. ouvrir l’accueil
3. vérifier que la carte « Campagne sauvegardée » est visible

4. cliquer « Reprendre »
5. vérifier que la campagne existante est effectivement reprise

6. revenir à l’accueil
7. cliquer « Nouvelle partie »
8. gérer la confirmation si elle existe
9. vérifier qu’on arrive sur le flux initial d’une nouvelle campagne
10. vérifier que l’ancienne progression n’est pas affichée

11. recréer/recharger une sauvegarde active
12. revenir à l’accueil
13. cliquer « Lancer une campagne »
14. vérifier que ce clic produit lui aussi une nouvelle campagne et non un resume
```

Ajouter également le scénario d’annulation si nécessaire.

---

# 12. TEST DE RELOAD

Une fois la nouvelle campagne initiée :

1. recharger la page ;
2. vérifier que l’ancienne campagne ne réapparaît pas à cause de l’hydration ;
3. vérifier que le nouveau flux ou nouvel état reste cohérent.

Ce point est obligatoire : le bug peut provenir précisément de la persistance.

---

# 13. PAS DE RÉGRESSION SUR LES ARCHIVES

Le menu « Archives » existe dans le produit.

Audite les tests/flux associés.

Si démarrer une nouvelle campagne doit archiver/conserver l’ancienne selon le design actuel :

vérifie que l’ancienne campagne apparaît encore au bon endroit.

Si les archives ne conservent volontairement que les campagnes terminées :

ne change pas ce modèle dans cette mission.

Documente simplement le comportement réel.

---

# 14. UX

Le correctif doit conserver la direction artistique actuelle.

Ne redesign pas la homepage.

Autorisé uniquement si nécessaire :

- ajout d’un modal/dialog de confirmation ;
- modification du handler des CTA ;
- légère adaptation du libellé si indispensable pour supprimer une ambiguïté.

N’ajoute pas un nouveau parcours UX complexe.

---

# 15. ACCESSIBILITÉ DU DIALOG DE CONFIRMATION

Si un dialogue est ajouté :

- focus initial cohérent ;
- `Escape` ferme si compatible avec les composants existants ;
- focus trap ;
- boutons clavier accessibles ;
- intitulé explicite ;
- action destructive clairement identifiable ;
- retour du focus vers le déclencheur après annulation.

Réutilise `shadcn/ui` / primitives déjà présentes.

---

# 16. ANALYTICS

Le projet possède désormais une instrumentation Product Analytics.

Ne modifie pas le catalogue analytics pour cette mission sauf nécessité réelle.

Vérifie cependant qu’une nouvelle campagne :

- produit un nouveau run analytics au moment prévu ;
- ne continue pas accidentellement le `run_id` de la campagne précédente ;
- ne crée pas de doublon avant confirmation ;
- ne génère aucun événement de nouvelle partie si l’utilisateur annule.

Ne collecte aucune donnée supplémentaire juste pour ce correctif.

---

# 17. QA COMPLÈTE

Après correction :

```powershell
npm run lint
npx tsc --noEmit
npm run data:validate
npm run test
npm run build
```

Puis les suites E2E pertinentes, et si possible la suite Chromium complète.

Vérifie explicitement le déterminisme du moteur si le store ou la création de seed a été touché.

---

# 18. INSPECTION VISUELLE

Lancer l’application et inspecter visuellement :

## Accueil avec sauvegarde

- carte campagne sauvegardée ;
- « Reprendre » ;
- « Nouvelle partie » ;
- hero « Lancer une campagne ».

## Confirmation éventuelle

- aucun texte coupé ;
- desktop ;
- viewport mobile pertinent ;
- aucun chevauchement ;
- cohérence de la DA.

---

# 19. GIT

Ce correctif est destiné au prochain déploiement, mais :

```text
NE PUSH RIEN
```

pendant cette mission.

Les commits éventuels doivent être :

```text
Author: Axel Corral
Committer: Axel Corral
```

Aucune mention Claude/Anthropic.

Exemple de commit uniquement si le diff réel le justifie :

```text
fix(game): allow starting a new campaign with an active save
```

Ne committe pas :

- prompts ;
- carrousels LinkedIn ;
- réglages locaux de tunnel/dev ;
- fichiers hors périmètre.

---

# 20. RAPPORT FINAL

Créer :

```text
NEW_CAMPAIGN_FLOW_FIX_REPORT.md
```

avec :

## A. Bug reproduit

## B. Cause racine

Donner les fichiers/fonctions précis.

## C. Comportement avant

```text
Reprendre :
Nouvelle partie :
Lancer une campagne :
```

## D. Comportement après

```text
Reprendre :
Nouvelle partie :
Lancer une campagne :
```

## E. Sauvegarde

Préciser :

- single slot / multi-slot ;
- archive ou remplacement ;
- confirmation ou non ;
- données préservées.

## F. Routing / hydration

Décrire la correction.

## G. Analytics

Vérifier `run_id` / nouvelle session.

## H. Tests

Donner les résultats réels.

## I. Limites

P0/P1/P2/P3.

## J. Git

Commit éventuel, aucun push.

---

# 21. CRITÈRES DE SUCCÈS

Ne déclarer :

```text
NEW CAMPAIGN FLOW — FIXED
```

que si :

- [ ] bug reproduit avant correction ;
- [ ] cause racine identifiée ;
- [ ] « Reprendre » reprend exactement la partie active ;
- [ ] « Nouvelle partie » ne reprend jamais silencieusement la partie active ;
- [ ] « Lancer une campagne » ne reprend jamais silencieusement la partie active ;
- [ ] nouvelle campagne accessible même avec sauvegarde existante ;
- [ ] destruction de sauvegarde jamais silencieuse ;
- [ ] confirmation fonctionnelle si remplacement nécessaire ;
- [ ] annulation sans effet secondaire ;
- [ ] aucune donnée globale utilisateur supprimée par erreur ;
- [ ] nouvelle partie possède un nouvel état/run approprié ;
- [ ] reload ne restaure pas accidentellement l’ancienne partie ;
- [ ] archives non régressées ;
- [ ] analytics non mélangées entre ancien et nouveau run ;
- [ ] tests unitaires/intégration verts ;
- [ ] E2E spécifique vert ;
- [ ] build vert ;
- [ ] aucun changement gameplay ;
- [ ] aucun push.

Sinon :

```text
NEW CAMPAIGN FLOW — BLOCKED
```

avec raison exacte.

---

# 22. SORTIE TERMINALE

Afficher à la fin :

```text
VERS L’ÉLYSÉE — NEW CAMPAIGN FLOW

BUG
Reproduit :
Cause :

BEFORE
Reprendre :
Nouvelle partie :
Lancer une campagne :

AFTER
Reprendre :
Nouvelle partie :
Lancer une campagne :

SAVE SAFETY
Ancienne partie :
Confirmation :
Annulation :
Archives :
Autres données persistées :

ROUTING
Guard :
Hydration :
Reload :

ANALYTICS
Ancien run_id :
Nouveau run_id :
Annulation :

QA
Unitaires :
E2E :
Lint :
Typecheck :
Build :
Déterminisme :

GIT
Commit :
Push : NON

VERDICT :
NEW CAMPAIGN FLOW — FIXED
```

Commence maintenant par reproduire le bug et tracer le chemin exact des trois CTA jusqu’au store/persistence. Ne touche pas au problème de sondages/calibration dans cette mission.
