# Composable Portfolio Proof of Concept Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working proof of concept of the composable portfolio described in `PLAN.md` and
`docs/superpowers/specs/2026-08-08-composable-portfolio-design.md` — a homepage and one curated link
(`/for/acme`) rendered by the same component from the same content collection, with placeholder case
studies realistic enough to judge whether the concept works.

**Architecture:** Astro 7.2 static site. Case studies live in a content collection (`src/content/projects`,
MDX). Curated "sets" are a plain TypeScript config (`src/data/sets.ts`) — a named list of project ids
plus copy. One renderer (`SetView.astro`) takes a `Set` and drives both the homepage (`/`, the `default`
set) and curated links (`/for/[set]`). Case study bodies render through `/work/[...id]`; `/work/index`
lists everything unfiltered.

**Tech Stack:** Astro 7.2.0, `@astrojs/mdx` 7.0.5, TypeScript (strict), plain CSS. No CSS framework, no
UI library, no image-generation dependency — placeholder images are hand-rolled SVGs.

## Global Constraints

- Astro must resolve to 7.x — confirmed available: `astro@7.2.0`.
- `@astrojs/mdx@7.0.5` declares peer `astro: ^7.0.0` and installs cleanly against Astro 7.2.0 — confirmed,
  no Vite 8 compatibility blocker.
- Node `>=22.12.0` is required by Astro 7's `engines` field — confirmed local Node is `v22.12.0`.
- Package manager is npm (matches `PLAN.md` Step 0). Do not introduce pnpm/yarn lockfiles.
- Use `src/content.config.ts`, never `src/content/config.ts`.
- Use `loader: glob({ pattern, base })` inside `defineCollection`, never a bare `defineCollection({ schema })`.
- Use `entry.id`, never `entry.slug` (removed in the Content Layer API).
- Import `render(entry)` from `astro:content`; never call `entry.render()`.
- Use `getCollection('projects')` / `getEntry('projects', id)`; never `getEntryBySlug()` or `getDataEntryById()`.
- `getStaticPaths` must return string `params`, and must never read `Astro.params` or `Astro.props` inside
  its own function body (read them in the component body instead).
- Astro 7's Rust compiler makes unclosed MDX/HTML tags a hard build error — but note this is only enforced
  when the collection entry is actually rendered by a page (see Task 3, which is why content and rendering
  ship together in one task rather than being split and independently "verified").
- No CSS framework or component library dependency — plain CSS only, per the approved design.
- No dependency for placeholder image generation — a throwaway Node script writing raw SVG strings, not a
  library.
- Content and copy: reuse `PLAN.md`'s own example copy verbatim for `sets.ts` (both the `default` and
  `acme` set text are already written there — don't rephrase it).

---

## File Structure

```
package.json, package-lock.json, astro.config.mjs, tsconfig.json, .gitignore, .vscode/, README.md   ← Task 1 (scaffold)
public/favicon.ico, public/favicon.svg                                                                ← Task 1 (scaffold)

src/assets/projects/<id>/{cover,full-bleed,side-left,side-right}.svg  (× 3 ids)                       ← Task 2

src/content.config.ts                  — projects collection schema                                   ← Task 3
src/data/sets.ts                       — Set type + default/acme sets                                  ← Task 3
src/components/mdx/FullBleed.astro     — full-bleed image, used inside MDX bodies                      ← Task 3
src/components/mdx/SideBySide.astro    — two images side by side, used inside MDX bodies                ← Task 3
src/components/mdx/Caption.astro       — muted caption text, used inside MDX bodies                     ← Task 3
src/content/projects/marketplace-homepage-redesign.mdx                                                  ← Task 3
src/content/projects/wearable-onboarding.mdx                                                            ← Task 3
src/content/projects/design-system-migration.mdx                                                        ← Task 3
src/styles/global.css                  — tokens, base typography, header                                ← Task 3
src/layouts/Layout.astro               — { title, noindex? }                                            ← Task 3
src/components/ProjectCard.astro       — { entry, why? }                                                ← Task 3
src/components/SetView.astro           — { set }                                                        ← Task 3
src/pages/index.astro                  — homepage, renders sets.default                                 ← Task 3
src/pages/for/[set].astro              — curated links, noindex                                         ← Task 3
src/pages/work/[...id].astro           — one case study                                                 ← Task 3
src/pages/work/index.astro             — full catalogue                                                 ← Task 3
```

