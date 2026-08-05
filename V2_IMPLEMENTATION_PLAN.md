# Plan d’implémentation V2

Ce document suit l’exécution réelle de la V2. Les valeurs de départ proviennent de `AUDIT_COMPLET.md`, `audit/metrics.json` et `audit/final-verification.json`.

## Ligne de base

- [x] Lire intégralement l’audit, les métriques, le cahier des charges et la documentation.
- [x] Inspecter l’historique et créer `codex/v2-audit-improvements` depuis un arbre propre.
- [x] Exécuter les contrôles initiaux.
- [x] Confirmer l’instabilité E2E du dialogue initial en exécution parallèle.
- [ ] Capturer les métriques V1 dans le comparatif V2.

Résultats initiaux du 5 août 2026 :

| Commande                | Résultat                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `npm run format:check`  | succès                                                                                   |
| `npm run lint`          | succès                                                                                   |
| `npm run typecheck`     | succès                                                                                   |
| `npm run data:validate` | succès — 182 événements, 58 succès                                                       |
| `npm run test`          | succès ponctuel — 38 tests, 15,16 s                                                      |
| `npm run build`         | succès — compilation 27,8 s                                                              |
| `npm run test:e2e`      | échec — 17 réussis, 1 échec, 6 ignorés ; dialogue initial absent dans un worker Chromium |

## Phase A — Socle et schémas

- [x] Passer le schéma de sauvegarde en version 2.
- [x] Ajouter une migration explicite V1 → V2 et ses tests.
- [x] Corriger l’identité des parties avec seed, parti, version et instance.
- [x] Étendre les thèmes, phases, importance, entités, incompatibilités et limites d’apparition.
- [x] Étendre les conditions (idéologie, déclarations, mémoire, relation, mode et organisation).
- [x] Étendre les effets (mémoire, relation, position, adversaire, suivi narratif).
- [x] Ajouter les stratégies concrètes de choix et la traçabilité des probabilités.
- [x] Ajouter un registre typé des entités.
- [x] Renforcer les validateurs de contenu et documenter leurs seuils.
- [x] Ajouter les tests de schéma, migration, identifiant et validations.
- [x] Exécuter tous les contrôles de non-régression et committer la phase.

## Phase B — Moteur

- [x] Enregistrer et appliquer les déclarations par thème.
- [x] Distinguer évolution, compromis, repositionnement, contradiction et revirement.
- [x] Faire influencer les positions sur idéologie, électorats, cohésion et rejet.
- [x] Implémenter la mémoire relationnelle des acteurs et des partis.
- [x] Implémenter suites différées, variantes, incompatibilités, max d’apparitions et cooldowns.
- [x] Enrichir les modificateurs probabilistes et exposer les raisons après résolution.
- [x] Simuler alliances, crises, retraits, remplacements et dissidences adverses.
- [x] Produire un bulletin adverse périodique lisible.
- [x] Ajouter les tests moteur et de déterminisme.
- [x] Exécuter tous les contrôles de non-régression et committer la phase.

## Phase C — Architecture éditoriale du contenu

- [ ] Retirer la fabrique narrative générique du chemin de production.
- [ ] Introduire des helpers purement structurels sans génération de prose principale.
- [ ] Créer `docs/EDITORIAL_POLICY.md`.
- [ ] Renseigner les entités réelles et fictives avec statut et sensibilité.
- [ ] Ajouter les règles de validation éditoriale et leurs tests.
- [ ] Exécuter tous les contrôles de non-régression et committer la phase.

## Phase D — Réécriture narrative

- [ ] Écrire 60 à 90 événements génériques contextualisés.
- [ ] Écrire 10 à 15 événements propres à chacun des neuf partis.
- [ ] Écrire au moins 30 événements idéologiques ou liés aux déclarations.
- [ ] Écrire au moins 20 événements de relations, alliances, retraits ou dissidences.
- [ ] Écrire au moins 15 débats ou interviews interactifs.
- [ ] Couvrir économie/social, international et institutions françaises.
- [ ] Construire au moins dix chaînes, dont une de profondeur trois.
- [ ] Dépasser 200 événements réellement distincts sans remplissage lexical.
- [ ] Atteindre 95 % de textes de choix uniques et 70 % de récits uniques.
- [ ] Exécuter l’audit de contenu, corriger les seuils puis committer la phase.

## Phase E — France réelle

- [ ] Remplacer pays, institutions, territoires et médias fictifs inutiles.
- [ ] Conserver les personnages fictifs pour les situations sensibles.
- [ ] Vérifier les mécanismes électoraux et la date de la présidentielle.
- [ ] Atteindre les cibles réel/fictif sans citation ni accusation inventée.
- [ ] Exécuter la validation éditoriale et committer la phase.

## Phase F — Équilibre électoral

- [ ] Rééquilibrer socles, indécis, abstention, vote utile et dynamique.
- [ ] Rendre les sondages imparfaits mais interprétables.
- [ ] Enrichir les reports du second tour.
- [ ] Différencier les neuf partis et le parti personnalisé.
- [ ] Comparer les stratégies avec seeds appariées.
- [ ] Exécuter au moins 6 000 campagnes existantes et 1 500 personnalisées.
- [ ] Corriger les extrêmes sans uniformiser les partis.
- [ ] Documenter les seuils atteints et committer la phase.

## Phase G — Succès, fins et bilan

- [ ] Corriger ou remplacer les succès impossibles et triviaux.
- [ ] Tester chaque famille de succès et sa persistance.
- [ ] Ajouter les fins alternatives préparées par la trajectoire.
- [ ] Produire un bilan à partir des décisions, positions, alliances et tournants réels.
- [ ] Améliorer la carte de partage sans données inventées.
- [ ] Exécuter les tests et committer la phase.

## Phase H — UX

- [ ] Recomposer les cartes autour d’actions concrètes et de tags secondaires.
- [ ] Afficher une explication concise des facteurs de résultat.
- [ ] Ajouter un journal compact des positions, alliances, ruptures et crises.
- [ ] Clarifier la progression et les moments décisifs sans tableau de bord lourd.
- [ ] Vérifier clavier, focus, lecteurs d’écran, contraste et mouvement réduit.
- [ ] Tester 360×800, 412×915, 768×1024, 1366×768 et 1920×1080.
- [ ] Exécuter les tests UI/E2E et committer la phase.

## Phase I — Dette technique

- [ ] Découper les composants trop volumineux par responsabilité.
- [ ] Corriger l’instabilité Vitest sans timeout global excessif.
- [ ] Corriger le dialogue Playwright avec isolation et locateur robuste.
- [ ] Retirer types, code et données morts.
- [ ] Vérifier sauvegarde vide, corrompue, V1 et reprise après actualisation.
- [ ] Exécuter la couverture et committer la phase.

## Phase J — Vérification finale

- [ ] Générer `audit/v2-metrics.json`.
- [ ] Générer `audit/v2-final-verification.json`.
- [ ] Rédiger `audit/V2_COMPARISON.md` avec avant, après, objectif et statut.
- [ ] Exécuter les simulations, tests de seed, chaînes, succès, remplacements et contradictions.
- [ ] Exécuter format, lint, typecheck, validation, tests, build, E2E et audit npm.
- [ ] Exécuter couverture, tailles d’écran, hors-ligne et migrations.
- [ ] Mettre à jour README, changelog et décisions.
- [ ] Créer les commits finaux et vérifier un arbre Git maîtrisé.
