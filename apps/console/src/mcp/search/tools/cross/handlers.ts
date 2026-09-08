/**
 * Cross-engine tool handlers — the reason Google and Bing share one server.
 *
 * Both engines are fetched with `Promise.allSettled`: a partial answer that names
 * its gap beats no answer, and it beats a complete-looking answer with a zeroed
 * half. Every failure path lands in `coverage`, never in the numbers.
 */
import type { ToolResult } from '@advance-labs/mcp-core';
import { errorMessage, McpToolError } from '@advance-labs/mcp-core';

import { bingFor, gscFor, type ToolContext } from '../context.js';
import { jsonResult } from '../gsc/format.js';
import {
  classifyDivergence,
  DIVERGENCE_MEANING,
  fractionalDelta,
  type DivergenceClass,
} from './divergence.js';
import {
  buildCoverage,
  mergeEngineRows,
  normalizeBingQueries,
  normalizeGscRows,
  type EngineRow,
} from './normalize.js';
import type { CompareEnginesInput, EngineDivergenceInput } from './schemas.js';

/** Fetch both engines' query rows, never throwing when one side fails. */
export async function fetchBothEngines(
  ctx: ToolContext,
  input: CompareEnginesInput,
): Promise<{
  google: { rows: EngineRow[] | null; error: string | null };
  bing: { rows: EngineRow[] | null; error: string | null };
}> {
  const bingSite = input.bingSiteUrl ?? input.siteUrl;

  const [googleResult, bingResult] = await Promise.allSettled([
    (async (): Promise<EngineRow[]> => {
      const gsc = await gscFor(ctx);
      const response = await gsc.query({
        siteUrl: input.siteUrl,
        startDate: input.startDate,
        endDate: input.endDate,
        dimensions: ['query'],
        rowLimit: input.limit,
      });
      return normalizeGscRows(response.rows);
    })(),
    (async (): Promise<EngineRow[]> => {
      const bing = await bingFor(ctx);
      return normalizeBingQueries(await bing.getQueryStats(bingSite));
    })(),
  ]);

  return {
    google:
      googleResult.status === 'fulfilled'
        ? { rows: googleResult.value, error: null }
        : { rows: null, error: errorMessage(googleResult.reason) },
    bing:
      bingResult.status === 'fulfilled'
        ? { rows: bingResult.value, error: null }
        : { rows: null, error: errorMessage(bingResult.reason) },
  };
}

/** `compare_engines(...)` — both engines side by side, with an explicit coverage block. */
export async function compareEngines(
  ctx: ToolContext,
  input: CompareEnginesInput,
): Promise<ToolResult> {
  const sides = await fetchBothEngines(ctx, input);
  const coverage = buildCoverage(sides);
  const merged = mergeEngineRows(sides.google.rows, sides.bing.rows);

  // Combined clicks across whichever engines actually answered for this key — a
  // missing engine contributes nothing to the sort key, it is never scored as a
  // zero-click engine. Sorted DESCENDING before slicing so a high-traffic
  // Bing-only row cannot be silently dropped by insertion order while a
  // low-traffic Google row survives merely for coming first.
  const combinedClicks = (row: (typeof merged)[number]): number =>
    (row.google?.clicks ?? 0) + (row.bing?.clicks ?? 0);
  const sorted = [...merged].sort((a, b) => combinedClicks(b) - combinedClicks(a));

  // Computed from the FULL merged set, before truncation — the summary must
  // describe the data, not the slice.
  const bothTotal = sorted.filter((row) => row.google !== null && row.bing !== null).length;
  const rows = sorted.slice(0, input.limit);

  const summary =
    `${rows.length} of ${sorted.length} merged queries for ${input.siteUrl}, sorted by ` +
    `combined clicks descending ` +
    `(Google ${input.startDate}..${input.endDate}; Bing: unwindowed API aggregate); ` +
    `${bothTotal} of ${sorted.length} present on both engines. ` +
    `Google: ${coverage.google.available ? `${coverage.google.rowCount} rows` : `unavailable (${coverage.google.reason ?? ''})`}. ` +
    `Bing: ${coverage.bing.available ? `${coverage.bing.rowCount} rows` : `unavailable (${coverage.bing.reason ?? ''})`}.`;

  return jsonResult(summary, { siteUrl: input.siteUrl, coverage, rows });
}

