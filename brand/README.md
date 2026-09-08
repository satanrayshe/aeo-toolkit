# AEO Toolkit — Brand assets

The mark is the **Advance Labs sphere**, the crumpled-paper polyhedron from
[advancelabs.dev](https://advancelabs.dev). AEO Toolkit is an Advance Labs product and carries the
studio's mark; the wordmark carries the product name.

The full brand guide (palette, type, surfaces, voice, where the tokens live) is in
[`docs/BRAND.md`](../docs/BRAND.md).

## Assets

| File | Use |
|------|-----|
| [`mark-256.png`](mark-256.png) | The mark alone, square, transparent. Favicons, app icons, avatars. |
| [`mark-512.png`](mark-512.png) | Same, for social cards, README and print. |
| [`logo-dark.png`](logo-dark.png) | Horizontal lockup (mark + wordmark in Signal green) for **dark** backgrounds. Transparent. |
| [`logo.png`](logo.png) | Horizontal lockup (mark + wordmark in Ink) for **light** backgrounds. Transparent. |
| [`logo-dark-preview.png`](logo-dark-preview.png) | The dark lockup composited on the `#0A0A0B` ground, for previews. |

The sphere is a photographed object, so the assets are rasters with alpha; there is no vector
version. The 1024 px master is the `MoonAinB.png` served by advancelabs.dev.

In `apps/console`, use `BrandMark` / `BrandLockup` from `src/components/BrandMark.tsx` rather
than these files.

## Wordmark

**AEO Toolkit** in Syne Bold, tracking `-0.01em`. Signal `#A8F326` on dark grounds, Ink `#16150F`
on light.

## Rules

- Minimum mark size 16 px. Lockup at least 160 px wide.
- Clear space around the mark of at least a quarter of its width.
- Don't tint, outline, rotate, or put a ring behind the sphere; don't recolour or restyle the
  wordmark; don't place either on a mid-grey ground where the off-white sphere loses its edge.

## Previous brand

The indigo→violet tile with the white "A" and cyan sparkle was retired with the September 2026
redesign. Its SVGs were removed from this folder, along with `@advance-labs/ui`'s `Logo` / `LogoMark`
components that drew it.
