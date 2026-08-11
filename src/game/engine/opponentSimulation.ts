import type {
  ActorState,
  ElectorateBlocDefinition,
  GameState,
  NewsItem,
  OpponentActionRecord,
  OpponentStrategy,
  PartyState,
} from "@/game/types";

import { clamp, ideologyDistance } from "./math";
import { applyPartySplit } from "./partyDynamics";
import { redistributeAllianceBoost, redistributeElectorate } from "./redistribution";
import { random, randomBetween, weightedIndex } from "./rng";
import { computeBlocFragmentationPressure, computeElectoralViability } from "./viability";

const STRATEGIES: OpponentStrategy[] = [
  "consolidate_base",
  "look_presidential",
  "attack_favorite",
  "poach_neighbor",
  "media_momentum",
  "prepare_alliance",
  "limit_risk",
  "useful_vote",
  "prepare_runoff",
];

/**
 * `redistributeElectorate`/`redistributeAllianceBoost` sont des fonctions
 * pures (retournent un état cloné) pour rester cohérentes avec
 * `recalculateElectorate`. Ce fichier mute `state` en place partout ailleurs
 * (convention déjà établie) — ce petit adaptateur applique le résultat du
 * calcul pur sans remplacer l'identité des objets `state.parties[x]`, pour
 * que les références déjà détenues plus loin dans la même itération de
 * boucle restent valides.
 */
function applyRedistributedElectorate(state: GameState, redistributed: GameState): void {
  state.electorate = redistributed.electorate;
  for (const [partyId, party] of Object.entries(state.parties)) {
    const updated = redistributed.parties[partyId];
    if (updated) party.stats.polling = updated.stats.polling;
  }
}

function addOpponentAction(
  state: GameState,
  action: Omit<OpponentActionRecord, "decisionIndex" | "date">,
): void {
  state.opponentActions.push({
    decisionIndex: state.decisionIndex,
    date: state.currentDate,
    ...action,
  });
  state.opponentActions = state.opponentActions.slice(-80);
}

function setRelation(state: GameState, leftPartyId: string, rightPartyId: string, delta: number) {
  state.partyRelations[leftPartyId] ??= {};
  state.partyRelations[rightPartyId] ??= {};
  const next = clamp((state.partyRelations[leftPartyId][rightPartyId] ?? 0) + delta, -100, 100);
  state.partyRelations[leftPartyId][rightPartyId] = next;
  state.partyRelations[rightPartyId][leftPartyId] = next;
  return next;
}

function bestAlliancePartner(state: GameState, party: PartyState): PartyState | undefined {
  return Object.values(state.parties)
    .filter(
      (candidate) =>
        candidate.active &&
        candidate.id !== party.id &&
        candidate.id !== state.playerPartyId &&
        !party.alliedWith.includes(candidate.id),
    )
    .sort((left, right) => {
      const leftRelation = state.partyRelations[party.id]?.[left.id] ?? 0;
      const rightRelation = state.partyRelations[party.id]?.[right.id] ?? 0;
      const leftDistance = ideologyDistance(party.perceivedIdeology, left.perceivedIdeology);
      const rightDistance = ideologyDistance(party.perceivedIdeology, right.perceivedIdeology);
      return (
        rightRelation - leftRelation ||
        leftDistance - rightDistance ||
        left.id.localeCompare(right.id)
      );
    })[0];
}

function formAlliance(
  state: GameState,
  party: PartyState,
  partner: PartyState,
  blocs: ElectorateBlocDefinition[],
): void {
  if (!party.alliedWith.includes(partner.id)) party.alliedWith.push(partner.id);
  if (!partner.alliedWith.includes(party.id)) partner.alliedWith.push(party.id);
  setRelation(state, party.id, partner.id, 12);
  party.hidden.transferability = clamp(party.hidden.transferability + 3);
  partner.hidden.transferability = clamp(partner.hidden.transferability + 2);
  const boosted = redistributeAllianceBoost(state, blocs, party.id, partner.id);
  applyRedistributedElectorate(state, boosted);
}

