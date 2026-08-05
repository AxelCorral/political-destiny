import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import type {
  EventChoice,
  GameEffect,
  GameEventDefinition,
  WeightedOutcome,
} from "../../src/game/types/index";

const events = gameContent.events;

const FRENCH_STOPWORDS = new Set(
  "a au aux avec ce ces dans de des du elle en et eux il je la le les leur lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que quelle quelles quels qui sa se ses son sur ta te tes toi ton tu un une vos votre vous c est d l n s votre cette aux plus sans puis avant apres entre vers comme lors reste fait faire tout toute tous toutes tres peut doit".split(
    " ",
  ),
);

const ABSTRACT_WORDS = new Set([
  "agressif",
  "agressive",
  "audacieux",
  "audacieuse",
  "clivant",
  "clivante",
  "collectif",
  "collective",
  "ferme",
  "institutionnel",
  "institutionnelle",
  "loyal",
  "loyale",
  "offensif",
  "offensive",
  "opportuniste",
  "populaire",
  "prudent",
  "prudente",
  "rassembleur",
  "rassembleuse",
  "risque",
  "risquee",
  "secret",
  "secrete",
  "technique",
  "transparent",
  "transparente",
]);

const ACTION_PREFIXES = [
  "accepter",
  "accorder",
  "annoncer",
  "assumer",
  "attaquer",
  "conditionner",
  "confier",
  "consulter",
  "continuer",
  "convoquer",
  "creer",
  "defendre",
  "demander",
  "denoncer",
  "deployer",
  "designer",
  "diffuser",
  "donner",
  "ecarter",
  "ecouter",
  "equilibrer",
  "faire",
  "former",
  "garantir",
  "imposer",
  "integrer",
  "inviter",
  "lancer",
  "limiter",
  "maintenir",
  "menacer",
  "mobiliser",
  "nommer",
  "negocier",
  "ouvrir",
  "organiser",
  "partager",
  "preparer",
  "presenter",
  "promettre",
  "proposer",
  "publier",
  "recentrer",
  "reconnaitre",
  "rediger",
  "reduire",
  "refuser",
  "rejoindre",
  "remercier",
  "rendre",
  "repondre",
  "repartir",
  "reserver",
  "rester",
  "retenir",
  "reunir",
  "rompre",
  "securiser",
  "signer",
  "soutenir",
  "suspendre",
  "transformer",
  "traverser",
  "visiter",
];

