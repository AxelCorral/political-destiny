import type { EventChoice, GameContent, GameEffect, GameEventDefinition } from "@/game/types";

export const CONTENT_QUALITY_THRESHOLDS = {
  maximumGenericTriptychRatio: 0.1,
  minimumUniqueChoiceRatio: 0.95,
  minimumUniqueNarrativeRatio: 0.7,
  maximumOutcomeTitleReuse: 5,
  maximumOutcomeNarrativeReuse: 2,
  maximumIdenticalChoiceSetReuse: 1,
  minimumConcreteChoiceRatio: 0.9,
  minimumRepeatCooldown: 4,
} as const;

export interface ContentQualityMetrics {
  events: number;
  choices: number;
  outcomes: number;
  uniqueChoiceRatio: number;
  uniqueNarrativeRatio: number;
  concreteChoiceRatio: number;
  genericTriptychEvents: number;
  genericTriptychRatio: number;
  duplicateChoiceSets: number;
  identicalConsequencePairs: number;
  missingChainTargets: number;
  unjustifiedRepeatableEvents: number;
}

export interface ContentQualityReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metrics: ContentQualityMetrics;
}

const GENERIC_CHOICE =
  /^(?:être |se montrer |réponse |jouer |choisir |rester |agir )?(?:très )?(?:prudent(?:e)?|risqué(?:e)?|rassembleur|rassembleuse|agressif|agressive|technique|populaire|institutionnel(?:le)?|offensif|offensive|collectif|collective|ferme)$/iu;
