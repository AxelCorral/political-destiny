import { MINOR_PARTY_CANDIDATES } from "@/game/data/parties";
import {
  BASELINE_SALIENCE,
  CAMPAIGN_THEME_LABELS,
  protestDefinitions,
  REGION_NEIGHBOURS,
  shockDefinitions,
} from "@/game/data/shocks";
import type {
  ActiveShock,
  CampaignTheme,
  ElectorateBlocDefinition,
  GameState,
  NewsItem,
  OpponentActionRecord,
  PartyState,
  ProtestMovement,
  RegionId,
} from "@/game/types";

import { clamp } from "./math";
import { redistributeElectorate } from "./redistribution";
import { random, weightedIndex } from "./rng";

/**
 * V3 — directeur de campagne.
 *
 * Exécuté après chaque décision (après le tour des adversaires, avant le recalcul de
 * l'électorat). Il fait vivre la campagne indépendamment des cartes tirées au hasard :
 *
 * 1. agenda : les chocs en cours font monter leur thème ; le thème dominant change ;
 * 2. chocs extérieurs (carburant, attentat, incendies…) qui tombent à n'importe quel moment ;
 * 3. mouvements sociaux qui naissent dans une région et s'étendent ;
 * 4. primaire du pôle socialiste (rejouée) et primaire contextuelle de la droite et du centre ;
 * 5. parrainages : les petites candidatures peuvent échouer, le joueur aussi s'il est mal implanté ;
 * 6. un coup de théâtre au maximum par partie (inéligibilité, dissidence, percée d'outsider).
 *
 * Tout est déterministe : uniquement `state.rng`, jamais `Math.random`.
 * Les cartes déclenchées passent en tête de `queuedEventIds` et deviennent éligibles via un
 * drapeau `director:card:<eventId>`.
 */

export const PRIMARY_PS_CAMPAIGN_DECISION = 3;
export const PRIMARY_PS_VOTE_DECISION = 5;
export const PRIMARY_RIGHT_WINDOW: [number, number] = [9, 13];
export const SPONSORSHIP_PLAYER_CARD_DECISION = 17;
export const SPONSORSHIP_RESOLUTION_DECISION = 19;
export const COUP_WINDOW: [number, number] = [10, 23];

const RIGHT_CENTRE_PARTIES = ["renaissance", "horizons", "lr", "nouvelle_energie"];
const CAMPAIGN_PHASES = ["pre_campaign", "campaign", "official_campaign"];

export function directorCardFlag(eventId: string): string {
  return `director:card:${eventId}`;
}

function queueCard(state: GameState, eventId: string, front = true): void {
  state.flags[directorCardFlag(eventId)] = true;
  state.queuedEventIds = front
    ? [eventId, ...state.queuedEventIds.filter((id) => id !== eventId)]
    : [...state.queuedEventIds.filter((id) => id !== eventId), eventId];
}

function pushNews(state: GameState, item: Omit<NewsItem, "id" | "date">, key: string): void {
  state.publicNews = [
    ...state.publicNews,
    { id: `news-${state.runId}-${state.decisionIndex}-${key}`, date: state.currentDate, ...item },
  ].slice(-40);
}

function pushAction(
  state: GameState,
  action: Omit<OpponentActionRecord, "decisionIndex" | "date">,
): void {
  state.opponentActions = [
    ...state.opponentActions,
    { decisionIndex: state.decisionIndex, date: state.currentDate, ...action },
  ].slice(-80);
}

function roll(state: GameState): number {
  const [value, rng] = random(state.rng);
  state.rng = rng;
  return value;
}

function isActiveCandidate(state: GameState, partyId: string): boolean {
  const party = state.parties[partyId];
  if (!party?.active) return false;
  const actor = state.actors[party.candidateId];
  return !actor || !["withdrawn", "disqualified", "eliminated"].includes(actor.candidateStatus);
}

