/**
 * Gameplay audit — timeline selection and rendering (sections 6-7). Selects
 * >=50 runs from the corpus covering every party, outcome category, and
 * notable-feature bucket (rare event, alliance, opponent conflict, chain,
 * ideology shift, second round) required by the mission, then renders each
 * as a readable markdown chronology enriched with poll before/after,
 * phase, and a heuristic dramatic-intensity score per decision — everything
 * a qualitative read (section 8+) needs, without re-deriving it from raw
 * game state.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { bool, num, parseCsv, str } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/gameplay");
const TIMELINE_DIR = resolve(OUT_DIR, "timelines");

async function readCsv(name: string): Promise<Record<string, string>[]> {
  return parseCsv(await readFile(resolve(OUT_DIR, name), "utf8"));
}

const runs = await readCsv("runs.csv");
const choices = await readCsv("choices.csv");
const eventById = new Map(gameContent.events.map((e) => [e.id, e]));

function fileNameFor(run: Record<string, string>): string {
  return `${run.partyProfile}__${run.agent}__seed${run.seedIndex}__${run.resultCategory}.md`.replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  );
}

function intensityBar(score: number): string {
  return (
    "▮".repeat(Math.max(0, Math.min(6, Math.round(score)))) + "▯".repeat(6 - Math.round(score))
  );
}

function renderTimeline(run: Record<string, string>): string {
  const runDecisions = choices
    .filter((c) => c.runKey === run.runKey)
    .sort((a, b) => num(a.decisionIndex) - num(b.decisionIndex));

  const lines: string[] = [];
  lines.push(`# ${str(run.partyProfile)} · ${str(run.agent)} · seed ${str(run.seedIndex)}`);
  lines.push("");
  lines.push(
    `Parti : **${str(run.partyId)}**${run.partyKind === "custom" ? ` (profil personnalisé : ${str(run.partyProfile)})` : ""} — Agent : **${str(run.agent)}** — Graine : \`${str(run.seed)}\` — Méthode : ${str(run.methodId)}`,
  );
  lines.push(
    `Résultat : **${str(run.resultCategory)}** — ${bool(run.qualified) ? "qualifié" : "éliminé au 1er tour"}${bool(run.won) ? ", **vainqueur**" : ""} — score final ${str(run.finalScore)}/100 — fin \`${str(run.endingId)}\``,
  );
  lines.push(
    `Sondage de départ : ${str(run.startingPolling)} — Score 1er tour : ${str(run.firstRoundScore)}${run.secondRoundScore ? ` — Score 2nd tour : ${str(run.secondRoundScore)}` : ""} — Progression normalisée : ${str(run.progressionNormalized)}`,
  );
  lines.push(
    `Signaux structurels : ${bool(run.rareEventEncountered) ? "événement rare ✅" : "événement rare ❌"} · ${bool(run.secondRoundReached) ? "second tour ✅" : "second tour ❌"} · alliances formées : ${str(run.alliancesFormed)} · ${bool(run.hasChainEvent) ? "chaîne narrative ✅" : "chaîne narrative ❌"} · ${bool(run.hasOpponentConflict) ? "conflit adversaire ✅" : "conflit adversaire ❌"} · mouvement idéologique total : ${str(run.ideologyMovementTotal)} pts · ${bool(run.isComeback) ? "remontée ✅" : ""}${bool(run.isCollapse) ? "effondrement ✅" : ""}`,
  );
  lines.push(
    `Mémoire/monde : ${str(run.actorMemoryEntries)} souvenirs d'acteurs, ${str(run.statementCount)} déclarations (${str(run.contradictionCount)} contradiction(s)), ${str(run.narrativeThreadsStarted)} chaîne(s) engagée(s) (${str(run.narrativeThreadsResolved)} résolue(s), ${str(run.narrativeThreadsFailed)} échouée(s))`,
  );
  lines.push("");
  lines.push("## Chronologie");
  lines.push("");
  for (const decision of runDecisions) {
    const event = eventById.get(str(decision.eventId));
    const choice = event?.choices.find((c) => c.id === decision.choiceId);
    lines.push(
      `### ${str(decision.decisionIndex)}. ${event?.title ?? decision.eventId} _(${decision.eventCategory}${decision.eventImportance ? `, ${decision.eventImportance}` : ""})_`,
    );
    lines.push(`_Phase : ${decision.phase} — ${decision.date}_`);
    if (event?.summary) lines.push(`> ${event.summary}`);
    lines.push(
      `**Options proposées (${decision.optionsCount})** — choisi : **${choice?.label ?? str(decision.choiceLabel)}**${decision.choiceTag ? ` [${decision.choiceTag}]` : ""}${decision.choiceStrategy ? ` (${decision.choiceStrategy})` : ""}`,
    );
    if (event && event.choices.length > 1) {
      const others = event.choices.filter((c) => c.id !== decision.choiceId).map((c) => c.label);
      if (others.length > 0) lines.push(`- Options non choisies : ${others.join(" · ")}`);
    }
    lines.push(`Conséquence : *${str(decision.outcomeTitle)}* — ${str(decision.narrative)}`);
    if (decision.statementEvolution) lines.push(`Déclaration : ${decision.statementEvolution}`);
    lines.push(
      `Sondage : ${decision.pollBefore} → ${decision.pollAfter} (${Number(decision.pollDelta) >= 0 ? "+" : ""}${decision.pollDelta}) — Rang : ${decision.rankBefore} → ${decision.rankAfter}`,
    );
    lines.push(
      `Intensité estimée : ${intensityBar(num(decision.intensityEstimate))} (${decision.intensityEstimate}/6)`,
    );
    lines.push("");
  }
  return lines.join("\n");
}

function pickN<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

const selected = new Map<string, Record<string, string>>();
function add(run: Record<string, string> | undefined) {
  if (run) selected.set(run.runKey!, run);
}

// >=3 per existing party, spanning different outcome categories when possible
const existingParties = [
  ...new Set(runs.filter((r) => r.partyKind === "existing").map((r) => r.partyId)),
];
for (const partyId of existingParties) {
  const partyRuns = runs.filter((r) => r.partyId === partyId);
  const byCategory = new Map<string, Record<string, string>[]>();
  for (const r of partyRuns) {
    const arr = byCategory.get(r.resultCategory!) ?? [];
    arr.push(r);
    byCategory.set(r.resultCategory!, arr);
  }
  const categories = [...byCategory.keys()];
  for (let i = 0; i < Math.min(3, categories.length); i += 1) {
    add(byCategory.get(categories[i]!)?.[0]);
  }
}

// 2 per custom profile
const customProfiles = [
  ...new Set(runs.filter((r) => r.partyKind === "custom").map((r) => r.partyProfile)),
];
for (const profile of customProfiles) {
  const profileRuns = runs.filter((r) => r.partyProfile === profile);
  for (const r of pickN(profileRuns, 2)) add(r);
}

// Guaranteed feature coverage (section 6): rare event, alliance, opponent
// conflict, chain, ideology shift, second round, comeback, collapse.
add(runs.find((r) => bool(r.rareEventEncountered)));
add(runs.find((r) => Number(r.alliancesFormed) > 0));
add(runs.find((r) => bool(r.hasOpponentConflict)));
add(runs.find((r) => bool(r.hasChainEvent)));
add(runs.find((r) => Number(r.ideologyMovementTotal) >= 40));
add(runs.find((r) => bool(r.secondRoundReached) && bool(r.won)));
add(runs.find((r) => bool(r.secondRoundReached) && !bool(r.won)));
add(runs.find((r) => bool(r.isComeback)));
add(runs.find((r) => bool(r.isCollapse)));
for (const cat of new Set(runs.map((r) => r.resultCategory))) {
  add(runs.find((r) => r.resultCategory === cat));
}

const selectedRuns = [...selected.values()];

await mkdir(TIMELINE_DIR, { recursive: true });
const index: string[] = [
  "# Index des chronologies qualitatives sélectionnées",
  "",
  `${selectedRuns.length} parties sélectionnées sur un corpus de ${runs.length}. Chaque fichier contient la chronologie complète (texte réel des événements, options non choisies, conséquence, sondage avant/après, intensité dramatique estimée).`,
  "",
];
for (const run of selectedRuns) {
  const fileName = fileNameFor(run);
  await writeFile(resolve(TIMELINE_DIR, fileName), renderTimeline(run), "utf8");
  index.push(
    `- [\`${fileName}\`](./${fileName}) — ${run.partyProfile}/${run.agent}, ${run.resultCategory}, score ${run.finalScore}${bool(run.rareEventEncountered) ? ", rare" : ""}${bool(run.secondRoundReached) ? ", 2nd tour" : ""}`,
  );
}
await writeFile(resolve(TIMELINE_DIR, "README.md"), index.join("\n"), "utf8");

console.log(
  JSON.stringify(
    {
      timelinesWritten: selectedRuns.length,
      byResultCategory: Object.fromEntries(
        [...new Set(selectedRuns.map((r) => r.resultCategory))].map((cat) => [
          cat,
          selectedRuns.filter((r) => r.resultCategory === cat).length,
        ]),
      ),
      partiesRepresented: [...new Set(selectedRuns.map((r) => r.partyProfile))].length,
    },
    null,
    2,
  ),
);
