# Claude Code — Product Analytics Phase 2

## Mission

Tu travailles à la racine du dépôt **Vers l'Élysée**.

Une première mission a déjà livré une couche Product Analytics complète sur le plan local : client non bloquant, consentement opt-in, queue IndexedDB, endpoint batch, schémas Zod, migrations PostgreSQL/Supabase, tables `analytics_events` / `analytics_runs` / `analytics_decisions`, vues/fonctions SQL, dashboard privé `/admin/analytics`, auth admin, six onglets, Data Quality, seed DEV, tests et documentation.

Le rapport précédent conclut honnêtement **READY FOR CONFIGURATION**, pas **READY FOR PRODUCTION DATA** : aucune base Supabase réelle n'a encore été configurée ni vérifiée.

Ta mission est maintenant de :

1. réauditer l'implémentation réellement présente au HEAD ;
2. combler les trous de télémétrie qui empêchent encore un vrai pilotage produit ;
3. corriger le versioning avant collecte réelle ;
4. renforcer l'observabilité et la qualité de l'ingestion ;
5. mettre à jour le dashboard pour exploiter les nouvelles données ;
6. préparer puis, si une connexion Supabase réelle est déjà disponible, valider la chaîne sur PostgreSQL réel.

Ne refais pas l'architecture depuis zéro.

---

## Règles bloquantes

- Aucun changement de gameplay : règles, probabilités, événements, seeds, mécanique de choix et conditions électorales restent inchangés.
- La télémétrie reste extérieure au moteur.
- Même seed + mêmes choix, analytics ON/OFF => même état gameplay final.
- Toute panne analytics reste fail-open et invisible pour le joueur.
- Consentement opt-in maintenu.
- Aucune PII supplémentaire : pas de nom, e-mail, IP persistée, user-agent complet, fingerprint, texte libre, GameState brut.
- Aucun faux statut de déploiement.
- Aucun push.
- Commits locaux atomiques autorisés, auteur **Axel Corral**, aucune mention Claude/Anthropic.

---

## 1. Réaudit du HEAD

Commence par :

    git status
    git branch --show-current
    git log --oneline --decorate -n 40

Lis et confronte au code réel :

- `docs/analytics/ANALYTICS_IMPLEMENTATION_REPORT.md`
- `docs/analytics/ARCHITECTURE_PLAN.md`
- `docs/analytics/README.md`
- `docs/analytics/EVENT_CATALOG.md`
- `docs/analytics/DATA_DICTIONARY.md`
- `docs/analytics/DATA_QUALITY.md`
- `docs/analytics/PRIVACY.md`
- `docs/analytics/EXPERIMENTATION.md`
- `src/analytics/**`
- `src/app/api/analytics/**`
- `src/app/api/admin/analytics/**`
- `src/app/admin/**`
- `src/components/analytics-provider.tsx`
- `src/features/campaign/game-app.tsx`
- `src/features/meta/settings-page.tsx`
- `src/lib/storage/game-database.ts`
- `supabase/migrations/**`
- `scripts/analytics-seed.ts`
- E2E analytics.

Créer `docs/analytics/PHASE2_AUDIT.md` contenant notamment une matrice :

| Question produit | Donnée nécessaire | Disponible aujourd'hui ? | Gap | Action |

Continue automatiquement après cet audit.

---

## 2. Questions produit à rendre réellement mesurables

Pour les parties **ayant consenti** aux statistiques, le système doit permettre de répondre proprement à :

### Usage
- runs commencés / terminés ;
- navigateurs anonymes récurrents ;
- runs par navigateur ;
- durée de campagne ;
- runs devenus inactifs.

### Équilibrage
- parti choisi ;
- score simulé du premier tour ;
- rang T1 ;
- qualification ;
- score simulé du second tour ;
- adversaire T2 ;
- victoire ;
- victoire conditionnelle à qualification ;
- évolution par version.

### Gameplay
- combien de fois chaque événement a réellement été affiché ;
- taux de sélection de chaque choix parmi ses expositions ;
- temps de décision ;
- choix dominants ;
- événements rares/jamais vus ;
- exposition aux chaînes/rares/décisifs ;
- effets avant/après lorsque la valeur existe directement dans l'état.

### Produit
- ouverture du dashboard joueur ;
- erreurs techniques catégorisées ;
- contenu jamais exposé ;
- comparaison entre versions.

Ne marque aucune question comme couverte si tu ne disposes que d'un proxy ambigu.

---

## 3. Séparer exposition, sélection et résolution

L'événement actuel `decision_resolved` ne suffit pas pour mesurer exposition et latence.