/** Retire une candidature et redistribue son électorat. */
export function withdrawParty(
  state: GameState,
  partyId: string,
  blocs: ElectorateBlocDefinition[],
  status: "withdrawn" | "disqualified",
): void {
  const party = state.parties[partyId];
  if (!party) return;
  const actor = state.actors[party.candidateId];
  if (actor) {
    actor.candidateStatus = status;
    actor.active = false;
  }
  party.active = false;
  const redistributed = redistributeElectorate(state, blocs, partyId).state;
  state.electorate = redistributed.electorate;
  for (const [id, other] of Object.entries(state.parties)) {
    const updated = redistributed.parties[id];
    if (updated) other.stats.polling = updated.stats.polling;
  }
}

/** Remplace le candidat d'un parti par un autre acteur existant. */
export function swapCandidate(state: GameState, partyId: string, actorId: string): void {
  const party = state.parties[partyId];
  const next = state.actors[actorId];
  if (!party || !next) return;
  const former = state.actors[party.candidateId];
  if (former && former.id !== next.id) {
    former.candidateStatus = "withdrawn";
    former.role = "cadre";
  }
  next.active = true;
  next.role = "candidate";
  next.candidateStatus = "official";
  party.candidateId = next.id;
  if (partyId === state.playerPartyId) {
    state.player = {
      ...state.player,
      id: next.id,
      displayName: next.displayName,
      traits: structuredClone(next.traits),
    };
  }
}

// ——— 1. Agenda ———

/** Crédit d'un parti sur un thème (0-100), à partir de ses compétences et de son idéologie. */
export function themeOwnership(party: PartyState, theme: CampaignTheme): number {
  const ideology = party.perceivedIdeology;
  switch (theme) {
    case "economy":
      return party.hidden.economicCompetence;
    case "security":
      return clamp(party.hidden.securityCompetence * 0.6 + (ideology.authority + 100) * 0.2);
    case "social":
      return clamp(party.hidden.socialCompetence * 0.6 + (100 - ideology.economy) * 0.2);
    case "services":
      return clamp(party.hidden.socialCompetence * 0.5 + (100 - ideology.economy) * 0.25);
    case "ecology":
      return clamp((ideology.ecology + 100) / 2);
    case "europe":
      return clamp(50 + Math.abs(ideology.europe) * 0.4);
  }
}

function updateAgenda(state: GameState): void {
  const salience = { ...(state.world.salience ?? BASELINE_SALIENCE) };
  for (const theme of Object.keys(salience) as CampaignTheme[]) {
    const pressure = (state.world.activeShocks ?? [])
      .filter((shock) => shock.theme === theme)
      .reduce((sum, shock) => sum + shock.intensity * 0.7, 0);
    const protestPressure = (state.world.protests ?? [])
      .filter((protest) => protest.theme === theme)
      .reduce((sum, protest) => sum + protest.intensity * protest.regions.length * 0.09, 0);
    const target = BASELINE_SALIENCE[theme] + pressure + protestPressure;
    salience[theme] = Math.round((salience[theme] * 0.45 + target * 0.55) * 10) / 10;
  }
  state.world.salience = salience;
  state.world.dominantTheme = (Object.entries(salience) as Array<[CampaignTheme, number]>).sort(
    (a, b) => b[1] - a[1],
  )[0]![0];

  // Les partis crédibles sur le thème qui domine l'agenda progressent légèrement.
  const active = Object.values(state.parties).filter((party) => isActiveCandidate(state, party.id));
  for (const shock of state.world.activeShocks ?? []) {
    const ownerships = active.map((party) => themeOwnership(party, shock.theme));
    const mean = ownerships.reduce((a, b) => a + b, 0) / Math.max(1, ownerships.length);
    active.forEach((party, index) => {
      const delta = ((ownerships[index]! - mean) / 100) * (shock.intensity / 100) * 0.9;
      party.hidden.baseSupport = clamp(party.hidden.baseSupport + delta, 0.1, 100);
    });
  }
}

