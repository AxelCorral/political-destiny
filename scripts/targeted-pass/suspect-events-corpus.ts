/**
 * TARGETED_GAMEPLAY_PASS_REPORT.md, Phase F (§11) — reinforced statistical
 * corpus for the four low-occurrence "suspect" events flagged in
 * FUN_IMPROVEMENTS_REPORT.md: party_horizons_founder_blessing (n=14),
 * party_horizons_founder_revenge (n=27), party_renaissance_legacy_credited
 * (n=7), rare_blackout_leak_resurfaces (n=6).
 *
 * Method (per the mission's explicit constraint): never hardcode the
 * trigger event's own draw, never change production probabilities. Only the
 * decision POLICY at each event's real, existing branching choice is
 * steered (e.g. always answering "defer to the founder" when
 * party_horizons_founder_challenge naturally appears) -- across many more
 * seeds/agents than the standard audit corpus, then filtered to runs where
 * the target event was naturally reached. Real engine only.
 *
 * Usage: npx tsx scripts/targeted-pass/suspect-events-corpus.ts [--n=600]
 */
import { gameContent } from "../../src/game/data/index";
import {
  createGame,
  currentEvent,
  resolveCurrentChoice,
  validateGameState,
} from "../../src/game/engine/index";
import { AGENT_NAMES, pickChoice, type AgentName } from "../audit-post/lib/agents";
import type { GameState } from "../../src/game/types/index";

const args = process.argv.slice(2);
const nArg = args.find((a) => a.startsWith("--n="));
const RUNS_PER_TARGET = nArg ? Number.parseInt(nArg.split("=")[1]!, 10) : 600;

function wilson95(successes: number, n: number): [number, number] {
  if (n === 0) return [0, 0];
  const z = 1.96;
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [
    Number((Math.max(0, (center - margin) / denom) * 100).toFixed(1)),
    Number((Math.min(1, (center + margin) / denom) * 100).toFixed(1)),
  ];
}

interface Target {
  name: string;
  partyId: string | null; // null = any party (generic rare content)
  steer: (state: GameState, event: ReturnType<typeof currentEvent>) => string | null;
  targetEventId: string;
}

const targets: Target[] = [
  {
    name: "party_horizons_founder_blessing",
    partyId: "horizons",
    targetEventId: "party_horizons_founder_blessing",
    steer: (_state, event) => {
      if (event.id === "party_horizons_founder_challenge") return "horizons_founder_defer";
      return null;
    },
  },
  {
    name: "party_horizons_founder_revenge",
    partyId: "horizons",
    targetEventId: "party_horizons_founder_revenge",
    steer: (_state, event) => {
      if (event.id === "party_horizons_founder_challenge") return "horizons_founder_break_free";
      return null;
    },
  },
  {
    name: "party_renaissance_legacy_credited",
    partyId: "renaissance",
    targetEventId: "party_renaissance_legacy_credited",
    steer: (_state, event) => {
      if (event.id === "party_renaissance_legacy_test") return "renaissance_legacy_own_gaps";
      return null;
    },
  },
  {
    name: "rare_blackout_leak_resurfaces",
    partyId: null,
    targetEventId: "rare_blackout_leak_resurfaces",
    steer: (_state, event) => {
      if (event.id === "rare_debate_blackout") return "blackout_keep_rehearsal_private_reversed";
      return null;
    },
  },
];

// The blackout trigger's actual choice id that sets blackout_rehearsal_leaked
// is looked up dynamically below rather than hardcoded twice.

function playSteered(
  seed: string,
  partyId: string,
  agent: AgentName,
  steer: Target["steer"],
): GameState {
  const method = gameContent.methods[0]!;
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const steeredId = steer(state, event);
    const choice = steeredId
      ? (event.choices.find((c) => c.id === steeredId) ?? pickChoice(state, event, agent, seed))
      : pickChoice(state, event, agent, seed);
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  return state;
}

// Resolve the real "leak" choice id from production data instead of guessing.
const blackoutTrigger = gameContent.events.find((e) => e.id === "rare_debate_blackout");
const leakChoice = blackoutTrigger?.choices.find((c) =>
  c.outcomeGroups.some((g) => g.setFlags?.blackout_rehearsal_leaked === true),
);
if (leakChoice) {
  targets[3]!.steer = (_state, event) =>
    event.id === "rare_debate_blackout" ? leakChoice.id : null;
}

const partiesToSample = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);

const results: Record<
  string,
  {
    occurrences: number;
    runsSampled: number;
    choiceCounts: Record<string, number>;
  }
> = {};

for (const target of targets) {
  const choiceCounts: Record<string, number> = {};
  let occurrences = 0;
  let runsSampled = 0;
  const parties = target.partyId ? [target.partyId] : partiesToSample;
  const perParty = Math.ceil(RUNS_PER_TARGET / parties.length);

  for (const partyId of parties) {
    for (let i = 0; i < perParty; i += 1) {
      const agent = AGENT_NAMES[i % AGENT_NAMES.length]!;
      const seed = `suspect-${target.name}-${partyId}-${i}`;
      const state = playSteered(seed, partyId, agent, target.steer);
      if (state.phase !== "finished" || !validateGameState(state).valid) continue;
      runsSampled += 1;
      const record = state.decisionHistory.find((d) => d.eventId === target.targetEventId);
      if (!record) continue;
      occurrences += 1;
      choiceCounts[record.choiceId] = (choiceCounts[record.choiceId] ?? 0) + 1;
    }
  }
  results[target.name] = { occurrences, runsSampled, choiceCounts };
}

const summary = Object.entries(results).map(([name, r]) => {
  const total = r.occurrences;
  const entries = Object.entries(r.choiceCounts).sort((a, b) => b[1] - a[1]);
  const [topChoice, topCount] = entries[0] ?? ["(aucune occurrence)", 0];
  const share = total ? topCount / total : 0;
  const [ciLow, ciHigh] = wilson95(topCount, total);
  return {
    event: name,
    runsSampled: r.runsSampled,
    occurrences: total,
    dominantChoice: topChoice,
    dominantSharePct: Number((share * 100).toFixed(1)),
    ci95: [ciLow, ciHigh],
    allChoices: Object.fromEntries(entries),
  };
});

console.log(JSON.stringify(summary, null, 2));
