# PROMPT CLAUDE CODE — DÉPLOIEMENT PRODUCTION VERCEL
## « Vers l’Élysée » — publier tous les ajouts validés sans exposer l’analytics admin

Tu interviens comme **Release Engineer**, **Senior Next.js/Vercel Engineer**, **Security Reviewer** et **QA Lead**.

Cette tâche est destinée à être exécutée **après les travaux déjà en queue**. Ne commence le déploiement qu’une fois les tâches précédentes terminées et le dépôt revenu dans un état cohérent.

## Objectif

Déployer sur le **projet Vercel existant de Vers l’Élysée** l’ensemble des ajouts applicatifs désormais validés et destinés à la production, notamment les évolutions Product Analytics, sécurité Supabase, migrations distantes, dashboard analytics/admin et correctifs associés réellement présents au HEAD au moment de l’exécution.

Le but final est :

1. disposer d’un `main` propre et poussé sur GitHub ;
2. déployer exactement ce commit en production sur le projet Vercel déjà lié ;
3. configurer correctement les variables d’environnement requises sans exposer de secret ;
4. vérifier que l’application publique fonctionne ;
5. vérifier que le dashboard analytics/admin reste inaccessible aux utilisateurs non autorisés ;
6. vérifier que la chaîne analytics production communique correctement avec Supabase ;
7. disposer d’un rapport de déploiement et d’un chemin de rollback.

**Ne déploie pas aveuglément. Un échec de sécurité ou de QA bloque la production.**

---

# 1. PÉRIMÈTRE

## À inclure

Inclure tous les changements **destinés à l’application de production** présents dans les commits locaux validés au moment de ce run, notamment si présents :

- Product Analytics Phase 1 ;
- Product Analytics Phase 2 ;
- Product Analytics Phase 3 / Remote Enablement ;
- migrations Supabase validées, y compris toute migration de sécurité ajoutée après inspection réelle ;
- correctifs de permissions/RLS/vues/fonctions ;
- ingestion analytics ;
- Data Quality ;
- dashboard analytics ;
- authentification/protection admin déjà implémentée ;
- correctifs de tests liés à ces fonctionnalités ;
- documentation technique nécessaire au déploiement.

Ne suppose aucun numéro de migration, nombre de commits ou nom de route depuis ce prompt : **vérifie le HEAD réel et les rapports présents dans le dépôt.**

## Hors périmètre par défaut

Ne committe et ne pousse pas automatiquement les travaux locaux sans rapport avec l’application de production, notamment s’ils existent encore :

```text
linkedin/
prompts/
release/
```

ou tout autre dossier d’artefacts éditoriaux / prompts.

De même, n’inclus pas une modification locale de développement, tunnel, `allowedDevOrigins`, debug ou équivalent si elle n’est pas nécessaire à la production.

**Audite le diff avant de décider.**

---

# 2. RÈGLES GIT

Avant toute modification :

```powershell
git status
git branch --show-current
git log --oneline --decorate -n 30
git remote -v
git rev-list --left-right --count origin/main...HEAD
```

La branche de production attendue est `main`. Si ce n’est pas le cas, explique pourquoi avant d’intégrer quoi que ce soit.

Tous les commits créés pendant cette mission doivent avoir :

```text
Author: Axel Corral
Committer: Axel Corral
```

Configure localement si nécessaire :

```powershell
git config --local user.name "Axel Corral"
git config --local user.email
```

Ne jamais inventer l’adresse email. Utilise une adresse déjà vérifiée dans la configuration ou l’historique.

Interdictions :

```text
Co-authored-by: Claude
Co-authored-by: Anthropic
Generated-by: Claude
```

Aucun force-push.

---

# 3. ÉTABLIR L’ÉTAT RÉEL AVANT DÉPLOIEMENT

Lire les rapports les plus récents pertinents présents au HEAD, notamment :

- rapports Product Analytics Phase 1/2/3 ;
- rapport d’enablement distant ;
- rapport de vérification du schéma distant ;
- documentation sécurité / Data Quality ;
- politique de versioning ;
- documentation admin/dashboard ;
- checklist de publication/déploiement existante.

Ne considère jamais qu’une phase est terminée seulement parce qu’un prompt l’a demandé.

