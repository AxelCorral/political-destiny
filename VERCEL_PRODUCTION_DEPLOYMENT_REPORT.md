# Déploiement production Vercel — Rapport final

## A. Commit déployé

```text
branch      : main
SHA         : 30cdedef42bd78b73804cc3196506a1cd68d70f0
origin/main : 30cdedef42bd78b73804cc3196506a1cd68d70f0 (identique, confirmé après push)
```

## B. Vercel

```text
project    : political-destiny (axel-corral-s-projects), déjà lié — aucun nouveau projet créé
preview    : https://political-destiny-1fspcw263-axel-corral-s-projects.vercel.app
production : https://political-destiny.vercel.app (déploiement dpl_F9LZ9arSAt3nxikBWqCERjVLsC9S,
             déclenché automatiquement par le push via l'intégration Git déjà active)
```

## C. Variables (présence/scope uniquement, jamais les valeurs)

| Variable | Scope | Secret |
|---|---|---|
| `SUPABASE_URL` | Production, Preview | oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | oui |
| `ANALYTICS_ADMIN_PASSWORD` | Production, Preview | oui |
| `ANALYTICS_ADMIN_SESSION_SECRET` | Production, Preview | oui |
| `NEXT_PUBLIC_ANALYTICS_MODE` | Production, Preview | non (valeur `opt-in` — publique par nature, préfixe `NEXT_PUBLIC_`) |

`NEXT_PUBLIC_APP_ENV` et `ANALYTICS_STALE_RUN_HOURS_DEFAULT` n'ont pas été configurées (non lues
par le code applicatif). Preview et Production partagent le même projet Supabase (aucun
environnement séparé n'existe) — traité avec la même discipline de nettoyage qu'en Phase 3.

## D. QA locale

```text
lint        : PASS (0 erreur, 3 warnings pré-existants sans rapport — scripts/audit/*)
typecheck   : PASS (0 erreur, revérifié sur le commit exact déployé)
build local : PASS (2 exécutions : la 1ère a révélé un vrai défaut — voir §K — la 2e, après
              correctif, réussie)
tests/E2E   : 351/351 unitaires, 32/32 E2E (chromium) — validés en Phase 3 sur le commit
              e55d05a ; le seul commit ajouté depuis (30cdede) est un ajout d'une ligne
              (`export const dynamic`) sur une seule page serveur, sans impact sur la logique
              testée — non re-exécutés intégralement mais lint+typecheck+build reconfirmés sur
              le SHA final
```

## E. Preview smoke test

**PASS intégral**, via navigateur réel (Playwright) à travers le contournement officiel
« Protection Bypass for Automation » de Vercel (jamais affiché) :

- 7 pages publiques → 200 (`/`, `/jouer`, `/parametres`, `/confidentialite`, `/methodologie`,
  `/badges`, `/a-propos`)
- Partie réelle démarrée jusqu'au premier écran de décision
- Accès anonyme à `/admin/analytics/overview` → redirigé vers `/admin/login`
- Mot de passe invalide → refusé, reste sur `/admin/login`
- Mot de passe valide → accès accordé, cookie de session `httpOnly=true, secure=true`
- Les 6 onglets admin (`overview`, `equilibrage`, `gameplay`, `retention`, `versions`,
  `qualite`) → 200
- 0 réponse 5xx, 0 erreur runtime navigateur, 0 valeur secrète observée dans une requête
  navigateur (la clé de service n'apparaît jamais ; le mot de passe admin n'apparaît que dans
  sa propre requête de connexion, comme attendu)
- Test analytics contrôlé : consentement accordé réellement via l'UI, une décision jouée, un
  événement `run_started` confirmé écrit dans le vrai Supabase (poll direct), puis nettoyé —
  preuve que le pipeline fonctionne sur ce runtime Vercel précis, pas seulement en local

Logs de build et d'exécution Vercel inspectés : aucune erreur, aucun secret.

## F. Production smoke test

**PASS intégral**, mêmes vérifications que le Preview, exécutées sur `https://political-destiny.vercel.app` (aucune protection Vercel dessus, accès public direct) :

- 7 pages publiques → 200
- Accès admin anonyme refusé, mot de passe invalide refusé, mot de passe valide accepté (cookie
  `httpOnly`/`secure`)
- 6 onglets admin → 200
- **Déconnexion testée en plus** : après logout, `/admin/analytics/overview` redevient
  inaccessible sans nouvelle authentification
- Test analytics contrôlé identique au Preview : run réel confirmé en base puis nettoyé
- 0 5xx, 0 erreur runtime, 0 fuite de secret
- Logs de production inspectés (`vercel logs`) : aucune entrée `error`, aucun secret

## G. Admin security

```text
anonymous access   : refusé (redirection /admin/login)
invalid session    : refusé (message d'erreur, reste sur /admin/login)
authorized admin   : accès complet aux 6 onglets, données lues côté serveur
secret client exposure : aucune (clé de service jamais observée navigateur ; mot de passe admin
                          uniquement dans sa propre requête de connexion)
```

## H. Analytics

```text
Supabase connection : fonctionnelle en Preview et en Production (vérifié réellement, pas supposé)
ingestion            : confirmée (run_started écrit en base depuis les deux runtimes)
reporting            : les 6 onglets admin chargent sans erreur avec le client réel
Data Quality         : héritée de la Phase 3 (0 défaut réel) — aucune anomalie nouvelle introduite
cleanup               : vérifié — 0 ligne restante sur les 4 tables après chaque test contrôlé
```

## I. Git

```text
commits (cette mission) : 30cdede (fix qualite/page.tsx — seul commit de cette mission ; tout le
                           reste provient de la Phase 3, déjà commité avant)
push                     : origin/main mis à jour, bcb1efe..30cdede, sans force
SHA local = SHA remote   : oui, confirmé (30cdedef42bd78b73804cc3196506a1cd68d70f0)
```

## J. Rollback

```text
previous production deployment : https://political-destiny-4onn51lsg-axel-corral-s-projects.vercel.app
                                  (déploiement production précédent, 2 jours, statut Ready —
                                  disponible pour rollback immédiat via le mécanisme officiel
                                  Vercel si un défaut apparaissait après coup)
rollback nécessaire             : NON — aucun P0/P1 détecté sur le smoke test production
```

## K. Limites restantes

```text
P0 : aucune.
P1 : aucune.
P2 : un vrai défaut a été trouvé ET corrigé pendant cette mission (pas une limite restante,
     documenté pour traçabilité) — /admin/analytics/qualite était statiquement pré-rendue au
     build (absence de searchParams contrairement aux 5 autres onglets), provoquant un vrai
     échec de build Vercel (PGRST303 « JWT issued at future ») invisible en local. Corrigé par
     `export const dynamic = "force-dynamic"`, revérifié sur un 2e Preview réussi.
P3 : suite de tests unitaires/E2E non totalement re-exécutée après l'unique commit ajouté
     depuis la Phase 3 (changement d'une ligne, sans impact logique) — lint/typecheck/build
     reconfirmés sur le SHA final à la place.
```

## L. Verdict

```text
PRODUCTION DEPLOYED — READY
```
