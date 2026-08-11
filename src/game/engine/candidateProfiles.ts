import type { CandidateProfile, GameContent } from "@/game/types";

import { hashSeed } from "./rng";

export function profilesForParty(content: GameContent, partyId: string): CandidateProfile[] {
  return (content.candidateProfiles ?? []).filter((profile) => profile.partyId === partyId);
}

/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §9-10 : la
 * résolution est déterministe par graine + état (jamais un tirage relancé à
 * chaque lecture), pondérée par `probabilityWeight` (§7 : « le choix du
 * candidat doit modifier réellement... pas deux skins avec les mêmes
 * chiffres » — la pondération reflète la probabilité réelle documentée dans
 * `docs/POLITICAL_BASELINE_2026-04.md`, pas un tirage 50/50 arbitraire). Le
 * choix explicite du joueur ne s'applique qu'à son propre parti.
 */
export function resolveCandidateProfile(
  content: GameContent,
  partyId: string,
  seed: string,
  playerPartyId: string,
  playerChoiceId?: string,
): CandidateProfile | undefined {
  const profiles = profilesForParty(content, partyId);
  if (profiles.length === 0) return undefined;
  if (profiles.length === 1) return profiles[0];

  if (partyId === playerPartyId && playerChoiceId) {
    const chosen = profiles.find((profile) => profile.id === playerChoiceId);
    if (chosen) return chosen;
  }

  const totalWeight = profiles.reduce(
    (sum, profile) => sum + Math.max(0.01, profile.probabilityWeight),
    0,
  );
  const roll = (hashSeed(`${seed}:candidate-profile:${partyId}`) % 10_000) / 10_000;
  let cursor = 0;
  for (const profile of profiles) {
    cursor += Math.max(0.01, profile.probabilityWeight) / totalWeight;
    if (roll < cursor) return profile;
  }
  return profiles[profiles.length - 1];
}