// ——— 2. Chocs extérieurs ———

function decayShocks(state: GameState): void {
  state.world.activeShocks = (state.world.activeShocks ?? [])
    .map((shock) => ({
      ...shock,
      intensity: Math.round(shock.intensity * 0.8),
      remainingDecisions: shock.remainingDecisions - 1,
    }))
    .filter((shock) => shock.remainingDecisions > 0 && shock.intensity > 8);
}

function maybeStartShock(state: GameState): void {
  if (!CAMPAIGN_PHASES.includes(state.phase)) return;
  const started = Number(state.flags["director:shockCount"] ?? 0);
  const last = Number(state.flags["director:lastShockAt"] ?? -10);
  const sinceLast = state.decisionIndex - last;
  if (started >= 3 || sinceLast < 5) return;
  const noTragic = state.flags["setting:noTragic"] === true;
  const candidates = shockDefinitions.filter(
    (shock) =>
      !state.flags[`shock:${shock.id}`] &&
      state.decisionIndex >= shock.minDecision &&
      state.decisionIndex <= shock.maxDecision &&
      !(shock.tragic && noTragic),
  );
  if (candidates.length === 0) return;
  // Garantit au moins deux chocs par partie, sans les rendre prévisibles.
  const forced =
    (started === 0 && state.decisionIndex >= 11) || (started === 1 && state.decisionIndex >= 20);
  const chance = 0.14 + Math.max(0, sinceLast - 5) * 0.05;
  if (!forced && roll(state) >= chance) return;
  const [index, , rng] = weightedIndex(
    state.rng,
    candidates.map((shock) => shock.weight),
  );
  state.rng = rng;
  const shock = candidates[index];
  if (!shock) return;
  const active: ActiveShock = {
    id: shock.id,
    theme: shock.theme,
    intensity: shock.intensity,
    startedAtDecision: state.decisionIndex,
    remainingDecisions: shock.durationDecisions,
    tragic: shock.tragic,
  };
  state.world.activeShocks = [...(state.world.activeShocks ?? []), active];
  for (const [key, delta] of Object.entries(shock.world)) {
    const k = key as keyof typeof shock.world;
    state.world[k] = clamp(state.world[k] + (delta ?? 0));
  }
  state.flags[`shock:${shock.id}`] = true;
  state.flags["director:shockCount"] = started + 1;
  state.flags["director:lastShockAt"] = state.decisionIndex;
  pushNews(
    state,
    {
      headline: shock.headline,
      body: `CHOC EXTÉRIEUR — le thème « ${CAMPAIGN_THEME_LABELS[shock.theme]} » s’impose dans la campagne.`,
      tone: "negative",
    },
    `shock-${shock.id}`,
  );
  queueCard(state, shock.eventId);
}

// ——— 3. Mouvements sociaux ———

function evolveProtests(state: GameState): void {
  const next: ProtestMovement[] = [];
  for (const protest of state.world.protests ?? []) {
    const stanceFactor =
      protest.playerStance === "support" ? 1.25 : protest.playerStance === "mediate" ? 0.6 : 1;
    let regions = [...protest.regions];
    if (roll(state) < (protest.intensity / 210) * stanceFactor) {
      const frontier = [
        ...new Set(regions.flatMap((region) => REGION_NEIGHBOURS[region] ?? [])),
      ].filter((region) => !regions.includes(region));
      if (frontier.length > 0) {
        const target = frontier[Math.floor(roll(state) * frontier.length)] as RegionId;
        regions = [...regions, target];
      }
    }
    const updated: ProtestMovement = {
      ...protest,
      regions,
      intensity: Math.round(protest.intensity * (protest.playerStance === "mediate" ? 0.78 : 0.9)),
      remainingDecisions: protest.remainingDecisions - 1,
    };
    state.world.socialTension = clamp(state.world.socialTension + regions.length * 0.4);
    const definition = protestDefinitions.find((entry) => entry.id === protest.id);
    if (
      definition &&
      regions.length >= 4 &&
      !state.flags[`protest:${protest.id}:national`] &&
      CAMPAIGN_PHASES.includes(state.phase)
    ) {
      state.flags[`protest:${protest.id}:national`] = true;
      state.flags["director:nationalProtest"] = protest.label;
      queueCard(state, definition.escalationEventId);
      pushNews(
        state,
        {
          headline: `${protest.label} : le mouvement devient national`,
          body: `MOBILISATION — ${regions.length} grandes régions touchées.`,
          tone: "neutral",
        },
        `protest-national-${protest.id}`,
      );
    }
    if (updated.remainingDecisions > 0 && updated.intensity > 10) next.push(updated);
  }
  state.world.protests = next;
}

