import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import { GAME_CONFIG } from "@/config/game";
import { clamp, ideologyDistance } from "@/game/engine/math";
import { deriveStableId } from "@/game/engine/rng";
import type { CompletedRunSummary, GameMode, GameState } from "@/game/types";

const DATABASE_NAME = "vers-lelysee";
const DATABASE_VERSION = 1;
const ACTIVE_GAME_KEY = "current";
const META_KEY = "profile";

export interface LocalProfile {
  schemaVersion: number;
  completedRuns: number;
  victories: number;
  bestScore: number;
  unlockedAchievementIds: string[];
  playedPartyIds: string[];
  discoveredEndingIds: string[];
  lastPlayedAt?: string;
}

export type AnalyticsConsentState = "unset" | "granted" | "denied";

export interface LocalSettings {
  reducedMotion: boolean;
  soundEnabled: boolean;
  fictionNoticeSeen: boolean;
  /**
   * Player consent for the anonymous analytics layer (docs/analytics/PRIVACY.md).
   * Absent from saves created before this field existed — getLocalSettings
   * merges it in as "unset" so older browsers default to no telemetry sent.
   */
  analyticsConsent: AnalyticsConsentState;
}

/**
 * Machine-readable discriminant for `warning` below, so callers (the
 * game_error analytics event — src/features/campaign/game-app.tsx) never
 * have to parse a human-facing message string to know which of the two
 * real failure modes occurred.
 */
export type LoadGameWarningCode = "save_corrupted" | "save_version_incompatible";

export interface LoadGameResult {
  state?: GameState;
  warning?: string;
  warningCode?: LoadGameWarningCode;
  recoveryJson?: string;
}

export interface GameDataExport {
  format: "vers-lelysee-local-data";
  exportedAt: string;
  schemaVersion: number;
  activeGame?: GameState;
  archives: CompletedRunSummary[];
  profile: LocalProfile;
  settings: LocalSettings;
}

interface GameDatabase extends DBSchema {
  active: {
    key: string;
    value: GameState;
  };
  archives: {
    key: string;
    value: CompletedRunSummary;
    indexes: { "by-completed-at": string };
  };
  meta: {
    key: string;
    value: unknown;
  };
  settings: {
    key: string;
    value: LocalSettings;
  };
}

const DEFAULT_PROFILE: LocalProfile = {
  schemaVersion: GAME_CONFIG.schemaVersion,
  completedRuns: 0,
  victories: 0,
  bestScore: 0,
  unlockedAchievementIds: [],
  playedPartyIds: [],
  discoveredEndingIds: [],
};

const DEFAULT_SETTINGS: LocalSettings = {
  reducedMotion: false,
  soundEnabled: false,
  fictionNoticeSeen: false,
  analyticsConsent: "unset",
};

let databasePromise: Promise<IDBPDatabase<GameDatabase>> | undefined;

function database(): Promise<IDBPDatabase<GameDatabase>> {
  databasePromise ??= openDB<GameDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("active")) db.createObjectStore("active");
      if (!db.objectStoreNames.contains("archives")) {
        const archives = db.createObjectStore("archives", { keyPath: "id" });
        archives.createIndex("by-completed-at", "completedAt");
      }
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings");
    },
  });
  return databasePromise;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPartyVisual(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.primaryColor === "string" &&
    /^#[0-9a-f]{6}$/iu.test(value.primaryColor) &&
    typeof value.secondaryColor === "string" &&
    /^#[0-9a-f]{6}$/iu.test(value.secondaryColor) &&
    typeof value.monogram === "string" &&
    value.monogram.length <= 5 &&
    typeof value.symbol === "string" &&
    value.symbol.length <= 8
  );
}