### Ajouter `decision_viewed`

Émis lorsqu'une nouvelle décision devient réellement visible.

Dédupliquer par `run_id + decision_index + event_id`.

Un rerender React ne doit jamais générer une nouvelle exposition.

Payload, seulement si issu directement des données réelles :

- `decisionIndex`
- `phase`
- `eventId`
- `eventCategory`
- `numberOfAvailableChoices`
- flags disponibles : rare / chain / decisive / risky.

Ne stocke pas le texte narratif si `event_id` suffit.

### Ajouter `choice_selected`

Émis au clic utilisateur, avant résolution si la frontière UI le permet.

Payload :

- `decisionIndex`
- `eventId`
- `choiceId`
- `choiceTag`
- `choiceStrategy`

Déduplication robuste contre double clic/remount.

### Conserver `decision_resolved`

Son sens ne change pas : outcome réellement résolu.

---

## 4. Latence de décision

Mesurer le temps entre `decision_viewed` et `choice_selected`.

Préférer :

- `viewed_at`
- `selected_at`
- `resolved_at`
- latence dérivée côté SQL/ingestion.

La latence peut être nullable et doit être bornée dans les métriques de reporting pour éviter qu'un onglet oublié plusieurs heures déforme les médianes.

Documenter la définition exacte.

---

## 5. Enrichir `analytics_decisions`

Créer uniquement une **nouvelle migration**, jamais réécrire les migrations historiques.

Faire de la table dérivée une ligne progressivement enrichie par les événements viewed/selected/resolved.

Ajouter si réellement extractible sans recomputer le moteur :

- `viewed_at`
- `selected_at`
- `resolved_at`
- `decision_latency_ms` ou vue dérivée
- `number_of_available_choices`
- flags event utiles
- `player_poll_before`
- `player_poll_after`
- `popularity_before`
- `popularity_after`
- `momentum_before`
- `momentum_after`

Ne duplique aucune formule du moteur. Si une valeur n'est pas directement disponible aux frontières UI/état, ne l'ajoute pas et documente la limite.

Tester l'enrichissement même en cas de réordonnancement réseau :

`resolved -> viewed -> selected`

Le résultat final doit rester cohérent et idempotent.

---

## 6. Scores électoraux et second tour

Inspecte précisément `firstRoundResult`, `secondRoundResult`, `PollSnapshot`, `ElectionRoundResult`.

Si directement disponibles, ajouter aux événements puis à `analytics_runs` :

- `first_round_player_score`
- `second_round_player_score`
- `runoff_opponent_party_id`
- `first_round_turnout`
- `second_round_turnout`

Ne recalculer aucun score si une source moteur existe déjà.

Mettre à jour le dictionnaire, les vues SQL, l'onglet Équilibrage et les exports.

---

## 7. Race snapshots

Enrichir `race_snapshot` pour tracer au minimum la trajectoire du joueur.

Si `PollSnapshot` le permet directement :

- score/sondage joueur ;
- rang ;
- tendance ;
- decisionIndex ;
- phase ;
- nombre de partis actifs/résultats.

Ne stocke pas inutilement tous les scores nominatifs des autres partis.

Objectif MVP : une trajectoire du joueur au fil de la campagne.

Si l'instrument change entre sondage et scrutin, le dashboard doit le signaler.

---

## 8. Ouverture du dashboard joueur

Si le jeu possède réellement un dashboard joueur ouvrable, ajouter :

`player_dashboard_opened`

Une ouverture utilisateur explicite = un événement, pas un rerender.

Payload minimal :

- phase
- decisionIndex

Permettre :
- ouvertures/run ;
- % de runs avec au moins une ouverture.

---

## 9. Erreurs techniques

Ajouter `game_error` uniquement pour des erreurs techniques maîtrisées et catégorisées.

Ne jamais envoyer stack/message arbitraire/objet Error brut.

Payload fermé :

- `errorCode`
- `source`
- `phase?`
- `decisionIndex?`
- `recoverable`

Créer une liste d'error codes limitée aux cas réellement observables.

---

## 10. Corriger le versioning avant données réelles

Le mapping actuel `engine_version = GAME_CONFIG.schemaVersion` est sémantiquement ambigu : cette valeur décrit le schéma de sauvegarde, pas forcément la logique moteur.

Profite de l'absence de données réelles pour corriger proprement.

Distinguer :

- `app_version`
- `save_schema_version`
- `content_version`
- `engine_version` ou `engine_logic_version`
- `analytics_schema_version`
- `build_sha`

Préférence :

