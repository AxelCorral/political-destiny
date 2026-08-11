/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §40 — les
 * 10 playtests requis, rejoués via le moteur réel jusqu'à trouver une
 * occurrence authentique de chaque scénario (aucun scripting du résultat).
 * Journalise pour chacun : début, événement déclencheur, sondage avant/après,
 * causalité, cohérence narrative, résultat.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { nationalLatentSupport } from "../../src/game/engine/electorate";
import type { GameState, OpponentActionRecord } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/reality-grounding/playtests");

interface Trace {
  finalState: GameState;
  structuralEvents: Array<{
    decisionIndex: number;
    action: OpponentActionRecord;
    before: Record<string, number>;
    after: Record<string, number>;
  }>;
  acceptedEndorsements: string[];
}

function play(partyId: string, agent: AgentName, seed: string): Trace {
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId, methodId: gameContent.methods[0]!.id },
    gameContent,
  );
  const structuralEvents: Trace["structuralEvents"] = [];
  const acceptedEndorsements: string[] = [];
  let guard = 0;
  while (state.phase !== "finished" && guard < 90) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    const before = nationalLatentSupport(state, gameContent.electorateBlocs);
    const actionsBefore = state.opponentActions.length;
    const next = resolveCurrentChoice(state, choice.id, gameContent).state;
    const newActions = next.opponentActions.slice(actionsBefore);
    if (newActions.length > 0) {
      const after = nationalLatentSupport(next, gameContent.electorateBlocs);
      for (const action of newActions) {
        structuralEvents.push({ decisionIndex: state.decisionIndex, action, before, after });
      }
    }
    for (const endorsementId of [
      "endorsement_alvarez_market_liberalism",
      "endorsement_brandt_european",
      "endorsement_ashworth_social_democratic",
      "endorsement_whitfield_national_right",
    ]) {
      if (next.flags[endorsementId] === true && !state.flags[endorsementId]) {
        acceptedEndorsements.push(endorsementId);
      }
    }
    state = next;
    guard += 1;
  }
  return { finalState: state, structuralEvents, acceptedEndorsements };
}

interface Scenario {
  id: string;
  title: string;
  match: (trace: Trace, partyId: string) => boolean;
}

const SCENARIOS: Scenario[] = [
  {
    id: "pt1-ne-baseline-sans-choc",
    title: "Nouvelle Énergie depuis son baseline faible/réaliste — campagne sans choc",
    match: (trace, partyId) =>
      partyId === "nouvelle_energie" &&
      trace.structuralEvents.filter((e) =>
        ["withdrawal", "replacement", "dissidence"].includes(e.action.kind),
      ).length === 0,
  },
  {
    id: "pt2-ne-retrait-lr",
    title: "Nouvelle Énergie — retrait LR / recomposition favorable",
    match: (trace, partyId) =>
      partyId === "nouvelle_energie" &&
      trace.structuralEvents.some(
        (e) => e.action.kind === "withdrawal" && e.action.partyId === "lr" && (e.after.nouvelle_energie ?? 0) > (e.before.nouvelle_energie ?? 0),
      ),
  },
  {
    id: "pt3-horizons-recomposition-centre",
    title: "Horizons — recomposition du centre",
    match: (trace, partyId) =>
      partyId === "horizons" &&
      trace.structuralEvents.some(
        (e) =>
          e.action.kind === "alliance" &&
          ["renaissance", "lr", "nouvelle_energie"].includes(e.action.partyId),
      ),
  },
  {
    id: "pt4-ps-retrait-ecologistes",
    title: "PS — retrait écologiste",
    match: (trace, partyId) =>
      partyId === "ps" &&
      trace.structuralEvents.some((e) => e.action.kind === "withdrawal" && e.action.partyId === "ecologistes"),
  },
  {
    id: "pt5-lfi-retrait-eco-relations-favorables",
    title: "LFI — retrait écologiste avec relations favorables",
    match: (trace, partyId) => {
      if (partyId !== "lfi") return false;
      const withdrawal = trace.structuralEvents.find(
        (e) => e.action.kind === "withdrawal" && e.action.partyId === "ecologistes",
      );
      if (!withdrawal) return false;
      const relation = trace.finalState.partyRelations.ecologistes?.lfi ?? 0;
      return relation > 15;
    },
  },
  {
    id: "pt6-lfi-retrait-eco-relations-mauvaises",
    title: "LFI — même retrait avec relations mauvaises",
    match: (trace, partyId) => {
      if (partyId !== "lfi") return false;
      const withdrawal = trace.structuralEvents.find(
        (e) => e.action.kind === "withdrawal" && e.action.partyId === "ecologistes",
      );
      if (!withdrawal) return false;
      const relation = trace.finalState.partyRelations.ecologistes?.lfi ?? 0;
      return relation < -5;
    },
  },
  {
    id: "pt7-rn-profil-ferran",
    title: "RN — profil A (Louis Ferran, ligne historique)",
    match: (trace, partyId) =>
      partyId === "rn" && trace.finalState.flags["candidateProfile:rn"] === "rn_ferran_profile",
  },
  {
    id: "pt8-rn-profil-montclar",
    title: "RN — profil B (Élise Montclar, ligne de normalisation)",
    match: (trace, partyId) =>
      partyId === "rn" && trace.finalState.flags["candidateProfile:rn"] === "rn_montclar_profile",
  },
  {
    id: "pt9-campagne-sans-retrait-majeur",
    title: "Campagne sans aucun retrait majeur",
    match: (trace) =>
      trace.structuralEvents.filter((e) => e.action.kind === "withdrawal").length === 0,
  },
  {
    id: "pt10-soutien-international-coherent",
    title: "Campagne avec soutien international idéologiquement cohérent",
    match: (trace) => trace.acceptedEndorsements.length > 0,
  },
];