Content, data, and rendering are one task (Task 3), not three. Astro's Content Layer API validates a
collection entry against its Zod schema **lazily**, only when a page actually queries it — confirmed by
testing: `astro build` with an unreferenced MDX file containing a broken image path, and separately one
with an unclosed HTML tag, both built with zero errors. There is no meaningful independent verification
for "schema + content" or "components" in isolation; the only real check is a full build once routes
exist to consume them. Splitting this into artificially "independent" tasks would mean shipping a task
whose passing verification proves nothing.

---

## Task 1: Scaffold Astro 7.2 project with MDX

**Files:**
- Create: `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.vscode/`, `README.md`, `public/favicon.ico`, `public/favicon.svg`, `src/pages/index.astro` (scaffold default, overwritten in Task 3)

**Interfaces:**
- Consumes: nothing.
- Produces: an installable, buildable Astro 7.2 project with `@astrojs/mdx` registered in
  `astro.config.mjs`, and npm scripts `dev` / `build` / `preview`.

- [ ] **Step 1: Scaffold into a throwaway subdirectory**

`create-astro` refuses to scaffold into a non-empty directory (this project root already has `PLAN.md`,
`docs/`, and `.git/`), so scaffold into a subdirectory first, then move the files up.

Run:
```bash
npm create astro@latest _scaffold -- --template minimal --no-install --no-git --no-ai --typescript strict --yes
```
Expected: `_scaffold/` is created containing `.gitignore`, `.vscode/`, `README.md`, `astro.config.mjs`,
`package.json`, `public/`, `src/`, `tsconfig.json`.

- [ ] **Step 2: Move the scaffolded files into the project root**

```bash
mv _scaffold/.gitignore _scaffold/.vscode _scaffold/README.md _scaffold/astro.config.mjs _scaffold/package.json _scaffold/public _scaffold/src _scaffold/tsconfig.json .
rmdir _scaffold
```
Expected: `_scaffold/` no longer exists; `ls` at the project root shows the moved files alongside
`PLAN.md` and `docs/`.

- [ ] **Step 3: Install dependencies and add the MDX integration**

```bash
npm install
npx astro add mdx --yes
```
Expected: `npx astro add mdx --yes` reports `success  Added the following integration to your project:
- @astrojs/mdx`, and `astro.config.mjs` now imports `mdx` from `@astrojs/mdx` and passes it to
`integrations: [mdx()]`.

- [ ] **Step 4: Verify the scaffold builds**

```bash
npx astro --version
npm run build
```
Expected: version output starts with `astro  v7.` (e.g. `v7.2.0`); the build log ends with
`1 page(s) built` and `dist/index.html` exists.

- [ ] **Step 5: Commit**

```bash
git add .gitignore .vscode README.md astro.config.mjs package.json package-lock.json public src tsconfig.json
git commit -m "Scaffold Astro 7.2 project with MDX integration

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Generate placeholder images

**Files:**
- Create: `src/assets/projects/marketplace-homepage-redesign/{cover,full-bleed,side-left,side-right}.svg`
- Create: `src/assets/projects/wearable-onboarding/{cover,full-bleed,side-left,side-right}.svg`
- Create: `src/assets/projects/design-system-migration/{cover,full-bleed,side-left,side-right}.svg`

**Interfaces:**
- Consumes: `src/` existing from Task 1.
- Produces: 12 local SVG files, one accent color per project, sized to match how they're used
  (`cover.svg` 1200×800 for the 3:2 card crop, `full-bleed.svg` 1600×900, `side-left.svg`/`side-right.svg`
  800×600 each) — these get imported like real photos would be in Task 3.

- [ ] **Step 1: Write the generator script**

This is a one-time authoring tool, not part of the site — write it to `/tmp`, not into the repo.

Write `/tmp/gen-placeholders.mjs`:
```js
import { writeFileSync, mkdirSync } from 'node:fs';

