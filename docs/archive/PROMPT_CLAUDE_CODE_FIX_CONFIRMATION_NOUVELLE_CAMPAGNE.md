# PROMPT CLAUDE CODE — CORRECTIF UX / LOGIQUE « LANCER UNE CAMPAGNE »
## Vers l’Élysée — demander confirmation lorsqu’une partie est déjà en cours

Tu interviens comme **Senior Next.js Engineer**, **State Management Engineer**, **UX Engineer** et **QA Lead**.

Cette mission est un **correctif ciblé**.

## Problème observé

Quand une campagne est déjà en cours et sauvegardée, cliquer sur :

```text
Lancer une campagne
```

redirige actuellement automatiquement vers la partie existante.

Ce comportement est incorrect.

L’intention de l’utilisateur lorsqu’il clique sur **« Lancer une campagne »** est de démarrer une nouvelle campagne, pas de reprendre silencieusement celle déjà en cours.

Le comportement attendu est :

```text
Aucune partie en cours
→ clic « Lancer une campagne »
→ démarrage normal du flux de nouvelle campagne
```

et :

```text
Partie en cours
→ clic « Lancer une campagne »
→ affichage d’une confirmation
→ choix :
   - reprendre la campagne existante
   - annuler
   - créer une nouvelle campagne
```

La campagne existante ne doit jamais être supprimée ou remplacée sans confirmation explicite.

---

# 1. OBJECTIF UX EXACT

Lorsqu’une campagne active existe et que l’utilisateur clique sur :

```text
Lancer une campagne
```

afficher une boîte de dialogue cohérente avec la DA actuelle.

Exemple de contenu :

```text
Une campagne est déjà en cours

Vous avez déjà une campagne en cours avec [nom du candidat / parti si disponible].

Voulez-vous reprendre cette campagne ou en démarrer une nouvelle ?
```

Actions :

```text
Annuler
Reprendre la campagne
Démarrer une nouvelle campagne
```

Les libellés peuvent être légèrement adaptés à la terminologie existante du produit, mais l’intention doit rester exactement celle-ci.

---

# 2. COMPORTEMENT DES ACTIONS

## Annuler

Doit :

- fermer le dialogue ;
- rester sur la page d’accueil ;
- ne modifier aucun state ;
- ne modifier aucune sauvegarde ;
- ne créer aucun nouveau run analytics.

## Reprendre la campagne

Doit :

- charger exactement la campagne existante ;
- conserver seed, progression, décisions et état ;
- reprendre au bon écran ;
- se comporter comme le bouton / mécanisme de reprise actuel.

## Démarrer une nouvelle campagne

Doit :

- lancer réellement le flux de création d’une nouvelle campagne ;
- ne jamais rediriger vers la campagne existante ;
- ne pas reprendre silencieusement le state précédent ;
- utiliser le mécanisme métier officiel de création/reset d’une campagne.

Si démarrer une nouvelle campagne écrase le slot actif existant, ajouter une **deuxième confirmation destructive uniquement si nécessaire**.

Exemple :

```text
Remplacer la campagne en cours ?

Votre campagne actuelle sera remplacée par la nouvelle campagne.

Cette action est irréversible.
```

Boutons :

```text
Retour
Confirmer et créer une nouvelle campagne
```

Ne demande pas une double confirmation si l’architecture permet de préserver l’ancienne campagne sans risque.

---

# 3. AUDIT INITIAL OBLIGATOIRE

Avant toute modification :

```powershell
git status
git branch --show-current
git log --oneline --decorate -n 20
```

Puis localise et lis le chemin exact du comportement :

- homepage ;
- composant du bouton « Lancer une campagne » ;
- éventuelle carte de sauvegarde active ;
- bouton « Reprendre » ;
- bouton « Nouvelle partie » s’il existe ;
- route de création de campagne ;
- route de campagne active ;
- store du jeu ;
- persistance ;
- localStorage / IndexedDB / autre ;
- guards ;
- redirects ;
- hydration ;
- mécanisme de création/reset ;
- mécanisme de reprise.

Ne pars pas du principe que le bouton lui-même est la cause.

Trace :

```text
clic
→ handler
→ navigation
→ guard
→ store
→ hydration
→ résultat final
```

---

# 4. REPRODUIRE LE BUG AVANT CORRECTION

Créer ou utiliser une sauvegarde active non terminée.

Tester :

```text
1. ouvrir l’accueil
2. vérifier qu’une campagne en cours existe
3. cliquer « Lancer une campagne »
4. observer la destination
```

Documenter le comportement réel avant correction.

Le bug attendu est :

```text
clic « Lancer une campagne »
→ redirection automatique vers la campagne en cours
```

Créer si possible un test Playwright qui échoue avant correction.

---

# 5. IDENTIFIER LA CAUSE RACINE

Auditer notamment :

- handler qui appelle directement `resume` ;
- CTA qui pointe vers la route de campagne active ;
- route de création qui auto-resume si une save existe ;
- guard global qui intercepte la navigation ;
- hydration qui réinjecte l’ancienne partie après reset ;
- condition du type `if (saveExists) resumeGame()`;
- redirection serveur/client ;
- logique de sauvegarde active centralisée ;
- alias entre « Lancer » et « Reprendre ».

