import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";

let state = createGame(
  { seed: "diag-active-1", mode: "existing_party", partyId: "lfi", methodId: "field_first" },
  gameContent,
);
let guard = 0;
while (state.phase !== "finished" && guard < 40) {
  const event = currentEvent(state, gameContent.events);
  const resolution = resolveCurrentChoice(state, event.choices[0]!.id, gameContent);
  state = resolution.state;
  guard += 1;
  if (state.firstRoundResult) {
    console.log("First round locked at decision", state.decisionIndex);
    console.log("qualifiedPartyIds:", state.qualifiedPartyIds);
    for (const p of Object.values(state.parties)) {
      const actor = state.actors[p.candidateId];
      console.log(
        p.id,
        "active=",
        p.active,
        "candidateStatus=",
        actor?.candidateStatus,
        "polling=",
        p.stats.polling.toFixed(2),
      );
    }
    break;
  }
}

// One more decision into between_rounds, to confirm the NEXT recalculateElectorate call
// (which now runs after candidateStatus is set) reflects only the two finalists.
if (state.phase === "between_rounds") {
  const event = currentEvent(state, gameContent.events);
  const resolution = resolveCurrentChoice(state, event.choices[0]!.id, gameContent);
  state = resolution.state;
  console.log("\nAfter one more decision in between_rounds:");
  for (const p of Object.values(state.parties)) {
    const actor = state.actors[p.candidateId];
    console.log(p.id, "candidateStatus=", actor?.candidateStatus, "polling=", p.stats.polling.toFixed(2));
  }
  const sum = Object.values(state.parties).reduce((s, p) => s + p.stats.polling, 0);
  console.log("sum of all polling =", sum.toFixed(2));
}