function handleRunoffEndorsement(
  state: GameState,
  party: PartyState,
  actor: ActorState,
  news: NewsItem[],
): boolean {
  if (
    state.phase !== "between_rounds" ||
    state.qualifiedPartyIds?.includes(party.id) ||
    state.flags[`endorsement:${party.id}`] !== undefined
  )
    return false;
  const finalists = (state.qualifiedPartyIds ?? [])
    .map((partyId) => state.parties[partyId])
    .filter((candidate): candidate is PartyState => Boolean(candidate));
  if (finalists.length !== 2) return false;
  const ranked = finalists
    .map((finalist) => ({
      finalist,
      score:
        (state.partyRelations[party.id]?.[finalist.id] ?? 0) * 0.7 -
        ideologyDistance(party.perceivedIdeology, finalist.perceivedIdeology) * 0.55 -
        finalist.stats.rejection * 0.12,
    }))
    .sort(
      (left, right) =>
        right.score - left.score || left.finalist.id.localeCompare(right.finalist.id),
    );
  const preferred = ranked[0];
  if (!preferred) return false;
  let roll: number;
  [roll, state.rng] = random(state.rng);
  const supports = preferred.score > -30 && roll < clamp(0.45 + preferred.score / 180, 0.18, 0.82);
  state.flags[`endorsement:${party.id}`] = supports ? preferred.finalist.id : "neutral";
  actor.candidateStatus = "eliminated";
  if (!supports) return true;
  setRelation(state, party.id, preferred.finalist.id, 8);
  addOpponentAction(state, {
    actorId: actor.id,
    partyId: party.id,
    kind: "endorsement",
    summary: `${party.shortName} appelle à soutenir ${preferred.finalist.shortName} au second tour simulé.`,
  });
  if (news.length < 2)
    news.push({
      id: `news-${state.runId}-${state.decisionIndex}-${party.id}-endorsement`,
      date: state.currentDate,
      headline: `${party.shortName} choisit son camp pour le second tour`,
      body: `La candidature éliminée apporte son soutien à ${preferred.finalist.shortName}. Cette consigne pèsera sur les reports sans les garantir.`,
      tone: "neutral",
      partyId: party.id,
    });
  return true;
}

/**
 * PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md §4-9/§30 —
 * `StrategicWithdrawalDecision` distingue explicitement le désistement
 * stratégique du retrait par effondrement (`maybeWithdrawAndRally`
 * ci-dessous, inchangé) : un parti encore réel, sans crise interne, qui
 * n'a plus de voie crédible vers le second tour ET dont le maintien
 * fragmente son propre bloc électoral peut négocier, plutôt que subir.
 * Persisté transitoirement dans `state.flags` (`negotiation:*`,
 * `negotiation_opened_at:*`, `negotiation_cooldown:*`) — le format `flags`
 * existant (clé → valeur simple) ne porte pas de structure imbriquée ; cette
 * interface documente la décision complète telle qu'elle est raisonnée à
 * l'ouverture et à la résolution, pas un nouveau conteneur d'état.
 */
export interface StrategicWithdrawalDecision {
  partyId: string;
  viability: number;
  blocFragmentationPressure: number;
  preferredPartnerId?: string;
  negotiationOutcome: "pending" | "accepted" | "refused" | "maintained";
  endorsementStrength: "none" | "explicit_support" | "coalition_agreement";
  concessions: string[];
  withdrawalReason: "collapse" | "strategic";
}

const NEGOTIATION_OPEN_MIN_DECISION = 8;
const NEGOTIATION_OPEN_MAX_DECISION = 19;
const NEGOTIATION_RESOLUTION_DELAY = 3;
/**
 * §11 — historique du calibrage, conservé pour traçabilité (voir aussi
 * `AUDIT_STRATEGIC_REALIGNMENTS.md` §2 et `STRATEGIC_REALIGNMENTS_REPORT.md`
 * §5) :
 *
 * 1. Premier calibrage (viabilité < 6, fragmentation > 12) : 45 % de
 *    désistements stratégiques sur un corpus de 360 campagnes, taux
 *    Écologistes 18,6 % — largement au-delà de « rare, plausible ».
 * 2. Resserré à viabilité < -5 puis < -1 avec un plancher de rang
 *    (`NEGOTIATION_MIN_RANK`, exclut le top 4) : fréquence globale ramenée à
 *    ~2,9-5 % (plausible), mais 0 désistement stratégique Écologistes sur
 *    10 800 puis 7 200 campagnes — les Écologistes, dont le socle n'est pas
 *    le plus faible du jeu (`PARTY_GAMEPLAY_IDENTITIES.md` — c'est
 *    Reconquête), n'atteignaient jamais ces seuils en jeu naturel.
 * 3. Diagnostic : `computeElectoralViability` laissait des termes
 *    secondaires (momentum, écart crédibilité/rejet — délibérément bas pour
 *    les Écologistes, donc favorable) compenser un écart réel de 10-13
 *    points au duo de tête. `gapToTop2` y domine désormais bien plus
 *    largement (`viability.ts`), rendant la formule sensible sur une
 *    échelle beaucoup plus négative (-30 à +23 observés selon le parti,
 *    contre -16 à +14 avant) : le seuil est donc recalibré en proportion,
 *    pas au même niveau numérique qu'avant l'étape 3.
 */
