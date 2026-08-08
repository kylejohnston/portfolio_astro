# Overlay Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt the interaction pattern prototyped in `overlay-concept/` so clicking a case study link
from `/`, `/for/[set]`, or `/work` opens it in a sliding overlay instead of a full navigation, while
`/work/<id>` remains a fully real, standalone page when loaded directly.

**Architecture:** Purely additive client-side enhancement — no routing, content, or data changes.
Document-level click delegation intercepts links to `/work/*`, fetches the target's already-built
static HTML, extracts `<main>` via `DOMParser`, and injects it into an overlay panel, syncing the URL
via `history.pushState`. Closing calls `history.back()`, which naturally returns to wherever the
overlay was opened from.

**Tech Stack:** Vanilla JS (Fetch API, DOMParser, History API, `matchMedia`, native `inert` attribute),
plain CSS. No new dependencies.

## Global Constraints

- No new dependencies — Fetch/DOMParser/History API/`inert` are all native and sufficient.
- `overlay-concept/` is a reference prototype only — do not modify it or import from it.
- Case study links stay real `<a href="/work/<id>">` elements — only `event.preventDefault()` inside
  the click handler enables the overlay; with JS disabled or failed, links must still work as normal
  navigation.
- Trigger matching is href-prefix based (`/work/` but not exactly `/work`), not a hardcoded registry —
  a new case study (new MDX file) must get overlay behavior automatically, matching the existing
  project promise that adding a case study is adding one file.
- Closing always uses `history.back()`, never a hardcoded redirect — exactly one history entry is
  pushed per open, so this is what makes "return to the exact origin page" work with zero extra state.
- Respect `prefers-reduced-motion`, including a live `matchMedia` check at time-of-use (not just on
  initial load).
- **Full-bleed images must not visually overflow the overlay panel.** `FullBleed`'s existing breakout
  technique (`width: 100vw; margin-inline: calc(50% - 50vw)`) is relative to the true browser
  viewport, not to any ancestor — inside a `position: fixed` overlay panel that's deliberately
  narrower than the viewport, this would make the image spill out past the panel's edges over the
  backdrop. The fix is an overlay-scoped CSS override that makes `.full-bleed` fill the panel's own
  width instead of breaking out past it (see Task 2). This means Definition of Done item 8 below is
  "renders correctly, adapted to the panel width" rather than "pixel-identical" for `FullBleed`
  specifically — `SideBySide` and `Caption` have no viewport-relative sizing and render unchanged in
  both contexts.
- Background content (the page behind the overlay) gets the native `inert` attribute while the overlay
  is open, so a screen reader or keyboard user can't reach or read a now-hidden duplicate heading
  behind the modal. This is cheap (a few lines) and is the actually-effective way to back up
  `aria-modal="true"`, which alone isn't reliably honored by assistive tech.

---

## File Structure

```
src/scripts/overlay.js               — new file. All interaction logic.
src/layouts/Layout.astro             — add overlay markup + <script src> for overlay.js.
src/styles/global.css                — add relocated component styles (Task 1) + overlay styles and
                                        overlay-context overrides (Task 2).
src/components/mdx/FullBleed.astro   — remove <style> block (moved to global.css in Task 1).
src/components/mdx/SideBySide.astro  — remove <style> block (moved to global.css in Task 1).
src/components/mdx/Caption.astro     — remove <style> block (moved to global.css in Task 1).
```

No changes to any `src/pages/*.astro` route, `ProjectCard.astro`, `SetView.astro`,
`content.config.ts`, `sets.ts`, or MDX content files — the href-prefix matching means the existing
`<a href={`/work/${entry.id}`}>` markup in `ProjectCard.astro` already qualifies as-is.

Task 1 (pure refactor) and Task 2 (the actual feature) are separate because Task 1 has a clean,
independent verification — the site must render *exactly* as it did before, just with styles living
in a different file — while Task 2's correctness can only be judged once the overlay markup, script,
and CSS all exist together.

---

## Task 1: Relocate MDX layout component styles to global.css

**Files:**
- Modify: `src/components/mdx/FullBleed.astro`
- Modify: `src/components/mdx/SideBySide.astro`
- Modify: `src/components/mdx/Caption.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: nothing new.
- Produces: the same `.full-bleed`, `.side-by-side`, `.caption` classes and visual behavior as before,
  now defined in `global.css` instead of three per-component scoped `<style>` blocks. Task 2 depends
  on these classes already being global (not page-scoped) so it can add overlay-context override rules
  for them.

This is a pure refactor. The rendered HTML and visual output of `/work/<id>` pages must be unchanged
after this task — the only difference is that Astro no longer adds a `data-astro-cid-*` scoping
attribute to these elements (since there's no longer a component-level `<style>` block to scope),
which is expected and harmless — nothing in the codebase depends on that attribute.

- [ ] **Step 1: Move styles out of FullBleed.astro**

Replace `src/components/mdx/FullBleed.astro` with:
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
```