function maybeStartProtest(state: GameState): void {
  if (!CAMPAIGN_PHASES.includes(state.phase)) return;
  if ((state.world.protests ?? []).length > 0) return;
  const started = Number(state.flags["director:protestCount"] ?? 0);
  if (started >= 2 || state.decisionIndex < 2 || state.decisionIndex > 25) return;
  const forced = started === 0 && state.decisionIndex >= 15;
  // Le climat social et les chocs en cours rendent un mouvement plus probable.
  const chance = 0.06 + state.world.socialTension / 900;
  if (!forced && roll(state) >= chance) return;
  const candidates = protestDefinitions.filter((protest) => !state.flags[`protest:${protest.id}`]);
  if (candidates.length === 0) return;
  const [index, , rng] = weightedIndex(
    state.rng,
    candidates.map((protest) => protest.weight),
  );
  state.rng = rng;
  const definition = candidates[index];
  if (!definition) return;
  state.world.protests = [
    {
      id: definition.id,
      label: definition.label,
      theme: definition.theme,
      regions: [...definition.originRegions],
      intensity: definition.intensity,
      startedAtDecision: state.decisionIndex,
      remainingDecisions: definition.durationDecisions,
    },
  ];
  state.flags[`protest:${definition.id}`] = true;
  state.flags["director:protestCount"] = started + 1;
  queueCard(state, definition.eventId);
}

/** Appelé par les cartes de manifestation (drapeau `director:protestStance`). */
function applyProtestStance(state: GameState): void {
  const stance = state.flags["director:protestStance"];
  if (typeof stance !== "string") return;
  delete state.flags["director:protestStance"];
  state.world.protests = (state.world.protests ?? []).map((protest) => ({
    ...protest,
    playerStance: stance as ProtestMovement["playerStance"],
  }));
}

// ——— 4. Primaires ———

const PS_PRIMARY_FIELD: Array<{ actorId: string; weight: number; strength: number }> = [
  { actorId: "ps_candidate", weight: 0.62, strength: 8 },
  { actorId: "ps_faure", weight: 0.23, strength: 0 },
  { actorId: "ps_royal", weight: 0.15, strength: -3 },
];