export function isRecoverableGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  if (
    typeof value.version !== "number" ||
    typeof value.runId !== "string" ||
    typeof value.seed !== "string" ||
    typeof value.playerPartyId !== "string" ||
    typeof value.currentDate !== "string" ||
    typeof value.electionDate !== "string" ||
    !Number.isInteger(value.decisionIndex) ||
    !isRecord(value.rng) ||
    !isRecord(value.player) ||
    !isRecord(value.parties) ||
    !isRecord(value.actors) ||
    !Array.isArray(value.pollHistory) ||
    !Array.isArray(value.decisionHistory) ||
    !Array.isArray(value.publicNews)
  ) {
    return false;
  }
  const party = value.parties[value.playerPartyId];
  return (
    isRecord(party) &&
    isRecord(party.stats) &&
    isRecord(party.hidden) &&
    isPartyVisual(party.visual) &&
    Object.values(party.stats).every(isFiniteNumber)
  );
}

function initialPartyRelations(state: GameState): Record<string, Record<string, number>> {
  return Object.fromEntries(
    Object.values(state.parties).map((party) => [
      party.id,
      Object.fromEntries(
        Object.values(state.parties).map((other) => [
          other.id,
          party.id === other.id
            ? 100
            : party.alliedWith.includes(other.id)
              ? 45
              : clamp(
                  34 - ideologyDistance(party.perceivedIdeology, other.perceivedIdeology) * 0.55,
                  -40,
                  35,
                ),
        ]),
      ),
    ]),
  );
}

function appearanceCounts(eventIds: string[]): Record<string, number> {
  return eventIds.reduce<Record<string, number>>((counts, eventId) => {
    counts[eventId] = (counts[eventId] ?? 0) + 1;
    return counts;
  }, {});
}

export function migrateGameState(value: GameState): GameState {
  if (value.version > GAME_CONFIG.schemaVersion) {
    throw new Error("Cette sauvegarde provient d’une version plus récente du jeu.");
  }
  const migrated = structuredClone(value);
  if (migrated.version < 2) {
    const legacyRunId = migrated.runId;
    migrated.runInstanceId = `legacy-${legacyRunId}`;
    migrated.runId = deriveStableId(
      `2:${migrated.seed}:${migrated.playerPartyId}:${migrated.runInstanceId}`,
      "run",
    );
    migrated.scheduledEvents = [];
    migrated.eventAppearanceCounts = appearanceCounts(migrated.seenEventIds);
    migrated.policyPositions = {};
    migrated.actorMemories = Object.values(migrated.actors).flatMap((actor) =>
      structuredClone(actor.memory.entries ?? []),
    );
    migrated.partyRelations = initialPartyRelations(migrated);
    migrated.narrativeThreads = {};
    migrated.opponentActions = [];
    migrated.version = 2;
  }
  return { ...migrated, version: GAME_CONFIG.schemaVersion };
}

export async function saveActiveGame(state: GameState): Promise<void> {
  const db = await database();
  await db.put("active", structuredClone(state), ACTIVE_GAME_KEY);
}

export async function loadActiveGame(): Promise<LoadGameResult> {
  const db = await database();
  const raw = await db.get("active", ACTIVE_GAME_KEY);
  if (raw === undefined) return {};
  if (!isRecoverableGameState(raw)) {
    const recoveryJson = JSON.stringify(raw, null, 2);
    await db.put(
      "meta",
      { savedAt: new Date().toISOString(), recoveryJson },
      `corrupt-${Date.now()}`,
    );
    await db.delete("active", ACTIVE_GAME_KEY);
    return {
      warning:
        "La sauvegarde active était incomplète. Une copie de récupération locale a été conservée.",
      warningCode: "save_corrupted",
      recoveryJson,
    };
  }
  try {
    return { state: migrateGameState(raw) };
  } catch (error) {
    return {
      warning: error instanceof Error ? error.message : "Sauvegarde incompatible.",
      warningCode: "save_version_incompatible",
    };
  }
}

export async function hasActiveGame(): Promise<boolean> {
  const db = await database();
  return (await db.getKey("active", ACTIVE_GAME_KEY)) !== undefined;
}

export async function clearActiveGame(): Promise<void> {
  const db = await database();
  await db.delete("active", ACTIVE_GAME_KEY);
}

