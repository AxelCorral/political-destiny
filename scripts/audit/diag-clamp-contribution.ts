import { gameContent } from "../../src/game/data/index";
import { createGame } from "../../src/game/engine/index";

const state = createGame(
  { seed: "clamp-test-1", mode: "existing_party", partyId: "lfi", methodId: "presidential" },
  gameContent,
);

for (const p of Object.values(state.parties)) {
  const readiness = Math.min(
    1,
    Math.max(0.68, 0.5 + p.stats.awareness * 0.0025 + p.stats.localStrength * 0.0015 + p.stats.electedSupport * 0.001),
  );
  const uncappedReadiness =
    0.5 + p.stats.awareness * 0.0025 + p.stats.localStrength * 0.0015 + p.stats.electedSupport * 0.001;
  const base = 8.2 + p.hidden.baseSupport * 0.58 + p.stats.awareness * 0.02;
  const competence = p.stats.credibility * 0.18 + p.stats.popularity * 0.15 + p.stats.mobilization * 0.09;
  console.log(
    p.id,
    "readiness(clamped)=",
    readiness.toFixed(3),
    "readiness(uncapped)=",
    uncappedReadiness.toFixed(3),
    "base=",
    base.toFixed(2),
    "competence(additive)=",
    competence.toFixed(2),
  );
}