function runPsPrimary(state: GameState): void {
  const ps = state.parties.ps;
  if (!ps || !isActiveCandidate(state, "ps") || state.flags["primary:ps:done"]) return;

  if (state.playerPartyId === "ps") {
    if (
      state.decisionIndex === PRIMARY_PS_CAMPAIGN_DECISION &&
      !state.flags["primary:ps:announced"]
    ) {
      state.flags["primary:ps:announced"] = true;
      queueCard(state, "v3_primary_ps_campaign");
    }
    if (state.decisionIndex >= PRIMARY_PS_VOTE_DECISION) {
      const playerProfile = PS_PRIMARY_FIELD.find((entry) => entry.actorId === state.player.id);
      const bonus = Number(state.flags["primary:ps:bonus"] ?? 0);
      const score =
        50 +
        (playerProfile?.strength ?? 0) +
        (ps.stats.popularity - 50) * 0.35 +
        (ps.stats.momentum - 50) * 0.3 +
        (ps.stats.cohesion - 50) * 0.15 +
        bonus +
        (roll(state) - 0.5) * 24;
      const won = score >= 50;
      state.flags["primary:ps:done"] = true;
      state.flags["primary:ps:won"] = won;
      state.flags["primary:ps:score"] = Math.round(clamp(score, 30, 70) * 10) / 10;
      if (!won) {
        const rivals = PS_PRIMARY_FIELD.filter((entry) => entry.actorId !== state.player.id);
        const [index, , rng] = weightedIndex(
          state.rng,
          rivals.map((entry) => entry.weight),
        );
        state.rng = rng;
        state.flags["primary:ps:winner"] = rivals[index]?.actorId ?? "ps_candidate";
      }
      queueCard(state, won ? "v3_primary_ps_won" : "v3_primary_ps_lost");
    }
    return;
  }

  if (state.decisionIndex < PRIMARY_PS_VOTE_DECISION) return;
  const [index, , rng] = weightedIndex(
    state.rng,
    PS_PRIMARY_FIELD.map((entry) => entry.weight),
  );
  state.rng = rng;
  const winner = PS_PRIMARY_FIELD[index] ?? PS_PRIMARY_FIELD[0]!;
  state.flags["primary:ps:done"] = true;
  state.flags["primary:ps:winner"] = winner.actorId;
  if (winner.actorId !== ps.candidateId) {
    swapCandidate(state, "ps", winner.actorId);
    ps.hidden.baseSupport = clamp(ps.hidden.baseSupport + winner.strength * 0.25 - 1.5, 0.1, 100);
    ps.stats.cohesion = clamp(ps.stats.cohesion - 4);
  } else {
    ps.stats.momentum = clamp(ps.stats.momentum + 4);
  }
  const name = state.actors[winner.actorId]?.displayName ?? "Le favori";
  pushNews(
    state,
    {
      headline: `Primaire du pôle socialiste : ${name} l’emporte`,
      body: "DÉSIGNATION — le vainqueur réclame le rassemblement de toute la gauche non insoumise.",
      tone: "neutral",
      partyId: "ps",
    },
    "primary-ps",
  );
  pushAction(state, {
    actorId: winner.actorId,
    partyId: "ps",
    kind: "primary",
    summary: `PS – Place publique : ${name} remporte la primaire du pôle socialiste.`,
  });
}

/** Conséquences du choix du joueur après une primaire perdue. */
function applyPrimaryResponse(state: GameState, blocs: ElectorateBlocDefinition[]): void {
  const response = state.flags["primary:response"];
  if (typeof response !== "string") return;
  delete state.flags["primary:response"];
  const party = state.parties[state.playerPartyId];
  if (!party) return;
  if (response === "rally_ps") {
    const winner = String(state.flags["primary:ps:winner"] ?? "ps_candidate");
    swapCandidate(state, "ps", winner);
    party.stats.cohesion = clamp(party.stats.cohesion + 10);
    state.flags["primary:rallied"] = true;
  } else if (response === "dissident") {
    party.stats.cohesion = clamp(party.stats.cohesion - 18);
    party.stats.credibility = clamp(party.stats.credibility - 6);
    party.hidden.baseSupport = clamp(party.hidden.baseSupport * 0.72, 0.1, 100);
    state.flags["primary:dissident"] = true;
  } else if (response === "accept_right_result") {
    // Le joueur respecte une primaire perdue : sa candidature s'arrête ici.
    const winnerParty = String(state.flags["primary:right:winner"] ?? "");
    withdrawParty(state, state.playerPartyId, blocs, "withdrawn");
    state.flags["primary:rallied"] = true;
    state.flags["director:campaignOver"] = "primary";
    if (winnerParty) state.flags["rallying:player"] = winnerParty;
  }
}

