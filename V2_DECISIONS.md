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

## D-013 — Le libellé peut être long sans redevenir abstrait

Un choix peut compter jusqu’à 140 caractères afin de décrire une action complète, ses acteurs et sa condition principale. Cette limite reste contrôlée par le schéma ; l’interface doit faire revenir le texte à la ligne et conserver une cible tactile d’au moins 44 px. Raccourcir un choix n’est jamais une raison pour le réduire à « prudent », « offensif » ou « rassembleur ».

## D-014 — Les critères de succès sont la règle exécutable

Chaque succès possède un groupe de critères typés. Le moteur évalue ces critères génériquement à partir de la partie réelle : décisions, sondages, score, positions, contradictions, alliances, souvenirs, tags et stratégies. L’identifiant du succès ne contient plus de logique cachée ; un succès absent du registre de critères empêche la construction des données V2.

## D-015 — Le premier tour mesure une campagne, pas seulement un socle

Le socle et les affinités conservent des difficultés distinctes, mais leur contribution est comprimée. Crédibilité, popularité, mobilisation, rejet, dynamique, implantation, élus et confiance gagnée pendant la campagne pèsent davantage. Les réglages ne cherchent pas des taux égaux : ils imposent seulement qu’un favori puisse échouer et qu’un outsider sérieux puisse se qualifier.

## D-016 — Les reports sont des comportements, pas une matrice fixe

Au second tour, chaque électorat éliminé arbitre entre proximité, rejet, relations, alliance ou consigne, cohérence du finaliste et abstention. Une consigne modifie réellement le transfert sans le rendre automatique. Le bruit final reste borné et déterministe par la seed.

## D-017 — Un parti personnalisé reçoit des tensions dérivées

Le questionnaire produit un profil d’organisation, de leadership, de financement, d’électorats et de contradictions. Ces propriétés deviennent des tags d’éligibilité pour des événements dédiés. Une incohérence n’est donc plus un malus abstrait : elle déclenche des arbitrages narratifs sur le manifeste, les comités ou les alliances.

## D-018 — Les badges de progression lisent la partie active

Les succès numériques à seuil unique peuvent afficher une progression calculée par le même évaluateur que le déblocage. Le profil archivé et la partie active sont réunis à l’affichage ; aucun compteur parallèle n’est introduit dans l’interface.

## D-019 — Les tests longs justifient leur propre borne

Le test de propriété conserve 120 campagnes, mais sa limite est locale et vaut environ deux fois sa durée mesurée. Playwright ne dépend plus de la présence obligatoire du dialogue initial : il attend un état fonctionnel stable. Aucun timeout global n’est augmenté pour masquer une attente fragile.

## D-020 — Le corpus V1 mort est supprimé, pas archivé dans le runtime

Les anciens modules `general`, `internal`, `world`, `partySpecific`, `endgame` et leur factory n’étaient plus importés depuis la promotion du corpus V2. Git conserve leur historique ; les garder dans `src` augmentait le bruit des recherches et le risque de réutiliser par erreur les gabarits interdits.

## D-021 — Mesurer à échantillon constant avant de conclure à une régression

En reprenant le travail non commité de Codex sur la Phase F, un premier diagnostic a comparé deux rapports d'audit générés à des tailles d'échantillon différentes et a conclu à tort à une régression de son dernier ajustement sur `runoffAppeal`. La correction ultérieure, refaite à échantillon constant (mêmes graines, même nombre de campagnes), a montré que l'ajustement était neutre à légèrement bénéfique. Toute mesure d'équilibre électoral doit désormais comparer des rapports générés avec le même `AUDIT_SEEDS_PER_PARTY` (ou équivalent) avant d'être interprétée comme une évolution réelle.

## D-022 — Un script d'audit peut mentir si son détecteur suit un champ abandonné

`scripts/audit/content-audit.ts` détectait les chaînes narratives via `outcome.enqueueEventIds`, un champ hérité de la V1 qu'aucun événement V2 ne renseigne ; le mécanisme réel est `outcome.followUps`. Le script rapportait donc silencieusement zéro chaîne alors que 21 chaînes existent. Corrigé pour additionner les deux mécanismes. Leçon retenue pour la Phase J : une mesure à zéro doit être vérifiée par lecture directe des données avant d'être actée, surtout quand elle contredit un changelog antérieur.
