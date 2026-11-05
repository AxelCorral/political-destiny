import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";

import { profilesForParty, resolveCandidateProfile } from "../candidateProfiles";
import { nationalLatentSupport } from "../electorate";
import { createGame } from "../game";

/** V3 — casting réel : RN (Le Pen / Bardella) et PS (Glucksmann / Faure / Royal). */
describe("CandidateProfile — casting réel V3", () => {
  it("seuls le RN et le PS portent plusieurs profils, avec un seul profil par défaut", () => {
    for (const party of gameContent.parties) {
      const profiles = profilesForParty(gameContent, party.id);
      expect(profiles.length === 0 || profiles.length >= 2).toBe(true);
    }
    expect(profilesForParty(gameContent, "rn")).toHaveLength(2);
    expect(profilesForParty(gameContent, "ps")).toHaveLength(3);
    for (const partyId of ["rn", "ps"]) {
      expect(profilesForParty(gameContent, partyId).filter((p) => p.isDefault)).toHaveLength(1);
    }
  });

  it("les PNJ partent toujours avec le profil par défaut (Le Pen, Glucksmann)", () => {
    for (let i = 0; i < 60; i += 1) {
      expect(resolveCandidateProfile(gameContent, "rn", `npc-${i}`, "lfi")?.id).toBe(
        "rn_lepen_profile",
      );
      expect(resolveCandidateProfile(gameContent, "ps", `npc-${i}`, "lfi")?.id).toBe(
        "ps_glucksmann_profile",
      );
    }
  });

  it("le choix explicite du joueur prime pour son propre parti, jamais pour les autres", () => {
    expect(resolveCandidateProfile(gameContent, "rn", "x", "rn", "rn_bardella_profile")?.id).toBe(
      "rn_bardella_profile",
    );
    expect(resolveCandidateProfile(gameContent, "rn", "x", "lfi", "rn_bardella_profile")?.id).toBe(
      "rn_lepen_profile",
    );
  });

  it("incarner Jordan Bardella change réellement le candidat et le socle", () => {
    const base = {
      seed: "same-seed",
      mode: "existing_party" as const,
      partyId: "rn",
      methodId: "field_first",
    };
    const lepen = createGame(base, gameContent);
    const bardella = createGame(
      { ...base, candidateProfileId: "rn_bardella_profile" },
      gameContent,
    );
    expect(lepen.player.displayName).toBe("Marine Le Pen");
    expect(bardella.player.displayName).toBe("Jordan Bardella");
    expect(bardella.parties.rn!.hidden.baseSupport).toBeLessThan(
      lepen.parties.rn!.hidden.baseSupport,
    );
  });

  it("la vérité électorale reste normalisée à 100 quel que soit le profil", () => {
    for (const candidateProfileId of ["rn_lepen_profile", "rn_bardella_profile"]) {
      const state = createGame(
        {
          seed: "sum-check",
          mode: "existing_party",
          partyId: "rn",
          methodId: "field_first",
          candidateProfileId,
        },
        gameContent,
      );
      const total = Object.values(nationalLatentSupport(state, gameContent.electorateBlocs)).reduce(
        (sum, value) => sum + value,
        0,
      );
      expect(total).toBeCloseTo(100, 1);
    }
  });
});
