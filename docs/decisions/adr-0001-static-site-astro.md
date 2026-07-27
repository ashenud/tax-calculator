# ADR 0001 — Static site on Astro with React islands

**Status:** accepted · **Date:** 2026-07-27

## Context

The tool must compute Sri Lankan individual income tax and explain it. Two things are
true about the audience that shape the choice:

- Much of the value is **explanatory**. Someone searching "sri lanka freelancer tax
  foreign income" needs a page that ranks, loads fast, and reads well. The calculator is
  useless to a person who never learns the remittance condition exists.
- Many users are **phone-only, on variable connections**. Shipping a large JavaScript
  bundle to read a rate table is a real cost, not a theoretical one.

The tool handles income figures, so keeping data on the user's device is worth a lot.
There is no reason to run a server: rate data changes a few times a year and can be baked
in at build time.

## Decision

**Astro + React islands + TypeScript**, built to static files and deployed to GitHub
Pages.

Guidance pages, rate tables and the sources register render as static HTML with zero
JavaScript. Only the calculator hydrates as a React island.

## Consequences

**Good**

- Guidance pages are indexable and work without JavaScript — including the rate tables,
  so the numbers stay readable even if the island fails
- Nothing a user types leaves their browser; no server, no logs, no data-handling
  obligations
- Free hosting, no infrastructure to maintain between budget cycles — which matters for
  a project whose maintenance is bursty and volunteer-shaped
- Tax data validated at build time; a malformed data file fails CI rather than reaching
  a user
- React is available where interactivity genuinely helps, without paying for it
  site-wide

**Costs**

- Two mental models (Astro components and React components) and the hydration boundary
  to keep straight
- Every data change requires a rebuild and redeploy. Acceptable — rates change a handful
  of times a year, and the "figures as at" stamp is more honest when it corresponds to a
  build
- Astro is a smaller ecosystem than Next.js; some integrations need more work

## Alternatives considered

**Vite + React SPA.** Simplest to build, and the calculator alone would justify it. But
every guidance page becomes client-rendered — poor for search, and the rate tables
become invisible without JavaScript. The explanatory half of the site is not a secondary
concern here; it is most of the value.

**Next.js static export.** Familiar and capable, but heavier than needed for a site with
no server, and adds configuration friction on GitHub Pages. Its strengths are in
server-rendering and data fetching, neither of which this project has.

**Plain HTML/CSS/vanilla JS.** Genuinely attractive for longevity — no toolchain to rot,
anyone can edit. Rejected because the project needs multiple years of tax data, a typed
calculation engine, and a fixture suite. Hand-maintaining rate tables in HTML across
several years of assessment reintroduces exactly the transcription errors the data model
exists to prevent.
