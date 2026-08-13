# Confidentialité — Analytics

**Ce document ne revendique aucune conformité légale** (RGPD ou autre) — c'est une description
technique de ce que le code fait réellement, à vérifier par un juriste avant tout déploiement en
production si une conformité formelle est requise.

## Principe

Le jeu fonctionne intégralement sans la couche analytics. Elle est :

- **désactivée** en développement (`NEXT_PUBLIC_ANALYTICS_MODE` non défini →
  `getAnalyticsMode()` renvoie `"off"` hors production, voir `src/analytics/config.ts`) ;
- **active par défaut, désactivable à tout moment** en production (`NODE_ENV === "production"` →
  mode `"opt-in"`, dans le sens où la couche client est active). Depuis le choix produit du
  2026-08-13, `DEFAULT_SETTINGS.analyticsConsent` vaut `"granted"`
  (`src/lib/storage/game-database.ts`) : un nouveau joueur envoie des statistiques anonymes sans
  action de sa part, mais peut les désactiver à tout moment dans Paramètres
  (`src/features/meta/settings-page.tsx`), qui vide alors immédiatement la file d'envoi locale.
  Modèle « opt-out » de mesure d'audience premier-parti (pas de traçage cross-site, pas de PII,
  désactivation en un clic, information claire sur `/confidentialite`) — pas une certification
  de conformité RGPD/ePrivacy, à faire valider par un juriste si une conformité formelle est
  requise (voir avertissement en tête de ce document).

## Ce qui est collecté (si et seulement si le consentement est accordé)

Voir `docs/analytics/DATA_DICTIONARY.md` pour le détail colonne par colonne. En résumé :
un identifiant anonyme généré localement, les décisions prises dans le jeu (identifiants
techniques, pas de texte), la progression de campagne, et des informations de version du jeu.

## Ce qui n'est jamais collecté

Nom, e-mail, adresse postale, numéro de téléphone, adresse IP conservée en base, user-agent
complet, empreinte de navigateur (fingerprinting), identifiant publicitaire, données de paiement,
texte narratif du jeu, contenu des déclarations de campagne du joueur, `GameState` brut.
`anonymous_user_id` est un UUID généré côté client (`crypto.randomUUID()`) — il n'est dérivé
d'aucune caractéristique de l'appareil ou du navigateur.

## Cycle de vie du consentement

Géré par `src/analytics/consent.ts`, persisté dans `LocalSettings.analyticsConsent`
(`"unset" | "granted" | "denied"`, IndexedDB via `src/lib/storage/game-database.ts`) :

- **Valeur par défaut d'un nouveau profil (`granted`)** : `DEFAULT_SETTINGS.analyticsConsent`
  dans `game-database.ts` — les événements sont mis en file et envoyés par lots sans action du
  joueur, réversible à tout moment dans Paramètres. `"unset"` reste une valeur valide du type
  (état théorique, plus atteint par le flux normal depuis ce choix) : dans ce cas `track()`
  retourne immédiatement sans rien mettre en file (`src/analytics/client.ts`), comme pour un
  refus.
- **Refus (`denied`)** : la file locale déjà accumulée est vidée immédiatement
  (`setAnalyticsConsent` appelle `clearQueue()`), et plus rien n'est mis en file tant que le
  consentement n'est pas de nouveau accordé.
- **Retrait après octroi** : identique à un refus — la file est vidée, les envois s'arrêtent
  immédiatement.
- **Import d'un export JSON** (`Paramètres → Importer un JSON`) : le consentement **n'est jamais
  importé** — il repasse à `"unset"` sur l'appareil qui importe, par choix délibéré (le
  consentement est une décision par appareil, pas une donnée à faire voyager avec une sauvegarde).

## Accès au jeu

Jouer, sauvegarder, exporter/importer ses données et consulter ses archives **ne dépend jamais**
du choix fait sur les statistiques anonymes. Aucun contenu, écran ou fonctionnalité de jeu n'est
conditionné à ce consentement.

## Interface de consentement

Le contrôle vit dans `Paramètres` (`/parametres`), sous la forme de deux boutons neutres
(« Activer les statistiques anonymes » / « Désactiver les statistiques anonymes »), sans
minuterie, sans relance automatique, sans texte incitatif qui pousserait vers un choix plutôt que
l'autre. Le bouton correspondant à l'état courant est visuellement mis en avant (style « primary »)
— c'est un simple reflet de l'état réel (`granted` par défaut depuis le 2026-08-13, voir
« Principe » ci-dessus), pas une incitation à cliquer dessus puisque cet état est déjà actif.
L'état actuel est en outre toujours affiché en toutes lettres.

## Sécurité côté serveur

- Aucun accès direct du navigateur à la base : tous les écrits passent par
  `POST /api/analytics/events`, validés par schéma Zod strict avant toute écriture.
  `SUPABASE_SERVICE_ROLE_KEY` n'est utilisé que côté serveur (`src/analytics/server/
supabaseAdmin.ts`), jamais exposé au client — aucune variable `NEXT_PUBLIC_*` ne le contient.
- RLS activé sur les 5 tables analytics (`analytics_events`, `analytics_runs`,
  `analytics_decisions`, `analytics_ingestion_batches`, `analytics_settings`), sans policy
  accordée à `anon`/`authenticated` ; les 11 vues de reporting s'exécutent en
  `security_invoker = true` (donc soumises au même RLS que l'appelant, pas à celui du
  propriétaire) ; aucune des 15 fonctions analytics n'accorde `EXECUTE` à
  `PUBLIC`/`anon`/`authenticated`. Seule la clé de service (qui contourne RLS par conception,
  `rolbypassrls = true`) peut lire/écrire. **Incident réel corrigé en Phase 3** : jusqu'à
  `supabase/migrations/0007_analytics_access_hardening.sql`, `analytics_settings` n'avait pas
  RLS activé, et les 11 vues (propriétaire `postgres`, qui contourne RLS) n'avaient pas
  `security_invoker=true` — deux défauts qui, combinés aux GRANTs par défaut accordés par le
  projet Supabase à `anon`/`authenticated` sur tout nouvel objet du schéma `public`, exposaient
  silencieusement toute la couche de reporting via la clé publishable. Détail complet et tests
  de vérification dans `docs/analytics/REMOTE_SCHEMA_VERIFICATION.md` §« Row Level Security et
  exposition anon/authenticated ». Non-régression : `npm run analytics:verify:security`.
- Le dashboard `/admin/analytics` est protégé par une session admin distincte du joueur
  (`docs/analytics/README.md` §Authentification admin), inaccessible sans mot de passe.

## Limites connues (à ne jamais présenter comme résolues)

- `anonymous_user_id` identifie un **navigateur**, pas une personne : une même personne sur deux
  appareils apparaît deux fois ; un appareil partagé peut représenter plusieurs personnes.
- Un run `stale_incomplete` n'est **pas** une preuve qu'une personne a abandonné le jeu —
  seulement qu'aucun événement n'est arrivé depuis le seuil configuré.
- L'opt-in ne couvre que les joueurs qui l'activent : les métriques du dashboard ne représentent
  jamais 100 % des parties jouées, et ce biais de sélection ne doit jamais être ignoré en
  interprétant les chiffres.
