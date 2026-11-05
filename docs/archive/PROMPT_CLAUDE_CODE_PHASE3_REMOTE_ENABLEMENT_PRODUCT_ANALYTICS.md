# PROMPT MAÎTRE — PHASE 3 PRODUCT ANALYTICS
## Remote Enablement Supabase, validation PostgreSQL réelle et passage à « READY FOR PRODUCTION DATA »
### Projet : « Vers l’Élysée »

Tu interviens comme **Senior Analytics Engineer**, **Data Engineer**, **PostgreSQL/Supabase Engineer**, **Product Analytics Engineer**, **QA Lead**, **Security Reviewer** et **Release Engineer**.

La Phase 2 est terminée localement.

Le dernier rapport de référence est :

```text
PHASE2_IMPLEMENTATION_REPORT.md
```

Son verdict est :

```text
READY FOR REMOTE ENABLEMENT
```

La mission présente constitue **la Phase 3**.

Son but n’est PAS d’ajouter de nouvelles fonctionnalités analytics.

Son but est de prendre l’architecture Product Analytics déjà implémentée et testée localement, de la connecter à un **vrai PostgreSQL/Supabase**, d’appliquer les migrations, de vérifier la chaîne de collecte de bout en bout sur une base réelle, de tester le consentement, l’idempotence, les upserts concurrents, la Data Quality, le dashboard et une charge bornée, puis de déterminer objectivement si le système peut enfin être déclaré :

```text
READY FOR PRODUCTION DATA
```

ou s’il reste :

```text
REMOTE ENABLEMENT BLOCKED
```

---

# 1. PRINCIPES ABSOLUS

## 1.1 Pas de nouvelle feature

Cette mission ne doit pas devenir une Phase 2 bis.

Ne pas ajouter spontanément :

- nouveaux événements analytics ;
- nouvelles métriques produit ;
- nouveaux onglets de dashboard ;
- nouvelle architecture d’ingestion ;
- nouveau moteur de jeu ;
- nouveau framework ;
- nouvelles visualisations non nécessaires.

Corriger uniquement :

1. un défaut réellement révélé par PostgreSQL/Supabase réel ;
2. un problème de sécurité ;
3. un problème d’ingestion ;
4. un problème de migration ;
5. un problème de cohérence entre collecte, stockage et reporting ;
6. un défaut empêchant le passage à `READY FOR PRODUCTION DATA`.

---

## 1.2 Ne jamais toucher au gameplay

Le moteur de jeu doit rester fonctionnellement identique.

Aucune modification de :

- probabilités ;
- événements ;
- résultats ;
- règles électorales ;
- candidats ;
- partis ;
- contenu ;
- équilibrage.

Le déterminisme du moteur doit être revalidé après la mission.

---

## 1.3 Secrets

Ne jamais :

- afficher une `SUPABASE_SERVICE_ROLE_KEY` dans un rapport ;
- commiter un secret ;
- mettre une service-role key dans du code client ;
- écrire une clé dans un fichier tracké ;
- inclure une clé dans une capture d’écran ;
- copier un secret dans un log persistant.

Avant toute connexion, vérifier `.gitignore`.

Les secrets locaux doivent vivre uniquement dans l’emplacement déjà prévu par le projet, par exemple `.env.local`, si celui-ci est bien ignoré.

---

## 1.4 Identité Git

Tous les nouveaux commits éventuels de cette mission doivent être :

```text
Author: Axel Corral
Committer: Axel Corral
```

Jamais Claude / Anthropic.

Avant le premier commit :

```powershell
git config --local user.name "Axel Corral"
git config --local user.email
```

Ne jamais inventer l’adresse email.

Si aucune adresse Git valide d’Axel n’est déjà identifiable dans la configuration ou l’historique :

```text
STOP — EMAIL GIT D’AXEL À CONFIRMER
```

Aucun trailer :

```text
Co-authored-by: Claude
Co-authored-by: Anthropic
Generated-by: Claude
```

---

## 1.5 Aucun push

Cette mission peut créer des commits locaux propres si nécessaire.

Mais :

```text
NE PUSH RIEN
```

Le dépôt était déjà en avance sur `origin/main`.

La publication GitHub sera une étape distincte.

---

# 2. ÉTAT DE RÉFÉRENCE DE LA PHASE 2

