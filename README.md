# Composable portfolio

A proof-of-concept portfolio site built on Astro. A homepage and any number of curated links (e.g.
`/for/acme`) render the same set of case studies through one shared component, each with its own
intro copy and per-project framing for the recipient. See `PLAN.md` for the architecture and
`docs/superpowers/specs/2026-08-08-composable-portfolio-design.md` for the POC scope.

## Commands

| Command           | Action                                      |
| :----------------- | :------------------------------------------ |
| `npm install`       | Install dependencies                        |
| `npm run dev`       | Start local dev server at `localhost:4321`  |
| `npm run build`     | Build production site to `./dist/`          |
| `npm run preview`   | Preview the production build locally        |