- renommer sémantiquement `GAME_CONFIG.schemaVersion` en `save_schema_version` côté analytics ;
- créer une version logique moteur avec une source unique et une politique de bump explicite ;
- garder `build_sha` comme identifiant exact du build.

Créer `docs/analytics/VERSIONING_POLICY.md` avec règles de bump.

Les filtres dashboard doivent utiliser la version logique pertinente.

---

## 11. Migrations

Créer de nouvelles migrations uniquement, par exemple :

- `0005_analytics_telemetry_enrichment.sql`
- `0006_analytics_ingestion_observability.sql`

Adapter aux conventions réelles.

Elles doivent être non destructives et compatibles avec une base vide ou une base ayant déjà 0001–0004.

---

## 12. Observabilité d'ingestion

Les événements rejetés ne doivent plus exister seulement dans la réponse HTTP/logs.

Créer une observabilité légère, sans stocker les payloads rejetés.

Table ou agrégat équivalent :

`analytics_ingestion_batches`

Champs possibles :

- `received_at`
- `batch_uuid`
- `accepted_count`
- `rejected_count`
- `duplicate_count`
- code(s) de rejet agrégés
- `processing_duration_ms`
- version/schema/build si utile.

Dashboard Qualité :

- reçus ;
- acceptés ;
- rejetés ;
- rejection rate ;
- principaux motifs.

---

## 13. Data Quality

Conserver les contrôles existants et ajouter, lorsque techniquement justifié :

- resolved sans viewed ;
- selected sans viewed ;
- resolved sans selected si le parcours UI le garantit ;
- trous suspects de `client_sequence` ;
- run terminé mais décisions dérivées incohérentes ;
- qualifié sans score T1 ;
- T2 sans adversaire lorsque requis ;
- versions manquantes ;
- build `dev` dans environnement production ;
- identifiants event/choice inconnus lorsque validables.

Un check non nul reste un signal à inspecter, pas une preuve automatique de bug.

---

## 14. Concurrence d'ingestion

Le rapport actuel documente un `select` puis `upsert` non transactionnel sur `analytics_runs`.

Évalue si le risque peut être corrigé simplement côté PostgreSQL :

- RPC/fonction atomique ;
- ou UPSERT exprimant directement les règles de merge.

Éviter toute infrastructure disproportionnée.

Règles importantes :

- `started_at` = plus ancien ;
- `last_event_at` = plus récent ;
- données terminales ne doivent pas être écrasées par un événement ancien arrivé tard ;
- compteur décisions dérivé, pas incrémenté aveuglément.

Ajouter un test de réordonnancement/concurrence logique.

---

## 15. Source de vérité `stale_incomplete`

Aujourd'hui le seuil réel vit dans `analytics_settings`, tandis que l'env peut donner une fausse impression de contrôle runtime.

Choisir une source de vérité claire.

Préférence : `analytics_settings.stale_run_hours`.

Mettre à jour docs/config afin qu'il n'existe plus deux sources ambiguës.

---

## 16. Mettre à jour les marts et le dashboard

Ne refais pas le dashboard visuellement.

### Overview
- started / completed / stale ;
- completion rate ;
- navigateurs anonymes ;
- runs/browser ;
- durée médiane ;
- qualification ;
- victoire.

### Équilibrage par parti
- n ;
- share starts ;
- score T1 moyen + médian ;
- distribution rang ;
- qualification ;
- score T2 si applicable ;
- victoire ;
- victoire | qualifié ;
- score final.

### Runoff
Matrice joueur × adversaire :
- n ;
- win rate ;
- score moyen joueur.

### Gameplay
Par événement :
- exposures = `decision_viewed`
- resolved
- median latency

Par choix :
- selections
- selection share = selections / exposures

Signaler comme candidats à inspection :
- >80 %
- >90 %
- <5 %

### Content exposure
- jamais vus ;
- moins vus ;
- rare / chain / decisive.

### Dashboard usage
- opens/run ;
- % runs avec ouverture.

### Qualité
- anomalies ;
- accepted/rejected ingestion ;
- `game_error`.

Toujours afficher `n`.

---

## 17. Seed DEV

Mettre `npm run analytics:seed` à jour pour le nouveau schéma.

Inclure des données synthétiques couvrant :

- viewed / selected / resolved ;
- latences variées ;
- scores T1/T2 ;
- adversaires T2 ;
- dashboard openings ;
- erreurs ;
- plusieurs versions ;
- runs incomplets ;
- événements rares ;
- choix dominants et équilibrés.

Toujours clairement DEV et nettoyable.

---

## 18. Tests

Ajouter/mettre à jour :

