# PROMPT MAÎTRE — PUBLICATION PUBLIQUE, COMMITS, PUSH GITHUB ET MISE EN LIGNE DE « VERS L’ÉLYSÉE »
## Objectif : publier une version portfolio / bêta publique propre, reproductible et accessible en ligne

Tu interviens comme **release engineer**, **maintainer Git/GitHub**, **QA lead**, **security reviewer** et **responsable de déploiement Next.js**.

Ta mission est de prendre l’état actuel du dépôt « Vers l’Élysée », vérifier qu’il est publiable comme **bêta publique / projet portfolio**, puis, si et seulement si le gate de publication est vert :

1. nettoyer uniquement ce qui est nécessaire à une publication propre ;
2. créer des commits locaux logiques ;
3. faire en sorte que **tous les commits créés pendant cette mission soient authored ET committed par Axel Corral, jamais par Claude** ;
4. intégrer proprement le travail sur la branche publique principale ;
5. pousser sur GitHub ;
6. rendre le dépôt public si nécessaire et si aucun risque de confidentialité n’est détecté ;
7. déployer l’application publiquement si l’environnement permet une mise en ligne sûre ;
8. vérifier la version live ;
9. me rendre les URLs finales et un rapport de publication.

**Ne modifie pas le gameplay pour améliorer la publication.**
Cette mission est une mission de release, pas une nouvelle passe de conception.

---

# 1. POSITIONNEMENT DE LA RELEASE

Cette version doit être considérée comme :

> **bêta publique / projet portfolio avancé**

et non comme :
- produit commercial final ;
- modèle prédictif de la présidentielle ;
- version 1.0 définitive si aucune politique de version existante ne le justifie.

Le projet possède déjà une boucle complète et des audits importants. Des problèmes résiduels peuvent rester documentés sans empêcher une publication portfolio si :
- aucun bug bloquant n’empêche de jouer ;
- aucun problème de sécurité/confidentialité n’existe ;
- tests/build principaux sont verts ;
- aucun contenu manifestement dangereux ou diffamatoire n’est exposé ;
- la version live fonctionne réellement.

---

# 2. RÈGLE ABSOLUE SUR L’AUTEUR DES COMMITS

## 2.1 Tous les nouveaux commits doivent être attribués à Axel Corral

Avant de créer le moindre commit, exécuter :

```powershell
git config --local user.name
git config --local user.email
git config --global user.name
git config --global user.email
gh auth status
```

Configurer **au niveau local du dépôt** :

```powershell
git config --local user.name "Axel Corral"
```

Pour l’email :

- réutiliser uniquement une adresse Git déjà configurée et clairement associée à Axel Corral ;
- ou une adresse GitHub/noreply déjà utilisée par Axel dans l’historique ;
- **ne jamais inventer d’adresse email** ;
- **ne jamais utiliser une adresse Claude, Anthropic, bot ou agent**.

Si aucune adresse valide d’Axel ne peut être déterminée sans ambiguïté :

```text
STOP — EMAIL GIT D’AXEL À CONFIRMER
```

et demander uniquement l’adresse Git à utiliser.

## 2.2 Vérifier auteur ET committer

Pour chaque commit créé, l’auteur et le committer doivent être Axel Corral.

Après chaque commit :

```powershell
git show -s --format=fuller HEAD
```

Vérifier :

```text
Author: Axel Corral <...>
Commit: Axel Corral <...>
```

Interdictions :

- `Co-authored-by: Claude`
- `Co-authored-by: Anthropic`
- `Generated-by: Claude`
- tout trailer attribuant le commit à Claude ;
- commit signé ou produit sous une identité de bot.

Claude Code est l’outil d’exécution, **pas l’auteur Git**.

---

# 3. PHASE A — AUDIT DE PUBLICATION AVANT TOUT PUSH

Commencer par :

```powershell
git status --short
git branch --show-current
git log --oneline --decorate -n 40
git remote -v
git diff --stat
git diff
```

Identifier :

- branche active ;
- branche principale ;
- modifications non commitées ;
- commits locaux non poussés ;
- remote existant ;
- état de `main` / `master` ;
- éventuelle divergence avec le remote.

