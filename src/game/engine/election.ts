import type {
  ElectionRoundResult,
  ElectorateBlocDefinition,
  GameState,
  RegionId,
  RegionalResult,
} from "@/game/types";

import { nationalLatentSupport, recalculateElectorate } from "./electorate";
import { clamp, ideologyDistance, normalizePercentages, round } from "./math";
import { randomBetween } from "./rng";

const REGIONS: RegionId[] = [
  "ile_de_france",
  "north",
  "east",
  "west",
  "south_west",
  "south_east",
  "central",
  "overseas",
];

function ranking(results: Record<string, number>): string[] {
  return Object.keys(results).sort(
    (left, right) => (results[right] ?? 0) - (results[left] ?? 0) || left.localeCompare(right),
  );
}

function regionalResults(state: GameState, national: Record<string, number>): RegionalResult[] {
  return REGIONS.map((regionId) => {
    const raw: Record<string, number> = {};
    for (const party of Object.values(state.parties)) {
      if (!party.active || (national[party.id] ?? 0) <= 0) continue;
      const affinity = party.regionalAffinity[regionId] ?? 50;
      raw[party.id] = (national[party.id] ?? 0) * (0.68 + affinity / 160);
    }
    const results = normalizePercentages(raw, 1);
    return { regionId, winnerPartyId: ranking(results)[0] ?? state.playerPartyId, results };
  });
}

function campaignConsistencyModifier(state: GameState, partyId: string): number {
  if (partyId !== state.playerPartyId) return 0;
  return state.statementLedger.reduce((total, statement) => {
    switch (statement.evolution) {
      case "coherent_compromise":
      case "gradual_evolution":
        return total + 0.8;
      case "contradiction":
        return total - 1.4;
      case "abrupt_reversal":
        return total - 2.2;
      default:
        return total;
    }
  }, 0);
}

/**
 * Diminishing-returns transform for the rejection penalty in the runoff
 * appeal formula: matches the previous linear term (rejection * 0.34) at the
 * midpoint of the scale, but compresses the penalty gap between very
 * low-rejection and very high-rejection parties, instead of scaling it
 * linearly all the way to 100.
 *
 * Diagnosed for P5 (see POST_AUDIT_FIXES.md): with a purely linear penalty,
 * a party structurally near the top of the rejection scale (e.g. ~87) paid
 * roughly +16 points more runoff-appeal penalty than one near ~40, on top of
 * the (much smaller) retention effect — a gap large enough that even a
 * clearly mismanaged campaign for the low-rejection party rarely lost a
 * runoff, and a strong campaign for the high-rejection party rarely won one.
 * A concave power curve keeps rejection meaningful (still monotonic, still
 * the same order of parties, still calibrated identically at rejection=50)
 * while narrowing that gap at the extremes, leaving more room for campaign
 * quality (credibility, mobilization, consistency, alliances) to matter.
 */
export function diminishingRejectionPenalty(rejection: number): number {
  const ANCHOR = 50;
  const LINEAR_COEFFICIENT = 0.34;
  const EXPONENT = 0.65;
  const scale = (LINEAR_COEFFICIENT * ANCHOR) / ANCHOR ** EXPONENT;
  return scale * Math.max(0, rejection) ** EXPONENT;
}

/**
 * P5 (chantier ciblé, voir P1_P5_FINAL_FIXES.md section 7) : rien dans le
 * moteur ne pénalisait une position idéologique centrale — une distance
 * moyenne faible à l'ensemble des autres partis actifs (calculée
 * géométriquement à partir des positions perçues courantes, jamais codée
 * par identifiant de parti) donnait un avantage de report mécanique dans
 * quasiment chaque duel, sans aucune contrepartie. `CENTRALITY_REFERENCE`
 * est calibré sur la distance moyenne réelle observée dans le catalogue de
 * partis existants (56 à 87, médiane ≈70) : seuls les partis nettement
 * en-dessous de cette référence paient un coût, reflétant un déficit
 * d'enthousiasme/mobilisation pour un profil "acceptable par tous mais
 * porté par personne en particulier" (§19 du prompt).
 */
const CENTRALITY_REFERENCE = 70;
const CENTRALITY_COEFFICIENT = 0.35;

export function centralityCost(state: GameState, partyId: string): number {
  const party = state.parties[partyId];
  if (!party) return 0;
  const others = Object.values(state.parties).filter((p) => p.active && p.id !== partyId);
  if (others.length === 0) return 0;
  const avgDistance =
    others.reduce(
      (sum, other) => sum + ideologyDistance(party.perceivedIdeology, other.perceivedIdeology),
      0,
    ) / others.length;
  const deficit = Math.max(0, CENTRALITY_REFERENCE - avgDistance);
  return deficit * CENTRALITY_COEFFICIENT;
}

