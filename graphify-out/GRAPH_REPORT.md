# Graph Report - . (2026-08-05)

## Corpus Check

- 124 files · ~64,037 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 730 nodes · 1564 edges · 49 communities (43 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- [[_COMMUNITY_Calendrier et effets|Calendrier et effets]]
- [[_COMMUNITY_État score et fins|État score et fins]]
- [[_COMMUNITY_Sélection des événements|Sélection des événements]]
- [[_COMMUNITY_Archives et paramètres|Archives et paramètres]]
- [[_COMMUNITY_Création du parti|Création du parti]]
- [[_COMMUNITY_Layout et PWA|Layout et PWA]]
- [[_COMMUNITY_Écrans de campagne|Écrans de campagne]]
- [[_COMMUNITY_Orchestration du jeu|Orchestration du jeu]]
- [[_COMMUNITY_Partis et électorat|Partis et électorat]]
- [[_COMMUNITY_Configuration TypeScript|Configuration TypeScript]]
- [[_COMMUNITY_Dépendances de test|Dépendances de test]]
- [[_COMMUNITY_Présentation et bilan|Présentation et bilan]]
- [[_COMMUNITY_Accueil erreurs hors-ligne|Accueil erreurs hors-ligne]]
- [[_COMMUNITY_Dashboard et badges|Dashboard et badges]]
- [[_COMMUNITY_Dépendances applicatives|Dépendances applicatives]]
- [[_COMMUNITY_Scripts npm|Scripts npm]]
- [[_COMMUNITY_Sécurité éditoriale|Sécurité éditoriale]]
- [[_COMMUNITY_Modèle de simulation politique|Modèle de simulation politique]]
- [[_COMMUNITY_Partis jouables|Partis jouables]]
- [[_COMMUNITY_Simulateur d’équilibrage|Simulateur d’équilibrage]]
- [[_COMMUNITY_Registre de contenu|Registre de contenu]]
- [[_COMMUNITY_Acteurs fictifs|Acteurs fictifs]]
- [[_COMMUNITY_Systèmes du moteur|Systèmes du moteur]]
- [[_COMMUNITY_Validation du contenu|Validation du contenu]]
- [[_COMMUNITY_Score partage et métajeu|Score partage et métajeu]]
- [[_COMMUNITY_Gouvernance des données réelles|Gouvernance des données réelles]]
- [[_COMMUNITY_Événements probabilistes|Événements probabilistes]]
- [[_COMMUNITY_Produit et architecture|Produit et architecture]]
- [[_COMMUNITY_Métadonnées du paquet|Métadonnées du paquet]]
- [[_COMMUNITY_Stratégie de tests|Stratégie de tests]]
- [[_COMMUNITY_Parcours E2E|Parcours E2E]]
- [[_COMMUNITY_Identité visuelle emblème|Identité visuelle emblème]]
- [[_COMMUNITY_Boucle de décision|Boucle de décision]]
- [[_COMMUNITY_Icône PWA 512|Icône PWA 512]]
- [[_COMMUNITY_Icône PWA 192|Icône PWA 192]]
- [[_COMMUNITY_Configuration Prettier|Configuration Prettier]]
- [[_COMMUNITY_Règles agent Next.js|Règles agent Next.js]]
- [[_COMMUNITY_Stack web|Stack web]]
- [[_COMMUNITY_Validation de l’état|Validation de l’état]]
- [[_COMMUNITY_Feature flags|Feature flags]]
- [[_COMMUNITY_Configuration Next.js|Configuration Next.js]]
- [[_COMMUNITY_Configuration PostCSS|Configuration PostCSS]]
- [[_COMMUNITY_Accessibilité mobile|Accessibilité mobile]]
- [[_COMMUNITY_Service worker|Service worker]]

## God Nodes (most connected - your core abstractions)

1. `GameState` - 27 edges
2. `createGame()` - 25 edges
3. `resolveCurrentChoice()` - 24 edges
4. `cn()` - 20 edges
5. `clamp()` - 19 edges
6. `compilerOptions` - 19 edges
7. `useGameStore` - 18 edges
8. `Button()` - 15 edges
9. `database()` - 15 edges
10. `scripts` - 14 edges

## Surprising Connections (you probably didn't know these)

- `V1 Delivery Validation — 5 August 2026` --implements--> `V1 Definition of Done` [INFERRED]
  TODO.md → PROMPT_MAITRE_CLAUDE_CODE_JEU_POLITIQUE.md
- `Simulation Engine Invariants` --conceptually_related_to--> `IndexedDB Persistence` [EXTRACTED]
  docs/ENGINE.md → PROMPT_MAITRE_CLAUDE_CODE_JEU_POLITIQUE.md
- `Independent Legal and Editorial Review` --implements--> `Legal, Editorial, and Ethical Safety Model` [INFERRED]
  docs/LEGAL_EDITORIAL_CHECKLIST.md → PROMPT_MAITRE_CLAUDE_CODE_JEU_POLITIQUE.md
- `Testing and Quality Strategy` --references--> `fast-check` [EXTRACTED]
  docs/TESTING.md → PROMPT_MAITRE_CLAUDE_CODE_JEU_POLITIQUE.md
- `Vers l’Élysée Project Overview` --references--> `Pure Simulation Engine` [EXTRACTED]
  README.md → docs/ENGINE.md

## Import Cycles

- None detected.

## Hyperedges (group relationships)

- **Core Decision Resolution Flow** — prompt_event_choice, prompt_weighted_outcome, prompt_softmax_resolution, prompt_deterministic_prng, prompt_game_state [EXTRACTED 1.00]
- **Electoral Simulation Flow** — prompt_twelve_electorate_blocs, prompt_latent_electoral_support, prompt_noisy_poll_model, prompt_first_round_election, prompt_between_rounds_transfers, prompt_second_round_election [EXTRACTED 1.00]
- **V1 Quality Gate** — prompt_zod_content_schemas, prompt_content_validator, prompt_testing_stack, prompt_property_based_simulation_tests, prompt_playwright_e2e_scenarios, prompt_balance_simulator, prompt_definition_of_done [EXTRACTED 1.00]

## Communities (49 total, 6 thin omitted)

### Community 0 - "Calendrier et effets"

Cohesion: 0.07
Nodes (71): finishFixture(), advanceCampaignDate(), dateAtDaysBefore(), daysBetween(), phaseFromDaysRemaining(), applyDueEffects(), applyEffects(), applyOneEffect() (+63 more)

### Community 1 - "État score et fins"

Cohesion: 0.06
Nodes (47): GameScreen, GameUiState, SetupState, endings, achievementMatches(), evaluateAchievements(), determineEndingId(), endingForState() (+39 more)

### Community 2 - "Sélection des événements"

Cohesion: 0.07
Nodes (42): allConditionsMatch(), compare(), conditionMatches(), CATEGORY_TARGETS, eventWeight(), isEventEligible(), quotaMultiplier(), RARITY_WEIGHT (+34 more)

### Community 3 - "Archives et paramètres"

Cohesion: 0.09
Nodes (35): metadata, metadata, ArchiveDetailClient(), ArchivesPageClient(), SettingsPageClient(), metadata, archiveCompletedGame(), clearActiveGame() (+27 more)

### Community 4 - "Création du parti"

Cohesion: 0.07
Nodes (32): applyDelta(), buildCustomParty(), CUSTOM_PARTY_COLORS, CUSTOM_PARTY_SYMBOLS, CustomPartyInput, describeCustomPartyElectorate(), IdeologyOption, IdeologyQuestion (+24 more)

### Community 5 - "Layout et PWA"

Cohesion: 0.11
Nodes (13): metadata, metadata, viewport, LocalPreferences(), PwaRegistrar(), metadata, BRANDING, InfoPage() (+5 more)

### Community 6 - "Écrans de campagne"

Cohesion: 0.11
Nodes (15): CATEGORY_ICONS, DEBATE_TACTICS, DebateStyle, RaceBulletinScreen(), regionalProjection(), electorateBlocs, REGION_LABELS, PartyMark() (+7 more)

### Community 7 - "Orchestration du jeu"

Cohesion: 0.15
Nodes (18): CampaignEventScreen(), ElectionNightScreen(), OutcomeScreen(), GameApp(), useGameStore, GAME_CONFIG, metadata, FictionNotice() (+10 more)

### Community 8 - "Partis et électorat"

Cohesion: 0.10
Nodes (21): BLOC_IDS, electorate(), numberedRecord(), PLAYABLE_PARTY_IDS, REGION_IDS, regions(), actors, BLOC_IDS (+13 more)

### Community 9 - "Configuration TypeScript"

Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+14 more)