Ne corrige pas uniquement la navigation si le guard recrée le problème juste après.

---

# 6. CENTRALISER L’INTENTION UTILISATEUR

Le code doit distinguer explicitement :

```text
resumeExistingCampaign
startNewCampaign
cancel
```

Évite les comportements implicites du type :

```text
goToGame()
```

qui décide ensuite automatiquement de reprendre une sauvegarde.

Si une fonction métier dédiée n’existe pas, crée ou réutilise proprement une abstraction du type :

```text
startNewCampaign()
resumeCampaign()
```

en respectant les conventions du dépôt.

---

# 7. CONSERVATION DE LA SAUVEGARDE

Audite le modèle réel de persistance :

## Si plusieurs campagnes peuvent coexister

Démarrer une nouvelle campagne doit :

- créer une nouvelle campagne active ;
- préserver l’ancienne selon le modèle existant ;
- ne jamais la supprimer inutilement.

## Si un seul slot actif existe

Démarrer une nouvelle campagne doit :

- informer explicitement l’utilisateur que la campagne actuelle sera remplacée ;
- demander confirmation avant destruction ;
- n’effacer que les données appartenant à cette campagne active.

Interdiction de :

```text
localStorage.clear()
```

ou tout reset global destructif.

Préserver :

- préférences ;
- consentement analytics ;
- succès ;
- archives ;
- historique ;
- settings ;
- toute donnée hors run actif.

---

# 8. INFORMATIONS À AFFICHER DANS LE MODAL

Si disponibles facilement dans le state actuel, afficher :

```text
nom du candidat
parti
nombre de décisions déjà prises
date / phase actuelle
```

Exemple :

```text
Vous avez déjà une campagne en cours :
Clara Villedieu · Parti socialiste
4 décisions prises
```

Ne complexifie pas le code pour afficher des données non accessibles proprement.

Le modal doit rester court.

---

# 9. COHÉRENCE AVEC LES AUTRES CTA

Audite également :

```text
Reprendre
Nouvelle partie
Lancer une campagne
```

Le comportement final doit être cohérent :

## Reprendre

```text
→ reprend toujours la partie existante
```

## Nouvelle partie

```text
→ crée une nouvelle partie
→ confirmation si destruction nécessaire
```

## Lancer une campagne

```text
si aucune save
→ nouvelle partie directement

si save active
→ modal de choix
```

Ne laisse aucun CTA rediriger silencieusement vers une intention différente.

---

# 10. ROUTING ET GUARDS

Si le bug vient d’un guard qui fait :

```text
save exists → redirect campaign active
```

modifier la logique pour reconnaître une intention explicite de nouvelle campagne.

Le mécanisme choisi doit être robuste :

- pas de `setTimeout` ;
- pas de query param temporaire fragile si une meilleure architecture existe ;
- pas de race avec hydration ;
- pas de flash de l’ancienne partie ;
- pas de redirect loop.

---

# 11. ANALYTICS

Le projet possède une instrumentation Product Analytics.

Vérifier que :

## Annuler

```text
aucun nouveau run
aucun reset
```

## Reprendre

```text
run existant conservé
```

## Nouvelle campagne

```text
nouveau run_id uniquement après confirmation réelle
```

Aucun nouveau run ne doit être créé au moment d’ouvrir le modal.

Ne modifie pas le catalogue analytics si ce n’est pas nécessaire.

---

# 12. ACCESSIBILITÉ DU DIALOGUE

Utiliser les primitives UI existantes, idéalement shadcn/ui si déjà présent.

Vérifier :

- focus trap ;
- navigation clavier ;
- Escape ;
- focus restitué au bouton déclencheur ;
- titre accessible ;
- description claire ;
- boutons lisibles ;
- pas de confusion entre action primaire et destructive.

---

# 13. DESIGN

Conserver la direction artistique actuelle.

Ne redesign pas la homepage.

Le modal doit utiliser :

- couleurs existantes ;
- typographies existantes ;
- radius/border/shadow existants ;
- boutons déjà présents dans le design system.

Aucun nouveau style global.

---

# 14. TESTS UNITAIRES / INTÉGRATION

Ajouter ou adapter des tests pour :

## Cas 1 — aucune campagne active

```text
clic « Lancer une campagne »
→ flux de création normal
```

## Cas 2 — campagne active

```text
clic « Lancer une campagne »
→ modal visible
```

## Cas 3 — Annuler

```text
→ modal fermé
→ aucune navigation
→ save intacte
```

## Cas 4 — Reprendre

```text
→ ancienne campagne reprise
→ même seed
→ même progression
```

## Cas 5 — Nouvelle campagne

```text
→ confirmation destructive si nécessaire
→ nouvelle campagne créée
→ ancienne non reprise
```

## Cas 6 — Reload

Après démarrage d’une nouvelle campagne :

```text
reload
→ ancienne campagne ne revient pas
```

---

# 15. E2E PLAYWRIGHT OBLIGATOIRE

Créer un test reproduisant le cas réel.

Scénario :

