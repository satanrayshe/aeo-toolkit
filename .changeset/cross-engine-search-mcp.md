---
'@advance-labs/bing-api': minor
'@advance-labs/console': minor
---

Add Bing Webmaster Tools to the search MCP server, alongside Google.

Eight new tools: seven Bing read tools plus `compare_engines`, which reads
both engines at once for the same site and date range. `bing_keyword_research`
returns keyword impression data Google Search Console does not expose at all.

The server moved from `/api/mcp/ga-gsc` to `/api/mcp/search`. The old path
still works; existing client configs need no change.

Read-only: no Bing write method is called anywhere.