### Community 10 - "Dépendances de test"

Cohesion: 0.10
Nodes (21): devDependencies, eslint, eslint-config-next, fake-indexeddb, fast-check, jsdom, @playwright/test, prettier (+13 more)

### Community 11 - "Présentation et bilan"

Cohesion: 0.15
Nodes (15): CATEGORY_LABELS, daysBetween(), formatCampaignDate(), formatInteger(), formatPercent(), REGION_LABELS, STAT_LABELS, ArchiveShareButton() (+7 more)

### Community 12 - "Accueil erreurs hors-ligne"

Cohesion: 0.22
Nodes (7): promises, ActiveCampaignCard(), metadata, Button(), ButtonProps, buttonVariants, Card()

### Community 13 - "Dashboard et badges"

Cohesion: 0.20
Nodes (10): metadata, CampaignDashboard(), DashboardTab, tabs, ScreenShell(), StatGauge(), cn(), BadgesPageClient() (+2 more)

### Community 14 - "Dépendances applicatives"

Cohesion: 0.14
Nodes (14): dependencies, class-variance-authority, clsx, html-to-image, idb, lucide-react, next, @radix-ui/react-dialog (+6 more)

### Community 15 - "Scripts npm"

Cohesion: 0.14
Nodes (14): scripts, build, check, data:validate, dev, format, format:check, lint (+6 more)