const projects = [
  { id: 'marketplace-homepage-redesign', color: '#2563eb', label: 'Marketplace Homepage Redesign' },
  { id: 'wearable-onboarding', color: '#059669', label: 'Wearable Onboarding' },
  { id: 'design-system-migration', color: '#d97706', label: 'Design System Migration' },
];

const images = [
  { name: 'cover', width: 1200, height: 800, tag: 'Cover' },
  { name: 'full-bleed', width: 1600, height: 900, tag: 'Full bleed' },
  { name: 'side-left', width: 800, height: 600, tag: 'Detail A' },
  { name: 'side-right', width: 800, height: 600, tag: 'Detail B' },
];

function svg(width, height, color, title) {
  const fontSize = Math.round(width / 22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${color}"/>
  <rect width="${width}" height="${height}" fill="#000000" opacity="0.15"/>
  <text x="50%" y="50%" fill="#ffffff" font-family="system-ui, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${title}</text>
</svg>
`;
}

for (const project of projects) {
  const dir = `src/assets/projects/${project.id}`;
  mkdirSync(dir, { recursive: true });
  for (const img of images) {
    const title = `${project.label} — ${img.tag}`;
    writeFileSync(`${dir}/${img.name}.svg`, svg(img.width, img.height, project.color, title));
  }
}

console.log('Wrote 12 placeholder SVGs.');
```

- [ ] **Step 2: Run it from the project root**

```bash
node /tmp/gen-placeholders.mjs
```
Expected: `Wrote 12 placeholder SVGs.`, and the 12 files listed above now exist under `src/assets/projects/`.

- [ ] **Step 3: Verify the output**

```bash
find src/assets/projects -name '*.svg' | wc -l
find src/assets/projects -name '*.svg' -exec grep -L '</svg>' {} \;
```
Expected: first command prints `12`; second command prints nothing (every file is well-formed enough to
contain a closing `</svg>` tag).

- [ ] **Step 4: Commit**

```bash
git add src/assets/projects
git commit -m "Add generated placeholder SVG images for case studies

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Content, data, and rendering

This is the core deliverable: the collection schema, the curated sets, the three case studies, the MDX
layout components they use, and every component and route that renders them. See the note in *File
Structure* above for why this isn't split further.

**Files:**
- Create: `src/content.config.ts`
- Create: `src/data/sets.ts`
- Create: `src/components/mdx/FullBleed.astro`
- Create: `src/components/mdx/SideBySide.astro`
- Create: `src/components/mdx/Caption.astro`
- Create: `src/content/projects/marketplace-homepage-redesign.mdx`
- Create: `src/content/projects/wearable-onboarding.mdx`
- Create: `src/content/projects/design-system-migration.mdx`
- Create: `src/styles/global.css`
- Create: `src/layouts/Layout.astro`
- Create: `src/components/ProjectCard.astro`
- Create: `src/components/SetView.astro`
- Modify: `src/pages/index.astro` (overwrite the scaffold default)
- Create: `src/pages/for/[set].astro`
- Create: `src/pages/work/[...id].astro`
- Create: `src/pages/work/index.astro`

**Interfaces:**
- Consumes: the 12 SVGs from Task 2, at paths
  `src/assets/projects/<id>/{cover,full-bleed,side-left,side-right}.svg`.
- Produces: a working site at `/`, `/for/acme`, `/work`, and `/work/<id>` for each of the three ids
  `marketplace-homepage-redesign`, `wearable-onboarding`, `design-system-migration`.

- [ ] **Step 1: Content collection schema**

Create `src/content.config.ts`:
```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      cover: image(),
      coverAlt: z.string(),
    }),
});

export const collections = { projects };
```

- [ ] **Step 2: Curated sets**

Create `src/data/sets.ts`:
```ts
export interface Set {
  intro: string;
  projects: { id: string; why?: string }[];
}

