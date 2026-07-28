---
id: P00
title: Project scaffold — Astro, React, TypeScript, Tailwind, Vitest
status: done
depends: []
agent: app-builder
---

# P00 — Project scaffold

## Read first

- [`../spec/site-architecture.md`](../spec/site-architecture.md) — the directory layout is specified there
- [`../decisions/adr-0001-static-site-astro.md`](../decisions/adr-0001-static-site-astro.md) — why this stack

## Task

Create the buildable skeleton. No features, no tax logic, no pages beyond a placeholder.

- `package.json` with scripts: `dev`, `build`, `preview`, `test`, `typecheck`, `lint`
- **Astro 6**, **React 19**, **TypeScript strict**, **Tailwind CSS v4.3** via
  `@tailwindcss/vite` — *not* `@astrojs/tailwind`, which does not support Astro 6
- **Vitest** for unit tests, configured to run `src/**/*.test.ts`
- `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`
- ESLint + Prettier, minimal config, no bikeshedding
- Directory skeleton exactly as `site-architecture.md` specifies, with `.gitkeep` where empty
- One placeholder `src/pages/index.astro` that renders a heading

**Confirm current stable versions before pinning.** The spec was written 2026-07-28 and
versions move. If a major has landed since, use it and note the change in your report.

## Do not

- Add a UI component library, state manager, router, or CSS framework beyond Tailwind
- Add any tax logic, data file, or content — later prompts own those
- Configure analytics of any kind

## Acceptance

```bash
npm install
npm run typecheck    # exits 0
npm run build        # exits 0, emits dist/
npm run test         # exits 0 (no tests yet is fine; a failing runner is not)
```

Plus: `npm run build` produces **zero JavaScript** for the placeholder page. Verify by
checking the built HTML has no module script tag. This is the property the whole
architecture rests on; if it fails now it will never be recovered later.

## Report

Versions actually installed, any deviation from the spec's directory layout and why, and
confirmation of the zero-JS check.