const ABSTRACT_PHRASES = [
  "être prudent",
  "réponse technique",
  "jouer collectif",
  "jouer la carte",
  "rassembler",
  "contre-attaquer",
  "prendre un risque",
  "se montrer ferme",
  "faire profil bas",
];
const ACTION_VERBS = [
  "accepter",
  "accorder",
  "adopter",
  "ajouter",
  "alterner",
  "annoncer",
  "annuler",
  "appeler",
  "assumer",
  "attribuer",
  "auditer",
  "augmenter",
  "autoriser",
  "avancer",
  "baisser",
  "centraliser",
  "chercher",
  "choisir",
  "coécrire",
  "commander",
  "comparer",
  "concentrer",
  "conditionner",
  "confier",
  "consacrer",
  "conserver",
  "considérer",
  "construire",
  "consulter",
  "contester",
  "convoquer",
  "corriger",
  "créer",
  "défendre",
  "décliner",
  "déléguer",
  "demander",
  "déménager",
  "déposer",
  "dépenser",
  "déployer",
  "détailler",
  "détourner",
  "différer",
  "diffuser",
  "dialoguer",
  "dissoudre",
  "donner",
  "doubler",
  "écarter",
  "écrire",
  "élargir",
  "enregistrer",
  "envoyer",
  "exclure",
  "exonérer",
  "exiger",
  "faire",
  "fermer",
  "financer",
  "fixer",
  "former",
  "fournir",
  "garantir",
  "honorer",
  "imposer",
  "intégrer",
  "interdire",
  "interrompre",
  "introduire",
  "inviter",
  "lancer",
  "limiter",
  "maintenir",
  "mobiliser",
  "négocier",
  "nommer",
  "obliger",
  "ouvrir",
  "organiser",
  "partager",
  "participer",
  "passer",
  "plafonner",
  "présenter",
  "proclamer",
  "programmer",
  "promettre",
  "prononcer",
  "proposer",
  "publier",
  "raconter",
  "ramener",
  "réaffecter",
  "reconnaître",
  "recruter",
  "réduire",
  "redistribuer",
  "rejoindre",
  "régulariser",
  "regrouper",
  "remercier",
  "rencontrer",
  "renégocier",
  "renvoyer",
  "répartir",
  "remplacer",
  "reprendre",
  "refuser",
  "renoncer",
  "répondre",
  "réserver",
  "rester",
  "résumer",
  "revenir",
  "revendiquer",
  "réviser",
  "retirer",
  "réunir",
  "rompre",
  "saisir",
  "sanctionner",
  "sanctuariser",
  "scinder",
  "signer",
  "sourire",
  "soumettre",
  "soutenir",
  "supprimer",
  "suspendre",
  "tenir",
  "tirer",
  "transférer",
  "transformer",
  "utiliser",
  "valider",
  "vendre",
  "verser",
  "voter",
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function ratio(unique: number, total: number): number {
  return total === 0 ? 1 : unique / total;
}

function frequencies(values: string[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1);
  return result;
}

function effectSignature(effect: GameEffect): string {
  const entries = Object.entries(effect)
    .filter(([key]) => !["label", "visibility"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(Object.fromEntries(entries));
}

function consequenceSignature(choice: EventChoice): string {
  return choice.outcomeGroups
    .map((outcome) => ({
      weight: outcome.baseWeight,
      effects: outcome.effects.map(effectSignature).sort(),
      delayed: (outcome.delayedEffects ?? []).map((delayed) => ({
        after: delayed.afterDecisions,
        effects: delayed.effects.map(effectSignature).sort(),
      })),
      flags: outcome.setFlags ?? {},
      followUps: [
        ...(outcome.enqueueEventIds ?? []),
        ...(outcome.followUps ?? []).map((followUp) => followUp.eventId),
      ].sort(),
    }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
    .map((value) => JSON.stringify(value))
    .join("|");
}

export function isConcreteChoice(label: string): boolean {
  const trimmed = label.trim();
  const normalized = normalize(trimmed);
  if (GENERIC_CHOICE.test(trimmed)) return false;
  if (ABSTRACT_PHRASES.some((phrase) => normalized === normalize(phrase))) return false;
  if (trimmed.split(/\s+/u).length < 4) return false;
  return ACTION_VERBS.some((verb) => new RegExp(`\\b${normalize(verb)}\\b`, "u").test(normalized));
}

function usesGenericTriptych(event: GameEventDefinition): boolean {
  const ids = new Set(event.choices.map((choice) => normalize(choice.id)));
  const tags = new Set(event.choices.map((choice) => choice.visibleTag));
  return (
    (["prudent response", "risk breakthrough", "collective path"].every((id) => ids.has(id)) ||
      (tags.has("PRUDENT") && tags.has("RISQUÉ") && tags.has("RASSEMBLEUR"))) &&
    event.choices.length === 3
  );
}

function linkedEventIds(event: GameEventDefinition): string[] {
  return [
    ...(event.incompatibleEventIds ?? []),
    ...(event.chain?.followsEventIds ?? []),
    ...event.choices.flatMap((choice) =>
      choice.outcomeGroups.flatMap((outcome) => [
        ...(outcome.enqueueEventIds ?? []),
        ...(outcome.followUps ?? []).map((followUp) => followUp.eventId),
      ]),
    ),
  ];
}

export function validateContentQuality(content: GameContent): ContentQualityReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const choices = content.events.flatMap((event) => event.choices);
  const outcomes = choices.flatMap((choice) => choice.outcomeGroups);
  const choiceTexts = choices.map((choice) => normalize(choice.label));
  const narratives = outcomes.map((outcome) => normalize(outcome.publicNarrative));
  const concreteChoices = choices.filter((choice) => isConcreteChoice(choice.label));
  const genericTriptychs = content.events.filter(usesGenericTriptych);

  const choiceSetGroups = frequencies(
    content.events.map((event) => event.choices.map((choice) => normalize(choice.label)).join("|")),
  );
  const duplicateChoiceSets = [...choiceSetGroups.values()].filter(
    (count) => count > CONTENT_QUALITY_THRESHOLDS.maximumIdenticalChoiceSetReuse,
  ).length;

  let identicalConsequencePairs = 0;
  for (const event of content.events) {
    const signatures = event.choices.map(consequenceSignature);
    for (const [signature, count] of frequencies(signatures)) {
      if (signature && count > 1) {
        identicalConsequencePairs += (count * (count - 1)) / 2;
        errors.push(`${event.id}: ${count} choix produisent exactement les mêmes conséquences`);
      }
    }
  }

  const eventIds = new Set(content.events.map((event) => event.id));
  let missingChainTargets = 0;
  for (const event of content.events) {
    for (const choice of event.choices) {
      if (!isConcreteChoice(choice.label))
        errors.push(`${event.id}/${choice.id}: le choix ne décrit pas une action assez concrète`);
    }
    if (
      event.category === "party" &&
      !event.eligibleParties?.length &&
      !event.eligibleIdeologyFamilies?.length
    ) {
      errors.push(`${event.id}: événement de parti accessible à tous les partis`);
    }
    if (event.eligibleParties?.length === content.parties.length)
      errors.push(`${event.id}: événement prétendument spécifique mais accessible à tous`);
    if (Object.values(event.phaseWeights).every((weight) => (weight ?? 0) <= 0))
      errors.push(`${event.id}: aucune phase d’apparition possible`);
    if (
      event.minDecisionIndex !== undefined &&
      event.maxDecisionIndex !== undefined &&
      event.minDecisionIndex > event.maxDecisionIndex
    )
      errors.push(`${event.id}: fenêtre de décision impossible`);
    if (event.chain?.maximumDelay !== undefined && event.chain.minimumDelay !== undefined) {
      if (event.chain.maximumDelay < event.chain.minimumDelay)
        errors.push(`${event.id}: délai maximal de chaîne inférieur au délai minimal`);
    }
    for (const linkedId of linkedEventIds(event)) {
      if (!eventIds.has(linkedId)) {
        missingChainTargets += 1;
        errors.push(`${event.id}: référence un événement absent (${linkedId})`);
      }
    }
  }

  const entityById = new Map((content.entities ?? []).map((entity) => [entity.id, entity]));
  for (const event of content.events) {
    for (const reference of event.entityReferences ?? []) {
      const entity = entityById.get(reference.entityId);
      if (!entity) {
        errors.push(`${event.id}: entité absente du registre (${reference.entityId})`);
        continue;
      }
      if (
        entity.category === "public_figure" &&
        entity.reality === "real" &&
        ["sensitive", "prohibited"].includes(event.editorialSensitivity ?? "none")
      ) {
        errors.push(`${event.id}: personnalité réelle utilisée dans un contexte sensible`);
      }
    }
  }

  const unjustifiedRepeatable = content.events.filter(
    (event) =>
      !event.oncePerRun &&
      event.maxAppearances === undefined &&
      event.cooldown < CONTENT_QUALITY_THRESHOLDS.minimumRepeatCooldown,
  );

  const maximumByAchievementMetric: Partial<Record<string, number>> = {
    score: 100,
    first_round_score: 100,
    second_round_score: 100,
    polling_progression: 100,
    starting_polling: 100,
    decisions: 40,
    statement_topics: 12,
    alliances: Math.max(0, content.parties.length - 1),
    members: 5_000_000,
    member_growth: 5_000_000,
    final_rank: content.parties.length,
  };
  const partyIds = new Set(content.parties.map((party) => party.id));
  const endingIds = new Set(content.endings.map((ending) => ending.id));
  for (const achievement of content.achievements) {
    if (content.contentVersion === 2 && !achievement.criteria)
      errors.push(`${achievement.id}: succès V2 sans critère vérifiable`);
    for (const criterion of achievement.criteria?.conditions ?? []) {
      const maximum = maximumByAchievementMetric[criterion.metric];
      if (
        maximum !== undefined &&
        criterion.operator === "gte" &&
        typeof criterion.value === "number" &&
        criterion.value > maximum
      ) {
        errors.push(
          `${achievement.id}: seuil impossible ${criterion.metric} >= ${criterion.value} (maximum ${maximum})`,
        );
      }
      if (
        criterion.metric === "party_id" &&
        typeof criterion.value === "string" &&
        !partyIds.has(criterion.value)
      )
        errors.push(`${achievement.id}: parti de succès absent (${criterion.value})`);
      if (
        criterion.metric === "ending_id" &&
        typeof criterion.value === "string" &&
        !endingIds.has(criterion.value)
      )
        errors.push(`${achievement.id}: fin de succès absente (${criterion.value})`);
    }
  }

  const titleCounts = frequencies(outcomes.map((outcome) => normalize(outcome.title)));
  for (const [title, count] of titleCounts) {
    if (count > CONTENT_QUALITY_THRESHOLDS.maximumOutcomeTitleReuse)
      errors.push(`Titre d’issue réutilisé ${count} fois : « ${title} »`);
  }
  const narrativeCounts = frequencies(narratives);
  for (const [narrative, count] of narrativeCounts) {
    if (count > CONTENT_QUALITY_THRESHOLDS.maximumOutcomeNarrativeReuse)
      errors.push(`Récit d’issue réutilisé ${count} fois : « ${narrative.slice(0, 80)}… »`);
  }

  const metrics: ContentQualityMetrics = {
    events: content.events.length,
    choices: choices.length,
    outcomes: outcomes.length,
    uniqueChoiceRatio: ratio(new Set(choiceTexts).size, choiceTexts.length),
    uniqueNarrativeRatio: ratio(new Set(narratives).size, narratives.length),
    concreteChoiceRatio: ratio(concreteChoices.length, choices.length),
    genericTriptychEvents: genericTriptychs.length,
    genericTriptychRatio: content.events.length
      ? genericTriptychs.length / content.events.length
      : 0,
    duplicateChoiceSets,
    identicalConsequencePairs,
    missingChainTargets,
    unjustifiedRepeatableEvents: unjustifiedRepeatable.length,
  };
  if (metrics.uniqueChoiceRatio < CONTENT_QUALITY_THRESHOLDS.minimumUniqueChoiceRatio)
    errors.push(`Textes de choix uniques : ${(metrics.uniqueChoiceRatio * 100).toFixed(1)} %`);
  if (metrics.uniqueNarrativeRatio < CONTENT_QUALITY_THRESHOLDS.minimumUniqueNarrativeRatio)
    errors.push(`Récits d’issue uniques : ${(metrics.uniqueNarrativeRatio * 100).toFixed(1)} %`);
  if (metrics.concreteChoiceRatio < CONTENT_QUALITY_THRESHOLDS.minimumConcreteChoiceRatio)
    errors.push(`Choix concrets : ${(metrics.concreteChoiceRatio * 100).toFixed(1)} %`);
  if (metrics.genericTriptychRatio >= CONTENT_QUALITY_THRESHOLDS.maximumGenericTriptychRatio)
    errors.push(
      `Triptyque générique : ${(metrics.genericTriptychRatio * 100).toFixed(1)} % des événements`,
    );
  if (duplicateChoiceSets > 0)
    errors.push(`${duplicateChoiceSets} ensembles de choix sont réutilisés à l’identique`);
  if (unjustifiedRepeatable.length > 0)
    errors.push(
      `${unjustifiedRepeatable.length} événements peuvent se répéter sans limite ni cooldown suffisant`,
    );

  const effectKinds = new Set(
    outcomes.flatMap((outcome) => [
      ...outcome.effects.map((effect) => effect.kind),
      ...(outcome.delayedEffects ?? []).flatMap((delayed) =>
        delayed.effects.map((effect) => effect.kind),
      ),
    ]),
  );
  for (const kind of [
    "party_stat",
    "hidden_stat",
    "trait",
    "ideology",
    "world",
    "bloc_trust",
    "flag",
    "candidate_status",
    "alliance",
    "party_split",
    "actor_memory",
    "party_relation",
    "policy_position",
    "opponent_strategy",
  ] satisfies GameEffect["kind"][]) {
    if (!effectKinds.has(kind)) errors.push(`Type d’effet sans usage dans le contenu : ${kind}`);
  }

  return { valid: errors.length === 0, errors, warnings, metrics };
}