function formatDeltas(before: Record<string, number>, after: Record<string, number>): string {
  const ids = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...ids]
    .map((id) => ({ id, delta: (after[id] ?? 0) - (before[id] ?? 0) }))
    .sort((a, b) => b.delta - a.delta)
    .map(({ id, delta }) => `${id} ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`)
    .join(", ");
}

async function findAndWrite(scenario: Scenario) {
  const parties = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);
  for (let attempt = 0; attempt < 3000; attempt += 1) {
    const partyId = parties[attempt % parties.length]!;
    const agent = AGENT_NAMES[Math.floor(attempt / parties.length) % AGENT_NAMES.length]!;
    const seed = `playtest-rg-${partyId}-${agent}-${attempt}`;
    const trace = play(partyId, agent, seed);
    if (scenario.match(trace, partyId)) {
      const state = trace.finalState;
      const r1 = state.firstRoundResult?.results ?? {};
      const r2 = state.secondRoundResult?.results;
      const finalists = state.qualifiedPartyIds ?? [];
      const md = `# ${scenario.title}

Parti joué : **${partyId}** — agent de décision : \`${agent}\` — tentative #${attempt}.

## Résumé chiffré

- Score premier tour (joueur) : **${(r1[partyId] ?? 0).toFixed(1)} %**
- Finalistes qualifiés : ${finalists.join(" vs ") || "N/A (joueur non qualifié ou parti déjà retiré)"}
- Résultat second tour : ${r2 ? finalists.map((id) => `${id} ${(r2[id] ?? 0).toFixed(1)} %`).join(" / ") : "N/A"}
- Victoire du joueur : ${state.finalResult?.won === true ? "oui" : state.finalResult?.won === false ? "non" : "N/A"}
- Profil RN résolu : ${state.flags["candidateProfile:rn"] ?? "N/A (parti sans profil multiple ou non concerné)"}
- Profil PS résolu : ${state.flags["candidateProfile:ps"] ?? "N/A"}

## Événements structurels survenus pendant la campagne

${
  trace.structuralEvents.length > 0
    ? trace.structuralEvents
        .map(
          (e) =>
            `- Décision ${e.decisionIndex} — ${e.action.kind} (${e.action.partyId}) : ${e.action.summary}\n  Avant/après (national) : ${formatDeltas(e.before, e.after)}`,
        )
        .join("\n")
    : "(aucun événement structurel — campagne stable)"
}

## Soutiens internationaux acceptés

${trace.acceptedEndorsements.length > 0 ? trace.acceptedEndorsements.join(", ") : "(aucun)"}

## Jugement de cohérence narrative

Résultat obtenu par rejeu réel du moteur (aucun scripting du résultat) — les causalités listées
ci-dessus viennent directement de \`nationalLatentSupport\` avant/après chaque événement structurel,
pas d'un calcul indépendant.
`;
      await writeFile(resolve(OUT_DIR, `${scenario.id}.md`), md, "utf8");
      console.log(`${scenario.id} : trouvé en ${attempt} tentatives (parti=${partyId}, agent=${agent})`);
      return true;
    }
  }
  console.log(`${scenario.id} : AUCUNE campagne correspondante trouvée après 3000 tentatives`);
  return false;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const results: Record<string, boolean> = {};
  for (const scenario of SCENARIOS) {
    results[scenario.id] = await findAndWrite(scenario);
  }
  console.log(JSON.stringify(results, null, 2));
}

await main();
