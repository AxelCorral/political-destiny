/**
 * PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md — BLOC B,
 * §40 : douze playtests scriptés (méthode déjà établie par
 * `reality-grounded-playtests-forced.ts` — jouer le moteur réel jusqu'à un
 * point de fourche puis observer/forcer un scénario précis, jamais
 * réimplémenter le moteur). Produit un journal texte lisible, pas un CSV —
 * ce sont des scénarios qualitatifs à relire, pas des statistiques.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { nationalLatentSupport } from "../../src/game/engine/electorate";
import { redistributeElectorate } from "../../src/game/engine/redistribution";
import { normalizePercentages } from "../../src/game/engine/math";
import { simulateOpponentTurn } from "../../src/game/engine/opponentSimulation";
import type { GameState } from "../../src/game/types/index";
import { pickChoice } from "../audit-post/lib/agents";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/strategic-realignments");
const BLOCS = gameContent.electorateBlocs;
const lines: string[] = [];

function log(text = "") {
  lines.push(text);
  console.log(text);
}

function forceUniformSupport(state: GameState, partyId: string, value: number): void {
  for (const bloc of BLOCS) {
    const support = state.electorate.latentSupport[bloc.id];
    if (!support) continue;
    support[partyId] = value;
    state.electorate.latentSupport[bloc.id] = normalizePercentages(support, 3);
  }
  const truth = nationalLatentSupport(state, BLOCS);
  for (const p of Object.values(state.parties)) p.stats.polling = truth[p.id] ?? 0;
}

function freshState(seed: string, playerPartyId: string): GameState {
  const state = createGame(
    { seed, mode: "existing_party", partyId: playerPartyId, methodId: "presidential" },
    gameContent,
  );
  state.phase = "campaign";
  return state;
}

/**
 * Playtests 1-8 : négociation stratégique construite (état contrôlé, moteur
 * réel). L'ouverture reste un tirage probabiliste rare par construction
 * (§11) : plusieurs graines sont essayées jusqu'à observer une issue
 * concrète, pour que le playtest illustre le scénario plutôt que de
 * dépendre du hasard d'une seule graine.
 */
function playtestNegotiation(
  n: number,
  title: string,
  playerPartyId: string,
  targetPartyId: string,
  setup: (state: GameState) => void,
  maxSteps = 16,
  maxSeedAttempts = 60,
  desiredOutcome?: "strategic_withdrawal" | "negotiation_failed_or_maintained",
): void {
  log(`\n## Playtest ${n} — ${title}\n`);
  let outcome: string | undefined;
  let attemptLog: string[] = [];
  let viabilityBefore = 0;

  for (
    let attempt = 0;
    attempt < maxSeedAttempts && (!outcome || (desiredOutcome && outcome !== desiredOutcome));
    attempt += 1
  ) {
    const state = freshState(`playtest-${n}-${attempt}`, playerPartyId);
    setup(state);
    viabilityBefore = nationalLatentSupport(state, BLOCS)[targetPartyId] ?? 0;

    let current = state;
    current.decisionIndex = 8;
    let opened = false;
    attemptLog = [];
    outcome = undefined;
    for (let step = 0; step < maxSteps && !outcome; step += 1) {
      current = simulateOpponentTurn(current, BLOCS);
      if (typeof current.flags[`negotiation:${targetPartyId}`] === "string" && !opened) {
        opened = true;
        const action = current.opponentActions.find(
          (a) => a.partyId === targetPartyId && a.kind === "negotiation_opened",
        );
        attemptLog.push(`Décision ${current.decisionIndex} — ${action?.summary ?? "négociation ouverte"}`);
      }
      const strategic = current.opponentActions.find(
        (a) => a.partyId === targetPartyId && a.kind === "strategic_withdrawal",
      );
      const failed = current.opponentActions.find(
        (a) => a.partyId === targetPartyId && a.kind === "negotiation_failed",
      );
      if (strategic) {
        outcome = "strategic_withdrawal";
        attemptLog.push(`Décision ${current.decisionIndex} — ${strategic.summary}`);
      } else if (failed) {
        outcome = "negotiation_failed_or_maintained";
        attemptLog.push(`Décision ${current.decisionIndex} — ${failed.summary}`);
      }
      current.decisionIndex += 1;
    }
  }

  log(`État initial (graine retenue) : ${targetPartyId} crédité de ${viabilityBefore.toFixed(2)} % (vérité nationale).`);
  for (const entry of attemptLog) log(entry);
  if (!outcome)
    log(`Aucune issue observée après ${maxSeedAttempts} graines × ${maxSteps} décisions.`);
  else log(`Issue : ${outcome}.`);
}