function summaryFromState(state: GameState): CompletedRunSummary {
  const result = state.finalResult;
  const party = state.parties[state.playerPartyId];
  if (!result || !party) throw new Error("La partie n’est pas terminée.");
  const bestDecision = result.bestDecisionIndex
    ? state.decisionHistory.find((decision) => decision.decisionIndex === result.bestDecisionIndex)
    : undefined;
  return {
    id: state.runId,
    version: state.version,
    completedAt: new Date().toISOString(),
    seed: state.seed,
    mode: state.mode,
    candidateName: state.player.displayName,
    partyId: party.id,
    partyName: party.displayName,
    partyShortName: party.shortName,
    partyVisual: structuredClone(party.visual),
    score: result.score,
    resultTitle: result.title,
    finalVoteShare: result.finalVoteShare,
    won: result.won,
    badges: [...result.unlockedAchievementIds],
    bestFeat: bestDecision?.outcomeTitle ?? result.title,
    finalResult: structuredClone(result),
    pollHistory: structuredClone(state.pollHistory),
    decisions: structuredClone(state.decisionHistory),
  };
}

export async function archiveCompletedGame(state: GameState): Promise<CompletedRunSummary> {
  const summary = summaryFromState(state);
  const db = await database();
  const transaction = db.transaction(["archives", "meta", "active"], "readwrite");
  const existing = await transaction.objectStore("archives").get(summary.id);
  await transaction.objectStore("archives").put(existing ?? summary);

  const profileStore = transaction.objectStore("meta");
  const storedProfile = await profileStore.get(META_KEY);
  const profile = isLocalProfile(storedProfile) ? storedProfile : structuredClone(DEFAULT_PROFILE);
  if (!existing) {
    profile.completedRuns += 1;
    if (summary.won) profile.victories += 1;
  }
  profile.bestScore = Math.max(profile.bestScore, summary.score);
  profile.unlockedAchievementIds = unique([...profile.unlockedAchievementIds, ...summary.badges]);
  profile.playedPartyIds = unique([...profile.playedPartyIds, summary.partyId]);
  profile.discoveredEndingIds = unique([
    ...profile.discoveredEndingIds,
    summary.finalResult.endingId,
  ]);
  profile.lastPlayedAt = summary.completedAt;
  await profileStore.put(profile, META_KEY);
  // Keep the finished state as the active record until the player explicitly
  // starts over, so a reload on the result screen can restore the full bilan.
  await transaction.objectStore("active").put(structuredClone(state), ACTIVE_GAME_KEY);
  await transaction.done;
  return existing ?? summary;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function isLocalProfile(value: unknown): value is LocalProfile {
  return (
    isRecord(value) &&
    typeof value.schemaVersion === "number" &&
    typeof value.completedRuns === "number" &&
    typeof value.victories === "number" &&
    typeof value.bestScore === "number" &&
    Array.isArray(value.unlockedAchievementIds) &&
    value.unlockedAchievementIds.every((item) => typeof item === "string") &&
    Array.isArray(value.playedPartyIds) &&
    value.playedPartyIds.every((item) => typeof item === "string") &&
    Array.isArray(value.discoveredEndingIds) &&
    value.discoveredEndingIds.every((item) => typeof item === "string")
  );
}

function isCompletedRun(value: unknown): value is CompletedRunSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.completedAt === "string" &&
    typeof value.seed === "string" &&
    typeof value.candidateName === "string" &&
    typeof value.partyId === "string" &&
    typeof value.partyName === "string" &&
    typeof value.partyShortName === "string" &&
    isPartyVisual(value.partyVisual) &&
    isFiniteNumber(value.score) &&
    isFiniteNumber(value.finalVoteShare) &&
    typeof value.won === "boolean" &&
    Array.isArray(value.badges) &&
    value.badges.every((item) => typeof item === "string") &&
    isRecord(value.finalResult) &&
    Array.isArray(value.pollHistory) &&
    Array.isArray(value.decisions)
  );
}

export async function listCompletedRuns(): Promise<CompletedRunSummary[]> {
  const db = await database();
  const values = await db.getAllFromIndex("archives", "by-completed-at");
  return values.sort((left, right) => right.completedAt.localeCompare(left.completedAt));
}