export const sets: Record<string, Set> = {
  default: {
    intro: "I'm a staff product designer working on complex, systems-heavy problems.",
    projects: [
      { id: 'marketplace-homepage-redesign' },
      { id: 'wearable-onboarding' },
      { id: 'design-system-migration' },
    ],
  },
  acme: {
    intro: 'Three projects on design systems at scale, closest to what we talked through Tuesday.',
    projects: [
      { id: 'design-system-migration', why: 'Same migration problem you described, at ~40 surfaces.' },
      { id: 'marketplace-homepage-redesign', why: 'Where the system met a high-traffic surface.' },
      { id: 'wearable-onboarding', why: 'Constraint-heavy work, if that maps to your hardware side.' },
    ],
  },
};
```

- [ ] **Step 3: MDX layout component — FullBleed**

Create `src/components/mdx/FullBleed.astro`:
```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props {
  src: ImageMetadata;
  alt: string;
}

const { src, alt } = Astro.props;
---

<figure class="full-bleed">
  <Image src={src} alt={alt} />
</figure>

<style>
  .full-bleed {
    margin-inline: calc(50% - 50vw);
    width: 100vw;
    max-width: 100vw;
    margin-block: 2rem;
  }
  .full-bleed :global(img) {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
```

- [ ] **Step 4: MDX layout component — SideBySide**

Create `src/components/mdx/SideBySide.astro`:
```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props {
  left: { src: ImageMetadata; alt: string };
  right: { src: ImageMetadata; alt: string };
}

const { left, right } = Astro.props;
---

<div class="side-by-side">
  <Image src={left.src} alt={left.alt} />
  <Image src={right.src} alt={right.alt} />
</div>

<style>
  .side-by-side {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-block: 2rem;
  }
  .side-by-side :global(img) {
    display: block;
    width: 100%;
    height: auto;
  }
  @media (max-width: 640px) {
    .side-by-side {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 5: MDX layout component — Caption**

Create `src/components/mdx/Caption.astro`:
```astro
<p class="caption"><slot /></p>

<style>
  .caption {
    font-size: 0.875rem;
    color: var(--color-muted);
    text-align: center;
    margin-top: 0.5rem;
  }
</style>
```

- [ ] **Step 6: Case study — Marketplace Homepage Redesign**

Create `src/content/projects/marketplace-homepage-redesign.mdx`:
```mdx
---
title: "Marketplace Homepage Redesign"
summary: "Rebuilt a high-traffic marketplace homepage around intent-based navigation, cutting time-to-first-listing-view by 40% without touching backend search."
cover: ../../assets/projects/marketplace-homepage-redesign/cover.svg
coverAlt: "Homepage layout split into three intent-based entry zones"
---

import FullBleed from '../../components/mdx/FullBleed.astro';
import SideBySide from '../../components/mdx/SideBySide.astro';
import Caption from '../../components/mdx/Caption.astro';
import fullBleed from '../../assets/projects/marketplace-homepage-redesign/full-bleed.svg';
import sideLeft from '../../assets/projects/marketplace-homepage-redesign/side-left.svg';
import sideRight from '../../assets/projects/marketplace-homepage-redesign/side-right.svg';

The marketplace homepage had one job for two very different visitors: browsers who wanted to be surprised, and searchers who already knew what they were looking for. It served both with the same three rows of trending listings, and session recordings showed the mismatch immediately — casual visitors scrolled once and bounced, while returning buyers repeated the same search from the homepage every time because there was no faster path back to it.

<FullBleed src={fullBleed} alt="Redesigned homepage showing three intent-based entry zones above the fold" />

Card sorts and a round of contextual interviews split visitor intent into three groups: browsing with no target in mind, replacing something specific, and comparing a shortlist before buying. That mapped cleanly onto three homepage zones — a discovery feed, a jump-back-in strip keyed to recent searches, and a comparison shelf for saved listings — replacing the single generic feed with three that a visitor could self-select into within the first screen.

<SideBySide
  left={{ src: sideLeft, alt: "Original homepage with a single trending-listings feed" }}
  right={{ src: sideRight, alt: "Redesigned homepage with discovery, jump-back-in, and comparison zones" }}
/>
<Caption>Before: one undifferentiated feed. After: three intent-led zones, ordered by how often each was used in testing.</Caption>

The redesign shipped behind a 50/50 split test over six weeks. Time-to-first-listing-view dropped 40% in the treatment group, and the jump-back-in strip alone accounted for a third of homepage-originated searches within the first month — traffic that had previously gone through the search bar every single visit.

The three-zone pattern outlived the homepage. The comparison shelf became a shared component used on category pages six months later, and the zone-based layout was the first place engineering and design agreed on a shared token set for card spacing — the seed of the design system work that followed.
```

- [ ] **Step 7: Case study — Wearable Onboarding**

Create `src/content/projects/wearable-onboarding.mdx`:
```mdx
---
title: "Wearable Onboarding"
summary: "Designed the first-run experience for a health-tracking wearable, taking setup completion from 61% to 89% across a five-minute, screen-constrained flow."
cover: ../../assets/projects/wearable-onboarding/cover.svg
coverAlt: "Wearable device displaying the pairing confirmation screen"
---

import FullBleed from '../../components/mdx/FullBleed.astro';
import SideBySide from '../../components/mdx/SideBySide.astro';
import Caption from '../../components/mdx/Caption.astro';
import fullBleed from '../../assets/projects/wearable-onboarding/full-bleed.svg';
import sideLeft from '../../assets/projects/wearable-onboarding/side-left.svg';
import sideRight from '../../assets/projects/wearable-onboarding/side-right.svg';

The wearable's first-run flow had nine screens crammed onto a 24mm display with no keyboard, and it assumed a quiet, indoor setup. In practice people were pairing it on a couch with the TV on, in a store aisle, or outdoors in direct sunlight where the screen was barely readable — and setup completion sat at 61%, with most drop-off in the first three screens.

<FullBleed src={fullBleed} alt="Wearable device showing step two of the redesigned pairing flow" />

Most of what those nine screens asked for — timezone, units, notification preferences — was already sitting in the paired phone's settings. The redesign moved everything answerable from existing data onto the phone app, cutting the on-watch flow to three screens: pair, confirm on wrist, and one screen for anything the phone genuinely didn't know, like wrist placement for the heart-rate sensor.

<SideBySide
  left={{ src: sideLeft, alt: "Original nine-screen on-watch setup flow" }}
  right={{ src: sideRight, alt: "Redesigned three-screen flow with setup detail handled on the phone" }}
/>
<Caption>Before: nine on-watch screens. After: three, with setup detail handled on the paired phone.</Caption>

Sunlight legibility got its own pass separate from the flow itself — a higher-contrast mode that triggered automatically above a brightness threshold, since no amount of flow simplification fixes a screen nobody can read outdoors. Error recovery mid-pairing (dropped Bluetooth, wrong phone selected) got explicit retry screens instead of silently restarting the whole sequence, which testing showed was the single biggest source of abandoned setups.

Setup completion moved from 61% to 89% after the phone-assisted flow shipped, and average setup time dropped from just under six minutes to under two. The pattern of pushing configuration to whichever device could handle it best became the default approach for every wearable surface that followed.
```

- [ ] **Step 8: Case study — Design System Migration**

Create `src/content/projects/design-system-migration.mdx`:
```mdx
---
title: "Design System Migration"
summary: "Led the migration of ~40 product surfaces onto a new design system, replacing one-off components with tokens and shared primitives without freezing feature work."
cover: ../../assets/projects/design-system-migration/cover.svg
coverAlt: "Grid of token-based button, input, and card components"
---

import FullBleed from '../../components/mdx/FullBleed.astro';
import SideBySide from '../../components/mdx/SideBySide.astro';
import Caption from '../../components/mdx/Caption.astro';
import fullBleed from '../../assets/projects/design-system-migration/full-bleed.svg';
import sideLeft from '../../assets/projects/design-system-migration/side-left.svg';
import sideRight from '../../assets/projects/design-system-migration/side-right.svg';

Forty product surfaces had each grown their own version of the same handful of components — five different button implementations, three date pickers, spacing values chosen by eye. None of it was wrong exactly, but every surface handled focus states, disabled states, and responsive behavior slightly differently, and every new feature meant re-deciding things that should have been settled once.

<FullBleed src={fullBleed} alt="Token-based component library showing button, input, and card primitives" />

A full freeze to migrate everything at once wasn't realistic with feature work still shipping, so the migration ran surface-by-surface behind an adapter layer: old component APIs stayed in place and internally rendered the new primitives, so teams picked up the visual and accessibility fixes immediately without touching their own code, and did a real code migration to the new components on their own schedule.

<SideBySide
  left={{ src: sideLeft, alt: "Settings surface before migrating off one-off components" }}
  right={{ src: sideRight, alt: "Settings surface after migrating to native design system components" }}
/>
<Caption>A settings surface before and after migrating off the adapter layer onto native design system components.</Caption>

A small dashboard tracked adoption per surface — percentage of components still on the adapter versus migrated natively — which turned migration from an invisible background task into something teams could see progress on and were willing to prioritize. Thirty-one of the forty surfaces were fully migrated within the two quarters after launch; the rest stayed on the adapter layer, which was an acceptable outcome since it still delivered the consistency fixes.

Token usage — spacing, color, type scale — became close to universal well before component migration finished, since tokens were a much smaller change to adopt than swapping component implementations. That ordering, tokens first and components on their own timeline, is the main thing worth repeating on the next migration.
```

- [ ] **Step 9: Global styles**

Create `src/styles/global.css`:
```css
:root {
  --color-text: #1f2937;
  --color-muted: #6b7280;
  --color-bg: #ffffff;
  --color-border: #e5e7eb;
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2.5rem;
  --content-width: 70ch;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
}

.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.site-title {
  font-weight: 600;
  color: inherit;
  text-decoration: none;
}

.site-header nav a {
  color: inherit;
  text-decoration: none;
}

main {
  max-width: 960px;
  margin-inline: auto;
  padding: var(--space-4) var(--space-3);
}

article {
  max-width: var(--content-width);
  margin-inline: auto;
}

article img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

h1, h2, h3 {
  line-height: 1.25;
}
```

- [ ] **Step 10: Layout**

Create `src/layouts/Layout.astro`:
```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  noindex?: boolean;
}

const { title, noindex = false } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    {noindex && <meta name="robots" content="noindex" />}
  </head>
  <body>
    <header class="site-header">
      <a class="site-title" href="/">Design Portfolio</a>
      <nav>
        <a href="/work">Work</a>
      </nav>
    </header>
    <main>
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 11: ProjectCard**

Create `src/components/ProjectCard.astro`:
```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

interface Props {
  entry: CollectionEntry<'projects'>;
  why?: string;
}

const { entry, why } = Astro.props;
---

<a class="project-card" href={`/work/${entry.id}`}>
  <Image class="project-card__cover" src={entry.data.cover} alt={entry.data.coverAlt} width={480} height={320} />
  <h3 class="project-card__title">{entry.data.title}</h3>
  <p class="project-card__summary">{entry.data.summary}</p>
  {why && <p class="project-card__why">{why}</p>}
</a>

<style>
  .project-card {
    display: block;
    color: inherit;
    text-decoration: none;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
  }
  .project-card__cover {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 2;
    object-fit: cover;
  }
  .project-card__title {
    margin: var(--space-2) var(--space-2) 0;
  }
  .project-card__summary {
    margin: var(--space-1) var(--space-2) 0;
    color: var(--color-muted);
  }
  .project-card__why {
    margin: var(--space-1) var(--space-2) var(--space-2);
    font-style: italic;
  }
</style>
```

- [ ] **Step 12: SetView**

Create `src/components/SetView.astro`:
```astro
---
import { getCollection } from 'astro:content';
import ProjectCard from './ProjectCard.astro';
import type { Set } from '../data/sets';

interface Props {
  set: Set;
}

const { set } = Astro.props;
const all = await getCollection('projects');

const picked = set.projects.map(({ id, why }) => {
  const entry = all.find((e) => e.id === id);
  if (!entry) throw new Error(`Unknown project id "${id}"`);
  return { entry, why };
});
---

<p class="intro">{set.intro}</p>
<div class="set-grid">
  {picked.map(({ entry, why }) => <ProjectCard entry={entry} why={why} />)}
</div>
<p class="see-all"><a href="/work">See all work</a></p>

<style>
  .intro {
    max-width: 60ch;
    font-size: 1.125rem;
  }
  .set-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--space-3);
    margin-block: var(--space-3);
  }
  .see-all {
    margin-top: var(--space-3);
  }
</style>
```

- [ ] **Step 13: Homepage**

Overwrite `src/pages/index.astro`:
```astro
---
import Layout from '../layouts/Layout.astro';
import SetView from '../components/SetView.astro';
import { sets } from '../data/sets';
---

<Layout title="Design Portfolio">
  <SetView set={sets.default} />
</Layout>
```

- [ ] **Step 14: Curated links**

Create `src/pages/for/[set].astro`:
```astro
---
import Layout from '../../layouts/Layout.astro';
import SetView from '../../components/SetView.astro';
import { sets } from '../../data/sets';

export const getStaticPaths = () =>
  Object.keys(sets)
    .filter((s) => s !== 'default')
    .map((set) => ({ params: { set } }));
---

<Layout title="Selected work" noindex>
  <SetView set={sets[Astro.params.set!]} />
</Layout>
```

- [ ] **Step 15: Case study page**

Create `src/pages/work/[...id].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<Layout title={entry.data.title}>
  <article>
    <h1>{entry.data.title}</h1>
    <Content />
  </article>
</Layout>
```

- [ ] **Step 16: Full catalogue**

Create `src/pages/work/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import ProjectCard from '../../components/ProjectCard.astro';

const projects = await getCollection('projects');
---

<Layout title="All work">
  <div class="work-grid">
    {projects.map((entry) => <ProjectCard entry={entry} />)}
  </div>
</Layout>

<style>
  .work-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.5rem;
  }