const NEGOTIATION_VIABILITY_CEILING = -6;
const NEGOTIATION_MIN_RANK = 5;
/** Si la viabilité a suffisamment remonté au moment de la résolution, le parti se maintient (§9 scénario 4). */
const MAINTAIN_VIABILITY_FLOOR = 6;
const NEGOTIATION_FRAGMENTATION_FLOOR = 28;

function hostileMemoryScore(state: GameState, leftActorId: string, rightActorId: string): number {
  return state.actorMemories.filter(
    (memory) =>
      memory.active &&
      ["hostility", "betrayal", "alliance_refusal", "humiliation"].includes(memory.kind) &&
      ((memory.actorId === leftActorId && memory.targetActorId === rightActorId) ||
        (memory.actorId === rightActorId && memory.targetActorId === leftActorId)),
  ).length;
}

/**
 * §6/§31 — le partenaire préféré vient de `party.naturalAllies` (donnée de
 * contenu déjà existante, jamais un script par parti), restreint aux partis
 * encore actifs et jamais au joueur (même exclusion que `bestAlliancePartner`
 * : une négociation initiée par un PNJ contre le joueur retirerait son
 * agence sans qu'il y consente).
 */
function preferredStrategicPartner(state: GameState, party: PartyState): PartyState | undefined {
  const candidates = party.naturalAllies
    .map((id) => state.parties[id])
    .filter(
      (candidate): candidate is PartyState =>
        Boolean(candidate) && candidate!.active && candidate!.id !== state.playerPartyId,
    );
  return candidates
    .map((candidate) => ({
      candidate,
      score: candidate.stats.polling,
    }))
    .sort((left, right) => right.score - left.score)[0]?.candidate;
}

/**
 * §7-8 — le processus tient sur deux événements (ouverture, résolution),
 * dans la fourchette « 1 à 3 événements selon importance » : la résolution
 * elle-même porte à la fois l'issue de la négociation et, si elle réussit, le
 * retrait effectif — un troisième événement séparé n'ajouterait rien de plus
 * lisible pour le joueur. Peut échouer (§7) et peut aboutir au maintien
 * plutôt qu'au retrait si la viabilité s'est reconstruite entre-temps (§9
 * scénario 4 — un petit score ne doit jamais impliquer mécaniquement un
 * retrait, §10).
 */
