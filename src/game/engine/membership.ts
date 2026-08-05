import type { GameEffect, GameState } from "@/game/types";

import { clamp } from "./math";

function strategicSignal(effects: GameEffect[]): number {
  return effects.reduce((total, effect) => {
    if (effect.kind === "alliance") return total + (effect.action === "add" ? 1.2 : -1.2);
    if (effect.kind === "party_split") return total - 2;
    if (effect.kind === "actor_memory")
      return (
        total +
        (["trust", "political_debt", "support", "promise", "rallying"].includes(effect.memory)
          ? 0.45
          : -0.55)
      );
    if ("delta" in effect && effect.kind !== "party_stat")
      return total + Math.sign(effect.delta) * 0.3;
    if (effect.kind === "party_stat" && effect.stat !== "members")
      return total + Math.sign(effect.delta) * Math.min(1.2, Math.abs(effect.delta) / 4);
    return total;
  }, 0);
}

/**
 * Simule le recrutement et les départs entre deux décisions. Les effets
 * explicites sur les adhésions restent prioritaires ; ce mouvement organique
 * traduit la dynamique durable sans afficher une jauge supplémentaire.
 */
export function evolveMembership(sourceState: GameState, effects: GameEffect[]): GameState {
  const state = structuredClone(sourceState);
  const party = state.parties[state.playerPartyId];
  if (!party) return state;
  const signal = strategicSignal(effects);
  const rawDelta =
    (party.stats.popularity - 50) * 18 +
    (party.stats.mobilization - 50) * 15 +
    (party.stats.momentum - 50) * 15 +
    (party.stats.mediaPresence - 50) * 8 +
    signal * 650;
  const delta = Math.round(clamp(rawDelta, -2_500, 5_500) / 100) * 100;
  party.stats.members = clamp(party.stats.members + delta, 0, 5_000_000);
  state.flags.organicMemberChange = Number(state.flags.organicMemberChange ?? 0) + delta;
  return state;
}
