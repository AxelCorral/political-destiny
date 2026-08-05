export function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function softmax(logits: number[]): number[] {
  if (logits.length === 0) return [];
  const finiteLogits = logits.map((logit) => (Number.isFinite(logit) ? logit : -1_000));
  const maxLogit = Math.max(...finiteLogits);
  const exponentials = finiteLogits.map((logit) => Math.exp(Math.max(-700, logit - maxLogit)));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) return logits.map(() => 1 / logits.length);
  return exponentials.map((value) => value / total);
}

export function normalizePercentages(
  rawValues: Record<string, number>,
  decimals = 1,
): Record<string, number> {
  const entries = Object.entries(rawValues);
  if (entries.length === 0) return {};

  const safe = entries.map(
    ([id, value]) => [id, Number.isFinite(value) && value > 0 ? value : 0] as const,
  );
  const total = safe.reduce((sum, [, value]) => sum + value, 0);
  const source = total > 0 ? safe : safe.map(([id]) => [id, 1] as const);
  const sourceTotal = source.reduce((sum, [, value]) => sum + value, 0);
  const unit = 10 ** decimals;
  const targetUnits = 100 * unit;

  const computed = source.map(([id, value]) => {
    const exactUnits = (value / sourceTotal) * targetUnits;
    const flooredUnits = Math.floor(exactUnits);
    return { id, units: flooredUnits, remainder: exactUnits - flooredUnits };
  });

  let missing = targetUnits - computed.reduce((sum, item) => sum + item.units, 0);
  const ranked = [...computed].sort(
    (a, b) => b.remainder - a.remainder || a.id.localeCompare(b.id),
  );
  let index = 0;
  while (missing > 0) {
    const item = ranked[index % ranked.length];
    if (item) item.units += 1;
    missing -= 1;
    index += 1;
  }

  return Object.fromEntries(computed.map(({ id, units }) => [id, units / unit]));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function ideologyDistance(
  left: Record<string, number>,
  right: Record<string, number>,
): number {
  const keys = Object.keys(left).filter((key) => key in right);
  if (keys.length === 0) return 0;
  const meanSquare =
    keys.reduce((sum, key) => {
      const delta = (left[key] ?? 0) - (right[key] ?? 0);
      return sum + delta * delta;
    }, 0) / keys.length;
  return Math.sqrt(meanSquare);
}