function normalized(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[’']/gu, " ")
    .replace(/[^a-z0-9\s-]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function words(text: string, keepStopwords = false): string[] {
  return normalized(text)
    .split(" ")
    .filter((word) => word.length > 1 && (keepStopwords || !FRENCH_STOPWORDS.has(word)));
}

function jaccard(left: string, right: string): number {
  const a = new Set(words(left));
  const b = new Set(words(right));
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / (a.size + b.size - intersection);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([key]) => key !== "label" && key !== "visibility")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function effectSignature(effect: GameEffect): string {
  return stableStringify(effect);
}

function outcomeConsequenceSignature(outcome: WeightedOutcome): string {
  return stableStringify({
    effects: outcome.effects.map(effectSignature).sort(),
    delayedEffects: outcome.delayedEffects?.map((delayed) => ({
      afterDecisions: delayed.afterDecisions,
      effects: delayed.effects.map(effectSignature).sort(),
    })),
    endingTrigger: outcome.endingTrigger,
    enqueueEventIds: outcome.enqueueEventIds?.slice().sort(),
    setFlags: outcome.setFlags,
  });
}

function choiceConsequenceSignature(choice: EventChoice): string {
  return choice.outcomeGroups.map(outcomeConsequenceSignature).sort().join("||");
}

function eventStructureSignature(event: GameEventDefinition): string {
  return event.choices
    .map((choice) =>
      [
        choice.id,
        choice.visibleTag ?? "NONE",
        choice.outcomeGroups.map((outcome) => outcome.id).join(","),
        choice.outcomeGroups
          .map((outcome) => outcome.effects.map((effect) => effect.kind).join("+"))
          .join("/"),
      ].join(":"),
    )
    .join("|");
}

function eventVisibleText(event: GameEventDefinition): string {
  return [
    event.title,
    event.summary,
    ...event.choices.flatMap((choice) => [
      choice.label,
      ...choice.outcomeGroups.flatMap((outcome) => [outcome.title, outcome.publicNarrative]),
    ]),
  ].join(" ");
}

function rankedFrequencies(values: string[], limit: number, includeSingletons = true) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => includeSingletons || count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function ngrams(strings: string[], size: number, limit: number) {
  const counts = new Map<string, number>();
  const documentCounts = new Map<string, number>();
  for (const text of strings) {
    const tokens = words(text, true);
    const seen = new Set<string>();
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const gramTokens = tokens.slice(index, index + size);
      if (gramTokens.every((token) => FRENCH_STOPWORDS.has(token))) continue;
      const gram = gramTokens.join(" ");
      counts.set(gram, (counts.get(gram) ?? 0) + 1);
      seen.add(gram);
    }
    for (const gram of seen) documentCounts.set(gram, (documentCounts.get(gram) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([expression, count]) => ({
      expression,
      count,
      documents: documentCounts.get(expression) ?? 0,
    }))
    .filter((entry) => entry.documents >= 3)
    .sort((a, b) => b.documents - a.documents || b.count - a.count)
    .slice(0, limit);
}

function actionAssessment(label: string) {
  const tokens = words(label, true);
  const adjectiveOnly = tokens.length <= 2 && tokens.every((token) => ABSTRACT_WORDS.has(token));
  const openingTokens = tokens.slice(0, 3);
  const hasKnownAction = openingTokens.some((token) =>
    ACTION_PREFIXES.some((action) => token === action || token.startsWith(action)),
  );
  const hasInfinitive = openingTokens.some((token) => /(?:er|ir|re)$/u.test(token));
  const hasAction = hasKnownAction || hasInfinitive;
  const abstract = adjectiveOnly || (!hasAction && tokens.length <= 4);
  return { adjectiveOnly, abstract, hasAction };
}

function siblingDifferentiation(choice: EventChoice, siblings: EventChoice[]): number {
  const others = siblings.filter((candidate) => candidate !== choice);
  const highestSimilarity = Math.max(
    0,
    ...others.map((candidate) => jaccard(choice.label, candidate.label)),
  );
  return Math.round((1 - highestSimilarity) * 100);
}

function contextSpecificity(event: GameEventDefinition, choice: EventChoice): number {
  const overlap = jaccard(choice.label, `${event.title} ${event.summary}`);
  const distinctWords = words(choice.label).length;
  return Math.min(100, Math.round(overlap * 120 + Math.min(35, distinctWords * 5)));
}

const allChoices = events.flatMap((event) => event.choices.map((choice) => ({ event, choice })));
const allOutcomes = allChoices.flatMap(({ event, choice }) =>
  choice.outcomeGroups.map((outcome) => ({ event, choice, outcome })),
);

const choicesByCount = Object.fromEntries(
  [2, 3, 4, 5].map((count) => [
    String(count),
    events.filter((event) => event.choices.length === count).length,
  ]),
);

const chainEdges = events.flatMap((event) =>
  event.choices.flatMap((choice) =>
    choice.outcomeGroups.flatMap((outcome) =>
      (outcome.enqueueEventIds ?? []).map((target) => ({ source: event.id, target })),
    ),
  ),
);
const chainAdjacency = new Map<string, string[]>();
for (const edge of chainEdges) {
  chainAdjacency.set(edge.source, [...(chainAdjacency.get(edge.source) ?? []), edge.target]);
}

function chainDepth(start: string, path = new Set<string>()): number {
  if (path.has(start)) return 0;
  const nextPath = new Set(path).add(start);
  const targets = chainAdjacency.get(start) ?? [];
  return targets.length === 0
    ? 0
    : 1 + Math.max(...targets.map((target) => chainDepth(target, nextPath)));
}

const chainRoots = [...chainAdjacency.keys()];
const chainDepths = chainRoots.map((root) => ({ root, depth: chainDepth(root) }));

const flagsProduced = new Set<string>();
for (const { outcome } of allOutcomes) {
  for (const key of Object.keys(outcome.setFlags ?? {})) flagsProduced.add(key);
  for (const effect of outcome.effects) if (effect.kind === "flag") flagsProduced.add(effect.key);
  for (const delayed of outcome.delayedEffects ?? []) {
    for (const effect of delayed.effects) if (effect.kind === "flag") flagsProduced.add(effect.key);
  }
}

function staticReachabilityProblems(event: GameEventDefinition): string[] {
  const problems: string[] = [];
  const positivePhases = Object.entries(event.phaseWeights)
    .filter(([, weight]) => (weight ?? 0) > 0)
    .map(([phase]) => phase);
  if (positivePhases.length === 0) problems.push("aucun poids de phase positif");
  if (
    event.minDecisionIndex !== undefined &&
    event.maxDecisionIndex !== undefined &&
    event.minDecisionIndex > event.maxDecisionIndex
  ) {
    problems.push("minDecisionIndex supérieur à maxDecisionIndex");
  }
  if (event.eligibleParties?.length === 0) problems.push("eligibleParties vide");
  for (const condition of event.eligibility) {
    if (
      condition.kind === "phase" &&
      !condition.values.some((phase) => positivePhases.includes(phase))
    ) {
      problems.push("condition de phase incompatible avec phaseWeights");
    }
    if (
      (condition.kind === "party_stat" || condition.kind === "trait") &&
      ((condition.operator === "gte" && condition.value > 100) ||
        (condition.operator === "lte" && condition.value < 0))
    ) {
      problems.push(`condition ${condition.kind} hors bornes`);
    }
    if (condition.kind === "flag" && !flagsProduced.has(condition.key)) {
      problems.push(`flag requis sans producteur détecté: ${condition.key}`);
    }
  }
  return [...new Set(problems)];
}

const staticProblems = events
  .map((event) => ({ id: event.id, problems: staticReachabilityProblems(event) }))
  .filter((entry) => entry.problems.length > 0);

const structureGroups = new Map<string, string[]>();
const consequenceGroups = new Map<
  string,
  Array<{ eventId: string; choiceId: string; label: string }>
>();
for (const event of events) {
  const structure = eventStructureSignature(event);
  structureGroups.set(structure, [...(structureGroups.get(structure) ?? []), event.id]);
  for (const choice of event.choices) {
    const signature = choiceConsequenceSignature(choice);
    consequenceGroups.set(signature, [
      ...(consequenceGroups.get(signature) ?? []),
      { eventId: event.id, choiceId: choice.id, label: choice.label },
    ]);
  }
}

const nearDuplicatePairs: Array<{ left: string; right: string; similarity: number }> = [];
for (let leftIndex = 0; leftIndex < events.length; leftIndex += 1) {
  const left = events[leftIndex];
  if (!left) continue;
  for (let rightIndex = leftIndex + 1; rightIndex < events.length; rightIndex += 1) {
    const right = events[rightIndex];
    if (!right) continue;
    const similarity = jaccard(eventVisibleText(left), eventVisibleText(right));
    if (similarity >= 0.62) {
      nearDuplicatePairs.push({
        left: left.id,
        right: right.id,
        similarity: Number(similarity.toFixed(3)),
      });
    }
  }
}
nearDuplicatePairs.sort((a, b) => b.similarity - a.similarity);

const parent = new Map(events.map((event) => [event.id, event.id]));
function find(id: string): string {
  const current = parent.get(id) ?? id;
  if (current === id) return id;
  const root = find(current);
  parent.set(id, root);
  return root;
}
function union(a: string, b: string): void {
  const rootA = find(a);
  const rootB = find(b);
  if (rootA !== rootB) parent.set(rootB, rootA);
}
for (const pair of nearDuplicatePairs) union(pair.left, pair.right);
const similarityClusters = new Map<string, string[]>();
for (const event of events) {
  const root = find(event.id);
  similarityClusters.set(root, [...(similarityClusters.get(root) ?? []), event.id]);
}

const choiceAssessments = allChoices.map(({ event, choice }) => {
  const action = actionAssessment(choice.label);
  const siblingSignatures = event.choices.map(choiceConsequenceSignature);
  const ownSignature = choiceConsequenceSignature(choice);
  const strategicDifference = siblingSignatures.some((signature) => signature !== ownSignature);
  const ideological = Boolean(choice.statement?.ideology) || Boolean(choice.statement?.topic);
  return {
    eventId: event.id,
    choiceId: choice.id,
    label: choice.label,
    tag: choice.visibleTag ?? null,
    heuristic: {
      clarity: choice.label.length >= 8 && choice.label.length <= 100 ? 100 : 50,
      concreteness: action.hasAction ? (action.abstract ? 45 : 90) : action.adjectiveOnly ? 10 : 35,
      contextSpecificity: contextSpecificity(event, choice),
      differentiation: siblingDifferentiation(choice, event.choices),
      strategicInterest: strategicDifference && choice.outcomeGroups.length >= 2 ? 85 : 35,
      ideologicalCoherence: ideological ? 80 : event.category === "program" ? 50 : 25,
      riskInformation: choice.visibleTag || choice.immediatePublicHint ? 85 : 30,
      credibleConsequence: choice.outcomeGroups.every(
        (outcome) =>
          outcome.effects.length > 0 && words(outcome.publicNarrative, true).length >= 20,
      )
        ? 85
        : 40,
    },
    flags: action,
  };
});

const outcomeNarratives = allOutcomes.map(({ outcome }) => outcome.publicNarrative);
const outcomeTitles = allOutcomes.map(({ outcome }) => outcome.title);
const choiceLabels = allChoices.map(({ choice }) => choice.label);
const adjectiveChoices = choiceAssessments.filter((entry) => entry.flags.adjectiveOnly);
const abstractChoices = choiceAssessments.filter((entry) => entry.flags.abstract);
const actionlessChoices = choiceAssessments.filter((entry) => !entry.flags.hasAction);

const partySpecificEvents = events.filter(
  (event) =>
    Boolean(event.eligibleParties?.length) ||
    event.eligibility.some((condition) => condition.kind === "player_party"),
);
const phaseSpecificEvents = events.filter((event) => {
  const positivePhases = Object.values(event.phaseWeights).filter(
    (weight) => (weight ?? 0) > 0,
  ).length;
  return (
    positivePhases <= 2 ||
    event.minDecisionIndex !== undefined ||
    event.maxDecisionIndex !== undefined
  );
});
const ideologySpecificEvents = events.filter(
  (event) =>
    (event.requiredTags?.length ?? 0) > 0 ||
    event.eligibility.some((condition) => "axis" in condition),
);

const decisiveEvents = events.filter((event) => {
  const hasLargeEffect = event.choices.some((choice) =>
    choice.outcomeGroups.some((outcome) =>
      outcome.effects.some((effect) => "delta" in effect && Math.abs(effect.delta) >= 5),
    ),
  );
  const triggersEnding = event.choices.some((choice) =>
    choice.outcomeGroups.some((outcome) => Boolean(outcome.endingTrigger)),
  );
  return (
    hasLargeEffect ||
    triggersEnding ||
    ["debate", "scandal", "between_rounds", "government"].includes(event.category)
  );
});

const consequenceReuse = [...consequenceGroups.entries()]
  .map(([signature, uses]) => ({ signature, count: uses.length, uses }))
  .filter((group) => group.count > 1)
  .sort((a, b) => b.count - a.count);
const structureReuse = [...structureGroups.entries()]
  .map(([signature, eventIds]) => ({ signature, count: eventIds.length, eventIds }))
  .sort((a, b) => b.count - a.count);

const tagFrequency = rankedFrequencies(
  allChoices.map(({ choice }) => choice.visibleTag ?? "AUCUN"),
  30,
);

const allImmediateEffects = allOutcomes.flatMap(({ outcome }) => outcome.effects);
const allDelayedEffects = allOutcomes.flatMap(({ outcome }) =>
  (outcome.delayedEffects ?? []).flatMap((delayed) => delayed.effects),
);
const allProductionEffects = [...allImmediateEffects, ...allDelayedEffects];
const effectKindFrequency = rankedFrequencies(
  allProductionEffects.map((effect) => effect.kind),
  30,
);
const partyStatEffectFrequency = rankedFrequencies(
  allProductionEffects.flatMap((effect) => (effect.kind === "party_stat" ? [effect.stat] : [])),
  30,
);
const hiddenStatEffectFrequency = rankedFrequencies(
  allProductionEffects.flatMap((effect) => (effect.kind === "hidden_stat" ? [effect.stat] : [])),
  30,
);
const modifierSourceFrequency = rankedFrequencies(
  allOutcomes.flatMap(({ outcome }) => outcome.modifiers.map((modifier) => modifier.source)),
  30,
);
const statements = allChoices.flatMap(({ event, choice }) =>
  choice.statement ? [{ eventId: event.id, choiceId: choice.id, ...choice.statement }] : [],
);

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    nearDuplicateThreshold: 0.62,
    nearDuplicateMethod:
      "Jaccard sur les mots normalisés de tous les textes visibles de chaque événement, hors mots-outils français.",
    distinctContentMethod:
      "Nombre de composantes après réunion des événements dont la similarité Jaccard atteint 0,62, divisé par le nombre total d’événements. Cette mesure détecte surtout la réutilisation textuelle et doit être lue avec les signatures structurelles.",
    adjectiveAndActionMethod:
      "Heuristique lexicale documentée dans scripts/audit/content-audit.ts; les listes complètes permettent une revue humaine.",
    decisiveDefinition:
      "Au moins un effet absolu >= 5, un endingTrigger, ou catégorie débat/scandale/entre-deux-tours/gouvernement.",
    partySpecificDefinition: "eligibleParties ou condition player_party.",
    ideologySpecificDefinition: "requiredTags ou condition portant un axe idéologique.",
  },
  inventory: {
    totalEvents: events.length,
    totalChoices: allChoices.length,
    averageChoicesPerEvent: Number((allChoices.length / events.length).toFixed(3)),
    eventsByChoiceCount: choicesByCount,
    eventsWithOtherChoiceCount: events.filter(
      (event) => ![2, 3, 4, 5].includes(event.choices.length),
    ).length,
    uniqueChoiceTextsExact: new Set(choiceLabels).size,
    uniqueChoiceTextsNormalized: new Set(choiceLabels.map(normalized)).size,
    totalOutcomes: allOutcomes.length,
    uniqueOutcomeNarrativesExact: new Set(outcomeNarratives).size,
    uniqueOutcomeNarrativesNormalized: new Set(outcomeNarratives.map(normalized)).size,
    uniqueOutcomeTitlesExact: new Set(outcomeTitles).size,
    genericEvents: events.length - partySpecificEvents.length,
    partySpecificEvents: partySpecificEvents.length,
    partySpecificEventIds: partySpecificEvents.map((event) => event.id),
    ideologySpecificEvents: ideologySpecificEvents.length,
    ideologySpecificEventIds: ideologySpecificEvents.map((event) => event.id),
    phaseSpecificEvents: phaseSpecificEvents.length,
    rareEvents: events.filter((event) => ["rare", "legendary", "secret"].includes(event.rarity))
      .length,
    decisiveEvents: decisiveEvents.length,
    chainSources: chainRoots.length,
    chainEdges: chainEdges.length,
    eventsParticipatingInChains: new Set(chainEdges.flatMap((edge) => [edge.source, edge.target]))
      .size,
    averageChainDepth: Number(
      (
        chainDepths.reduce((sum, entry) => sum + entry.depth, 0) / Math.max(1, chainDepths.length)
      ).toFixed(3),
    ),
    maximumChainDepth: Math.max(0, ...chainDepths.map((entry) => entry.depth)),
    chainDepths: chainDepths.sort((a, b) => b.depth - a.depth),
  },
  staticReachability: {
    eventsWithImpossibleOrUnproducibleConditions: staticProblems.length,
    details: staticProblems,
    flagsProduced: [...flagsProduced].sort(),
    note: "La portée empirique est mesurée séparément dans audit/simulation-report.json.",
  },
  repetition: {
    top30ChoiceFormulations: rankedFrequencies(choiceLabels.map(normalized), 30),
    exactDuplicateChoiceGroups: rankedFrequencies(choiceLabels.map(normalized), 200, false),
    top20EventStructures: structureReuse.slice(0, 20),
    top20ConsequenceSets: consequenceReuse.slice(0, 20),
    reusedConsequenceSets: consequenceReuse.length,
    choicesUsingReusedConsequenceSets: consequenceReuse.reduce(
      (sum, group) => sum + group.count,
      0,
    ),
    exactOutcomeNarratives: rankedFrequencies(outcomeNarratives, 30, false),
    exactOutcomeTitles: rankedFrequencies(outcomeTitles, 30, false),
    nearDuplicatePairCount: nearDuplicatePairs.length,
    topNearDuplicatePairs: nearDuplicatePairs.slice(0, 100),
    similarityClusterCount: similarityClusters.size,
    distinctContentPercentage: Number(((similarityClusters.size / events.length) * 100).toFixed(2)),
    largestSimilarityClusters: [...similarityClusters.values()]
      .sort((a, b) => b.length - a.length)
      .slice(0, 20),
    topBigrams: ngrams(events.map(eventVisibleText), 2, 50),
    topTrigrams: ngrams(events.map(eventVisibleText), 3, 50),
    topFourgrams: ngrams(events.map(eventVisibleText), 4, 50),
  },
  choiceQuality: {
    adjectiveOnlyCount: adjectiveChoices.length,
    adjectiveOnlyPercentage: Number(
      ((adjectiveChoices.length / allChoices.length) * 100).toFixed(2),
    ),
    abstractCount: abstractChoices.length,
    abstractPercentage: Number(((abstractChoices.length / allChoices.length) * 100).toFixed(2)),
    actionlessCount: actionlessChoices.length,
    actionlessPercentage: Number(((actionlessChoices.length / allChoices.length) * 100).toFixed(2)),
    tagFrequency,
    prudentRiskCollectiveTriptychEvents: events.filter((event) => {
      const tags = event.choices.map((choice) => choice.visibleTag);
      return tags.includes("PRUDENT") && tags.includes("RISQUÉ") && tags.includes("RASSEMBLEUR");
    }).length,
    factoryChoiceIdPatternEvents: events.filter((event) => {
      const ids = event.choices.map((choice) => choice.id);
      return ids.includes("prudent_response") && ids.includes("risk_breakthrough");
    }).length,
    interchangeableChoiceTemplateGroups: structureReuse
      .filter((group) => group.count > 1)
      .slice(0, 50),
    adjectiveExamples: adjectiveChoices,
    abstractExamples: abstractChoices,
    actionlessExamples: actionlessChoices,
    assessments: choiceAssessments,
  },
  mechanicalCoverage: {
    effectKindFrequency,
    partyStatEffectFrequency,
    hiddenStatEffectFrequency,
    modifierSourceFrequency,
    statementCount: statements.length,
    statementsWithIdeologyDelta: statements.filter((statement) => Boolean(statement.ideology))
      .length,
    statements,
    eventsUsingAllianceEffects: events.filter((event) =>
      event.choices.some((choice) =>
        choice.outcomeGroups.some((outcome) =>
          outcome.effects.some((effect) => effect.kind === "alliance"),
        ),
      ),
    ).length,
    eventsUsingPartySplitEffects: events.filter((event) =>
      event.choices.some((choice) =>
        choice.outcomeGroups.some((outcome) =>
          outcome.effects.some((effect) => effect.kind === "party_split"),
        ),
      ),
    ).length,
    eventsUsingCandidateStatusEffects: events.filter((event) =>
      event.choices.some((choice) =>
        choice.outcomeGroups.some((outcome) =>
          outcome.effects.some((effect) => effect.kind === "candidate_status"),
        ),
      ),
    ).length,
    eventsUsingIdeologyEffects: events.filter((event) =>
      event.choices.some((choice) =>
        choice.outcomeGroups.some((outcome) =>
          outcome.effects.some((effect) => effect.kind === "ideology"),
        ),
      ),
    ).length,
    eventsUsingBlocTrustEffects: events.filter((event) =>
      event.choices.some((choice) =>
        choice.outcomeGroups.some((outcome) =>
          outcome.effects.some((effect) => effect.kind === "bloc_trust"),
        ),
      ),
    ).length,
    eventsUsingWorldEffects: events.filter((event) =>
      event.choices.some((choice) =>
        choice.outcomeGroups.some((outcome) =>
          outcome.effects.some((effect) => effect.kind === "world"),
        ),
      ),
    ).length,
  },
};

await mkdir(resolve("audit"), { recursive: true });
await writeFile(
  resolve("audit", "content-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

const summary = {
  totalEvents: report.inventory.totalEvents,
  totalChoices: report.inventory.totalChoices,
  uniqueOutcomeNarratives: report.inventory.uniqueOutcomeNarrativesExact,
  partySpecificEvents: report.inventory.partySpecificEvents,
  ideologySpecificEvents: report.inventory.ideologySpecificEvents,
  reusedConsequenceSets: report.repetition.reusedConsequenceSets,
  nearDuplicatePairs: report.repetition.nearDuplicatePairCount,
  distinctContentPercentage: report.repetition.distinctContentPercentage,
  adjectiveOnlyPercentage: report.choiceQuality.adjectiveOnlyPercentage,
  actionlessPercentage: report.choiceQuality.actionlessPercentage,
};

console.log(JSON.stringify(summary, null, 2));