- [ ] **Step 2: Move styles out of SideBySide.astro**

Replace `src/components/mdx/SideBySide.astro` with:
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
```

- [ ] **Step 3: Move styles out of Caption.astro**

Replace `src/components/mdx/Caption.astro` with:
```astro
<p class="caption"><slot /></p>
```

- [ ] **Step 4: Add the relocated styles to global.css**

Append to the end of `src/styles/global.css` (note `:global(img)` from the old scoped styles becomes
plain `img` — everything in this file is already global, so Astro's scoped-style escape hatch syntax
doesn't apply and isn't needed):

```css
.full-bleed {
  margin-inline: calc(50% - 50vw);
  width: 100vw;
  max-width: 100vw;
  margin-block: 2rem;
}

.full-bleed img {
  display: block;
  width: 100%;
  height: auto;
}

.side-by-side {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-block: 2rem;
}

.side-by-side img {
  display: block;
  width: 100%;
  height: auto;
}

@media (max-width: 640px) {
  .side-by-side {
    grid-template-columns: 1fr;
  }
}

.caption {
  font-size: 0.875rem;
  color: var(--color-muted);
  text-align: center;
  margin-top: 0.5rem;
}
```

- [ ] **Step 5: Verify no regression**

```bash
npm run build
```
Expected: `6 page(s) built`, no errors.

```bash
grep -q 'class="full-bleed"' dist/work/marketplace-homepage-redesign/index.html \
  && grep -q 'class="side-by-side"' dist/work/marketplace-homepage-redesign/index.html \
  && grep -q 'class="caption"' dist/work/marketplace-homepage-redesign/index.html \
  && echo "CLASSES_OK"
```
Expected: `CLASSES_OK`.

Start the dev server (`npm run dev`) and visually compare `/work/marketplace-homepage-redesign`
against the same page before this change: the full-bleed image must still break out edge-to-edge, the
side-by-side pair must still render as two images in a row (stacking below 640px), and the caption
must still render as small centered muted text below the pair. No visual difference is expected or
acceptable in this task.

- [ ] **Step 6: Commit**

```bash
git add src/components/mdx/FullBleed.astro src/components/mdx/SideBySide.astro src/components/mdx/Caption.astro src/styles/global.css
git commit -m "Relocate MDX layout component styles to global.css

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Build the overlay

