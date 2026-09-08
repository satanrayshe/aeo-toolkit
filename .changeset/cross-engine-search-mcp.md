---
'@advance-labs/bing-api': minor
'@advance-labs/console': minor
---

Add Bing Webmaster Tools to the search MCP server, alongside Google.

Nine new tools: seven Bing read tools plus `compare_engines` and
`engine_divergence`. `bing_keyword_research` returns keyword impression data
Google Search Console does not expose at all. `engine_divergence` separates a
Google-specific ranking problem from a content problem by reading both engines
at once.

The server moved from `/api/mcp/ga-gsc` to `/api/mcp/search`. The old path
still works; existing client configs need no change.

Read-only: no Bing write method is called anywhere.