Ne rien pousser à ce stade.

---

# 4. LIRE LES RAPPORTS DE RÉFÉRENCE LES PLUS RÉCENTS

Lire intégralement, s’ils existent :

```text
STRATEGIC_REALIGNMENTS_REPORT.md
AUDIT_STRATEGIC_REALIGNMENTS.md
REALITY_GROUNDED_CAMPAIGN_REPORT.md
REALITY_GROUNDING_BASELINE.md
FINAL_ELECTORAL_CALIBRATION_REPORT.md
AUDIT_RUNOFF_FINAL_CALIBRATION.md
ELECTORAL_COHERENCE_FIXES_REPORT.md
AUDIT_ELECTORAL_COHERENCE.md
FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md
TARGETED_GAMEPLAY_PASS_REPORT.md
FUN_IMPROVEMENTS_REPORT.md
AUDIT_FUN_REJOUABILITE.md
AUDIT_POST_CORRECTIONS.md
V2_CHANGELOG.md
README.md
docs/EDITORIAL_POLICY.md
docs/CONTENT_QUALITY_RULES.md
docs/POLITICAL_BASELINE_2026-04.md
docs/FICTIONAL_POLITICAL_ARCHETYPES.md
docs/REALITY_GROUNDED_SIMULATION.md
```

Déterminer :
- le rapport final réellement le plus récent ;
- les problèmes encore ouverts ;
- ceux qui sont bloquants ;
- ceux qui sont acceptables pour une bêta portfolio.

**Ne pas relancer une nouvelle refonte fonctionnelle.**

Si `STRATEGIC_REALIGNMENTS_REPORT.md` n’existe pas encore :
- noter que la passe prévue n’a pas été finalisée ;
- ne pas automatiquement bloquer la release ;
- juger uniquement si les problèmes ouverts actuels empêchent une publication bêta.

---

# 5. GATE PRODUIT : LE JEU EST-IL PUBLIABLE ?

Classer chaque point :

```text
P0 — bloque la publication
P1 — doit être corrigé avant mise en ligne
P2 — acceptable en bêta, documenter
P3 — amélioration future
```

## P0/P1 typiques

Bloquer notamment si :

- application ne build pas ;
- partie impossible à terminer ;
- crash reproductible ;
- données corrompues ;
- secret/token dans le dépôt ;
- information privée d’Axel ;
- `.env` sensible tracké ;
- nom de personnalité réelle utilisé dans un scandale fictif sensible ;
- contenu manifestement diffamatoire ;
- faille de sécurité évidente ;
- route publique exposant des informations locales ;
- assets cassés rendant le jeu inutilisable ;
- tests principaux massivement rouges ;
- deployment impossible à charger.

## P2 typiques

Peuvent rester pour une bêta :
- équilibrage encore perfectible ;
- quelques trajectoires narratives rares ;
- calibration non définitive ;
- certains événements stratégiques encore à enrichir ;
- petits défauts visuels non bloquants ;
- dette de test documentée.

Créer temporairement :

```text
release/PUBLICATION_GATE.md
```

avec :

| Point | Gravité | Preuve | Bloque ? | Action |
|---|---|---|---|---|

---

# 6. PHASE B — AUDIT SÉCURITÉ / CONFIDENTIALITÉ

## 6.1 Vérifier les fichiers sensibles

Inspecter :

```text
.env
.env.*
*.pem
*.key
*.p12
*.pfx
credentials*
secrets*
token*
cookies*
auth*
.vercel/
.next/
node_modules/
coverage/
playwright-report/
test-results/
```

Vérifier `.gitignore`.

Les fichiers de build, caches, dépendances et credentials ne doivent pas être trackés.

## 6.2 Scanner le dépôt

Utiliser si disponible :

```powershell
git grep -n -I -E "(api[_-]?key|secret|token|password|passwd|private[_-]?key|client[_-]?secret|aws_access_key_id|aws_secret_access_key)"
```

Puis, si `gitleaks` est installé :

```powershell
gitleaks detect --source . --no-banner
```

