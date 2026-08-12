"use client";

import { create } from "zustand";

import { track } from "@/analytics/client";
import { gameContent } from "@/game/data";
import { createGame, resolveCurrentChoice } from "@/game/engine";
import { hashSeed } from "@/game/engine/rng";
import type {
  DecisionRecord,
  GameMode,
  GameState,
  PartyDefinition,
  WeightedOutcome,
} from "@/game/types";

export type GameScreen =
  | "mode"
  | "party_list"
  | "party_detail"
  | "custom_party"
  | "method"
  | "intro"
  | "campaign"
  | "outcome"
  | "race"
  | "first_round"
  | "runoff_intro"
  | "second_round"
  | "final";

interface SetupState {
  mode?: GameMode;
  selectedPartyId?: string;
  selectedMethodId?: string;
  customParty?: PartyDefinition;
  candidateName?: string;
  seed?: string;
  /**
   * §9 du prompt de mission (option A) — profil de candidature choisi par le
   * joueur quand le parti sélectionné en porte plusieurs (RN, PS). Réinitialisé
   * à chaque nouvelle sélection de parti pour éviter qu'un choix résiduel
   * s'applique à un autre parti.
   */
  candidateProfileId?: string;
}

interface GameUiState {
  screen: GameScreen;
  setup: SetupState;
  partyDetailId?: string;
  selectedCandidateProfileId?: string;
  gameState?: GameState;
  lastRecord?: DecisionRecord;
  lastOutcome?: WeightedOutcome;
  pendingScreen?: Extract<GameScreen, "race" | "first_round" | "second_round" | "final">;
  newAchievementIds: string[];
  error?: string;
  goToScreen: (screen: GameScreen) => void;
  selectMode: (mode: GameMode) => void;
  openParty: (partyId: string) => void;
  chooseCandidateProfile: (candidateProfileId: string) => void;
  confirmParty: (partyId: string) => void;
  confirmCustomParty: (party: PartyDefinition) => void;
  chooseMethod: (methodId: string) => void;
  updateLaunchDetails: (details: { candidateName?: string; seed?: string }) => void;
  launchCampaign: () => void;
  beginCampaign: () => void;
  chooseEventOption: (choiceId: string) => void;
  continueAfterOutcome: () => void;
  continueAfterMilestone: () => void;
  continueFromRunoffIntro: () => void;
  showRace: () => void;
  closeRace: () => void;
  restoreGame: (state: GameState) => void;
  resetGame: () => void;
}

function freshSeed(): string {
  const values = new Uint32Array(2);
  if (globalThis.crypto) {
    globalThis.crypto.getRandomValues(values);
    return `campagne-${values[0]!.toString(36)}-${values[1]!.toString(36)}`;
  }
  return `campagne-${Date.now().toString(36)}`;
}

function freshRunInstanceId(): string {
  const values = new Uint32Array(3);
  if (globalThis.crypto) {
    globalThis.crypto.getRandomValues(values);
    return `local-${Array.from(values, (value) => value.toString(36)).join("-")}`;
  }
  return `local-${Date.now().toString(36)}`;
}

