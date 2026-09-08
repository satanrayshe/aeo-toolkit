import { describe, expect, it, vi } from 'vitest';
import { BingKeyResolver, InMemoryBingKeyStore } from '../../auth/bing.js';
import type { BingLike, ToolContext } from '../context.js';
import { bingTopQueries, bingTrafficStats, listBingSites } from './handlers.js';

function ctxWithBing(bing: Partial<BingLike>): ToolContext {
  return {
    tokens: { resolveAccessToken: async () => 't' } as ToolContext['tokens'],
    bingKeys: new BingKeyResolver({ store: new InMemoryBingKeyStore(), staticApiKey: 'k' }),
    clients: { ga4: vi.fn(), gsc: vi.fn(), bing: () => bing as BingLike } as never,
    userId: 'u1',
    requestToken: null,
    requestBingKey: null,
  };
}

function payload(result: { content: { text: string }[]; structuredContent: Record<string, unknown> }): Record<string, unknown> {
  return result.structuredContent;
}

describe('listBingSites', () => {
  it('returns the sites the key can see', async () => {
    const ctx = ctxWithBing({
      listSites: async () => [{ url: 'https://example.com/', isVerified: true }],
    });
    const out = payload(await listBingSites(ctx) as never);
    expect(out['sites']).toEqual([{ url: 'https://example.com/', isVerified: true }]);
  });

  it('surfaces the missing-credential error rather than an empty list', async () => {
    const ctx = ctxWithBing({});
    ctx.bingKeys = new BingKeyResolver({
      store: new InMemoryBingKeyStore(),
      staticApiKey: null,
    });
    await expect(listBingSites(ctx)).rejects.toThrow(/BING_API_KEY/);
  });
});

describe('bingTrafficStats', () => {
  it('totals clicks and impressions across the series', async () => {
    const ctx = ctxWithBing({
      getRankAndTrafficStats: async () => [
        { date: '2014-05-03T07:00:00.000Z', clicks: 10, impressions: 100 },
        { date: '2014-05-04T07:00:00.000Z', clicks: 5, impressions: 50 },
      ],
    });
    const out = payload(
      (await bingTrafficStats(ctx, { siteUrl: 'https://example.com/', limit: 50 })) as never,
    );
    expect(out['totals']).toEqual({ clicks: 15, impressions: 150 });
  });
});

describe('bingTopQueries', () => {
  it('sorts by clicks descending and honours the limit', async () => {
    const ctx = ctxWithBing({
      getQueryStats: async () => [
        { query: 'low', clicks: 1, impressions: 10, avgClickPosition: 9, avgImpressionPosition: 12, date: null },
        { query: 'high', clicks: 50, impressions: 900, avgClickPosition: 2, avgImpressionPosition: 4, date: null },
        { query: 'mid', clicks: 20, impressions: 400, avgClickPosition: 5, avgImpressionPosition: 7, date: null },
      ],
    });
    const out = payload(
      (await bingTopQueries(ctx, { siteUrl: 'https://example.com/', limit: 2 })) as never,
    );
    const rows = out['queries'] as { query: string }[];
    expect(rows.map((r) => r.query)).toEqual(['high', 'mid']);
  });

  it('keeps both position fields so the cross layer can choose', async () => {
    const ctx = ctxWithBing({
      getQueryStats: async () => [
        { query: 'q', clicks: 1, impressions: 10, avgClickPosition: 2.5, avgImpressionPosition: 8.1, date: null },
      ],
    });
    const out = payload(
      (await bingTopQueries(ctx, { siteUrl: 'https://example.com/', limit: 50 })) as never,
    );
    const rows = out['queries'] as Record<string, unknown>[];
    expect(rows[0]!['avgClickPosition']).toBe(2.5);
    expect(rows[0]!['avgImpressionPosition']).toBe(8.1);
  });
});