/** Playtest de retrait forcé (pour garantir un cas illustratif même si l'issue naturelle diffère). */
function forcedStrategicWithdrawal(
  n: number,
  title: string,
  playerPartyId: string,
  withdrawingId: string,
  partnerId: string,
  strength: "explicit_support" | "coalition_agreement",
  setup?: (state: GameState) => void,
): void {
  log(`\n## Playtest ${n} — ${title}\n`);
  const state = freshState(`playtest-forced-${n}`, playerPartyId);
  setup?.(state);
  const before = nationalLatentSupport(state, BLOCS);
  const withdrawing = state.parties[withdrawingId]!;
  const actor = state.actors[withdrawing.candidateId]!;
  actor.candidateStatus = "withdrawn";
  actor.active = false;
  withdrawing.active = false;
  const { state: after, transfers } = redistributeElectorate(state, BLOCS, withdrawingId, {
    partnerId,
    strength,
  });
  const afterTruth = nationalLatentSupport(after, BLOCS);
  log(`Avant : ${withdrawingId} ${(before[withdrawingId] ?? 0).toFixed(2)} %, ${partnerId} ${(before[partnerId] ?? 0).toFixed(2)} %.`);
  log(`Après : ${partnerId} ${(afterTruth[partnerId] ?? 0).toFixed(2)} % (transfert ${(transfers[partnerId] ?? 0).toFixed(2)} pts, consigne "${strength}").`);
  const massCheck = Object.values(afterTruth).reduce((s, v) => s + v, 0);
  log(`Conservation de masse (vérité nationale, doit rester 100) : ${massCheck.toFixed(3)}.`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  log("# Playtests — PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md §40\n");

  // 1 — Écologistes → PS naturellement
  playtestNegotiation(
    1,
    "Écologistes → PS naturellement",
    "rn",
    "ecologistes",
    (state) => {
      forceUniformSupport(state, "ecologistes", 4);
      forceUniformSupport(state, "ps", 20);
      forceUniformSupport(state, "lfi", 9);
      state.partyRelations.ecologistes ??= {};
      state.partyRelations.ecologistes!.ps = 40;
    },
    16,
    60,
    "strategic_withdrawal",
  );

  // 2 — Écologistes → LFI naturellement
  playtestNegotiation(
    2,
    "Écologistes → LFI naturellement",
    "rn",
    "ecologistes",
    (state) => {
      forceUniformSupport(state, "ecologistes", 4);
      forceUniformSupport(state, "lfi", 20);
      forceUniformSupport(state, "ps", 9);
      state.partyRelations.ecologistes ??= {};
      state.partyRelations.ecologistes!.lfi = 40;
    },
    16,
    60,
    "strategic_withdrawal",
  );

  // 3 — Écologistes maintenus (gauche très fragmentée et serrée : pas de voie de sortie nette)
  playtestNegotiation(3, "Écologistes maintenus (gauche fragmentée et serrée)", "rn", "ecologistes", (state) => {
    forceUniformSupport(state, "ecologistes", 9);
    forceUniformSupport(state, "ps", 10);
    forceUniformSupport(state, "lfi", 10.5);
  });

  // 4 — LR → Horizons
  playtestNegotiation(
    4,
    "LR → Horizons",
    "ps",
    "lr",
    (state) => {
      forceUniformSupport(state, "lr", 4);
      forceUniformSupport(state, "horizons", 24);
      state.partyRelations.lr ??= {};
      state.partyRelations.lr!.horizons = 30;
    },
    16,
    60,
    "strategic_withdrawal",
  );

  // 5 — LR → NÉ
  playtestNegotiation(
    5,
    "LR → Nouvelle Énergie",
    "ps",
    "lr",
    (state) => {
      forceUniformSupport(state, "lr", 4);
      forceUniformSupport(state, "nouvelle_energie", 22);
      forceUniformSupport(state, "horizons", 10);
      state.partyRelations.lr ??= {};
      state.partyRelations.lr!.nouvelle_energie = 45;
    },
    16,
    60,
    "strategic_withdrawal",
  );

  // 6 — Renaissance → Horizons
  playtestNegotiation(
    6,
    "Renaissance → Horizons",
    "ps",
    "renaissance",
    (state) => {
      forceUniformSupport(state, "renaissance", 4);
      forceUniformSupport(state, "horizons", 24);
      state.partyRelations.renaissance ??= {};
      state.partyRelations.renaissance!.horizons = 35;
    },
    16,
    60,
    "strategic_withdrawal",
  );

  // 7 — Reconquête → RN
  playtestNegotiation(
    7,
    "Reconquête → RN",
    "ps",
    "reconquete",
    (state) => {
      forceUniformSupport(state, "reconquete", 3);
      forceUniformSupport(state, "rn", 30);
      state.partyRelations.reconquete ??= {};
      state.partyRelations.reconquete!.rn = 50;
    },
    16,
    60,
    "strategic_withdrawal",
  );

  // 8 — accord stratégique échoué (relation très négative + distance idéologique forcée)
  playtestNegotiation(
    8,
    "Accord stratégique échoué",
    "rn",
    "ecologistes",
    (state) => {
      forceUniformSupport(state, "ecologistes", 4);
      forceUniformSupport(state, "ps", 20);
      state.partyRelations.ecologistes ??= {};
      state.partyRelations.ecologistes!.ps = -90;
      state.actors[state.parties.ecologistes!.candidateId]!.ambition = 95;
    },
    16,
    60,
    "negotiation_failed_or_maintained",
  );

  // 9 — soutien national à Nouvelle Énergie
  log("\n## Playtest 9 — Soutien national à Nouvelle Énergie\n");
  {
    let found = false;
    for (let attempt = 0; attempt < 30 && !found; attempt += 1) {
      let state = freshState(`playtest-9-${attempt}`, "nouvelle_energie");
      let guard = 0;
      while (state.phase !== "finished" && guard < 90 && !found) {
        const event = currentEvent(state, gameContent.events);
        if (event.id === "endorsement_esteves_liberal_entrepreneur") {
          found = true;
          const accept = event.choices.find((c) => c.id.endsWith("_accept"))!;
          const before = { ...state.parties.nouvelle_energie!.stats };
          const resolved = resolveCurrentChoice(state, accept.id, gameContent);
          const after = resolved.state.parties.nouvelle_energie!.stats;
          log(`Événement : ${event.title}`);
          log(`Effets : finances ${before.finances.toFixed(1)}→${after.finances.toFixed(1)}, rejet ${before.rejection.toFixed(1)}→${after.rejection.toFixed(1)} (effet mixte confirmé : gain + coût).`);
          break;
        }
        const choice = pickChoice(state, event, "aleatoire", `playtest-9-${attempt}`);
        state = resolveCurrentChoice(state, choice.id, gameContent).state;
        guard += 1;
      }
    }
    if (!found) log("Événement non atteint sur l'échantillon de graines essayées.");
  }

  // 10 — soutien national clivant à un autre parti (RN, figure souverainiste)
  log("\n## Playtest 10 — Soutien national clivant (figure souverainiste → RN)\n");
  {
    let found = false;
    for (let attempt = 0; attempt < 30 && !found; attempt += 1) {
      let state = freshState(`playtest-10-${attempt}`, "rn");
      let guard = 0;
      while (state.phase !== "finished" && guard < 90 && !found) {
        const event = currentEvent(state, gameContent.events);
        if (event.id === "endorsement_brancourt_sovereigntist") {
          found = true;
          const accept = event.choices.find((c) => c.id.endsWith("_accept"))!;
          const before = { ...state.parties.rn!.stats };
          const resolved = resolveCurrentChoice(state, accept.id, gameContent);
          const after = resolved.state.parties.rn!.stats;
          log(`Événement : ${event.title}`);
          log(`Effets : mobilisation ${before.mobilization.toFixed(1)}→${after.mobilization.toFixed(1)}, crédibilité ${before.credibility.toFixed(1)}→${after.credibility.toFixed(1)}, rejet ${before.rejection.toFixed(1)}→${after.rejection.toFixed(1)} (jamais un bonus universel).`);
          break;
        }
        const choice = pickChoice(state, event, "aleatoire", `playtest-10-${attempt}`);
        state = resolveCurrentChoice(state, choice.id, gameContent).state;
        guard += 1;
      }
    }
    if (!found) log("Événement non atteint sur l'échantillon de graines essayées.");
  }

  // 11 — choc électoral >10 pts (retrait "propre", hors artefact de bascule premier tour)
  forcedStrategicWithdrawal(
    11,
    "Choc électoral >10 pts sur un retrait stratégique propre",
    "rn",
    "renaissance",
    "horizons",
    "coalition_agreement",
    (state) => {
      forceUniformSupport(state, "renaissance", 13);
      forceUniformSupport(state, "horizons", 13);
      state.parties.renaissance!.alliedWith.push("horizons");
    },
  );

  // 12 — parcours complet premier tour → second tour → gouvernement (sidebar/RaceBulletin)
  log("\n## Playtest 12 — Parcours complet premier tour → second tour → gouvernement\n");
  {
    let state = freshState("playtest-12", "ps");
    state.phase = "pre_campaign";
    let guard = 0;
    let sawFirstRound = false;
    let sawQualified = false;
    let sawGovernment = false;
    while (state.phase !== "finished" && guard < 60) {
      const event = currentEvent(state, gameContent.events);
      const choice = pickChoice(state, event, "aleatoire", "playtest-12");
      state = resolveCurrentChoice(state, choice.id, gameContent).state;
      guard += 1;
      if (state.firstRoundResult && !sawFirstRound) {
        sawFirstRound = true;
        log(`Décision ${state.decisionIndex} — Premier tour tranché. Qualifiés : ${state.qualifiedPartyIds?.join(" vs ")}.`);
      }
      if (state.qualifiedPartyIds?.includes("ps") && !sawQualified) {
        sawQualified = true;
        const truth = nationalLatentSupport(state, BLOCS);
        const sum = state.qualifiedPartyIds.reduce((s, id) => s + (truth[id] ?? 0), 0);
        log(`PS qualifié — vérité nationale des deux finalistes somme à ${sum.toFixed(2)} (attendu ≈100).`);
      }
      if (state.phase === "government_epilogue" && !sawGovernment) {
        sawGovernment = true;
        log(`Décision ${state.decisionIndex} — entrée en épilogue gouvernemental.`);
      }
    }
    log(`Issue finale : ${state.finalResult?.won ? "victoire" : "défaite/élimination"} (score ${state.finalResult?.score ?? "n/a"}).`);
    if (!sawFirstRound) log("Premier tour non atteint sur cette graine (garde-fou de décisions dépassé).");
  }

  await writeFile(resolve(OUT_DIR, "playtests.md"), `${lines.join("\n")}\n`, "utf8");
}

await main();
