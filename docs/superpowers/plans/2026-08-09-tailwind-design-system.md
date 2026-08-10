# Tailwind Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Tailwind CSS v4 and make the brand design tokens — colors, the `AtTextualVAR`
variable font, the type scale, and the responsive grid — available across the site, with zero visual
change to any existing page.

**Architecture:** `npx astro add tailwind` wires the Vite plugin automatically. The only hand-written
change is a `@theme` block plus an explicit, Preflight-excluding CSS import prepended to the existing
`src/styles/global.css` — everything already in that file stays exactly as it is, below the new lines.

**Tech Stack:** Astro 7.2, `@tailwindcss/vite` + `tailwindcss` v4.3.x (added by `astro add`), no other
new dependencies.

## Global Constraints

- Tailwind's default CSS import (`@import "tailwindcss";`) must NOT be used — it pulls in Preflight, a
  base reset that zeroes default margins on headings/paragraphs and strips list styles, unscoped to
  whether any Tailwind utility is actually used. Use the explicit per-layer import that omits
  `preflight.css` instead (confirmed against a real build in the design phase — see the spec).
- No existing `.astro` file changes. This plan only touches `astro.config.mjs` (via the CLI),
  `package.json`/lockfile (via the CLI), and `src/styles/global.css` (by hand, prepending only).
- `--font-primary` is a distinct custom token name, not an override of Tailwind's built-in
  `--font-sans` — nothing should start rendering in the new font as a side effect of this plan.
- `--text-base` intentionally overrides Tailwind's stock 16px default to 20px, per the source spec.
- The grid (`grid grid-cols-6 gap-4 px-4 md:grid-cols-12 md:gap-6 md:px-12`) needs no custom `@theme`
  entries — Tailwind's default spacing scale already lands exactly on 16px/24px/48px, and 768px is
  already the stock `md` breakpoint. Do not add custom spacing or breakpoint tokens for it.
- The end state must be visually identical to the current site. This is the acceptance bar for the one
  task in this plan — a diff in generated CSS is expected and fine; a diff in rendered pixels is not.

---

## File Structure

```
astro.config.mjs        — Vite plugin added automatically by `astro add tailwind`
package.json / lockfile  — @tailwindcss/vite + tailwindcss added automatically
src/styles/global.css    — Tailwind import + @theme block prepended; everything currently in this
                            file (58 lines of hand-rolled component/overlay CSS) stays unchanged below it
src/assets/fonts/AtTextualVAR.woff2 — already present, untracked; committed as part of this task
```

---

## Task 1: Install Tailwind and add design tokens

**Files:**
- Modify: `astro.config.mjs` (via CLI)
- Modify: `package.json`, `package-lock.json` (via CLI)
- Modify: `src/styles/global.css` (by hand — prepend only, nothing existing changes)
- Create (commit): `src/assets/fonts/AtTextualVAR.woff2` (already on disk, currently untracked)

**Interfaces:**
- Consumes: nothing new.
- Produces: `--color-ink`, `--color-muted`, `--color-paper`, `--color-accent`, `--text-sm`,
  `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl` (each with a paired `--text-*--line-height`),
  and `--font-primary` as theme tokens, plus their corresponding Tailwind utility classes
  (`bg-ink`/`text-ink`, `text-2xl`, `font-primary`, etc.) — available for any future page/component to
  use. No current file consumes any of these yet.

- [ ] **Step 1: Install Tailwind**

```bash
npx astro add tailwind --yes
```

Expected: reports installing `@tailwindcss/vite` and `tailwindcss` (v4.3.x), and modifies
`astro.config.mjs` to:

```js
// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

(Exact final shape may differ slightly in how the CLI merges with the existing `mdx()` integration —
what matters is that `@tailwindcss/vite`'s `tailwindcss()` ends up in `vite.plugins`, alongside the
existing `integrations: [mdx()]` untouched.)

The CLI will **not** modify any CSS file — it prints a reminder to import a stylesheet yourself. That's
expected; Step 3 below does this by hand.

- [ ] **Step 2: Commit the font asset**

```bash
git add src/assets/fonts/AtTextualVAR.woff2
git commit -m "Add AtTextualVAR variable font asset

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Add the Tailwind import and design tokens to global.css**

