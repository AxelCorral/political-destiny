# Vers l’Élysée

Jeu web mobile-first de campagne présidentielle française fictive. Une partie dure environ 10 à
15 minutes et combine décisions narratives, probabilités influencées par les statistiques,
adversaires autonomes, deux tours électoraux et bilan de carrière.

> Les événements, dialogues, classements et résultats sont fictifs. Le jeu n’est affilié à aucun
> parti ni à aucune personnalité et ne constitue ni une prédiction ni une information officielle.

## Démarrage

Prérequis : Node.js 24 (Node 20.9 minimum) et npm.

```bash
npm install
npm run dev
```

Ouvrir ensuite <http://localhost:3000>. Aucun compte, secret, backend ou service payant n’est
nécessaire.

## Commandes

```bash
npm run lint             # ESLint
npm run typecheck        # TypeScript strict
npm run data:validate    # schémas et règles éditoriales
npm run test             # Vitest + propriétés
npm run test:e2e         # parcours Playwright
npm run test:simulation  # équilibrage local
npm run build            # build de production
npm run check            # chaîne qualité complète
```

## Architecture

- `src/game/engine` : moteur pur, sans React ni DOM ;
- `src/game/data` : partis, acteurs fictifs, événements, électorat, badges et fins ;
- `src/game/schemas` et `src/game/types` : contrat sérialisable et validation Zod ;
- `src/features` : parcours et composants métier ;
- `src/lib/persistence` : IndexedDB, migrations, export/import ;
- `src/app` : routes Next.js App Router ;
- `scripts` : validation et simulations massives ;
- `docs` : conception, maintenance éditoriale, tests et données réelles.

## Ajouter un événement

Ajouter une définition dans `src/game/data/events`, avec un identifiant unique, les phases,
conditions, choix et issues pondérées. Lancer ensuite `npm run data:validate` et les tests. Les
personnages touchés par une accusation fictive doivent avoir `identityKind: "fictional"`.

## Ajuster un parti

Modifier sa définition dans `src/game/data/parties.ts`. Les valeurs sont des paramètres éditoriaux
de gameplay, datés et révisables, pas des mesures objectives. Vérifier l’impact avec
`npm run test:simulation`.

## Déploiement

Le projet se déploie sans backend sur Vercel avec `npm run build`. Le service worker met en cache
l’interface après la première visite et les sauvegardes restent dans IndexedDB sur l’appareil.

Les exigences détaillées et l’état d’avancement figurent dans `TODO.md`.