export function runoffAppeal(state: GameState, sourcePartyId: string, finalistId: string): number {
  const source = state.parties[sourcePartyId];
  const finalist = state.parties[finalistId];
  if (!source || !finalist) return 0.01;

  const distance = ideologyDistance(source.perceivedIdeology, finalist.perceivedIdeology);
  const relation = state.partyRelations[sourcePartyId]?.[finalistId] ?? 0;
  const endorsement = state.flags[`endorsement:${sourcePartyId}`];
  const endorsementModifier = endorsement === finalistId ? 24 : endorsement === "neutral" ? 0 : -10;
  const allianceModifier = source.alliedWith.includes(finalistId) ? 18 : 0;
  const consistency = campaignConsistencyModifier(state, finalistId);

  return Math.max(
    0.05,
    112 -
      distance * 0.5 +
      relation * 0.3 +
      endorsementModifier +
      allianceModifier +
      finalist.hidden.transferability * 0.35 +
      finalist.stats.credibility * 0.12 +
      finalist.stats.mobilization * 0.05 -
      diminishingRejectionPenalty(finalist.stats.rejection) -
      centralityCost(state, finalistId) +
      consistency,
  );
}

/**
 * P5 (chantier ciblé) : convertit deux scores d'appel en part de voix
 * amortie vers 50/50, pour qu'un avantage d'appel — y compris l'avantage de
 * centralité désormais atténué mais pas supprimé — ne se traduise plus en
 * quasi-monopole (proche de 100/0) d'un électorat éliminé. `DAMPING`
 * détermine la fraction de l'écart brut par rapport à 50/50 qui est
 * conservée ; le reste est ramené vers l'équilibre. Conserve la masse par
 * construction (`left + right === 1`) et préserve l'ordre (le camp le plus
 * attractif reste toujours majoritaire).
 */
const RUNOFF_SHARE_DAMPING = 0.62;

export function runoffShareSplit(
  leftAppeal: number,
  rightAppeal: number,
): { left: number; right: number } {
  const total = leftAppeal + rightAppeal;
  if (total <= 0) return { left: 0.5, right: 0.5 };
  const rawLeftShare = leftAppeal / total;
  const dampedLeftShare = clamp(0.5 + (rawLeftShare - 0.5) * RUNOFF_SHARE_DAMPING, 0.05, 0.95);
  return { left: dampedLeftShare, right: 1 - dampedLeftShare };
}

export function simulateFirstRound(
  sourceState: GameState,
  blocs: ElectorateBlocDefinition[],
): { state: GameState; result: ElectionRoundResult; finalists: [string, string] } {
  const state = recalculateElectorate(sourceState, blocs, true);
  const latent = nationalLatentSupport(state, blocs);
  const raw: Record<string, number> = {};
  let rng = state.rng;

  for (const party of Object.values(state.parties)) {
    if (!party.active) continue;
    const actor = state.actors[party.candidateId];
    if (actor && ["withdrawn", "disqualified", "eliminated"].includes(actor.candidateStatus))
      continue;
    let noise: number;
    // Le bruit du scrutin reste inférieur au bruit maximal des sondages et
    // représente surtout mobilisation et indécision de dernière heure.
    [noise, rng] = randomBetween(rng, -3.2, 3.2);
    const mobilizationFactor = 0.9 + party.stats.mobilization / 500;
    raw[party.id] = Math.max(0.01, (latent[party.id] ?? 0) * mobilizationFactor + noise);
  }

  const results = normalizePercentages(raw, 1);
  const ordered = ranking(results);
  const first = ordered[0];
  const second = ordered[1];
  if (!first || !second || first === second)
    throw new Error("Le premier tour n’a pas produit deux finalistes distincts.");

  const turnout = round(
    clamp(
      blocs.reduce(
        (sum, bloc) =>
          sum + (state.electorate.turnoutByBloc[bloc.id] ?? bloc.turnout) * (bloc.weight / 100),
        0,
      ) +
        state.world.turnoutMood * 0.04,
      52,
      88,
    ),
    1,
  );
  const result: ElectionRoundResult = {
    round: 1,
    date: state.electionDate,
    results,
    ranking: ordered,
    regionalResults: regionalResults(state, results),
    turnout,
  };
  state.rng = rng;
  state.firstRoundResult = result;
  state.qualifiedPartyIds = [first, second];
  for (const partyId of ordered.slice(2)) {
    const actor = state.actors[state.parties[partyId]?.candidateId ?? ""];
    if (actor) actor.candidateStatus = "eliminated";
  }
  return { state, result, finalists: [first, second] };
}