Le rapport Phase 2 indique notamment que l’architecture locale comprend déjà :

- `decision_viewed`
- `choice_selected`
- `decision_resolved` enrichi
- score T1
- score T2
- adversaire T2
- `race_snapshot` enrichi
- `player_dashboard_opened`
- `game_error` structuré
- distinction `ENGINE_LOGIC_VERSION` / `save_schema_version`
- migrations `0005` et `0006`
- upserts PostgreSQL atomiques
- `analytics_ingestion_batches`
- contrôles Data Quality supplémentaires
- dashboard Product Analytics étendu
- seed analytics enrichi
- `analytics:verify:remote`
- documentation d’enablement distant.

Le rapport Phase 2 indique également que **rien n’a encore été exécuté contre un vrai PostgreSQL/Supabase**.

C’est précisément le périmètre de cette mission.

---

# 3. DOCUMENTS À LIRE AVANT TOUTE ACTION

Lire intégralement :

```text
PHASE2_IMPLEMENTATION_REPORT.md
docs/analytics/PHASE2_AUDIT.md
docs/analytics/REMOTE_ENABLEMENT_CHECKLIST.md
docs/analytics/VERSIONING_POLICY.md
docs/analytics/PRODUCT_ANALYTICS_COVERAGE.md
docs/analytics/EVENT_CATALOG.md
docs/analytics/DATA_DICTIONARY.md
docs/analytics/DATA_QUALITY.md
docs/analytics/README.md
README.md
package.json
```

Lire également les documents Phase 1 utiles, s’ils existent.

Inspecter toutes les migrations analytics :

```text
supabase/migrations/
```

ou leur emplacement réel.

Lire **0001 à 0006**, pas seulement les deux dernières.

Inspecter ensuite :

- schémas Zod analytics ;
- client analytics ;
- queue ;
- ingestion ;
- API/route d’ingestion ;
- fonctions de consentement ;
- `analytics:seed` ;
- `analytics:verify:remote` ;
- dashboard analytics ;
- tests unitaires/E2E analytics.

---

# 4. PHASE A — AUDIT DU HEAD ET DES PRÉREQUIS

Commencer par :

```powershell
git status
git branch --show-current
git log --oneline --decorate -n 30
git remote -v
```

Documenter :

```text
HEAD :
branche :
commits ahead/behind :
working tree :
```

Vérifier ensuite :

```powershell
node --version
npm --version
```

Détecter sans installer globalement :

```powershell
npx supabase --version
psql --version
docker --version
```

Ne considère pas leur absence comme bloquante tant qu’une voie distante sûre existe.

---

# 5. PHASE B — DÉTECTION DE LA CONFIGURATION SUPABASE

Chercher sans afficher les valeurs :

