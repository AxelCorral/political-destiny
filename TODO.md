# Feuille de route — Vers l’Élysée

Ce document suit l’avancement de la V1 décrite dans `PROMPT_MAITRE_CLAUDE_CODE_JEU_POLITIQUE.md`.

## Phase 1 — Audit et fondations

- [x] Inventorier intégralement le dépôt initial et vérifier l’état Git.
- [x] Lire intégralement le cahier des charges maître (2 025 lignes).
- [x] Vérifier Node.js, npm et Git.
- [x] Initialiser Git et la configuration du dépôt.
- [x] Initialiser Next.js, React, TypeScript strict et Tailwind CSS.
- [x] Installer les dépendances de production et de qualité.
- [x] Créer l’architecture séparant moteur, données, persistance et interface.
- [x] Centraliser marque, configuration et feature flags.
- [x] Rédiger les documents initiaux de conception, contenu, données et sécurité éditoriale.
- [x] Valider lint, types et build des fondations.
- [x] Commit de phase.

## Phase 2 — Moteur de simulation pur

- [ ] Définir tous les types sérialisables et schémas Zod.
- [ ] Implémenter le PRNG déterministe et ses dérivations.
- [ ] Construire l’état initial, le calendrier et les transitions de phase.
- [ ] Implémenter conditions, softmax, résolution probabiliste et journal interne.
- [ ] Appliquer et borner les effets immédiats, cachés et différés.
- [ ] Implémenter sélection pondérée, quotas souples, cooldowns et chaînes.
- [ ] Simuler les adversaires, stratégies, crises, retraits et remplacements.
- [ ] Modéliser électorat latent, sondages bruités et tendances régionales.
- [ ] Calculer premier tour, reports, second tour et épilogue.
- [ ] Calculer score final, fins et succès.
- [ ] Ajouter tests unitaires et tests par propriétés.
- [ ] Commit de phase.

## Phase 3 — Données et contenu jouable

- [ ] Ajouter les neuf partis configurables et le parti personnalisé.
- [ ] Ajouter candidats et cadres fictifs, affinités, forces, faiblesses et programmes.
- [ ] Ajouter les 12 blocs électoraux et les grandes régions.
- [ ] Ajouter les cinq méthodes de campagne.
- [ ] Ajouter au moins 110 événements variés, dont chaînes et événements rares.
- [ ] Ajouter au moins quatre événements spécifiques par parti.
- [ ] Ajouter au moins 40 badges et les fins principales/secrètes.
- [ ] Ajouter le snapshot réel daté et uniquement des métadonnées sûres.
- [ ] Créer le validateur éditorial et référentiel de contenu.
- [ ] Créer et exécuter le simulateur d’équilibrage local.
- [ ] Commit de phase.

## Phase 4 — Parcours de jeu complet

- [ ] Créer l’accueil, le disclaimer et la navigation responsive.
- [ ] Créer choix du mode, sélection/détail du parti et mode aléatoire.
- [ ] Créer le parcours rapide de parti personnalisé.
- [ ] Créer choix de méthode et introduction de campagne.
- [ ] Créer carte événement, choix, conséquence et progression.
- [ ] Créer dashboard, sondages, actualités et état de la course.
- [ ] Intégrer débat en trois manches et programme émergent.
- [ ] Créer soirées électorales, entre-deux-tours et épilogue.
- [ ] Créer bilan final complet et rejouabilité.
- [ ] Tester les composants critiques.
- [ ] Commit de phase.

## Phase 5 — Sauvegardes et métajeu

- [ ] Persister partie active, archives et succès dans IndexedDB.
- [ ] Implémenter autosave, reprise, migration et récupération d’erreur.
- [ ] Créer archives, détail de campagne, badges et panthéon.
- [ ] Implémenter suppression ciblée/globale et import/export JSON.
- [ ] Générer une carte PNG portrait/paysage et intégrer Web Share.
- [ ] Commit de phase.

## Phase 6 — PWA, responsive et accessibilité

- [ ] Créer manifest, icônes originales, service worker et page hors connexion.
- [ ] Assurer le fonctionnement sans réseau après la première visite.
- [ ] Optimiser les interfaces mobile 360–430 px, tablette et desktop.
- [ ] Vérifier clavier, focus, contrastes, ARIA, annonces et tailles tactiles.
- [ ] Respecter `prefers-reduced-motion` et proposer un réglage local.
- [ ] Créer méthodologie, confidentialité, à propos, paramètres et page 404.
- [ ] Commit de phase.

## Phase 7 — QA et livraison

- [ ] Couvrir les 12 parcours E2E requis avec Playwright.
- [ ] Exécuter plusieurs centaines/milliers de simulations sans blocage.
- [ ] Vérifier absence de NaN, bornes, sommes à 100 et variété des résultats.
- [ ] Exécuter format, lint, typecheck, validation des données et tests.
- [ ] Exécuter le build de production et contrôler les erreurs console.
- [ ] Auditer les dépendances et corriger les vulnérabilités critiques.
- [ ] Tester réellement mobile, desktop, reprise, partage et hors connexion.
- [ ] Finaliser README et documentation d’extension/déploiement.
- [ ] Mettre à jour cette feuille de route et créer le commit final.
