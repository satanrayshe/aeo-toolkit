/**
 * Bing Webmaster tool handlers. Each takes a ToolContext plus validated args and
 * returns an MCP ToolResult. They orchestrate the injected `@advance-labs/bing-api`
 * client and perform no I/O of their own, so they unit-test with a mocked factory.
 *
 * Both position fields are passed through untouched. Deciding which one is
 * comparable to GSC's single `position` is the cross-engine layer's job, and doing
 * it here would bake the choice in where no caller can see it.
 */
import type { ToolResult } from '@advance-labs/mcp-core';

import { bingFor, type ToolContext } from '../context.js';
import { jsonResult } from '../gsc/format.js';
import type { BingSiteInput } from './schemas.js';

/** `list_bing_sites()` — sites the resolved API key can access. */
export async function listBingSites(ctx: ToolContext): Promise<ToolResult> {
  const bing = await bingFor(ctx);
  const sites = await bing.listSites();
  return jsonResult(`Found ${sites.length} Bing Webmaster sites.`, { sites });
}

/** `bing_traffic_stats({ siteUrl, limit })` — the daily clicks/impressions series. */
export async function bingTrafficStats(
  ctx: ToolContext,
  input: BingSiteInput,
): Promise<ToolResult> {
  const bing = await bingFor(ctx);
  const series = await bing.getRankAndTrafficStats(input.siteUrl);
  const totals = series.reduce(
    (acc, point) => ({
      clicks: acc.clicks + point.clicks,
      impressions: acc.impressions + point.impressions,
    }),
    { clicks: 0, impressions: 0 },
  );
  const rows = series.slice(-input.limit);
  return jsonResult(
    `Bing traffic for ${input.siteUrl}: ${totals.clicks} clicks, ` +
      `${totals.impressions} impressions across ${series.length} days.`,
    { siteUrl: input.siteUrl, totals, days: series.length, series: rows },
  );
}

/** `bing_top_queries({ siteUrl, limit })`. */
export async function bingTopQueries(
  ctx: ToolContext,
  input: BingSiteInput,
): Promise<ToolResult> {
  const bing = await bingFor(ctx);
  const all = await bing.getQueryStats(input.siteUrl);
  const queries = [...all].sort((a, b) => b.clicks - a.clicks).slice(0, input.limit);
  return jsonResult(
    `Top ${queries.length} Bing queries for ${input.siteUrl} (of ${all.length}).`,
    { siteUrl: input.siteUrl, total: all.length, queries },
  );
}

/** `bing_top_pages({ siteUrl, limit })`. */
export async function bingTopPages(
  ctx: ToolContext,
  input: BingSiteInput,
): Promise<ToolResult> {
  const bing = await bingFor(ctx);
  const all = await bing.getPageStats(input.siteUrl);
  const pages = [...all].sort((a, b) => b.clicks - a.clicks).slice(0, input.limit);
  return jsonResult(
    `Top ${pages.length} Bing pages for ${input.siteUrl} (of ${all.length}).`,
    { siteUrl: input.siteUrl, total: all.length, pages },
  );
}
