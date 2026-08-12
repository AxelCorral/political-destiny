"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { track } from "@/analytics/client";
import { GAME_CONFIG } from "@/config/game";
import type { GameState } from "@/game/types";
import { FinalScreen } from "@/features/results/final-screen";
import { FictionNotice } from "@/features/onboarding/fiction-notice";
import {
  CampaignIntroScreen,
  CustomPartyScreen,
  MethodSelectionScreen,
  ModeSelectionScreen,
  PartyDetailScreen,
  PartySelectionScreen,
} from "@/features/onboarding/setup-screens";
import {
  CampaignEventScreen,
  ElectionNightScreen,
  OutcomeScreen,
  RaceBulletinScreen,
  RunoffIntroScreen,
} from "@/features/campaign/campaign-screens";
import {
  archiveCompletedGame,
  clearActiveGame,
  getLocalSettings,
  loadActiveGame,
  saveActiveGame,
} from "@/lib/storage/game-database";

import { useGameStore } from "./gameStore";

export function GameApp() {
  const router = useRouter();
  const screen = useGameStore((state) => state.screen);
  const gameState = useGameStore((state) => state.gameState);
  const restoreGame = useGameStore((state) => state.restoreGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState<string>();
  const [fictionNoticeSeen, setFictionNoticeSeen] = useState(false);
  const archivedRunIds = useRef(new Set<string>());

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [screen]);

  useEffect(() => {
    let active = true;
    // Both reads are awaited together before flipping `ready`, so the fiction
    // notice's open/closed state is known synchronously the moment any
    // interactive setup screen renders. Resolving fictionNoticeSeen on its
    // own async timer (as a second effect inside FictionNotice) let the
    // dialog pop open after the player had already started clicking through
    // setup — the overlay would then intercept the next click, the root
    // cause of the P7 Playwright flakiness on the existing-party/autosave/
    // first-round scenarios.
    const gameLoad = loadActiveGame()
      .then((loaded) => {
        if (!active) return;
        if (loaded.state) restoreGame(loaded.state);
        if (loaded.warning) setWarning(loaded.warning);
      })
      .catch(() => {
        if (active) {
          setWarning(
            "Le stockage local n’est pas accessible. Vous pouvez jouer, mais la reprise ne sera pas garantie.",
          );
        }
      });
    const settingsLoad = getLocalSettings()
      .then((settings) => {
        if (active) setFictionNoticeSeen(settings.fictionNoticeSeen);
      })
      .catch(() => {
        if (active) setFictionNoticeSeen(false);
      });
    void Promise.all([gameLoad, settingsLoad]).finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, [restoreGame]);

  useEffect(() => {
    if (!ready || !gameState || gameState.phase === "finished") return;
    const timeout = window.setTimeout(() => {
      void saveActiveGame(gameState).catch(() => {
        setWarning(
          "La sauvegarde automatique n’a pas abouti. Votre partie reste jouable dans cet onglet.",
        );
      });
    }, GAME_CONFIG.autosaveDebounceMs);
    return () => window.clearTimeout(timeout);
  }, [gameState, ready]);

  useEffect(() => {
    if (!ready || !gameState?.finalResult || archivedRunIds.current.has(gameState.runId)) return;
    archivedRunIds.current.add(gameState.runId);
    void archiveCompletedGame(gameState).catch(() => {
      archivedRunIds.current.delete(gameState.runId);
      setWarning("Le résultat n’a pas encore pu être ajouté aux archives locales.");
    });
  }, [gameState, ready]);

  const trackedSetupScreens = useRef(new Set<string>());
  useEffect(() => {
    if (!ready) return;
    const setupScreens = ["mode", "party_list", "party_detail", "custom_party", "method"] as const;
    if (!(setupScreens as readonly string[]).includes(screen)) return;
    // Deduped per screen per app mount, not per visit — this is a coarse
    // "how far did setup get" funnel signal, not a precise click log.
    if (trackedSetupScreens.current.has(screen)) return;
    trackedSetupScreens.current.add(screen);
    track("setup_step_viewed", undefined, {
      screen: screen as (typeof setupScreens)[number],
    });
  }, [screen, ready]);

  // Analytics instrumentation — observes gameState transitions from the
  // outside; never touches src/game/engine/** or the store's own logic.
  // track() never throws and never awaits anything on this path, so a
  // telemetry failure here cannot affect gameplay (see docs/analytics/
  // ARCHITECTURE_PLAN.md §4). Diffed against the previous render's snapshot
  // rather than hooked into individual store actions, so this stays a pure
  // "observer" of state the store already produces.
  const previousGameStateRef = useRef<GameState | undefined>(undefined);
  useEffect(() => {
    if (!ready) return;
    const previous = previousGameStateRef.current;
    const current = gameState;
    previousGameStateRef.current = current;
    if (!current) return;

    if (!previous || previous.runId !== current.runId) {
      if (current.decisionIndex === 0 && current.decisionHistory.length === 0) {
        track("run_started", current.runId, {
          mode: current.mode,
          partyId: current.playerPartyId,
          seed: current.seed,
        });
      } else {
        track("run_resumed", current.runId, {
          decisionIndex: current.decisionIndex,
          phase: current.phase,
        });
      }
      return;
    }

    if (current.decisionHistory.length > previous.decisionHistory.length) {
      for (const record of current.decisionHistory.slice(previous.decisionHistory.length)) {
        track("decision_resolved", current.runId, {
          decisionIndex: record.decisionIndex,
          phase: current.phase,
          eventId: record.eventId,
          eventCategory: record.eventCategory,
          choiceId: record.choiceId,
          choiceTag: record.choiceTag,
          choiceStrategy: record.choiceStrategy,
          outcomeId: record.outcomeId,
          internalRoll: record.internalRoll,
        });
      }
    }

    if (current.pollHistory.length > previous.pollHistory.length) {
      for (const snapshot of current.pollHistory.slice(previous.pollHistory.length)) {
        track("race_snapshot", current.runId, {
          decisionIndex: snapshot.decisionIndex,
          playerRank: snapshot.playerRank,
          playerTrend: snapshot.playerTrend,
          resultsCount: Object.keys(snapshot.results).length,
        });
      }
    }

    if (!previous.firstRoundResult && current.firstRoundResult) {
      const rank = current.firstRoundResult.ranking.indexOf(current.playerPartyId) + 1;
      const qualified = current.flags.playerQualified === true;
      track("first_round_result", current.runId, {
        playerRank: rank || current.firstRoundResult.ranking.length + 1,
        qualified,
        turnout: current.firstRoundResult.turnout,
      });
      track("milestone_reached", current.runId, {
        milestone: qualified ? "qualified_first_round" : "eliminated_first_round",
      });
    }

    if (!previous.secondRoundResult && current.secondRoundResult) {
      const rank = current.secondRoundResult.ranking.indexOf(current.playerPartyId) + 1;
      track("second_round_result", current.runId, {
        playerRank: rank || current.secondRoundResult.ranking.length + 1,
        won: current.secondRoundResult.ranking[0] === current.playerPartyId,
        turnout: current.secondRoundResult.turnout,
      });
      track("milestone_reached", current.runId, { milestone: "entered_second_round" });
    }

    if (previous.phase !== "government_epilogue" && current.phase === "government_epilogue") {
      track("milestone_reached", current.runId, { milestone: "entered_government" });
    }

    if (!previous.finalResult && current.finalResult) {
      track("run_completed", current.runId, {
        score: current.finalResult.score,
        won: current.finalResult.won,
        qualified: current.finalResult.qualified,
        endingId: current.finalResult.endingId,
        progressionNormalized: current.finalResult.progressionNormalized,
        decisionsCount: current.decisionHistory.length,
      });
      track("milestone_reached", current.runId, { milestone: "game_finished" });
    }
  }, [gameState, ready]);

  const saveAndQuit = async () => {
    try {
      if (gameState && gameState.phase !== "finished") await saveActiveGame(gameState);
      router.push("/");
    } catch {
      setWarning("La sauvegarde n’a pas abouti : la campagne reste ouverte dans cet onglet.");
    }
  };

  const replay = async () => {
    await clearActiveGame();
    resetGame();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!ready) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-4 text-center">
        <div>
          <LoaderCircle
            aria-hidden="true"
            className="mx-auto size-9 animate-spin text-[var(--blue-600)]"
          />
          <p className="mt-4 text-sm font-bold text-[var(--ink-muted)]">
            Ouverture du quartier général…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <FictionNotice initiallySeen={fictionNoticeSeen} />
      {warning ? (
        <div
          className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-[var(--warning)]"
          role="alert"
        >
          <div className="mx-auto flex max-w-7xl items-start gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span className="flex-1">{warning}</span>
            <button
              type="button"
              onClick={() => setWarning(undefined)}
              className="font-black underline"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
      {screen === "mode" ? <ModeSelectionScreen /> : null}
      {screen === "party_list" ? <PartySelectionScreen /> : null}
      {screen === "party_detail" ? <PartyDetailScreen /> : null}
      {screen === "custom_party" ? <CustomPartyScreen /> : null}
      {screen === "method" ? <MethodSelectionScreen /> : null}
      {screen === "intro" ? <CampaignIntroScreen /> : null}
      {screen === "campaign" ? <CampaignEventScreen onSaveAndQuit={saveAndQuit} /> : null}
      {screen === "outcome" ? <OutcomeScreen /> : null}
      {screen === "race" ? <RaceBulletinScreen /> : null}
      {screen === "first_round" ? <ElectionNightScreen round={1} /> : null}
      {screen === "runoff_intro" ? <RunoffIntroScreen /> : null}
      {screen === "second_round" ? <ElectionNightScreen round={2} /> : null}
      {screen === "final" ? <FinalScreen onReplay={replay} /> : null}
    </>
  );
}
