import type { ActorRole, ActorState, CandidateTraits } from "@/game/types";

import { parties } from "./parties";

const EMPTY_MEMORY = { successfulActions: [], failedActions: [], rivalries: [], promises: [] };

interface ActorSeed {
  suffix: string;
  name: string;
  role: ActorRole;
  profile: "orator" | "technocrat" | "organizer" | "negotiator";
}

const actorSeeds: Record<string, ActorSeed[]> = {
  lfi: [
    { suffix: "candidate", name: "Ariane Valmont", role: "candidate", profile: "orator" },
    { suffix: "courbet", name: "Nassim Courbet", role: "cadre", profile: "organizer" },
    { suffix: "orsini", name: "Léna Orsini", role: "spokesperson", profile: "orator" },
    { suffix: "perron", name: "Gaël Perron", role: "cadre", profile: "negotiator" },
  ],
  ps: [
    { suffix: "candidate", name: "Clara Villedieu", role: "candidate", profile: "negotiator" },
    { suffix: "marceau", name: "Ilyes Marceau", role: "cadre", profile: "organizer" },
    { suffix: "briand", name: "Solène Briand", role: "spokesperson", profile: "orator" },
    { suffix: "calvet", name: "Rémi Calvet", role: "cadre", profile: "technocrat" },
  ],
  ecologistes: [
    { suffix: "candidate", name: "Éloi Vernet", role: "candidate", profile: "organizer" },
    { suffix: "lestang", name: "Maya Lestang", role: "cadre", profile: "orator" },
    { suffix: "bellier", name: "Jonas Bellier", role: "spokesperson", profile: "technocrat" },
    { suffix: "sarrazin", name: "Inès Sarrazin", role: "cadre", profile: "negotiator" },
  ],
  renaissance: [
    { suffix: "candidate", name: "Maël Dargent", role: "candidate", profile: "technocrat" },
    { suffix: "varenne", name: "Salomé Varenne", role: "cadre", profile: "negotiator" },
    { suffix: "corbin", name: "Nils Corbin", role: "spokesperson", profile: "orator" },
    { suffix: "artaud", name: "Jeanne Artaud", role: "cadre", profile: "organizer" },
  ],
  horizons: [
    { suffix: "candidate", name: "Agathe Belcourt", role: "candidate", profile: "technocrat" },
    { suffix: "lagrive", name: "Théo Lagrive", role: "cadre", profile: "organizer" },
    { suffix: "dorval", name: "Yasmine Dorval", role: "spokesperson", profile: "negotiator" },
    { suffix: "auriac", name: "Paul Auriac", role: "cadre", profile: "orator" },
  ],
  lr: [
    { suffix: "candidate", name: "Bastien Rochefort", role: "candidate", profile: "organizer" },
    { suffix: "merande", name: "Diane Mérande", role: "cadre", profile: "negotiator" },
    { suffix: "cazals", name: "Thomas Cazals", role: "spokesperson", profile: "orator" },
    { suffix: "lenoir", name: "Hector Lenoir", role: "cadre", profile: "technocrat" },
  ],
  rn: [
    { suffix: "candidate", name: "Élise Montclar", role: "candidate", profile: "orator" },
    { suffix: "ferran", name: "Louis Ferran", role: "cadre", profile: "organizer" },
    { suffix: "nerac", name: "Alix Nérac", role: "spokesperson", profile: "negotiator" },
    { suffix: "vauvert", name: "Damien Vauvert", role: "cadre", profile: "technocrat" },
  ],
  reconquete: [
    { suffix: "candidate", name: "Victor d’Aubrac", role: "candidate", profile: "orator" },
    { suffix: "saint_cyr", name: "Hélène Saint-Cyr", role: "cadre", profile: "organizer" },
    { suffix: "vales", name: "Gabriel Valès", role: "spokesperson", profile: "orator" },
    { suffix: "mornay", name: "Stan Mornay", role: "cadre", profile: "negotiator" },
  ],
  nouvelle_energie: [
    { suffix: "candidate", name: "Nora Vaillant", role: "candidate", profile: "technocrat" },
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
    identityKind: "fictional",
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

const sensitiveFictionalActors: ActorState[] = [
  ["fictional_treasurer", "Maud Keravel", "Trésorière fictive"],
  ["fictional_consultant", "Léonard Pujol", "Consultant fictif"],
  ["fictional_local_official", "Samira Bellon", "Élue locale fictive"],
  ["fictional_supplier", "Étienne Marot", "Prestataire fictif"],
  ["fictional_campaign_manager", "Anaïs Vercel", "Directrice fictive"],
].map(([id, displayName], index) => ({
  id: id ?? `fictional_context_${index}`,
  identityKind: "fictional",
  displayName: displayName ?? `Personnage fictif ${index + 1}`,
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

export const actors: ActorState[] = [...partyActors, ...sensitiveFictionalActors];