**Files:**
- Create: `src/scripts/overlay.js`
- Modify: `src/layouts/Layout.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: the `.full-bleed`/`.side-by-side`/`.caption` global classes from Task 1. The existing
  `Layout` props `{ title: string; noindex?: boolean }` are unchanged.
- Produces: a working overlay on every page. No new props, exports, or public interfaces — this is a
  self-contained DOM behavior keyed entirely off `href` values already present in the markup.

- [ ] **Step 1: Write the overlay script**

Create `src/scripts/overlay.js`:
```js
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('overlay');
  const overlayBackground = document.getElementById('overlayBackground');
  const closeOverlayBtn = document.getElementById('closeOverlay');
  const overlayContent = document.getElementById('overlayPageContent');
  const siteHeader = document.querySelector('.site-header');
  const siteMain = document.querySelector('main');

  const OVERLAY_PATH_PREFIX = '/work/';
  const TRANSITION_MS = 350;

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const contentCache = {};
  let lastFocusedElement = null;

  function isOverlayTarget(href) {
    if (!href) return false;
    let path;
    try {
      path = new URL(href, window.location.origin).pathname;
    } catch {
      return false;
    }
    return path.startsWith(OVERLAY_PATH_PREFIX) && path !== OVERLAY_PATH_PREFIX;
  }

  function setBackgroundInert(isInert) {
    if (siteHeader) siteHeader.inert = isInert;
    if (siteMain) siteMain.inert = isInert;
  }

  function showOverlay() {
    overlayBackground.style.display = 'block';
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
    overlayBackground.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overlay-open');
    setBackgroundInert(true);
    overlay.scrollTop = 0;

    if (prefersReducedMotion()) {
      overlay.classList.add('active');
    } else {
      requestAnimationFrame(() => overlay.classList.add('active'));
    }
  }

  function hideOverlay() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    overlayBackground.setAttribute('aria-hidden', 'true');
    setBackgroundInert(false);

    const timeoutDuration = prefersReducedMotion() ? 0 : TRANSITION_MS;
    setTimeout(() => {
      overlay.style.display = 'none';
      overlayBackground.style.display = 'none';
      document.body.classList.remove('overlay-open');
      overlayContent.innerHTML = '';
    }, timeoutDuration);

    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }

  function loadOverlayContent(url) {
    overlayContent.innerHTML = '<div class="overlay-loader">Loading content…</div>';

    if (contentCache[url]) {
      displayContent(contentCache[url].html, contentCache[url].title);
      return;
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load page (${response.status}: ${response.statusText})`);
        }
        return response.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const mainContent = doc.querySelector('main');

        if (!mainContent) {
          throw new Error('Main content not found on the page');
        }

        const title = doc.querySelector('title')?.textContent || document.title;
        contentCache[url] = { html: mainContent.innerHTML, title };
        displayContent(mainContent.innerHTML, title);
      })
      .catch((error) => displayError(url, error.message));
  }

  function displayContent(html, title) {
    overlayContent.innerHTML = html;
    if (title) {
      document.title = title;
      overlay.setAttribute('aria-label', title);
    }
  }

  function displayError(url, message) {
    overlayContent.innerHTML = `
      <div class="error-message">
        <p>Sorry, we couldn't load the requested content.</p>
        <p>Error: ${message}</p>
        <p><button id="retryButton">Try again</button></p>
      </div>
    `;
    document.getElementById('retryButton')?.addEventListener('click', () => loadOverlayContent(url));
  }

  function openOverlay(link) {
    const href = link.getAttribute('href');
    lastFocusedElement = link;
    showOverlay();
    loadOverlayContent(href);
    history.pushState({ overlayUrl: href }, '', href);
  }

  document.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const link = event.target.closest('a');
    if (!link || !isOverlayTarget(link.getAttribute('href'))) return;

    event.preventDefault();
    openOverlay(link);
  });

  closeOverlayBtn.addEventListener('click', (event) => {
    event.preventDefault();
    history.back();
  });

  overlayBackground.addEventListener('click', (event) => {
    if (event.target === overlayBackground) {
      history.back();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('active')) {
      history.back();
    }
  });

  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.overlayUrl) {
      showOverlay();
      loadOverlayContent(event.state.overlayUrl);
    } else if (overlay.classList.contains('active')) {
      hideOverlay();
    }
  });
});
```

**Why this differs from `overlay-concept/scripts.js`:** no `data-page`/`data-url` registry (href alone
drives everything), `closeOverlay` calls `history.back()` instead of hardcoding a return to `/`, no
`checkInitialURL` (unnecessary — every route here is already a real, independently-built static page),
and `setBackgroundInert` is new (the prototype has no equivalent).

- [ ] **Step 2: Add overlay markup and script to Layout.astro**

Replace `src/layouts/Layout.astro` with:
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
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
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

    <div class="overlay-background" id="overlayBackground" aria-hidden="true"></div>
    <div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="overlay-content">
        <div class="overlay-header">
          <button id="closeOverlay" aria-label="Close overlay">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div id="overlayPageContent"></div>
      </div>
    </div>

    <script src="../scripts/overlay.js"></script>
  </body>
</html>
```

(The `aria-label` on `#overlay` is set dynamically by `overlay.js` once content loads, rather than
pointing `aria-labelledby` at a separate visible title element in the header row — the fetched case
study's own `<h1>` is that title, and duplicating it as a second, smaller heading in the overlay chrome
would be redundant.)

- [ ] **Step 3: Add overlay styles to global.css**

Append to the end of `src/styles/global.css`:
```css
body.overlay-open {
  overflow: hidden;
}

.overlay-background {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: none;
  z-index: 998;
}

.overlay {
  position: fixed;
  top: 0;
  right: -100%;
  width: min(640px, 100%);
  height: 100%;
  background-color: var(--color-bg);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  transition: right 0.35s cubic-bezier(0.8, -0.4, 0.5, 1), opacity 0.35s;
  opacity: 0;
  z-index: 999;
  display: none;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.15);
}

.overlay.active {
  right: 0;
  opacity: 1;
}

.overlay-content {
  padding: var(--space-3);
}

.overlay-header {
  display: flex;
  justify-content: flex-end;
  padding-bottom: var(--space-1);
}

#closeOverlay {
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: var(--space-1);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

#closeOverlay:hover,
#closeOverlay:focus-visible {
  background-color: var(--color-border);
}

.overlay-loader {
  text-align: center;
  padding: var(--space-4);
  font-style: italic;
  color: var(--color-muted);
}

.error-message {
  background-color: rgba(220, 38, 38, 0.08);
  border-left: 4px solid #dc2626;
  padding: var(--space-2);
  margin: var(--space-2) 0;
}

#retryButton {
  background-color: var(--color-text);
  color: var(--color-bg);
  border: none;
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  border-radius: 4px;
}

#retryButton:hover {
  opacity: 0.85;
}

@media (max-width: 640px) {
  .overlay {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overlay {
    transition-duration: 0.01s;
  }
}

/* FullBleed's viewport-relative breakout (width: 100vw) would spill past the
   overlay panel's own edges, since vw units ignore ancestor bounds. Inside the
   overlay, fill the panel's content width instead of breaking out past it. */
.overlay .full-bleed {
  width: 100%;
  max-width: 100%;
  margin-inline: 0;
}

/* The overlay panel is capped at 640px, narrower than the 640px breakpoint
   SideBySide uses on the full page — inside the overlay it should always
   stack, regardless of the browser's true viewport width. */
.overlay .side-by-side {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 4: Verify the overlay opens, closes, and updates history**

```bash
npm run build
npm run dev
```

In a browser at `http://localhost:4321/`:
1. Click a case study card. Expected: the overlay slides in from the right showing that case study's
   title, body, and images; the URL bar shows `/work/<id>`; the tab title updates to match.
2. Click the ✕ button. Expected: the overlay slides out; the URL returns to `/`; focus returns to the
   card that was clicked.
3. Click a card again, then press the browser **back** button. Expected: same close behavior as the ✕
   button.
4. Click a card again, then press **Escape**. Expected: overlay closes.
5. Click a card again, then click the dark backdrop area (not the panel itself). Expected: overlay
   closes.
6. Navigate to `/for/acme`, open a card, close it. Expected: returns to `/for/acme`, not `/`.
7. Navigate to `/work`, open a card, close it. Expected: returns to `/work`.
8. With the browser DevTools "Emulate CSS prefers-reduced-motion: reduce" enabled, repeat step 1.
   Expected: overlay appears without a sliding animation (or a near-instant one).
9. Load `/work/marketplace-homepage-redesign` directly (paste the URL, not via a click). Expected: a
   normal full page — no overlay chrome visible, real `<h1>`, real site header, no dark backdrop.
10. With the overlay open on a case study containing a full-bleed image, confirm the image fills the
    overlay panel's width without extending past the panel's edges (no horizontal scrollbar, no image
    bleeding over the backdrop). Confirm the side-by-side pair stacks into a single column inside the
    overlay even at a wide desktop browser width.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/overlay.js src/layouts/Layout.astro src/styles/global.css
git commit -m "Add overlay navigation for case study links

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: End-to-end verification

**Files:** none — verification only. Any fix discovered here should be a small, targeted edit,
committed on its own.

- [ ] **Step 1: Re-run the original Definition of Done checks**

Confirm the original POC's behavior is unaffected by this change:
```bash
npm run build
grep -q 'noindex' dist/for/acme/index.html && echo "ACME_NOINDEX_OK"
grep -q 'noindex' dist/index.html && echo "HOMEPAGE_WRONGLY_NOINDEXED" || echo "HOMEPAGE_NOINDEX_ABSENT_OK"
```
Expected: `ACME_NOINDEX_OK`, then `HOMEPAGE_NOINDEX_ABSENT_OK`.

- [ ] **Step 2: Browser-verify every listing surface triggers the overlay**

Using the dev server, confirm cards on `/`, `/for/acme`, and `/work` all open their case study in the
overlay (not a full navigation) and all three case studies (not just one) work correctly, including
each one's full-bleed image, side-by-side pair, and caption rendering correctly inside the overlay.

- [ ] **Step 3: Confirm direct-load parity for all three case studies**

Load `/work/marketplace-homepage-redesign`, `/work/wearable-onboarding`, and
`/work/design-system-migration` directly. Confirm each renders as a normal standalone page identical
to its pre-overlay appearance (full-bleed still breaks out to the true viewport edge on a direct load —
only the overlay context constrains it).

- [ ] **Step 4: Confirm background inertness**

With an overlay open, open the browser DevTools accessibility tree (or run
`document.querySelector('main').inert` in the console) and confirm it reports `true` while the overlay
is open and `false` after closing.

- [ ] **Step 5: Production build check**

```bash
npm run build
npm run preview
```
Spot-check the same interactions (open/close/back/direct-load) against the production build, not just
the dev server.

- [ ] **Step 6: Confirm the Definition of Done from the spec**

Walk `docs/superpowers/specs/2026-08-08-overlay-navigation-design.md`'s Definition of Done list and
confirm each of the 8 items, referencing which step above proved it. If any fix was needed, stage only
the changed files and commit separately with a message describing what was wrong.