Sinon ne pas installer un outil lourd uniquement pour cela ; faire une inspection raisonnable avec Git et recherche.

Inspecter aussi l’historique récent pour éviter un secret supprimé du working tree mais déjà commité.

Si un secret réel est découvert dans l’historique :

**NE PAS PUSHER.**

Documenter :
- fichier ;
- commit ;
- type de secret.

Ne réécrire l’historique qu’après avoir d’abord révoqué/roté le secret ou obtenu la certitude qu’il est inutilisable.

---

# 7. AUDIT DES CHEMINS / DONNÉES PERSONNELLES

Chercher notamment :

```text
D:\Project_claude_code
C:\Users\
OneDrive\
nom d’utilisateur Windows
email personnel
téléphone
adresse postale
tokens
chemins locaux absolus
```

Les chemins locaux peuvent apparaître dans une documentation seulement s’ils sont génériques et utiles.

Supprimer / généraliser toute information personnelle non nécessaire à la publication.

Ne pas supprimer le nom « Axel Corral » : c’est volontairement l’auteur du projet.

---

# 8. AUDIT ÉDITORIAL PUBLIC

Vérifier :

- le disclaimer global du jeu ;
- `docs/EDITORIAL_POLICY.md` ;
- personnages pseudonymisés ;
- absence de « fictif/fictive » parasite dans le flux joueur si la validation actuelle l’exige ;
- absence de scandales sensibles attribués à un analogue reconnaissable d’une personnalité réelle ;
- absence de formulation affirmant que le jeu prédit 2027.

Ne pas refaire toute la politique éditoriale.
Corriger uniquement les violations évidentes qui rendraient la publication risquée.

---

# 9. PHASE C — TESTS DE RELEASE

Détecter les scripts réellement définis dans `package.json`.

Exécuter tous les contrôles pertinents, au minimum si disponibles :

```powershell
npm ci
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
npx playwright test
```

Si une suite de visual regression existe, l’exécuter également.

Si `npm ci` n’est pas approprié à l’état local, utiliser la commande conforme au lockfile sans modifier inutilement les dépendances.

Documenter :

```text
lint
typecheck
data validation
unit
E2E
visual regression
build
```

avec :
- nombre de tests ;
- échecs ;
- runtime si utile.

Ne pas mettre à jour les snapshots simplement pour rendre la suite verte sauf si :
- le changement visuel est légitime ;
- la capture est examinée ;
- le changement vient des modifications déjà destinées à être publiées.

---

# 10. SMOKE TEST MANUEL LOCAL

Lancer la version production localement si possible :

```powershell
npm run build
npm run start
```

ou l’équivalent du projet.

Tester au minimum :

1. accueil ;
2. sélection d’un parti ;
3. démarrage d’une campagne ;
4. quelques décisions ;
5. dashboard ;
6. premier tour via une seed/fixture connue si disponible ;
7. entre-deux-tours ;
8. second tour / défaite ;
9. résultat final ;
10. mobile 390×844.

Vérifier :
- 0 crash ;
- pas d’erreur console bloquante ;
- navigation complète ;
- assets chargés.

---

# 11. GATE DE RELEASE

Si P0/P1 = 0 et contrôles principaux verts :

afficher :

```text
PUBLICATION GATE — GREEN
```

et poursuivre.

Si un P0/P1 reste :

```text
PUBLICATION GATE — BLOCKED
```

Corriger uniquement les problèmes strictement nécessaires à la publication.

Relancer ensuite le gate.

Si une correction implique une nouvelle décision produit importante :
ne pas l’inventer ; signaler le blocage.

---

# 12. PHASE D — PRÉPARATION DU DÉPÔT PUBLIC

## 12.1 README

Auditer le `README.md`.

Il doit permettre à un recruteur / développeur de comprendre rapidement :

- ce qu’est Vers l’Élysée ;
- que c’est un simulateur de jeu, pas un prédicteur ;
- stack ;
- installation ;
- lancement ;
- tests ;
- architecture générale ;
- méthodologie data / audits ;
- statut bêta ;
- captures si déjà disponibles ;
- rôle des personnages pseudonymisés ;
- licence si une licence existe déjà.

