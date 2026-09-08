/**
 * Cross-engine tool handlers — the reason Google and Bing share one server.
 *
 * Both engines are fetched with `Promise.allSettled`: a partial answer that names
 * its gap beats no answer, and it beats a complete-looking answer with a zeroed
 * half. Every failure path lands in `coverage`, never in the numbers.
 */
import type { ToolResult } from '@advance-labs/mcp-core';
import { errorMessage } from '@advance-labs/mcp-core';

import { bingFor, gscFor, type ToolContext } from '../context.js';
import { jsonResult } from '../gsc/format.js';
import {
  buildCoverage,
  mergeEngineRows,
  normalizeBingQueries,
  normalizeGscRows,
  type EngineRow,
} from './normalize.js';
import type { CompareEnginesInput } from './schemas.js';

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
  const rows = mergeEngineRows(sides.google.rows, sides.bing.rows).slice(0, input.limit);

  const both = rows.filter((row) => row.google !== null && row.bing !== null).length;
  const summary =
    `${rows.length} queries for ${input.siteUrl} (${input.startDate}..${input.endDate}); ` +
    `${both} present on both engines. ` +
    `Google: ${coverage.google.available ? `${coverage.google.rowCount} rows` : `unavailable (${coverage.google.reason ?? ''})`}. ` +
    `Bing: ${coverage.bing.available ? `${coverage.bing.rowCount} rows` : `unavailable (${coverage.bing.reason ?? ''})`}.`;

  return jsonResult(summary, { siteUrl: input.siteUrl, coverage, rows });
}