function maybeNegotiateStrategicWithdrawal(
  state: GameState,
  party: PartyState,
  actor: ActorState,
  news: NewsItem[],
  blocs: ElectorateBlocDefinition[],
): boolean {
  if (!["campaign", "official_campaign"].includes(state.phase)) return false;

  const openedAt = state.flags[`negotiation_opened_at:${party.id}`];
  const partnerId = state.flags[`negotiation:${party.id}`];

  if (typeof openedAt === "number" && typeof partnerId === "string") {
    if (state.decisionIndex - openedAt < NEGOTIATION_RESOLUTION_DELAY) return false;
    return resolveStrategicNegotiation(state, party, actor, partnerId, news, blocs);
  }

  const cooldown = state.flags[`negotiation_cooldown:${party.id}`];
  if (typeof cooldown === "number" && state.decisionIndex < cooldown) return false;
  if (
    state.decisionIndex < NEGOTIATION_OPEN_MIN_DECISION ||
    state.decisionIndex > NEGOTIATION_OPEN_MAX_DECISION
  )
    return false;
  // Une négociation stratégique suppose une campagne encore fonctionnelle —
  // c'est précisément ce qui la distingue de l'effondrement (§4) : la crise
  // interne (légitimité, cohésion) reste le domaine de `maybeWithdrawAndRally`.
  if (actor.legitimacy < 45 || party.stats.cohesion < 35) return false;

  const viability = computeElectoralViability(state, party.id, blocs);
  const fragmentation = computeBlocFragmentationPressure(state, party.id, blocs);
  if (!viability || !fragmentation) return false;
  if (viability.rank < NEGOTIATION_MIN_RANK) return false;
  if (viability.viability >= NEGOTIATION_VIABILITY_CEILING) return false;
  if (fragmentation.pressure < NEGOTIATION_FRAGMENTATION_FLOOR) return false;

  const partner = preferredStrategicPartner(state, party);
  if (!partner) return false;

  let roll: number;
  [roll, state.rng] = random(state.rng);
  // Même ordre de grandeur que `maybeWithdrawAndRally` (plafond 0,05) —
  // l'un et l'autre chemin de retrait doivent rester rares à l'échelle
  // d'une campagne complète malgré une fenêtre de plusieurs décisions et
  // plusieurs partis éligibles en parallèle (§11).
  const openChance = clamp(
    0.006 +
      Math.max(0, NEGOTIATION_VIABILITY_CEILING - viability.viability) * 0.004,
    0.006,
    0.055,
  );
  if (roll >= openChance) return false;

  state.flags[`negotiation:${party.id}`] = partner.id;
  state.flags[`negotiation_opened_at:${party.id}`] = state.decisionIndex;
  addOpponentAction(state, {
    actorId: actor.id,
    partyId: party.id,
    kind: "negotiation_opened",
    summary: `${party.shortName} ouvre des discussions avec ${partner.shortName} après des sondages qui ne laissent plus de voie crédible vers le second tour.`,
  });
  if (news.length < 2)
    news.push({
      id: `news-${state.runId}-${state.decisionIndex}-${party.id}-negotiation-opened`,
      date: state.currentDate,
      headline: `${party.shortName} en discussion avec ${partner.shortName}`,
      body: `Sans voie crédible vers le second tour, la candidature explore un accord électoral avec ${partner.shortName} plutôt que de poursuivre seule.`,
      tone: "neutral",
      partyId: party.id,
    });
  return true;
}

function resolveStrategicNegotiation(
  state: GameState,
  party: PartyState,
  actor: ActorState,
  partnerId: string,
  news: NewsItem[],
  blocs: ElectorateBlocDefinition[],
): boolean {
  delete state.flags[`negotiation:${party.id}`];
  delete state.flags[`negotiation_opened_at:${party.id}`];
  state.flags[`negotiation_cooldown:${party.id}`] = state.decisionIndex + 6;

  const partner = state.parties[partnerId];
  if (!partner?.active) return false;

  const viability = computeElectoralViability(state, party.id, blocs);
  if (viability && viability.viability >= MAINTAIN_VIABILITY_FLOOR) {
    addOpponentAction(state, {
      actorId: actor.id,
      partyId: party.id,
      kind: "negotiation_failed",
      summary: `${party.shortName} rompt les discussions avec ${partner.shortName} : la dynamique de campagne rouvre une voie vers le second tour.`,
    });
    if (news.length < 2)
      news.push({
        id: `news-${state.runId}-${state.decisionIndex}-${party.id}-negotiation-maintained`,
        date: state.currentDate,
        headline: `${party.shortName} maintient sa candidature`,
        body: `Le regain de dynamique met fin aux discussions avec ${partner.shortName} : la campagne se poursuit seule.`,
        tone: "positive",
        partyId: party.id,
      });
    return true;
  }

  const relation = state.partyRelations[party.id]?.[partnerId] ?? 0;
  const distance = ideologyDistance(party.perceivedIdeology, partner.perceivedIdeology);
  const fragmentation = computeBlocFragmentationPressure(state, party.id, blocs);
  const hostility = hostileMemoryScore(state, actor.id, partner.candidateId);
  const decisionsBeforeFirstRound = Math.max(0, 24 - state.decisionIndex);

  const acceptChance = clamp(
    0.32 +
      relation / 220 -
      distance / 260 -
      (actor.ambition - 50) / 200 +
      (fragmentation?.pressure ?? 0) / 260 -
      hostility * 0.08 +
      Math.max(0, 12 - decisionsBeforeFirstRound) * 0.01,
    0.05,
    0.85,
  );

  let roll: number;
  [roll, state.rng] = random(state.rng);
  if (roll >= acceptChance) {
    setRelation(state, party.id, partnerId, -8);
    addOpponentAction(state, {
      actorId: actor.id,
      partyId: party.id,
      kind: "negotiation_failed",
      summary: `${party.shortName} et ${partner.shortName} ne trouvent pas d'accord : ${party.shortName} maintient sa candidature.`,
    });
    if (news.length < 2)
      news.push({
        id: `news-${state.runId}-${state.decisionIndex}-${party.id}-negotiation-failed`,
        date: state.currentDate,
        headline: `Échec des discussions ${party.shortName}-${partner.shortName}`,
        body: `Les deux équipes ne s'entendent pas sur les conditions d'un retrait. ${party.shortName} reste en course.`,
        tone: "negative",
        partyId: party.id,
      });
    return true;
  }

  const consigneStrength =
    party.alliedWith.includes(partnerId) || relation >= 60 ? "coalition_agreement" : "explicit_support";
  actor.candidateStatus = "withdrawn";
  actor.active = false;
  party.active = false;
  const redistribution = redistributeElectorate(state, blocs, party.id, {
    partnerId,
    strength: consigneStrength,
  });
  applyRedistributedElectorate(state, redistribution.state);
  setRelation(state, party.id, partnerId, 15);
  state.flags[`rallying:${party.id}`] = partnerId;
  actor.partyId = partnerId;
  actor.role = "ally";

  addOpponentAction(state, {
    actorId: actor.id,
    partyId: party.id,
    kind: "strategic_withdrawal",
    summary: `${party.shortName} se retire au profit de ${partner.shortName} au terme d'un accord électoral (consigne : ${consigneStrength === "coalition_agreement" ? "accord de coalition" : "soutien explicite"}).`,
  });
  const beneficiaries = Object.entries(redistribution.transfers)
    .filter(([id, delta]) => id !== party.id && delta > 0.15)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => state.parties[id]?.shortName ?? id);
  if (news.length < 2)
    news.push({
      id: `news-${state.runId}-${state.decisionIndex}-${party.id}-strategic-withdrawal`,
      date: state.currentDate,
      headline: `${party.shortName} se désiste pour ${partner.shortName}`,
      body: `RECOMPOSITION NÉGOCIÉE — ${party.shortName} retire sa candidature au terme d'un accord avec ${partner.shortName} et appelle à voter pour son bloc${beneficiaries.length > 0 ? `, en particulier vers ${beneficiaries.join(" et ")}` : ""}.`,
      tone: "neutral",
      partyId: party.id,
    });
  return true;
}

