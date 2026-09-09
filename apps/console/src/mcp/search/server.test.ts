import { describe, expect, it, vi } from 'vitest';
import { registerSearchTools } from './server.js';

function collectRegisteredNames(): { names: string[]; server: unknown } {
  const names: string[] = [];
  const server = { server: { registerTool: (name: string) => void names.push(name) } };
  return { names, server };
}

describe('registerSearchTools', () => {
  it('registers exactly eighteen tools', () => {
    const { names, server } = collectRegisteredNames();
    registerSearchTools(server as never, {} as never);
    expect(names).toHaveLength(18);
  });

  it('keeps every existing GSC tool name unchanged', () => {
    const { names, server } = collectRegisteredNames();
    registerSearchTools(server as never, {} as never);
    for (const name of [
      'list_gsc_sites',
      'list_ga4_properties',
      'ga4_run_report',
      'gsc_search_analytics',
      'gsc_top_queries',
      'gsc_ctr_gaps',
      'compare_periods',
      'gsc_traffic_drop',
      'gsc_cannibalization',
      'gsc_decay',
    ]) {
      expect(names).toContain(name);
    }
  });

  it('registers the seven Bing tools and the one cross tool', () => {
    const { names, server } = collectRegisteredNames();
    registerSearchTools(server as never, {} as never);
    for (const name of [
      'list_bing_sites',
      'bing_traffic_stats',
      'bing_top_queries',
      'bing_top_pages',
      'bing_query_pages',
      'bing_index_health',
      'bing_keyword_research',
      'compare_engines',
    ]) {
      expect(names).toContain(name);
    }
  });

  it('does NOT register engine_divergence — cut, not shipped, pending a live Bing key', () => {
    const { names, server } = collectRegisteredNames();
    registerSearchTools(server as never, {} as never);
    expect(names).not.toContain('engine_divergence');
  });

  it('registers no tool whose name implies a write', () => {
    const { names, server } = collectRegisteredNames();
    registerSearchTools(server as never, {} as never);
    for (const name of names) {
      expect(name).not.toMatch(/(submit|delete|remove|add_|update|verify|block)/i);
    }
  });

  it('registers no duplicate names', () => {
    const { names, server } = collectRegisteredNames();
    registerSearchTools(server as never, {} as never);
    expect(new Set(names).size).toBe(names.length);
  });
});
