/**
 * Static audit of the event/choice/outcome catalog (sections 6, 7, 8 of the
 * post-corrections audit brief). Does not run the engine — pure data
 * analysis over `gameContent`. Safe to run standalone: `npx tsx
 * scripts/audit-post/catalog-audit.ts`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import type { EventChoice, GameEffect, WeightedOutcome } from "../../src/game/types/index";
import { toCsv } from "./lib/csv";
import { clusterBySimilarity, exactAndNormalizedCounts, normalize } from "./lib/text-similarity";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results");

const events = gameContent.events;
const allChoices = events.flatMap((event) => event.choices.map((choice) => ({ event, choice })));
const allOutcomes = events.flatMap((event) =>
  event.choices.flatMap((choice) =>
    choice.outcomeGroups.map((outcome) => ({ event, choice, outcome })),
  ),
);

// --- 6. Structural inventory ----------------------------------------------

const choiceCounts = events.map((event) => event.choices.length);
const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
};

const eventsByChoiceCount: Record<number, number> = {};
for (const count of choiceCounts)
  eventsByChoiceCount[count] = (eventsByChoiceCount[count] ?? 0) + 1;

function hasMechanicalConsequence(outcome: WeightedOutcome): boolean {
  return outcome.effects.length > 0 || (outcome.delayedEffects?.length ?? 0) > 0;
}
function hasNarrative(outcome: WeightedOutcome): boolean {
  return outcome.publicNarrative.trim().length > 0;
}
function hasProbabilisticVariation(choice: EventChoice): boolean {
  if (choice.outcomeGroups.length < 2) return false;
  const weights = choice.outcomeGroups.map((o) => o.baseWeight);
  return (
    new Set(weights).size > 1 || choice.outcomeGroups.some((o) => (o.modifiers?.length ?? 0) > 0)
  );
}
function optionsProduceSameResult(choice: EventChoice): boolean {
  if (choice.outcomeGroups.length < 2) return false;
  const signatures = new Set(choice.outcomeGroups.map((o) => mechanicalSignature(o)));
  return signatures.size === 1;
}

function mechanicalSignature(outcome: WeightedOutcome): string {
  const effectSig = (effect: GameEffect): string => {
    if ("delta" in effect) {
      const sign = effect.delta > 0 ? "+" : effect.delta < 0 ? "-" : "0";
      const magnitude =
        Math.abs(effect.delta) >= 10 ? "L" : Math.abs(effect.delta) >= 3 ? "M" : "S";
      const key = "stat" in effect ? effect.stat : "axis" in effect ? effect.axis : "";
      return `${effect.kind}:${key}:${sign}${magnitude}`;
    }
    switch (effect.kind) {
      case "flag":
        return `flag:${effect.key}`;
      case "candidate_status":
        return `candidate_status:${effect.status}`;
      case "alliance":
        return `alliance:${effect.action}`;
      case "party_split":
        return "party_split";
      case "actor_memory":
        return `actor_memory:${effect.memory}`;
      case "policy_position":
        return `policy_position:${effect.topic}`;
      case "opponent_strategy":
        return `opponent_strategy:${effect.strategy}`;
      default:
        return "unknown";
    }
  };
  const immediate = outcome.effects.map(effectSig).sort();
  const delayed = (outcome.delayedEffects ?? [])
    .flatMap((scheduled) => scheduled.effects.map(effectSig))
    .sort();
  return `imm[${immediate.join(",")}]dly[${delayed.join(",")}]`;
}

function choiceMechanicalSignature(choice: EventChoice): string {
  return choice.outcomeGroups
    .map((outcome) => `${outcome.baseWeight}:${mechanicalSignature(outcome)}`)
    .sort()
    .join("|");
}

const eventsWithoutMechanicalConsequence = events
  .filter((event) =>
    event.choices.every((choice) =>
      choice.outcomeGroups.every((outcome) => !hasMechanicalConsequence(outcome)),
    ),
  )
  .map((e) => e.id);

const eventsWithoutNarrative = events
  .filter((event) =>
    event.choices.every((choice) =>
      choice.outcomeGroups.every((outcome) => !hasNarrative(outcome)),
    ),
  )
  .map((e) => e.id);

const eventsWithoutProbabilisticVariation = events
  .filter((event) => event.choices.every((choice) => !hasProbabilisticVariation(choice)))
  .map((e) => e.id);

const eventsWhereAllOptionsConverge = events
  .filter(
    (event) =>
      event.choices.length >= 2 &&
      new Set(event.choices.map((choice) => choiceMechanicalSignature(choice))).size === 1,
  )
  .map((e) => e.id);

const eventsWithConvergentOptionOutcomes = events
  .filter((event) => event.choices.some((choice) => optionsProduceSameResult(choice)))
  .map((e) => e.id);

const eventsWithDelayedConsequence = events
  .filter((event) =>
    event.choices.some((choice) =>
      choice.outcomeGroups.some((o) => (o.delayedEffects?.length ?? 0) > 0),
    ),
  )
  .map((e) => e.id);

const eventsWithHiddenConsequence = events
  .filter((event) =>
    event.choices.some((choice) =>
      choice.outcomeGroups.some((o) =>
        o.effects.some((eff) => "visibility" in eff && eff.visibility === "hidden"),
      ),
    ),
  )
  .map((e) => e.id);

const eventsLaunchingChain = events
  .filter((event) =>
    event.choices.some((choice) =>
      choice.outcomeGroups.some((o) => (o.followUps?.length ?? 0) > 0),
    ),
  )
  .map((e) => e.id);

const eventsWithChainMetadata = events.filter((e) => e.chain !== undefined).map((e) => e.id);

const eventsUsingActorMemory = events
  .filter(
    (event) =>
      event.choices.some((choice) =>
        choice.outcomeGroups.some((o) => o.effects.some((eff) => eff.kind === "actor_memory")),
      ) || event.eligibility.some((c) => c.kind === "actor_memory"),
  )
  .map((e) => e.id);

const eventsUsingPriorDecision = events
  .filter((event) =>
    event.eligibility.some((c) =>
      [
        "flag",
        "not_flag",
        "statement_exists",
        "contradiction_count",
        "actor_memory",
        "party_relation",
      ].includes(c.kind),
    ),
  )
  .map((e) => e.id);

const eventsModifyingIdeology = events
  .filter(
    (event) =>
      event.choices.some((choice) =>
        choice.outcomeGroups.some((o) => o.effects.some((eff) => eff.kind === "ideology")),
      ) || event.choices.some((c) => c.statement?.ideology),
  )
  .map((e) => e.id);

const eventsModifyingRelation = events
  .filter((event) =>
    event.choices.some((choice) =>
      choice.outcomeGroups.some((o) => o.effects.some((eff) => eff.kind === "party_relation")),
    ),
  )
  .map((e) => e.id);

const eventsAffectingOpponent = events
  .filter((event) =>
    event.choices.some((choice) =>
      choice.outcomeGroups.some((o) =>
        o.effects.some(
          (eff) =>
            eff.kind === "opponent_strategy" ||
            eff.kind === "candidate_status" ||
            eff.kind === "party_split",
        ),
      ),
    ),
  )
  .map((e) => e.id);

const eventsThatCanRemoveCandidate = events
  .filter((event) =>
    event.choices.some((choice) =>
      choice.outcomeGroups.some((o) =>
        o.effects.some(
          (eff) =>
            eff.kind === "candidate_status" &&
            ["withdrawn", "disqualified", "eliminated"].includes(eff.status),
        ),
      ),
    ),
  )
  .map((e) => e.id);

const eventsWithCooldown = events.filter((e) => e.cooldown > 0).map((e) => e.id);
const eventsRepeatable = events.filter((e) => !e.oncePerRun).map((e) => e.id);
const eventsRepeatableWithoutLimit = events
  .filter((e) => !e.oncePerRun && e.maxAppearances === undefined && e.cooldown < 4)
  .map((e) => e.id);

// --- Integrity checks -------------------------------------------------------

const eventIds = new Set(events.map((e) => e.id));
const duplicateIds = events.map((e) => e.id).filter((id, i, arr) => arr.indexOf(id) !== i);

const chainTargetsMissing: Array<{
  eventId: string;
  choiceId: string;
  outcomeId: string;
  target: string;
}> = [];
for (const { event, choice, outcome } of allOutcomes) {
  for (const followUp of outcome.followUps ?? []) {
    if (!eventIds.has(followUp.eventId)) {
      chainTargetsMissing.push({
        eventId: event.id,
        choiceId: choice.id,
        outcomeId: outcome.id,
        target: followUp.eventId,
      });
    }
  }
  for (const target of outcome.enqueueEventIds ?? []) {
    if (!eventIds.has(target)) {
      chainTargetsMissing.push({
        eventId: event.id,
        choiceId: choice.id,
        outcomeId: outcome.id,
        target,
      });
    }
  }
}

const chainFollowsMissing = events
  .filter((e) => e.chain?.followsEventIds?.some((id) => !eventIds.has(id)))
  .map((e) => ({
    eventId: e.id,
    missing: e.chain!.followsEventIds!.filter((id) => !eventIds.has(id)),
  }));

const incompatibleMissing = events.flatMap((e) =>
  (e.incompatibleEventIds ?? [])
    .filter((id) => !eventIds.has(id))
    .map((id) => ({ eventId: e.id, missing: id })),
);

const outcomeIdDuplicatesWithinChoice = allChoices
  .map(({ event, choice }) => ({
    eventId: event.id,
    choiceId: choice.id,
    duplicates: choice.outcomeGroups.map((o) => o.id).filter((id, i, arr) => arr.indexOf(id) !== i),
  }))
  .filter((row) => row.duplicates.length > 0);

const identicalOutcomeSetsWithinEvent = events
  .filter((event) => {
    const setKey = (choice: EventChoice) =>
      choice.outcomeGroups
        .map((o) => o.id)
        .sort()
        .join(",");
    const keys = event.choices.map(setKey);
    return new Set(keys).size < keys.length;
  })
  .map((e) => e.id);

// --- 7. Choice genericity ----------------------------------------------------

const TAG_ARCHETYPES = [
  "PRUDENT",
  "RISQUÉ",
  "RASSEMBLEUR",
  "OFFENSIF",
  "LOYAL",
  "OPPORTUNISTE",
  "TECHNIQUE",
  "INSTITUTIONNEL",
  "POPULAIRE",
  "PRÉSIDENTIEL",
  "TRANSPARENT",
  "SECRET",
  "CLIVANT",
] as const;

const tagFrequency = new Map<string, number>();
for (const { choice } of allChoices) {
  const tag = choice.visibleTag ?? "(aucune)";
  tagFrequency.set(tag, (tagFrequency.get(tag) ?? 0) + 1);
}
const tagFrequencyRows = [...tagFrequency.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([tag, count]) => ({ tag, count }));

const top3TagShare =
  tagFrequencyRows
    .filter((row) => TAG_ARCHETYPES.includes(row.tag as (typeof TAG_ARCHETYPES)[number]))
    .slice(0, 3)
    .reduce((sum, row) => sum + row.count, 0) / Math.max(allChoices.length, 1);

// Exact historical definition (matches the V1 audit and the current
// scripts/audit/content-audit.ts): an event is flagged only if it offers
// all three of PRUDENT, RISQUÉ and RASSEMBLEUR simultaneously. This is the
// number directly comparable to the "160/182" figure from the prior audit.
const eventsWithClassicTriptych = events
  .filter((event) => {
    const tags = event.choices.map((c) => c.visibleTag);
    return tags.includes("PRUDENT") && tags.includes("RISQUÉ") && tags.includes("RASSEMBLEUR");
  })
  .map((e) => e.id);

// Broader, looser signal: events where at least two of the three classic
// tags co-occur (catches partial reliance on the old triptych even where a
// fourth/fifth option was added). Reported separately — do not conflate the
// two numbers.
const classicTagSet = new Set(["PRUDENT", "RISQUÉ", "RASSEMBLEUR"]);
const eventsWithPartialClassicTriptych = events
  .filter((event) => {
    const tags = event.choices.map((c) => c.visibleTag).filter(Boolean) as string[];
    const classicTags = tags.filter((tag) => classicTagSet.has(tag));
    return classicTags.length >= 2;
  })
  .map((e) => e.id);

const choiceLabelDocs = allChoices.map(({ event, choice }, index) => ({
  id: `${event.id}::${choice.id}::${index}`,
  text: choice.label,
}));
const choiceLabelStats = exactAndNormalizedCounts(choiceLabelDocs.map((d) => d.text));
const { clusters: choiceClusters, pairSimilarities: choicePairSimilarities } = clusterBySimilarity(
  choiceLabelDocs,
  0.62,
);
const choiceClustersLoose = clusterBySimilarity(choiceLabelDocs, 0.5).clusters;
const choiceClustersStrict = clusterBySimilarity(choiceLabelDocs, 0.8).clusters;

// Mechanical equivalence: choices across the whole corpus sharing the exact
// same mechanical signature (regardless of text) — a stronger genericity
// signal than lexical similarity alone.
const mechSignatureGroups = new Map<string, string[]>();
for (const { event, choice } of allChoices) {
  const sig = choiceMechanicalSignature(choice);
  mechSignatureGroups.set(sig, [
    ...(mechSignatureGroups.get(sig) ?? []),
    `${event.id}::${choice.id}`,
  ]);
}
const mechanicallyEquivalentGroups = [...mechSignatureGroups.entries()]
  .filter(([, ids]) => ids.length >= 3)
  .sort((a, b) => b[1].length - a[1].length);
const choicesInMechanicallyEquivalentGroups = mechanicallyEquivalentGroups.reduce(
  (sum, [, ids]) => sum + ids.length,
  0,
);

// Events where two or more options are mechanically identical to each other
// (a "false dilemma": different text, same consequence).
const eventsWithMechanicallyIdenticalOptions = events
  .filter((event) => {
    const sigs = event.choices.map((c) => choiceMechanicalSignature(c));
    return new Set(sigs).size < sigs.length;
  })
  .map((e) => e.id);

// --- 8. Consequence diversity -------------------------------------------------

const outcomeTitleDocs = allOutcomes.map(({ event, choice, outcome }, index) => ({
  id: `${event.id}::${choice.id}::${outcome.id}::${index}`,
  text: outcome.title,
}));
const outcomeNarrativeDocs = allOutcomes.map(({ event, choice, outcome }, index) => ({
  id: `${event.id}::${choice.id}::${outcome.id}::${index}`,
  text: outcome.publicNarrative,
}));
const titleStats = exactAndNormalizedCounts(outcomeTitleDocs.map((d) => d.text));
const narrativeStats = exactAndNormalizedCounts(outcomeNarrativeDocs.map((d) => d.text));
const { clusters: narrativeClusters, pairSimilarities: narrativePairSimilarities } =
  clusterBySimilarity(outcomeNarrativeDocs, 0.55);
const narrativeClustersLoose = clusterBySimilarity(outcomeNarrativeDocs, 0.45).clusters;
const narrativeClustersStrict = clusterBySimilarity(outcomeNarrativeDocs, 0.75).clusters;

const mechSigByOutcome = new Map<string, string[]>();
for (const { event, choice, outcome } of allOutcomes) {
  const sig = mechanicalSignature(outcome);
  mechSigByOutcome.set(sig, [
    ...(mechSigByOutcome.get(sig) ?? []),
    `${event.id}::${choice.id}::${outcome.id}`,
  ]);
}
const mechanicallyIdenticalOutcomeGroups = [...mechSigByOutcome.entries()]
  .filter(([, ids]) => ids.length >= 5)
  .sort((a, b) => b[1].length - a[1].length);
const uniqueMechanicalSignatures = mechSigByOutcome.size;
const top10SignatureShare =
  [...mechSigByOutcome.values()]
    .sort((a, b) => b.length - a.length)
    .slice(0, 10)
    .reduce((sum, ids) => sum + ids.length, 0) / Math.max(allOutcomes.length, 1);

// Textually different but mechanically identical, vs textually identical but
// mechanically different.
const narrativeToSignatures = new Map<string, Set<string>>();
const signatureToNarratives = new Map<string, Set<string>>();
for (const { outcome } of allOutcomes) {
  const norm = normalize(outcome.publicNarrative);
  const sig = mechanicalSignature(outcome);
  if (!narrativeToSignatures.has(norm)) narrativeToSignatures.set(norm, new Set());
  narrativeToSignatures.get(norm)!.add(sig);
  if (!signatureToNarratives.has(sig)) signatureToNarratives.set(sig, new Set());
  signatureToNarratives.get(sig)!.add(norm);
}
const identicalTextDifferentMechanics = [...narrativeToSignatures.entries()].filter(
  ([, sigs]) => sigs.size > 1,
).length;
const differentTextIdenticalMechanics = [...signatureToNarratives.entries()].filter(
  ([, norms]) => norms.size > 3,
).length;

// --- write outputs -----------------------------------------------------------

await mkdir(OUT_DIR, { recursive: true });

const catalogRows = events.map((event) => ({
  eventId: event.id,
  title: event.title,
  category: event.category,
  rarity: event.rarity,
  choices: event.choices.length,
  oncePerRun: event.oncePerRun,
  cooldown: event.cooldown,
  maxAppearances: event.maxAppearances ?? "",
  hasChainMetadata: event.chain !== undefined,
  launchesChain: eventsLaunchingChain.includes(event.id),
  hasDelayedConsequence: eventsWithDelayedConsequence.includes(event.id),
  hasHiddenConsequence: eventsWithHiddenConsequence.includes(event.id),
  usesActorMemory: eventsUsingActorMemory.includes(event.id),
  usesPriorDecision: eventsUsingPriorDecision.includes(event.id),
  modifiesIdeology: eventsModifyingIdeology.includes(event.id),
  modifiesRelation: eventsModifyingRelation.includes(event.id),
  affectsOpponent: eventsAffectingOpponent.includes(event.id),
  canRemoveCandidate: eventsThatCanRemoveCandidate.includes(event.id),
  classicTriptych: eventsWithClassicTriptych.includes(event.id),
  mechanicallyConvergentOptions: eventsWhereAllOptionsConverge.includes(event.id),
  hasMechanicallyIdenticalOptions: eventsWithMechanicallyIdenticalOptions.includes(event.id),
  eligibleIdeologyFamilies: (event.eligibleIdeologyFamilies ?? []).join("|"),
  eligibleParties: (event.eligibleParties ?? []).join("|"),
}));
await writeFile(resolve(OUT_DIR, "event-catalog.csv"), toCsv(catalogRows), "utf8");

await writeFile(
  resolve(OUT_DIR, "choice-similarity.csv"),
  toCsv(
    choicePairSimilarities.slice(0, 2000).map((row) => ({
      a: row.a,
      b: row.b,
      similarity: Number(row.similarity.toFixed(4)),
    })),
    ["a", "b", "similarity"],
  ),
  "utf8",
);

await writeFile(
  resolve(OUT_DIR, "consequence-similarity.csv"),
  toCsv(
    narrativePairSimilarities.slice(0, 2000).map((row) => ({
      a: row.a,
      b: row.b,
      similarity: Number(row.similarity.toFixed(4)),
    })),
    ["a", "b", "similarity"],
  ),
  "utf8",
);

const catalogSummary = {
  generatedAt: new Date().toISOString(),
  structural: {
    totalEvents: events.length,
    totalChoices: allChoices.length,
    totalOutcomes: allOutcomes.length,
    meanChoicesPerEvent: Number(mean(choiceCounts).toFixed(3)),
    medianChoicesPerEvent: median(choiceCounts),
    eventsByChoiceCount,
  },
  emptiness: {
    eventsWithoutMechanicalConsequence,
    eventsWithoutNarrative,
    eventsWithoutProbabilisticVariation,
    eventsWhereAllOptionsConverge,
    eventsWithConvergentOptionOutcomes,
  },
  mechanisms: {
    eventsWithDelayedConsequence: eventsWithDelayedConsequence.length,
    eventsWithHiddenConsequence: eventsWithHiddenConsequence.length,
    eventsLaunchingChain: eventsLaunchingChain.length,
    eventsWithChainMetadata: eventsWithChainMetadata.length,
    eventsUsingActorMemory: eventsUsingActorMemory.length,
    eventsUsingPriorDecision: eventsUsingPriorDecision.length,
    eventsModifyingIdeology: eventsModifyingIdeology.length,
    eventsModifyingRelation: eventsModifyingRelation.length,
    eventsAffectingOpponent: eventsAffectingOpponent.length,
    eventsThatCanRemoveCandidate: eventsThatCanRemoveCandidate.length,
    eventsWithCooldown: eventsWithCooldown.length,
    eventsRepeatable: eventsRepeatable.length,
    eventsRepeatableWithoutLimit: eventsRepeatableWithoutLimit.length,
  },
  integrity: {
    duplicateEventIds: duplicateIds,
    chainTargetsMissing,
    chainFollowsMissing,
    incompatibleEventIdsMissing: incompatibleMissing,
    outcomeIdDuplicatesWithinChoice,
    identicalOutcomeSetsWithinEvent,
  },
  choiceGenericity: {
    tagFrequency: tagFrequencyRows,
    top3ClassicTagShareOfAllChoices: Number(top3TagShare.toFixed(4)),
    eventsWithClassicTriptych: eventsWithClassicTriptych.length,
    eventsWithClassicTriptychIds: eventsWithClassicTriptych,
    eventsWithPartialClassicTriptych: eventsWithPartialClassicTriptych.length,
    eventsWithPartialClassicTriptychIds: eventsWithPartialClassicTriptych,
    labelUniqueness: choiceLabelStats,
    lexicalClusterCount: choiceClusters.length,
    lexicalClusterCountByThreshold: {
      "0.50": choiceClustersLoose.length,
      "0.62": choiceClusters.length,
      "0.80": choiceClustersStrict.length,
    },
    lexicalClusterSizes: choiceClusters.slice(0, 10).map((c) => c.length),
    top10LexicalClusters: choiceClusters.slice(0, 10),
    mechanicallyEquivalentGroupCount: mechanicallyEquivalentGroups.length,
    choicesInMechanicallyEquivalentGroups,
    choicesInMechanicallyEquivalentGroupsShare: Number(
      (choicesInMechanicallyEquivalentGroups / Math.max(allChoices.length, 1)).toFixed(4),
    ),
    top10MechanicalGroups: mechanicallyEquivalentGroups.slice(0, 10).map(([sig, ids]) => ({
      signature: sig,
      count: ids.length,
      exampleIds: ids.slice(0, 6),
    })),
    eventsWithMechanicallyIdenticalOptions: eventsWithMechanicallyIdenticalOptions.length,
    eventsWithMechanicallyIdenticalOptionsIds: eventsWithMechanicallyIdenticalOptions,
  },
  consequenceDiversity: {
    titleUniqueness: titleStats,
    narrativeUniqueness: narrativeStats,
    narrativeLexicalClusterCount: narrativeClusters.length,
    narrativeLexicalClusterCountByThreshold: {
      "0.45": narrativeClustersLoose.length,
      "0.55": narrativeClusters.length,
      "0.75": narrativeClustersStrict.length,
    },
    narrativeLexicalClusterSizes: narrativeClusters.slice(0, 10).map((c) => c.length),
    top10NarrativeClusters: narrativeClusters.slice(0, 10),
    uniqueMechanicalSignatures,
    top10SignatureShareOfAllOutcomes: Number(top10SignatureShare.toFixed(4)),
    mechanicallyIdenticalOutcomeGroupCount: mechanicallyIdenticalOutcomeGroups.length,
    top10MechanicallyIdenticalOutcomeGroups: mechanicallyIdenticalOutcomeGroups
      .slice(0, 10)
      .map(([sig, ids]) => ({ signature: sig, count: ids.length, exampleIds: ids.slice(0, 6) })),
    identicalTextDifferentMechanicsCount: identicalTextDifferentMechanics,
    differentTextIdenticalMechanicsSignatureCount: differentTextIdenticalMechanics,
  },
};

await writeFile(
  resolve(OUT_DIR, "catalog-summary.json"),
  `${JSON.stringify(catalogSummary, null, 2)}\n`,
  "utf8",
);

console.log(
  JSON.stringify(
    {
      totalEvents: events.length,
      totalChoices: allChoices.length,
      eventsWithClassicTriptych: eventsWithClassicTriptych.length,
      labelUniqueness: choiceLabelStats,
      narrativeUniqueness: narrativeStats,
      lexicalClusterCount: choiceClusters.length,
      mechanicallyEquivalentGroupCount: mechanicallyEquivalentGroups.length,
      integrityIssues: {
        duplicateEventIds: duplicateIds.length,
        chainTargetsMissing: chainTargetsMissing.length,
        outcomeIdDuplicatesWithinChoice: outcomeIdDuplicatesWithinChoice.length,
      },
    },
    null,
    2,
  ),
);
