/**
 * Complète reality-grounded-playtests.ts pour pt4/pt5/pt6 : le retrait des
 * Écologistes n'a jamais été observé naturellement en 3000 tentatives par
 * scénario (base électorale trop proche de plusieurs autres partis pour
 * gagner la compétition probabiliste du déclenchement, voir
 * REALITY_GROUNDED_CAMPAIGN_REPORT.md « problèmes ouverts »). Le prompt de
 * mission (§14) demande explicitement une comparaison contrôlée relations
 * favorables/défavorables sur le MÊME type de retrait — construit ici en
 * fixant `partyRelations` puis en déclenchant le retrait via
 * `redistributeElectorate` (le moteur réel, jamais réimplémenté), à l'image
 * de la méthodologie déjà utilisée par
 * scripts/audit/reality-grounded-counterfactuals.ts.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { nationalLatentSupport } from "../../src/game/engine/electorate";
import { redistributeElectorate } from "../../src/game/engine/redistribution";
import type { GameState } from "../../src/game/types/index";
import { type AgentName, pickChoice } from "../audit-post/lib/agents";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/reality-grounding/playtests");
const FORK_DECISION_INDEX = 16;

function playToFork(partyId: string, agent: AgentName, seed: string): GameState {
  let state = createGame(
    { seed, mode: "existing_party", partyId, methodId: gameContent.methods[0]!.id },
    gameContent,
  );
  for (let guard = 0; guard < FORK_DECISION_INDEX; guard += 1) {
    if (state.phase === "finished") break;
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
  }
  return state;
}

function playToEnd(state: GameState, agent: AgentName, seed: string): GameState {
  let current = structuredClone(state);
  let guard = 0;
  while (current.phase !== "finished" && guard < 90) {
    const event = currentEvent(current, gameContent.events);
    const choice = pickChoice(current, event, agent, seed);
    current = resolveCurrentChoice(current, choice.id, gameContent).state;
    guard += 1;
  }
  return current;
}

async function buildScenario(
  id: string,
  title: string,
  partyId: string,
  relationValue: number | undefined,
  agent: AgentName,
  seed: string,
) {
  const fork = playToFork(partyId, agent, seed);
  if (fork.phase === "finished" || !fork.parties.ecologistes?.active) {
    console.log(`${id} : parti Écologistes déjà inactif ou campagne terminée à la fourche, abandon`);
    return;
  }
  const withState = structuredClone(fork);
  if (relationValue !== undefined) {
    withState.partyRelations.ecologistes ??= {};
    withState.partyRelations.lfi ??= {};
    withState.partyRelations.ecologistes.lfi = relationValue;
    withState.partyRelations.lfi.ecologistes = relationValue;
  }
  const before = nationalLatentSupport(withState, gameContent.electorateBlocs);
  const actor = withState.actors[withState.parties.ecologistes!.candidateId];
  if (actor) {
    actor.candidateStatus = "withdrawn";
    actor.active = false;
  }
  withState.parties.ecologistes!.active = false;
  const redistribution = redistributeElectorate(withState, gameContent.electorateBlocs, "ecologistes");
  const afterState = redistribution.state;
  const after = nationalLatentSupport(afterState, gameContent.electorateBlocs);

  const final = playToEnd(afterState, agent, `${seed}:post-withdrawal`);
  const r1 = final.firstRoundResult?.results ?? {};
  const r2 = final.secondRoundResult?.results;
  const finalists = final.qualifiedPartyIds ?? [];

  const deltas = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .map((partyKey) => ({ partyKey, delta: (after[partyKey] ?? 0) - (before[partyKey] ?? 0) }))
    .sort((a, b) => b.delta - a.delta)
    .map(({ partyKey, delta }) => `${partyKey} ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`)
    .join(", ");

  const md = `# ${title}

Parti joué : **${partyId}** — agent de décision : \`${agent}\` — graine : \`${seed}\`.
Retrait des Écologistes construit à la décision ${FORK_DECISION_INDEX} (relation
Écologistes↔${partyId} fixée à **${relationValue ?? "valeur naturelle du fork"}** juste avant le
retrait), puis rejoué jusqu'au bout avec le moteur réel (\`redistributeElectorate\`, jamais
réimplémenté).

## Sondage national avant/après le retrait (bloc électoral agrégé)

${deltas}

## Résumé chiffré de fin de campagne

- Score premier tour (joueur) : **${(r1[partyId] ?? 0).toFixed(1)} %**
- Finalistes qualifiés : ${finalists.join(" vs ") || "N/A"}
- Résultat second tour : ${r2 ? finalists.map((fid) => `${fid} ${(r2[fid] ?? 0).toFixed(1)} %`).join(" / ") : "N/A"}
- Victoire du joueur : ${final.finalResult?.won === true ? "oui" : final.finalResult?.won === false ? "non" : "N/A"}

## Jugement de cohérence narrative

${
  relationValue !== undefined && relationValue > 0
    ? "Relation Écologistes→" + partyId + " favorable au moment du retrait : le report doit être visiblement plus généreux vers " + partyId + " que dans le scénario symétrique à relation dégradée (comparer avec pt6)."
    : relationValue !== undefined
      ? "Relation Écologistes→" + partyId + " dégradée au moment du retrait : le report doit être visiblement moins généreux vers " + partyId + " que dans le scénario symétrique à relation favorable (comparer avec pt5)."
      : "Retrait construit sans manipulation de relation — sert de référence neutre (pt4)."
}
`;
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(resolve(OUT_DIR, `${id}.md`), md, "utf8");
  console.log(`${id} : écrit`);
}

async function main() {
  await buildScenario(
    "pt4-ps-retrait-ecologistes",
    "PS — retrait écologiste (construit)",
    "ps",
    undefined,
    "aleatoire",
    "playtest-rg-forced-ps-eco-0",
  );
  await buildScenario(
    "pt5-lfi-retrait-eco-relations-favorables",
    "LFI — retrait écologiste avec relations favorables (construit)",
    "lfi",
    45,
    "aleatoire",
    "playtest-rg-forced-lfi-eco-favorable-0",
  );
  await buildScenario(
    "pt6-lfi-retrait-eco-relations-mauvaises",
    "LFI — même retrait avec relations mauvaises (construit)",
    "lfi",
    -45,
    "aleatoire",
    "playtest-rg-forced-lfi-eco-mauvaise-0",
  );
}

await main();
