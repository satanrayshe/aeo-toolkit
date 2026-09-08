/** Row types for the twelve read-only Bing Webmaster Tools JSON API methods. */

/** From `GetUserSites`. */
export interface BingSite {
  url: string;
  isVerified: boolean;
}

/** From `GetRankAndTrafficStats`. */
export interface BingTrafficPoint {
  date: string;
  clicks: number;
  impressions: number;
}

/** From `GetQueryStats` and `GetPageQueryStats`. */
export interface BingQueryStat {
  query: string;
  clicks: number;
  impressions: number;
  avgClickPosition: number;
  avgImpressionPosition: number;
  date: string | null;
}

/** From `GetPageStats` and `GetQueryPageStats`. */
export interface BingPageStat {
  page: string;
  clicks: number;
  impressions: number;
  avgClickPosition: number;
  avgImpressionPosition: number;
}

/** From `GetCrawlStats`. */
export interface BingCrawlPoint {
  date: string;
  crawledPages: number;
  inIndex: number;
  inLinks: number;
  blockedByRobotsTxt: number;
  codes4xx: number;
  codes5xx: number;
}

/** From `GetCrawlIssues`. */
export interface BingCrawlIssue {
  url: string;
  issues: number;
}

/** From `GetUrlInfo`. */
export interface BingUrlInfo {
  url: string;
  discoveredDate: string | null;
  documentSize: number;
  httpStatus: number;
  isPageIndexed: boolean;
  lastCrawledDate: string | null;
}

/** From `GetUrlSubmissionQuota`. */
export interface BingQuota {
  dailyQuota: number;
  monthlyQuota: number;
}

/** From `GetKeywordStats` and `GetRelatedKeywords`. */
export interface BingKeywordStat {
  query: string;
  impressions: number;
  broadImpressions: number;
}
