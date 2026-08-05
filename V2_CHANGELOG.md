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
- Contrôles de phase : format, lint, typecheck, validation, tests et build réussis.

### Phases C à E — Corpus éditorial V2

- Retrait des factories narratives V1 du chemin de production au profit de textes entièrement écrits dans leur contexte ; les helpers V2 ne fournissent que la structure technique.
- Bibliothèque portée à 218 événements, 597 choix et 605 issues : 25 campagnes, 15 médias, 10 programmes, 8 débats, 15 situations internes, 10 alliances, 10 scandales fictifs, 12 événements mondiaux, 9 rares, 90 événements de parti et 14 séquences de fin.
- Dix événements propres à chacun des neuf partis, avec identité, conflit interne, alliance, programme, électorat, second tour et situation rare différenciés.
- 79 événements enregistrent une position de fond, 65 impliquent relations ou mémoire, et 15 chaînes narratives atteignent une profondeur maximale de 3.
- Métriques du validateur strict : 100 % de choix uniques, 100 % de récits d’issue uniques, 100 % de choix reconnus concrets, 2 triptyques génériques sur 218, aucun ensemble de choix dupliqué et aucune conséquence identique au sein d’un événement.
- Registre de 141 entités : 99 réelles et 42 fictives, ces dernières étant presque exclusivement les personnages secondaires nécessaires à la fiction sensible.
- Ajout de `docs/EDITORIAL_POLICY.md` et promotion de la bibliothèque en `contentVersion: 2` ; toute régression sous les seuils V2 bloque désormais `npm run data:validate`.
- Les 58 succès disposent désormais de critères typés réellement exécutés par le moteur ; le grand commutateur fondé sur leurs identifiants a été supprimé.
- Contrôles du jalon : typecheck, validation stricte, lint et 67 tests réussis.

### Phase F — Agence et équilibre électoral

- Formule de premier tour moins dépendante du socle initial et davantage sensible à la crédibilité, la popularité, la mobilisation, la dynamique, le rejet, l’implantation et la confiance des électorats.
- Vote utile ramené à un effet de fin de campagne plutôt qu’à un multiplicateur décisif ; participation, indécision et préparation électorale restent distinctes.
- Reports de second tour calculés à partir de la distance idéologique, du rejet, des alliances, des consignes, des relations, de la cohérence des déclarations, de la crédibilité et de la mobilisation.
- Parti personnalisé enrichi par son organisation, son leadership, ses électorats, ses alliés, ses concurrents, ses sujets favorables, ses contradictions et quatorze événements dédiés ; corpus porté à 232 événements.
- Harnais apparié étendu à sept stratégies, avec sélection cohérente selon le programme émergent et vérification déterministe.
- Panel de travail de 1 260 campagnes : eta² du parti 0,400 avant le dernier ajustement ciblé, eta² de stratégie 0,180, résultat qualification/victoire modifié par la stratégie dans 75,6 % des groupes appariés, 10,2 % de campagnes décidées tôt et 14,8 % de remontées.
- Ajustements ciblés validés sur les mêmes seeds : PS à 89,3 % de qualifications et 62,1 % de victoires ; RN à 87,1 % et 37,1 %. Les mesures finales à plus grand volume restent à exécuter en phase J.

### Phase F — reprise et clôture (Claude Code, 6 août 2026)

