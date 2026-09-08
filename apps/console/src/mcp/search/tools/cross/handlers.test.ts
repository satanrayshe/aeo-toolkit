import { describe, expect, it, vi } from 'vitest';
import { McpToolError } from '@advance-labs/mcp-core';
import type { GscReport } from '@advance-labs/types';

import { BingKeyResolver, InMemoryBingKeyStore } from '../../auth/bing.js';
import type { BingLike, ClientFactory, GscLike, ToolContext } from '../context.js';
import { compareEngines, engineDivergence } from './handlers.js';

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

/** Narrow a `ToolResult` to its structured payload, failing the test if it errored. */
function payload(result: { isError?: boolean; structuredContent?: Record<string, unknown> }): Record<string, unknown> {
  expect(result.isError).toBeFalsy();
  return result.structuredContent ?? {};
}

describe('compareEngines truncation', () => {
  it('keeps a high-click Bing-only row over a low-click Google row under a small limit', async () => {
    // Google returns two low-click rows first; Bing returns one high-click row
    // for a key Google never saw. Insertion order alone would put both Google
    // rows ahead of the Bing-only row and truncate it away at limit=1.
    const ctx = ctxWithEngines({
      gsc: {
        query: async (): Promise<GscReport> => ({
          rows: [
            { keys: ['low-a'], clicks: 1, impressions: 10, ctr: 0.1, position: 5 },
            { keys: ['low-b'], clicks: 2, impressions: 20, ctr: 0.1, position: 5 },
          ],
        }),
      },
      bing: {
        getQueryStats: async () => [
          {
            query: 'bing-big',
            clicks: 500,
            impressions: 5000,
            avgClickPosition: 2,
            avgImpressionPosition: 3,
            date: null,
          },
        ],
      },
    });

    const result = await compareEngines(ctx, {
      siteUrl: 'sc-domain:example.com',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      limit: 1,
    });

    const out = payload(result as never);
    const rows = out['rows'] as { key: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0]!.key).toBe('bing-big');
  });

  it('computes the both-engines count from the full merged set, not the truncated slice', async () => {
    const ctx = ctxWithEngines({
      gsc: {
        query: async (): Promise<GscReport> => ({
          rows: [
            { keys: ['shared'], clicks: 3, impressions: 30, ctr: 0.1, position: 5 },
            { keys: ['google-only'], clicks: 1, impressions: 10, ctr: 0.1, position: 5 },
          ],
        }),
      },
      bing: {
        getQueryStats: async () => [
          {
            query: 'shared',
            clicks: 4,
            impressions: 40,
            avgClickPosition: 2,
            avgImpressionPosition: 3,
            date: null,
          },
          {
            query: 'bing-only',
            clicks: 500,
            impressions: 5000,
            avgClickPosition: 2,
            avgImpressionPosition: 3,
            date: null,
          },
        ],
      },
    });

    const result = await compareEngines(ctx, {
      siteUrl: 'sc-domain:example.com',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      limit: 1,
    });

    const out = payload(result as never);
    const text = (result as { content: { text: string }[] }).content[0]?.text ?? '';
    // The full merged set has exactly one key ('shared') present on both engines,
    // even though the truncated `rows` (limit=1) contains only 'bing-only'.
    expect(text).toMatch(/1 of 3 present on both engines/);
    const rows = out['rows'] as { key: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0]!.key).toBe('bing-only');
  });
});

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
