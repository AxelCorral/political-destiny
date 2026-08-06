/**
 * Post-corrections audit — readable full-run timelines (section 17).
 * Selects a sample of runs from raw-runs.csv / decisions.csv and renders a
 * markdown chronology for each, enriched with the real event/choice/outcome
 * text from gameContent so a human can actually read what happened.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { bool, num, parseCsv, str } from "./lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results");
const TIMELINE_DIR = resolve(OUT_DIR, "selected-run-timelines");

async function readCsv(name: string): Promise<Record<string, string>[]> {
  const text = await readFile(resolve(OUT_DIR, name), "utf8");
  return parseCsv(text);
}

const rawRuns = await readCsv("raw-runs.csv");
const decisions = await readCsv("decisions.csv");
const existingRuns = rawRuns.filter((r) => r.partyKind === "existing");

const eventById = new Map(gameContent.events.map((e) => [e.id, e]));

function runKeyOf(r: Record<string, string>): string {
  return `${r.partyId}:${r.agent}:${r.seedIndex}`;
}

function renderTimeline(run: Record<string, string>): string {
  const key = runKeyOf(run);
  const runDecisions = decisions
    .filter((d) => d.runKey === key)
    .sort((a, b) => num(a.decisionIndex) - num(b.decisionIndex));

  const lines: string[] = [];
  lines.push(`# ${str(run.partyId)} · ${str(run.agent)} · seed ${str(run.seedIndex)}`);
  lines.push("");
  lines.push(
    `Parti : **${str(run.partyId)}** (${str(run.partyKind)}) — Agent : **${str(run.agent)}** — Graine : \`${str(run.seed)}\` — Méthode : ${str(run.methodId)}`,
  );
  lines.push(
    `Résultat : ${bool(run.qualified) ? "qualifié" : "éliminé au 1er tour"}${bool(run.won) ? ", **vainqueur**" : ""} — score final ${str(run.finalScore)}/100 — fin \`${str(run.endingId)}\``,
  );
  lines.push(
    `Score 1er tour : ${str(run.firstRoundScore)} — Score 2nd tour : ${str(run.secondRoundScore) || "n/a"} — Progression : ${str(run.progression)}`,
  );
  lines.push(
    `Répétitions dans cette partie : ${str(run.repeatedTitlesExact)} titres, ${str(run.repeatedNarrativesExact)} récits (dont ${str(run.chainJustifiedRepeats)} justifiées par une chaîne)`,
  );
  lines.push(
    `Mémoire/monde : ${str(run.actorMemoryEntries)} souvenirs d'acteurs, ${str(run.opponentActionCount)} actions adverses (${str(run.opponentActionKinds)}), ${str(run.alliancesFormed)} alliance(s), ${str(run.candidateReplacements)} remplacement(s)`,
  );
  lines.push(
    `Idéologie : mouvement total ${str(run.ideologyMovementTotal)} points, axe le plus mobile ${str(run.ideologyMovementMax)} points`,
  );
  lines.push("");
  lines.push("## Chronologie");
  lines.push("");
  for (const decision of runDecisions) {
    const event = eventById.get(str(decision.eventId));
    const choice = event?.choices.find((c) => c.id === decision.choiceId);
    const outcome = choice?.outcomeGroups.find((o) => o.id === decision.outcomeId);
    lines.push(
      `**${str(decision.decisionIndex)}. ${event?.title ?? decision.eventId}** _(${decision.eventCategory})_`,
    );
    if (choice)
      lines.push(`- Choix : ${choice.label}${choice.visibleTag ? ` [${choice.visibleTag}]` : ""}`);
    if (outcome) {
      lines.push(`- Conséquence : *${outcome.title}* — ${outcome.publicNarrative}`);
    }
    if (decision.statementEvolution) lines.push(`- Déclaration : ${decision.statementEvolution}`);
    lines.push("");
  }
  return lines.join("\n");
}

function pick<T>(arr: T[], n: number, seedOffset = 0): T[] {
  return arr
    .filter((_, i) => (i + seedOffset) % Math.max(1, Math.floor(arr.length / n)) === 0)
    .slice(0, n);
}

const selections: Array<{ label: string; runs: Record<string, string>[] }> = [];

selections.push({
  label: "aleatoires",
  runs: pick(
    existingRuns.filter((r) => r.agent === "aleatoire"),
    10,
  ),
});
selections.push({ label: "gagnees", runs: existingRuns.filter((r) => bool(r.won)).slice(0, 5) });
selections.push({
  label: "perdues",
  runs: existingRuns.filter((r) => !bool(r.won) && bool(r.qualified)).slice(0, 5),
});

const partyAvgScore = new Map<string, number>();
for (const party of new Set(existingRuns.map((r) => str(r.partyId)))) {
  const scores = existingRuns.filter((r) => r.partyId === party).map((r) => num(r.firstRoundScore));
  partyAvgScore.set(party, scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1));
}
const rankedParties = [...partyAvgScore.entries()].sort((a, b) => b[1] - a[1]);
const favoriteId = rankedParties[0]?.[0];
const underdogId = rankedParties[rankedParties.length - 1]?.[0];
selections.push({
  label: "parti_favori",
  runs: existingRuns.filter((r) => r.partyId === favoriteId).slice(0, 5),
});
selections.push({
  label: "parti_difficile",
  runs: existingRuns.filter((r) => r.partyId === underdogId).slice(0, 5),
});

const rareEventRunKeys = new Set(
  decisions.filter((d) => d.eventCategory === "rare").map((d) => d.runKey),
);
selections.push({
  label: "evenement_rare",
  runs: existingRuns.filter((r) => rareEventRunKeys.has(runKeyOf(r))).slice(0, 5),
});

// Counterfactual pairs: same party+seed, two different agents.
const bySeedParty = new Map<string, Record<string, string>[]>();
for (const r of existingRuns) {
  const k = `${r.partyId}:${r.seedIndex}`;
  bySeedParty.set(k, [...(bySeedParty.get(k) ?? []), r]);
}
const counterfactualPairRuns: Record<string, string>[] = [];
let pairsAdded = 0;
for (const group of bySeedParty.values()) {
  if (pairsAdded >= 5) break;
  if (group.length >= 2) {
    counterfactualPairRuns.push(group[0]!, group[1]!);
    pairsAdded += 1;
  }
}
selections.push({ label: "paires_contrefactuelles", runs: counterfactualPairRuns });

await mkdir(TIMELINE_DIR, { recursive: true });
let written = 0;
const index: string[] = ["# Index des chronologies sélectionnées", ""];
for (const { label, runs } of selections) {
  index.push(`## ${label} (${runs.length})`);
  for (const run of runs) {
    const fileName = `${label}__${run.partyId}__${run.agent}__seed${run.seedIndex}.md`.replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    );
    await writeFile(resolve(TIMELINE_DIR, fileName), renderTimeline(run), "utf8");
    index.push(
      `- [\`${fileName}\`](./${fileName}) — ${run.partyId}/${run.agent}, ${bool(run.qualified) ? "qualifié" : "éliminé"}${bool(run.won) ? ", vainqueur" : ""}, score ${run.finalScore}`,
    );
    written += 1;
  }
  index.push("");
}
await writeFile(resolve(TIMELINE_DIR, "README.md"), index.join("\n"), "utf8");

console.log(JSON.stringify({ timelinesWritten: written, favoriteId, underdogId }, null, 2));