/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §13/§15 —
 * avant cette mission, le déclenchement exigeait `polling < 2` ET
 * `legitimacy < 35` : un parti ne se retirait jamais sauf déjà quasi mort,
 * rendant impossible le scénario explicitement demandé (« LR renonce après
 * une campagne en échec » — un parti installé, pas un parti à l'agonie).
 * Élargi à un OU (polling bas OU légitimité basse) avec une probabilité par
 * décision plafonnée plus bas qu'avant (0,05 contre 0,08) pour que la
 * fréquence globale sur une campagne complète reste rare (mesurée en Phase G,
 * REALITY_GROUNDED_CAMPAIGN_REPORT.md) malgré une population de partis
 * éligibles nettement plus large. Chemin distinct de
 * `maybeNegotiateStrategicWithdrawal` ci-dessus (`withdrawalReason:
 * "collapse"` implicite — aucune négociation, un effondrement peut être
 * subi).
 */
function maybeWithdrawAndRally(
  state: GameState,
  party: PartyState,
  actor: ActorState,
  news: NewsItem[],
  blocs: ElectorateBlocDefinition[],
): boolean {
  if (
    state.decisionIndex < 14 ||
    !["campaign", "official_campaign"].includes(state.phase) ||
    (party.stats.polling >= 6 && actor.legitimacy >= 45)
  )
    return false;
  let roll: number;
  [roll, state.rng] = random(state.rng);
  const chance = clamp(
    0.002 +
      Math.max(0, 6 - party.stats.polling) * 0.009 +
      Math.max(0, 45 - actor.legitimacy) * 0.0006 +
      Math.max(0, 40 - party.stats.cohesion) * 0.0004,
    0.002,
    0.05,
  );
  if (roll >= chance) return false;
  const partner = bestAlliancePartner(state, party);
  actor.candidateStatus = "withdrawn";
  actor.active = false;
  party.active = false;
  const redistribution = redistributeElectorate(state, blocs, party.id);
  applyRedistributedElectorate(state, redistribution.state);
  addOpponentAction(state, {
    actorId: actor.id,
    partyId: party.id,
    kind: "withdrawal",
    summary: `${party.shortName} retire sa candidature après une campagne devenue sans issue.`,
  });
  if (partner && (state.partyRelations[party.id]?.[partner.id] ?? 0) > 0) {
    state.flags[`rallying:${party.id}`] = partner.id;
    actor.partyId = partner.id;
    actor.role = "ally";
    setRelation(state, party.id, partner.id, 10);
    addOpponentAction(state, {
      actorId: actor.id,
      partyId: party.id,
      kind: "rallying",
      summary: `L’ancienne tête de liste de ${party.shortName} rejoint la campagne ${partner.shortName}.`,
    });
  }
  const beneficiaries = Object.entries(redistribution.transfers)
    .filter(([id, delta]) => id !== party.id && delta > 0.15)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => state.parties[id]?.shortName ?? id);
  if (news.length < 2)
    news.push({
      id: `news-${state.runId}-${state.decisionIndex}-${party.id}-withdrawal`,
      date: state.currentDate,
      headline: `${party.shortName} retire sa candidature`,
      body:
        beneficiaries.length > 0
          ? `RECOMPOSITION DE LA COURSE — le retrait de ${party.shortName} redistribue son électorat, en particulier vers ${beneficiaries.join(" et ")}.`
          : `Son électorat se redistribue entre les candidatures restantes, sans direction dominante identifiée.${partner ? ` Son équipe se rapproche de ${partner.shortName}.` : ""}`,
      tone: "neutral",
      partyId: party.id,
    });
  return true;
}