Ajouter une section courte :

```text
## Méthodologie / Data
```

expliquant sans marketing excessif :
- simulation massive ;
- seeds déterministes ;
- audits avant/après ;
- contrefactuels ;
- calibration.

Ne pas surcharger le README avec tous les rapports.

## 12.2 IA / Claude Code

Ajouter si absent une formulation honnête, par exemple dans une section développement :

> Le développement a été réalisé avec Claude Code comme outil agentique. La conception du système, les hypothèses, les métriques, les protocoles d’audit, les playtests et l’interprétation des résultats ont été pilotés par Axel Corral.

Adapter le texte au ton existant.

## 12.3 Licence

Vérifier si une licence existe.

Si aucune licence n’existe :
- **ne pas inventer de licence** ;
- ne pas ajouter MIT/Apache/GPL sans décision d’Axel ;
- la publication publique reste possible sans licence.

Noter ce point dans le rapport final.

## 12.4 Fichiers générés

Ne pas versionner inutilement :
- `.next`
- `node_modules`
- coverage massif non nécessaire
- rapports Playwright temporaires
- caches
- artefacts de build.

En revanche, conserver si raisonnable :
- rapports d’audit utiles ;
- scripts reproductibles ;
- CSV/JSON d’audit essentiels ;
- documentation ;
- captures de référence déjà volontairement versionnées.

Si un fichier individuel dépasse les limites GitHub ou rend le dépôt anormalement lourd :
- ne pas le pousser aveuglément ;
- identifier s’il est reconstructible ;
- l’ignorer si c’est un artefact généré ;
- documenter.

---

# 13. PHASE E — CRÉER DES COMMITS PROPRES

## 13.1 Ne pas réécrire l’historique existant sans nécessité

Conserver les commits déjà présents.

Ne pas :
- squash toute l’histoire ;
- rebase destructivement une branche déjà poussée ;
- force-push ;
- réattribuer rétroactivement de vieux commits.

La règle « authored by Axel Corral » concerne **les nouveaux commits créés pendant cette mission**.

## 13.2 Regrouper les changements non commités

Analyser le diff actuel et créer des commits logiques.

Exemples possibles selon le contenu réel :

```text
feat: ground electoral simulation in April 2026 baseline
feat: add candidate profiles and electorate redistribution
feat: improve strategic realignments and endorsements
fix: align runoff polling and contextual eligibility
test: expand simulation and regression coverage
docs: document simulation methodology and public beta
```

**Ne pas utiliser ces messages si le diff ne correspond pas réellement.**

Objectif :
- 2 à 7 commits cohérents ;
- pas un commit par fichier ;
- pas un seul énorme `misc changes`.

## 13.3 Avant chaque commit

```powershell
git diff --cached
git status --short
```

Vérifier exactement ce qui va être commité.

## 13.4 Auteur obligatoire

Avant le premier commit :

```powershell
git config --local user.name "Axel Corral"
```

Configurer l’email valide d’Axel identifié en Phase A.

Puis créer le commit normalement.

Après chaque commit :

```powershell
git show -s --format=fuller HEAD
```

et vérifier auteur + committer.

---

# 14. PHASE F — VÉRIFICATION POST-COMMITS

Après tous les commits :

```powershell
git status
git log --format="%h | %an <%ae> | %cn <%ce> | %s" -n 15
```

Vérifier :
- working tree propre ;
- nouveaux commits = Axel Corral en auteur ET committer ;
- aucun trailer Claude/Anthropic.

Relancer au minimum :

```powershell
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
```

et les E2E si des fichiers fonctionnels ont été modifiés pendant la préparation de release.

---

# 15. PHASE G — INTÉGRER LA BRANCHE SUR LA BRANCHE PUBLIQUE

## 15.1 Identifier la branche principale

Avec :

```powershell
git remote show origin
git branch -a
```

Déterminer `main` ou `master`.

## 15.2 Fetch avant intégration

```powershell
git fetch --all --prune
```

Comparer :

```powershell
git log --oneline --graph --decorate --all -n 50
```

## 15.3 Cas simple : branche principale locale en retard uniquement

