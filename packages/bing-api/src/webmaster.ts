/**
 * Read-only client for the Bing Webmaster Tools JSON API.
 *
 * Every method is a thin mapper: `requestBing` handles auth, the `d` envelope,
 * and error normalization; `parseWcfDate` handles Bing's date format. No method
 * on this class mutates anything — the twenty-six write methods on IWebmasterApi
 * are deliberately absent, and a test asserts no method name implies a write.
 */
import { parseWcfDate } from './dates.js';
import {
  asNumber,
  asRecord,
  asRecordArray,
  asString,
  defaultFetcher,
  requestBing,
  type Fetcher,
} from './http.js';
import type {
  BingCrawlIssue,
  BingCrawlPoint,
  BingKeywordStat,
  BingPageStat,
  BingQuota,
  BingQueryStat,
  BingSite,
  BingTrafficPoint,
  BingUrlInfo,
} from './types.js';

export const BING_API_BASE = 'https://ssl.bing.com/webmaster/api.svc/json/';

export interface BingWebmasterClientOptions {
  apiKey: string;
  /** Override for tests or a proxy. Defaults to {@link BING_API_BASE}. */
  baseUrl?: string;
  fetcher?: Fetcher;
}

/** Convert a required WCF date field to ISO 8601, throwing if absent or malformed. */
function isoDate(row: Record<string, unknown>, field: string): string {
  return parseWcfDate(asString(row[field])).toISOString();
}

/** Convert an optional WCF date field to ISO 8601, or `null` when Bing omitted it. */
function isoDateOrNull(row: Record<string, unknown>, field: string): string | null {
  const raw = row[field];
  if (raw === undefined || raw === null || raw === '') return null;
  return parseWcfDate(asString(raw)).toISOString();
}

export class BingWebmasterClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetcher: Fetcher;

  constructor(opts: BingWebmasterClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? BING_API_BASE;
    this.fetcher = opts.fetcher ?? defaultFetcher();
  }

  private call(
    method: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<unknown> {
    return requestBing(this.fetcher, {
      baseUrl: this.baseUrl,
      method,
      apiKey: this.apiKey,
      ...(params !== undefined ? { params } : {}),
    });
  }

  async listSites(): Promise<BingSite[]> {
    const rows = asRecordArray(await this.call('GetUserSites'));
    return rows.map((row) => ({
      url: asString(row['Url']),
      isVerified: row['IsVerified'] === true,
    }));
  }

  async getRankAndTrafficStats(siteUrl: string): Promise<BingTrafficPoint[]> {
    const rows = asRecordArray(await this.call('GetRankAndTrafficStats', { siteUrl }));
    return rows.map((row) => ({
      date: isoDate(row, 'Date'),
      clicks: asNumber(row['Clicks']),
      impressions: asNumber(row['Impressions']),
    }));
  }

  async getQueryStats(siteUrl: string): Promise<BingQueryStat[]> {
    return toQueryStats(asRecordArray(await this.call('GetQueryStats', { siteUrl })));
  }

  async getPageStats(siteUrl: string): Promise<BingPageStat[]> {
    return toPageStats(asRecordArray(await this.call('GetPageStats', { siteUrl })));
  }

  /** Pages that served a given query. */
  async getQueryPageStats(siteUrl: string, query: string): Promise<BingPageStat[]> {
    return toPageStats(asRecordArray(await this.call('GetQueryPageStats', { siteUrl, query })));
  }

  /** Queries that a given page served. */
  async getPageQueryStats(siteUrl: string, page: string): Promise<BingQueryStat[]> {
    return toQueryStats(asRecordArray(await this.call('GetPageQueryStats', { siteUrl, page })));
  }

  async getCrawlStats(siteUrl: string): Promise<BingCrawlPoint[]> {
    const rows = asRecordArray(await this.call('GetCrawlStats', { siteUrl }));
    return rows.map((row) => ({
      date: isoDate(row, 'Date'),
      crawledPages: asNumber(row['CrawledPages']),
      inIndex: asNumber(row['InIndex']),
      inLinks: asNumber(row['InLinks']),
      blockedByRobotsTxt: asNumber(row['BlockedByRobotsTxt']),
      codes4xx: asNumber(row['Code4xx']),
      codes5xx: asNumber(row['Code5xx']),
    }));
  }

  async getCrawlIssues(siteUrl: string): Promise<BingCrawlIssue[]> {
    const rows = asRecordArray(await this.call('GetCrawlIssues', { siteUrl }));
    return rows.map((row) => ({
      url: asString(row['Url']),
      issues: asNumber(row['Issues']),
    }));
  }

  async getUrlInfo(siteUrl: string, url: string): Promise<BingUrlInfo> {
    const row = asRecord(await this.call('GetUrlInfo', { siteUrl, url }));
    return {
      url: asString(row['Url']) || url,
      discoveredDate: isoDateOrNull(row, 'DiscoveryDate'),
      documentSize: asNumber(row['DocumentSize']),
      httpStatus: asNumber(row['HttpStatus']),
      isPageIndexed: row['IsPageIndexed'] === true,
      lastCrawledDate: isoDateOrNull(row, 'LastCrawledDate'),
    };
  }

  async getUrlSubmissionQuota(siteUrl: string): Promise<BingQuota> {
    const row = asRecord(await this.call('GetUrlSubmissionQuota', { siteUrl }));
    return {
      dailyQuota: asNumber(row['DailyQuota']),
      monthlyQuota: asNumber(row['MonthlyQuota']),
    };
  }

  async getKeywordStats(
    query: string,
    country?: string,
    language?: string,
  ): Promise<BingKeywordStat[]> {
    return toKeywordStats(
      asRecordArray(await this.call('GetKeywordStats', { q: query, country, language })),
    );
  }

  async getRelatedKeywords(
    query: string,
    country?: string,
    language?: string,
  ): Promise<BingKeywordStat[]> {
    return toKeywordStats(
      asRecordArray(await this.call('GetRelatedKeywords', { q: query, country, language })),
    );
  }
}

