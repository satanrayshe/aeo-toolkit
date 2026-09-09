---
title: Tool reference
description: >-
  All ten tools — five browser tools, three MCP servers with 30 tools, a content agent, and the Chrome extension — and the routes behind them.
---

The suite is **ten tools**, delivered from **two deployables**: a single Next.js app
(`apps/console`) and a Chrome extension (`apps/chrome-extension`). Everything else is a shared
library under `packages/`.

> The tools were originally nine standalone apps. [ADR-0003](../adr/0003-single-vercel-deployment.md)
> consolidated every HTTP deployable into the console; the standalone apps were deleted and their
> logic preserved in the `@advance-labs/*` packages. The historical per-tool specs are in
> [`../archive/tools/`](../archive/tools/).

## Browser tools — 5

Free, no sign-up, hosted at [advancelabs.dev/tools](https://advancelabs.dev/tools). Each is a route
in the console with a matching route handler.

| Tool | Route | API | Engine |
|---|---|---|---|
| Technical SEO + AEO audit | `/tools/audit` | `/api/audit/technical` (+ `/pdf`) | `crawler` → `html-parser` → `schema-validator` → `scoring` |
| E-E-A-T scanner | `/tools/eeat` | `/api/audit/eeat` | `scoring` (`eeatRules`) |
| llms.txt generator | `/tools/llms-txt` | `/api/generate` | `crawler` + `html-parser` |
| GA4 + GSC chat | `/tools/chat` | `/api/chat` | `google-api` + `llm` (BYOK) |
| Backlink graph (3D) | `/tools/graph` | `/api/graph` (+ `/stream`, `/expand`) | `backlinks` + WebGL |

## MCP servers — 3

Served from the console as Streamable-HTTP route handlers via the `mcp-handler` adapter, with OAuth
discovery under `/.well-known/`. **30 tools total.** The connection page is [`/mcp`](https://advancelabs.dev/mcp).
Every tool on every server is **read-only** — none calls a write method on any upstream API.

| Server | Endpoint | Auth | Tools |
|---|---|---|---|
| AI Visibility | `/api/mcp/ai-visibility/mcp` | none | `analyze_website_aeo`, `check_ai_visibility`, `discover_ranking_prompts`, `get_visibility_report`, `compare_competitor_visibility` |
| Backlink | `/api/mcp/backlink/mcp` | none | `find_prospects`, `find_mentions`, `extract_contact_info`, `check_page_history`, `generate_outreach_email`, `verify_page_links`, `find_competitor_link_sources` |
| Search (Google + Bing) | `/api/mcp/search/mcp` | Google BYOK; Bing BYOK optional | see below |

The search server was `GA4 + GSC` at `/api/mcp/ga-gsc/mcp`; that path still works as a compatibility
alias so existing client configs need no change, but new configs should point at `/api/mcp/search/mcp`.

### Search server — 18 tools

| Tool | Engine | Notes |
|---|---|---|
| `list_ga4_properties` | Google | |
| `list_gsc_sites` | Google | |
| `ga4_run_report` | Google | |
| `gsc_search_analytics` | Google | |
| `gsc_top_queries` | Google | |
| `gsc_ctr_gaps` | Google | |
| `compare_periods` | Google | |
| `gsc_traffic_drop` | Google | |
| `gsc_cannibalization` | Google | |
| `gsc_decay` | Google | |
| `list_bing_sites` | Bing | |
| `bing_traffic_stats` | Bing | |
| `bing_top_queries` | Bing | |
| `bing_top_pages` | Bing | |
| `bing_query_pages` | Bing | exactly one of `query`/`page` |
| `bing_index_health` | Bing | crawl stats, crawl issues, submission quota |
| `bing_keyword_research` | Bing | no Google Search Console equivalent exists |
| `compare_engines` | Google + Bing | merged rows with an explicit coverage block |

Bing authentication is BYOK via an `X-Bing-Api-Key` request header, or a static `BING_API_KEY`
environment variable as a fallback. A missing Bing key does not fail the server: Bing tools return
their own credential error, but the ten Google tools keep working — the server degrades to
Google-only rather than failing outright.

> `engine_divergence` (comparing Google's and Bing's click trends to tell a ranking problem from
> a content problem) was built but is **not registered**. Bing's `GetQueryStats` takes no date
> parameter, so the tool's two-half comparison would see identical Bing data both times and could
> never classify a Bing-specific or broad decline correctly. The code is preserved, tested, and
> documented in `apps/console/src/mcp/search/tools/cross/handlers.ts` and `divergence.ts` pending
> a live Bing key to settle whether Bing's stats can be bucketed per date at all.

### Skills

Three [Claude Skills](../../skills) turn the Google tools into workflows — *why did traffic
drop*, *are my pages competing*, *what needs refreshing*. They build on `gsc_traffic_drop`,
`gsc_cannibalization`, and `gsc_decay`.

## Content agent — 1

The blogging agent runs as a **Vercel Cron** (`/api/cron/blogging`, daily 13:00 UTC), not a separate
app. Its pipeline — research → draft → edit → dedup → schedule → publish → self-correct — lives in
[`@advance-labs/blogging`](../../packages/blogging).

## Chrome extension — 1

[`apps/chrome-extension`](../../apps/chrome-extension) runs `@advance-labs/scoring` in single-page
mode against the active tab. The audit is fully client-side — the only network calls are same-origin
fetches for `robots.txt`, `sitemap.xml`, and `llms.txt`. Exports a PDF via `jsPDF`.

## The scoring engine

All audit surfaces share one rule engine: **54 rules** across three sets.

| Rule set | Rules | Covers |
|---|---|---|
| `technicalSeoRules` | 29 | robots/sitemap/llms.txt, HTTPS, meta, Open Graph, canonical, structured data, content, mobile |
| `aeoRules` | 11 | answerability, answer-engine schema, GPTBot/ClaudeBot/PerplexityBot directives, content extractability |
| `eeatRules` | 14 | Experience, Expertise, Authoritativeness, Trust |

`singlePageMode` runs the same rules minus multi-page crawl signals — this is what the extension uses.