Si la branche de travail contient tous les commits et que la branche principale peut être fast-forwardée proprement :

```powershell
git switch main
git merge --ff-only <branche-de-travail>
```

ou équivalent.

## 15.4 Si le remote a avancé

Ne jamais force-push.

Intégrer les changements distants de façon sûre.

Préférer :
- merge explicite ;
- ou rebase uniquement si les commits concernés ne sont pas déjà publics et que cela ne détruit pas l’historique.

En cas de conflit :
- résoudre uniquement si le sens est clair ;
- relancer tests ;
- commit de merge authored/committed par Axel Corral.

## 15.5 Vérification finale de main

```powershell
git switch main
git status
git log --oneline --decorate -n 20
```

S’assurer que tous les travaux destinés à la publication sont présents.

---

# 16. PHASE H — PUSH GITHUB

## 16.1 Vérifier l’authentification

```powershell
gh auth status
```

Si non authentifié :

```text
STOP — AUTHENTIFICATION GITHUB REQUISE
```

Donner la commande exacte :

```powershell
gh auth login
```

et attendre qu’Axel termine l’authentification.

## 16.2 Remote existant

Si `origin` existe :
- vérifier qu’il pointe vers le bon repo ;
- vérifier que le compte est celui d’Axel ;
- ne pas remplacer un remote valide arbitrairement.

## 16.3 Aucun remote

Si aucun remote GitHub n’existe mais `gh` est authentifié :

1. vérifier le nom du dépôt actuel ;
2. créer le dépôt sous le compte GitHub d’Axel ;
3. utiliser par défaut le nom déjà cohérent avec le projet, probablement `vers-elysee` si disponible ;
4. si ce nom est impossible ou ambigu, s’arrêter et demander uniquement le nom public à utiliser.

Créer initialement le repo **privé** si une dernière vérification de visibilité est encore nécessaire.

Ajouter `origin`.

## 16.4 Push

Pousser la branche principale :

```powershell
git push -u origin main
```

ou la branche principale réelle.

Pousser également une branche de travail uniquement si elle a un intérêt à être conservée publiquement.

Ne pas pousser des branches temporaires inutiles.

---

# 17. PHASE I — PASSER LE DÉPÔT EN PUBLIC

Avant toute modification de visibilité :

1. confirmer que le scan secrets est vert ;
2. vérifier rapidement l’historique ;
3. vérifier absence de données personnelles inutiles ;
4. vérifier README ;
5. vérifier remote.

Récupérer la visibilité :

```powershell
gh repo view --json nameWithOwner,visibility,url
```

Si déjà public :
ne rien changer.

Si privé ET gate sécurité vert :

la demande d’Axel dans ce prompt constitue une autorisation explicite pour rendre ce dépôt public.

Utiliser la commande GitHub CLI appropriée, par exemple :

```powershell
gh repo edit --visibility public --accept-visibility-change-consequences
```

Puis vérifier :

```powershell
gh repo view --json nameWithOwner,visibility,url
```

**Ne jamais rendre public si un doute subsiste sur un secret.**

---

# 18. PHASE J — MÉTADONNÉES GITHUB

Mettre à jour si pertinent :

- description courte ;
- homepage après déploiement ;
- topics.

Description recommandée, à adapter :

> Simulateur narratif et probabiliste de campagne présidentielle, construit comme projet de simulation et d’expérimentation data.

Ne pas écrire :
- « prédicteur 2027 » ;
- « AI election predictor ».

Topics possibles si pertinents :

```text
nextjs
typescript
simulation
data-analysis
game-development
playwright
vitest
```

Ne pas ajouter 20 topics.

---

# 19. PHASE K — DÉPLOIEMENT PUBLIC DU JEU

Le but n’est pas seulement que le code soit visible : **le jeu doit idéalement être jouable via une URL publique**.

## 19.1 Identifier l’infrastructure existante

Rechercher :

```text
vercel.json
.vercel/
netlify.toml
wrangler.toml
firebase.json
.github/workflows/
deployment docs
package.json scripts
```

Vérifier si un déploiement existe déjà.

## 19.2 Priorité : conserver l’infrastructure existante

