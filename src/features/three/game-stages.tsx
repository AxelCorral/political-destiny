"use client";

import type { ElectionRoundResult, GameState, RegionId } from "@/game/types";

import { figurineForParty, rankedActiveParties } from "./cast";
import type { FigurinePose } from "./figurines/specs";
import { figurineSpecs } from "./figurines/specs";
import { CampaignScene, DebateScene, ElyseeScene, HomeScene, PodiumScene } from "./scenes/scenes";

/**
 * Scènes 3D alimentées par l'état de jeu. Ce module est chargé paresseusement
 * (voir `stage-3d.tsx`) : three.js n'entre jamais dans le bundle initial.
 */

function bestRegion(state: GameState, partyId: string, avoid: RegionId[] = []): RegionId {
  const affinity = state.parties[partyId]?.regionalAffinity ?? {};
  const sorted = (Object.entries(affinity) as Array<[RegionId, number]>)
    .filter(([region]) => region !== "overseas" && !avoid.includes(region))
    .sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "central";
}

function playerPose(state: GameState): FigurinePose {
  const last = state.decisionHistory.at(-1);
  if (!last) return "wave";
  const score = last.visibleEffects.reduce(
    (sum, effect) => sum + (effect.tone === "positive" ? 1 : effect.tone === "negative" ? -1 : 0),
    0,
  );
  if (score >= 2) return "cheer";
  if (score <= -2) return "slump";
  return "speak";
}

export function CampaignStageFromState({ state }: { state: GameState }) {
  const player = figurineForParty(state, state.playerPartyId);
  const playerRegion = state.playerPartyId === "rn" ? "north" : "ile_de_france";
  const used: RegionId[] = [playerRegion];
  const rivals = rankedActiveParties(state)
    .filter((id) => id !== state.playerPartyId)
    .slice(0, 3)
    .map((id) => {
      const region = bestRegion(state, id, used);
      used.push(region);
      return { spec: figurineForParty(state, id), region };
    });
  const shocks = [...new Set((state.world.activeShocks ?? []).map((shock) => shock.theme))];
  const protestRegions = [
    ...new Set((state.world.protests ?? []).flatMap((protest) => protest.regions)),
  ];
  return (
    <CampaignScene
      player={player}
      playerRegion={playerRegion}
      playerPose={playerPose(state)}
      rivals={rivals}
      shocks={shocks}
      protestRegions={protestRegions}
      label={`Diorama de campagne : ${player.label} face à ${rivals.map((rival) => rival.spec.label).join(", ")}`}
    />
  );
}

export function DebateStageFromState({ state }: { state: GameState }) {
  const rivalId =
    state.qualifiedPartyIds?.find((id) => id !== state.playerPartyId) ??
    rankedActiveParties(state).find((id) => id !== state.playerPartyId);
  const left = figurineForParty(state, state.playerPartyId);
  const right = rivalId ? figurineForParty(state, rivalId) : figurineSpecs.le_pen!;
  return (
    <DebateScene
      left={left}
      right={right}
      label={`Débat télévisé : ${left.label} face à ${right.label}`}
    />
  );
}

export function PodiumStageFromResult({
  state,
  result,
}: {
  state: GameState;
  result: ElectionRoundResult;
}) {
  const entries = result.ranking.slice(0, 4).map((partyId) => ({
    partyId,
    score: result.results[partyId] ?? 0,
    spec: figurineForParty(state, partyId),
  }));
  return (
    <PodiumScene
      entries={entries}
      playerId={state.playerPartyId}
      label={`Podium : ${entries.map((entry) => `${entry.spec.label} ${entry.score.toFixed(1)} %`).join(", ")}`}
    />
  );
}

export function ElyseeStageFromState({ state }: { state: GameState }) {
  const player = figurineForParty(state, state.playerPartyId);
  const won = state.finalResult?.won === true;
  return (
    <ElyseeScene
      player={player}
      won={won}
      label={
        won ? `${player.label} arrive à l’Élysée` : `${player.label} devant les grilles de l’Élysée`
      }
    />
  );
}

const HOME_CAST = [
  "le_pen",
  "melenchon",
  "glucksmann",
  "philippe",
  "attal",
  "retailleau",
  "tondelier",
  "zemmour",
  "lisnard",
];

export function HomeStage() {
  const cast = HOME_CAST.map((id) => figurineSpecs[id]!).filter(Boolean);
  return (
    <HomeScene
      cast={cast}
      label="Les candidats de la présidentielle 2027 en figurines sur une carte de France"
    />
  );
}
