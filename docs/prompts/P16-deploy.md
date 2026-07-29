---
id: P16
title: CI pipeline and GitHub Pages deployment
status: in-progress
depends: [P15]
agent: app-builder
---

# P16 — CI and deployment

## Read first

- [`../spec/site-architecture.md`](../spec/site-architecture.md) — deployment
- [`../../.github/workflows/docs.yml`](../../.github/workflows/docs.yml) — the existing docs workflow

## Task

**Extend CI.** The docs workflow already runs the citation and source-extraction checks.
Add, in this order:

1. `node scripts/check-citations.mjs` — cheapest, catches the error class that matters most
2. `node scripts/prompt-status.mjs --check` — the index must not drift from the prompts
3. `npm run typecheck`
4. Schema validation of every data file
5. The fixture suite, **reporting verified and unverified fixtures separately**
6. `npm run build`

**Deploy** to GitHub Pages on push to the default branch. Build only; no server, no
runtime secrets.

**A Content-Security-Policy** with no external hosts. The site self-hosts its fonts and
makes no third-party requests; the CSP should make that structural rather than a
convention that erodes.

## Do not

- Add analytics, error reporting, or any third-party script
- Deploy from a branch other than the default
- Let the build succeed when a data file fails validation
- Reorder CI so an expensive step runs before the cheap ones

## Acceptance

- CI fails when: a citation is missing; INDEX.md is stale; a type errors; a data file is
  malformed; a fixture fails; the build breaks. **Verify each by deliberately breaking it**
  — a pipeline nobody has watched fail is not known to work.
- A successful run publishes the site and it loads
- The deployed site makes zero third-party requests — check the network panel
- Guidance pages ship zero JavaScript in production, except the theme toggle carved out
  by P01's own acceptance criteria (pre-paint script + sub-1 KB toggle; see
  `src/build-output.test.ts` for the enforced byte budget and the precedent)

## Report

The six deliberate-break results, and the network-panel confirmation.
