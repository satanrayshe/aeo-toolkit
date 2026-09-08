#!/usr/bin/env node
/**
 * Manual, human-run smoke test against the REAL Bing Webmaster API.
 *
 * This never runs in CI — there is no Bing credential in that environment, and
 * this script is not wired into any workflow or test command. Run it by hand
 * (`pnpm --filter @advance-labs/bing-api verify:bing`) when you want to confirm
 * the client still talks to Bing correctly, e.g. after touching `webmaster.ts`
 * or `dates.ts`, or to settle a field-shape question (such as whether
 * `getPageStats` rows key on `Query` or `Url`) against real data rather than
 * assumption.
 *
 * Reads `BING_API_KEY` and `BING_VERIFY_SITE` from the environment. Calls
 * `listSites()` then `getQueryStats(BING_VERIFY_SITE)` and prints the first
 * three rows of each. Exits non-zero with a clear message when either
 * variable is unset, before making any request.
 */
import { BingWebmasterClient } from '../dist/index.js';

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
