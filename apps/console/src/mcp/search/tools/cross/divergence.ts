/**
 * Divergence classification — the judgement the whole cross-engine surface exists
 * to make.
 *
 * A page holding on Bing while it drops on Google is a Google ranking problem. A
 * page dropping on both is a content or technical problem. Those two findings send
 * a client's next month of work in opposite directions, and no single-engine
 * connector can tell them apart.
 *
 * `insufficient_data` is checked FIRST and wins over every other classification. A
 * 100% drop from two clicks is noise; classifying it would manufacture a finding,
 * and a manufactured finding is worse than a missing one because it is
 * indistinguishable from a real one downstream.
 *
 * NOT CURRENTLY REGISTERED as a tool. `engine_divergence` (the tool built on this
 * classifier, in `./handlers.ts`) is cut from the server pending a live Bing
 * Webmaster API key, because `GetQueryStats(siteUrl)` takes NO date parameter:
 * `engine_divergence` calls the same fetch twice differing only in dates, Bing
 * returns identical data for both halves, `bingDelta` is identically 0, and
 * `broad`/`bing_specific` become unreachable — every Google decline would report
 * as `google_specific` regardless of what actually happened on Bing. `verify:bing`
 * (`packages/bing-api/scripts/verify.mjs`) prints `maxRowsForOneQuery`, which
 * settles whether Bing's query stats can be bucketed per-date at all; that result
 * is what unblocks re-registering this. This module's classifier logic itself is
 * NOT the defect — the defect is upstream, in what `engineDivergence` feeds it. Do
 * not re-register `engine_divergence` without first reading its own docblock in
 * `./handlers.ts`, which names a second, independent defect that must also be
 * fixed first.
 */

export type DivergenceClass =
  | 'google_specific'
  | 'bing_specific'
  | 'broad'
  | 'insufficient_data';

export interface DivergenceOptions {
  /** Fractional click change that counts as a move. 0.3 == 30%. */
  threshold: number;
  /** Baseline-half clicks below which a row cannot be classified. */
  minClicks: number;
}

/**
 * Fractional change from `baseline` to `current`.
 *
 * @returns `null` from a zero (or negative, or non-finite) baseline — the change is
 * undefined, not infinite.
 */
export function fractionalDelta(baseline: number, current: number): number | null {
  if (!Number.isFinite(baseline) || baseline <= 0) return null;
  return (current - baseline) / baseline;
}

export interface ClassifyInput {
  googleDelta: number | null;
  bingDelta: number | null;
  googleBaseClicks: number;
  bingBaseClicks: number;
}

/** Classify one key's cross-engine movement. */
export function classifyDivergence(
  input: ClassifyInput,
  opts: DivergenceOptions,
): DivergenceClass {
  // Thin data wins over every other verdict. Checked first, deliberately.
  if (
    input.googleDelta === null ||
    input.bingDelta === null ||
    input.googleBaseClicks < opts.minClicks ||
    input.bingBaseClicks < opts.minClicks
  ) {
    return 'insufficient_data';
  }

  const limit = -opts.threshold;
  const googleDropped = input.googleDelta < limit;
  const bingDropped = input.bingDelta < limit;

  if (googleDropped && bingDropped) return 'broad';
  if (googleDropped) return 'google_specific';
  if (bingDropped) return 'bing_specific';
  return 'insufficient_data';
}

/** Plain-language reading of a class, carried in the tool output. */
export const DIVERGENCE_MEANING: Record<DivergenceClass, string> = {
  google_specific:
    'Held on Bing, dropped on Google. Suspect a Google ranking or indexing change ' +
    'rather than the content itself.',
  bing_specific:
    'Held on Google, dropped on Bing. Suspect Bing indexing, or a Bing-specific ' +
    'crawl or verification problem.',
  broad:
    'Dropped on both engines. Suspect the content or a technical problem on the ' +
    'page, not one engine.',
  insufficient_data:
    'Not enough baseline traffic on at least one engine to call this, or neither ' +
    'engine moved past the threshold.',
};
