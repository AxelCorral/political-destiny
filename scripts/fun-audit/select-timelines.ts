/**
 * Fun/replayability audit — readable timeline selection and rendering
 * (PROMPT_CLAUDE_CODE_AUDIT_FUN_REJOUABILITE.md, sections 18, 29).
 *
 * run-summaries.csv/decisions.csv only store text LENGTHS (54k decisions of
 * full narrative text would be unmanageably large). For the ~70 timelines
 * actually selected here, the exact same (party, profile, seedIndex) is
 * re-run through the real engine — deterministic, so this reproduces the
 * identical campaign already counted in the corpus — capturing full text
 * this time. No reimplementation, no new randomness.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { num, parseCsv, str } from "../audit-post/lib/csv";
import { pickForProfile, type ProfileName } from "./lib/profiles";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/fun-audit");
const TIMELINE_DIR = resolve(OUT_DIR, "selected-timelines");

interface Step {
  decisionIndex: number;
  phase: string;
  eventTitle: string;
  eventSummary: string;
  category: string;
  choiceLabel: string;
  choiceTag: string;
  outcomeTitle: string;
  narrative: string;
  pollBefore: number;
  pollAfter: number;
  rankBefore: number;
  rankAfter: number;
  isRare: boolean;
  isChain: boolean;
}

function playerRank(
  state: import("../../src/game/types/index").GameState,
  partyId: string,
): number {
  const own = state.parties[partyId]?.stats.polling ?? 0;
  const higher = Object.values(state.parties).filter(
    (p) => p.active && p.id !== partyId && p.stats.polling > own,
  ).length;
  return higher + 1;
}

function replay(partyId: string, profile: ProfileName, seedIndex: number, seedPrefix: string) {
  const seed = `${seedPrefix}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state = createGame(
    { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  const steps: Step[] = [];
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const beforePolling = state.parties[partyId]?.stats.polling ?? 0;
    const beforeRank = playerRank(state, partyId);
    const choice = pickForProfile(state, event, profile, seed);
    const resolution = resolveCurrentChoice(state, choice.id, gameContent);
    state = resolution.state;
    const record = state.decisionHistory[state.decisionHistory.length - 1];
    if (record) {
      steps.push({
        decisionIndex: record.decisionIndex,
        phase: state.phase,
        eventTitle: event.title,
        eventSummary: event.summary,
        category: event.category,
        choiceLabel: record.choiceLabel,
        choiceTag: record.choiceTag ?? "",
        outcomeTitle: record.outcomeTitle,
        narrative: record.narrative,
        pollBefore: Number(beforePolling.toFixed(1)),
        pollAfter: Number((state.parties[partyId]?.stats.polling ?? 0).toFixed(1)),
        rankBefore: beforeRank,
        rankAfter: playerRank(state, partyId),
        isRare: event.rarity !== "common" && event.rarity !== "uncommon",
        isChain: Boolean(event.chain),
      });
    }
    guard += 1;
  }
  return { state, steps };
}

function renderMarkdown(
  category: string,
  partyId: string,
  profile: string,
  seedIndex: number,
  run: Record<string, string>,
  steps: Step[],
): string {
  const lines: string[] = [];
  lines.push(`# ${partyId} — ${profile} — graine ${seedIndex}`);
  lines.push("");
  lines.push(`Catégorie de sélection : **${category}**`);
  lines.push("");
  lines.push(
    `Score final : ${run.finalScore}/100 · 1er tour : ${run.firstRoundScore} · ${
      run.secondRoundScore ? `2nd tour : ${run.secondRoundScore} · ` : ""
    }qualifié : ${run.qualified} · vainqueur : ${run.won} · signaux mémorables : ${run.memorableSignalCount}`,
  );
  lines.push("");
  for (const step of steps) {
    const markers = [step.isRare ? "RARE" : "", step.isChain ? "CHAÎNE" : ""]
      .filter(Boolean)
      .join(" · ");
    lines.push(
      `## ${step.decisionIndex}. ${step.eventTitle} ${markers ? `_(${markers})_` : ""} — _${step.phase}/${step.category}_`,
    );
    lines.push("");
    lines.push(step.eventSummary);
    lines.push("");
    lines.push(
      `> **Choix retenu :** ${step.choiceLabel}${step.choiceTag ? ` [${step.choiceTag}]` : ""}`,
    );
    lines.push("");
    lines.push(`**${step.outcomeTitle}** — ${step.narrative}`);
    lines.push("");
    lines.push(
      `Sondage : ${step.pollBefore} → ${step.pollAfter} (rang ${step.rankBefore} → ${step.rankAfter})`,
    );
    lines.push("");
  }
  return lines.join("\n");
}

async function loadCsv(name: string): Promise<Record<string, string>[]> {
  return parseCsv(await readFile(resolve(OUT_DIR, name), "utf8"));
}

function bool(v: string | undefined): boolean {
  return v === "true";
}

function slug(s: string): string {
  return s.replace(/[^a-z0-9_-]/gi, "-");
}

async function main() {
  await mkdir(TIMELINE_DIR, { recursive: true });
  const runs = (await loadCsv("run-summaries.csv")).filter((r) => str(r.partyKind) === "existing");

  function hashIndex(runKey: string, mod: number): number {
    let h = 0;
    for (let i = 0; i < runKey.length; i += 1) h = (h * 31 + runKey.charCodeAt(i)) >>> 0;
    return h % mod;
  }

  const categorized: Array<{ category: string; run: Record<string, string> }> = [];
  const used = new Set<string>();
  function pick(category: string, pool: Record<string, string>[], count: number) {
    const shuffled = [...pool].sort(
      (a, b) =>
        hashIndex(`${category}:${str(a.runKey)}`, 100003) -
        hashIndex(`${category}:${str(b.runKey)}`, 100003),
    );
    let picked = 0;
    for (const r of shuffled) {
      if (picked >= count) break;
      if (used.has(str(r.runKey))) continue;
      used.add(str(r.runKey));
      categorized.push({ category, run: r });
      picked += 1;
    }
  }

  pick("aleatoire", runs, 10);
  pick(
    "tres_serree",
    runs.filter((r) => r.secondRoundScore !== "" && Math.abs(num(r.secondRoundScore) - 50) <= 3),
    10,
  );
  pick(
    "victoire",
    runs.filter((r) => bool(r.won)),
    10,
  );
  pick(
    "defaite",
    runs.filter((r) => !bool(r.won)),
    10,
  );
  pick(
    "outsider_performant",
    runs.filter((r) => num(r.startingPolling) <= 8 && (bool(r.won) || num(r.finalScore) >= 65)),
    5,
  );
  pick(
    "favori_en_difficulte",
    runs.filter((r) => num(r.startingPolling) >= 14 && (!bool(r.qualified) || bool(r.isCollapse))),
    5,
  );
  pick(
    "riche_evenements_rares",
    runs.filter((r) => num(r.rareEventCount) >= 2),
    5,
  );
  pick(
    "chaotique",
    runs.filter((r) => str(r.profile) === "chaos"),
    5,
  );

  // Fun-proxy score across the FULL existing-party corpus, for top/bottom 10.
  function funProxy(r: Record<string, string>): number {
    return (
      num(r.memorableSignalCount) * 3 +
      num(r.rareEventCount) * 2 +
      num(r.qualificationZoneCrossings) * 1.5 -
      num(r.weakCardCount) * 0.5
    );
  }
  const ranked = [...runs].sort((a, b) => funProxy(b) - funProxy(a));
  const top10 = ranked.slice(0, 10);
  const bottom10 = [...ranked].sort((a, b) => funProxy(a) - funProxy(b)).slice(0, 10);
  for (const r of top10)
    if (!used.has(str(r.runKey))) categorized.push({ category: "top10_fun", run: r });
  for (const r of bottom10)
    if (!used.has(str(r.runKey)) || categorized.every((c) => str(c.run.runKey) !== str(r.runKey)))
      categorized.push({ category: "bottom10_fun", run: r });

  const index: Array<{
    file: string;
    category: string;
    partyId: string;
    profile: string;
    seedIndex: number;
    funProxy: number;
  }> = [];
  for (const { category, run } of categorized) {
    const partyId = str(run.partyId);
    const profile = str(run.profile) as ProfileName;
    const seedIndex = num(run.seedIndex);
    const { steps } = replay(partyId, profile, seedIndex, "fun-audit");
    const md = renderMarkdown(category, partyId, profile, seedIndex, run, steps);
    const filename = `${slug(category)}__${partyId}__${profile}__seed${seedIndex}.md`;
    await writeFile(resolve(TIMELINE_DIR, filename), md, "utf8");
    index.push({
      file: filename,
      category,
      partyId,
      profile,
      seedIndex,
      funProxy: Number(funProxy(run).toFixed(2)),
    });
  }

  await writeFile(resolve(TIMELINE_DIR, "INDEX.json"), JSON.stringify(index, null, 2), "utf8");
  console.log(
    JSON.stringify(
      {
        totalTimelines: index.length,
        byCategory: Object.fromEntries(
          [...new Set(index.map((i) => i.category))].map((c) => [
            c,
            index.filter((i) => i.category === c).length,
          ]),
        ),
      },
      null,
      2,
    ),
  );
}

await main();
