# Stratégie de tests

## Moteur

Vitest couvre les fonctions pures et fast-check explore plusieurs centaines de seeds : déterminisme,
softmax, bornes, effets différés, sélection, adversaires, sondages, élections, scores, succès et
migrations. Les tests d’intégration rejouent une série de choix identique avec deux instances.

## Interface

React Testing Library vérifie les composants interactifs, leurs libellés accessibles et les états
essentiels. Playwright couvre les campagnes existante, personnalisée et aléatoire, sauvegarde/reprise,
qualification, élimination, victoire/défaite, succès, partage, mobile et hors connexion.

## Équilibrage

`npm run test:simulation` exécute au moins 1 000 campagnes automatiques et écrit un rapport ignoré
par Git. Les alertes portent sur blocages, valeurs invalides, diversité des gagnants, événements
jamais vus et domination excessive d’un choix.

## Validation avant livraison

`npm run check` doit être vert. Le parcours principal est ensuite vérifié dans un vrai navigateur à
360 px et sur desktop, en contrôlant la console et la reprise locale.

## Validation de la V1 — 5 août 2026

- `npm run check` : réussi, avec 38 tests Vitest répartis sur 12 fichiers et un build Next.js de production.
- `npm run test:e2e` : 18 tests réussis ; les 12 parcours sont couverts sur Chromium desktop et les écrans essentiels sont rejoués avec un profil Pixel 7.
- `npm run test:simulation` : 1 000 campagnes, durée moyenne de 26,94 décisions, 0 blocage, 0 état invalide et aucun seuil d’alerte franchi.
- `npm audit --audit-level=high` : 0 vulnérabilité connue.
- Contrôle manuel Playwright : vues desktop/mobile, console, reprise IndexedDB, carte PNG, service worker, rechargement hors ligne et fallback hors connexion.