Si le projet est déjà lié à :
- Vercel ;
- Netlify ;
- autre hébergeur adapté ;

utiliser cette infrastructure.

Ne pas migrer vers une autre plateforme sans nécessité.

## 19.3 Si aucune infrastructure n’existe

Pour un projet Next.js, **Vercel est l’option par défaut** si :
- `vercel` / `npx vercel` fonctionne ;
- le compte d’Axel est authentifié ;
- aucun besoin spécifique du projet ne l’interdit.

Vérifier :

```powershell
npx vercel whoami
```

Si non authentifié :

```text
STOP — AUTHENTIFICATION VERCEL REQUISE
```

indiquer la commande de login et attendre.

## 19.4 Variables d’environnement

Avant déploiement :
- détecter les variables réellement nécessaires ;
- ne jamais afficher leurs valeurs dans le terminal final ou rapport ;
- ne jamais commiter un secret ;
- vérifier si l’app peut fonctionner sans secrets.

Le projet doit, si possible, rester jouable sans backend/clé externe.

## 19.5 Déploiement production

Une fois lié :

```powershell
npx vercel --prod
```

ou commande existante du projet.

Conserver l’URL finale.

---

# 20. PHASE L — SMOKE TEST SUR LA VERSION LIVE

Une fois déployé :

Vérifier par HTTP que la page répond.

Puis utiliser Playwright ou l’outil navigateur existant pour tester l’URL publique :

### Desktop
- accueil ;
- sélection parti ;
- démarrage ;
- au moins une décision ;
- dashboard.

### Mobile 390×844
- accueil ;
- partie ;
- scroll ;
- contrôle principal.

Si une fixture permet de rejoindre rapidement les résultats :
tester également premier tour / résultat.

Vérifier :
- pas de 404 sur assets ;
- pas d’erreur console critique ;
- pas d’erreur hydration ;
- manifest/PWA chargé si prévu ;
- URL en HTTPS.

---

# 21. PHASE M — METTRE À JOUR LE HOMEPAGE GITHUB

Si une URL publique jouable existe :

```powershell
gh repo edit --homepage "<URL_LIVE>"
```

Puis vérifier la page du repo.

---

# 22. RELEASE / TAG

Ne créer un tag ou une GitHub Release que si :

- le projet possède déjà une convention de version claire ;
- `package.json` / changelog donne une version cohérente.

Si aucune politique de version n’existe :
- ne pas inventer `v1.0.0`.

Une bêta publique peut très bien être publiée sans release tag.

Si une version `0.x` cohérente existe, un tag bêta peut être envisagé uniquement si cela respecte l’historique existant.

---

# 23. RAPPORT FINAL

Créer localement :

```text
release/PUBLICATION_REPORT.md
```

Puis le commiter comme documentation de release uniquement s’il apporte une vraie valeur durable au dépôt.
Sinon le laisser comme rapport local non versionné.

Il doit contenir :

```text
PUBLICATION REPORT — VERS L’ÉLYSÉE

HEAD final :
Branche :
Auteur Git nouveaux commits :
Committer Git nouveaux commits :

Publication gate :
P0 :
P1 :
P2 documentés :

Security scan :
Secrets :
Données personnelles :
.env tracké :
Verdict :

Tests :
Lint :
Typecheck :
Data validate :
Unit :
E2E :
Visual :
Build :

GitHub :
Repo :
Visibilité :
URL :
Branche par défaut :
Dernier commit poussé :

Déploiement :
Provider :
URL live :
HTTP :
Desktop smoke :
Mobile smoke :

README :
Méthodologie data :
Mention Claude Code :
Statut bêta :
Licence :

Problèmes ouverts non bloquants :
1.
2.
3.

VERDICT :
PUBLIC BETA READY / BLOCKED
```

---

# 24. VÉRIFICATION DES COMMITS SUR GITHUB

Après push, vérifier via CLI :

```powershell
gh api repos/{owner}/{repo}/commits --jq '.[0:10][] | [.sha[0:7], .commit.author.name, .commit.author.email, .commit.committer.name, .commit.message] | @tsv'
```