</style>
```

- [ ] **Step 17: Build and verify**

```bash
npm run build
```
Expected: the log ends with `6 page(s) built` (`/`, `/for/acme`, `/work`, and the three `/work/<id>`
pages) and no errors.

```bash
grep -q 'Marketplace Homepage Redesign' dist/index.html \
  && grep -q 'Wearable Onboarding' dist/index.html \
  && grep -q 'Design System Migration' dist/index.html \
  && echo "HOMEPAGE_OK"
```
Expected: `HOMEPAGE_OK`.

```bash
grep -q 'Same migration problem you described' dist/for/acme/index.html && echo "ACME_WHY_OK"
```
Expected: `ACME_WHY_OK` — confirms `/for/acme` rendered the curated `why` copy.

```bash
grep -q 'noindex' dist/for/acme/index.html && echo "ACME_NOINDEX_OK"
grep -q 'noindex' dist/index.html && echo "HOMEPAGE_WRONGLY_NOINDEXED" || echo "HOMEPAGE_NOINDEX_ABSENT_OK"
```
Expected: `ACME_NOINDEX_OK` then `HOMEPAGE_NOINDEX_ABSENT_OK`.

```bash
ls dist/work/marketplace-homepage-redesign/index.html dist/work/wearable-onboarding/index.html dist/work/design-system-migration/index.html
```
Expected: all three paths listed, no "No such file" error.

```bash
grep -q 'full-bleed' dist/work/marketplace-homepage-redesign/index.html \
  && grep -q 'side-by-side' dist/work/marketplace-homepage-redesign/index.html \
  && grep -q 'caption' dist/work/marketplace-homepage-redesign/index.html \
  && echo "MDX_COMPONENTS_OK"
