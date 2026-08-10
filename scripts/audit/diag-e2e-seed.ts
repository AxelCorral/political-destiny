import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";

for (const seed of ["e2e-ps-search-0", "e2e-rn-defeat-0"]) {
  let state = createGame(
    { seed, mode: "existing_party", partyId: seed.includes("ps") ? "ps" : "rn", methodId: "presidential" },
    gameContent,
  );
  let guard = 0;
  while (!state.firstRoundResult && guard < 40) {
    const event = currentEvent(state, gameContent.events);
    state = resolveCurrentChoice(state, event.choices[0]!.id, gameContent).state;
    guard += 1;
  }
  const ordered = Object.entries(state.firstRoundResult!.results).sort((a, b) => b[1] - a[1]);
  const rank = ordered.findIndex(([id]) => id === (seed.includes("ps") ? "ps" : "rn")) + 1;
  console.log(seed, "-> rank", rank, ordered);
}
