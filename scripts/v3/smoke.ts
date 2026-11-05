import { gameContent } from "../../src/game/data";
import { createGame, resolveCurrentChoice, currentEvent } from "../../src/game/engine";

const partyId = process.argv[2] ?? "horizons";
const seed = process.argv[3] ?? "smoke-1";
let g = createGame(
  { mode: "existing_party", partyId, methodId: gameContent.methods[0]!.id, seed },
  gameContent,
);
console.log(g.currentDate, g.phase);
console.log(
  Object.values(g.parties)
    .sort((a, b) => b.stats.polling - a.stats.polling)
    .map(
      (p) => `${p.shortName}:${p.stats.polling.toFixed(1)}:${g.actors[p.candidateId]?.displayName}`,
    )
    .join(" | "),
);
let guard = 0;
while (g.phase !== "finished" && guard++ < 60) {
  const ev = currentEvent(g, gameContent.events);
  const choice = ev.choices[guard % ev.choices.length]!;
  const res = resolveCurrentChoice(g, choice.id, gameContent);
  g = res.state;
  const tag = ev.id.startsWith("v3_") ? "  <<V3>>" : "";
  console.log(
    `${String(res.record.decisionIndex).padStart(2)} ${res.record.date} ${g.phase.padEnd(17)} ${ev.id}${tag} theme=${g.world.dominantTheme}`,
  );
}
console.log(
  "news:",
  g.publicNews
    .slice(-8)
    .map((n) => n.headline)
    .join(" // "),
);
const r1 = g.firstRoundResult;
if (r1)
  console.log(
    "R1:",
    Object.entries(r1.results ?? {})
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 8)
      .map(([k, v]) => `${k}:${Number(v).toFixed(1)}`)
      .join(" "),
  );
console.log(
  "ending:",
  g.endingId,
  "flags:",
  Object.keys(g.flags)
    .filter((k) => /primary|coup|shock|protest|sponsor/.test(k))
    .join(","),
);