```
Expected: `MDX_COMPONENTS_OK` — confirms the MDX layout components actually rendered inside the case
study body, not just that the build succeeded.

- [ ] **Step 18: Negative test — a typo'd id must fail the build naming the id**

This is the one runnable check `PLAN.md` calls out by design (the `throw` in `SetView.astro`). Prove it
actually fires, per Definition of Done item 4.

```bash
sed -i '' "s/id: 'wearable-onboarding'/id: 'wearable-onboardingg'/" src/data/sets.ts
npm run build
```
Expected: the build **fails**, and the error output contains `Unknown project id "wearable-onboardingg"`.

Revert the typo:
```bash
sed -i '' "s/id: 'wearable-onboardingg'/id: 'wearable-onboarding'/" src/data/sets.ts
npm run build
```
Expected: succeeds again, `6 page(s) built`.

- [ ] **Step 19: Commit**

```bash
git add src/content.config.ts src/data/sets.ts src/components src/content/projects src/styles src/layouts src/pages
git commit -m "Add content collection, curated sets, and rendering for the portfolio POC

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: End-to-end verification

Automated build checks in Task 3 prove the HTML contains the right strings. This task confirms it
actually reads and looks right, per the instruction to check UI changes in a real browser before calling
the work done.

**Files:** none — verification only. Any fix discovered here should be a small, targeted edit to the
file responsible, committed on its own.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```
Expected: server starts on `http://localhost:4321/`.

