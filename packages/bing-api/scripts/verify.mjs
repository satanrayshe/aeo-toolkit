#!/usr/bin/env node
/**
 * Manual, human-run smoke test against the REAL Bing Webmaster API.
 *
 * This never runs in CI — there is no Bing credential in that environment, and
 * this script is not wired into any workflow or test command. Run it by hand
 * (`pnpm --filter @advance-labs/bing-api verify:bing`) when you want to confirm
 * the client still talks to Bing correctly, e.g. after touching `webmaster.ts`
 * or `dates.ts`.
 *
 * Reads `BING_API_KEY` and `BING_VERIFY_SITE` from the environment. Exits
 * non-zero with a clear message naming whichever is missing, before making
 * any request.
 *
 * TWO OPEN QUESTIONS THIS SCRIPT SETTLES, because our fixtures in
 * `packages/bing-api/fixtures/` were written BY HAND from documented field
 * names — they are guesses about Bing's response shape, not real captures:
 *
 *  1. Does `GetQueryStats` return one aggregate row per query, or one row per
 *     (query x date)? This decides whether per-date bucketing of query stats
 *     is even possible. Look at the "query-stats shape" block below:
 *       - `maxRowsForOneQuery === 1` -> one aggregate per query; per-date
 *         bucketing is impossible with this method.
 *       - `maxRowsForOneQuery > 1` with `distinctDates > 1` -> Bing does
 *         return per-(query x date) rows; bucketing is viable.
 *
 *  2. Does `GetPageStats` key the page URL under `Query` or `Url`?
 *     `toPageStats` (`webmaster.ts`) currently guesses with a `||` fallback
 *     across both spellings. The raw `GetPageStats` dump below shows Bing's
 *     actual field name directly, before our normalization gets a chance to
 *     paper over it.
 *
 * Both raw dumps also show Bing's real WCF date strings (e.g.
 * `/Date(1399100400000-0700)/`) as Bing actually sends them, rather than our
 * parsed/mapped interpretation of them.
 */
import { BingWebmasterClient, requestBing, defaultFetcher, BING_API_BASE } from '../dist/index.js';

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value.trim().length === 0) {
    console.error(`verify:bing: missing required environment variable ${name}.`);
    console.error(
      'Set BING_API_KEY (from Bing Webmaster Tools > Settings > API Access) and ' +
        'BING_VERIFY_SITE (a site URL you have verified, e.g. "https://example.com/").',
    );
    process.exit(1);
  }
  return value;
}

const apiKey = requireEnv('BING_API_KEY');
const siteUrl = requireEnv('BING_VERIFY_SITE');

const client = new BingWebmasterClient({ apiKey });

const sites = await client.listSites();
console.log(`listSites(): ${sites.length} site(s). First 3:`);
console.log(JSON.stringify(sites.slice(0, 3), null, 2));

const queries = await client.getQueryStats(siteUrl);
console.log(`\ngetQueryStats(${siteUrl}): ${queries.length} row(s). First 3:`);
console.log(JSON.stringify(queries.slice(0, 3), null, 2));

// --- query-stats shape: settles "one aggregate per query" vs "one row per (query x date)" ---
const distinct = new Set(queries.map((r) => r.query));
const dates = new Set(queries.map((r) => r.date));
console.log(`\nrows=${queries.length} distinctQueries=${distinct.size} distinctDates=${dates.size}`);
console.log(`nullDates=${queries.filter((r) => r.date === null).length}`);
const byQuery = new Map();
for (const r of queries) byQuery.set(r.query, [...(byQuery.get(r.query) ?? []), r]);
const worst = [...byQuery.values()].sort((a, b) => b.length - a.length)[0];
console.log(`maxRowsForOneQuery=${worst?.length ?? 0}`);
console.log(JSON.stringify(worst?.slice(0, 5), null, 2));

// --- raw `d`-unwrapped payloads, BEFORE our normalization, straight from Bing ---
// GetQueryStats: shows Bing's real field names and real WCF date strings.
const rawQueryStats = await requestBing(defaultFetcher(), {
  baseUrl: BING_API_BASE,
  method: 'GetQueryStats',
  apiKey,
  params: { siteUrl },
});
console.log('\nraw GetQueryStats (first 2 rows, unnormalized):');
console.log(JSON.stringify((Array.isArray(rawQueryStats) ? rawQueryStats : []).slice(0, 2), null, 2));

// GetPageStats: settles whether the page URL arrives under `Query` or `Url`.
const rawPageStats = await requestBing(defaultFetcher(), {
  baseUrl: BING_API_BASE,
  method: 'GetPageStats',
  apiKey,
  params: { siteUrl },
});
console.log('\nraw GetPageStats (first 2 rows, unnormalized):');
console.log(JSON.stringify((Array.isArray(rawPageStats) ? rawPageStats : []).slice(0, 2), null, 2));
