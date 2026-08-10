# Tailwind design system — design

**Date:** 2026-08-09
**Status:** Approved, ready for implementation plan

## Goal

Install Tailwind CSS v4 and make the brand design tokens — colors, the `AtTextualVAR` variable font, the
type scale, and the responsive grid — available to use across the site. This pass sets up the system
only; it does not restyle the existing pages or components. That's deliberate: it keeps this change
small and reviewable, and lets restyling be its own follow-up once the tokens are confirmed correct.

## Branch

`tailwind-design-system`, branched from `overlay-navigation` (not `main`) — `overlay-navigation` is
validated and likely to be kept, so building on it avoids reconciling two independently-diverged
branches later. Merge order later: this branch → `overlay-navigation` → `main`, or squashed together.

## Install

```bash
npx astro add tailwind
```

Confirmed against a real build: this installs `@tailwindcss/vite` + `tailwindcss` (v4.3.x) and adds the
Vite plugin to `astro.config.mjs` automatically:

```js
import tailwindcss from '@tailwindcss/vite';
// ...
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
});
```

It does **not** modify any CSS file — that's a manual step (see below), since it only prints a reminder
to import a stylesheet somewhere.

## CSS import — Preflight explicitly excluded

Add Tailwind to the top of the existing `src/styles/global.css`, using the explicit per-layer import
rather than the simple `@import "tailwindcss";`:

```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
```

This is required, not optional, given this pass's "no visual changes yet" goal. Tailwind's default
import also pulls in Preflight (a base CSS reset) which zeroes out default margins on headings and
paragraphs and strips default list styles — unscoped to whether any Tailwind utility classes are
actually used anywhere. Confirmed against a real build: with the simple import, an unstyled `<p>` loses
its default spacing immediately; with the explicit per-layer import omitting `preflight.css`, the `base`
layer is empty and the current site is untouched. The existing hand-rolled rules in `global.css` stay
exactly as they are, below this import.

## Design tokens

All defined in one `@theme` block in `global.css`, after the Tailwind import and before the existing
hand-rolled CSS.

### Colors

| Token | Hex | Utilities generated | Role |
|---|---|---|---|
| `--color-ink` | `#231A1A` | `bg-ink`, `text-ink`, etc. | primary text |
| `--color-muted` | `#7F7676` | `bg-muted`, `text-muted`, etc. | secondary/muted text |
| `--color-paper` | `#FBF9F9` | `bg-paper`, etc. | page background |
| `--color-accent` | `#FF8888` | `bg-accent`, `text-accent`, etc. | accent/interactive |

`#FFFFFF` gets no custom token — Tailwind already ships `white` (`bg-white`, `text-white`), so a
duplicate token would be redundant.

### Type scale

| Token | Size | Line-height |
|---|---|---|
| `--text-sm` | 16px | 1.5 |
| `--text-base` | 20px | 1.6 |
| `--text-lg` | 26px | 1.4 |
| `--text-xl` | 34px | 1.2 |
| `--text-2xl` | 52px | 1.1 |

`--text-base` intentionally overrides Tailwind's stock 16px default per the spec (20px base). Line-
heights aren't specified in the source brief; the values above follow the existing project's own
pattern (tighter for larger/display sizes, more relaxed for body-scale text) and are cheap to retune
later since they're isolated in one place.

### Font

```css
@font-face {
  font-family: "AtTextual";
  src: url("../assets/fonts/AtTextualVAR.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}

@theme {
  --font-primary: "AtTextual", sans-serif;
}
```

Confirmed against a real build: Vite correctly fingerprints and bundles the font asset from
`src/assets/fonts/AtTextualVAR.woff2` (relative `url()` resolves correctly from `global.css`'s own
location), and the `font-primary` utility class is generated and applies the custom family.
`font-weight: 100 900` is a wide-open default since the file's actual supported weight range wasn't
specified — browsers clamp to whatever the font itself supports, so this is safe regardless of the
font's real range. `--font-primary` is a distinct custom token name (not an override of Tailwind's
built-in `--font-sans`), so nothing currently rendered picks it up automatically — it only applies once
something is deliberately given the `font-primary` class, consistent with "tokens only, not applied
yet."

### Grid

No custom configuration needed. Tailwind's default spacing scale already lands exactly on the
specified values (`gap-6` = 24px, `gap-4` = 16px, `px-12` = 48px, `px-4` = 16px), and 768px is already
Tailwind's stock `md` breakpoint — confirmed against a real build, including that the responsive
variants compile into `@media (width>=48rem)` as expected. The grid is this exact utility combination,
to be used wherever a page adopts it later:

```html
<div class="grid grid-cols-6 gap-4 px-4 md:grid-cols-12 md:gap-6 md:px-12">
```

6 columns, 16px gutters, 16px margins below 768px; 12 columns, 24px gutters, 48px margins at 768px and
above. This is documented here rather than built as a wrapper component, since no page uses it yet in
this pass — building an unused component now would be premature.

## File structure

```
astro.config.mjs        — Vite plugin added by `astro add tailwind` (automatic)
package.json             — @tailwindcss/vite + tailwindcss added as dependencies (automatic)
src/styles/global.css    — Tailwind import (Preflight excluded) + @theme block prepended; existing
                            hand-rolled CSS below, unchanged
src/assets/fonts/AtTextualVAR.woff2 — already present in the repo (untracked); this pass commits it
```

No changes to any `.astro` component or page — this is styling infrastructure only.

## Definition of done

1. `npx astro add tailwind` has run; `@tailwindcss/vite` is in `astro.config.mjs`'s Vite plugins.
2. `global.css` imports Tailwind via the explicit per-layer syntax, Preflight excluded.
3. The `@theme` block defines all four color tokens, all five type-scale tokens (with paired
   line-heights), and `--font-primary` backed by a working `@font-face` for `AtTextualVAR.woff2`.
4. `npm run build` succeeds, and the production build's generated CSS contains the expected utility
   classes (`bg-ink`, `text-accent`, `font-primary`, `text-2xl`, etc.) with the correct values.
5. The font asset is correctly bundled (fingerprinted, copied into `dist/_astro/`) and the `@font-face`
   rule in the built CSS references the correct bundled path.
6. Visually, the site is pixel-identical to its current state — homepage, curated pages, work
   catalogue, case studies, and the overlay all render exactly as they did before this change. This is
   the change's main acceptance bar, given the explicit "tokens only, no restyling" scope.
7. `overlay-navigation`'s existing functionality (open/close, all four close paths, direct-load parity)
   is unaffected — this branch only adds to `global.css` and installs new dependencies, it doesn't
   touch `overlay.js`, `Layout.astro`, or any case-study content.

## Out of scope

Restyling any existing page or component to use the new tokens. A reusable `<Grid>` wrapper component.
Determining `AtTextualVAR`'s actual supported weight range (defaulting to the full 100–900 span).
Semantic mapping of which type-scale size applies to which existing UI element (e.g., "34px is the
case-study h1") — that's a restyling decision, deferred along with the rest of the visual application.
