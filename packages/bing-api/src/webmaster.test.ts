import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { BingWebmasterClient } from './webmaster.js';
import type { FetchResponse } from './http.js';

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8'));
}

function respond(body: unknown): FetchResponse {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function clientFor(body: unknown) {
  const fetcher = vi.fn(async () => respond(body));
  return { client: new BingWebmasterClient({ apiKey: 'k', fetcher }), fetcher };
}

describe('BingWebmasterClient', () => {
  it('listSites maps Url/IsVerified', async () => {
    const { client } = clientFor(fixture('get-user-sites'));
    await expect(client.listSites()).resolves.toEqual([
      { url: 'https://example.com/', isVerified: true },
      { url: 'https://staging.example.com/', isVerified: false },
    ]);
  });

  it('getRankAndTrafficStats converts WCF dates to ISO 8601', async () => {
    const { client } = clientFor(fixture('get-rank-and-traffic-stats'));
    const rows = await client.getRankAndTrafficStats('https://example.com/');
    expect(rows[0]).toEqual({
      date: '2014-05-03T07:00:00.000Z',
      clicks: 120,
      impressions: 4300,
    });
  });

  it('getQueryStats keeps BOTH position fields distinct', async () => {
    const { client } = clientFor(fixture('get-query-stats'));
    const rows = await client.getQueryStats('https://example.com/');
    expect(rows[0]?.avgClickPosition).toBe(4.2);
    expect(rows[0]?.avgImpressionPosition).toBe(8.7);
  });

  it('sends the siteUrl parameter', async () => {
    const { client, fetcher } = clientFor(fixture('get-query-stats'));
    await client.getQueryStats('https://example.com/');
    expect(fetcher.mock.calls[0]![0]).toContain('siteUrl=https%3A%2F%2Fexample.com%2F');
  });

  it('throws rather than nulling when a date is malformed', async () => {
    const { client } = clientFor({ d: [{ Date: '2014-05-03', Clicks: 1, Impressions: 2 }] });
    await expect(client.getRankAndTrafficStats('https://example.com/')).rejects.toThrow(
      /WCF date/i,
    );
  });

  it('getUrlSubmissionQuota unwraps an object payload', async () => {
    const { client } = clientFor({ d: { DailyQuota: 10, MonthlyQuota: 100 } });
    await expect(client.getUrlSubmissionQuota('https://example.com/')).resolves.toEqual({
      dailyQuota: 10,
      monthlyQuota: 100,
    });
  });

  it('getKeywordStats omits absent optional params', async () => {
    const { client, fetcher } = clientFor({ d: [] });
    await client.getKeywordStats('aeo tools');
    const url = fetcher.mock.calls[0]![0];
    expect(url).toContain('q=aeo+tools');
    expect(url).not.toContain('country');
    expect(url).not.toContain('language');
  });

  it('exposes no method whose name implies a write', () => {
    const names = Object.getOwnPropertyNames(BingWebmasterClient.prototype);
    for (const name of names) {
      expect(name).not.toMatch(/^(submit|add|remove|save|update|verify|fetch|enable)/i);
    }
  });
});