function chooseStrategy(
  party: PartyState,
  actor: ActorState | undefined,
  state: GameState,
): [OpponentStrategy, GameState] {
  const weights = STRATEGIES.map((strategy) => {
    switch (strategy) {
      case "consolidate_base":
        return Math.max(0.2, 100 - party.stats.mobilization);
      case "look_presidential":
        return Math.max(0.2, 100 - party.stats.credibility);
      case "attack_favorite":
        return Math.max(0.2, party.stats.rejection * 0.45 + (party.stats.polling < 15 ? 8 : 2));
      case "poach_neighbor":
        return Math.max(0.2, actor?.traits.tactics ?? 50);
      case "media_momentum":
        return Math.max(0.2, actor?.mediaSkill ?? 50);
      case "prepare_alliance":
        return Math.max(0.2, 100 - party.stats.cohesion + (actor?.traits.coalitionSkill ?? 50));
      case "limit_risk":
        return Math.max(0.2, party.hidden.scandalRisk + (100 - (actor?.traits.discipline ?? 50)));
      case "useful_vote":
        return state.decisionIndex > 16 ? Math.max(1, party.stats.polling) * 1.8 : 1;
      case "prepare_runoff":
        return state.phase === "between_rounds" ? 100 : Math.max(0.5, party.stats.polling - 12);
      default:
        return 1;
    }
  });
  const [index, , rng] = weightedIndex(state.rng, weights);
  return [STRATEGIES[index] ?? "consolidate_base", { ...state, rng }];
}

function applyStrategy(party: PartyState, strategy: OpponentStrategy, success: boolean): void {
  const factor = success ? 1 : -0.45;
  switch (strategy) {
    case "consolidate_base":
      party.stats.mobilization = clamp(party.stats.mobilization + 1.6 * factor);
      party.stats.mediaPresence = clamp(party.stats.mediaPresence - 0.3);
      break;
    case "look_presidential":
      party.stats.credibility = clamp(party.stats.credibility + 1.35 * factor);
      party.stats.popularity = clamp(party.stats.popularity + 0.55 * factor);
      break;
    case "attack_favorite":
      party.stats.mediaPresence = clamp(party.stats.mediaPresence + 1.25 * factor);
      party.stats.rejection = clamp(party.stats.rejection + (success ? 0.4 : 1.1));
      break;
    case "poach_neighbor":
      party.stats.momentum = clamp(party.stats.momentum + 1.45 * factor);
      party.hidden.potentialSupport = clamp(party.hidden.potentialSupport + 0.65 * factor);
      break;
    case "media_momentum":
      party.stats.mediaPresence = clamp(party.stats.mediaPresence + 1.7 * factor);
      party.stats.momentum = clamp(party.stats.momentum + 1.1 * factor);
      break;
    case "prepare_alliance":
      party.hidden.transferability = clamp(party.hidden.transferability + 1.2 * factor);
      party.stats.cohesion = clamp(party.stats.cohesion + 0.55 * factor);
      break;
    case "limit_risk":
      party.hidden.scandalRisk = clamp(party.hidden.scandalRisk - 1.4 * factor);
      party.stats.mediaPresence = clamp(party.stats.mediaPresence - 0.45);
      break;
    case "useful_vote":
      party.stats.momentum = clamp(party.stats.momentum + 1.8 * factor);
      party.stats.rejection = clamp(party.stats.rejection + (success ? 0.2 : 0.8));
      break;
    case "prepare_runoff":
      party.stats.credibility = clamp(party.stats.credibility + 1.25 * factor);
      party.hidden.transferability = clamp(party.hidden.transferability + 1.4 * factor);
      break;
  }
}