Prepend the following to the very top of `src/styles/global.css`, above the existing `:root { ... }`
block (do not modify anything currently in the file — this is a pure prepend):

```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);

@font-face {
  font-family: "AtTextual";
  src: url("../assets/fonts/AtTextualVAR.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}

@theme {
  --color-ink: #231A1A;
  --color-muted-brand: #7F7676;
  --color-paper: #FBF9F9;
  --color-accent: #FF8888;

  --font-primary: "AtTextual", sans-serif;

  --text-sm: 16px;
  --text-sm--line-height: 1.5;
  --text-base: 20px;
  --text-base--line-height: 1.6;
  --text-lg: 26px;
  --text-lg--line-height: 1.4;
  --text-xl: 34px;
  --text-xl--line-height: 1.2;
  --text-2xl: 52px;
  --text-2xl--line-height: 1.1;
}

```

Note the color token is named `--color-muted-brand`, not `--color-muted` — the existing file already
declares its own `--color-muted: #6b7280;` a few lines below (a plain CSS custom property, not a
Tailwind theme token) and is actively used by several existing rules (`.caption`, `.overlay-loader`,
etc.). Reusing the exact name would shadow/conflict with the existing one. Keep both: the new
`--color-muted-brand` (Tailwind token, generates `bg-muted-brand`/`text-muted-brand` utilities) sits
alongside the untouched, still-in-use `--color-muted`. Do not rename or touch the existing one — that
would be restyling, which is out of scope for this task.

The blank line at the end (before the pre-existing `:root { ... }`) is intentional, just for
readability separating the new block from the existing file content.

- [ ] **Step 4: Verify the build**

```bash
npm run build
```

Expected: `6 page(s) built`, no errors.

```bash
grep -o '@layer theme{[^}]*}' dist/index.html | head -c 400
```
Expected: output includes `--color-ink:#231a1a`, `--color-accent:#f88` (Tailwind normalizes the hex),
`--text-base:20px`, `--font-primary` — confirming the theme tokens compiled in.

```bash
grep -o 'base,components' dist/index.html
```
Expected: `base,components` appears with **nothing** between `@layer` and this (i.e. the base layer is
empty) — confirms Preflight was correctly excluded. If this grep instead shows a large block of CSS
between `@layer` and `components`, Preflight leaked in and Step 3 needs to be re-checked against the
exact import syntax above.

- [ ] **Step 5: Verify the font asset is bundled correctly**

```bash
find dist/_astro -iname "AtTextualVAR*"
```
Expected: one fingerprinted file, e.g. `dist/_astro/AtTextualVAR.<hash>.woff2`.

```bash
grep -o '@font-face{[^}]*}' dist/index.html
```
Expected: `src:url(/_astro/AtTextualVAR.<hash>.woff2)format("woff2-variations")` — the same hash as the
file found above, confirming the `@font-face` rule points at the real bundled asset, not the raw
source path.

- [ ] **Step 6: Confirm zero visual regression**

Start the dev server and compare against the site's current appearance (homepage, `/for/acme`,
`/work`, a case study page, and the overlay opened from each) — every one of these was already
verified working in the previous two plans on this branch's ancestry, so this step is a parity check,
not first-time verification:

```bash
npm run dev
```

Visit `/`, `/for/acme`, `/work`, `/work/marketplace-homepage-redesign`, and open/close the overlay from
at least one listing page. Expected: no visible difference from before this task — same fonts
(system stack, unchanged), same colors, same spacing, same grid/card layout, overlay still opens and
closes correctly on all four close paths. This confirms Preflight exclusion actually worked in a real
browser, not just in the generated CSS.

- [ ] **Step 7: Commit**

```bash
git add astro.config.mjs package.json package-lock.json src/styles/global.css
git commit -m "Install Tailwind CSS v4 and add brand design tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