function rightPrimaryField(state: GameState): string[] {
  return RIGHT_CENTRE_PARTIES.filter((id) => isActiveCandidate(state, id));
}

function maybeRunRightPrimary(state: GameState, blocs: ElectorateBlocDefinition[]): void {
  if (state.flags["primary:right:done"] || state.flags["primary:right:declined"]) return;
  const field = rightPrimaryField(state);
  // Le joueur a accepté : le vote a lieu deux décisions plus tard.
  if (state.flags["primary:right:accepted"] === true) {
    if (state.flags["primary:right:acceptedAt"] === undefined)
      state.flags["primary:right:acceptedAt"] = state.decisionIndex;
    if (state.decisionIndex >= Number(state.flags["primary:right:acceptedAt"]) + 2)
      resolveRightPrimary(state, blocs, field);
    return;
  }
  const [start, end] = PRIMARY_RIGHT_WINDOW;
  if (state.decisionIndex < start || state.decisionIndex > end) return;
  if (field.length < 3) return;
  const polls = field.map((id) => state.parties[id]?.stats.polling ?? 0);
  const fragmented = Math.max(...polls) < 15 && polls.reduce((a, b) => a + b, 0) > 22;
  const playerInField = field.includes(state.playerPartyId);

  if (!state.flags["primary:right:proposed"]) {
    if (!fragmented) return;
    state.flags["primary:right:proposed"] = true;
    if (playerInField) {
      queueCard(state, "v3_primary_right_proposal");
    } else if (roll(state) < 0.25) {
      resolveRightPrimary(state, blocs, field.slice(0, 3));
    } else {
      state.flags["primary:right:declined"] = true;
    }
    return;
  }
}

