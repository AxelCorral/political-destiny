import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "@/game/engine";
import type { GameState } from "@/game/types";

import {
  archiveCompletedGame,
  deleteAllLocalData,
  exportLocalData,
  getCompletedRun,
  getLocalProfile,
  importLocalData,
  listCompletedRuns,
  loadActiveGame,
  migrateGameState,
  saveActiveGame,
} from "../game-database";

function newState(seed = "storage-test") {
  return createGame(
    {
      seed,
      mode: "existing_party",
      partyId: "ps",
      methodId: "field_first",
    },
    gameContent,
  );
}

function finishState(seed: string) {
  let state = newState(seed);
  for (let guard = 0; state.phase !== "finished" && guard < 60; guard += 1) {
    const event = currentEvent(state, gameContent.events);
    state = resolveCurrentChoice(state, event.choices[0]!.id, gameContent).state;
  }
  if (!state.finalResult) throw new Error("Fixture de partie non terminée.");
  return state;
}

describe.sequential("stockage local", () => {
  beforeEach(async () => {
    await deleteAllLocalData();
  });

  it("sauvegarde et recharge une partie active sans modifier son état", async () => {
    const state = newState();
    await saveActiveGame(state);

    const loaded = await loadActiveGame();

    expect(loaded.warning).toBeUndefined();
    expect(loaded.state).toEqual(state);
    expect(loaded.state).not.toBe(state);
  });

  it("archive une partie terminée et consolide le profil local", async () => {
    const state = finishState("storage-finished");
    const summary = await archiveCompletedGame(state);
    const profile = await getLocalProfile();

    expect(summary.score).toBe(state.finalResult?.score);
    expect(await getCompletedRun(state.runId)).toEqual(summary);
    expect(await listCompletedRuns()).toHaveLength(1);
    expect((await loadActiveGame()).state?.phase).toBe("finished");
    expect(profile.completedRuns).toBe(1);
    expect(profile.playedPartyIds).toContain("ps");
    expect(profile.unlockedAchievementIds).toEqual(
      expect.arrayContaining(state.finalResult?.unlockedAchievementIds ?? []),
    );
  });

  it("exporte puis réimporte une sauvegarde et ses archives", async () => {
    const active = newState("storage-export-active");
    const completed = finishState("storage-export-complete");
    await saveActiveGame(active);
    await archiveCompletedGame(completed);
    await saveActiveGame(active);
    const exported = await exportLocalData();

    await deleteAllLocalData();
    await importLocalData(exported);

    expect((await loadActiveGame()).state?.seed).toBe("storage-export-active");
    expect((await listCompletedRuns()).map((run) => run.id)).toContain(completed.runId);
  });

  it("refuse un fichier qui ne correspond pas au format public", async () => {
    await expect(importLocalData({ format: "autre-produit", archives: [] })).rejects.toThrow(
      "n’est pas un export",
    );
  });

  it("migre une sauvegarde V1 vers les structures relationnelles V2", () => {
    const legacy = structuredClone(newState("migration-v1")) as GameState & Record<string, unknown>;
    legacy.version = 1;
    for (const key of [
      "runInstanceId",
      "scheduledEvents",
      "eventAppearanceCounts",
      "policyPositions",
      "actorMemories",
      "partyRelations",
      "narrativeThreads",
      "opponentActions",
    ]) {
      delete legacy[key];
    }

    const migrated = migrateGameState(legacy);

    expect(migrated.version).toBe(2);
    expect(migrated.runInstanceId).toMatch(/^legacy-/u);
    expect(migrated.scheduledEvents).toEqual([]);
    expect(migrated.policyPositions).toEqual({});
    expect(migrated.partyRelations.ps?.ps).toBe(100);
  });
});
