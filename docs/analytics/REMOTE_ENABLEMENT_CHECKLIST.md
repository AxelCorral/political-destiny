# Checklist de mise en service réelle — Analytics

**Mise à jour Phase 3 (2026-08-13)** : cette checklist a été exécutée pour de vrai — projet
Supabase réel connecté, migrations `0001`–`0007` appliquées, chaîne de collecte validée de bout
en bout sur PostgreSQL réel (voir `docs/analytics/REMOTE_SCHEMA_VERIFICATION.md` et
`PHASE3_REMOTE_ENABLEMENT_REPORT.md`). Le texte ci-dessous reste la procédure de référence,
utile telle quelle pour relier un futur second environnement (preview, staging) — mais l'état
« aucun projet lié » qu'il décrivait au moment de sa rédaction n'est plus l'état réel du projet.

**Détection effectuée avant la Phase 3** : aucun `.env.local`, aucune variable
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` dans l'environnement, aucune CLI Supabase installée,
aucun projet lié (`supabase/config.toml` absent — le dossier `supabase/` de ce dépôt ne contient
que les migrations, pas un projet lié). **Aucun projet cloud n'a été créé automatiquement** —
conformément à la règle de la mission, ceci reste une checklist à exécuter par vous.

Tout le code (client, ingestion, dashboard, migrations) est prêt et testé localement (voir
`docs/analytics/PHASE2_IMPLEMENTATION_REPORT.md`). Ce qui suit sont les étapes exactes, dans
l'ordre, pour passer de « code prêt » à « données réelles ».

## 1. Créer ou choisir le projet Supabase

- Nouveau projet : [supabase.com/dashboard](https://supabase.com/dashboard) → New Project.
- Ou réutiliser un projet Supabase existant si vous en avez déjà un pour ce produit.
- Choisissez une région proche de vos joueurs pour la latence d'ingestion.

## 2. Récupérer l'URL du projet

- Dashboard Supabase → Project Settings → API → « Project URL ».
- C'est la valeur de `SUPABASE_URL`.

## 3. Récupérer la clé de service (service-role key)

- Dashboard Supabase → Project Settings → API → « service_role » (secret, jamais la clé
  `anon`).
- C'est la valeur de `SUPABASE_SERVICE_ROLE_KEY`. **Ne jamais** la préfixer `NEXT_PUBLIC_`, ne
  jamais la committer, ne jamais l'exposer côté client.

## 4. Renseigner `.env.local`

Copier `.env.example` vers `.env.local` (déjà dans `.gitignore` par convention Next.js standard)
et renseigner au minimum :

```
SUPABASE_URL=<URL du projet>
SUPABASE_SERVICE_ROLE_KEY=<clé service_role>
```

## 5. Choisir un mot de passe admin

- `ANALYTICS_ADMIN_PASSWORD` : une valeur longue et aléatoire, jamais celle de `.env.example`.
- Ne jamais réutiliser un mot de passe existant ailleurs.

## 6. Générer un session secret robuste

- `ANALYTICS_ADMIN_SESSION_SECRET` : une chaîne aléatoire d'au moins 32 caractères. Exemple de
  génération locale (ne pas utiliser une valeur devinable) :
  ```
  node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
  ```

## 7. Lier la CLI Supabase (optionnel mais recommandé)

```
npm install -g supabase
supabase login
supabase link --project-ref <ref-du-projet>
```

Le « project ref » est visible dans l'URL du dashboard Supabase ou dans Project Settings.

## 8. Appliquer les migrations

Avec la CLI liée :

```
supabase db push
```

Sans la CLI, exécuter dans l'ordre via le SQL Editor du dashboard Supabase :

```
supabase/migrations/0001_analytics_core.sql
supabase/migrations/0002_analytics_views.sql
supabase/migrations/0003_data_quality.sql
supabase/migrations/0004_dashboard_functions.sql
supabase/migrations/0005_analytics_telemetry_enrichment.sql
supabase/migrations/0006_analytics_ingestion_observability.sql
```

Toutes sont non destructives (`create table if not exists`, `add column if not exists`,
`create or replace`) — sûres à exécuter sur une base vide ou déjà partiellement migrée.

## 9. Smoke test

```
npm run analytics:verify:remote
```

Vérifie la connexion, l'existence des tables/vues/fonctions attendues, et exécute un cycle
d'ingestion complet marqué `analytics-smoke-*` (créé puis nettoyé automatiquement — ne touche
jamais aux données réelles). Voir `scripts/analytics-verify-remote.ts` pour le détail exact des
vérifications.

Alternative manuelle : `npm run analytics:seed` (données DEV visibles, à nettoyer ensuite avec
`npm run analytics:seed -- --clean`), puis ouvrir `/admin/analytics/overview` et confirmer que
des données apparaissent.

## 10. Variables à poser sur la plateforme de production

Sur Vercel/autre plateforme, en variables d'environnement de production (jamais dans un fichier
committé) :

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ANALYTICS_ADMIN_PASSWORD
ANALYTICS_ADMIN_SESSION_SECRET
NEXT_PUBLIC_ANALYTICS_MODE=opt-in
NEXT_PUBLIC_BUILD_SHA           (idéalement injecté automatiquement par la plateforme/CI)
```

`ANALYTICS_STALE_RUN_HOURS_DEFAULT` n'a pas besoin d'être posée en production — c'est une valeur
informationnelle ; le seuil réel vit dans `analytics_settings.stale_run_hours` (voir
`docs/analytics/DATA_DICTIONARY.md`).

## Après mise en service

Une fois ces 10 étapes faites et `npm run analytics:verify:remote` vert, le dashboard
`/admin/analytics` lit réellement Postgres. Le verdict de ce rapport (`READY FOR REMOTE
ENABLEMENT`) peut alors passer à `READY FOR PRODUCTION DATA` — uniquement après une vérification
réelle, jamais par anticipation.
