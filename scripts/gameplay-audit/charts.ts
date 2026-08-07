/**
 * Gameplay audit — charts (PROMPT_CLAUDE_CODE_AUDIT_GAMEPLAY_FUN.md section
 * 45). Reads the CSVs produced by generate-corpus.ts/analyze.ts; writes
 * self-contained SVGs (no charting dependency) to audit-results/gameplay/charts/.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { bool, num, parseCsv, str } from "../audit-post/lib/csv";
import { barChart, groupedBarChart, scatterChart } from "../audit-post/lib/svg-charts";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/gameplay");
const CHART_DIR = resolve(OUT_DIR, "charts");

async function readCsv(name: string): Promise<Record<string, string>[]> {
  return parseCsv(await readFile(resolve(OUT_DIR, name), "utf8"));
}
async function save(fileName: string, svg: string) {
  await writeFile(resolve(CHART_DIR, fileName), svg, "utf8");
}
function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

await mkdir(CHART_DIR, { recursive: true });

const runs = await readCsv("runs.csv");
const choices = await readCsv("choices.csv");
const N = runs.length;
const COMMIT = process.env.AUDIT_COMMIT ?? "n/a";
const subtitle = (extra = "") => `n = ${N} parties · commit ${COMMIT}${extra ? " · " + extra : ""}`;
const PALETTE = [
  "#3b6ea5",
  "#5a9367",
  "#c9a24b",
  "#a5507a",
  "#9aa5ad",
  "#7a5ea8",
  "#e08e45",
  "#3a9ba0",
  "#8a405d",
  "#4a7c59",
  "#b06a3b",
  "#5a5a8a",
];

// 1. Intensité dramatique moyenne selon la progression de la campagne (déciles)
{
  const byRun = new Map<string, Record<string, string>[]>();
  for (const c of choices) {
    const arr = byRun.get(c.runKey!) ?? [];
    arr.push(c);
    byRun.set(c.runKey!, arr);
  }
  const deciles: number[][] = Array.from({ length: 10 }, () => []);
  for (const runChoices of byRun.values()) {
    const ordered = [...runChoices].sort((a, b) => num(a.decisionIndex) - num(b.decisionIndex));
    const total = ordered.length;
    ordered.forEach((c, i) => {
      const decile = Math.min(9, Math.floor((i / total) * 10));
      deciles[decile]!.push(num(c.intensityEstimate));
    });
  }
  await save(
    "01-intensite-dramatique-par-progression.svg",
    barChart({
      title: "Intensité dramatique moyenne selon la progression de la campagne",
      subtitle: subtitle(
        "découpage en 10 déciles de décisions, échelle 1 (anecdote) à 6 (tournant)",
      ),
      data: deciles.map((d, i) => ({
        label: `Décile ${i + 1}`,
        value: Number(mean(d).toFixed(2)),
      })),
      valueFormat: (v) => v.toFixed(2),
      maxValue: 6,
    }),
  );
}

// 2. Distribution du nombre de moments forts (intensité >= 5) par partie
{
  const byRun = new Map<string, { partyProfile: string; strong: number }>();
  for (const c of choices) {
    const key = c.runKey!;
    const entry = byRun.get(key) ?? { partyProfile: c.partyProfile!, strong: 0 };
    if (num(c.intensityEstimate) >= 5) entry.strong += 1;
    byRun.set(key, entry);
  }
  const byParty = new Map<string, number[]>();
  for (const { partyProfile, strong } of byRun.values()) {
    const arr = byParty.get(partyProfile) ?? [];
    arr.push(strong);
    byParty.set(partyProfile, arr);
  }
  const data = [...byParty.entries()]
    .map(([party, values]) => ({ label: party, value: Number(mean(values).toFixed(1)) }))
    .sort((a, b) => b.value - a.value);
  await save(
    "02-moments-forts-par-partie.svg",
    barChart({
      title: "Nombre moyen de moments forts (intensité ≥ 5/6) par partie",
      subtitle: subtitle(),
      data,
      valueFormat: (v) => `${v.toFixed(1)} moments`,
      width: 900,
    }),
  );
}

// 3. Moments morts par phase (dead-zones.csv)
{
  const deadZones = await readCsv("dead-zones.csv");
  const byPhase = new Map<string, number>();
  for (const z of deadZones) byPhase.set(z.phase!, (byPhase.get(z.phase!) ?? 0) + 1);
  const data = [...byPhase.entries()]
    .map(([phase, count]) => ({ label: phase, value: count }))
    .sort((a, b) => b.value - a.value);
  await save(
    "03-moments-morts-par-phase.svg",
    barChart({
      title: "Séquences de 3+ décisions à faible enjeu (intensité ≤ 2/6), par phase",
      subtitle: subtitle(`${deadZones.length} séquences détectées au total sur le corpus`),
      data: data.length ? data : [{ label: "Aucune séquence détectée", value: 0 }],
      valueFormat: (v) => `${v} séquences`,
    }),
  );
}

// 4. Longueur moyenne des textes par type d'événement
{
  const byCategory = new Map<string, number[]>();
  for (const c of choices) {
    const arr = byCategory.get(c.eventCategory!) ?? [];
    arr.push(num(c.narrativeLength));
    byCategory.set(c.eventCategory!, arr);
  }
  const data = [...byCategory.entries()]
    .map(([cat, values]) => ({ label: cat, value: Number(mean(values).toFixed(0)) }))
    .sort((a, b) => b.value - a.value);
  await save(
    "04-longueur-textes-par-categorie.svg",
    barChart({
      title: "Longueur moyenne du texte de conséquence, par catégorie d'événement",
      subtitle: subtitle("nombre de caractères"),
      data,
      valueFormat: (v) => `${v.toFixed(0)} car.`,
    }),
  );
}

// 5. Répétition cognitive par catégorie
{
  const rows = await readCsv("cognitive-repetition.csv");
  await save(
    "05-repetition-cognitive-par-categorie.svg",
    groupedBarChart({
      title: "Répétition cognitive par catégorie d'événement",
      subtitle: subtitle(
        "part des décisions · nombre de parties avec 3+ décisions consécutives de la même catégorie",
      ),
      categories: rows.map((r) => str(r.category)),
      series: [
        {
          name: "Part des décisions (%)",
          color: "#3b6ea5",
          values: rows.map((r) => Number((num(r.shareOfAllDecisions) * 100).toFixed(1))),
        },
        {
          name: "Parties avec séquence 3+",
          color: "#c9a24b",
          values: rows.map((r) => num(r.runsWithSequenceOf3Plus)),
        },
      ],
      valueFormat: (v) => v.toFixed(1),
      width: 900,
    }),
  );
}

// 6. Jaccard d'événements entre parties (même parti vs partis différents)
{
  const overlap = await readCsv("cross-party-overlap.csv");
  await save(
    "06-jaccard-evenements-entre-parties.svg",
    barChart({
      title: "Recouvrement des événements rencontrés : même parti vs partis différents",
      subtitle: subtitle(
        "indice de Jaccard moyen sur l'ensemble des événements rencontrés par partie",
      ),
      data: overlap.map((r) => ({
        label:
          r.grouping === "same_party" ? "Même parti (graines différentes)" : "Partis différents",
        value: Number(num(r.meanEventJaccard).toFixed(3)),
      })),
      valueFormat: (v) => v.toFixed(3),
      maxValue: 1,
    }),
  );
}

// 7. Diversité par parti (nombre de catégories distinctes rencontrées + score final)
{
  const partyIdentity = await readCsv("party-identity.csv");
  await save(
    "07-diversite-par-parti.svg",
    groupedBarChart({
      title: "Profil par parti : score final moyen et mouvement idéologique moyen",
      subtitle: subtitle("test de différenciation — un parti masqué doit rester reconnaissable"),
      categories: partyIdentity.map((r) => str(r.partyProfile)),
      series: [
        {
          name: "Score final moyen",
          color: "#5a9367",
          values: partyIdentity.map((r) => num(r.avgFinalScore)),
        },
        {
          name: "Mouvement idéologique moyen",
          color: "#a5507a",
          values: partyIdentity.map((r) => num(r.avgIdeologyMovement)),
        },
      ],
      valueFormat: (v) => v.toFixed(1),
      width: 980,
    }),
  );
}

// 8. Trajectoires de sondage représentatives
{
  const polls = await readCsv("poll-trajectories.csv");
  const byRun = new Map<string, { x: number; y: number }[]>();
  for (const p of polls) {
    const arr = byRun.get(p.runKey!) ?? [];
    arr.push({ x: num(p.decisionIndex), y: num(p.playerPolling) });
    byRun.set(p.runKey!, arr);
  }
  const sampledRuns = [...byRun.entries()].slice(0, 12);
  const points = sampledRuns.flatMap(([, series], idx) =>
    series.map((p) => ({ x: p.x, y: p.y, color: PALETTE[idx % PALETTE.length] })),
  );
  await save(
    "08-trajectoires-sondage-representatives.svg",
    scatterChart({
      title: "Trajectoires de sondage (parti) — échantillon représentatif",
      subtitle: subtitle(
        `${sampledRuns.length} parties, une couleur par partie, un point par décision`,
      ),
      points,
      xLabel: "Index de décision",
      yLabel: "Sondage du parti (%)",
    }),
  );
}

// 9. Fréquence des catégories d'événements
{
  const rows = await readCsv("cognitive-repetition.csv");
  await save(
    "09-frequence-categories.svg",
    barChart({
      title: "Fréquence des catégories d'événements rencontrées",
      subtitle: subtitle(),
      data: rows.map((r) => ({ label: str(r.category), value: num(r.occurrences) })),
      valueFormat: (v) => `${v} décisions`,
    }),
  );
}

// 10. Choix dominants (top 15 par part de sélection, parmi événements fréquents)
{
  const rows = await readCsv("dominant-choices.csv");
  const top = rows
    .filter((r) => bool(r.dominant))
    .sort((a, b) => num(b.timesEncounteredTotal) - num(a.timesEncounteredTotal))
    .slice(0, 15);
  await save(
    "10-choix-dominants.svg",
    barChart({
      title: "Choix dominants (sélectionnés dans plus de 80% des rencontres, événements n≥8)",
      subtitle: subtitle(
        `${rows.filter((r) => bool(r.dominant)).length} choix dominants détectés sur ${rows.length} paires événement/option évaluées`,
      ),
      data: top.map((r) => ({
        label: `${r.eventTitle} — ${r.choiceLabel}`.slice(0, 60),
        value: Number((num(r.selectionShare) * 100).toFixed(1)),
      })),
      valueFormat: (v) => `${v.toFixed(0)}%`,
      maxValue: 100,
      width: 900,
      barHeight: 18,
    }),
  );
}

// 11. Mémoire et callbacks — proxy (souvenirs d'acteurs, déclarations, contradictions par partie)
{
  const parties = [...new Set(runs.map((r) => r.partyProfile))];
  const data = parties
    .map((party) => {
      const partyRuns = runs.filter((r) => r.partyProfile === party);
      return {
        label: party!,
        value: Number(mean(partyRuns.map((r) => num(r.actorMemoryEntries))).toFixed(2)),
      };
    })
    .sort((a, b) => b.value - a.value);
  await save(
    "11-memoire-callbacks-par-partie.svg",
    barChart({
      title: "Souvenirs d'acteurs accumulés en moyenne par partie (proxy de callback)",
      subtitle: subtitle(
        "un flag technique sans callback narratif visible ne compte pas comme mémoire gameplay (lecture qualitative section 41)",
      ),
      data,
      valueFormat: (v) => v.toFixed(1),
      width: 900,
    }),
  );
}

// 12. Distribution des scores finaux
{
  const finalScores = await readCsv("final-scores.csv");
  const byCategory = finalScores.filter((r) => r.grouping === "resultCategory");
  await save(
    "12-distribution-scores-finaux.svg",
    groupedBarChart({
      title: "Score final /100 par catégorie de résultat",
      subtitle: subtitle("moyenne ± écart-type"),
      categories: byCategory.map((r) => str(r.key)),
      series: [
        { name: "Moyenne", color: "#3b6ea5", values: byCategory.map((r) => num(r.mean)) },
        { name: "Écart-type", color: "#c9a24b", values: byCategory.map((r) => num(r.stddev)) },
      ],
      valueFormat: (v) => v.toFixed(1),
      width: 900,
    }),
  );
}

console.log(JSON.stringify({ chartsWritten: 12, outputDir: CHART_DIR }, null, 2));