export function simulateSecondRound(
  sourceState: GameState,
  blocs: ElectorateBlocDefinition[],
): { state: GameState; result: ElectionRoundResult; winnerPartyId: string } {
  const state = structuredClone(sourceState);
  const finalists = state.qualifiedPartyIds;
  if (!finalists || finalists[0] === finalists[1])
    throw new Error("Deux finalistes distincts sont requis pour le second tour.");
  const [leftId, rightId] = finalists;
  const left = state.parties[leftId];
  const right = state.parties[rightId];
  if (!left || !right) throw new Error("Un finaliste est absent de l’état de partie.");

  const firstRoundResults = state.firstRoundResult?.results ?? {};
  const leftRetention = clamp(
    0.86 + left.stats.mobilization / 1000 - left.stats.rejection / 2200,
    0.78,
    0.95,
  );
  const rightRetention = clamp(
    0.86 + right.stats.mobilization / 1000 - right.stats.rejection / 2200,
    0.78,
    0.95,
  );
  let leftTotal = (firstRoundResults[leftId] ?? 0) * leftRetention;
  let rightTotal = (firstRoundResults[rightId] ?? 0) * rightRetention;
  let abstainedTransfers =
    (firstRoundResults[leftId] ?? 0) * (1 - leftRetention) +
    (firstRoundResults[rightId] ?? 0) * (1 - rightRetention);

  for (const [sourcePartyId, share] of Object.entries(firstRoundResults)) {
    if (sourcePartyId === leftId || sourcePartyId === rightId || share <= 0) continue;
    const source = state.parties[sourcePartyId];
    if (!source) continue;
    const leftDistance = ideologyDistance(source.perceivedIdeology, left.perceivedIdeology);
    const rightDistance = ideologyDistance(source.perceivedIdeology, right.perceivedIdeology);
    const closestDistance = Math.min(leftDistance, rightDistance);
    const explicitEndorsement = state.flags[`endorsement:${sourcePartyId}`];
    // P5 (chantier ciblé) : l'alliance avec l'un des deux finalistes réduit
    // désormais l'abstention au même titre qu'une consigne explicite (§18 du
    // prompt) — elle en était absente alors que runoffAppeal() la valorise
    // déjà côté report.
    const alliedWithFinalist =
      source.alliedWith.includes(leftId) || source.alliedWith.includes(rightId);
    const abstentionRate = clamp(
      0.08 +
        closestDistance / 280 +
        (left.stats.rejection + right.stats.rejection) / 1000 -
        (explicitEndorsement && explicitEndorsement !== "neutral" ? 0.05 : 0) -
        (alliedWithFinalist ? 0.04 : 0),
      0.06,
      0.46,
    );
    const expressedShare = share * (1 - abstentionRate);
    const leftAppeal = runoffAppeal(state, sourcePartyId, leftId);
    const rightAppeal = runoffAppeal(state, sourcePartyId, rightId);
    const split = runoffShareSplit(leftAppeal, rightAppeal);
    leftTotal += expressedShare * split.left;
    rightTotal += expressedShare * split.right;
    abstainedTransfers += share * abstentionRate;
  }

  let rng = state.rng;
  // Au duel final, l'incertitude porte sur les reports et l'abstention : ces
  // valeurs sont des masses de blocs avant normalisation, pas des points publiés.
  const [leftNoise, nextRng] = randomBetween(rng, -4, 4);
  rng = nextRng;
  const results = normalizePercentages(
    {
      [leftId]: Math.max(0.1, leftTotal + leftNoise),
      [rightId]: Math.max(0.1, rightTotal - leftNoise),
    },
    1,
  );
  const ordered = ranking(results);
  const winnerPartyId = ordered[0];
  if (!winnerPartyId) throw new Error("Le second tour n’a produit aucun vainqueur.");
  const baselineRunoffTurnout = blocs.reduce(
    (sum, bloc) =>
      sum + (state.electorate.turnoutByBloc[bloc.id] ?? bloc.turnout) * (bloc.weight / 100),
    0,
  );

  const result: ElectionRoundResult = {
    round: 2,
    date: state.electionDate,
    results,
    ranking: ordered,
    regionalResults: regionalResults(state, results),
    turnout: round(
      clamp(
        ((state.firstRoundResult?.turnout ?? 70) + baselineRunoffTurnout) / 2 +
          3.2 -
          abstainedTransfers * 0.16 +
          (left.stats.mobilization + right.stats.mobilization - 100) * 0.018,
        52,
        90,
      ),
      1,
    ),
  };
  state.rng = rng;
  state.secondRoundResult = result;
  return { state, result, winnerPartyId };
}
