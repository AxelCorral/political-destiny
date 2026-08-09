/**
 * Fun/replayability audit — chart generation (section 37).
 * Reads the CSV/JSON already produced by analyze.ts and renders the 12
 * requested charts as dependency-free SVG (same lib already used by
 * scripts/audit-post/charts.ts and scripts/gameplay-audit/charts.ts).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { num, parseCsv, str } from "../audit-post/lib/csv";
import { barChart, groupedBarChart, scatterChart } from "../audit-post/lib/svg-charts";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/fun-audit");
const CHART_DIR = resolve(OUT_DIR, "charts");

async function loadCsv(name: string): Promise<Record<string, string>[]> {
  return parseCsv(await readFile(resolve(OUT_DIR, name), "utf8"));
}

async function main() {
  await mkdir(CHART_DIR, { recursive: true });

  const partyFun = await loadCsv("party-fun.csv");
  const tension = await loadCsv("tension.csv");
  const pacing = await loadCsv("pacing.csv");
  const comeback = (await loadCsv("comeback.csv")).filter((r) => str(r.partyId) !== "ALL");
  const replayability = await loadCsv("replayability.csv");
  const summary = JSON.parse(await readFile(resolve(OUT_DIR, "summary.json"), "utf8"));
  const narrativeDensity = await loadCsv("narrative-density.csv");
  const partySimilarity = await loadCsv("party-similarity.csv");
  const lowIntensity = (await loadCsv("low-intensity-streaks.csv")).filter(
    (r) => str(r.partyId) !== "ALL",
  );
  const secondRoundFun = await loadCsv("second-round-fun.csv");
  const abSummary: Array<Record<string, unknown>> = JSON.parse(
    await readFile(resolve(OUT_DIR, "ab-summary.json"), "utf8"),
  );

  // 1. Fun score par parti
  await writeFile(
    resolve(CHART_DIR, "01-fun-score-par-parti.svg"),
    barChart({
      title: "Score de fun par parti (/100)",
      subtitle: "Formule composite section 27 — outil comparatif, pas une mesure du plaisir humain",
      data: partyFun
        .map((r) => ({ label: str(r.partyId), value: num(r.funScore100) }))
        .sort((a, b) => b.value - a.value),
      valueFormat: (v) => v.toFixed(1),
    }),
    "utf8",
  );

  // 2. Tension moyenne au fil de la campagne (taux de changement de rang par décile)
  await writeFile(
    resolve(CHART_DIR, "02-tension-au-fil-de-la-campagne.svg"),
    barChart({
      title: "Tension au fil de la campagne",
      subtitle: "Taux de décisions provoquant un changement de rang, par décile de progression",
      data: tension.map((r) => ({
        label: `Décile ${str(r.campaignDecile)}`,
        value: num(r.rankChangeRate) * 100,
      })),
      valueFormat: (v) => `${v.toFixed(1)} %`,
    }),
    "utf8",
  );

  // 3. Intensité des événements au fil de la campagne (par phase)
  await writeFile(
    resolve(CHART_DIR, "03-intensite-par-phase.svg"),
    barChart({
      title: "Intensité dramatique moyenne par phase",
      subtitle: "Échelle heuristique 1-6, mêmes principes que scripts/gameplay-audit",
      data: pacing.map((r) => ({ label: str(r.phase), value: num(r.meanIntensity) })),
      valueFormat: (v) => v.toFixed(2),
    }),
    "utf8",
  );

  // 4. Fréquence des retournements
  await writeFile(
    resolve(CHART_DIR, "04-frequence-retournements.svg"),
    barChart({
      title: "Part des campagnes avec au moins un retournement de qualification",
      subtitle: "Franchissement de la frontière top-2/hors top-2 au moins une fois, par parti",
      data: comeback
        .map((r) => ({ label: str(r.partyId), value: num(r.shareWithAtLeastOneReversal) * 100 }))
        .sort((a, b) => b.value - a.value),
      valueFormat: (v) => `${v.toFixed(0)} %`,
    }),
    "utf8",
  );

  // 5. Contenu nouveau selon le nombre de parties
  const byGamesPlayed = new Map<number, number[]>();
  for (const r of replayability) {
    const g = num(r.gamesPlayed);
    if (!byGamesPlayed.has(g)) byGamesPlayed.set(g, []);
    byGamesPlayed.get(g)!.push(num(r.newContentShareThisGame));
  }
  await writeFile(
    resolve(CHART_DIR, "05-contenu-nouveau-vs-parties-jouees.svg"),
    barChart({
      title: "Part de contenu réellement nouveau selon le nombre de parties déjà jouées",
      subtitle: "Moyenne des 9 partis existants, profil « référence neutre », graines successives",
      data: [...byGamesPlayed.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([g, values]) => ({
          label: `Partie n°${g}`,
          value: (values.reduce((s, v) => s + v, 0) / values.length) * 100,
        })),
      valueFormat: (v) => `${v.toFixed(0)} %`,
    }),
    "utf8",
  );

  // 6. Proportion d'événements aléatoires utiles/neutres/frustrants
  await writeFile(
    resolve(CHART_DIR, "06-valeur-evenements-aleatoires.svg"),
    barChart({
      title: "Événements des catégories « world »/« scandal » par valeur perçue",
      subtitle: "Classement relatif (tertiles du score composite), section 7",
      data: [
        { label: "Intéressant", value: summary.randomEventValue.interessant, color: "#2f8f5b" },
        { label: "Neutre", value: summary.randomEventValue.neutre, color: "#8a94a3" },
        { label: "Frustrant", value: summary.randomEventValue.frustrant, color: "#b3413a" },
      ],
      valueFormat: (v) => `${v} événements`,
    }),
    "utf8",
  );

  // 7. Score de narrativité (densité de signaux mémorables par partie)
  await writeFile(
    resolve(CHART_DIR, "07-narrativite-par-parti.svg"),
    barChart({
      title: "Densité moyenne de signaux « histoire racontable » par campagne",
      subtitle: "Nombre moyen de signaux section 18 présents par partie, par parti (max 13)",
      data: narrativeDensity
        .map((r) => ({ label: str(r.partyId), value: num(r.meanMemorableSignals) }))
        .sort((a, b) => b.value - a.value),
      valueFormat: (v) => v.toFixed(2),
    }),
    "utf8",
  );

  // 8. Similarité entre partis (paires triées)
  await writeFile(
    resolve(CHART_DIR, "08-similarite-entre-partis.svg"),
    barChart({
      title:
        "Similarité inter-partis (indice de Jaccard des événements rencontrés, par partie jouée)",
      subtitle:
        "36 paires de partis, graine et profil appariés — plus haut = expériences plus proches",
      width: 900,
      data: partySimilarity
        .map((r) => ({
          label: `${str(r.partyA)} / ${str(r.partyB)}`,
          value: num(r.crossPartyGameJaccard),
        }))
        .sort((a, b) => b.value - a.value),
      valueFormat: (v) => v.toFixed(3),
    }),
    "utf8",
  );

  // 9. Fun favoris vs outsiders (scatter qualification x fun)
  await writeFile(
    resolve(CHART_DIR, "09-fun-favoris-vs-outsiders.svg"),
    scatterChart({
      title: "Score de fun en fonction de la facilité de qualification",
      subtitle:
        "Chaque point = un parti. Une corrélation positive nette indiquerait « plus facile = plus amusant »",
      xLabel: "Taux de qualification (favori →)",
      yLabel: "Score de fun /100",
      points: partyFun.map((r) => ({ x: num(r.qualificationRate) * 100, y: num(r.funScore100) })),
    }),
    "utf8",
  );

  // 10. Cartes faibles consécutives
  await writeFile(
    resolve(CHART_DIR, "10-cartes-faibles-consecutives.svg"),
    barChart({
      title: "Longueur moyenne de la plus longue série de « cartes faibles » par campagne",
      subtitle: "Carte faible = intensité <=2, hors chaîne/rare, variation de sondage < 1,2 point",
      data: lowIntensity
        .map((r) => ({ label: str(r.partyId), value: num(r.meanMaxStreak) }))
        .sort((a, b) => b.value - a.value),
      valueFormat: (v) => v.toFixed(2),
    }),
    "utf8",
  );

  // 11. Fun du premier tour vs second tour (intensité par parti)
  await writeFile(
    resolve(CHART_DIR, "11-intensite-premier-vs-second-tour.svg"),
    groupedBarChart({
      title: "Intensité dramatique moyenne : avant qualification vs. entre les deux tours",
      subtitle: "Par parti, échelle heuristique 1-6",
      categories: secondRoundFun.map((r) => str(r.partyId)),
      series: [
        {
          name: "Avant le 1er tour",
          color: "#3b6ea5",
          values: secondRoundFun.map((r) => num(r.meanIntensityFirstRound)),
        },
        {
          name: "Entre les deux tours",
          color: "#c76b3f",
          values: secondRoundFun.map((r) => num(r.meanIntensitySecondRound)),
        },
      ],
    }),
    "utf8",
  );

  // 12. Impact A/B des systèmes narratifs
  await writeFile(
    resolve(CHART_DIR, "12-impact-ab-systemes-narratifs.svg"),
    barChart({
      title: "Part des campagnes dont l'issue change quand un système est retiré",
      subtitle:
        "A/B appariés (même parti/profil/graine), section 26 — qualification et/ou victoire différente",
      data: abSummary.map((r) => ({
        label: String(r.variantB).replace(/_/g, " "),
        value: (r.outcomeChangedShare as number) * 100,
      })),
      valueFormat: (v) => `${v.toFixed(1)} %`,
    }),
    "utf8",
  );

  console.log("12 charts written to", CHART_DIR);
}

await main();