```text
SUPABASE_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

dans :

- environnement courant ;
- `.env.local` ;
- autres fichiers `.env*` ignorés ;
- configuration Supabase existante.

Afficher uniquement :

```text
SUPABASE_URL: présent / absent
ANON KEY: présent / absent
SERVICE ROLE KEY: présent / absent
```

Jamais la valeur.

Chercher aussi :

```text
supabase/config.toml
.vercel/
```

et toute documentation de projet Supabase déjà existante.

---

# 6. GATE DES PRÉREQUIS DISTANTS

## Cas A — projet Supabase déjà configuré

Si un projet réel est identifiable et les credentials requis sont présents :

continuer.

## Cas B — projet identifiable mais authentification manquante

S’arrêter uniquement sur l’action externe nécessaire.

Afficher :

```text
REMOTE ENABLEMENT — AUTHENTIFICATION REQUISE
```

et demander exactement ce qui manque.

Ne demande pas plusieurs informations si une seule action de login suffit.

## Cas C — aucun projet Supabase n’existe ou n’est identifiable

Ne crée pas arbitrairement :

- organisation ;
- région ;
- projet payant ;
- mot de passe ;
- nom de projet.

Afficher :

```text
REMOTE ENABLEMENT — PROJET SUPABASE À CHOISIR/CRÉER
```

Puis donner à Axel les informations minimales nécessaires pour reprendre :

1. créer ou choisir un projet Supabase destiné à Vers l’Élysée ;
2. fournir/configurer les credentials via l’emplacement sécurisé prévu ;
3. revenir dans le même run si possible.

Si le CLI est déjà authentifié et qu’un projet clairement destiné à Vers l’Élysée existe dans le compte d’Axel, tu peux le sélectionner sans créer une nouvelle ressource.

---

# 7. SÉCURITÉ AVANT PREMIÈRE CONNEXION

## 7.1 Vérifier `.gitignore`

Confirmer que sont ignorés si présents :

```text
.env
.env.local
.env.*.local
```

ou équivalent.

## 7.2 Rechercher des secrets trackés

Utiliser une recherche adaptée, par exemple :

```powershell
git grep -n -I -E "(SUPABASE_SERVICE_ROLE_KEY|service_role|api[_-]?key|secret|password|private[_-]?key)"
```

Distinguer :

- nom de variable légitime ;
- vraie valeur secrète.

Si une vraie clé sensible est trackée :

```text
STOP — SECRET TRACKÉ
```

Ne poursuis pas l’enablement distant avant traitement.

## 7.3 Vérifier la frontière client/serveur

Confirmer qu’une service-role key :

- n’est jamais importée dans un composant client ;
- n’est jamais exposée par `NEXT_PUBLIC_*` ;
- n’entre jamais dans le bundle navigateur.

---

# 8. PHASE C — PRÉFLIGHT DU PROJET POSTGRES DISTANT

Avant d’appliquer une migration :

déterminer si la base distante est :

```text
vide
déjà partiellement migrée
déjà utilisée
```

Inspecter :

- tables analytics ;
- migrations déjà appliquées ;
- vues ;
- fonctions ;
- données existantes.

Si le projet est déjà utilisé :

1. compter les lignes des tables analytics importantes ;
2. identifier la version de schéma ;
3. vérifier que les migrations prévues sont réellement non destructives ;
4. ne supprimer aucune donnée de production.

Si une migration peut être destructive sur des données existantes :

```text
STOP — MIGRATION POTENTIELLEMENT DESTRUCTIVE
```

et documenter précisément l’opération.

---

# 9. VALIDATION SQL AVANT APPLICATION

Le rapport précédent indique que les migrations n’ont jamais été exécutées contre PostgreSQL.

Avant le remote push, utiliser la voie la plus sûre disponible :

### Priorité 1
Supabase local / PostgreSQL local si disponible facilement.

### Priorité 2
branche / environnement de développement Supabase si le projet en possède déjà un.

### Priorité 3
projet Supabase réel dédié au projet, après préflight.

Ne construis pas une infrastructure lourde uniquement pour ce test.

L’objectif est de faire enfin interpréter les migrations `0001–0006` par **un vrai moteur PostgreSQL**.

---

# 10. PHASE D — APPLIQUER LES MIGRATIONS 0001–0006

Suivre d’abord :

```text
docs/analytics/REMOTE_ENABLEMENT_CHECKLIST.md
```

comme source de vérité.

Ne remplace pas silencieusement sa procédure par une autre.

Appliquer les migrations dans l’ordre.

Après chaque étape importante, vérifier :

- succès SQL ;
- aucune erreur de dépendance ;
- aucune table manquante ;
- aucune vue invalide ;
- aucune fonction invalide.

En cas d’échec :

1. capturer l’erreur exacte ;
2. identifier la cause ;
3. corriger uniquement la migration / code analytics concerné ;
4. ne jamais modifier manuellement la base d’une façon impossible à reproduire par migration ;
5. rejouer depuis un état propre si nécessaire.

Toute correction de schéma doit rester **reproductible depuis les migrations**.

---

# 11. PHASE E — INSPECTION DU SCHÉMA DISTANT

Après application :

vérifier effectivement l’existence et la structure de :

- tables analytics ;
- colonnes ;
- contraintes ;
- indexes ;
- vues ;
- fonctions SQL ;
- fonctions d’upsert ;
- `analytics_ingestion_batches` ;
- settings ;
- vues Data Quality ;
- fonctions de reporting.

Comparer au dictionnaire de données.

Créer :

```text
docs/analytics/REMOTE_SCHEMA_VERIFICATION.md
```

avec un tableau :

| Objet | Attendu | Distant | Verdict |
|---|---|---|---|

Ne jamais y écrire de credentials.

---

# 12. PHASE F — EXÉCUTER LE SMOKE TEST DISTANT

Lancer :

```powershell
npm run analytics:verify:remote
```

ou la commande réelle définie dans `package.json`.

Ne considère pas un simple code de sortie 0 comme suffisant.

Le script doit prouver au minimum :

- connexion réelle ;
- écriture ;
- lecture ;
- cycle du catalogue prévu ;
- idempotence ;
- cleanup ciblé.

Documenter :

```text
remote verify :
nombre d’événements test :
écriture :
lecture :
idempotence :
cleanup :
verdict :
```

Si le script révèle un bug :

corriger, ajouter un test de non-régression, puis rejouer.

---

# 13. PHASE G — TEST RÉEL DU CONSENTEMENT

Tester de bout en bout avec le **vrai backend**.

Scénarios obligatoires :

## A. Consentement `unset`

Jouer / déclencher des événements.

Vérifier en base :

```text
0 événement analytics envoyé
```

## B. Consentement `denied`

Même vérification.

## C. Consentement `granted`

Vérifier réellement en base l’arrivée de :

```text
decision_viewed
choice_selected
decision_resolved
```

sur une décision jouée.

Vérifier :

- même `run_id` ;
- même décision logique ;
- convention `decisionIndex` correcte ;
- ordre logique récupérable ;
- fusion correcte dans les structures de reporting.

## D. Retrait du consentement

Après quelques événements :

- retirer le consentement ;
- continuer à jouer ;
- vérifier qu’aucun nouvel événement analytics n’arrive après le retrait.

Ne conclure à la conformité que sur preuve distante réelle.

---

# 14. PHASE H — PARTIE RÉELLE DE BOUT EN BOUT

Faire au moins une session analytique réelle complète ou une fixture E2E produisant le même parcours :

```text
début de run
→ décisions
→ dashboard joueur ouvert
→ premier tour
→ éventuel second tour
→ fin de run
```

Vérifier dans PostgreSQL :

- run créé ;
- versioning ;
- timestamps ;
- décisions ;
- score T1 ;
- score T2 si applicable ;
- adversaire T2 si applicable ;
- race snapshots ;
- dashboard opened ;
- completion ;
- winner / qualification ;
- aucune duplication incohérente.

Utiliser un identifiant de test clairement reconnaissable et nettoyable.

---

# 15. PHASE I — TEST DE `decisionIndex`

Le bug Phase 2 sur la convention `decisionIndex` était important.

Créer une vérification distante explicite :

pour plusieurs décisions d’une même session :

```text
decision_viewed
choice_selected
decision_resolved
```

doivent se retrouver sur la même décision analytique.

Vérifier :

- aucun décalage systématique de +1/-1 ;
- aucun événement orphelin ;
- aucune décision résolue non fusionnée à cause de l’index.

Documenter le résultat dans le rapport final.

---

# 16. PHASE J — IDEMPOTENCE ET INGESTION HORS ORDRE

Sur la vraie base :

## Test 1 — même batch rejoué

Envoyer deux fois exactement le même lot.

Résultat attendu :

- pas de duplication logique ;
- valeurs stables.

## Test 2 — ordre normal

```text
viewed → selected → resolved
```

## Test 3 — ordre inversé

Par exemple :

```text
resolved → viewed → selected
```

ou le scénario explicitement couvert par le code.

Résultat attendu :

- ligne finale cohérente ;
- données enrichies ;
- aucun écrasement incorrect.

---

# 17. PHASE K — CONCURRENCE RÉELLE DES UPSERTS

Le rapport Phase 2 indique que les upserts sont désormais atomiques par ligne mais non testés sous charge PostgreSQL réelle.

Construire un test borné et reproductible.

Sur **un run analytique de test dédié** :

- envoyer plusieurs requêtes concurrentes visant la même ligne de run ;
- faire de même sur une décision ;
- inclure des événements complémentaires arrivant presque simultanément.

Tester au moins plusieurs niveaux de concurrence raisonnables.

Ne déclenche pas une charge agressive inutile.

Vérifier :

- aucune erreur d’unicité ;
- aucune donnée perdue ;
- résultat final cohérent ;
- nombre de lignes attendu ;
- aucun doublon logique.

Si une race condition réelle apparaît :

corriger uniquement la couche analytics concernée et ajouter un test.

---

# 18. PHASE L — OBSERVABILITÉ DE L’INGESTION

Vérifier en base que :

```text
analytics_ingestion_batches
```

permet réellement de mesurer :

- batch reçu ;
- accepté ;
- rejeté ;
- timestamps ;
- taux de rejet ;
- erreur catégorisée si prévu.

Provoquer de manière sûre un petit nombre de cas invalides synthétiques conformes au protocole de test.

Ne jamais stocker le payload rejeté si le design interdit cela.

Vérifier que l’observabilité ne contient pas de donnée sensible inutile.

---

# 19. PHASE M — DATA QUALITY SUR BASE RÉELLE

Exécuter tous les contrôles Data Quality disponibles.

Pour chaque contrôle :

```text
nom
description
résultat
nombre de violations
cause
```

Les données de test peuvent volontairement produire certains états.

Distinguer :

- violation attendue créée par le test ;
- vrai défaut du pipeline.

Vérifier particulièrement les nouveaux contrôles Phase 2.

---

# 20. PHASE N — SEED ANALYTICS DISTANT

Le seed analytique a été enrichi en Phase 2.

Avant de l’exécuter à distance :

1. vérifier qu’il est conçu pour pouvoir être nettoyé ;
2. vérifier qu’il ne peut pas contaminer des données réelles sans marqueur ;
3. utiliser un espace / identifiant de test explicite.

Si l’environnement Supabase est destiné uniquement au développement du projet, exécuter le seed.

Sinon, préférer un jeu de données de test clairement isolable.

Vérifier que les événements générés passent réellement :

- validation ;
- ingestion ;
- stockage ;
- reporting.

---

# 21. PHASE O — VALIDATION DES 6 ONGLETS DU DASHBOARD

Avec de **vraies données PostgreSQL**, vérifier les six zones documentées.

Au minimum :

## Overview

Vérifier :

- runs ;
- completion ;
- stale ;
- navigateur ;
- durée ;
- qualification ;
- victoire ;
- avertissement de couverture opt-in.

## Équilibrage

Vérifier :

- score T1 moyen ;
- score T1 médian ;
- victoire conditionnelle à qualification.

## Gameplay

Vérifier :

- expositions réelles ;
- choix sélectionnés ;
- choice share ;
- seuils ;
- latence.

## Rétention / usage

Vérifier :

- ouverture dashboard ;
- matchup T2 parti × adversaire.

## Versions

Vérifier :

- engine logic version ;
- save schema version ;
- rare/chain/decisive flags ;
- contenu jamais exposé si la donnée le permet.

## Qualité

Vérifier :

- ingestion batches ;
- rejected rate ;
- erreurs techniques par code ;
- contrôles Data Quality.

Pour chaque onglet :

```text
PASS
PARTIAL
FAIL
```

avec justification.

Ne pas transformer un `PARTIAL` documenté en `PASS`.

---

# 22. PHASE P — TEST DE CHARGE POSTGRESQL BORNÉ

Le rapport Phase 2 indique qu’aucun test de charge réel PostgreSQL n’a encore été fait.

Construire un protocole raisonnable.

Objectif :

> valider que la chaîne d’ingestion supporte un volume réaliste de télémétrie sans corruption.

Comparer autant que possible au test Phase 1 qui utilisait un volume synthétique important, mais cette fois-ci sur le **vrai chemin PostgreSQL**.

Le protocole doit être écrit AVANT exécution dans :

```text
docs/analytics/REMOTE_LOAD_TEST_PLAN.md
```

Il doit préciser :

- nombre total d’événements ;
- taille des batches ;
- niveau de concurrence ;
- type d’événements ;
- IDs de test ;
- métriques observées ;
- cleanup ;
- critère PASS/FAIL.

Choisir une charge bornée adaptée au quota et à l’environnement.

Ne pas lancer un stress test destructif.

Mesurer au minimum :

- événements envoyés ;
- événements acceptés ;
- événements rejetés ;
- durée totale ;
- débit approximatif ;
- erreurs ;
- doublons ;
- lignes finales ;
- incohérences.

---

# 23. PHASE Q — NETTOYAGE DES DONNÉES DE TEST

Tous les tests distants doivent utiliser des identifiants permettant un nettoyage ciblé.

À la fin :

- supprimer les runs synthétiques de validation ;
- supprimer les données du load test ;
- conserver seulement les données explicitement souhaitées ;
- ne supprimer aucune donnée utilisateur réelle.

Vérifier après cleanup que les tables ne contiennent plus de données de test orphelines.

---

# 24. PHASE R — SÉCURITÉ / PRIVACY FINALE

Vérifier :

## 24.1 Pas de PII inutile

Confirmer que la télémétrie n’envoie pas :

- nom ;
- email ;
- IP stockée volontairement ;
- texte libre utilisateur ;
- contenu de sauvegarde ;
- payload d’erreur brut.

## 24.2 `anonymous_user_id`

Documenter explicitement qu’il ne permet pas d’identifier une personne précise sans autre donnée.

## 24.3 Consentement

Confirmer sur backend réel :

```text
unset → aucun événement
denied → aucun événement
granted → collecte
withdrawal → arrêt
```

## 24.4 Service role

Confirmer qu’elle n’est utilisée que côté sécurisé.

---

# 25. PHASE S — REVALIDATION LOCALE APRÈS ÉVENTUELLES CORRECTIONS

Si la mission a nécessité la moindre correction de code :

relancer :

```powershell
npm run lint
npx tsc --noEmit
npm run data:validate
npm run test
npm run build
npx playwright test --project=chromium
```

et les suites analytics dédiées.

Même si aucune correction n’a été nécessaire, relancer au minimum les commandes critiques documentées par le projet.

---

# 26. TRAITER LE BRUIT DES SUITES `linkedin/*/node_modules`

Le rapport Phase 2 documente des suites parasites qui échouent au chargement à cause de dépendances de test trouvées dans :

```text
linkedin/*/node_modules/
```

Auditer ce point.

Si la cause est simplement que Vitest découvre des dépendances internes à un dossier non applicatif :

corriger proprement la configuration de test / exclusion pour que :

```text
npm run test
```

représente réellement les tests du projet.

Ne masque pas une vraie suite applicative.

Après correction, le résultat final doit distinguer clairement :

```text
tests applicatifs
tests analytics
tests E2E
```

Objectif idéal :

```text
aucune suite parasite à 0 test
```

Cette correction est autorisée car elle fiabilise le signal QA, pas le gameplay.

---

# 27. DOCUMENTATION À METTRE À JOUR

Mettre à jour uniquement si les faits distants le justifient :

```text
docs/analytics/REMOTE_ENABLEMENT_CHECKLIST.md
docs/analytics/PRODUCT_ANALYTICS_COVERAGE.md
docs/analytics/DATA_QUALITY.md
docs/analytics/README.md
```

Créer :

```text
docs/analytics/REMOTE_SCHEMA_VERIFICATION.md
docs/analytics/REMOTE_LOAD_TEST_PLAN.md
```

Puis produire :

```text
PHASE3_REMOTE_ENABLEMENT_REPORT.md
```

---

# 28. RAPPORT FINAL OBLIGATOIRE

Le rapport doit comporter :

## A. Résumé

## B. Environnement distant

Sans secret :

```text
provider :
project ref partiellement masqué :
region si connue :
schema :
```

## C. Migrations

Pour `0001–0006` :

```text
appliquée :
résultat :
correction requise :
```

## D. Schéma

Tables / vues / fonctions / indexes / contraintes.

## E. `analytics:verify:remote`

Résultat réel.

## F. Consentement

```text
unset :
denied :
granted :
withdrawal :
```

## G. Session complète

Événements observés.

## H. `decisionIndex`

Vérification distante.

## I. Idempotence

## J. Hors ordre

## K. Concurrence

## L. Observabilité ingestion

## M. Data Quality

## N. Dashboard

Tableau :

| Onglet | Verdict | Preuve | Limite |
|---|---|---|---|

## O. Load test

Avec chiffres réellement mesurés.

## P. Privacy / sécurité

## Q. Tests locaux finaux

Ne jamais écrire « tout vert » si ce n’est pas strictement vrai.

## R. Limites restantes

Distinguer :

```text
P0
P1
P2
P3
```

## S. Commits locaux

## T. Verdict

---

# 29. CRITÈRES POUR `READY FOR PRODUCTION DATA`

Ne prononcer :

```text
READY FOR PRODUCTION DATA
```

que si TOUS les points suivants sont vrais :

- [ ] un vrai PostgreSQL/Supabase a été utilisé ;
- [ ] migrations `0001–0006` appliquées réellement ;
- [ ] schéma vérifié ;
- [ ] `analytics:verify:remote` PASS ;
- [ ] `unset` n’envoie rien ;
- [ ] `denied` n’envoie rien ;
- [ ] `granted` écrit réellement ;
- [ ] retrait du consentement arrête réellement les envois ;
- [ ] décision viewed/selected/resolved fusionnée correctement ;
- [ ] convention `decisionIndex` confirmée à distance ;
- [ ] score T1 stocké ;
- [ ] score T2/adversaire stockés lorsqu’applicables ;
- [ ] idempotence distante validée ;
- [ ] ingestion hors ordre validée ;
- [ ] upserts concurrents validés sur PostgreSQL réel ;
- [ ] observabilité d’ingestion fonctionnelle ;
- [ ] Data Quality réelle exécutée ;
- [ ] dashboard vérifié sur données PostgreSQL réelles ;
- [ ] load test borné effectué ;
- [ ] aucune corruption de données ;
- [ ] aucun secret exposé ;
- [ ] aucune PII inutile ;
- [ ] déterminisme du jeu intact ;
- [ ] build production vert ;
- [ ] E2E critiques verts ;
- [ ] données synthétiques nettoyées.

Sinon utiliser :

```text
REMOTE ENABLEMENT PARTIAL
```

ou :

```text
REMOTE ENABLEMENT BLOCKED
```

selon le cas.

---

# 30. COMMITS

Si des modifications de code/docs/migrations sont nécessaires :

créer des commits atomiques et logiques.

Exemples uniquement si le diff réel correspond :

```text
fix(analytics): correct remote postgres migration issues
test(analytics): validate remote ingestion and concurrency
chore(test): exclude non-project linkedin dependencies from vitest
docs(analytics): document remote enablement validation
```

Ne crée pas un commit vide pour chaque phase.

Avant chaque commit :

```powershell
git diff --cached
git status --short
```

Après chaque commit :

```powershell
git show -s --format=fuller HEAD
```

Vérifier :

```text
Author: Axel Corral
Commit: Axel Corral
```

---

# 31. AUCUN PUSH

À la fin :

```powershell
git status
git log --oneline --decorate -n 20
```

Ne jamais exécuter :

```powershell
git push
```

---

# 32. POINTS D’ARRÊT AUTORISÉS

Travaille de manière autonome.

Ne t’arrête que si une action externe empêche réellement la suite :

### A.
Aucun projet Supabase identifiable.

### B.
Authentification requise.

### C.
Credentials nécessaires absents.

### D.
Migration potentiellement destructive sur une base contenant des données à préserver.

### E.
Quota / billing / création de ressource payante nécessitant décision d’Axel.

### F.
Secret réel découvert et nécessitant rotation.

Dans ce cas :

1. donne le diagnostic précis ;
2. donne UNE action claire à Axel ;
3. reprends la mission après réponse.

Ne pose pas de question si tu peux résoudre le problème en inspectant le dépôt.

---

# 33. SORTIE TERMINALE FINALE

À la fin, afficher :

```text
VERS L’ÉLYSÉE — PRODUCT ANALYTICS PHASE 3

REMOTE POSTGRES
Connexion réelle :
Migrations 0001–0006 :
Remote verify :
Consentement réel :
Session E2E réelle :
Decision index :
Idempotence :
Hors ordre :
Concurrence :
Ingestion observability :
Data Quality :
Dashboard réel :
Load test :
Cleanup :

SECURITY
Secrets :
PII :
Service role :
Consentement :

QA
Déterminisme :
Unitaires :
Analytics :
E2E :
Lint :
Typecheck :
Build :

GIT
Auteur nouveaux commits : Axel Corral
Committer : Axel Corral
Push : NON

LIMITES RESTANTES :
-

VERDICT :
READY FOR PRODUCTION DATA
```

Si les critères ne sont pas tous satisfaits, remplacer le verdict par le niveau exact approprié.

Commence maintenant par lire `PHASE2_IMPLEMENTATION_REPORT.md` et `docs/analytics/REMOTE_ENABLEMENT_CHECKLIST.md`, puis audite le HEAD et les prérequis distants avant toute écriture.
