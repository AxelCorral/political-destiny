import { GAME_CONFIG } from "@/config/game";
import type {
  ActorState,
  ChoiceResolution,
  GameContent,
  GameEventDefinition,
  GameState,
  NewGameOptions,
  PartyDefinition,
  PartyState,
  VisibleEffect,
} from "@/game/types";

import { evaluateAchievements } from "./achievements";
import { advanceCampaignDate, dateAtDaysBefore } from "./calendar";
import { profilesForParty, resolveCandidateProfile } from "./candidateProfiles";
import { applyDueEffects, applyEffects, scheduleEffects } from "./effectProcessor";
import { simulateFirstRound, simulateSecondRound } from "./election";
import { initializeElectorate, recalculateElectorate } from "./electorate";
import { selectNextEvent } from "./eventSelector";
import { clamp, ideologyDistance } from "./math";
import { evolveMembership } from "./membership";
import {
  recordNarrativeProgress,
  releaseDueScheduledEvents,
  scheduleEventFollowUps,
} from "./narrativeThreads";
import { simulateOpponentTurn } from "./opponentSimulation";
import { resolveWeightedOutcome } from "./outcomeResolver";
import { generatePoll } from "./polls";
import { createRngState, deriveStableId, hashSeed } from "./rng";
import { scoreGame } from "./scoring";
import { recordStatement } from "./statements";

function partyStateFromDefinition(definition: PartyDefinition): PartyState {
  return {
    id: definition.id,
    displayName: definition.displayName,
    shortName: definition.shortName,
    visual: structuredClone(definition.visual),
    ideology: structuredClone(definition.ideology),
    perceivedIdeology: structuredClone(definition.ideology),
    ...(definition.ideologyFamily ? { ideologyFamily: definition.ideologyFamily } : {}),
    stats: {
      polling: definition.baseline.baseSupport,
      popularity: definition.baseline.popularity,
      mobilization: definition.baseline.mobilization,
      finances: definition.baseline.finances,
      credibility: definition.baseline.governingCredibility,
      cohesion: definition.baseline.cohesion,
      members: definition.baseline.members,
      mediaPresence: definition.baseline.mediaPresence,
      awareness: definition.baseline.awareness,
      rejection: definition.baseline.rejection,
      momentum: definition.baseline.momentum,
      localStrength: definition.baseline.localStrength,
      electedSupport: definition.baseline.electedSupport,
    },
    hidden: {
      baseSupport: definition.baseline.baseSupport,
      potentialSupport: definition.baseline.potentialSupport,
      transferability:
        definition.baseline.transferability ?? clamp(72 - definition.baseline.rejection * 0.45),
      scandalRisk: clamp(34 + (100 - definition.baseline.cohesion) * 0.2),
      cadreLoyalty: definition.baseline.cohesion,
      rivalAmbition: clamp(100 - definition.baseline.cohesion + 20),
      economicCompetence: definition.baseline.governingCredibility,
      securityCompetence: clamp(definition.baseline.governingCredibility - 3),
      socialCompetence: clamp(definition.baseline.popularity + 5),
      fatigue: 5,
      consistency: 72,
    },
    candidateId: `${definition.id}-candidate`,
    active: true,
    alliedWith: [],
    program: [...definition.program],
    naturalAllies: [...(definition.campaignProfile?.naturalAllies ?? [])],
    directCompetitors: [...(definition.campaignProfile?.directCompetitors ?? [])],
    electorateAffinity: structuredClone(definition.electorateAffinity),
    regionalAffinity: structuredClone(definition.regionalAffinity),
    initialPolling: definition.baseline.baseSupport,
  };
}

