import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

import { buildCustomParty, gameContent, type CustomPartyInput } from "../../src/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine";
import { hashSeed } from "../../src/game/engine/rng";
import type { EventChoice, GameState } from "../../src/game/types";

type Strategy = "random" | "coherent" | "prudent" | "risky" | "collective";

const SEEDS = Math.max(
  20,
  Math.min(200, Number.parseInt(process.env.AUDIT_CUSTOM_SEEDS ?? "100", 10) || 100),
);
const STRATEGIES: Strategy[] = ["random", "coherent", "prudent", "risky", "collective"];

const profiles: Array<{ id: string; description: string; input: CustomPartyInput }> = [
  {
    id: "coherent_left_green",
    description: "Economically left, socially liberal, pro-European and strongly ecological.",
    input: {
      name: "Alliance sociale et écologique",
      shortName: "ASE",
      primaryColor: "#376a67",
      symbol: "◌",
      answers: {
        pensions: "earlier",
        taxation: "redistribute",
        immigration: "open",
        security: "liberties",
        europe: "federal",
        ecology: "transform",
        services: "expand",
        institutions: "parliament",
      },
      leadershipModel: "decentralized",
      organizationPriority: "members",
      measureIds: ["citizen_convention", "public_investment", "climate_contract"],
    },
  },
  {
    id: "coherent_conservative",
    description: "Economically liberal, sovereignist, restrictive and authority-oriented.",
    input: {
      name: "Ordre et initiative",
      shortName: "OI",
      primaryColor: "#315986",
      symbol: "◆",
      answers: {
        pensions: "later",
        taxation: "reduce",
        immigration: "restrict",
        security: "order",
        europe: "sovereign",
        ecology: "production",
        services: "delegate",
        institutions: "executive",
      },
      leadershipModel: "vertical",
      organizationPriority: "officials",
      measureIds: ["tax_simplification", "security_pact", "local_referendum"],
    },
  },
  {
    id: "contradictory_hybrid",
    description:
      "Redistributive and open, but security-oriented, sovereignist, ecological and pro-private services.",
    input: {
      name: "Mouvement des possibles",
      shortName: "MDP",
      primaryColor: "#6b315d",
      symbol: "✦",
      answers: {
        pensions: "earlier",
        taxation: "redistribute",
        immigration: "open",
        security: "order",
        europe: "sovereign",
        ecology: "transform",
        services: "delegate",
        institutions: "parliament",
      },
      leadershipModel: "decentralized",
      organizationPriority: "experts",
      measureIds: ["citizen_convention", "public_investment", "tax_simplification"],
    },
  },
  {
    id: "centrist_default",
    description: "All eight middle answers with balanced leadership and expert priority.",
    input: {
      name: "Compromis civique",
      shortName: "CC",
      primaryColor: "#514b78",
      symbol: "✧",
      answers: {
        pensions: "stable",
        taxation: "target",
        immigration: "controlled",
        security: "balance",
        europe: "reform",
        ecology: "transition",
        services: "modernize",
        institutions: "decentralize",
      },
      leadershipModel: "balanced",
      organizationPriority: "experts",
      measureIds: ["migration_compromise", "european_defense", "work_income"],
    },
  },
];