export const useGameStore = create<GameUiState>((set, get) => ({
  screen: "mode",
  setup: {},
  newAchievementIds: [],

  goToScreen: (screen) => set({ screen, error: undefined }),

  selectMode: (mode) => {
    set({
      setup: { mode },
      screen:
        mode === "existing_party"
          ? "party_list"
          : mode === "custom_party"
            ? "custom_party"
            : "method",
      partyDetailId: undefined,
      error: undefined,
    });
  },

  openParty: (partyId) =>
    set({ partyDetailId: partyId, selectedCandidateProfileId: undefined, screen: "party_detail" }),

  chooseCandidateProfile: (candidateProfileId) =>
    set({ selectedCandidateProfileId: candidateProfileId }),

  confirmParty: (partyId) =>
    set((state) => ({
      setup: {
        ...state.setup,
        mode: "existing_party",
        selectedPartyId: partyId,
        candidateProfileId: state.selectedCandidateProfileId,
      },
      screen: "method",
    })),

  confirmCustomParty: (party) =>
    set((state) => ({
      setup: {
        ...state.setup,
        mode: "custom_party",
        selectedPartyId: party.id,
        customParty: party,
      },
      screen: "method",
    })),

  chooseMethod: (methodId) =>
    set((state) => ({ setup: { ...state.setup, selectedMethodId: methodId } })),

  updateLaunchDetails: (details) => set((state) => ({ setup: { ...state.setup, ...details } })),

  launchCampaign: () => {
    const setup = get().setup;
    const seed = setup.seed?.trim() || freshSeed();
    let partyId = setup.selectedPartyId;
    let methodId = setup.selectedMethodId;
    if (setup.mode === "random") {
      const partyIndex = hashSeed(`${seed}:party`) % gameContent.parties.length;
      const methodIndex = hashSeed(`${seed}:method`) % gameContent.methods.length;
      partyId = gameContent.parties[partyIndex]?.id;
      methodId = gameContent.methods[methodIndex]?.id;
    }
    if (!setup.mode || !partyId || !methodId) {
      set({ error: "Choisissez un parti et une méthode de campagne avant de commencer." });
      return;
    }
    try {
      const state = createGame(
        {
          seed,
          mode: setup.mode,
          partyId,
          methodId,
          runInstanceId: freshRunInstanceId(),
          ...(setup.candidateName ? { candidateName: setup.candidateName } : {}),
          ...(setup.customParty ? { customParty: setup.customParty } : {}),
          ...(setup.candidateProfileId ? { candidateProfileId: setup.candidateProfileId } : {}),
        },
        gameContent,
      );
      set({
        gameState: state,
        setup: { ...setup, seed, selectedPartyId: partyId, selectedMethodId: methodId },
        screen: "intro",
        error: undefined,
        lastRecord: undefined,
        lastOutcome: undefined,
        pendingScreen: undefined,
        newAchievementIds: [],
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "La campagne n’a pas pu être créée." });
      track("game_error", undefined, {
        errorCode: "game_creation_failed",
        source: "launch_campaign",
        recoverable: true,
      });
    }
  },

  beginCampaign: () => set({ screen: "campaign" }),

  chooseEventOption: (choiceId) => {
    const before = get().gameState;
    if (!before) return;
    try {
      const resolution = resolveCurrentChoice(before, choiceId, gameContent);
      const after = resolution.state;
      // The multi-candidate "État de la course" bulletin only makes sense
      // before the first round is decided: a poll can still be generated
      // every few decisions during between_rounds/government_epilogue
      // (state.decisionIndex keeps incrementing across every phase), but by
      // then the race it describes is already over — showing it there
      // contradicted whatever milestone screen (qualification, runoff,
      // government) the player had just seen.
      const isBeforeFirstRound = ["pre_campaign", "campaign", "official_campaign"].includes(
        after.phase,
      );
      let pendingScreen: GameUiState["pendingScreen"];
      if (!before.firstRoundResult && after.firstRoundResult) pendingScreen = "first_round";
      else if (!before.secondRoundResult && after.secondRoundResult) pendingScreen = "second_round";
      else if (after.phase === "finished") pendingScreen = "final";
      else if (isBeforeFirstRound && after.pollHistory.length > before.pollHistory.length)
        pendingScreen = "race";
      const previousBadges = new Set(before.achievementsUnlocked);
      const newAchievementIds = after.achievementsUnlocked.filter((id) => !previousBadges.has(id));
      set({
        gameState: after,
        lastRecord: resolution.record,
        lastOutcome: resolution.outcome,
        pendingScreen,
        newAchievementIds,
        screen: "outcome",
        error: undefined,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Cette décision n’a pas pu être résolue.",
      });
      track("game_error", before.runId, {
        errorCode: "decision_resolution_failed",
        source: "choose_event_option",
        phase: before.phase,
        decisionIndex: before.decisionIndex,
        recoverable: true,
      });
    }
  },

  continueAfterOutcome: () => {
    const pending = get().pendingScreen;
    set({ screen: pending ?? "campaign", pendingScreen: undefined, newAchievementIds: [] });
  },

  continueAfterMilestone: () => {
    const { gameState: state, screen } = get();
    if (
      screen === "first_round" &&
      state?.flags.playerQualified === true &&
      state.phase !== "finished"
    ) {
      set({ screen: "runoff_intro" });
      return;
    }
    set({ screen: state?.phase === "finished" ? "final" : "campaign" });
  },

  continueFromRunoffIntro: () => set({ screen: "campaign" }),

  showRace: () => set({ screen: "race" }),
  closeRace: () => set({ screen: "campaign" }),

  restoreGame: (state) =>
    set({
      gameState: state,
      setup: { mode: state.mode, selectedPartyId: state.playerPartyId, seed: state.seed },
      screen: state.phase === "finished" ? "final" : "campaign",
      lastRecord: state.decisionHistory.at(-1),
      pendingScreen: undefined,
      error: undefined,
    }),

  resetGame: () =>
    set({
      screen: "mode",
      setup: {},
      partyDetailId: undefined,
      gameState: undefined,
      lastRecord: undefined,
      lastOutcome: undefined,
      pendingScreen: undefined,
      newAchievementIds: [],
      error: undefined,
    }),
}));