### Unitaires
- dédup viewed ;
- dédup selected ;
- latence ;
- enrichissement progressif décisions ;
- extraction T1/T2/opponent ;
- dashboard open ;
- error schema ;
- distinction save schema / engine logic version ;
- ingestion observability.

### Ingestion
Tester :
- viewed -> selected -> resolved ;
- resolved -> viewed -> selected ;
- retries ;
- duplicate event UUID.

### Déterminisme
Rejouer analytics OFF / ON : strictement identique côté gameplay.

### E2E
Avec consentement :
- décision visible => viewed ;
- choix => selected ;
- résolution => resolved ;
- run_id stable après reload.

Dashboard DEV :
- exposures ;
- choice share ;
- latency ;
- score T1.

---

## 19. Couverture des questions produit

Créer `docs/analytics/PRODUCT_ANALYTICS_COVERAGE.md`.

Pour chaque question de la section 2 :

| Question | Source | Vue/KPI | Statut | Limite |

Statuts autorisés :

- `COVERED`
- `PARTIAL`
- `NOT COVERED`

Ne surévalue pas les proxies.

---

## 20. Détection d'une connexion Supabase réelle

Après code local vert, détecte sans jamais imprimer les secrets :

- `.env.local`
- variables env ;
- Supabase CLI ;
- projet lié ;
- capacité de requête.

### Si aucune connexion réelle n'est disponible

Ne crée pas automatiquement un projet cloud.

Créer `docs/analytics/REMOTE_ENABLEMENT_CHECKLIST.md` donnant précisément :

1. création/choix du projet ;
2. URL projet ;
3. service-role key ;
4. `.env.local` ;
5. mot de passe admin ;
6. session secret robuste ;
7. liaison CLI éventuelle ;
8. migrations ;
9. smoke test ;
10. variables à poser sur la plateforme de production.

Créer également une commande/script :

`npm run analytics:verify:remote`

Le verdict maximal est alors :

`READY FOR REMOTE ENABLEMENT`.

### Si une connexion réelle est déjà disponible

Inspecte d'abord le projet.

Ne supprime rien.

Applique uniquement les migrations analytics nouvelles/non destructives.

Vérifie RLS, fonctions et vues.

---

## 21. Smoke test PostgreSQL réel

Uniquement si une connexion réelle est disponible.

Créer un run marqué `analytics-smoke-*` via le vrai endpoint avec au minimum :

- run_started
- decision_viewed
- choice_selected
- decision_resolved
- first_round_result
- run_completed

Vérifier :

- raw events ;
- run dérivé ;
- decision dérivée ;
- vues ;
- idempotence par ré-envoi du même `event_uuid`.

Nettoyer uniquement les données de smoke test avec ciblage strict.

Ne jamais supprimer de données utilisateur.

---

## 22. Charge PostgreSQL réelle

Seulement sur staging/test approprié.

Quelques milliers d'événements en batches suffisent.

Mesurer :

- accepted/rejected ;
- latence p50/p95 ;
- doublons ;
- cohérence run/decisions ;
- temps des principales requêtes dashboard.

Ne fais pas un load test agressif sur une base production.

---

## 23. Dashboard sur base réelle

Si Supabase réel disponible, vérifier les six onglets :

- overview
- equilibrage
- gameplay
- retention
- qualite
- versions

Tester aussi :

- login/logout ;
- filtres ;
- états zéro données ;
- exports ;
- `n` ;
- plusieurs versions.

Un onglet n'est « opérationnel réel » que s'il interroge réellement PostgreSQL.

---

## 24. Consentement bout en bout

Si backend réel/staging :

- `unset` => aucun envoi ;
- `denied` => aucun envoi ;
- `granted` => événements en DB ;
- retrait => plus aucun futur envoi.

Aucune collecte rétroactive des événements avant consentement.

Ajouter dans Overview un avertissement compact :

« Statistiques basées uniquement sur les parties pour lesquelles les statistiques anonymes ont été activées. »

Ne fabrique pas de taux de consentement sans dénominateur réellement collecté.

---

## 25. A/B testing

Ne lance aucune expérience.

Conserver uniquement le groundwork actuel.

Mettre à jour `EXPERIMENTATION.md` si nécessaire pour compatibilité avec le nouveau schéma.

---

## 26. Documentation finale

Mettre à jour les docs existantes.

Créer au minimum :

- `VERSIONING_POLICY.md`
- `PRODUCT_ANALYTICS_COVERAGE.md`
- `REMOTE_ENABLEMENT_CHECKLIST.md` si nécessaire
- `PHASE2_IMPLEMENTATION_REPORT.md`