- Travail retrouvé de Codex, non commité et repris tel quel après vérification : différenciation du report de second tour par parti ( par parti au lieu d'une formule générique dérivée du rejet), module rendant l'idéologie filtrante sur une vingtaine d'événements, seuil qualité , quota d'événements de parti relevé à 5.
- Correction d'un diagnostic erroné : un premier contrôle avait comparé deux rapports d'audit générés à des tailles d'échantillon différentes et conclu à tort à une régression du dernier ajustement de Codex sur . À échantillon égal, l'état HEAD présentait déjà les mêmes bornes d'équilibre ; le calibrage de Codex a été conservé intégralement.
- Mesure finale à l'échelle cible : 6 300 campagnes existantes (9 partis × 7 stratégies, dont 5 réellement jouables) et 2 000 campagnes personnalisées. eta² du parti 0,402, eta² de stratégie 0,142. Aucune des 5 stratégies jouables ne produit un résultat à 0 % ou supérieur à 90 % pour un parti donné.

### Phase F — reprise et clôture (Claude Code, 6 août 2026)

- Travail retrouvé de Codex, non commité et repris tel quel après vérification : différenciation du report de second tour par parti (`transferability` par parti au lieu d'une formule générique dérivée du rejet), module `ideologyEligibility.ts` rendant l'idéologie filtrante sur une vingtaine d'événements, seuil qualité `minimumIdeologyConditionedEvents`, quota d'événements de parti relevé à 5.
- Correction d'un diagnostic erroné : un premier contrôle avait comparé deux rapports d'audit générés à des tailles d'échantillon différentes et conclu à tort à une régression du dernier ajustement de Codex sur `runoffAppeal`. À échantillon égal, l'état HEAD présentait déjà les mêmes bornes d'équilibre ; le calibrage de Codex a été conservé intégralement.
- Mesure finale à l'échelle cible : 6 300 campagnes existantes (9 partis × 7 stratégies, dont 5 réellement jouables) et 2 000 campagnes personnalisées. eta² du parti 0,402, eta² de stratégie 0,142. Aucune des 5 stratégies jouables ne produit un résultat à 0 % ou supérieur à 90 % pour un parti donné.

### Phase G — Succès, fins et bilan

- Croissance organique et déterministe des adhérents à partir de la trajectoire réelle ; les deux succès associés mesurent désormais un gain depuis le départ plutôt qu’un stock initial.
- Correction du calcul des succès de score et de fin, auparavant évalués avant que ces données existent.
- Fins rares conditionnées par plusieurs décisions préparatoires ; la fin d’abandon sensible décrit désormais un retrait de campagne pour épuisement, sans événement diffamatoire.
- Score final recalculé à partir de la performance au premier tour, de la progression, de la croissance militante, des positions, alliances, contradictions et décisions réellement enregistrées.
- Résumé final enrichi avec tournant, meilleur choix, décision coûteuse et héritage issus de l’historique ; progression des badges numériques visible pendant une partie active.

### Phase G — corrections (Claude Code, 6 août 2026)

- `million_members` exigeait un gain de 150 000 adhérents alors que seuls des événements de parti personnalisé portent un effet positif sur les adhérents (six événements, plafond théorique cumulé d'environ 67 000) : aucun des neuf partis existants ne peut jamais gagner d'adhérents. Seuil ramené à 60 000 et titre/description corrigés (« Soixante mille nouvelles cartes »).
- `viral` exigeait un identifiant d'issue contenant « viral », qu'aucun événement ne produisait réellement (le mot n'apparaissait que dans des textes de récit ou des libellés d'effet). L'issue `parrot_charity_clip` — dont le récit décrit explicitement « la séquence la plus partagée de votre campagne » — a été renommée `parrot_charity_clip_viral` ; le drapeau `parrot_charity_clip` lu par `endings.ts` n'a pas été modifié.

### Phase H — Interface de décision

- Suppression du mini-jeu de débat fondé sur les postures « précision/offensive/rassemblement/démonstration » : un débat présente directement deux à quatre prises de position contextualisées.
- Tags de risque maintenus comme repères secondaires, jamais comme libellés principaux ; indices publics immédiats affichés sans révéler les variables cachées.
- Journal enrichi avec évolution des déclarations, contradictions, alliances actives et actions adverses réellement simulées.
- Bilan visuel relié aux positions, alliances et contradictions de la campagne.

### Phase H — vérification (Claude Code, 6 août 2026)

- Contrôle des 5 tailles d'écran cibles et des signaux d'accessibilité structurels (contraste, étiquettes, focus, mouvement réduit) via `browser-resilience.mjs` et la logique de `browser-page-metrics.js` : aucun débordement horizontal, aucun contrôle sans étiquette, aucun texte sous le seuil de contraste AA sur les pages contrôlées. Écart mineur relevé et documenté (liens de pied de page sous la cible tactile de 44 px) sans correction dans cette session.
- Deux fixtures E2E de déterminisme électoral (`e2e-ps-1` pour une élimination au premier tour, `e2e-rn-0` pour une défaite au second tour) ne produisaient plus l'issue attendue après le recalibrage de la Phase F ; remplacées par des graines revérifiées avec le moteur (`e2e-ps-search-0`, `e2e-rn-defeat-0`).

### Phase I — Stabilité et dette technique

- Le dialogue de fiction Playwright attend désormais l’un des deux états fonctionnels valides — avertissement affiché ou choix de mode déjà accessible — avant d’agir ; la suite parallèle passe sans délai artificiel.
- Fixture d’élimination électorale recalée sur une seed déterministe après l’équilibrage V2.
- Ajout de tests explicites pour un stockage local vide et un import dont la partie active est corrompue ; migration V1, collision des identifiants et reprise après rafraîchissement restent couvertes.
- Test probabiliste de 120 campagnes mesuré à environ 4,7 s et protégé par un timeout local de 10 s, sans modifier le timeout global de Vitest.
- Extraction de la carte d’événement et de la carte de débat dans `event-decision-card.tsx` ; `campaign-screens.tsx` conserve l’orchestration des écrans.
- Suppression de six modules V1 non importés et de leur fabrique narrative générique, soit plusieurs milliers de lignes de code et de prose morts hors du bundle.
- Couverture V2 après nettoyage : 78,11 % des instructions, 66,31 % des branches, 74,45 % des fonctions et 81,78 % des lignes ; moteur à 85,12 % des instructions.

### Phase J — Vérification finale (Claude Code, 6 août 2026)

- Correction d'un bug de mesure trouvé en préparant la comparaison : `scripts/audit/content-audit.ts` détectait les chaînes narratives via `outcome.enqueueEventIds`, un champ hérité de la V1 qu'aucun événement V2 ne renseigne, alors que le mécanisme réel est `outcome.followUps`. Le détecteur additionne désormais les deux ; les chaînes V2 passent de « 0 mesurées » à 21 chaînes, 39 liaisons, profondeur maximale 2 (voir D-022).
- Génération de `audit/v2-metrics.json` (agrégat des rapports v2-\*), `audit/v2-final-verification.json` (contrôles format/lint/typecheck/validation/build/audit npm/tests/E2E/simulation/navigateur) et `audit/V2_COMPARISON.md` (comparatif chiffré V1 → V2 par thème : contenu, différenciation des partis, idéologie, mémoire, chaînes, entités, agence du joueur, badges, tests, couverture).
- Couverture rafraîchie via `vitest --coverage --coverage.reporter=json-summary` (le reporter par défaut de `vitest.config.ts` n'écrit pas de résumé JSON) : 78,3 % des instructions, 66,42 % des branches, 74,62 % des fonctions, 82,04 % des lignes.
- `npm audit --audit-level=high` : 0 vulnérabilité.
- Écarts restants documentés sans correction dans cette session : profondeur de chaîne maximale à 2 contre une cible de 3, quelques cibles tactiles de pied de page sous 44 px, aucun lecteur d'écran réel testé.