export function replaceCandidate(
  sourceState: GameState,
  partyId: string,
  blocs: ElectorateBlocDefinition[],
): { state: GameState; replacement?: ActorState } {
  const state = structuredClone(sourceState);
  const party = state.parties[partyId];
  if (!party) return { state };

  const candidates = Object.values(state.actors).filter(
    (actor) =>
      actor.partyId === partyId &&
      actor.id !== party.candidateId &&
      actor.identityKind === "fictional" &&
      actor.active &&
      !["withdrawn", "disqualified", "eliminated"].includes(actor.candidateStatus),
  );
  if (candidates.length === 0) {
    party.active = false;
    const redistribution = redistributeElectorate(state, blocs, partyId);
    applyRedistributedElectorate(state, redistribution.state);
    return { state };
  }

  const weights = candidates.map((actor) => {
    const ideologicalFit = Math.max(
      0,
      100 - Math.abs(actor.ideology.economy - party.ideology.economy),
    );
    return Math.max(
      0.1,
      actor.legitimacy * 0.32 +
        actor.ambition * 0.18 +
        actor.loyalty * 0.14 +
        actor.governingCredibility * 0.2 +
        ideologicalFit * 0.16,
    );
  });
  const [index, , rng] = weightedIndex(state.rng, weights);
  const replacement = candidates[index];
  if (!replacement) return { state: { ...state, rng } };

  const former = state.actors[party.candidateId];
  if (former) {
    former.candidateStatus = "withdrawn";
    former.active = false;
  }
  replacement.candidateStatus = "official";
  replacement.role = "candidate";
  party.candidateId = replacement.id;
  party.stats.cohesion = clamp(party.stats.cohesion - 5);
  party.stats.mediaPresence = clamp(party.stats.mediaPresence + 4);
  state.rng = rng;
  return { state, replacement };
}

