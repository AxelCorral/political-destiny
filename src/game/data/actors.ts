import type { ActorRole, ActorState, CandidateTraits } from "@/game/types";

import { MINOR_PARTY_CANDIDATES, parties } from "./parties";

const EMPTY_MEMORY = { successfulActions: [], failedActions: [], rivalries: [], promises: [] };

interface ActorSeed {
  suffix: string;
  name: string;
  role: ActorRole;
  profile: "orator" | "technocrat" | "organizer" | "negotiator";
}

const actorSeeds: Record<string, ActorSeed[]> = {
  lfi: [
    { suffix: "candidate", name: "Jean-Luc Mélenchon", role: "candidate", profile: "orator" },
    { suffix: "courbet", name: "Nassim Courbet", role: "cadre", profile: "organizer" },
    { suffix: "orsini", name: "Léna Orsini", role: "spokesperson", profile: "orator" },
    { suffix: "perron", name: "Gaël Perron", role: "cadre", profile: "negotiator" },
  ],
  ps: [
    { suffix: "candidate", name: "Raphaël Glucksmann", role: "candidate", profile: "negotiator" },
    { suffix: "marceau", name: "Ilyes Marceau", role: "cadre", profile: "organizer" },
    { suffix: "briand", name: "Solène Briand", role: "spokesperson", profile: "orator" },
    { suffix: "calvet", name: "Rémi Calvet", role: "cadre", profile: "technocrat" },
  ],
  ecologistes: [
    { suffix: "candidate", name: "Marine Tondelier", role: "candidate", profile: "organizer" },
    { suffix: "lestang", name: "Maya Lestang", role: "cadre", profile: "orator" },
    { suffix: "bellier", name: "Jonas Bellier", role: "spokesperson", profile: "technocrat" },
    { suffix: "sarrazin", name: "Inès Sarrazin", role: "cadre", profile: "negotiator" },
  ],
  renaissance: [
    { suffix: "candidate", name: "Gabriel Attal", role: "candidate", profile: "technocrat" },
    { suffix: "varenne", name: "Salomé Varenne", role: "cadre", profile: "negotiator" },
    { suffix: "corbin", name: "Nils Corbin", role: "spokesperson", profile: "orator" },
    { suffix: "artaud", name: "Jeanne Artaud", role: "cadre", profile: "organizer" },
  ],
  horizons: [
    { suffix: "candidate", name: "Édouard Philippe", role: "candidate", profile: "technocrat" },
    { suffix: "lagrive", name: "Théo Lagrive", role: "cadre", profile: "organizer" },
    { suffix: "dorval", name: "Yasmine Dorval", role: "spokesperson", profile: "negotiator" },
    { suffix: "auriac", name: "Paul Auriac", role: "cadre", profile: "orator" },
  ],
  lr: [
    { suffix: "candidate", name: "Bruno Retailleau", role: "candidate", profile: "organizer" },
    { suffix: "merande", name: "Diane Mérande", role: "cadre", profile: "negotiator" },
    { suffix: "cazals", name: "Thomas Cazals", role: "spokesperson", profile: "orator" },
    { suffix: "lenoir", name: "Hector Lenoir", role: "cadre", profile: "technocrat" },
  ],
  rn: [
    { suffix: "candidate", name: "Marine Le Pen", role: "candidate", profile: "orator" },
    { suffix: "ferran", name: "Louis Ferran", role: "cadre", profile: "organizer" },
    { suffix: "nerac", name: "Alix Nérac", role: "spokesperson", profile: "negotiator" },
    { suffix: "vauvert", name: "Damien Vauvert", role: "cadre", profile: "technocrat" },
  ],
  reconquete: [
    { suffix: "candidate", name: "Éric Zemmour", role: "candidate", profile: "orator" },
    { suffix: "saint_cyr", name: "Hélène Saint-Cyr", role: "cadre", profile: "organizer" },
    { suffix: "vales", name: "Gabriel Valès", role: "spokesperson", profile: "orator" },
    { suffix: "mornay", name: "Stan Mornay", role: "cadre", profile: "negotiator" },
  ],
  nouvelle_energie: [
    { suffix: "candidate", name: "David Lisnard", role: "candidate", profile: "technocrat" },
    { suffix: "ternois", name: "Raphaël Ternois", role: "cadre", profile: "organizer" },
    { suffix: "dorme", name: "Camille d’Orme", role: "spokesperson", profile: "orator" },
    { suffix: "castan", name: "Julia Castan", role: "cadre", profile: "negotiator" },
  ],
};

const profileTraits: Record<ActorSeed["profile"], CandidateTraits> = {
  orator: {
    charisma: 76,
    mediaSkill: 74,
    competence: 56,
    tactics: 64,
    integrity: 59,
    endurance: 68,
    authority: 66,
    empathy: 61,
    discipline: 52,
    coalitionSkill: 49,
  },
  technocrat: {
    charisma: 53,
    mediaSkill: 57,
    competence: 82,
    tactics: 64,
    integrity: 68,
    endurance: 64,
    authority: 61,
    empathy: 50,
    discipline: 78,
    coalitionSkill: 62,
  },
  organizer: {
    charisma: 59,
    mediaSkill: 52,
    competence: 66,
    tactics: 71,
    integrity: 65,
    endurance: 79,
    authority: 68,
    empathy: 67,
    discipline: 72,
    coalitionSkill: 58,
  },
  negotiator: {
    charisma: 64,
    mediaSkill: 65,
    competence: 69,
    tactics: 72,
    integrity: 63,
    endurance: 61,
    authority: 54,
    empathy: 72,
    discipline: 67,
    coalitionSkill: 84,
  },
};