/** Inclusive day span of a `YYYY-MM-DD` date range. */
function daySpan(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Split a date range into a baseline half and a current half. */
function halves(startDate: string, endDate: string): {
  baseline: { startDate: string; endDate: string };
  current: { startDate: string; endDate: string };
} {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  const mid = new Date(start + Math.floor((end - start) / 2));
  const midDate = mid.toISOString().slice(0, 10);
  const dayAfterMid = new Date(mid.getTime() + 86_400_000).toISOString().slice(0, 10);
  return {
    baseline: { startDate, endDate: midDate },
    current: { startDate: dayAfterMid, endDate },
  };
}

/**
 * `engine_divergence(...)` — where the two engines disagree, and what that means.
 *
 * Runs `compare_engines`' fetch twice, once per half of the range, then classifies
 * every key. Rows classified `insufficient_data` are counted but not listed: they
 * are the majority of any long tail, and listing them buries the real findings.
 */
export async function engineDivergence(
  ctx: ToolContext,
  input: EngineDivergenceInput,
): Promise<ToolResult> {
  const span = daySpan(input.startDate, input.endDate);
  if (span < 2) {
    throw new McpToolError(
      `engine_divergence needs at least a 2-day range because it compares the first half ` +
        `against the second; received ${input.startDate}..${input.endDate} (${span} day` +
        `${span === 1 ? '' : 's'}).`,
      'engine_divergence_range_too_short',
    );
  }

  const { baseline, current } = halves(input.startDate, input.endDate);

  const [baseSides, currentSides] = await Promise.all([
    fetchBothEngines(ctx, { ...input, ...baseline }),
    fetchBothEngines(ctx, { ...input, ...current }),
  ]);

  const coverage = buildCoverage(currentSides);

  const index = (rows: EngineRow[] | null): Map<string, EngineRow> =>
    new Map((rows ?? []).map((row) => [row.key, row]));

  const baseGoogle = index(baseSides.google.rows);
  const baseBing = index(baseSides.bing.rows);
  const nowGoogle = index(currentSides.google.rows);
  const nowBing = index(currentSides.bing.rows);

  const keys = new Set<string>([...baseGoogle.keys(), ...baseBing.keys()]);

  const counts: Record<DivergenceClass, number> = {
    google_specific: 0,
    bing_specific: 0,
    broad: 0,
    insufficient_data: 0,
  };
  const findings: {
    key: string;
    classification: DivergenceClass;
    meaning: string;
    google: { baselineClicks: number; currentClicks: number; delta: number | null };
    bing: { baselineClicks: number; currentClicks: number; delta: number | null };
  }[] = [];

  for (const key of keys) {
    const gBase = baseGoogle.get(key)?.clicks ?? 0;
    const gNow = nowGoogle.get(key)?.clicks ?? 0;
    const bBase = baseBing.get(key)?.clicks ?? 0;
    const bNow = nowBing.get(key)?.clicks ?? 0;

    const googleDelta = fractionalDelta(gBase, gNow);
    const bingDelta = fractionalDelta(bBase, bNow);

    const classification = classifyDivergence(
      { googleDelta, bingDelta, googleBaseClicks: gBase, bingBaseClicks: bBase },
      { threshold: input.threshold, minClicks: input.minClicks },
    );
    counts[classification] += 1;

    if (classification === 'insufficient_data') continue;

    findings.push({
      key,
      classification,
      meaning: DIVERGENCE_MEANING[classification],
      google: { baselineClicks: gBase, currentClicks: gNow, delta: googleDelta },
      bing: { baselineClicks: bBase, currentClicks: bNow, delta: bingDelta },
    });
  }

  findings.sort((a, b) => (a.google.delta ?? 0) - (b.google.delta ?? 0));
  const listed = findings.slice(0, input.limit);

  const summary =
    `${listed.length} diverging queries for ${input.siteUrl}: ` +
    `${counts.google_specific} Google-specific, ${counts.bing_specific} Bing-specific, ` +
    `${counts.broad} broad. ${counts.insufficient_data} excluded as insufficient data ` +
    `(baseline under ${input.minClicks} clicks on an engine, or no move past ` +
    `${Math.round(input.threshold * 100)}%).`;

  return jsonResult(summary, {
    siteUrl: input.siteUrl,
    baseline,
    current,
    threshold: input.threshold,
    minClicks: input.minClicks,
    counts,
    coverage,
    findings: listed,
  });
}
