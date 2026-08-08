# Composable portfolio

**Goal:** hand a client, recruiter, or hiring manager a URL like `/for/acme` showing 3–5 case
studies chosen for them, each framed with a line about why it's relevant to that conversation.

**Assumptions:** fresh Astro 7.2 install, no existing code or content structure. A collection of
projects, each a case study mixing visuals and text. All work is public. Links are created by
editing a file and deploying.

---

## Shape of the thing

Two data sources, and the split matters:

- **Case studies are content.** Long-form, mixed prose and images, edited like writing. They live
  in a content collection as MDX.
- **Sets are configuration.** A named list of ids plus some copy. A TypeScript file, versioned,
  three lines to add one.

Everything else follows from that. The homepage, `/for/acme`, and any future curated link are the
same renderer pointed at different sets — the homepage is just the set named `default`. There is no
separate "featured" concept and no second code path to keep in sync.

## Decisions

| Question | Answer | Consequence |
|---|---|---|
| Stack | Astro 7.2 | Content Layer API; check integrations for Vite 8 support |
| Case study body content? | Yes, visuals + text | Content collection, MDX, not a data array |
| Private/NDA work? | No, everything public | No auth, no gated routes |
| Per-link custom copy? | Yes — "half the value" | Set-level intro **and** per-project framing |
| Create links without deploying? | No | Static output, every set prebuilt |

**Rejected:**
- **Query-param filter** (`/?p=a,b,c`) — nowhere to put custom copy, and it can't do per-project
  framing at all. Only revisit if links must be made without a deploy.
- **Checkbox picker UI** — you're writing a sentence per project anyway, so you're in the editor
  regardless. Add it if this becomes a several-times-a-week habit.
- **Database + admin UI + short IDs** — auth, CRUD, and a hosting surface to replace a text file.
- **Tags and a filter UI** — hand-picking three case studies is the point. Tags are a way to avoid
  deciding which three. Revisit only if you have enough sets that assembling one feels like work.
- **Employer-based grouping** — organizes a portfolio as a career history. Curated links are
  relevance-driven, and relevance is about the kind of problem, not the logo above it.

---

## Step 0 — Scaffold

```sh
npm create astro@latest -- --template minimal
npx astro add mdx
```

Confirm it resolved to Astro 7.x. If `@astrojs/mdx` has no Vite 8 compatible release yet, stop and
say so — sitting on 6.x is a reasonable answer and nothing else in this plan changes.

Three v7 behaviors that will otherwise look like bugs: the Rust compiler is now the only compiler,
so unclosed tags are hard errors and invalid HTML is no longer silently corrected; `compressHTML`
defaults to `'jsx'` and strips more whitespace, which can visibly jam inline elements together; and
`src/fetch.ts` is a reserved filename.

## Step 1 — The content collection

```
src/content/projects/
  marketplace-homepage-redesign.mdx
  wearable-onboarding.mdx
  ...
```

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),      // real value proposition, not "contact me for details"
      cover: image(),
      coverAlt: z.string(),
    }),
});

export const collections = { projects };
```

The `image()` schema helper validates the cover exists and hands `<Image>` an optimized asset.
Images inside the MDX body get optimized too, as long as they're relative imports rather than
`public/` paths. That's the whole image story — no glob map, no `image2x`/`imageSm` fields.

Name case studies for what they are, not their position in a nav. Descriptive titles mean ids are
naturally unique, `summary` carries real information, and you never need employer-prefixed slugs to
disambiguate three projects all called "Homepage."

**Use these spellings.** Older Astro idioms are far more common in the wild and will feel right;
they no longer exist. If you find yourself writing something in the right column, stop.

| Correct | Do not use |
|---|---|
| `src/content.config.ts` | `src/content/config.ts` |
| `loader: glob({ ... })` in `defineCollection` | bare `defineCollection({ schema })` |
| `entry.id` | `entry.slug` |
| `render(entry)` imported from `astro:content` | `entry.render()` |
| `getEntry('projects', id)` | `getEntryBySlug()`, `getDataEntryById()` |

`entry.id` is slug-based, not filename-based; the filename is on `filePath` if you need it.

## Step 2 — Sets

```ts
// src/data/sets.ts
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

`why` is where the value is. A single intro above an unchanged grid is the cheap version of
"tailored"; a line per project saying why *this* one is in front of *this* reader is the version
that lands. Leave it off in `default`, where there's no specific reader to address.

Keep this file separate from the route. Astro hoists `getStaticPaths`, so a `const` declared beside
it in the same frontmatter is a temporal-dead-zone bug waiting for someone to reorder the file.

## Step 3 — One renderer, two entry points

```astro
---
// src/components/SetView.astro
import { getCollection } from 'astro:content';
import ProjectCard from './ProjectCard.astro';
import type { Set } from '../data/sets';

const { set } = Astro.props as { set: Set };
const all = await getCollection('projects');

const picked = set.projects.map(({ id, why }) => {
  const entry = all.find((e) => e.id === id);
  if (!entry) throw new Error(`Unknown project id "${id}"`);
  return { entry, why };
});
---
<p class="intro">{set.intro}</p>
{picked.map(({ entry, why }) => <ProjectCard entry={entry} why={why} />)}
```

