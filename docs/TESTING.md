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
