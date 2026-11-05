import type { GameState } from "@/game/types";

import { customFigurineSpec, type FigurineSpec, figurineSpecs } from "./figurines/specs";

/** Acteur du moteur → figurine. */
const ACTOR_FIGURINE: Record<string, string> = {
  lfi_candidate: "melenchon",
  ps_candidate: "glucksmann",
  ps_faure: "faure",
  ps_royal: "royal",
  ecologistes_candidate: "tondelier",
  renaissance_candidate: "attal",
  horizons_candidate: "philippe",
  lr_candidate: "retailleau",
  lr_bertrand: "bertrand",
  rn_candidate: "le_pen",
  rn_bardella: "bardella",
  reconquete_candidate: "zemmour",
  nouvelle_energie_candidate: "lisnard",
  pcf_candidate: "roussel",
  debout_candidate: "ruffin",
  france_humaniste_candidate: "villepin",
  convention_candidate: "cazeneuve",
  dlf_candidate: "dupont_aignan",
  lo_candidate: "arthaud",
};

export function figurineForActorId(actorId: string): FigurineSpec | undefined {
  const id = ACTOR_FIGURINE[actorId];
  return id ? figurineSpecs[id] : undefined;
}

/** Figurine du candidat actuel d'un parti (repli neutre pour un mouvement personnalisé). */
export function figurineForParty(state: GameState, partyId: string): FigurineSpec {
  const party = state.parties[partyId];
  const actorId = party?.candidateId ?? "";
  const known = figurineForActorId(actorId);
  if (known) return known;
  const name = state.actors[actorId]?.displayName ?? party?.displayName ?? "Candidat";
  return customFigurineSpec(party?.visual.primaryColor ?? "#2b4b8c", name);
}

/** Partis encore en course, triés par sondage décroissant. */
export function rankedActiveParties(state: GameState): string[] {
  return Object.values(state.parties)
    .filter((party) => {
      if (!party.active) return false;
      const status = state.actors[party.candidateId]?.candidateStatus;
      return !status || !["withdrawn", "disqualified", "eliminated"].includes(status);
    })
    .sort((a, b) => b.stats.polling - a.stats.polling)
    .map((party) => party.id);
}
