# Vers l’Élysée

**Statut : bêta publique / projet portfolio.** Simulateur narratif et probabiliste de campagne
présidentielle, construit comme projet de simulation et d'expérimentation data — pas un produit
commercial fini, pas un prédicteur de l'élection de 2027.

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
- `src/lib/storage` : IndexedDB, migrations, export/import ;
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

## Méthodologie / Data

Le jeu s'appuie sur un moteur de simulation pur (sans React ni DOM), entièrement déterministe à
partir d'une graine (PRNG interne, jamais `Math.random`), ce qui permet de rejouer exactement
n'importe quelle campagne et de comparer deux variantes d'un même état. Chaque itération de
conception s'appuie sur :

- des **simulations massives** (des milliers à plus de 10 000 campagnes automatiques par audit,
  réparties sur les 9 partis et 8 profils d'agents de décision différents) ;
- des **contrefactuels appariés** : capturer un état, produire deux variantes minimales, rejouer
  les deux avec la même politique de décision, et attribuer tout écart final à la seule mutation
  initiale ;
- des **audits avant/après** documentés, chiffrés et reproductibles à chaque changement de moteur ;
- une **baseline politique ancrée dans une photographie réelle datée** (18 avril 2026), tout en
  gardant la campagne elle-même entièrement fictive et non prédictive.

Les rapports d'audit (diagnostics, corrections, playtests scriptés, verdicts chiffrés) sont
conservés dans le dépôt à la racine et dans `audit-results/`, `docs/` pour traçabilité — voir en
particulier `STRATEGIC_REALIGNMENTS_REPORT.md` pour l'état le plus récent.

## Développement

Le développement a été réalisé avec Claude Code comme outil agentique. La conception du système,
les hypothèses, les métriques, les protocoles d'audit, les playtests et l'interprétation des
résultats ont été pilotés par Axel Corral.

## Déploiement

Le projet se déploie sans backend sur Vercel avec `npm run build`. Le service worker met en cache
l’interface après la première visite et les sauvegardes restent dans IndexedDB sur l’appareil.

Les exigences détaillées et l’état d’avancement de la V1 initiale figurent dans `TODO.md`, à titre
historique.

## État actuel

Le jeu comprend 9 partis jouables (candidatures ancrées dans une photographie politique réelle du
18 avril 2026, personnages pseudonymisés) et un mouvement personnalisable, 290 événements, 58
succès, une idéologie et une mémoire d'acteurs réellement actives pendant la partie, des chaînes
narratives, des remplacements de candidats adverses, un système de désistement stratégique négocié
distinct du retrait par effondrement, des soutiens majeurs (nationaux et internationaux,
pseudonymisés, à effets toujours mixtes) et un second tour sensible aux décisions prises pendant
la campagne.

Il est validé par 294 tests Vitest, la suite E2E Playwright (parcours fonctionnels et régression
visuelle), et des dizaines de milliers de campagnes automatiques cumulées à travers les audits
successifs, sans blocage ni état invalide observé.

Le comparatif chiffré avant/après avec la V1 (répétition des choix, différenciation des
partis, agence du joueur, badges, couverture) se trouve dans `audit/V2_COMPARISON.md`. L'état
de la V1 originale (182 événements, 38 tests, 1 000 campagnes automatiques) reste documenté
dans `docs/TESTING.md` à titre historique.

## Licence

Aucune licence n'est définie pour ce dépôt à ce stade. Tous droits réservés par défaut.