### Community 16 - "Sécurité éditoriale"

Cohesion: 0.26
Nodes (13): Editorial Content Rules, Natural Non-Militant French Style, Sensitive-Person Content Safety, Independent Legal and Editorial Review, Legal and Editorial Publication Checklist, ActorIdentityKind, Editorial Content Validator, ENABLE_REAL_PLAYABLE_PERSONS (+5 more)

### Community 17 - "Modèle de simulation politique"

Cohesion: 0.21
Nodes (13): Pure Simulation Engine, ActorState, Between-Rounds Vote Transfers, Conditional Alliances and Defections, Emergent Campaign Program, GameState, Six-Axis Ideology Vector, PartyDefinition (+5 more)

### Community 18 - "Partis jouables"

Cohesion: 0.18
Nodes (12): Implicit Party Difficulty, Horizons, La France insoumise (LFI), Les Écologistes (EELV), Les Républicains (LR), Nouvelle Énergie, Parti socialiste (PS), Rassemblement national (RN) (+4 more)

### Community 19 - "Simulateur d’équilibrage"

Cohesion: 0.17
Nodes (11): byParty, choiceCounts, endings, eventCounts, PartyMetric, partyMetrics, rareTriggered, report (+3 more)

### Community 20 - "Registre de contenu"

Cohesion: 0.22
Nodes (7): achievements, campaignMethods, parties, PoliticalCurrentDefinition, politicalCurrents, events, CampaignMethod

### Community 21 - "Acteurs fictifs"

Cohesion: 0.20
Nodes (9): actors, ActorSeed, actorSeeds, EMPTY_MEMORY, partyActors, profileTraits, sensitiveFictionalActors, ActorRole (+1 more)

### Community 22 - "Systèmes du moteur"

Cohesion: 0.22
Nodes (11): Simulation Engine Invariants, Autonomous Opponent Simulation, 1,000–10,000 Campaign Balance Simulator, Custom Political Movement, Rapid Custom-Party Creation, First-Round Election Calculation, Five Campaign Methods, Latent Electoral Support (+3 more)

### Community 23 - "Validation du contenu"

Cohesion: 0.33
Nodes (7): gameContent, ContentValidationReport, countCategories(), duplicates(), validateGameContent(), words(), report

### Community 24 - "Score partage et métajeu"

Cohesion: 0.24
Nodes (10): Relative Campaign Success, 40+ Campaign Achievements, Client-Generated Result Share Card, V1 Definition of Done, Fiction Simulation Disclaimer, Final Campaign Summary, Campaign Score out of 100, Local Campaign Archives and Pantheon (+2 more)

### Community 25 - "Gouvernance des données réelles"

Cohesion: 0.31
Nodes (10): CNCCFP, Conseil constitutionnel, npm run data:validate, Légifrance, Ministère de l’Intérieur, NEEDS_EDITORIAL_REVIEW, RealWorldSnapshot, SourceMetadata (+2 more)

### Community 26 - "Événements probabilistes"