- [ ] **Step 2: Check the homepage (`/`)**

Open `http://localhost:4321/` in a browser. Confirm:
- Three case study cards render (Marketplace Homepage Redesign, Wearable Onboarding, Design System
  Migration), each with a colored placeholder cover image, title, and summary.
- No `why` text appears on any card (the `default` set doesn't set one).
- The intro line reads *"I'm a staff product designer working on complex, systems-heavy problems."*
- A "Work" link in the header and a "See all work" link both go to `/work`.

- [ ] **Step 3: Check the curated link (`/for/acme`)**

Open `http://localhost:4321/for/acme`. Confirm:
- The intro reads *"Three projects on design systems at scale, closest to what we talked through
  Tuesday."*
- Cards appear in this order: Design System Migration, Marketplace Homepage Redesign, Wearable
  Onboarding.
- Each card shows its `why` line in italics, matching `sets.ts`.
- View page source and confirm `<meta name="robots" content="noindex">` is present in `<head>`.

- [ ] **Step 4: Check the full catalogue (`/work`)**

Open `http://localhost:4321/work`. Confirm all three case studies are listed, none showing a `why` line.

- [ ] **Step 5: Check each case study page**

Open `/work/marketplace-homepage-redesign`, `/work/wearable-onboarding`, and
`/work/design-system-migration`. For each, confirm:
- The title renders as an `<h1>`.
- Body paragraphs render.
- The full-bleed image visually breaks out wider than the surrounding text column.
- The side-by-side pair renders as two images in a row (stacking if the window is narrowed below
  ~640px).
- The caption renders as small muted text under the side-by-side pair.
- View page source and confirm no `<meta name="robots" content="noindex">` is present.

- [ ] **Step 6: Final production build**

```bash
npm run build
npm run preview
```
Open the printed preview URL and spot-check `/` and `/for/acme` once more against the static build
output, not just the dev server.

- [ ] **Step 7: Confirm the Definition of Done**

Walk the checklist from `docs/superpowers/specs/2026-08-08-composable-portfolio-design.md` and confirm
each item, referencing the check that proved it:

1. The 3 case studies live in `src/content/projects/` as MDX — confirmed by directory listing.
2. `/` renders `sets.default` through `SetView` — confirmed in Step 2.
3. `/for/acme` shows the 3 case studies in order with intro and `why` — confirmed in Step 3.
4. A typo'd id fails `astro build` naming the id — confirmed in Task 3 Step 18.
5. `/work/<id>` renders each case study's body with images and all three MDX layout components used at
   least once — confirmed in Step 5 (and Task 3 Step 17's `MDX_COMPONENTS_OK`).
6. `/for/acme` carries `noindex`; `/` does not — confirmed in Step 3 and Task 3 Step 17.
7. `/work/index.astro` lists all 3 case studies via `ProjectCard` — confirmed in Step 4.

If any fix was needed during this task, stage only the files changed for that fix and commit separately
with a message describing what was wrong.
