# Décisions techniques et éditoriales V2

## D-001 — Évolution compatible plutôt que rupture des sauvegardes

Le format de partie passe en version 2 avec une migration explicite depuis la V1. Les identifiants d’événements existants sont conservés lorsqu’un événement est réécrit ; les retraits éventuels sont couverts par une migration ou une table d’alias. Les sauvegardes futures plus récentes restent refusées proprement.

## D-002 — Le moteur reste TypeScript pur et déterministe

Les règles, données et simulations restent indépendantes de React, d’IndexedDB et du réseau. Toute incertitude jouable consomme le PRNG sérialisé. Les identifiants d’archive utilisent une instance de partie distincte, mais cet identifiant n’entre pas dans les tirages : une même seed, le même parti et les mêmes choix conservent la même trajectoire.

## D-003 — Actions écrites, métadonnées séparées

Le libellé principal d’un choix décrit une action ou une déclaration vérifiable dans son contexte. Les notions `PRUDENT`, `RISQUÉ`, `CLIVANT` ou `RASSEMBLEUR` restent des tags secondaires. Une stratégie métier distincte sert au moteur et aux audits sans dicter la prose.

## D-004 — Pas de fabrique de prose de production

Les helpers peuvent normaliser un événement, valider des vecteurs et réduire la répétition technique. Ils ne composent plus le titre, le résumé, le libellé de choix ou le récit d’issue à partir d’un gabarit commun. Les textes de production sont présents dans les données et relus dans leur contexte.

## D-005 — Mémoire légère et explicable

Les acteurs et partis mémorisent un petit nombre de faits typés : confiance, hostilité, dette, trahison, soutien, humiliation, promesse, refus, exclusion et ralliement. Leur intensité, leur source et leur date permettent au moteur de modifier une probabilité et à l’interface d’expliquer le rappel sans exposer les statistiques cachées.

## D-006 — France réelle, fiction ciblée

Institutions, territoires, pays et cadres électoraux utilisent leurs noms réels lorsqu’ils sont stables et factuels. Les personnages secondaires restent fictifs pour les scandales, allégations, affaires privées ou judiciaires. Aucune citation n’est attribuée à une personne réelle. Le registre d’entités porte le statut, la sensibilité, la date et la source lorsqu’une actualisation est nécessaire.

## D-007 — Simulations appariées pour mesurer l’agence

Les stratégies sont comparées sur les mêmes seeds et les mêmes partis. Les métriques principales sont l’eta² du parti, l’effet de stratégie, la qualification, la victoire, les campagnes décidées tôt et les remontées. Une cible manquée reste indiquée comme telle ; aucune normalisation artificielle des résultats n’est utilisée.

## D-008 — UX progressive, pas de cockpit

La carte conserve date, sondage, quelques jauges, contexte, choix et conséquence. Le journal des positions et relations est consultable à la demande. Les facteurs décisifs d’une issue sont résumés après le choix, sans afficher le jet interne ni toutes les variables cachées.

## D-009 — Adaptation du guide UI local

Le skill UI/UX demandé par le contexte a été consulté. Son script de recherche référencé n’est pas présent au chemin résolu dans cet environnement ; la V2 applique donc directement ses règles vérifiables : mobile-first, cibles tactiles d’au moins 44 px, focus visible, hiérarchie sobre, contraste AA et respect de `prefers-reduced-motion`. Cette limite ne bloque pas l’implémentation.

## D-010 — Correction des tests par état fonctionnel

Le test Playwright du dialogue ne supposera plus que chaque contexte vierge affiche nécessairement le même état persistant. Chaque test isole son stockage et la fonction de fermeture acceptera les deux états valides : dialogue visible à fermer ou préférence déjà enregistrée. Le test Vitest de campagne complète sera optimisé et, uniquement si nécessaire, recevra un timeout local documenté.

## D-011 — Une position est une donnée, pas seulement un drapeau

Chaque déclaration de fond associe un thème normalisé, une orientation de −100 à +100, un niveau de confiance et une histoire de changements. L’idéologie profonde se déplace moins vite que l’image perçue. Une rupture de plus de 70 points est un revirement brutal ; elle peut conquérir un électorat tout en coûtant cohésion, adhérents et rejet. Les seuils restent internes au moteur et sont testés.

## D-012 — Les adversaires publient seulement ce qu’ils ont simulé

Le fil adverse est dérivé des actions enregistrées dans `opponentActions`. Une alliance, une crise, un remplacement ou une consigne ne peut pas être raconté sans avoir modifié l’état correspondant. Les crises sensibles ne concernent que des personnages fictifs et restent formulées comme des crises de campagne, sans accusation personnelle inventée.