export async function getCompletedRun(id: string): Promise<CompletedRunSummary | undefined> {
  const db = await database();
  return db.get("archives", id);
}

export async function deleteCompletedRun(id: string): Promise<void> {
  const db = await database();
  await db.delete("archives", id);
}

export async function getLocalProfile(): Promise<LocalProfile> {
  const db = await database();
  const value = await db.get("meta", META_KEY);
  return isLocalProfile(value) ? value : structuredClone(DEFAULT_PROFILE);
}

export async function getLocalSettings(): Promise<LocalSettings> {
  const db = await database();
  const value = await db.get("settings", "preferences");
  // Spread over DEFAULT_SETTINGS (not just `value ?? default`) so settings
  // saved before a new field existed (e.g. analyticsConsent) still get a
  // safe default instead of `undefined`.
  return value
    ? { ...structuredClone(DEFAULT_SETTINGS), ...value }
    : structuredClone(DEFAULT_SETTINGS);
}

export async function saveLocalSettings(settings: LocalSettings): Promise<void> {
  const db = await database();
  await db.put("settings", structuredClone(settings), "preferences");
}

export async function exportLocalData(): Promise<GameDataExport> {
  const [activeGame, archives, profile, settings] = await Promise.all([
    database().then((db) => db.get("active", ACTIVE_GAME_KEY)),
    listCompletedRuns(),
    getLocalProfile(),
    getLocalSettings(),
  ]);
  return {
    format: "vers-lelysee-local-data",
    exportedAt: new Date().toISOString(),
    schemaVersion: GAME_CONFIG.schemaVersion,
    ...(activeGame ? { activeGame } : {}),
    archives,
    profile,
    settings,
  };
}

function isGameMode(value: unknown): value is GameMode {
  return value === "existing_party" || value === "custom_party" || value === "random";
}

export async function importLocalData(value: unknown): Promise<void> {
  if (!isRecord(value) || value.format !== "vers-lelysee-local-data") {
    throw new Error("Ce fichier n’est pas un export de Vers l’Élysée.");
  }
  if (typeof value.schemaVersion !== "number" || value.schemaVersion > GAME_CONFIG.schemaVersion) {
    throw new Error("Cet export provient d’une version plus récente ou inconnue du jeu.");
  }
  const archives = Array.isArray(value.archives) ? value.archives : [];
  if (!archives.every(isCompletedRun)) throw new Error("Une archive du fichier est invalide.");
  if (value.activeGame !== undefined && !isRecoverableGameState(value.activeGame)) {
    throw new Error("La partie active du fichier est invalide.");
  }
  if (value.activeGame && !isGameMode(value.activeGame.mode)) {
    throw new Error("Le mode de jeu importé est inconnu.");
  }
  const db = await database();
  const transaction = db.transaction(["active", "archives", "meta", "settings"], "readwrite");
  if (value.activeGame) {
    await transaction
      .objectStore("active")
      .put(migrateGameState(value.activeGame), ACTIVE_GAME_KEY);
  }
  for (const archive of archives) await transaction.objectStore("archives").put(archive);
  if (isLocalProfile(value.profile))
    await transaction.objectStore("meta").put(value.profile, META_KEY);
  if (isRecord(value.settings)) {
    await transaction.objectStore("settings").put(
      {
        reducedMotion: value.settings.reducedMotion === true,
        soundEnabled: value.settings.soundEnabled === true,
        fictionNoticeSeen: value.settings.fictionNoticeSeen === true,
        // Deliberately not carried over from the import: analytics consent
        // is a per-browser decision and must be re-confirmed on this device
        // rather than silently inherited from another profile's export.
        analyticsConsent: "unset",
      },
      "preferences",
    );
  }
  await transaction.done;
}

export async function deleteAllLocalData(): Promise<void> {
  const db = await database();
  const transaction = db.transaction(["active", "archives", "meta", "settings"], "readwrite");
  await Promise.all([
    transaction.objectStore("active").clear(),
    transaction.objectStore("archives").clear(),
    transaction.objectStore("meta").clear(),
    transaction.objectStore("settings").clear(),
  ]);
  await transaction.done;
}
