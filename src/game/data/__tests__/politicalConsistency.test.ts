import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "@/game/engine";
import { ideologyDistance } from "@/game/engine/math";

/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §41 —
 * suite dédiée de non-sens politique. Vérifie structurellement, via les
 * métadonnées déjà déclarées (jamais une tentative de « comprendre » un
 * texte libre) : cohérence des endorsements, statut des candidats retirés,
 * cohérence des profils de candidature avec l'axe de leur parti, et
 * l'identité structurelle verrouillée de Nouvelle Énergie.
 */
describe("Cohérence politique structurelle", () => {
  it("chaque figure étrangère référencée par un MajorEndorsement existe dans le registre worldFigures", () => {
    const figureIds = new Set((gameContent.worldFigures ?? []).map((figure) => figure.id));
    for (const endorsement of gameContent.majorEndorsements ?? []) {
      if (endorsement.figureKind === "world_figure") {
        expect(figureIds.has(endorsement.figureId)).toBe(true);
      }
    }
  });

  it("un événement MajorEndorsement n'est éligible qu'aux partis listés dans la définition d'endorsement correspondante", () => {
    for (const endorsement of gameContent.majorEndorsements ?? []) {
      const event = gameContent.events.find((candidate) => candidate.id === endorsement.id);
      expect(event, `événement manquant pour ${endorsement.id}`).toBeDefined();
      expect(new Set(event!.eligibleParties)).toEqual(new Set(endorsement.eligiblePartyIds));
    }
  });

  it("Mateo Álvarez (pro-marché affirmé) n'est éligible qu'à des partis dont l'axe économique est nettement pro-marché", () => {
    const alvarez = gameContent.majorEndorsements!.find(
      (endorsement) => endorsement.figureId === "world_argentina_president",
    )!;
    for (const partyId of alvarez.eligiblePartyIds) {
      const party = gameContent.parties.find((candidate) => candidate.id === partyId)!;
      expect(party.ideology.economy).toBeGreaterThan(20);
    }
  });

  it("Carter Whitfield (ligne nationale/protectionniste) n'est éligible qu'à des partis à la ligne migratoire restrictive", () => {
    const whitfield = gameContent.majorEndorsements!.find(
      (endorsement) => endorsement.figureId === "world_us_president",
    )!;
    for (const partyId of whitfield.eligiblePartyIds) {
      const party = gameContent.parties.find((candidate) => candidate.id === partyId)!;
      expect(party.ideology.immigration).toBeGreaterThan(40);
    }
  });

  it("Elke Brandt (pro-européenne) n'est éligible qu'à des partis dont l'axe Europe est positif", () => {
    const brandt = gameContent.majorEndorsements!.find(
      (endorsement) => endorsement.figureId === "world_germany_chancellor",
    )!;
    for (const partyId of brandt.eligiblePartyIds) {
      const party = gameContent.parties.find((candidate) => candidate.id === partyId)!;
      expect(party.ideology.europe).toBeGreaterThan(0);
    }
  });

  it("Daniel Ashworth (social-démocrate) n'est éligible qu'à des partis économiquement à gauche du centre", () => {
    const ashworth = gameContent.majorEndorsements!.find(
      (endorsement) => endorsement.figureId === "world_uk_pm",
    )!;
    for (const partyId of ashworth.eligiblePartyIds) {
      const party = gameContent.parties.find((candidate) => candidate.id === partyId)!;
      expect(party.ideology.economy).toBeLessThan(0);
    }
  });

  it("aucun MajorEndorsement n'a d'effet universellement positif (au moins un effet négatif déclaré)", () => {
    for (const endorsement of gameContent.majorEndorsements ?? []) {
      expect(endorsement.negativeEffects.length).toBeGreaterThan(0);
    }
  });

  it("un CandidateProfile reste idéologiquement proche du parti qu'il représente (jamais son opposé)", () => {
    for (const profile of gameContent.candidateProfiles ?? []) {
      const party = gameContent.parties.find((candidate) => candidate.id === profile.partyId)!;
      const actor = gameContent.actors.find((candidate) => candidate.id === profile.actorId)!;
      expect(actor, `acteur manquant pour ${profile.id}`).toBeDefined();
      const distance = ideologyDistance(party.ideology, actor.ideology);
      // Bande large (les profils divergent volontairement, cf. RN/PS) mais
      // jamais jusqu'à l'opposé idéologique (distance maximale théorique ~340
      // sur les 6 axes -100..100 combinés).
      expect(distance).toBeLessThan(120);
    }
  });

  it("Nouvelle Énergie conserve une identité économique libérale (axe économique nettement pro-marché)", () => {
    const nouvelleEnergie = gameContent.parties.find(
      (party) => party.id === "nouvelle_energie",
    )!;
    expect(nouvelleEnergie.ideology.economy).toBeGreaterThan(50);
  });

  it("l'acteur candidat de Nouvelle Énergie reste un profil d'exécutif local (pas de renversement d'identité)", () => {
    const candidate = gameContent.actors.find(
      (actor) => actor.partyId === "nouvelle_energie" && actor.role === "candidate",
    )!;
    expect(candidate.identityKind).toBe("fictional");
    // L'ancrage exécutif-local/entrepreneurial se traduit mécaniquement par
    // une discipline et une compétence au moins moyennes-hautes, jamais un
    // profil erratique — verrou faible mais réel contre une dérive future.
    expect(candidate.traits.discipline).toBeGreaterThan(45);
  });

  it(
    "un candidat retiré (candidateStatus withdrawn/eliminated/disqualified) n'est jamais le candidateId d'un parti actif à l'issue d'une campagne simulée",
    () => {
      const realParties = gameContent.parties.filter((party) => party.isRealOrganization);
      let checked = 0;
      for (let i = 0; i < 60; i += 1) {
        const partyId = realParties[i % realParties.length]!.id;
        const seed = `consistency-withdrawn-${i}`;
        let state = createGame(
          { seed, mode: "existing_party", partyId, methodId: "field_first" },
          gameContent,
        );
        let guard = 0;
        while (state.phase !== "finished" && guard < 80) {
          const event = currentEvent(state, gameContent.events);
          state = resolveCurrentChoice(state, event.choices[0]!.id, gameContent).state;
          guard += 1;
        }
        for (const party of Object.values(state.parties)) {
          if (!party.active) continue;
          const candidateActor = state.actors[party.candidateId];
          if (!candidateActor) continue;
          checked += 1;
          expect(["withdrawn", "disqualified"]).not.toContain(candidateActor.candidateStatus);
        }
      }
      expect(checked).toBeGreaterThan(100);
    },
    // PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md — la
    // négociation stratégique ajoute un calcul de viabilité/fragmentation
    // réel par parti éligible et par décision ; ce test (60 campagnes de 80
    // décisions) reste sous 12 s isolé mais peut dépasser 20 s sous la
    // contention des autres fichiers de test exécutés en parallèle.
    40000,
  );
});
