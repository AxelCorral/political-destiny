import { clamp, round } from "./math";

export interface ProgressionInputs {
  /** First-round poll/result share the party started the campaign with. */
  startingPolling: number;
  /** First-round vote share actually obtained. */
  firstRoundShare: number;
  /** Structural ceiling the party could realistically reach with an ideal campaign. */
  potentialSupport: number;
}

export interface ProgressionMetrics {
  /** Raw delta in points, kept for factual display (e.g. "+4.2 points"). */
  raw: number;
  /**
   * Signed, dimensionless share of the party's *achievable* movement that the
   * campaign actually captured: positive gains are scaled by the upside
   * margin (potentialSupport - startingPolling), negative ones by the
   * downside margin (startingPolling itself, since a party cannot poll below
   * zero). This makes campaigns comparable across parties with very
   * different starting points and ceilings, instead of measuring everyone on
   * the same raw-point scale regardless of how much room they structurally
   * had to move. Clamped to [-2, 2] so a single pathological run can't
   * dominate a variance decomposition; realistic runs stay well inside
   * [-1, 1.2].
   */
  normalized: number;
}

/** Floor for both margins so a party starting at (or ceiled at) ~0 doesn't divide by a near-zero denominator. */
const MIN_MARGIN = 2;

export function computeProgressionMetrics(inputs: ProgressionInputs): ProgressionMetrics {
  const raw = inputs.firstRoundShare - inputs.startingPolling;
  const marginUp = Math.max(inputs.potentialSupport - inputs.startingPolling, MIN_MARGIN);
  const marginDown = Math.max(inputs.startingPolling, MIN_MARGIN);
  const margin = raw >= 0 ? marginUp : marginDown;
  return {
    raw: round(raw, 1),
    normalized: round(clamp(raw / margin, -2, 2), 3),
  };
}