The `throw` is the one runnable check this feature needs: a typo'd id fails `astro build` instead of
quietly shipping a page with two case studies where you meant three.

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import SetView from '../components/SetView.astro';
import { sets } from '../data/sets';
---
<Layout title="…"><SetView set={sets.default} /></Layout>
```

```astro
---
// src/pages/for/[set].astro
import Layout from '../../layouts/Layout.astro';
import SetView from '../../components/SetView.astro';
import { sets } from '../../data/sets';

export const getStaticPaths = () =>
  Object.keys(sets)
    .filter((s) => s !== 'default')
    .map((set) => ({ params: { set } }));
---
<Layout title="Selected work" noindex><SetView set={sets[Astro.params.set!]} /></Layout>
```

Filtering out `default` keeps `/for/default` from existing as a duplicate homepage.

`sets.default` is the homepage: three to five standout case studies, changed by editing that one
list. Because a set shows only what it names, every page built from `SetView` needs a link to
`/work` so a reader who wants the full catalogue can get there. Put it in `SetView` itself rather
than per page — it applies equally to the homepage and to curated links.

Two `getStaticPaths` rules in force since v6, both already satisfied: params must be strings
(`Object.keys` returns strings), and the `Astro` object is off-limits inside the function — this
reads `Astro.params` in the component body instead. If you need the site URL in there, it's
`import.meta.env.SITE`.

**Two components this plan references but does not specify.** Write them however you like; only the
contracts matter.

- `src/layouts/Layout.astro` — props `{ title: string; noindex?: boolean }`. When `noindex` is true
  it emits `<meta name="robots" content="noindex">` in `<head>`. Holds whatever site chrome exists.
- `src/components/ProjectCard.astro` — props `{ entry: CollectionEntry<'projects'>; why?: string }`.
  Renders `entry.data.cover` through `<Image>`, the title, the summary, and `why` when present, all
  linking to `/work/${entry.id}`. Take the whole entry rather than eight individual props so its
  inputs can't drift from the schema, and so you're never spreading a record full of non-display
  fields toward a DOM element.

Styling is out of scope for the proof of concept. Unstyled semantic markup is a fine result.

## Step 4 — Case study pages and the index

```astro
---
// src/pages/work/[...id].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<Layout title={entry.data.title}><Content /></Layout>
```

`src/pages/work/index.astro` lists every case study — a flat list from `getCollection('projects')`,
no employer headings or grouping. Curated sets override the order with their own.

Give the MDX body a small set of layout components (full-bleed image, side-by-side pair, caption)
and use them from within case studies. Case studies vary — some are image-led, some argument-led —
and a single rigid template will fight the ones that don't match it.

## Step 5 — Keeping curated pages out of search

Curated pages carry `<meta name="robots" content="noindex">` via a layout prop. One recruiter
finding the page written for another is a bad look, and the intro copy is written for one reader by
design. If you add `@astrojs/sitemap`, exclude `/for/*` there as well.

---

## Definition of done

For a proof of concept, write three or four placeholder case studies with real-ish prose, a cover
image, and at least one in-body image between them. Lorem ipsum hides layout problems; a few
paragraphs of plausible text surfaces them.

1. Case studies live in `src/content/projects/` as MDX; adding one is adding a file.
2. The homepage renders `sets.default` through the same component `/for/acme` uses.
3. `/for/acme` shows exactly the listed case studies, in the listed order, with the intro and each
   project's `why`.
4. A typo'd id fails `astro build` with a message naming the id.
5. `/work/<id>` renders each case study's body with its images optimized.
6. `/for/*` carries `noindex` and is absent from the sitemap; the homepage carries neither.
7. Adding a curated link touches exactly one file: `src/data/sets.ts`.

## Out of scope

A checkbox picker UI, tags or filtering, per-set theming, and analytics on link opens. None are
needed to ship, and each is easier to judge once a few real curated pages exist.

---

## Assumptions — decided, not open questions

These are settled. They're recorded so a future reader knows they were chosen rather than
overlooked. If you are building from this plan, build as specified and do not re-open them.

**Static output means no link without a deploy.** Every set is prebuilt. That was your call and it
buys real simplicity, but it's the assumption that would be most expensive to reverse later, since
it implies an adapter and a hosting change rather than a code tweak.

**`/for/acme` is guessable, and the copy is not reader-neutral.** All the work is public, so nothing
sensitive leaks. But "closest to what we talked through Tuesday" reads strangely to anyone who
wasn't there, and naming sets after companies means a competitor's name is one URL guess away. Using
opaque slugs costs nothing if that bothers you.

**One case study equals one project.** If a single engagement deserves three separate case studies,
or one case study spans several projects, the id-per-entry model needs a second thought.

**A card is enough on a curated page.** The set view shows cover, title, summary, and `why`. For a
high-stakes pitch you might want a pulled excerpt or a second image. Worth deciding after you look
at a real one.

**You author in the repo.** No CMS, no web editor. Fine if you're comfortable committing MDX;
a blocker if you ever want to assemble a set from a phone between meetings.