function createPartyActor(partyId: string, seed: ActorSeed, index: number): ActorState {
  const party = parties.find((definition) => definition.id === partyId);
  if (!party) throw new Error(`Parti absent pour l’acteur fictif ${seed.name}.`);
  const isCandidate = seed.role === "candidate";
  const traits = structuredClone(profileTraits[seed.profile]);
  return {
    id: `${partyId}_${seed.suffix}`,
    identityKind: isCandidate ? "real_public_figure" : "fictional",
    displayName: seed.name,
    partyId,
    role: seed.role,
    ideology: {
      ...party.ideology,
      economy: Math.max(-100, Math.min(100, party.ideology.economy + (index - 1) * 4)),
    },
    traits,
    legitimacy: isCandidate ? 72 : 48 + index * 8,
    ambition: isCandidate ? 81 : 50 + index * 10,
    loyalty: isCandidate ? 78 : 82 - index * 9,
    mediaSkill: traits.mediaSkill,
    governingCredibility: Math.round((traits.competence + party.baseline.governingCredibility) / 2),
    scandalRisk: 17 + index * 5,
    active: true,
    candidateStatus: isCandidate ? "official" : "potential",
    strategy:
      party.strategicArchetypes[index % party.strategicArchetypes.length] ?? "consolidate_base",
    memory: structuredClone(EMPTY_MEMORY),
  };
}

const partyActors = Object.entries(actorSeeds).flatMap(([partyId, seeds]) =>
  seeds.map((seed, index) => createPartyActor(partyId, seed, index)),
);

/**
 * V3 — candidatures réelles alternatives (voir docs/POLITICAL_BASELINE_2026-11.md) :
 * concurrents de la primaire du pôle socialiste, remplaçant RN en cas d'inéligibilité,
 * dissident LR. Inactifs au départ (`potential`), activés par le directeur de campagne.
 */
function alternativeCandidate(
  id: string,
  displayName: string,
  partyId: string,
  profile: ActorSeed["profile"],
  ideologyShift: Partial<ActorState["ideology"]>,
  overrides: Partial<
    Pick<ActorState, "legitimacy" | "ambition" | "loyalty" | "governingCredibility">
  > = {},
): ActorState {
  const party = parties.find((definition) => definition.id === partyId);
  if (!party) throw new Error(`Parti absent pour ${displayName}.`);
  const traits = structuredClone(profileTraits[profile]);
  return {
    id,
    identityKind: "real_public_figure",
    displayName,
    partyId,
    role: "cadre",
    ideology: { ...party.ideology, ...ideologyShift },
    traits,
    legitimacy: overrides.legitimacy ?? 60,
    ambition: overrides.ambition ?? 78,
    loyalty: overrides.loyalty ?? 55,
    mediaSkill: traits.mediaSkill,
    governingCredibility:
      overrides.governingCredibility ??
      Math.round((traits.competence + party.baseline.governingCredibility) / 2),
    scandalRisk: 15,
    active: true,
    candidateStatus: "potential",
    strategy: "look_presidential",
    memory: structuredClone(EMPTY_MEMORY),
  };
}

const alternativeCandidates: ActorState[] = [
  alternativeCandidate(
    "ps_faure",
    "Olivier Faure",
    "ps",
    "negotiator",
    { europe: 40, economy: -52 },
    { legitimacy: 64 },
  ),
  alternativeCandidate(
    "ps_royal",
    "Ségolène Royal",
    "ps",
    "orator",
    { society: -40, ecology: 56 },
    { legitimacy: 52, loyalty: 40 },
  ),
  alternativeCandidate(
    "rn_bardella",
    "Jordan Bardella",
    "rn",
    "orator",
    { economy: 12, europe: -40 },
    { legitimacy: 74, loyalty: 82 },
  ),
  alternativeCandidate(
    "lr_bertrand",
    "Xavier Bertrand",
    "lr",
    "organizer",
    { society: 10, economy: 18 },
    { legitimacy: 58, loyalty: 35 },
  ),
];

const sensitiveFictionalActors: ActorState[] = [
  ["fictional_treasurer", "Maud Keravel", "Trésorière fictive"],
  ["fictional_consultant", "Léonard Pujol", "Consultant fictif"],
  ["fictional_local_official", "Samira Bellon", "Élue locale fictive"],
  ["fictional_supplier", "Étienne Marot", "Prestataire fictif"],
  ["fictional_campaign_manager", "Anaïs Vercel", "Directrice fictive"],
].map(([id, displayName], index) => ({
  id: id ?? `fictional_context_${index}`,
  identityKind: "fictional",
  displayName: displayName ?? `Personnage secondaire ${index + 1}`,
  partyId: "independent_fictional",
  role: "context",
  ideology: { economy: 0, society: 0, europe: 0, ecology: 0, authority: 0, immigration: 0 },
  traits: structuredClone(profileTraits.organizer),
  legitimacy: 40,
  ambition: 35,
  loyalty: 55,
  mediaSkill: 42,
  governingCredibility: 45,
  scandalRisk: 45,
  active: true,
  candidateStatus: "none",
  strategy: "limit_risk",
  memory: structuredClone(EMPTY_MEMORY),
}));

const minorPartyCandidates: ActorState[] = Object.entries(MINOR_PARTY_CANDIDATES).map(
  ([partyId, candidate]) => ({
    ...createPartyActor(
      partyId,
      { suffix: "candidate", name: candidate.name, role: "candidate", profile: "orator" },
      0,
    ),
    legitimacy: 62,
  }),
);

export const actors: ActorState[] = [
  ...partyActors,
  ...alternativeCandidates,
  ...minorPartyCandidates,
  ...sensitiveFictionalActors,
];