ou commande équivalente.

Confirmer que les nouveaux commits apparaissent avec :

```text
Axel Corral
```

et jamais Claude/Anthropic comme auteur ou committer.

---

# 25. CHECKLIST FINALE OBLIGATOIRE

Avant de rendre la main :

## Produit
- [ ] Application jouable localement.
- [ ] Pas de P0/P1 ouvert.
- [ ] Statut bêta assumé.
- [ ] Disclaimer / positionnement non prédictif correct.

## Tests
- [ ] Lint vert.
- [ ] Typecheck vert.
- [ ] Data validate vert.
- [ ] Unit verts.
- [ ] Build vert.
- [ ] E2E verts ou écarts explicitement non bloquants.
- [ ] Visual regression vérifiée si disponible.

## Sécurité
- [ ] Aucun secret tracké.
- [ ] Aucun `.env` sensible tracké.
- [ ] Aucun token exposé.
- [ ] Aucun chemin privé inutile.
- [ ] Historique inspecté avant passage public.

## Git
- [ ] Nouveaux commits auteurs = Axel Corral.
- [ ] Nouveaux commits committers = Axel Corral.
- [ ] Aucun `Co-authored-by: Claude`.
- [ ] Working tree propre.
- [ ] Pas de force-push.
- [ ] Main contient tout le travail destiné à la release.
- [ ] Push réussi.

## GitHub
- [ ] Repo public.
- [ ] README propre.
- [ ] Description correcte.
- [ ] Topics raisonnables.
- [ ] URL du repo vérifiée.

## Live
- [ ] URL publique créée ou existante.
- [ ] HTTPS.
- [ ] Accueil accessible.
- [ ] Desktop smoke test.
- [ ] Mobile smoke test.
- [ ] Homepage GitHub mise à jour avec l’URL live.

---

# 26. CE QUE TU NE DOIS PAS FAIRE

- Ne jamais inventer l’email Git d’Axel.
- Ne jamais créer un commit authored/committed par Claude.
- Ne jamais ajouter de trailer Claude/Anthropic.
- Ne jamais force-push.
- Ne jamais rendre le repo public avant le scan de secrets.
- Ne jamais pousser `.env`, tokens ou credentials.
- Ne jamais modifier le gameplay pour satisfaire la release.
- Ne jamais masquer un test rouge important.
- Ne jamais régénérer automatiquement des snapshots sans les examiner.
- Ne jamais ajouter une licence juridique arbitraire.
- Ne jamais appeler le projet « prédicteur de l’élection 2027 ».
- Ne jamais supprimer les rapports d’audit simplement pour rendre le dépôt plus petit.
- Ne pas versionner les caches/builds inutiles.
- Ne pas refaire une nouvelle refonte du jeu dans cette mission.

---

# 27. AUTONOMIE

Travailler de manière autonome jusqu’au bout.

Ne t’arrêter que pour une information ou action réellement impossible à déduire ou exécuter de manière sûre, notamment :

1. email Git valide d’Axel introuvable ;
2. authentification GitHub absente ;
3. authentification de l’hébergeur absente ;
4. choix de nom du repo réellement ambigu ;
5. secret découvert nécessitant rotation ;
6. conflit Git dont la résolution exige une décision produit.

Dans ces cas, poser **une seule question précise**, puis reprendre dès la réponse.

---

# 28. SORTIE TERMINALE FINALE

À la fin, afficher exactement un résumé de cette forme :

```text
VERS L’ÉLYSÉE — PUBLICATION TERMINÉE

Statut              : PUBLIC BETA READY
Git author           : Axel Corral
Git committer        : Axel Corral
Branche publique     :
Commit final         :

GitHub               :
Visibilité           : PUBLIC

Live                 :
Provider             :

Tests                :
Build                :
E2E                  :
Security             :

Problèmes ouverts non bloquants :
-

Prochaine action recommandée :
utiliser l’URL live et l’URL GitHub dans le carrousel LinkedIn.
```

Si publication bloquée, remplacer le statut par :

```text
PUBLICATION BLOCKED
```

et donner la cause exacte.

Commence immédiatement par la Phase A.
