import { describe, expect, it, vi } from 'vitest';
import { McpToolError } from '@advance-labs/mcp-core';
import type { GscReport } from '@advance-labs/types';

import { BingKeyResolver, InMemoryBingKeyStore } from '../../auth/bing.js';
import type { BingLike, ClientFactory, GscLike, ToolContext } from '../context.js';
import { engineDivergence } from './handlers.js';

/** A ToolContext with mocked GSC/Bing clients, so `engine_divergence` never hits the network. */
function ctxWithEngines(opts: { gsc?: Partial<GscLike>; bing?: Partial<BingLike> }): ToolContext {
  const gsc: GscLike = {
    query: opts.gsc?.query ?? (async (): Promise<GscReport> => ({ rows: [] })),
    listSites: opts.gsc?.listSites ?? (async () => []),
  };
  const bing: BingLike = {
    listSites: opts.bing?.listSites ?? (async () => []),
    getRankAndTrafficStats: opts.bing?.getRankAndTrafficStats ?? (async () => []),
    getQueryStats: opts.bing?.getQueryStats ?? (async () => []),
    getPageStats: opts.bing?.getPageStats ?? (async () => []),
    getQueryPageStats: opts.bing?.getQueryPageStats ?? (async () => []),
    getPageQueryStats: opts.bing?.getPageQueryStats ?? (async () => []),
    getCrawlStats: opts.bing?.getCrawlStats ?? (async () => []),
    getCrawlIssues: opts.bing?.getCrawlIssues ?? (async () => []),
    getUrlInfo: opts.bing?.getUrlInfo ?? (async () => null as never),
    getUrlSubmissionQuota: opts.bing?.getUrlSubmissionQuota ?? (async () => null as never),
    getKeywordStats: opts.bing?.getKeywordStats ?? (async () => []),
    getRelatedKeywords: opts.bing?.getRelatedKeywords ?? (async () => []),
  };
  const clients: ClientFactory = {
    ga4: vi.fn(),
    gsc: () => gsc,
    bing: () => bing,
  } as never;
  return {
    tokens: { resolveAccessToken: async () => 't' } as ToolContext['tokens'],
    bingKeys: new BingKeyResolver({ store: new InMemoryBingKeyStore(), staticApiKey: 'k' }),
    clients,
    userId: 'u1',
    requestToken: null,
    requestBingKey: null,
  };
}

describe('engineDivergence range guard', () => {
  it('throws for a same-day range, which would split into an inverted empty half', async () => {
    const ctx = ctxWithEngines({});
    await expect(
      engineDivergence(ctx, {
        siteUrl: 'sc-domain:example.com',
        startDate: '2026-01-01',
        endDate: '2026-01-01',
        limit: 100,
        threshold: 0.3,
        minClicks: 50,
      }),
    ).rejects.toThrow(McpToolError);
    await expect(
      engineDivergence(ctx, {
        siteUrl: 'sc-domain:example.com',
        startDate: '2026-01-01',
        endDate: '2026-01-01',
        limit: 100,
        threshold: 0.3,
        minClicks: 50,
      }),
    ).rejects.toThrow(/at least a 2-day range/);
  });

  it('does not throw for a 2-day range', async () => {
    const ctx = ctxWithEngines({});
    const result = await engineDivergence(ctx, {
      siteUrl: 'sc-domain:example.com',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      limit: 100,
      threshold: 0.3,
      minClicks: 50,
    });
    expect(result.isError).toBeFalsy();
  });
});
