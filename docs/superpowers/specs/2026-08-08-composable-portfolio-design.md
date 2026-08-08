# Composable portfolio — proof of concept design

**Date:** 2026-08-08
**Status:** Approved, ready for implementation plan

## Goal

Prove the concept in [`PLAN.md`](../../../PLAN.md): a portfolio where curated links like `/for/acme`
show 3–5 hand-picked case studies with per-recipient framing, built from the same renderer as the
homepage. This spec covers the proof-of-concept scope — what to build with placeholder content so
the concept can be judged before any real case studies exist.

`PLAN.md` is the architecture reference and stays authoritative for the content collection schema,
the `sets.ts` shape, routing, and the definition of done. This document only adds the decisions the
plan explicitly left open for a proof of concept: styling level, placeholder content, and placeholder
images.

## Architecture — unchanged from PLAN.md

- `src/content.config.ts` — `projects` collection, `glob` loader, schema exactly as specified (Step 1).
- `src/data/sets.ts` — `Set` interface and `sets` record exactly as specified (Step 2), used verbatim
  as the placeholder copy (see Content, below).
- `src/components/SetView.astro` — single renderer for both entry points, with the `throw` on an
  unknown id as the one runnable check (Step 3).
- `src/pages/index.astro`, `src/pages/for/[set].astro`, `src/pages/work/[...id].astro`,
  `src/pages/work/index.astro` — routes exactly as specified (Steps 3–4).
- `noindex` on curated pages via a `Layout` prop (Step 5).

No architectural changes. Everything below is additive: content, styling, and the two components the
plan intentionally left unspecified.

## Content — 3 case studies, 2 sets

Reuse the plan's own example content verbatim rather than inventing new placeholder copy, since it's
already realistic:

- `marketplace-homepage-redesign`
- `wearable-onboarding`
- `design-system-migration`

Each gets a `title`, a real-sounding `summary` (not "contact me for details"), a cover image, and a
body of ~4 paragraphs with 2 in-body images demonstrating the MDX layout components below.

Sets:

- `default` — intro *"I'm a staff product designer working on complex, systems-heavy problems."*, all
  three projects, no `why` (per the plan: no `why` where there's no specific reader).
- `acme` — intro and per-project `why` lines exactly as written in `PLAN.md` Step 2, reordered to put
  `design-system-migration` first.

## Styling — minimal, no framework

Plain CSS, no UI library or CSS framework (matches the "minimize dependencies" principle). A global
stylesheet imported by `Layout.astro` for typography, color, and spacing tokens; scoped `<style>`
blocks in individual components for layout specifics (card grid, full-bleed breakout).

- System font stack — no webfont loading, no extra request.
- One spacing scale and a max-width content column (~65–75ch for prose, wider for the card grid).
- Responsive card grid in `SetView` — single column on narrow viewports.
- Simple header (site name → `/`, link to `/work`) in `Layout.astro`. No footer required for the POC.

Enough polish to judge the concept as a portfolio, deliberately not a finished visual design — swap
freely once real work samples are in.

## Placeholder images — generated locally, no network calls

Hand-authored SVG files, one accent color per project, solid background plus a text label (e.g.
"Cover — Marketplace Homepage Redesign"). Saved under `src/assets/projects/<id>/` and imported as
relative imports in MDX frontmatter and body, exactly as real photos would be, so `image()` and
`<Image>` optimize them for real rather than taking a shortcut that real content won't have.

Per case study: 1 cover (1200×800) + 2 in-body images (one ~1600×900 for full-bleed, one pair at
~800×600 each for side-by-side).

## MDX layout components (fills the gap left open in PLAN.md Step 4)

Three small components, auto-imported into MDX case study bodies:

- `src/components/mdx/FullBleed.astro` — `{ src, alt }`, image breaks out to full viewport width.
- `src/components/mdx/SideBySide.astro` — `{ left: { src, alt }, right: { src, alt } }`, two images
  in a row, stacking on narrow viewports.
- `src/components/mdx/Caption.astro` — `{ children }`, small muted text under an image.

## Component contracts (fills the gap left open in PLAN.md Step 3)

- `src/layouts/Layout.astro` — props `{ title: string; noindex?: boolean }`. Site header, global
  styles, `<meta name="robots" content="noindex">` when `noindex` is true.
- `src/components/ProjectCard.astro` — props `{ entry: CollectionEntry<'projects'>; why?: string }`.
  Cover via `<Image>`, title, summary, `why` when present, links to `/work/${entry.id}`. Reused as-is
  by `/work/index.astro` (omitting `why`) — no second card component.

## Definition of done

Same checklist as `PLAN.md`, applied to this content:

1. The 3 case studies live in `src/content/projects/` as MDX; adding a fourth is adding a file.
2. `/` renders `sets.default` through `SetView`.
3. `/for/acme` shows the 3 case studies in the listed order, with the set intro and each `why`.
4. A typo'd id in `sets.ts` fails `astro build` naming the id.
5. `/work/<id>` renders each case study's body with images optimized, using at least one of each MDX
   layout component across the 3 case studies.
6. `/for/acme` carries `noindex`; `/` does not.
7. `/work/index.astro` lists all 3 case studies via `ProjectCard`.

## Out of scope

Same as `PLAN.md`: checkbox picker UI, tags/filtering, per-set theming, link analytics, deployment
configuration. Also out of scope for this POC specifically: a real name/brand identity (copy stays
first-person and unnamed, as the plan's example already is) and a footer.