Établis un tableau :

| Élément | Présent au HEAD | Testé localement | Testé sur Supabase réel | Destiné prod | Blocage |
|---|---|---|---|---|---|

Inclure au minimum :

- analytics ingestion ;
- migrations ;
- permissions/RLS ;
- dashboard analytics ;
- auth/admin ;
- build Next.js ;
- tests ;
- connexion Vercel ;
- variables d’environnement.

---

# 4. GATE « READY TO DEPLOY »

Avant tout déploiement, confirmer que les conditions suivantes sont vraies :

- migrations nécessaires déjà appliquées et validées sur le Supabase réel ;
- historique local/distant cohérent ;
- aucune migration en attente non vérifiée ;
- pas de secret tracké ;
- service/secret key jamais exposée au client ;
- dashboard analytics/admin protégé côté serveur ;
- utilisateur non autorisé incapable d’accéder aux données analytics ;
- build production local réussi ;
- tests critiques réussis ;
- déterminisme du jeu intact si les analytics ont été modifiées ;
- working tree compris et maîtrisé ;
- aucune donnée de test distante non nettoyée si la phase précédente exigeait son nettoyage.

Si une condition critique n’est pas vraie :

```text
DEPLOYMENT BLOCKED
```

Corrige uniquement ce qui relève réellement de cette release ou demande l’action externe minimale à Axel.

---

# 5. AUDIT DE L’ACCÈS ADMIN AVANT EXPOSITION INTERNET

Localise la route réelle du dashboard analytics/admin.

Ne suppose pas qu’elle s’appelle `/admin/analytics`.

Vérifie :

- mécanisme d’authentification réel ;
- mécanisme d’autorisation réel ;
- protection côté serveur ;
- comportement sans session ;
- comportement avec session invalide ;
- comportement avec utilisateur non-admin ;
- comportement avec administrateur autorisé ;
- absence de simple « URL cachée » comme unique protection.

Si l’application utilise déjà :

- mot de passe admin ;
- session secret ;
- Supabase Auth ;
- allowlist email ;
- rôle admin ;

documente la méthode réelle.

### Blocage critique

Si le dashboard analytics est publiquement accessible ou si la protection ne repose que sur du code client :

```text
DEPLOYMENT BLOCKED — ADMIN ANALYTICS NOT SECURE
```

Ne mets pas le site en production dans cet état.

Si une protection admin existe déjà mais nécessite uniquement sa configuration Vercel, configure-la.

N’invente pas un nouveau système d’authentification lourd dans cette mission.

---

# 6. AUDIT DES VARIABLES D’ENVIRONNEMENT REQUISES

Inspecte le code et les fichiers d’exemple pour établir la liste exacte des variables nécessaires.

Ne copie aucune liste de mémoire.

Classe-les :

| Variable | Client / serveur | Secret | Requise build | Requise runtime | Preview | Production |
|---|---|---:|---:|---:|---:|---:|

Vérifie notamment les familles réellement utilisées pour :

- Supabase URL ;
- publishable/anon key si le client en a réellement besoin ;
- secret/service-role key serveur ;
- authentification admin ;
- secret de session ;
- autres variables runtime existantes.

### Règles

- aucune secret/service-role key sous `NEXT_PUBLIC_*` ;
- aucune valeur secrète affichée dans le terminal ou le rapport ;
- aucune valeur secrète commitée ;
- ne crée aucune variable inutilisée ;
- n’utilise pas le mot de passe PostgreSQL de migration comme variable runtime Vercel sauf si le code production le nécessite réellement — ce qui doit être justifié.

---

# 7. LOCALISER LE PROJET VERCEL EXISTANT

Le dépôt a déjà été lié à Vercel dans les travaux précédents.

Inspecte :

```text
.vercel/project.json
```

et la configuration disponible, sans exposer de secret.

Confirme que le projet lié correspond bien à **Vers l’Élysée / political-destiny** ou au projet de production attendu.

Ne crée pas un nouveau projet Vercel si un projet existant correct est déjà lié.

Détecte :

```powershell
npx vercel --version
```

Si authentification Vercel nécessaire :

```text
VERCEL DEPLOYMENT — AUTHENTICATION REQUIRED
```

