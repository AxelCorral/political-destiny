import type { RngState } from "@/game/types";

const UINT32_RANGE = 4_294_967_296;

export function hashSeed(seed: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

export function createRngState(seed: string): RngState {
  const seedHash = hashSeed(seed || "vers-lelysee");
  return { seedHash, state: seedHash, draws: 0 };
}

export function random(rng: RngState): [number, RngState] {
  const state = (rng.state + 0x6d2b79f5) >>> 0;
  let value = state;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  const result = ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  return [result, { ...rng, state, draws: rng.draws + 1 }];
}

export function randomBetween(rng: RngState, min: number, max: number): [number, RngState] {
  const [roll, nextRng] = random(rng);
  return [min + (max - min) * roll, nextRng];
}

export function randomInt(rng: RngState, min: number, maxInclusive: number): [number, RngState] {
  const [roll, nextRng] = random(rng);
  return [Math.floor(roll * (maxInclusive - min + 1)) + min, nextRng];
}

export function weightedIndex(rng: RngState, weights: number[]): [number, number, RngState] {
  const safeWeights = weights.map((weight) => (Number.isFinite(weight) && weight > 0 ? weight : 0));
  const total = safeWeights.reduce((sum, weight) => sum + weight, 0);
  const [roll, nextRng] = random(rng);

  if (safeWeights.length === 0) return [-1, roll, nextRng];
  if (total <= 0)
    return [Math.min(Math.floor(roll * safeWeights.length), safeWeights.length - 1), roll, nextRng];

  let cursor = roll * total;
  for (let index = 0; index < safeWeights.length; index += 1) {
    cursor -= safeWeights[index] ?? 0;
    if (cursor <= 0) return [index, roll, nextRng];
  }
  return [safeWeights.length - 1, roll, nextRng];
}

export function shuffled<T>(rng: RngState, values: readonly T[]): [T[], RngState] {
  const result = [...values];
  let nextRng = rng;
  for (let index = result.length - 1; index > 0; index -= 1) {
    let swapIndex: number;
    [swapIndex, nextRng] = randomInt(nextRng, 0, index);
    [result[index], result[swapIndex]] = [result[swapIndex] as T, result[index] as T];
  }
  return [result, nextRng];
}

export function deriveStableId(seed: string, prefix: string): string {
  return `${prefix}-${hashSeed(`${prefix}:${seed}`).toString(36).padStart(7, "0")}`;
}
