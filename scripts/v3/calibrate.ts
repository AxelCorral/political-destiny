/**
 * V3 — calibration rapide du casting réel et du directeur de campagne.
 * Usage : node node_modules/tsx/dist/cli.mjs scripts/v3/calibrate.ts [runsParParti]
 */
import { gameContent } from "../../src/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine";
import { hashSeed } from "../../src/game/engine/rng";

const runsPerParty = Number(process.argv[2] ?? 30);
const playable = gameContent.parties.filter((party) => party.playable !== false);

const r1Totals: Record<string, number[]> = {};
const qualified: Record<string, number> = {};
const playerQualified: Record<string, number> = {};
const playerWins: Record<string, number> = {};
const counters: Record<string, number> = {};
let runs = 0;
let errors = 0;
const decisionCounts: number[] = [];
const v3Cards: number[] = [];

function bump(key: string) {
  counters[key] = (counters[key] ?? 0) + 1;
}

for (const party of playable) {
  for (let i = 0; i < runsPerParty; i += 1) {
    const seed = `cal-${party.id}-${i}`;
    try {
      let state = createGame(
        {
          seed,
          mode: "existing_party",
          partyId: party.id,
          methodId: gameContent.methods[i % gameContent.methods.length]!.id,
        },
        gameContent,
      );
      let guard = 0;
      let v3 = 0;
      while (state.phase !== "finished" && guard++ < 70) {
        const event = currentEvent(state, gameContent.events);
        if (event.id.startsWith("v3_")) v3 += 1;
        const choice = event.choices[hashSeed(`${seed}:${guard}`) % event.choices.length]!;
        state = resolveCurrentChoice(state, choice.id, gameContent).state;
      }
      runs += 1;
      v3Cards.push(v3);
      decisionCounts.push(state.decisionHistory.length);
      const results = state.firstRoundResult?.results ?? {};
      for (const [id, value] of Object.entries(results)) {
        if (id === party.id) continue;
        (r1Totals[id] ??= []).push(Number(value));
      }
      for (const id of state.qualifiedPartyIds ?? []) {
        if (id !== party.id) qualified[id] = (qualified[id] ?? 0) + 1;
      }
      if (state.flags.playerQualified === true)
        playerQualified[party.id] = (playerQualified[party.id] ?? 0) + 1;
      if (state.flags.playerWon === true) playerWins[party.id] = (playerWins[party.id] ?? 0) + 1;
      for (const key of Object.keys(state.flags)) {
        if (key.startsWith("shock:")) bump(key);
        if (key.startsWith("protest:") && !key.endsWith(":national")) bump("protest");
        if (key.endsWith(":national")) bump("protest national");
      }
      if (state.flags["coup:id"]) bump(`coup:${state.flags["coup:id"]}`);
      if (state.flags["primary:ps:winner"]) bump(`ps winner:${state.flags["primary:ps:winner"]}`);
      if (state.flags["primary:right:done"])
        bump(`right primary:${state.flags["primary:right:winner"]}`);
      if (state.flags["director:campaignOver"])
        bump(`campaign over:${state.flags["director:campaignOver"]}`);
      for (const id of Object.keys(state.parties)) {
        const actor = state.actors[state.parties[id]!.candidateId];
        if (actor?.candidateStatus === "disqualified") bump(`disqualified:${id}`);
        if (actor?.candidateStatus === "withdrawn") bump(`withdrawn:${id}`);
      }
    } catch (error) {
      errors += 1;
      if (errors <= 3) console.error(seed, error);
    }
  }
}

const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
console.log(
  `runs=${runs} errors=${errors} decisions avg=${avg(decisionCounts).toFixed(1)} v3 cards avg=${avg(v3Cards).toFixed(1)}`,
);
console.log("\nPremier tour (PNJ, moyenne) / qualification PNJ :");
for (const [id, values] of Object.entries(r1Totals).sort((a, b) => avg(b[1]) - avg(a[1]))) {
  console.log(
    `  ${id.padEnd(18)} ${avg(values).toFixed(1).padStart(5)} %   qualif ${(((qualified[id] ?? 0) / values.length) * 100).toFixed(0)} %`,
  );
}
console.log("\nJoueur : qualification / victoire");
for (const party of playable) {
  console.log(
    `  ${party.id.padEnd(18)} ${(((playerQualified[party.id] ?? 0) / runsPerParty) * 100).toFixed(0).padStart(3)} % / ${(((playerWins[party.id] ?? 0) / runsPerParty) * 100).toFixed(0).padStart(3)} %`,
  );
}
console.log("\nDirecteur :");
for (const [key, value] of Object.entries(counters).sort())
  console.log(`  ${key.padEnd(34)} ${value}`);
