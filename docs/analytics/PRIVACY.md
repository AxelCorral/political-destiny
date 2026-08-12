# Confidentialité — Analytics

**Ce document ne revendique aucune conformité légale** (RGPD ou autre) — c'est une description
technique de ce que le code fait réellement, à vérifier par un juriste avant tout déploiement en
production si une conformité formelle est requise.

## Principe

Le jeu fonctionne intégralement sans la couche analytics. Elle est :

- **désactivée par défaut** en développement (`NEXT_PUBLIC_ANALYTICS_MODE` non défini →
  `getAnalyticsMode()` renvoie `"off"` hors production, voir `src/analytics/config.ts`) ;
- **opt-in par défaut** en production (`NODE_ENV === "production"` → mode `"opt-in"`), ce qui
  signifie : le client est actif, mais **rien n'est envoyé tant que le joueur n'a pas cliqué
  explicitement** sur « Activer les statistiques anonymes » dans Paramètres
  (`src/features/meta/settings-page.tsx`).

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

- **Avant tout choix (`unset`)** : `track()` retourne immédiatement sans rien mettre en file
  (`src/analytics/client.ts`) — c'est vérifié par test (`src/analytics/__tests__/client.test.ts`).
- **Refus (`denied`)** : la file locale déjà accumulée est vidée immédiatement
  (`setAnalyticsConsent` appelle `clearQueue()`), et plus rien n'est mis en file tant que le
  consentement n'est pas de nouveau accordé.
- **Octroi (`granted`)** : les événements sont mis en file et envoyés par lots.
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
(« Activer » / « Garder désactivées »), sans bouton pré-sélectionné en faveur de l'activation, sans
minuterie, sans relance automatique, sans distinction visuelle qui pousserait vers un choix plutôt
que l'autre (pas de dark pattern). L'état actuel est toujours affiché en toutes lettres.

## Sécurité côté serveur

- Aucun accès direct du navigateur à la base : tous les écrits passent par
  `POST /api/analytics/events`, validés par schéma Zod strict avant toute écriture.
  `SUPABASE_SERVICE_ROLE_KEY` n'est utilisé que côté serveur (`src/analytics/server/
supabaseAdmin.ts`), jamais exposé au client — aucune variable `NEXT_PUBLIC_*` ne le contient.
- RLS activé sur les trois tables analytics, sans policy accordée à `anon`/`authenticated` :
  seule la clé de service (qui contourne RLS par conception) peut lire/écrire
  (`supabase/migrations/0001_analytics_core.sql`).
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
