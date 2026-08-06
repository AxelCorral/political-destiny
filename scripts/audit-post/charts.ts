/* eslint-disable @typescript-eslint/no-explicit-any -- reads heterogeneous generated JSON reports */
/**
 * Post-corrections audit — charts (section 23). Reads the outputs of
 * catalog-audit.ts, simulate.ts and analyze.ts; writes self-contained SVGs
 * (no charting dependency) to audit-results/charts/.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { bool, num, parseCsv, str } from "./lib/csv";
import { barChart, groupedBarChart, scatterChart } from "./lib/svg-charts";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results");
const CHART_DIR = resolve(OUT_DIR, "charts");

async function readJson<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(resolve(OUT_DIR, name), "utf8")) as T;
}
async function readCsv(name: string): Promise<Record<string, string>[]> {
  return parseCsv(await readFile(resolve(OUT_DIR, name), "utf8"));
}

const summary = await readJson<any>("summary.json");
const catalog = await readJson<any>("catalog-summary.json");
const rawRuns = await readCsv("raw-runs.csv");
const existingRuns = rawRuns.filter((r) => r.partyKind === "existing");

const COMMIT = process.env.AUDIT_COMMIT ?? "n/a";
const N = existingRuns.length;
const subtitle = (extra = "") =>
  `n = ${N} campagnes existantes · commit ${COMMIT}${extra ? " · " + extra : ""}`;

await mkdir(CHART_DIR, { recursive: true });
async function save(fileName: string, svg: string) {
  await writeFile(resolve(CHART_DIR, fileName), svg, "utf8");
}

// 1. Variance expliquée par facteur (eta^2 sur le score du premier tour)
{
  const row = summary.varianceDecomposition.anovaByMetric.find(
    (r: any) => r.metric === "firstRoundScore",
  );
  await save(
    "01-variance-expliquee-par-facteur.svg",
    barChart({
      title: "Variance expliquée par facteur — score au premier tour",
      subtitle: subtitle("η², décomposition ANOVA à deux facteurs parti×agent"),
      data: [
        { label: "Parti", value: row.etaSquaredParty, color: "#3b6ea5" },
        { label: "Agent (stratégie)", value: row.etaSquaredAgent, color: "#5a9367" },
        { label: "Interaction parti×agent", value: row.etaSquaredInteraction, color: "#c9a24b" },
        { label: "Résiduel (événements/seed)", value: row.etaSquaredResidual, color: "#9aa5ad" },
      ],
      valueFormat: (v) => `${(v * 100).toFixed(1)} %`,
      maxValue: 1,
    }),
  );
}

// 2. Distribution des scores par parti (moyenne + p05-p95 en libellé)
{
  const parties = [...new Set(existingRuns.map((r) => r.partyId))].sort();
  const data = parties.map((party) => {
    const scores = existingRuns
      .filter((r) => r.partyId === party)
      .map((r) => num(r.firstRoundScore));
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return { label: str(party), value: Number(mean.toFixed(2)) };
  });
  await save(
    "02-distribution-scores-par-parti.svg",
    barChart({
      title: "Score moyen au premier tour par parti",
      subtitle: subtitle(),
      data: data.sort((a, b) => b.value - a.value),
      valueFormat: (v) => `${v.toFixed(1)} %`,
    }),
  );
}

// 3. Distribution des scores par agent
{
  const agents = [...new Set(existingRuns.map((r) => r.agent))].sort();
  const data = agents.map((agent) => {
    const scores = existingRuns.filter((r) => r.agent === agent).map((r) => num(r.firstRoundScore));
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return { label: str(agent), value: Number(mean.toFixed(2)) };
  });
  await save(
    "03-distribution-scores-par-agent.svg",
    barChart({
      title: "Score moyen au premier tour par agent de décision",
      subtitle: subtitle(),
      data: data.sort((a, b) => b.value - a.value),
      valueFormat: (v) => `${v.toFixed(1)} %`,
    }),
  );
}

// 4. Comparaison des trajectoires contrefactuelles (écart moyen par horizon)
if (summary.counterfactualBranching?.available) {
  const b = summary.counterfactualBranching;
  await save(
    "04-divergence-contrefactuelle-par-horizon.svg",
    barChart({
      title: "Divergence contrefactuelle moyenne selon l'horizon",
      subtitle: subtitle(
        `${b.totalBranches} branches, ${b.branchGroups} groupes, même état initial`,
      ),
      data: [
        { label: "Immédiat (sondage, pts)", value: b.averagePlus0Range ?? 0, color: "#9aa5ad" },
        { label: "+3 décisions", value: b.averagePlus3Range ?? 0, color: "#5a9367" },
        { label: "+8 décisions", value: b.averagePlus8Range ?? 0, color: "#c9a24b" },
        { label: "1er tour (fin)", value: b.averageFirstRoundRange ?? 0, color: "#3b6ea5" },
        { label: "Score final /100", value: b.averageFinalScoreRange ?? 0, color: "#a5507a" },
      ],
      valueFormat: (v) => v.toFixed(3),
    }),
  );
}

// 5. Répétitions par partie (histogram of repeatedTitlesExact)
{
  const counts = existingRuns.map((r) => num(r.repeatedTitlesExact));
  const buckets = new Map<number, number>();
  for (const c of counts) buckets.set(c, (buckets.get(c) ?? 0) + 1);
  const data = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, 12)
    .map(([titlesRepeated, runCount]) => ({
      label: `${titlesRepeated} titre(s) répété(s)`,
      value: runCount,
    }));
  await save(
    "05-repetitions-par-partie.svg",
    barChart({
      title: "Titres d'événements répétés au sein d'une même campagne",
      subtitle: subtitle("nombre de campagnes par nombre de répétitions exactes"),
      data,
      valueFormat: (v) => `${v} campagnes`,
    }),
  );
}

// 6. Taille des clusters de choix (lexicaux)
{
  const sizes: number[] = catalog.choiceGenericity.lexicalClusterSizes ?? [];
  await save(
    "06-taille-clusters-choix.svg",
    barChart({
      title: "Taille des 10 plus gros clusters lexicaux de choix",
      subtitle: subtitle(
        `seuil cosinus 0.62 · ${catalog.choiceGenericity.lexicalClusterCount} clusters au total`,
      ),
      data: sizes.length
        ? sizes.map((size, i) => ({ label: `Cluster ${i + 1}`, value: size }))
        : [{ label: "Aucun cluster ≥ 2 détecté", value: 0 }],
      valueFormat: (v) => `${v} choix`,
    }),
  );
}

// 7. Taille des clusters de conséquences
{
  const sizes: number[] = catalog.consequenceDiversity.narrativeLexicalClusterSizes ?? [];
  await save(
    "07-taille-clusters-consequences.svg",
    barChart({
      title: "Taille des 10 plus gros clusters lexicaux de récits de conséquence",
      subtitle: subtitle(
        `seuil cosinus 0.55 · ${catalog.consequenceDiversity.narrativeLexicalClusterCount} clusters au total`,
      ),
      data: sizes.length
        ? sizes.map((size, i) => ({ label: `Cluster ${i + 1}`, value: size }))
        : [{ label: "Aucun cluster ≥ 2 détecté", value: 0 }],
      valueFormat: (v) => `${v} récits`,
    }),
  );
}

// 8. Évolution idéologique par axe
{
  const byAxis = summary.ideology.byAxis as Array<{ axis: string; meanAbsMovement: number }>;
  await save(
    "08-evolution-ideologique-par-axe.svg",
    barChart({
      title: "Mouvement idéologique moyen (valeur absolue) par axe",
      subtitle: subtitle(),
      data: byAxis
        .map((r) => ({ label: r.axis, value: r.meanAbsMovement }))
        .sort((a, b) => b.value - a.value),
      valueFormat: (v) => `${v.toFixed(2)} pts`,
    }),
  );
}

// 9. Fréquence des événements rares
{
  const occurrences: Array<{ id: string; count: number }> = summary.rareEvents.occurrences ?? [];
  await save(
    "09-frequence-evenements-rares.svg",
    barChart({
      title: "Fréquence d'apparition des événements rares/légendaires/secrets",
      subtitle: subtitle(
        `${summary.rareEvents.totalRareEventsInCatalog} événements rares au catalogue, ${summary.rareEvents.neverReachedInThisSample.length} jamais atteints dans cet échantillon`,
      ),
      data: occurrences.slice(0, 15).map((r) => ({ label: r.id, value: r.count })),
      valueFormat: (v) => `${v} occurrences`,
    }),
  );
}

// 10. Relation score initial (sondage de départ) / score final
{
  const points = existingRuns.slice(0, 4000).map((r) => ({
    x: num(r.firstRoundScore),
    y: num(r.finalScore),
    color: bool(r.won) ? "#5a9367" : bool(r.qualified) ? "#c9a24b" : "#a5507a",
  }));
  await save(
    "10-relation-score-initial-score-final.svg",
    scatterChart({
      title: "Score au premier tour vs score final",
      subtitle: subtitle(
        "vert = victoire, or = qualifié sans victoire, rouge = éliminé au 1er tour",
      ),
      points,
      xLabel: "Score au premier tour (%)",
      yLabel: "Score final (/100)",
    }),
  );
}

// 11. Taux de qualification et de victoire par parti et par agent
{
  const parties = [...new Set(existingRuns.map((r) => str(r.partyId)))].sort();
  const qualRates = parties.map((p) => {
    const rows = existingRuns.filter((r) => r.partyId === p);
    return rows.filter((r) => bool(r.qualified)).length / rows.length;
  });
  const winRates = parties.map((p) => {
    const rows = existingRuns.filter((r) => r.partyId === p);
    return rows.filter((r) => bool(r.won)).length / rows.length;
  });
  await save(
    "11-taux-qualification-victoire-par-parti.svg",
    groupedBarChart({
      title: "Taux de qualification et de victoire par parti",
      subtitle: subtitle("toutes stratégies confondues"),
      categories: parties,
      series: [
        { name: "Qualification", color: "#3b6ea5", values: qualRates.map((v) => v * 100) },
        { name: "Victoire", color: "#5a9367", values: winRates.map((v) => v * 100) },
      ],
      valueFormat: (v) => `${v.toFixed(0)}%`,
    }),
  );
}

console.log(JSON.stringify({ chartsWritten: 11, outputDir: CHART_DIR }, null, 2));
