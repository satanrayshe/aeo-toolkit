/**
 * Shared row shape for cross-engine comparison, plus the honesty layer.
 *
 * Two rules this module exists to enforce:
 *
 *  1. ZERO-FILL IS BANNED. A missing engine value is `null` with a reason in
 *     `coverage`, never `0`. A zero-filled Bing row reads as "Bing sent no
 *     traffic" when the truth is "we could not ask" — the exact error that makes
 *     an agent confidently recommend the wrong fix.
 *
 *  2. THE POSITION MAPPING IS DISCLOSED. GSC reports one `position`; Bing reports
 *     both AvgClickPosition and AvgImpressionPosition. We map Bing's
 *     AvgImpressionPosition onto the shared field because that is what GSC's
 *     `position` measures — and we say so in `coverage.notes` so a reading agent
 *     can see the choice was made rather than assume the numbers are natively
 *     comparable.
 */
import type { BingQueryStat } from '@advance-labs/bing-api';
import type { GscRow } from '@advance-labs/types';

export type EngineName = 'google' | 'bing';

/** One engine's numbers for one key (a query or a page). */
export interface EngineRow {
  key: string;
  clicks: number;
  impressions: number;
  /** `null` when impressions are zero — not 0, which would read as "nobody clicked". */
  ctr: number | null;
  /** `null` when the engine reported no usable position. */
  position: number | null;
}

export interface EngineCoverage {
  available: boolean;
  rowCount: number;
  /** Populated only when `available` is false. */
  reason: string | null;
}

export interface Coverage {
  google: EngineCoverage;
  bing: EngineCoverage;
  notes: string[];
}

export interface MergedRow {
  key: string;
  google: EngineRow | null;
  bing: EngineRow | null;
}

export const POSITION_MAPPING_NOTE =
  "Bing's AvgImpressionPosition is mapped onto `position` because that is what " +
  "Google's `position` measures. Bing's AvgClickPosition is a different metric and " +
  'is not represented in this comparison.';

/** Clicks over impressions, or `null` when there were no impressions. */
function ratio(clicks: number, impressions: number): number | null {
  return impressions > 0 ? clicks / impressions : null;
}

/** Bing reports 0 for "no position data"; a real position is always >= 1. */
function usablePosition(value: number): number | null {
  return Number.isFinite(value) && value >= 1 ? value : null;
}

/** Normalize Bing query rows onto the shared shape. */
export function normalizeBingQueries(rows: BingQueryStat[]): EngineRow[] {
  return rows.map((row) => ({
    key: row.query,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: ratio(row.clicks, row.impressions),
    position: usablePosition(row.avgImpressionPosition),
  }));
}

/**
 * Normalize Google Search Console rows onto the shared shape.
 *
 * `ctr` is recomputed from clicks/impressions rather than read off `row.ctr`:
 * Google supplies `0` for zero impressions, and Rule 1 requires `null` there.
 */
export function normalizeGscRows(rows: GscRow[]): EngineRow[] {
  return rows.map((row) => ({
    key: row.keys[0] ?? '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: ratio(row.clicks, row.impressions),
    position: usablePosition(row.position),
  }));
}

/**
 * Outer-join two engines' rows by key.
 *
 * An engine with no row for a key contributes `null`, never a zeroed row.
 * A wholly absent engine (`null` rows) contributes `null` for every key.
 */
export function mergeEngineRows(
  google: EngineRow[] | null,
  bing: EngineRow[] | null,
): MergedRow[] {
  const googleByKey = new Map((google ?? []).map((row) => [row.key, row]));
  const bingByKey = new Map((bing ?? []).map((row) => [row.key, row]));

  const keys = new Set<string>([...googleByKey.keys(), ...bingByKey.keys()]);
  const merged: MergedRow[] = [];
  for (const key of keys) {
    merged.push({
      key,
      google: googleByKey.get(key) ?? null,
      bing: bingByKey.get(key) ?? null,
    });
  }
  return merged;
}

/** Build the coverage block that states what each engine did and did not supply. */
export function buildCoverage(opts: {
  google: { rows: EngineRow[] | null; error: string | null };
  bing: { rows: EngineRow[] | null; error: string | null };
}): Coverage {
  const describe = (side: { rows: EngineRow[] | null; error: string | null }): EngineCoverage =>
    side.rows === null
      ? { available: false, rowCount: 0, reason: side.error ?? 'engine returned no data' }
      : { available: true, rowCount: side.rows.length, reason: null };

  const notes: string[] = [];
  if (opts.bing.rows !== null) notes.push(POSITION_MAPPING_NOTE);

  return { google: describe(opts.google), bing: describe(opts.bing), notes };
}
