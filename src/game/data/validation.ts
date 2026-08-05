import { gameContentSchema } from "@/game/schemas";
import type { EventCategory, GameContent } from "@/game/types";

export interface ContentValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    parties: number;
    actors: number;
    events: number;
    achievements: number;
    endings: number;
    categories: Record<string, number>;
    rareOrSecret: number;
  };
}

function words(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) repeated.add(id);
    seen.add(id);
  }
  return [...repeated];
}

function countCategories(content: GameContent): Record<string, number> {
  return content.events.reduce<Record<string, number>>((counts, event) => {
    counts[event.category] = (counts[event.category] ?? 0) + 1;
    return counts;
  }, {});
}

export function validateGameContent(content: GameContent): ContentValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsed = gameContentSchema.safeParse(content);
  if (!parsed.success) {
    for (const issue of parsed.error.issues)
      errors.push(`Schéma ${issue.path.join(".")}: ${issue.message}`);
  }

  const idCollections = [
    ["parti", content.parties.map((item) => item.id)],
    ["acteur", content.actors.map((item) => item.id)],
    ["événement", content.events.map((item) => item.id)],
    ["succès", content.achievements.map((item) => item.id)],
    ["fin", content.endings.map((item) => item.id)],
  ] as const;
  for (const [label, ids] of idCollections) {
    for (const duplicate of duplicates(ids))
      errors.push(`Identifiant ${label} dupliqué : ${duplicate}`);
  }

  const partyIds = new Set(content.parties.map((party) => party.id));
  const actorsById = new Map(content.actors.map((actor) => [actor.id, actor]));
  const eventIds = new Set(content.events.map((event) => event.id));
  for (const event of content.events) {
    const titleWords = words(event.title);
    const summaryWords = words(event.summary);
    if (titleWords < 3 || titleWords > 10)
      errors.push(`${event.id}: titre de ${titleWords} mots (attendu 3..10)`);
    if (summaryWords < 25 || summaryWords > 80)
      errors.push(`${event.id}: résumé de ${summaryWords} mots (attendu 25..80)`);
    if (event.choices.length < 2 || event.choices.length > 5)
      errors.push(`${event.id}: nombre de choix invalide`);
    for (const partyId of event.eligibleParties ?? []) {
      if (!partyIds.has(partyId)) errors.push(`${event.id}: parti éligible absent ${partyId}`);
    }
    for (const choice of event.choices) {
      if (choice.label.length < 4 || choice.label.length > 100)
        errors.push(`${event.id}/${choice.id}: longueur du choix invalide`);
      for (const outcomeId of duplicates(choice.outcomeGroups.map((outcome) => outcome.id))) {
        errors.push(`${event.id}/${choice.id}: issue dupliquée ${outcomeId}`);
      }
      for (const outcome of choice.outcomeGroups) {
        const outcomeWords = words(outcome.publicNarrative);
        if (outcomeWords < 20 || outcomeWords > 90) {
          errors.push(
            `${event.id}/${choice.id}/${outcome.id}: résultat de ${outcomeWords} mots (attendu 20..90)`,
          );
        }
        for (const chainedId of outcome.enqueueEventIds ?? []) {
          if (!eventIds.has(chainedId))
            errors.push(`${event.id}: événement chaîné absent ${chainedId}`);
        }
      }
    }
    if (event.sensitiveContent) {
      for (const actorId of event.sensitiveContent.actorIds) {
        const actor = actorsById.get(actorId);
        if (!actor) errors.push(`${event.id}: acteur sensible absent ${actorId}`);
        else if (actor.identityKind !== "fictional") {
          errors.push(`${event.id}: contenu sensible interdit pour l’acteur réel ${actorId}`);
        }
      }
    }
  }

  const categories = countCategories(content);
  const minimums: Partial<Record<EventCategory, number>> = {
    campaign: 25,
    media: 15,
    internal: 15,
    alliance: 10,
    world: 12,
    scandal: 10,
    party: 36,
    between_rounds: 8,
  };
  if (content.events.length < 110)
    errors.push(`Seulement ${content.events.length} événements (minimum 110)`);
  for (const [category, minimum] of Object.entries(minimums)) {
    if ((categories[category] ?? 0) < minimum)
      errors.push(`${category}: ${categories[category] ?? 0} événements (minimum ${minimum})`);
  }
  if ((categories.debate ?? 0) + (categories.program ?? 0) < 12)
    errors.push("Moins de 12 événements de débat/programme");
  const rareOrSecret = content.events.filter((event) =>
    ["rare", "legendary", "secret"].includes(event.rarity),
  ).length;
  if (rareOrSecret < 8) errors.push(`Seulement ${rareOrSecret} événements rares ou secrets`);
  const absurdIds = [
    "rare_printer_slogan",
    "rare_hologram_revolt",
    "rare_parrot_quote",
    "rare_debate_blackout",
  ];
  const absurdRatio =
    content.events.filter((event) => absurdIds.includes(event.id)).length / content.events.length;
  if (absurdRatio >= 0.03)
    errors.push(
      `Les événements absurdes représentent ${(absurdRatio * 100).toFixed(1)} % du contenu`,
    );

  if (content.achievements.length < 40)
    errors.push(`Seulement ${content.achievements.length} succès (minimum 40)`);
  for (const party of content.parties) {
    const candidates = content.actors.filter(
      (actor) => actor.partyId === party.id && actor.role === "candidate",
    );
    const cadres = content.actors.filter(
      (actor) => actor.partyId === party.id && actor.role !== "candidate",
    );
    const specificEvents = content.events.filter((event) =>
      event.eligibleParties?.includes(party.id),
    );
    const partyBadges = content.achievements.filter((badge) => badge.id.endsWith(`_${party.id}`));
    if (candidates.length < 1) errors.push(`${party.id}: aucun candidat fictif`);
    if (cadres.length < 2 || cadres.length > 4)
      errors.push(`${party.id}: ${cadres.length} cadres (attendu 2..4)`);
    if (specificEvents.length < 4)
      errors.push(`${party.id}: seulement ${specificEvents.length} événements spécifiques`);
    if (partyBadges.length < 2)
      errors.push(`${party.id}: seulement ${partyBadges.length} succès liés`);
  }

  const blocWeight = content.electorateBlocs.reduce((sum, bloc) => sum + bloc.weight, 0);
  if (Math.abs(blocWeight - 100) > 0.001)
    errors.push(`Poids des blocs électoraux = ${blocWeight}, attendu 100`);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      parties: content.parties.length,
      actors: content.actors.length,
      events: content.events.length,
      achievements: content.achievements.length,
      endings: content.endings.length,
      categories,
      rareOrSecret,
    },
  };
}
