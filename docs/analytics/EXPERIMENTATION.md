# Expérimentation A/B — groundwork uniquement

**Aucune expérience n'est active.** Ce document décrit uniquement le terrain préparé pour une
future implémentation, pas une fonctionnalité livrée.

## Ce qui existe déjà

- `experiment_id` et `variant_id` : colonnes nullable sur `analytics_events` et `analytics_runs`
  (`supabase/migrations/0001_analytics_core.sql`), toujours `null` aujourd'hui.
- `AnalyticsEventEnvelope.experimentId` / `.variantId` : champs optionnels dans le schéma Zod
  (`src/analytics/events.ts`) et dans `QueuedAnalyticsEvent` (`src/analytics/storage.ts`) —
  déjà transportés bout en bout par `track()` → file → ingestion, mais jamais renseignés par
  aucun appelant actuel.
- L'ingestion (`src/analytics/server/ingest.ts`) sait déjà propager ces deux champs sans erreur
  s'ils sont présents.

## Ce qui n'existe pas

- Aucun mécanisme d'assignation de variante (aucun tirage aléatoire, aucun stockage
  d'assignation persistante par `anonymous_user_id`).
- Aucune UI de gestion d'expériences dans `/admin/analytics`.
- Aucune vue SQL de comparaison de variantes.
- Aucun flag de configuration d'expérience.

## Pourquoi seulement le groundwork

La mission qui a ajouté cette couche analytics (voir `docs/analytics/ANALYTICS_IMPLEMENTATION_
REPORT.md`) demandait explicitement de préparer le terrain sans activer de vraie expérimentation,
pour éviter d'introduire un mécanisme non testé en conditions réelles et non demandé par un besoin
produit concret au moment de l'implémentation.

## Pour activer une première expérience plus tard

1. Définir un mécanisme d'assignation déterministe côté client (ex. hash de
   `anonymous_user_id` + `experiment_id`), **hors du moteur de jeu** — jamais en consommant le RNG
   de `GameState.rng`, pour ne pas rompre la garantie de déterminisme (`docs/analytics/
ARCHITECTURE_PLAN.md` §4).
2. Renseigner `experimentId`/`variantId` au moment du `track()` pertinent.
3. Ajouter une vue SQL de comparaison (sur le modèle de `party_performance`, filtrée par
   `variant_id`) plutôt que d'agréger côté client.
4. Documenter l'expérience (question posée, métrique de décision, durée prévue) avant de
   l'activer, et la retirer explicitement de ce document une fois terminée.