Le rapport final doit distinguer explicitement :

- ce qui a été codé ;
- ce qui a été testé localement ;
- ce qui a réellement été vérifié sur PostgreSQL distant ;
- ce qui reste bloqué par une action externe.

---

## 27. Validation globale

Exécute les commandes pertinentes du dépôt :

- format
- lint
- typecheck
- data validation
- tests
- E2E pertinents
- build

Audite le diff.

Vérifie :

- gameplay inchangé ;
- probabilités inchangées ;
- narration inchangée ;
- aucun secret ;
- aucune route publique de lecture analytics ;
- déterminisme intact.

---

## 28. Commits locaux

Commits atomiques possibles :

1. `feat(analytics): add decision exposure and selection telemetry`
2. `feat(analytics): enrich electoral and version analytics`
3. `feat(analytics): harden ingestion and data quality`
4. `feat(analytics): extend product analytics dashboard`
5. `test(analytics): add phase 2 regression and remote verification`

Auteur : Axel Corral.

Aucun push.

---

## 29. Critères de succès

La Phase 2 est terminée si :

- [ ] HEAD réaudité
- [ ] docs/code comparés
- [ ] `decision_viewed` disponible ou impossibilité justifiée
- [ ] `choice_selected` disponible ou impossibilité justifiée
- [ ] exposition mesurable
- [ ] choice share calculable avec bon dénominateur
- [ ] latence mesurable
- [ ] décisions enrichies idempotemment
- [ ] score T1 joueur stocké
- [ ] score T2 joueur stocké si disponible
- [ ] adversaire T2 stocké
- [ ] trajectoire joueur mesurable
- [ ] usage dashboard joueur mesurable si UI existante
- [ ] erreurs techniques structurées si pertinentes
- [ ] save schema séparé de engine logic version
- [ ] politique de versioning documentée
- [ ] rejected rate durablement observable
- [ ] Data Quality étendue
- [ ] concurrence ingest durcie ou décision justifiée
- [ ] source stale claire
- [ ] dashboard Gameplay exploite exposures/choices/latency
- [ ] dashboard Équilibrage exploite score T1
- [ ] matchup T2 réel
- [ ] seed DEV mis à jour
- [ ] couverture produit documentée
- [ ] déterminisme vert
- [ ] tests verts
- [ ] build vert
- [ ] aucun secret
- [ ] aucun changement gameplay
- [ ] aucun push

Si Supabase réel disponible :

- [ ] migrations réellement appliquées
- [ ] RLS vérifié
- [ ] smoke test réel PASS
- [ ] idempotence réelle PASS
- [ ] dashboard réel PASS
- [ ] consentement réel PASS

---

## 30. Verdict final

Utilise exactement un verdict :

### `READY FOR PRODUCTION DATA`
Seulement si Supabase réel est connecté, migrations appliquées, smoke test réel vert et dashboard lisant la vraie DB.

### `READY FOR REMOTE ENABLEMENT`
Si le code local est complet mais aucune connexion réelle n'était disponible.

### `BLOCKED`
Si une régression empêche la mise en service.

---

## 31. Sortie terminal finale

Afficher :

PRODUCT ANALYTICS — PHASE 2 TERMINÉE

HEAD :
Telemetry coverage :
Decision exposures :
Choice selections :
Decision latency :
First-round score :
Second-round score :
Runoff opponent :
Player dashboard usage :
Error telemetry :
Versioning :
Ingestion observability :
Data quality :
Concurrency hardening :
Dashboard :

Product questions COVERED :
Product questions PARTIAL :
Product questions NOT COVERED :

Supabase real connection :
Remote migrations :
Remote smoke test :
Remote load test :
Remote dashboard verification :

Determinism :
Tests :
E2E :
Lint :
Typecheck :
Build :

Gameplay modified : NON
Secrets committed : NON
Push : NON

Report :
docs/analytics/PHASE2_IMPLEMENTATION_REPORT.md

External action required :
[liste exacte ou AUCUNE]

VERDICT :
READY FOR PRODUCTION DATA
/
READY FOR REMOTE ENABLEMENT
/
BLOCKED

---

## Principe final

La priorité n'est pas d'ajouter des événements pour le plaisir.

La chaîne doit toujours être :

question produit
→ événement/état réellement observé
→ donnée définie
→ ingestion fiable
→ métrique SQL reproductible
→ dashboard interprétable.

Ne déclare jamais une question couverte si elle ne l'est pas réellement.
Ne sur-ingénierie pas.
Ne modifie jamais le gameplay pour simplifier l'analytics.
