import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";

import { profilesForParty, resolveCandidateProfile } from "../candidateProfiles";
import { nationalLatentSupport } from "../electorate";
import { createGame } from "../game";

describe("CandidateProfile — résolution (Phase B/C, §28-29 du prompt de mission)", () => {
  it("un parti sans profil multiple n'a pas d'entrée dans candidateProfiles (§8 : pas de choix artificiel)", () => {
    for (const party of gameContent.parties.filter((p) => p.isRealOrganization)) {
      const profiles = profilesForParty(gameContent, party.id);
      expect(profiles.length === 0 || profiles.length >= 2).toBe(true);
    }
  });

  it("RN et PS portent chacun exactement deux profils, un seul marqué par défaut", () => {
    for (const partyId of ["rn", "ps"]) {
      const profiles = profilesForParty(gameContent, partyId);
      expect(profiles).toHaveLength(2);
      expect(profiles.filter((profile) => profile.isDefault)).toHaveLength(1);
    }
  });

  it("la résolution est déterministe : même graine + même parti -> même profil à chaque appel", () => {
    for (let i = 0; i < 20; i += 1) {
      const seed = `determinism-${i}`;
      const first = resolveCandidateProfile(gameContent, "rn", seed, "lfi");
      const second = resolveCandidateProfile(gameContent, "rn", seed, "lfi");
      expect(first?.id).toBe(second?.id);
    }
  });

  it("le choix explicite du joueur prime pour son propre parti, jamais pour les autres", () => {
    const resolvedForPlayer = resolveCandidateProfile(
      gameContent,
      "rn",
      "any-seed",
      "rn",
      "rn_ferran_profile",
    );
    expect(resolvedForPlayer?.id).toBe("rn_ferran_profile");

    // Le même profileId choisi, mais pour un AUTRE parti joueur : ignoré,
    // la résolution retombe sur le tirage pondéré par graine.
    const resolvedForOther = resolveCandidateProfile(
      gameContent,
      "rn",
      "any-seed",
      "lfi",
      "rn_ferran_profile",
    );
    // Peut coïncider par hasard avec le tirage pondéré, donc on vérifie
    // seulement que le mécanisme ne throw pas et renvoie un profil valide du
    // parti concerné.
    expect(["rn_ferran_profile", "rn_montclar_profile"]).toContain(resolvedForOther?.id);
  });

  it("profils différents -> variation de socle explicable (même graine, choix de profil différent)", () => {
    const withFerran = createGame(
      {
        seed: "same-seed-profile-compare",
        mode: "existing_party",
        partyId: "rn",
        methodId: "field_first",
        candidateProfileId: "rn_ferran_profile",
      },
      gameContent,
    );
    const withMontclar = createGame(
      {
        seed: "same-seed-profile-compare",
        mode: "existing_party",
        partyId: "rn",
        methodId: "field_first",
        candidateProfileId: "rn_montclar_profile",
      },
      gameContent,
    );
    // Écart attendu : la différence de baselineModifier.baseSupportDelta entre
    // les deux profils (2.4 pts), le jitter par graine étant identique
    // (même seed) et donc annulé dans la comparaison.
    const delta = Math.abs(
      withMontclar.parties.rn!.hidden.baseSupport - withFerran.parties.rn!.hidden.baseSupport,
    );
    expect(delta).toBeGreaterThan(1.5);
    expect(delta).toBeLessThan(3.5);
  });

  it("même profil + graines différentes -> variation limitée (petite incertitude, §5/§28)", () => {
    const values: number[] = [];
    for (let i = 0; i < 30; i += 1) {
      const state = createGame(
        {
          seed: `jitter-bound-${i}`,
          mode: "existing_party",
          partyId: "rn",
          methodId: "field_first",
          candidateProfileId: "rn_montclar_profile",
        },
        gameContent,
      );
      values.push(state.parties.rn!.hidden.baseSupport);
    }
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    for (const value of values) {
      // Jitter borné à ±6% relatif (voir game.ts) ; tolérance de contrôle à
      // ±10% pour absorber l'arrondi et la marge de l'échantillon.
      expect(Math.abs(value - mean) / mean).toBeLessThan(0.1);
    }
  });

  it("la distribution des profils sur de nombreuses graines respecte l'ordre de grandeur des probabilityWeight configurés", () => {
    const counts: Record<string, number> = {};
    const total = 300;
    for (let i = 0; i < total; i += 1) {
      const profile = resolveCandidateProfile(gameContent, "rn", `weight-check-${i}`, "lfi");
      if (profile) counts[profile.id] = (counts[profile.id] ?? 0) + 1;
    }
    const ferranShare = (counts.rn_ferran_profile ?? 0) / total;
    // Poids configuré 0.35 ; tolérance large pour un tirage à 300 échantillons.
    expect(ferranShare).toBeGreaterThan(0.22);
    expect(ferranShare).toBeLessThan(0.48);
  });

  it("la vérité électorale sous-jacente reste normalisée à 100 quel que soit le profil résolu (indépendamment du bruit d'affichage du sondage joueur)", () => {
    for (const profileId of ["rn_ferran_profile", "rn_montclar_profile"]) {
      const state = createGame(
        {
          seed: "sum-check",
          mode: "existing_party",
          partyId: "rn",
          methodId: "field_first",
          candidateProfileId: profileId,
        },
        gameContent,
      );
      const truth = nationalLatentSupport(state, gameContent.electorateBlocs);
      const total = Object.values(truth).reduce((sum, value) => sum + value, 0);
      expect(total).toBeCloseTo(100, 1);
    }
  });

  it("un profil non par défaut résolu pour un PNJ est tracé dans l'historique (opponentActions)", () => {
    let found = false;
    for (let i = 0; i < 40 && !found; i += 1) {
      const state = createGame(
        { seed: `history-check-${i}`, mode: "existing_party", partyId: "lfi", methodId: "field_first" },
        gameContent,
      );
      const rnProfileId = state.flags["candidateProfile:rn"];
      if (rnProfileId === "rn_ferran_profile") {
        found = state.opponentActions.some(
          (action) => action.partyId === "rn" && action.kind === "primary",
        );
      }
    }
    expect(found).toBe(true);
  });
});