donne une seule action claire à Axel, par exemple :

```powershell
npx vercel login
```

puis reprends.

---

# 8. CONFIGURER LES VARIABLES VERCEL

Comparer les variables requises par le code avec celles réellement configurées dans Vercel.

Ne jamais afficher leurs valeurs.

Configurer les variables manquantes avec le mécanisme officiel Vercel.

Au minimum, distinguer :

```text
Production
Preview
Development
```

Ne configure une variable que dans les scopes nécessaires.

### Preview et Supabase

Si les previews pointent vers le même Supabase que la production :

- ne lance aucun test destructif ;
- identifie clairement les runs synthétiques ;
- nettoie-les après validation ;
- ne pollue pas les métriques utilisateurs.

Si un environnement Supabase de test séparé existe déjà, privilégie-le pour Preview.

Ne crée pas un second projet Supabase sans nécessité.

---

# 9. QA LOCALE FINALE

Avant le premier déploiement Vercel, exécuter les commandes réellement définies par le projet.

Au minimum, si elles existent :

```powershell
npm run lint
npx tsc --noEmit
npm run data:validate
npm run test
npm run build
```

Puis les E2E critiques appropriés.

Si Vitest avait auparavant découvert des suites parasites sous des dossiers de carrousel/LinkedIn, vérifier que le signal de tests est désormais propre avant de dire « tests verts ».

Documenter les résultats exacts.

Aucun « tout est vert » si une suite échoue réellement.

---

# 10. CONTRÔLE DU BUNDLE ET DES SECRETS

Avant déploiement :

- rechercher toute occurrence d’une clé Supabase sensible dans les fichiers générés si possible ;
- confirmer qu’aucune service/secret key n’est incluse dans le bundle client ;
- vérifier que les Server Components / Route Handlers qui utilisent la clé privilégiée restent serveur-only ;
- vérifier que les fichiers `.env*` secrets ne sont pas trackés.

Si une secret key apparaît dans un artefact client :

```text
DEPLOYMENT BLOCKED — SECRET IN CLIENT BUNDLE
```

---

# 11. COMMITS DE RELEASE

Si la Phase 3 ou cette mission a créé des modifications non commitées destinées à la production :

1. regrouper les changements par responsabilité ;
2. créer uniquement les commits réellement nécessaires ;
3. ne jamais inclure les fichiers hors périmètre ;
4. vérifier l’auteur et le committer.

Avant chaque commit :

```powershell
git diff
git diff --cached
git status --short
```

Après :

```powershell
git show -s --format=fuller HEAD
```

Ne modifie pas l’historique des commits déjà corrects sans raison.

---

# 12. DÉPLOIEMENT PREVIEW AVANT PRODUCTION

Créer un **Preview Deployment** Vercel depuis le commit exact candidat à la production.

Utilise la commande réellement appropriée au projet lié, par exemple :

```powershell
npx vercel
```

Capture :

```text
commit SHA
preview deployment URL
deployment ID si disponible
```

Ne mets aucun secret dans le rapport.

---

# 13. SMOKE TEST DU PREVIEW

Tester le preview réellement déployé.

## Public

Vérifier au minimum :

- page d’accueil ;
- chargement des assets ;
- démarrage d’une partie ;
- navigation principale ;
- absence d’erreur runtime visible ;
- absence de 500 inattendue.

## Admin analytics

Vérifier :

### Sans authentification

Accéder directement à la route admin/dashboard.

Résultat attendu :

```text
redirect login / 401 / 403
```

Jamais les données.

### Authentification invalide

Résultat attendu :

```text
accès refusé
```

### Authentification admin valide

Résultat attendu :

- dashboard accessible ;
- onglets chargés ;
- données lues côté serveur ;
- aucune secret key visible dans les requêtes navigateur.

## Analytics

Effectuer uniquement un test contrôlé si nécessaire :

- consentement approprié ;
- un run marqué comme test ;
- vérification de son arrivée dans Supabase ;
- vérification éventuelle dans le dashboard ;
- nettoyage du run de test.

Ne falsifie pas de données utilisateurs.

---

# 14. INSPECTION DES LOGS PREVIEW