function resolveRightPrimary(
  state: GameState,
  blocs: ElectorateBlocDefinition[],
  participants: string[],
): void {
  const scored = participants.map((id) => {
    const party = state.parties[id]!;
    const bonus = id === state.playerPartyId ? Number(state.flags["primary:right:bonus"] ?? 0) : 0;
    return {
      id,
      score:
        party.stats.polling * 2.2 +
        party.stats.popularity * 0.25 +
        party.stats.momentum * 0.2 +
        bonus +
        roll(state) * 12,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0]!.id;
  state.flags["primary:right:done"] = true;
  state.flags["primary:right:winner"] = winner;
  const winnerName = state.actors[state.parties[winner]!.candidateId]?.displayName ?? winner;
  for (const { id } of scored.slice(1)) {
    if (id === state.playerPartyId) continue;
    withdrawParty(state, id, blocs, "withdrawn");
    state.flags[`rallying:${id}`] = winner;
    pushAction(state, {
      actorId: state.parties[id]!.candidateId,
      partyId: id,
      kind: "rallying",
      summary: `${state.parties[id]!.shortName} se rallie à ${winnerName} après la primaire de la droite et du centre.`,
    });
  }
  const winnerParty = state.parties[winner]!;
  winnerParty.stats.momentum = clamp(winnerParty.stats.momentum + 8);
  winnerParty.stats.cohesion = clamp(winnerParty.stats.cohesion + 4);
  pushNews(
    state,
    {
      headline: `Primaire de la droite et du centre : ${winnerName} désigné`,
      body: "RECOMPOSITION — les candidats battus se retirent et appellent à le soutenir.",
      tone: "neutral",
      partyId: winner,
    },
    "primary-right",
  );
  if (participants.includes(state.playerPartyId)) {
    state.flags["primary:right:won"] = winner === state.playerPartyId;
    queueCard(
      state,
      winner === state.playerPartyId ? "v3_primary_right_won" : "v3_primary_right_lost",
    );
  }
}

// ——— 5. Parrainages ———

function runSponsorships(state: GameState, blocs: ElectorateBlocDefinition[]): void {
  const player = state.parties[state.playerPartyId];
  if (
    player &&
    state.decisionIndex === SPONSORSHIP_PLAYER_CARD_DECISION &&
    !state.flags["sponsorship:playerCard"] &&
    player.stats.localStrength < 40
  ) {
    state.flags["sponsorship:playerCard"] = true;
    state.flags["sponsorship:playerAtRisk"] = true;
    queueCard(state, "v3_sponsorship_player");
  }
  if (state.decisionIndex !== SPONSORSHIP_RESOLUTION_DECISION || state.flags["sponsorship:done"])
    return;
  state.flags["sponsorship:done"] = true;

  const failed: string[] = [];
  for (const partyId of Object.keys(MINOR_PARTY_CANDIDATES)) {
    const party = state.parties[partyId];
    if (!party || !isActiveCandidate(state, partyId)) continue;
    const chance = clamp(
      0.55 + party.stats.localStrength * 0.006 + party.stats.polling * 0.08,
      0,
      0.98,
    );
    if (roll(state) >= chance) {
      withdrawParty(state, partyId, blocs, "disqualified");
      failed.push(MINOR_PARTY_CANDIDATES[partyId]!.name);
    }
  }
  if (failed.length > 0) {
    pushNews(
      state,
      {
        headline: `Parrainages : ${failed.join(", ")} ${failed.length > 1 ? "échouent" : "échoue"} à réunir les 500 signatures`,
        body: "CONSEIL CONSTITUTIONNEL — la liste officielle des candidats est plus courte que prévu.",
        tone: "neutral",
      },
      "sponsorship",
    );
  }

  if (player && state.flags["sponsorship:playerAtRisk"]) {
    const bonus = Number(state.flags["sponsorship:bonus"] ?? 0);
    const chance = clamp(0.55 + player.stats.localStrength * 0.006 + bonus, 0.15, 0.98);
    const ok = roll(state) < chance;
    state.flags["sponsorship:playerOk"] = ok;
    if (!ok) {
      withdrawParty(state, state.playerPartyId, blocs, "disqualified");
      state.flags["director:campaignOver"] = "sponsorship";
    }
  }
}

// ——— 6. Coups de théâtre ———

interface CoupCandidate {
  id: string;
  weight: number;
  apply: () => void;
}

function maybeCoupDeTheatre(state: GameState, blocs: ElectorateBlocDefinition[]): void {
  if (state.flags["coup:done"]) return;
  const [start, end] = COUP_WINDOW;
  if (state.decisionIndex < start || state.decisionIndex > end) return;
  const chance = state.decisionIndex >= end - 2 ? 0.08 : 0.025;
  if (roll(state) >= chance) return;

  const coups: CoupCandidate[] = [];
  const rn = state.parties.rn;
  if (rn && isActiveCandidate(state, "rn") && rn.candidateId === "rn_candidate") {
    coups.push({
      id: "lepen_cassation",
      weight: 2,
      apply: () => {
        swapCandidate(state, "rn", "rn_bardella");
        rn.stats.cohesion = clamp(rn.stats.cohesion - 6);
        rn.stats.mobilization = clamp(rn.stats.mobilization + 5);
        rn.hidden.baseSupport = clamp(rn.hidden.baseSupport - 1.5, 0.1, 100);
        pushNews(
          state,
          {
            headline: "Et si… la Cour de cassation confirmait l’inéligibilité de Marine Le Pen",
            body: "SCÉNARIO — Jordan Bardella devient le candidat du Rassemblement national.",
            tone: "neutral",
            partyId: "rn",
          },
          "coup-lepen",
        );
        pushAction(state, {
          actorId: "rn_bardella",
          partyId: "rn",
          kind: "replacement",
          summary:
            "RN : Jordan Bardella remplace Marine Le Pen après la décision de la Cour de cassation (scénario).",
        });
        queueCard(
          state,
          state.playerPartyId === "rn" ? "v3_coup_lepen_player" : "v3_coup_lepen_world",
        );
      },
    });
  }
  const lr = state.parties.lr;
  if (
    lr &&
    isActiveCandidate(state, "lr") &&
    state.actors.lr_bertrand?.candidateStatus === "potential"
  ) {
    coups.push({
      id: "bertrand_dissidence",
      weight: 2,
      apply: () => {
        const actor = state.actors.lr_bertrand!;
        actor.candidateStatus = "declared";
        lr.stats.cohesion = clamp(lr.stats.cohesion - 12);
        lr.hidden.baseSupport = clamp(lr.hidden.baseSupport * 0.78, 0.1, 100);
        for (const neighbour of ["horizons", "renaissance"]) {
          const party = state.parties[neighbour];
          if (party && isActiveCandidate(state, neighbour))
            party.hidden.baseSupport = clamp(party.hidden.baseSupport + 0.6, 0.1, 100);
        }
        pushNews(
          state,
          {
            headline: "Xavier Bertrand maintient une candidature dissidente",
            body: "FRACTURE À DROITE — Les Républicains se divisent en pleine campagne.",
            tone: "negative",
            partyId: "lr",
          },
          "coup-bertrand",
        );
        pushAction(state, {
          actorId: "lr_bertrand",
          partyId: "lr",
          kind: "dissidence",
          summary: "LR : Xavier Bertrand entre en dissidence contre la candidature officielle.",
        });
        queueCard(
          state,
          state.playerPartyId === "lr" ? "v3_coup_bertrand_player" : "v3_coup_bertrand_world",
        );
      },
    });
  }
  const outsider = state.parties.france_humaniste;
  if (outsider && isActiveCandidate(state, "france_humaniste")) {
    coups.push({
      id: "villepin_surge",
      weight: 1.6,
      apply: () => {
        outsider.hidden.baseSupport = clamp(outsider.hidden.baseSupport + 4, 0.1, 100);
        outsider.stats.momentum = clamp(outsider.stats.momentum + 18);
        outsider.stats.mediaPresence = clamp(outsider.stats.mediaPresence + 20);
        pushNews(
          state,
          {
            headline: "La percée surprise de Dominique de Villepin",
            body: "OUTSIDER — un discours sur la paix et l’indépendance fait bouger les lignes au centre.",
            tone: "neutral",
            partyId: "france_humaniste",
          },
          "coup-villepin",
        );
        queueCard(state, "v3_coup_villepin_world");
      },
    });
  }
  if (coups.length === 0) return;
  const [index, , rng] = weightedIndex(
    state.rng,
    coups.map((coup) => coup.weight),
  );
  state.rng = rng;
  const coup = coups[index];
  if (!coup) return;
  state.flags["coup:done"] = true;
  state.flags["coup:id"] = coup.id;
  coup.apply();
  void blocs;
}

// ——— Entrées publiques ———

export function initializeDirector(state: GameState, tragicEvents = true): GameState {
  state.world.salience = { ...BASELINE_SALIENCE };
  state.world.activeShocks = [];
  state.world.protests = [];
  if (!tragicEvents) state.flags["setting:noTragic"] = true;
  return state;
}

export function runCampaignDirector(
  state: GameState,
  blocs: ElectorateBlocDefinition[],
): GameState {
  if (!state.world.salience) initializeDirector(state);
  applyPrimaryResponse(state, blocs);
  applyProtestStance(state);
  if (!CAMPAIGN_PHASES.includes(state.phase)) {
    decayShocks(state);
    updateAgenda(state);
    return state;
  }
  runPsPrimary(state);
  maybeRunRightPrimary(state, blocs);
  runSponsorships(state, blocs);
  maybeCoupDeTheatre(state, blocs);
  decayShocks(state);
  maybeStartShock(state);
  evolveProtests(state);
  maybeStartProtest(state);
  updateAgenda(state);
  return state;
}