```text
1. créer une campagne sauvegardée non terminée
2. retourner à l’accueil
3. vérifier la carte de campagne active
4. cliquer « Lancer une campagne »
5. vérifier que le modal apparaît
6. vérifier que les informations de la campagne existante sont correctes
7. cliquer Annuler
8. vérifier qu’on reste sur l’accueil
9. recliquer « Lancer une campagne »
10. cliquer « Reprendre »
11. vérifier reprise de la bonne campagne
12. revenir à l’accueil
13. cliquer « Lancer une campagne »
14. cliquer « Démarrer une nouvelle campagne »
15. confirmer si nécessaire
16. vérifier arrivée dans le vrai flux initial
17. vérifier que l’ancienne progression n’est pas réutilisée
18. reload
19. vérifier que l’ancienne partie ne réapparaît pas
```

---

# 16. QA VISUELLE

Tester au minimum :

```text
desktop
mobile
```

Vérifier :

- modal centré ;
- pas de texte coupé ;
- aucun overflow ;
- boutons accessibles ;
- hiérarchie lisible ;
- comportement correct si nom de candidat/parti long.

---

# 17. QA GÉNÉRALE

Après correction :

```powershell
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

Puis la suite Playwright pertinente et idéalement la suite Chromium complète.

Si le store / seed / persistance a été modifié, vérifier le déterminisme.

---

# 18. NE PAS TOUCHER AUX AUTRES SUJETS

Ne corrige pas dans cette mission :

- réalisme des sondages ;
- calibration électorale ;
- RNG ;
- partis ;
- événements ;
- alliances ;
- dashboard analytics ;
- Supabase ;
- Vercel ;
- contenu LinkedIn.

Le scope est strictement :

```text
nouvelle campagne / reprise / confirmation
```

---

# 19. GIT

Ne pousse rien.

Si un commit local est créé :

```text
Author: Axel Corral
Committer: Axel Corral
```

Aucune mention Claude/Anthropic.

Commit recommandé uniquement si adapté au diff réel :

```text
fix(game): confirm before starting a new campaign
```

Ne committe aucun fichier hors périmètre.

---

# 20. RAPPORT FINAL

Créer :

```text
NEW_CAMPAIGN_CONFIRMATION_FIX_REPORT.md
```

Inclure :

## A. Bug reproduit

## B. Cause racine

Fichiers/fonctions précis.

## C. Avant

```text
Lancer une campagne :
Reprendre :
Nouvelle partie :
```

## D. Après

```text
Lancer une campagne :
Reprendre :
Nouvelle partie :
```

## E. Modal

```text
Titre :
Message :
Actions :
```

## F. Sauvegarde

```text
modèle de stockage :
single-slot / multi-slot :
ancienne campagne conservée ou remplacée :
confirmation destructive :
```

## G. Routing / hydration

## H. Analytics

## I. Tests

## J. UX / accessibilité

## K. Limites restantes

Classer P0 / P1 / P2 / P3.

## L. Git

```text
commit :
push : NON
```

---

# 21. CRITÈRES DE SUCCÈS

Ne déclarer :

```text
NEW CAMPAIGN CONFIRMATION — FIXED
```

que si :

- [ ] bug reproduit avant correction ;
- [ ] cause racine identifiée ;
- [ ] aucune save → lancement direct d’une nouvelle campagne ;
- [ ] save active → modal de choix ;
- [ ] Annuler ne modifie rien ;
- [ ] Reprendre reprend exactement la bonne campagne ;
- [ ] Démarrer une nouvelle campagne ne reprend jamais l’ancienne ;
- [ ] aucune suppression silencieuse ;
- [ ] confirmation destructive présente si remplacement nécessaire ;
- [ ] aucune donnée utilisateur globale supprimée ;
- [ ] analytics run_id cohérent ;
- [ ] hydration/reload validés ;
- [ ] modal accessible ;
- [ ] desktop OK ;
- [ ] mobile OK ;
- [ ] tests unitaires verts ;
- [ ] E2E vert ;
- [ ] build vert ;
- [ ] aucun changement gameplay ;
- [ ] aucun push.

Sinon :

```text
NEW CAMPAIGN CONFIRMATION — BLOCKED
```

avec raison exacte.

---

# 22. SORTIE TERMINALE

Afficher :

```text
VERS L’ÉLYSÉE — NEW CAMPAIGN CONFIRMATION

BUG
Reproduit :
Cause :

FLOW
Aucune save :
Save active :
Annuler :
Reprendre :
Nouvelle campagne :

SAVE SAFETY
Single/Multi slot :
Ancienne campagne :
Destruction silencieuse : NON

ROUTING
Guard :
Hydration :
Reload :

ANALYTICS
Resume run :
New run :
Cancel :

QA
Unit :
E2E :
Lint :
Typecheck :
Build :
Mobile :
Desktop :

GIT
Commit :
Push : NON

VERDICT :
NEW CAMPAIGN CONFIRMATION — FIXED
```

Commence maintenant par reproduire le bug et tracer précisément le flux du bouton « Lancer une campagne » jusqu’au routing, au guard et au store. Ne modifie rien avant d’avoir identifié la cause racine.
