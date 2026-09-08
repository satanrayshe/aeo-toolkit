---
title: Brand
description: >-
  The September 2026 visual system: the Advance Labs sphere, one Signal green, mono lab-sheet labels, Syne headlines, and where every token lives.
---

The brand that shipped with the September 2026 website redesign ("instrument revamp").
It replaces the indigo-tile identity described in the previous `brand/README.md`.

The idea in one line: **a calibrated instrument, printed.** Near-black ground, one acid-green
signal colour, mono labels like the margin notes on a lab sheet, and the Advance Labs sphere as
the mark. Everything on the page should read as measurement, not marketing.

## Mark

The mark is the **Advance Labs sphere**: the crumpled-paper polyhedron from
[advancelabs.dev](https://advancelabs.dev). AEO Toolkit is an Advance Labs product and wears the
studio's mark rather than its own; the product name carries the product identity.

| File | Use |
|------|-----|
| [`brand/mark-256.png`](../brand/mark-256.png) | Default. Favicons, app icons, avatars, anything rendered at 16–128 px. |
| [`brand/mark-512.png`](../brand/mark-512.png) | Social cards, README, print. |
| [`brand/logo-dark.png`](../brand/logo-dark.png) | Horizontal lockup, wordmark in Signal green, for dark grounds. Transparent. |
| [`brand/logo.png`](../brand/logo.png) | Horizontal lockup, wordmark in Ink, for light grounds. Transparent. |

The sphere is a raster with alpha (there is no vector; it is a photographed object). It is
off-white and reads on both the dark shell and paper surfaces without recolouring. Do not tint,
outline, or put a ring behind it. Do not rotate it: the lighting has a top-left key.

In `apps/console` use `BrandMark` / `BrandLockup` from
`src/components/BrandMark.tsx`; they render `/advance-labs-mark-256.png` at any size.

## Wordmark and lockup

The wordmark is **AEO Toolkit** set in **Syne Bold**, tracking `-0.01em`, no space around
"AEO". In the lockup the sphere sits to the left at the cap height of the wordmark with a gap of
roughly a quarter of the mark's width.

- On dark grounds the wordmark is Signal (`#A8F326`).
- On paper grounds it is Ink (`#16150F`).
- Never gradient, never outlined, never a different face.

## Palette

Roles first, hex second. Use the token, not the number.

### Ground and text (dark shell, the default)

| Role | Hex | CSS variable | Tailwind |
|------|-----|--------------|----------|
| Ground | `#0A0A0B` | `--bg`, `--v2-bg` | `bg-[var(--bg)]` |
| Text | `#F4F4F5` | `--v2-text` | |
| Text, soft | `#B6B6BD` | `--v2-ink-soft` | |
| Text, faint | `#9A9AA6` | `--v2-ink-faint` | |
| Rule | `rgba(255,255,255,.09)` | `--v2-rule` | `border-[color:var(--v2-rule)]` |
| Rule, strong | `rgba(255,255,255,.18)` | `--v2-rule-strong` | |
| Surface | `rgba(255,255,255,.025)` | `--surface` | `.surface` |

### Accents

| Role | Hex | CSS variable | Tailwind |
|------|-----|--------------|----------|
| **Signal** (the one accent) | `#A8F326` | `--v2-signal` | `brand-cyan` (legacy name, see below) |
| Signal, hover | `#C3FF57` | `--v2-signal-hover` | |
| Signal, button fill | `linear-gradient(180deg, #C6FF5C, #A8F326)` | | |
| Secondary (violet) | `#B6A4FD` | `--v2-accent2` | `brand-violet` |
| Secondary, deep | `#7C3AED` | | `brand-indigo` |
| Secondary, dot | `#A78BFA` | | |
| OK | `#3FBF8A` | `--v2-ok` | |
| Warn | `#D9974F` | `--v2-warn` | |

### Paper (light surfaces: printed report, specimen sheet)

| Role | Hex |
|------|-----|
| Paper | `#F4F4F5` |
| Ink | `#16150F` |
| Ink on button | `#0C0F05` |

### Graph palette (`apps/console/src/components/graph/graph-data.ts`)

| Node | Hex |
|------|-----|
| root | `#A8F326` |
| referring-domain | `#B6A4FD` |
| backlink-page | `#7C3AED` |
| mention | `#64748B` |
| competitor | `#F59E0B` |

### Rules of use

- **One accent.** Signal green is for the thing the eye should land on: the primary action, the
  live number, the current section label. If two things on a screen are green, one of them is
  wrong.
- Violet is secondary: chart series, the centre dot, the occasional badge. It never carries a
  call to action.
- Text is off-white on near-black. Pure `#FFFFFF` on pure `#000000` is not in the system.
- Gradients are confined to the Signal button fill and the OG image. No gradient text, no
  gradient backgrounds, no aurora.
- OK/Warn are for audit results only.

### Legacy Tailwind names

`apps/console/tailwind.config.ts` still exposes `brand.indigo`, `brand.violet` and
`brand.cyan`; they now resolve to Secondary-deep, Secondary and Signal respectively so that
existing `bg-brand-cyan`-style classes render in the new palette. Treat the names as historical.
New code should use the CSS variables or the semantic names above; a rename of the Tailwind keys
is a follow-up, not part of this refresh.

## Type

| Role | Face | Where |
|------|------|-------|
| Brand / wordmark | **Syne** 700 | `--font-brand` |
| Display (headlines) | **Syne** 600–800 | `--font-display`, `--font-v2-display` |
| Body | **Inter** (app), **Archivo** (landing) | `--font-sans`, `--font-v2-sans` |
| Labels, numbers, code | **JetBrains Mono** (app), **IBM Plex Mono** (landing) | `--font-mono`, `--font-v2-mono` |
| Editorial serif | **Instrument Serif** italic | `--font-v2-serif` |

All faces load through `next/font/google` with `display: swap`. Fallback stacks are
`system-ui, sans-serif` and `ui-monospace, monospace`.

**Labels are mono, uppercase, tracked.** Section labels are numbered like a lab sheet:
`01 · ASK`, `02 · KNOW`, `03 · MEASURE`. Figures that matter (`54 RULES · 50 PAGES · ~60S`) are
set in mono with `tabular-nums`. Headlines are Syne, large, sentence case, no exclamation marks.
The serif is for one editorial beat per page at most.

## Surfaces and structure

- **The frame.** Content sits inside a thin-ruled frame (`v2-frame`) with corner brackets
  (`v2-brackets`) on featured objects; the frame is the "instrument" edge.
- **Glass.** Cards use `v2-glass`: a low-alpha white fill, a `--v2-rule` border, no drop shadow
  heavier than `0 22px 60px -18px`.
- **Paper.** The audit report and the specimen sheet render as paper: `#F4F4F5` ground, Ink text,
  mono rules. It is the only light surface in the product and it is meant to look printed.
- **The graph.** The WebGL node field uses the graph palette above on the dark ground and is the
  single decorative element on the landing page.

## Motion

Motion is choreography, not decoration: scroll-driven stages (GSAP + Lenis), a counted-up score,
a pointer parallax on the specimen. Every effect is gated on `prefers-reduced-motion: reduce`
and pointer capability (`(hover: hover)`); with either absent the page renders static and
complete. Do not add ambient animation that runs without user intent.

## Voice

Understated, precise, second person. "Free, open instruments that measure whether the engines
can find, parse, and cite you." No exclamation marks, no superlatives, no emoji. Figures are
stated as facts and each one traces to the repo (`54 rules` is documented in
[`docs/reference/tools.md`](reference/tools.md); `50 pages` is the crawl cap). Sample output is
always labelled `Specimen · illustrative`; no real domain is graded on a marketing page.

## Where the tokens live

| What | File |
|------|------|
| App tokens (`--bg`, `--surface`, `--text-*`) | `apps/console/src/app/globals.css` |
| Landing tokens (`--v2-*`) and utilities (`v2-frame`, `v2-glass`, `v2-label`, `v2-brackets`) | `apps/console/src/components/landing-v2/landing-v2.css` |
| Tailwind palette and font families | `apps/console/tailwind.config.ts` |
| Fonts | `apps/console/src/app/layout.tsx` (app), `apps/console/src/app/page.tsx` (landing) |
| Mark component | `apps/console/src/components/BrandMark.tsx` |
| Favicon / app icons | `apps/console/src/app/icon.png`, `apple-icon.png`, `manifest.ts` |
| OG image | `apps/console/src/lib/og.tsx`, `apps/console/src/app/opengraph-image.tsx` |
| Brand assets | `brand/` |

## What changed from the old brand

Removed: the indigo→violet gradient tile with the white "A" and cyan sparkle (`brand/mark.svg`,
`logo.svg`, `logo-dark.svg`, `favicon.svg`), the aurora gradient backdrop, gradient text, and the
indigo/violet/cyan palette (`#6366F1`, `#8B5CF6`, `#22D3EE`) as brand colours.

Kept: the "AEO Toolkit" name and wordmark structure, MIT, the Advance Labs attribution.

`@advance-labs/ui`'s `Logo` / `LogoMark` (the old tile as inline SVG) were removed; nothing
imported them. Its `ScoreGauge` and `CategoryBreakdown` gradients now use the Secondary violets.
The Chrome extension's toolbar and store icons are the sphere, regenerated at 16/32/48/128.

## Checklist for new surfaces

1. Ground is `--bg`; text is `--v2-text` or `--text`.
2. Exactly one Signal element per view.
3. Labels: mono, uppercase, numbered if they order something.
4. Headline: Syne. Body: Inter or Archivo. Numbers: mono, tabular.
5. The mark is the sphere at ≥ 16 px, never tinted.
6. Motion respects reduced-motion and renders complete without it.
7. Every figure in copy traces to a file in this repo.
