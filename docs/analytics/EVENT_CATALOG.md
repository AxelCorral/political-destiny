# Catalogue d'événements — Analytics

Source de vérité du code : `src/analytics/events.ts` (schémas Zod). Ce document explique
_quand_ chaque événement est émis et _pourquoi_ ; les types de champs exacts sont dans le code,
pas dupliqués ici en détail pour éviter toute dérive entre ce fichier et le schéma réel.

Émetteur : `src/features/campaign/game-app.tsx` (un seul point d'intégration, observant les
transitions de `GameState` — voir `docs/analytics/ARCHITECTURE_PLAN.md` §2), plus
`src/components/analytics-provider.tsx` pour `session_started`, plus
`src/features/meta/settings-page.tsx` pour `consent_updated`.

Aucun événement n'est envoyé avant consentement explicite (`docs/analytics/PRIVACY.md`) ni si
`NEXT_PUBLIC_ANALYTICS_MODE=off`.

## Principe volontairement absent : pas de `game_abandoned`

Il n'existe pas d'événement déclaré côté client à la fermeture de l'onglet. Le statut d'une
campagne (`ongoing` / `completed` / `stale_incomplete`) est **dérivé côté serveur**, au moment de
la lecture, à partir de `last_event_at` et du seuil `ANALYTICS_STALE_RUN_HOURS` — jamais déclaré
par le client. Reprendre une campagne après une longue pause émet simplement `run_resumed`, ce qui
fait immédiatement redevenir son statut `ongoing` au prochain événement. Voir
`analytics_run_status` dans `supabase/migrations/0002_analytics_views.sql`.

## Liste des événements

| Événement             | Émis quand                                                                                                                                                                                                                                                                     | Traçabilité des champs                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_started`     | Une fois par montage de l'application (`AnalyticsProvider`), pas par changement de route.                                                                                                                                                                                      | `entryPath` = chemin courant (`usePathname()`).                                                                                                                                                                                    |
| `setup_step_viewed`   | Première fois que l'un des 5 écrans de configuration (`mode`, `party_list`, `party_detail`, `custom_party`, `method`) est affiché depuis le montage de l'application — dédupliqué par écran, pas par visite individuelle (signal grossier de funnel, pas un journal de clics). | `screen` ∈ `GameScreen` (`gameStore.ts`).                                                                                                                                                                                          |
| `consent_updated`     | Quand le joueur clique « Activer » ou « Garder désactivées » dans Paramètres.                                                                                                                                                                                                  | `state` = `granted` ou `denied`. Un refus n'a rien à envoyer par construction (la file est vidée avant tout envoi possible) — seul un octroi peut réellement partir.                                                               |
| `run_started`         | Une nouvelle campagne est créée (`GameState.decisionIndex === 0 && decisionHistory.length === 0` à la première apparition d'un `runId`).                                                                                                                                       | `mode`, `partyId`, `methodId`, `candidateProfileId`, `seed` — tous des champs réels de `GameState`/`SetupState` (`src/game/types/index.ts`, `src/features/campaign/gameStore.ts`).                                                 |
| `run_resumed`         | Un `runId` déjà avancé (au moins une décision) réapparaît (rechargement d'une sauvegarde).                                                                                                                                                                                     | `decisionIndex`, `phase` au moment de la reprise.                                                                                                                                                                                  |
| `decision_resolved`   | Chaque nouvelle entrée apparue dans `GameState.decisionHistory`.                                                                                                                                                                                                               | Champs directement recopiés de `DecisionRecord` (`eventId`, `eventCategory`, `choiceId`, `choiceTag`, `choiceStrategy`, `outcomeId`, `internalRoll`) — jamais `narrative`, jamais `visibleEffects` (texte/contenu narratif exclu). |
| `race_snapshot`       | Chaque nouvelle entrée apparue dans `GameState.pollHistory`.                                                                                                                                                                                                                   | `decisionIndex`, `playerRank`, `playerTrend` (`PollSnapshot`), `resultsCount` = nombre de partis dans le sondage — jamais le détail nominatif des résultats des autres partis.                                                     |
| `first_round_result`  | Première apparition de `GameState.firstRoundResult`.                                                                                                                                                                                                                           | `playerRank` (dérivé de `ranking`), `qualified` (`flags.playerQualified`), `turnout`.                                                                                                                                              |
| `second_round_result` | Première apparition de `GameState.secondRoundResult`.                                                                                                                                                                                                                          | `playerRank`, `won` (dérivé de `ranking[0] === playerPartyId`, pas de `finalResult.won` qui peut ne pas encore exister à cet instant — voir commentaire dans `game-app.tsx`), `turnout`.                                           |
| `milestone_reached`   | `qualified_first_round` / `eliminated_first_round` (avec `first_round_result`), `entered_second_round` (avec `second_round_result`), `entered_government` (entrée en phase `government_epilogue`), `game_finished` (avec `run_completed`).                                     | `milestone` uniquement, valeur fermée (voir `analyticsPayloadSchemas.milestone_reached` dans `events.ts`).                                                                                                                         |
| `run_completed`       | Première apparition de `GameState.finalResult`.                                                                                                                                                                                                                                | `score`, `won`, `qualified`, `endingId`, `progressionNormalized`, `decisionsCount` — tous issus de `FinalResult`.                                                                                                                  |

## Enveloppe commune (tous événements)

`eventUuid`, `eventType`, `anonymousUserId`, `sessionId`, `runId?`, `clientSequence`,
`occurredAt`, `payload`, `versions` (`appVersion`/`engineVersion`/`contentVersion`/
`analyticsSchemaVersion`/`buildSha`), `experimentId?`, `variantId?` (groundwork A/B, voir
`docs/analytics/EXPERIMENTATION.md`). Détail champ par champ : `docs/analytics/DATA_DICTIONARY.md`.