Inspecter les logs Vercel disponibles pour le smoke test.

Chercher :

- 500 ;
- erreurs Supabase ;
- erreurs auth ;
- erreurs de variables d’environnement ;
- erreurs Server Components ;
- stack traces inattendues.

Confirmer qu’aucun secret n’est loggé.

---

# 15. GATE PREVIEW → PRODUCTION

Ne passer à la production que si :

- build Vercel réussi ;
- pages publiques fonctionnelles ;
- auth admin fonctionnelle ;
- utilisateur anonyme bloqué ;
- dashboard admin fonctionnel ;
- Supabase accessible côté serveur ;
- aucune clé privilégiée exposée ;
- aucun bug P0/P1 détecté ;
- aucune migration manquante.

Sinon :

```text
PRODUCTION DEPLOYMENT BLOCKED
```

Corriger et générer un nouveau preview.

---

# 16. PUSH GITHUB

Une fois le Preview validé :

vérifier une dernière fois :

```powershell
git status
git log --oneline --decorate -n 20
```

Puis pousser la branche `main` vers `origin/main` :

```powershell
git push origin main
```

Pas de force push.

Après push :

```powershell
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Confirmer que les SHA correspondent.

---

# 17. DÉPLOIEMENT PRODUCTION VERCEL

Déterminer si le projet Vercel déploie automatiquement `main`.

## Si Git Integration active

Après le push :

- attendre/inspecter le deployment déclenché ;
- confirmer qu’il correspond exactement au SHA poussé.

## Si aucun déploiement automatique

Utiliser le workflow officiel du projet, par exemple :

```powershell
npx vercel --prod
```

La production doit correspondre au même code que le Preview validé.

Ne déploie pas un working tree différent du commit poussé.

---

# 18. SMOKE TEST PRODUCTION

Une fois le deployment production prêt, tester l’URL publique réelle.

## Application publique

Vérifier :

- HTTP OK ;
- accueil ;
- démarrage de partie ;
- assets ;
- navigation ;
- aucun écran d’erreur.

## Admin

Vérifier :

- route admin inaccessible sans auth ;
- login admin fonctionnel ;
- dashboard analytics accessible avec les bons droits ;
- aucune donnée analytics exposée à un utilisateur non autorisé.

## Analytics production

Effectuer un test minimal et nettoyable :

```text
consentement autorisé
→ événement contrôlé
→ arrivée Supabase
→ visible dans le reporting si attendu
→ cleanup
```

Si le test n’est pas nécessaire parce que la Phase 3 l’a déjà démontré sur cette URL/runtime exact, ne crée pas artificiellement de trafic.

---

# 19. VÉRIFICATION POST-DÉPLOIEMENT SUPABASE

Après le premier trafic production contrôlé :

vérifier :

- ingestion batches ;
- absence de rejected rate anormal ;
- Data Quality ;
- absence de duplication ;
- version moteur attendue ;
- aucun run de test orphelin.

Ne modifie aucune donnée utilisateur réelle.

---

# 20. ROLLBACK

Avant le déploiement production, identifier le deployment production précédent.

Conserver :

```text
previous production deployment
new production deployment
new commit SHA
```

Si le smoke test production révèle un P0/P1 :

1. stopper les tests ;
2. rollback vers le deployment précédent avec le mécanisme officiel Vercel si disponible ;
3. vérifier le retour au service ;
4. documenter le défaut ;
5. ne pas masquer l’échec dans le rapport.

---

# 21. DOCUMENTATION

Créer :

```text
VERCEL_PRODUCTION_DEPLOYMENT_REPORT.md
```

Le rapport doit contenir :

## A. Commit déployé

```text
branch :
SHA :
origin/main :
```

## B. Vercel

```text
project :
preview :
production :
```

## C. Variables

Uniquement :

```text
variable : présente/absente
scope : Preview/Production
secret : oui/non
```

Jamais les valeurs.

## D. QA locale

## E. Preview smoke test

## F. Production smoke test

## G. Admin security

```text
anonymous access :
invalid session :
authorized admin :
secret client exposure :
```

## H. Analytics

```text
Supabase connection :
ingestion :
reporting :
Data Quality :
cleanup :
```

## I. Git

```text
commits :
push :
SHA local = remote :
```

## J. Rollback

## K. Limites restantes

Classer :

```text
P0
P1
P2
P3
```

## L. Verdict

---

# 22. CRITÈRES DE SUCCÈS

Ne prononcer :

```text
PRODUCTION DEPLOYED — READY
```

que si tous les points suivants sont vrais :

- [ ] le HEAD destiné à production est identifié ;
- [ ] aucun fichier local hors périmètre n’a été embarqué ;
- [ ] build production local réussi ;
- [ ] tests critiques réussis ;
- [ ] migrations Supabase nécessaires réellement appliquées ;
- [ ] aucune migration en attente ;
- [ ] variables Vercel requises configurées ;
- [ ] secrets absents du client ;
- [ ] dashboard/admin protégé côté serveur ;
- [ ] accès anonyme refusé ;
- [ ] accès admin autorisé fonctionnel ;
- [ ] preview déployé et testé ;
- [ ] preview sans P0/P1 ;
- [ ] `main` poussé sans force push ;
- [ ] SHA local = SHA origin/main ;
- [ ] production déployée depuis ce SHA ;
- [ ] application publique fonctionnelle ;
- [ ] dashboard admin fonctionnel ;
- [ ] connexion Supabase production fonctionnelle ;
- [ ] analytics sans anomalie critique ;
- [ ] données synthétiques de validation nettoyées ;
- [ ] deployment précédent identifié pour rollback ;
- [ ] rapport de déploiement produit.

Sinon :

```text
PRODUCTION DEPLOYMENT BLOCKED
```

ou :

```text
PRODUCTION DEPLOYED — DEGRADED
```

avec raison précise.

---

# 23. POINTS D’ARRÊT AUTORISÉS

Travaille de manière autonome.

Ne demande l’intervention d’Axel que si nécessaire pour :

1. authentification Vercel ;
2. création/validation d’une variable secrète dont la valeur n’est pas disponible localement ;
3. confirmation d’une route/admin policy ambiguë qui ne peut pas être résolue depuis le code ;
4. décision impliquant coût/billing ;
5. découverte d’un secret compromis nécessitant rotation ;
6. conflit Git distant qui ne peut pas être résolu sans arbitrage.

Dans ce cas :

- explique le blocage en une phrase ;
- donne une action exacte ;
- reprends ensuite sans recommencer la mission.

---

# 24. INTERDICTIONS

Ne pas :

- créer un nouveau projet Vercel si le projet existant est correct ;
- créer un nouveau projet Supabase inutilement ;
- exposer la Secret/Service key ;
- mettre un secret sous `NEXT_PUBLIC_*` ;
- pousser les dossiers éditoriaux locaux sans rapport ;
- pousser une configuration de tunnel/debug locale ;
- modifier le gameplay pour faciliter le smoke test ;
- supprimer de vraies données analytics ;
- réinitialiser la base Supabase ;
- faire de force push ;
- déclarer la production prête sans smoke test réel.

---

# 25. SORTIE TERMINALE FINALE

Afficher :

```text
VERS L’ÉLYSÉE — VERCEL PRODUCTION DEPLOYMENT

SOURCE
Branch :
Commit :
origin/main :
Working tree :

VERCEL
Project :
Preview :
Preview smoke test :
Production :
Production smoke test :

ADMIN
Route :
Protection server-side :
Anonymous blocked :
Admin access :
Secret exposure :

SUPABASE
Remote schema :
Migrations :
Runtime connection :
Analytics ingestion :
Dashboard reporting :
Data Quality :
Cleanup :

QA
Lint :
Typecheck :
Unit tests :
Analytics tests :
E2E :
Build :

GIT
Author/Committer :
Push :
Force push : NON

ROLLBACK
Previous production :
Rollback ready :

LIMITES RESTANTES :
-

VERDICT :
PRODUCTION DEPLOYED — READY
```

Si un critère n’est pas rempli, utiliser le verdict exact correspondant.

Commence uniquement lorsque les tâches précédentes en queue sont terminées. Commence alors par auditer le HEAD réel, les rapports les plus récents, le working tree et le projet Vercel existant avant toute écriture ou tout déploiement.
