# Plan de test de charge — Phase 3 remote enablement

Écrit avant exécution, conformément à la mission Phase 3 §22. Objectif : valider que la chaîne
d'ingestion (`POST /api/analytics/events` → `ingestEvents` → upserts Postgres atomiques) supporte
un volume réaliste de télémétrie sur le **vrai** projet Supabase, sans corruption ni perte, avant
de conclure sur `READY FOR PRODUCTION DATA`. Ce n'est pas un stress test destructif — la charge est
bornée et raisonnable pour un projet Supabase du tier gratuit/dev.

## Protocole

- **Runs synthétiques** : 30, préfixe `phase3-load-<uuid>` (nettoyable de manière ciblée).
- **Événements par run** : `run_started` + 1 décision (`viewed`/`selected`/`resolved`) + `first_round_result`
  + `run_completed` = 6 événements/run.
- **Total événements** : 30 × 6 = 180.
- **Taille de batch** : 6 événements par requête HTTP (un batch = un run complet), au chemin réel
  `POST /api/analytics/events` (même code que la production, pas d'appel direct `ingestEvents`).
- **Concurrence** : 6 requêtes HTTP simultanées maximum (`Promise.all` par groupes de 6 runs),
  pour rester dans un ordre de grandeur raisonnable sans agresser le projet Supabase.
- **Type d'événements** : catalogue complet d'une campagne courte (pas de `second_round_result` —
  non nécessaire pour mesurer le débit d'ingestion).
- **IDs de test** : `run_id` préfixés `phase3-load-`, `anonymous_user_id`/`session_id` UUID dédiés
  par run — aucun chevauchement avec des données réelles ou les runs des phases précédentes.

## Métriques observées

- événements envoyés (total) ;
- événements acceptés (`accepted` cumulé côté réponse HTTP) ;
- événements rejetés (`rejected` cumulé) ;
- durée totale (du premier envoi à la dernière réponse) ;
- débit approximatif (événements/seconde) ;
- erreurs HTTP (`status !== 200`) ;
- doublons détectés (en renvoyant un sous-ensemble des mêmes batches une seconde fois) ;
- lignes finales dans `analytics_runs`/`analytics_decisions`/`analytics_events` (doivent
  correspondre exactement au nombre de runs/décisions/événements envoyés, sans plus) ;
- incohérences (`analytics_data_quality` doit rester à 0 sur les contrôles pertinents pour les
  runs de charge, hors `events_with_dev_build_sha` qui est attendu).

## Nettoyage

Suppression ciblée par préfixe `run_id like 'phase3-load-%'` sur `analytics_decisions`,
`analytics_events`, `analytics_runs`, avec vérification post-suppression que `count(*) = 0` pour
ce préfixe sur les trois tables.

## Critère PASS / FAIL

**PASS** si : 0 erreur HTTP inattendue, débit mesuré compatible avec une utilisation de jeu réelle
(pas de dégradation catastrophique), nombre de lignes finales exactement égal au nombre attendu
(aucune perte, aucune duplication), `analytics_data_quality` sans anomalie réelle sur ces runs, et
nettoyage complet vérifié.

**FAIL** si : une requête échoue de façon inattendue, des lignes manquent ou sont dupliquées, ou
le nettoyage laisse des données orphelines.

## Résultats (exécution réelle, 2026-08-13)

- 180 événements envoyés (30 runs × 6), 6 requêtes HTTP simultanées par groupe, chemin réel
  `POST /api/analytics/events` → `ingestEvents` → Postgres réel.
- Durée totale : 3792 ms — débit ≈ 47,5 événements/seconde.
- `accepted` cumulé = 180, `rejected` = 0, erreurs HTTP = 0.
- Renvoi des 5 premiers batches (test de doublon) : 0 nouvelle ligne créée.
- Lignes finales : `analytics_runs` = 30/30, `analytics_decisions` = 30/30, `analytics_events` =
  180/180 — exactement les valeurs attendues, aucune perte, aucune duplication.
- Nettoyage : les 3 tables vérifiées à 0 ligne restante sous le préfixe `phase3-load-` après
  suppression.

**VERDICT : PASS**
