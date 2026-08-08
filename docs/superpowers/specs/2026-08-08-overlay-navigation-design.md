# Overlay navigation — design

**Date:** 2026-08-08
**Status:** Approved, ready for implementation plan

## Goal

Port the interaction pattern prototyped in `overlay-concept/` into the composable portfolio: clicking
a case study link from any listing page (`/`, `/for/[set]`, `/work`) opens that case study as a sliding
overlay on top of the current page instead of a full navigation, while `/work/<id>` remains a fully
real, standalone, deep-linkable page when loaded directly. Progressive enhancement: without JS, links
behave as normal full navigations.

## Source

`overlay-concept/` is the working prototype this design adapts. Its own `to-dos.md` flags unfinished
responsive/animation work, and its `closeOverlay()` hardcodes returning to `/` regardless of where the
overlay was opened from — this design corrects that.

## Mechanism (unchanged from the prototype)

Document-level click delegation. On click:

1. `event.preventDefault()`
2. `fetch(href)` — fetches the target route's own real static HTML (Astro already builds it)
3. `DOMParser` extracts `<main>` from the fetched document
4. `main.innerHTML` is injected into the overlay's content container
5. `history.pushState` updates the URL and `document.title` to the target page's own title
6. Overlay panel animates in (`.active` class), background scroll locked via
   `body.overlay-open { overflow: hidden }`

## Adapted from the prototype

- **Trigger matching is href-prefix based, not a nav-link registry.** Any `<a>` with `href` starting
  with `/work/` (excluding exactly `/work`) is intercepted, wherever it appears — listing pages and,
  if a case study ever cross-links another one, inside the overlay's own injected content too. This
  means a new case study (a new MDX file) gets overlay behavior automatically, matching this project's
  existing "adding a case study is adding a file" promise. The prototype instead required every
  destination to be listed in a fixed nav array keyed by `data-page`/`data-url` — dropped as
  unnecessary; `href` alone carries everything needed.
- **Close returns to the actual origin, not always `/`.** `closeOverlay()` calls `history.back()`
  instead of manually pushing a new `/` state. Since exactly one history entry is pushed per open,
  `back()` naturally lands back on `/`, `/for/acme`, or `/work` — whichever the overlay was opened
  from. The underlying page is never scrolled while the overlay is open (`overflow: hidden` on body),
  so its scroll position is exactly as the user left it — no manual scroll save/restore needed.
- **No `checkInitialURL`-equivalent.** The prototype re-detects overlay state on load, for a case
  where a shell document might be served for a sub-page URL. Every route in this project is a real,
  independently-built static page (like every file in the prototype already is), so a direct load or
  refresh of `/work/<id>` simply serves that real page — no detection logic needed.
- **Kept as-is:** content caching per URL, `prefers-reduced-motion` handling (including live changes
  via a `matchMedia` change listener), Escape-to-close, backdrop-click-to-close, ARIA (`role="dialog"`,
  `aria-modal`, `aria-hidden` toggling), focus return to the triggering element on close, fetch error
  state with a retry button.

## The CSS-scoping fix

Astro bundles each `.astro` component's scoped styles into that page's own stylesheet. Fetching only
the `<main>` fragment from `/work/<id>` would lose `FullBleed`/`SideBySide`/`Caption`'s styles, since
the parent page's `<head>` never loaded them. Fix: move those three components' `<style>` blocks into
`src/styles/global.css`, which every page already loads via `Layout.astro`. No visual or behavioral
change — these styles apply exactly as before, just from a shared file instead of three page-scoped
bundles.

## Overlay visual treatment

Reuse the prototype's slide-in-from-right panel (`overlay-concept/styles.css`, not the unfinished
`styles-clip.css` scale variant), retuned to this project's existing tokens in `global.css`
(`--color-text`, `--color-muted`, `--color-bg`, `--color-border`, `--space-*`) rather than the
prototype's separate `--overlay-bg-color` etc. Same structural behavior: background scrim, panel
sliding in from the right covering most but not all of the viewport, close button in a header row,
internal scroll on the panel body.

## Scope

All three listing surfaces get overlay-triggering links, since they all render case study links
through `ProjectCard` already: `/` (default set), `/for/[set]` (curated links), `/work` (full
catalogue). No changes needed to `ProjectCard.astro` or `SetView.astro` themselves — href-prefix
matching means the existing `<a href={`/work/${entry.id}`}>` markup already qualifies.

## File structure

```
src/layouts/Layout.astro       — add overlay markup (background, panel, header, close button, content
                                  container) + <script> loading the overlay module. Present on every
                                  page, including /work/<id> where it's simply unused.
src/scripts/overlay.js         — new file. All interaction logic: click delegation, fetch/parse/inject,
                                  history push/pop, focus management, reduced-motion, error+retry.
src/styles/global.css          — add overlay styles (adapted from overlay-concept/styles.css) + the
                                  three relocated component styles.
src/components/mdx/FullBleed.astro   — remove <style> block (moved to global.css).
src/components/mdx/SideBySide.astro  — remove <style> block (moved to global.css).
src/components/mdx/Caption.astro     — remove <style> block (moved to global.css).
```

No changes to: any `src/pages/*.astro` route, `ProjectCard.astro`, `SetView.astro`,
`content.config.ts`, `sets.ts`, any MDX content file.

## Definition of done

1. Clicking a case study card from `/`, `/for/acme`, or `/work` opens that case study in a sliding
   overlay without a full page navigation (no new document load beyond the one `fetch`).
2. The URL bar and `document.title` update to match the case study while the overlay is open.
3. Loading `/work/<id>` directly (or refreshing while it's the current URL) renders it as a normal
   standalone page — no overlay chrome, real `<h1>`, real `<Layout>` header.
4. Closing the overlay (✕ button, Escape, or backdrop click) returns to the exact page and scroll
   position the overlay was opened from.
5. Browser back/forward correctly opens/closes the overlay to match history state.
6. With JavaScript disabled, case study links behave as normal full-page navigations to the same real,
   working pages.
7. `prefers-reduced-motion` is respected, including live toggling mid-session.
8. All three MDX layout components render correctly whether reached via direct load or via overlay
   (proves the CSS-relocation fix). `SideBySide` and `Caption` have no viewport-relative sizing and
   render identically in both contexts. `FullBleed`'s breakout technique (`width: 100vw`) is relative
   to the true browser viewport, not any ancestor, so unmodified it would spill past the overlay
   panel's edges over the backdrop — inside the overlay it fills the panel's own width instead of
   breaking out past it, rather than being pixel-identical to the direct-load rendering.

## Out of scope

Cross-linking between case studies from within MDX bodies (no current content does this — href-prefix
interception handles it for free if added later, but nothing is built or tested for it now). A focus
trap inside the open overlay (the prototype doesn't have one either; only focus-return-on-close is
implemented). Any change to `overlay-concept/`'s own files — that folder remains an untouched
reference prototype.