/**
 * Bing's position sentinel, normalized away at the client boundary.
 *
 * A zero-click row carries `AvgClickPosition: -1` — verified live on 2026-09-09
 * against `GetQueryStats`, `GetPageStats` and `GetQueryPageStats`, where every
 * row with `Clicks: 0` had `-1`. `-1` is not a position: a real SERP position is
 * always >= 1. Passed through as a number it reads to a consuming agent as a
 * genuine ranking, which is the failure this normalization exists to prevent.
 *
 * Applied to BOTH position fields, not just the click one: the same `>= 1` truth
 * holds for impression position, and a sentinel that only some fields normalize
 * is worse than one no field normalizes.
 */
function positionOrNull(value: unknown): number | null {
  const n = asNumber(value);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

function toQueryStats(rows: Record<string, unknown>[]): BingQueryStat[] {
  return rows.map((row) => ({
    query: asString(row['Query']),
    clicks: asNumber(row['Clicks']),
    impressions: asNumber(row['Impressions']),
    avgClickPosition: positionOrNull(row['AvgClickPosition']),
    avgImpressionPosition: positionOrNull(row['AvgImpressionPosition']),
    date: isoDateOrNull(row, 'Date'),
  }));
}

function toPageStats(rows: Record<string, unknown>[]): BingPageStat[] {
  return rows.map((row) => ({
    // CONFIRMED live 2026-09-09: Bing carries the page URL under `Query`, for
    // both `GetPageStats` and `GetQueryPageStats`. Both reuse the QueryStats
    // wire type verbatim (`__type: "QueryStats:#Microsoft.Bing.Webmaster.Api"`)
    // and neither emits a `Url` field at all. The previous `|| asString(row['Url'])`
    // fallback was a guess covering a spelling Bing never sends; it is removed
    // rather than kept as dead defence, so that a future shape change fails
    // visibly instead of silently resolving to an empty page key.
    page: asString(row['Query']),
    clicks: asNumber(row['Clicks']),
    impressions: asNumber(row['Impressions']),
    avgClickPosition: positionOrNull(row['AvgClickPosition']),
    avgImpressionPosition: positionOrNull(row['AvgImpressionPosition']),
  }));
}

function toKeywordStats(rows: Record<string, unknown>[]): BingKeywordStat[] {
  return rows.map((row) => ({
    query: asString(row['Query']),
    impressions: asNumber(row['Impressions']),
    broadImpressions: asNumber(row['BroadImpressions']),
  }));
}