export function simulateOpponentTurn(
  sourceState: GameState,
  blocs: ElectorateBlocDefinition[],
): GameState {
  let state = structuredClone(sourceState);
  const news: NewsItem[] = [];

  for (const party of Object.values(state.parties)) {
    if (!party.active || party.id === state.playerPartyId) continue;
    const actor = state.actors[party.candidateId];
    if (!actor?.active) continue;
    if (handleRunoffEndorsement(state, party, actor, news)) continue;
    if (maybeNegotiateStrategicWithdrawal(state, party, actor, news, blocs)) continue;
    if (maybeWithdrawAndRally(state, party, actor, news, blocs)) continue;

    const previousStrategy = actor.strategy;
    let strategy: OpponentStrategy;
    [strategy, state] = chooseStrategy(party, actor, state);
    actor.strategy = strategy;
    let successRoll: number;
    [successRoll, state.rng] = random(state.rng);
    const skill =
      (actor.traits.tactics +
        actor.mediaSkill +
        actor.governingCredibility +
        actor.traits.discipline) /
      400;
    const success = successRoll < 0.44 + skill * 0.35;
    applyStrategy(party, strategy, success);

    if (strategy !== previousStrategy && state.decisionIndex % 3 === 0) {
      addOpponentAction(state, {
        actorId: actor.id,
        partyId: party.id,
        kind: "strategy",
        summary: `${party.shortName} réoriente sa campagne vers la stratégie « ${strategy.replaceAll("_", " ")} ».`,
      });
    }

    if (strategy === "prepare_alliance" && success) {
      const partner = bestAlliancePartner(state, party);
      if (partner) {
        const relation = setRelation(
          state,
          party.id,
          partner.id,
          1.5 + actor.traits.coalitionSkill / 50,
        );
        let allianceRoll: number;
        [allianceRoll, state.rng] = random(state.rng);
        if (relation >= 42 && allianceRoll < 0.18) {
          formAlliance(state, party, partner, blocs);
          addOpponentAction(state, {
            actorId: actor.id,
            partyId: party.id,
            kind: "alliance",
            summary: `${party.shortName} et ${partner.shortName} concluent un accord de campagne simulé.`,
          });
          if (news.length < 2)
            news.push({
              id: `news-${state.runId}-${state.decisionIndex}-${party.id}-alliance`,
              date: state.currentDate,
              headline: `${party.shortName} et ${partner.shortName} trouvent un accord`,
              body: "Les deux équipes coordonnent une partie de leur campagne et préparent leurs reports de voix.",
              tone: "neutral",
              partyId: party.id,
            });
        }
      }
    }

    let crisisRoll: number;
    [crisisRoll, state.rng] = random(state.rng);
    const crisisChance = Math.max(
      0.001,
      (party.hidden.scandalRisk + (100 - party.stats.cohesion)) / 6_000,
    );
    if (crisisRoll < crisisChance && actor.identityKind === "fictional") {
      let severity: number;
      [severity, state.rng] = randomBetween(state.rng, 8, 20);
      actor.legitimacy = clamp(actor.legitimacy - severity);
      party.stats.cohesion = clamp(party.stats.cohesion - severity * 0.45);
      addOpponentAction(state, {
        actorId: actor.id,
        partyId: party.id,
        kind: "crisis",
        summary: `Une crise interne fragilise la légitimité de la candidature ${party.shortName}.`,
      });
      let replacementRoll: number;
      [replacementRoll, state.rng] = random(state.rng);
      if (actor.legitimacy < 30 || (state.decisionIndex >= 5 && replacementRoll < 0.025)) {
        const replaced = replaceCandidate(state, party.id, blocs);
        state = replaced.state;
        addOpponentAction(state, {
          actorId: replaced.replacement?.id ?? actor.id,
          partyId: party.id,
          kind: replaced.replacement
            ? state.decisionIndex < 8
              ? "primary"
              : "replacement"
            : "withdrawal",
          summary: replaced.replacement
            ? `${replaced.replacement.displayName} remplace la tête de campagne ${party.shortName}.`
            : `${party.shortName} retire sa candidature faute de remplaçant disponible.`,
        });
        news.push({
          id: `news-${state.runId}-${state.decisionIndex}-${party.id}-replacement`,
          date: state.currentDate,
          headline: `${party.shortName} change de candidat`,
          body: replaced.replacement
            ? `${replaced.replacement.displayName}, personnalité du mouvement, reprend une campagne fragilisée.`
            : "Le mouvement suspend sa candidature faute de solution consensuelle.",
          tone: "neutral",
          partyId: party.id,
        });
      } else if (party.stats.cohesion < 28 && party.hidden.rivalAmbition > 68) {
        let splitRoll: number;
        [splitRoll, state.rng] = random(state.rng);
        if (splitRoll < 0.08) {
          const splitId = applyPartySplit(state, party.id);
          if (splitId) {
            addOpponentAction(state, {
              actorId: state.parties[splitId]!.candidateId,
              partyId: party.id,
              kind: "dissidence",
              summary: `Une aile de ${party.shortName} lance une candidature dissidente.`,
            });
          }
        }
      }
    }

    let headlineRoll: number;
    [headlineRoll, state.rng] = randomBetween(state.rng, 0, 1);
    if (headlineRoll < 0.055 && news.length < 2) {
      news.push({
        id: `news-${state.runId}-${state.decisionIndex}-${party.id}`,
        date: state.currentDate,
        headline: success
          ? `${party.shortName} gagne en rythme`
          : `${party.shortName} cherche son second souffle`,
        body: success
          ? "Une initiative de campagne de son candidat améliore sa dynamique dans la course."
          : "Une séquence préparée par son équipe peine à déplacer le rapport de force.",
        tone: success ? "positive" : "negative",
        partyId: party.id,
      });
    }
  }

  if (state.decisionIndex % 4 === 0 && news.length === 0) {
    const latest = [...state.opponentActions]
      .reverse()
      .filter((action) => action.decisionIndex >= state.decisionIndex - 3)
      .slice(0, 2);
    if (latest.length > 0) {
      news.push({
        id: `news-${state.runId}-${state.decisionIndex}-opponent-brief`,
        date: state.currentDate,
        headline: "Les campagnes adverses ajustent leur ligne",
        body: latest.map((action) => action.summary).join(" "),
        tone: "neutral",
      });
    }
  }

  state.publicNews = [...news, ...state.publicNews].slice(0, 30);
  return state;
}
