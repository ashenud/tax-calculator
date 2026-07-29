# Site architecture

> **Status:** spec — no code exists yet
> **Related:** [`../decisions/adr-0001-static-site-astro.md`](../decisions/adr-0001-static-site-astro.md)

## Shape

Astro + React islands + TypeScript, deployed as static files to GitHub Pages.

The site is roughly half explanation and half tool. Astro suits that split: the guidance
pages ship as static HTML with **zero JavaScript**, and only the calculator hydrates.
Someone searching "sri lanka freelancer tax remittance" should land on a page that
renders instantly and is indexable; someone using the calculator gets an interactive
island.

## Layout

```
src/
  pages/
    index.astro                       what this is, who it's for, the disclaimer
    calculator/
      index.astro                     the whole calculator, hydrating one island
                                      (see the correction below)
    guides/
      foreign-currency-income.astro   from research/05 + persona p1
      employer-not-deducting.astro    from research/06 + persona p2
      filing-your-return.astro        from research/11
      deadlines.astro                 from research/10
    rates/
      [year].astro                    published rate tables per Y/A, with citations
    about/
      sources.astro                   the provenance register, rendered
      changelog.astro                 what changed, when, under which act

  components/
    calculator/                       React island — the only hydrated code
      TaxCalculator.tsx
      IncomeInputs.tsx
      ConditionQuestions.tsx          renders taxYear.conditions — never hardcoded
      ResultBreakdown.tsx             every pipeline step, not just the total
      PaymentSchedule.tsx
      Warnings.tsx                    renders TaxResult.warnings
    Disclaimer.astro                  persistent, on every page
    AsAtStamp.astro                   "figures as at <date>, Y/A <year>"
    Citation.astro                    renders a src pointer as a linked reference

  lib/
    tax/
      engine.ts                       pure; see calculation-engine.md
      schema.ts                       Zod schema; see data-model.md
      load.ts                         loads and validates data/tax-years/*.json
    format.ts                         LKR formatting — display only, never in maths

data/tax-years/*.json                 the tax data
docs/                                 this documentation
scripts/check-citations.mjs           guardrail
```

### Correction, P10 — the calculator is one route, not two

This document originally put the persona picker at `calculator/index.astro` and the
calculator itself at `calculator/[persona].astro`. That cannot be built, and the
correction is recorded here rather than left for each later prompt to rediscover.

Changing persona would be a navigation between two prerendered pages, so everything
entered would be lost. [`ui-behaviour.md`](ui-behaviour.md) draws it the other way — its
primary flow has "change persona" as an arrow looping back *within* one flow — and
[`../prompts/P10-calculator-island.md`](../prompts/P10-calculator-island.md) makes it an
acceptance criterion: "a user can change persona mid-flow without losing entered
figures". The persona is also "a routing convenience, not a constraint", which a route
per persona contradicts in the plainest way available.

So there is one page, `calculator/index.astro`, which loads the tax-year data at build
time and hydrates one island holding persona, year, every figure and every condition
answer. The component names below are still broadly right; `IncomeInputs.tsx` was built
as `IncomeSections.tsx`, and `ResultBreakdown.tsx` / `PaymentSchedule.tsx` / `Warnings.tsx`
belong to P12 (warnings in fact landed in P09 as `WarningList`).

## Principles

**Tax data is loaded and validated at build time.** A malformed or unsourced data file
fails the build rather than reaching a user. There is no runtime fetch of rates — the
site is static, and a rate that could change between page load and calculation would
undermine the "as at" stamp.

**The engine never touches the DOM and the UI never does arithmetic.** Formatting is
display-only. If a component computes a subtotal to render it, that subtotal is not
covered by the fixture suite — so it must come from `TaxResult` instead.

**Questions come from data.** `ConditionQuestions.tsx` renders `taxYear.conditions`. When
a future amendment adds a condition, it appears in the UI without a code change. Hard
-coding "were these earnings remitted through a bank to Sri Lanka?" into a component would
break the promise the data model exists to make.

**Year of assessment is always explicit and always selectable.** Never inferred from the
system clock. In July 2026 a user might be filing for Y/A 2025/26, estimating for
2026/27, or amending 2023/24 — all three are ordinary. Defaulting to "now" and hiding
the selector produces silent wrong answers for two of those three.

**The result shows its working.** `ResultBreakdown` renders every pipeline step with the
citation for each rate applied. A user who cannot see how a figure was reached cannot
check it, and this tool's whole value proposition is being checkable.

## Disclaimer placement

Per [`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md):

- `Disclaimer.astro` in the base layout — every page, no exceptions
- `AsAtStamp.astro` adjacent to every computed figure, not only in the footer
- `Warnings.tsx` rendered above the result, not below it and not collapsed
- A `proposed`-status tax year is labelled as not-yet-law wherever its figures appear

None of these are candidates for removal in a visual cleanup pass.

## Deployment

GitHub Actions → GitHub Pages, on push to the default branch.

CI runs, in order: `check-citations.mjs`, typecheck, schema validation of every data
file, the fixture suite, then the Astro build. The citation check runs first because it
is the cheapest and catches the class of error that matters most.

## Accessibility and reach

- Works without JavaScript for every guidance page
- Server-rendered rate tables — a user can read the numbers even if the island fails
- Mobile-first; a large share of Sri Lankan users are phone-only
- Print stylesheet for the result — people take a printout to their tax practitioner

## Deliberately out of scope

- No accounts, no login, no server. Nothing the user enters leaves their browser, which
  is the correct posture for income data and removes a whole class of obligation.
- No analytics that record entered figures.
- No filing integration. This tool prepares a person to file; it does not file.
- No advice engine. See rule 6 in [`../../CLAUDE.md`](../../CLAUDE.md).