interface Result {
  profileId: string;
  strategy: Strategy;
  qualified: boolean;
  won: boolean;
  firstRound: number;
  finalScore: number;
  progression: number;
  decisions: number;
  customEvents: number;
  statements: number;
  contradictions: number;
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function aggregate(rows: Result[]) {
  return {
    runs: rows.length,
    qualificationRate: mean(rows.map((row) => Number(row.qualified))),
    winRate: mean(rows.map((row) => Number(row.won))),
    averageFirstRoundScore: mean(rows.map((row) => row.firstRound)),
    averageFinalScore: mean(rows.map((row) => row.finalScore)),
    averageProgression: mean(rows.map((row) => row.progression)),
    averageDecisions: mean(rows.map((row) => row.decisions)),
    averageCustomEvents: mean(rows.map((row) => row.customEvents)),
    averageStatements: mean(rows.map((row) => row.statements)),
    runsWithContradiction: rows.filter((row) => row.contradictions > 0).length,
  };
}

function policyReference(state: GameState, choice: EventChoice): number | undefined {
  const statement = choice.statement;
  if (!statement?.policyTopic || statement.stance === undefined) return undefined;
  const existing = state.policyPositions[statement.policyTopic];
  if (existing) return existing.stance;
  const axisByTopic = {
    economy: "economy",
    fiscality: "economy",
    pensions: "economy",
    public_services: "economy",
    work: "economy",
    security: "authority",
    immigration: "immigration",
    europe: "europe",
    ecology: "ecology",
    institutions: "authority",
    civil_liberties: "authority",
    social_issues: "society",
  } as const;
  return state.parties[state.playerPartyId]?.perceivedIdeology[axisByTopic[statement.policyTopic]];
}

function chooseForStrategy(
  state: GameState,
  event: ReturnType<typeof currentEvent>,
  strategy: Strategy,
  seed: string,
): EventChoice {
  if (strategy === "coherent") {
    return (
      event.choices
        .map((choice) => {
          const reference = policyReference(state, choice);
          const stance = choice.statement?.stance;
          const continuity =
            reference !== undefined && stance !== undefined ? 50 - Math.abs(reference - stance) : 0;
          const strategicBonus = ["policy_commitment", "long_term_strategy", "compromise"].includes(
            choice.strategy ?? "",
          )
            ? 7
            : 0;
          return { choice, score: continuity + strategicBonus };
        })
        .sort(
          (left, right) =>
            right.score - left.score || left.choice.id.localeCompare(right.choice.id),
        )[0]?.choice ?? event.choices[0]!
    );
  }

  const preferred = event.choices.filter((choice) => {
    if (strategy === "prudent")
      return (
        choice.visibleTag === "PRUDENT" ||
        choice.strategy === "long_term_strategy" ||
        choice.strategy === "legal_action" ||
        choice.strategy === "silence"
      );
    if (strategy === "risky")
      return (
        choice.visibleTag === "RISQUÉ" ||
        choice.strategy === "personal_risk" ||
        choice.strategy === "break" ||
        choice.strategy === "exclusion"
      );
    if (strategy === "collective")
      return (
        choice.visibleTag === "RASSEMBLEUR" ||
        choice.strategy === "alliance" ||
        choice.strategy === "grassroots_mobilization" ||
        choice.strategy === "compromise"
      );
    return false;
  });
  const candidates = preferred.length ? preferred : event.choices;
  const index =
    hashSeed(`${seed}:${state.decisionIndex}:${event.id}:${strategy}:custom-choice`) %
    candidates.length;
  return candidates[index] ?? candidates[0]!;
}

const started = performance.now();
const rows: Result[] = [];
for (const profile of profiles) {
  const party = buildCustomParty(profile.input);
  for (let seedIndex = 0; seedIndex < SEEDS; seedIndex += 1) {
    for (const strategy of STRATEGIES) {
      const seed = `audit-custom-${seedIndex}`;
      const method = gameContent.methods[seedIndex % gameContent.methods.length];
      if (!method) throw new Error("Missing campaign method.");
      let state = createGame(
        {
          seed,
          mode: "custom_party",
          partyId: party.id,
          methodId: method.id,
          customParty: party,
        },
        gameContent,
      );
      let guard = 0;
      while (state.phase !== "finished" && guard < 50) {
        const event = currentEvent(state, gameContent.events);
        const choice = chooseForStrategy(state, event, strategy, seed);
        if (!choice) throw new Error(`No choice for ${event.id}.`);
        state = resolveCurrentChoice(state, choice.id, gameContent).state;
        guard += 1;
      }
      if (!state.finalResult || !state.firstRoundResult) {
        throw new Error(`Unfinished custom run: ${profile.id}/${strategy}/${seedIndex}`);
      }
      rows.push({
        profileId: profile.id,
        strategy,
        qualified: state.finalResult.qualified,
        won: state.finalResult.won,
        firstRound: state.firstRoundResult.results.custom_party ?? 0,
        finalScore: state.finalResult.score,
        progression: state.finalResult.pollingProgression,
        decisions: state.decisionIndex,
        customEvents: state.decisionHistory.filter((decision) =>
          decision.eventId.startsWith("custom_"),
        ).length,
        statements: state.statementLedger.length,
        contradictions: state.statementLedger.filter(
          (statement) =>
            statement.evolution === "contradiction" || statement.evolution === "abrupt_reversal",
        ).length,
      });
    }
  }
  console.log(`${profile.id}: ${rows.filter((row) => row.profileId === profile.id).length} runs`);
}

const byProfile = Object.fromEntries(
  profiles.map((profile) => {
    const party = buildCustomParty(profile.input);
    return [
      profile.id,
      {
        description: profile.description,
        ideology: party.ideology,
        baseline: party.baseline,
        strongestElectorateAffinities: Object.entries(party.electorateAffinity)
          .sort((left, right) => right[1] - left[1])
          .slice(0, 3),
        ...aggregate(rows.filter((row) => row.profileId === profile.id)),
      },
    ];
  }),
);
const byProfileAndStrategy = Object.fromEntries(
  profiles.flatMap((profile) =>
    STRATEGIES.map((strategy) => [
      `${profile.id}:${strategy}`,
      aggregate(rows.filter((row) => row.profileId === profile.id && row.strategy === strategy)),
    ]),
  ),
);

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    seedsPerProfile: SEEDS,
    pairedSeedsAcrossProfilesAndStrategies: true,
    strategies: STRATEGIES,
    totalRuns: rows.length,
    command: "npx tsx scripts/audit/custom-party-simulation.ts",
    limitation:
      "Profiles are editorial stress tests, not a representative sample of all possible custom parties.",
  },
  byProfile,
  byProfileAndStrategy,
  performance: {
    durationMs: performance.now() - started,
    runsPerSecond: rows.length / ((performance.now() - started) / 1_000),
  },
};

const root = resolve(import.meta.dirname, "../..");
await mkdir(resolve(root, "audit"), { recursive: true });
await writeFile(
  resolve(root, "audit/custom-party-simulation.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