Cohesion: 0.25
Nodes (9): Controlled Randomness, 110+ Event Library, Deterministic Seeded PRNG, EventChoice, fast-check, GameEventDefinition, Property-Based Simulation Tests, Contextual Softmax Outcome Resolution (+1 more)

### Community 27 - "Produit et architecture"

Cohesion: 0.31
Nodes (9): Fictional French Presidential Campaign Simulation, IndexedDB Persistence, Master Specification for the Political Campaign Game, Offline-First PWA, V1 Post-Election Scope Boundary, Vercel, Vers l’Élysée, Vers l’Élysée Project Overview (+1 more)

### Community 28 - "Métadonnées du paquet"

Cohesion: 0.25
Nodes (7): description, engines, node, name, private, type, version

### Community 29 - "Stratégie de tests"

Cohesion: 0.32
Nodes (8): Playwright, Twelve Required Playwright Journeys, React Testing Library, Layered Testing Stack, Vitest, Testing and Quality Strategy, V1 Test Validation — 5 August 2026, V1 Delivery Validation — 5 August 2026

### Community 30 - "Parcours E2E"

Cohesion: 0.38
Nodes (5): archiveFromState(), dismissFictionNotice(), importArchiveFixture(), Milestones, startExistingCampaign()

### Community 31 - "Identité visuelle emblème"

Cohesion: 0.29
Nodes (7): Abstract Cockade, Blue Horizontal Underline, Civic or Political Insignia, Emblem Icon, Gold Circular Ring, Navy Rounded-Square Field, White V Monogram

### Community 32 - "Boucle de décision"

Cohesion: 0.29
Nodes (7): Eight-Step Decision Pipeline, Campaign Decision Loop, Configurable Campaign Calendar, Weighted Event Selection, Hidden Campaign Variables, Six Dashboard Indicators, Soft Event-Category Quotas

### Community 33 - "Icône PWA 512"

Cohesion: 0.29
Nodes (7): Abstract Cockade, 512-Pixel Application Icon, Blue Horizontal Underline, Civic or Political Brand Mark, Gold Circular Ring, Navy Rounded-Square Field, White V Monogram

### Community 34 - "Icône PWA 192"

Cohesion: 0.47
Nodes (6): Abstract Gold Cockade, 192×192 Application Icon, Blue Horizontal Accent Bar, French Political Campaign Game Identity, Navy Rounded-Square Background, Ivory V Monogram

### Community 35 - "Configuration Prettier"

Cohesion: 0.33
Nodes (5): printWidth, semi, singleQuote, tabWidth, trailingComma

### Community 36 - "Règles agent Next.js"

Cohesion: 0.50
Nodes (4): generate-agent-files.js, Next.js Agent Rules, Installed Next.js Documentation, Claude Project Instruction Redirect

### Community 37 - "Stack web"

Cohesion: 0.50
Nodes (4): Next.js App Router, React, Tailwind CSS, Zustand

## Knowledge Gaps

- **232 isolated node(s):** `semi`, `singleQuote`, `tabWidth`, `trailingComma`, `printWidth` (+227 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `GameState` connect `État score et fins` to `Calendrier et effets`, `Sélection des événements`, `Archives et paramètres`, `Écrans de campagne`, `Validation de l’état`, `Présentation et bilan`, `Accueil erreurs hors-ligne`, `Dashboard et badges`, `Parcours E2E`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `gameContent` connect `Validation du contenu` to `État score et fins`, `Archives et paramètres`, `Layout et PWA`, `Écrans de campagne`, `Orchestration du jeu`, `Présentation et bilan`, `Dashboard et badges`, `Simulateur d’équilibrage`, `Registre de contenu`, `Parcours E2E`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `createGame()` connect `Calendrier et effets` to `État score et fins`, `Archives et paramètres`, `Orchestration du jeu`, `Simulateur d’équilibrage`, `Validation du contenu`, `Parcours E2E`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `semi`, `singleQuote`, `tabWidth` to the rest of the system?**
  _241 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Calendrier et effets` be split into smaller, more focused modules?**
  _Cohesion score 0.06657515442690459 - nodes in this community are weakly interconnected._
- **Should `État score et fins` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Sélection des événements` be split into smaller, more focused modules?**
  _Cohesion score 0.07058823529411765 - nodes in this community are weakly interconnected._

> Limite de coût : le connecteur d’agents n’a pas exposé les compteurs de tokens des quatre fragments sémantiques; la valeur 0 signifie « non disponible ».