function defaultActorForParty(definition: PartyDefinition): ActorState {
  return {
    id: `${definition.id}-candidate`,
    identityKind: "fictional",
    displayName: `Camille ${definition.shortName}`,
    partyId: definition.id,
    role: "candidate",
    ideology: structuredClone(definition.ideology),
    traits: {
      charisma: 55,
      mediaSkill: 55,
      competence: definition.baseline.governingCredibility,
      tactics: 55,
      integrity: 65,
      endurance: 60,
      authority: 55,
      empathy: 58,
      discipline: 58,
      coalitionSkill: 52,
    },
    legitimacy: 68,
    ambition: 72,
    loyalty: 70,
    mediaSkill: 55,
    governingCredibility: definition.baseline.governingCredibility,
    scandalRisk: 24,
    active: true,
    candidateStatus: "official",
    strategy: definition.strategicArchetypes[0] ?? "consolidate_base",
    memory: { successfulActions: [], failedActions: [], rivalries: [], promises: [] },
  };
}

function addDays(date: string, days: number): string {
  const timestamp = new Date(`${date}T12:00:00Z`).getTime() + days * 86_400_000;
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function createGame(options: NewGameOptions, content: GameContent): GameState {
  const definitions = options.customParty
    ? [
        ...content.parties.filter((party) => party.id !== options.customParty?.id),
        options.customParty,
      ]
    : content.parties;
  const selectedDefinition = definitions.find((party) => party.id === options.partyId);
  const method = content.methods.find((candidate) => candidate.id === options.methodId);
  if (!selectedDefinition) throw new Error(`Parti inconnu « ${options.partyId} ».`);
  if (!method) throw new Error(`Méthode de campagne inconnue « ${options.methodId} ».`);
  const seed = options.seed.trim() || `campagne-${selectedDefinition.id}`;

  const parties = Object.fromEntries(
    definitions.map((definition) => [definition.id, partyStateFromDefinition(definition)]),
  );
  const actors = Object.fromEntries(
    content.actors.map((actor) => [actor.id, structuredClone(actor)]),
  );
  for (const definition of definitions) {
    const matchingCandidate = Object.values(actors).find(
      (actor) => actor.partyId === definition.id && actor.role === "candidate",
    );
    const candidate = matchingCandidate ?? defaultActorForParty(definition);
    actors[candidate.id] = candidate;
    const party = parties[definition.id];
    if (party) party.candidateId = candidate.id;
  }

  /**
   * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §6-10 :
   * pour les partis dont plusieurs `CandidateProfile` existent (incertitude de
   * candidature réellement documentée), résout le profil retenu — choix
   * explicite du joueur pour son propre parti, sinon tirage déterministe par
   * graine pondéré par la probabilité réelle documentée — et applique son
   * effet sur la base électorale du parti avant tout calcul de sondage. Les
   * partis sans profil multiple (sept sur neuf) ne sont pas concernés :
   * comportement inchangé par rapport à avant cette mission.
   */
  const resolvedCandidateProfiles: Record<string, string> = {};
  for (const definition of definitions) {
    const profiles = profilesForParty(content, definition.id);
    if (profiles.length === 0) continue;
    const resolved = resolveCandidateProfile(
      content,
      definition.id,
      seed,
      options.partyId,
      options.candidateProfileId,
    );
    if (!resolved) continue;
    resolvedCandidateProfiles[definition.id] = resolved.id;
    const party = parties[definition.id];
    const resolvedActor = actors[resolved.actorId];
    if (!party || !resolvedActor) continue;
    if (party.candidateId !== resolvedActor.id) {
      const former = actors[party.candidateId];
      if (former && former.candidateStatus === "official") former.candidateStatus = "potential";
    }
    resolvedActor.candidateStatus = "official";
    resolvedActor.role = "candidate";
    party.candidateId = resolvedActor.id;
    const modifier = resolved.baselineModifier;
    party.hidden.baseSupport = clamp(party.hidden.baseSupport + modifier.baseSupportDelta);
    party.stats.polling = clamp(party.stats.polling + modifier.baseSupportDelta);
    party.initialPolling = clamp(party.initialPolling + modifier.baseSupportDelta);
    if (modifier.rejectionDelta)
      party.stats.rejection = clamp(party.stats.rejection + modifier.rejectionDelta);
    if (modifier.mobilizationDelta)
      party.stats.mobilization = clamp(party.stats.mobilization + modifier.mobilizationDelta);
    if (modifier.transferabilityDelta)
      party.hidden.transferability = clamp(
        party.hidden.transferability + modifier.transferabilityDelta,
      );
    if (modifier.cohesionDelta)
      party.stats.cohesion = clamp(party.stats.cohesion + modifier.cohesionDelta);
    if (modifier.credibilityDelta)
      party.stats.credibility = clamp(party.stats.credibility + modifier.credibilityDelta);
  }

  /**
   * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §5/§28 :
   * « petite incertitude au départ, pas de loterie structurelle » — un jitter
   * nettement plus petit que la variation observée sur le score de sondage
   * affiché du joueur (`generatePoll`, ±3,8 pts de bruit d'affichage, un
   * mécanisme distinct qui reste inchangé). Ce jitter-ci porte sur la réalité
   * électorale sous-jacente de TOUS les partis (pas seulement celui du
   * joueur), déterministe par graine, borné à ±6 % relatif — cf.
   * `REALITY_GROUNDING_BASELINE.md` §5 pour le diagnostic ayant motivé ce
   * choix de magnitude (l'exemple qualitatif du prompt, 15 → 14,2/15,4/16,0,
   * correspond à un écart relatif de 6-7 %).
   */
  for (const definition of definitions) {
    const party = parties[definition.id];
    if (!party) continue;
    const roll = (hashSeed(`${seed}:initial-jitter:${definition.id}`) % 2000) / 1000 - 1; // [-1, 1)
    const relativeJitter = roll * 0.06;
    const jittered = clamp(party.hidden.baseSupport * (1 + relativeJitter), 0.1, 100);
    const delta = jittered - party.hidden.baseSupport;
    party.hidden.baseSupport = jittered;
    party.stats.polling = clamp(party.stats.polling + delta);
    party.initialPolling = clamp(party.initialPolling + delta);
  }

  const selectedParty = parties[options.partyId];
  const selectedActor = selectedParty ? actors[selectedParty.candidateId] : undefined;
  if (!selectedParty || !selectedActor)
    throw new Error("Le candidat joueur n’a pas pu être initialisé.");
  if (options.candidateName?.trim())
    selectedActor.displayName = options.candidateName.trim().slice(0, 60);

  const electionDate = options.electionDate ?? GAME_CONFIG.electionDate;
  const runInstanceId =
    options.runInstanceId?.trim() ||
    deriveStableId(
      `${GAME_CONFIG.schemaVersion}:${options.mode}:${selectedDefinition.id}:${method.id}:${seed}`,
      "instance",
    );
  const partyRelations = Object.fromEntries(
    Object.keys(parties).map((partyId) => [
      partyId,
      Object.fromEntries(
        Object.keys(parties).map((otherPartyId) => [
          otherPartyId,
          partyId === otherPartyId
            ? 100
            : clamp(
                34 -
                  ideologyDistance(
                    parties[partyId]!.perceivedIdeology,
                    parties[otherPartyId]!.perceivedIdeology,
                  ) *
                    0.55,
                -40,
                35,
              ),
        ]),
      ),
    ]),
  );
  let state: GameState = {
    version: GAME_CONFIG.schemaVersion,
    runId: deriveStableId(
      `${GAME_CONFIG.schemaVersion}:${seed}:${selectedDefinition.id}:${runInstanceId}`,
      "run",
    ),
    runInstanceId,
    seed,
    rng: createRngState(seed),
    mode: options.mode,
    phase: "pre_campaign",
    currentDate: dateAtDaysBefore(electionDate, 365),
    electionDate,
    decisionIndex: 0,
    maxTargetDecisions:
      GAME_CONFIG.targetDecisionsBeforeFirstRound +
      GAME_CONFIG.targetDecisionsBetweenRounds +
      GAME_CONFIG.targetGovernmentDecisions,
    player: {
      id: selectedActor.id,
      displayName: selectedActor.displayName,
      identityKind: "fictional",
      archetype: method.title,
      traits: structuredClone(selectedActor.traits),
    },
    playerPartyId: selectedDefinition.id,
    parties,
    actors,
    electorate: initializeElectorate(parties, content.electorateBlocs),
    // Calibré sur docs/POLITICAL_BASELINE_2026-04.md §10 (choc énergétique lié
    // au conflit Iran/détroit d'Ormuz de fin février 2026, inflation à 1,7 %
    // en mars 2026, défiance politique historiquement basse mesurée par le
    // CEVIPOF en janvier 2026) — ajustement modeste depuis les valeurs neutres
    // précédentes, pas une réplique exacte d'un indice réel.
    world: {
      economicClimate: 43,
      socialTension: 50,
      securityConcern: 52,
      climateConcern: 54,
      incumbentFatigue: 63,
      turnoutMood: 50,
      dominantTheme: "economy",
    },
    pollHistory: [],
    decisionHistory: [],
    publicNews: [],
    scheduledEffects: [],
    scheduledEvents: [],
    eventCooldowns: {},
    eventAppearanceCounts: {},
    seenEventIds: [],
    queuedEventIds: [],
    categoryCounts: {},
    recentCategories: [],
    flags: {
      [`method:${method.id}`]: true,
      ...Object.fromEntries(selectedDefinition.uniqueEventTags.map((tag) => [`tag:${tag}`, true])),
      initialMembers: selectedParty.stats.members,
      initialPopularity: selectedParty.stats.popularity,
      initialLocalStrength: selectedParty.stats.localStrength,
      initialCredibility: selectedParty.stats.credibility,
      ...Object.fromEntries(
        Object.entries(resolvedCandidateProfiles).map(([partyId, profileId]) => [
          `candidateProfile:${partyId}`,
          profileId,
        ]),
      ),
    },
    statementLedger: [],
    policyPositions: {},
    actorMemories: Object.values(actors).flatMap((actor) =>
      structuredClone(actor.memory.entries ?? []),
    ),
    partyRelations,
    narrativeThreads: {},
    opponentActions: [],
    achievementsUnlocked: [],
  };

  /**
   * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §29
   * (Phase C) : « historique ; événements de désignation » — trace la
   * résolution d'un profil de candidature non par défaut comme un événement
   * réel dans `opponentActions`, pour que la désignation soit visible dans le
   * même flux narratif que les autres recompositions (retrait, alliance).
   */
  for (const [partyId, profileId] of Object.entries(resolvedCandidateProfiles)) {
    const profile = content.candidateProfiles?.find((candidate) => candidate.id === profileId);
    if (!profile || profile.isDefault) continue;
    const party = state.parties[partyId];
    const resolvedActor = state.actors[profile.actorId];
    if (!party || !resolvedActor) continue;
    state.opponentActions.push({
      decisionIndex: 0,
      date: state.currentDate,
      actorId: resolvedActor.id,
      partyId,
      kind: "primary",
      summary: `${party.shortName} : ${resolvedActor.displayName} s’impose comme candidature au terme d’un processus de désignation interne.`,
    });
  }

  const methodApplied = applyEffects(state, method.effects);
  state = methodApplied.state;
  for (const [trait, delta] of Object.entries(method.traitEffects)) {
    const key = trait as keyof typeof state.player.traits;
    state.player.traits[key] = clamp(state.player.traits[key] + (delta ?? 0));
  }
  state = recalculateElectorate(state, content.electorateBlocs);
  state = generatePoll(state, content.electorateBlocs).state;
  return prepareNextEvent(state, content.events);
}

export function prepareNextEvent(state: GameState, events: GameEventDefinition[]): GameState {
  if (
    state.phase === "finished" ||
    state.phase === "first_round" ||
    state.phase === "second_round"
  ) {
    return { ...state, currentEventId: undefined };
  }
  const released = releaseDueScheduledEvents(state);
  const selected = selectNextEvent(released, events);
  return { ...selected.state, currentEventId: selected.event.id };
}

export function currentEvent(state: GameState, events: GameEventDefinition[]): GameEventDefinition {
  const event = events.find((candidate) => candidate.id === state.currentEventId);
  if (!event) throw new Error("Aucun événement courant n’est disponible.");
  return event;
}

function finishGame(state: GameState, content: GameContent): GameState {
  let finalState = structuredClone(state);
  if (!finalState.firstRoundResult) {
    const firstRound = simulateFirstRound(finalState, content.electorateBlocs);
    finalState = firstRound.state;
  }
  finalState.phase = "finished";
  finalState.currentEventId = undefined;
  const finalResult = scoreGame(finalState, content.achievements, content.endings);
  finalState.finalResult = finalResult;
  finalState.endingId = finalResult.endingId;
  finalState.achievementsUnlocked = finalResult.unlockedAchievementIds;
  return finalState;
}

function advanceElectionFlow(state: GameState, content: GameContent): GameState {
  let next = state;
  if (
    ["pre_campaign", "campaign", "official_campaign"].includes(next.phase) &&
    next.decisionIndex >= GAME_CONFIG.targetDecisionsBeforeFirstRound
  ) {
    const firstRound = simulateFirstRound(next, content.electorateBlocs);
    next = firstRound.state;
    next.currentDate = next.electionDate;
    next.phase = "between_rounds";
    next.flags.firstRoundDecisionIndex = next.decisionIndex;
    next.flags.playerQualified = firstRound.finalists.includes(next.playerPartyId);
    if (!firstRound.finalists.includes(next.playerPartyId)) next.flags.eliminated = true;
    return next;
  }

  if (next.phase === "between_rounds") {
    const start = Number(next.flags.firstRoundDecisionIndex ?? next.decisionIndex);
    const decisionsSinceFirstRound = next.decisionIndex - start;
    if (next.flags.eliminated === true && decisionsSinceFirstRound >= 1)
      return finishGame(next, content);
    if (
      next.flags.playerQualified === true &&
      decisionsSinceFirstRound >= GAME_CONFIG.targetDecisionsBetweenRounds
    ) {
      const secondRound = simulateSecondRound(next, content.electorateBlocs);
      next = secondRound.state;
      next.currentDate = addDays(next.electionDate, 14);
      next.flags.secondRoundDecisionIndex = next.decisionIndex;
      if (secondRound.winnerPartyId === next.playerPartyId) {
        next.phase = "government_epilogue";
        next.flags.playerWon = true;
      } else {
        return finishGame(next, content);
      }
    }
    return next;
  }

  if (next.phase === "government_epilogue") {
    const start = Number(next.flags.secondRoundDecisionIndex ?? next.decisionIndex);
    if (next.decisionIndex - start >= GAME_CONFIG.targetGovernmentDecisions)
      return finishGame(next, content);
  }
  return next;
}

function effectRecord(immediate: VisibleEffect[], delayed: VisibleEffect[]): VisibleEffect[] {
  const combined = [...immediate, ...delayed];
  return combined.slice(0, 5);
}

export function resolveCurrentChoice(
  sourceState: GameState,
  choiceId: string,
  content: GameContent,
): ChoiceResolution {
  const event = currentEvent(sourceState, content.events);
  const resolved = resolveWeightedOutcome(sourceState, event, choiceId);
  let state = resolved.state;
  const applied = applyEffects(state, resolved.outcome.effects);
  state = applied.state;

  if (resolved.outcome.setFlags) state.flags = { ...state.flags, ...resolved.outcome.setFlags };
  if (resolved.outcome.enqueueEventIds) {
    state.queuedEventIds = [...state.queuedEventIds, ...resolved.outcome.enqueueEventIds];
  }
  if (resolved.outcome.delayedEffects?.length) {
    state = scheduleEffects(state, event.id, resolved.outcome.delayedEffects);
  }
  if (resolved.outcome.followUps?.length) {
    state = scheduleEventFollowUps(state, event.id, resolved.outcome.followUps);
  }
  if (resolved.outcome.endingTrigger) {
    state.endingId = resolved.outcome.endingTrigger;
    state.flags[`ending:${resolved.outcome.endingTrigger}`] = true;
  }
  const statementResolution = resolved.choice.statement
    ? recordStatement(
        state,
        event.id,
        resolved.choice.statement,
        state.decisionIndex + 1,
        content.electorateBlocs,
      )
    : undefined;
  if (statementResolution) state = statementResolution.state;

  state.decisionIndex += 1;
  state.seenEventIds.push(event.id);
  state.eventAppearanceCounts[event.id] = (state.eventAppearanceCounts[event.id] ?? 0) + 1;
  state.eventCooldowns[event.id] = state.decisionIndex + event.cooldown;
  state.categoryCounts[event.category] = (state.categoryCounts[event.category] ?? 0) + 1;
  state.recentCategories = [...state.recentCategories, event.category].slice(-4);
  state.currentEventId = undefined;

  const due = applyDueEffects(state);
  state = due.state;
  state = evolveMembership(state, resolved.outcome.effects);
  state = simulateOpponentTurn(state, content.electorateBlocs);
  state = recalculateElectorate(
    state,
    content.electorateBlocs,
    state.phase === "official_campaign" || state.phase === "between_rounds",
  );

  const record = {
    decisionIndex: state.decisionIndex,
    date: state.currentDate,
    eventId: event.id,
    eventTitle: event.title,
    eventCategory: event.category,
    choiceId: resolved.choice.id,
    choiceLabel: resolved.choice.label,
    ...(resolved.choice.visibleTag ? { choiceTag: resolved.choice.visibleTag } : {}),
    ...(resolved.choice.strategy ? { choiceStrategy: resolved.choice.strategy } : {}),
    outcomeId: resolved.outcome.id,
    outcomeTitle: resolved.outcome.title,
    narrative: [resolved.outcome.publicNarrative, ...due.narratives].join(" "),
    visibleEffects: effectRecord(
      [...applied.visibleEffects, ...(statementResolution?.visibleEffects ?? [])],
      due.visibleEffects,
    ),
    ...(resolved.decisiveFactors.length ? { decisiveFactors: resolved.decisiveFactors } : {}),
    ...(statementResolution?.record.evolution
      ? { statementEvolution: statementResolution.record.evolution }
      : {}),
    internalRoll: resolved.roll,
    internalProbabilities: Object.fromEntries(
      resolved.choice.outcomeGroups.map((outcome, index) => [
        outcome.id,
        resolved.probabilities[index] ?? 0,
      ]),
    ),
  } as const;
  state.decisionHistory.push(record);
  state = recordNarrativeProgress(state, event, content.events);

  if (state.decisionIndex % 4 === 0) state = generatePoll(state, content.electorateBlocs).state;

  if (["pre_campaign", "campaign", "official_campaign"].includes(state.phase)) {
    const remaining = GAME_CONFIG.targetDecisionsBeforeFirstRound - state.decisionIndex;
    const advanced = advanceCampaignDate(
      state.currentDate,
      state.electionDate,
      remaining,
      state.rng,
    );
    state.currentDate = advanced.date;
    state.phase = advanced.phase;
    state.rng = advanced.rng;
  } else if (state.phase === "between_rounds") {
    state.currentDate = addDays(state.currentDate, 2);
  } else if (state.phase === "government_epilogue") {
    state.currentDate = addDays(state.currentDate, 1);
  }

  state = advanceElectionFlow(state, content);
  state.achievementsUnlocked = evaluateAchievements(state, content.achievements, state.finalResult);
  if (state.phase !== "finished") state = prepareNextEvent(state, content.events);
  return { state, record, outcome: resolved.outcome };
}
