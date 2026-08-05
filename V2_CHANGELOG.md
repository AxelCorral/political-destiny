# Journal des changements V2

## En cours

### Préparation

- Création de la branche `codex/v2-audit-improvements` depuis `e2a6d9c`.
- Conservation intégrale de l’état audité : aucun commit de sauvegarde supplémentaire n’était nécessaire, l’arbre étant propre.
- Lecture des sources de vérité, des données, du moteur, du stockage, des tests et des principaux parcours UI.
- Exécution du bilan initial : tous les contrôles statiques et unitaires passent lors de cette exécution, mais le test E2E parallèle reproduit le défaut connu du dialogue de fiction.

### Mesures V1 figées

- 182 événements, 533 choix et 1 066 issues pondérées.
- 72,23 % de textes de choix uniques.
- 17,73 % de récits d’issue uniques.
- 160 événements sur 182 reposent sur le triptyque prudent/risqué/collectif.
- 0 événement idéologique observé, 0 mouvement idéologique, 0 mémoire d’acteur et 0 remplacement en 900 campagnes auditées.
- Eta² du parti sur le premier tour : 73,387 % ; eta² de la stratégie : 3,002 %.
- 21,185 % de campagnes décidées tôt ; 4,389 % de remontées significatives.
- 7 succès structurellement impossibles.

### Phase A — Socle et schémas

- Passage de `GAME_CONFIG.schemaVersion` à 2 et migration explicite de l’état V1.
- Nouvel identifiant de partie dérivé de la version, de la seed, du parti et d’une instance locale unique ; le PRNG ne dépend pas de l’instance.
- Date officielle du premier tour corrigée au 18 avril 2027, vérifiée le 5 août 2026 auprès du ministère de l’Intérieur et du Gouvernement.
- Ajout des thèmes politiques, familles idéologiques, stratégies de choix, profils de campagne et d’organisation.
- Ajout des conditions et effets pour idéologie, déclarations, mémoire, relations, positions et stratégie adverse.
- Ajout des structures d’état pour positions, mémoires, relations, chaînes, événements différés et actions adverses.
- Ajout du registre typé des entités et des métadonnées de sensibilité éditoriale.
- Ajout du validateur de qualité V2 et de seuils bloquants documentés dans `docs/CONTENT_QUALITY_RULES.md`.
- Ajout de 15 tests de schéma, qualité, migration et identité de partie : la suite passe désormais 53 tests.
- Contrôles de phase : format, lint, typecheck, validation, tests et build réussis.

### Phase B — Moteur narratif

- Normalisation de douze thèmes politiques et création d’un programme émergent par déclarations.
- Classification des changements de ligne : position initiale, évolution progressive, compromis cohérent, repositionnement, contradiction et revirement brutal.
- Répercussions simultanées des revirements sur cohérence, cohésion, rejet, présence médiatique, adhérents, idéologie perçue et confiance des blocs électoraux.
- Mémoire typée des acteurs et relations symétriques entre partis, utilisables dans les conditions et probabilités.
- Suites probabilistes différées, progression des chaînes, délais, incompatibilités et limites d’apparition.
- Explication des facteurs ayant favorisé ou contrarié une issue sans exposer le jet aléatoire.
- Simulation adverse enrichie : changements de stratégie, crises internes fictives, alliances, consignes de second tour, remplacements et dissidences.
- Bulletins adverses périodiques produits à partir d’actions réellement simulées.
- 14 nouveaux tests moteur ; suite portée à 67 tests sur 15 fichiers.
- Le test de 120 campagnes conserve son volume et reçoit un timeout local de 15 s ; aucun timeout global n’a été augmenté.
- Simulation fumée de 300 campagnes : 0 campagne bloquée, 0 état invalide, 27,14 décisions en moyenne. Les déséquilibres V1 restent volontairement à traiter en phase F.
- Contrôles de phase : format, lint, typecheck, validation, tests et build réussis.
