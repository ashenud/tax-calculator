# Build prompts — index

The application is built by running these prompts **in order**. Each is self-contained:
it names what to read, what to produce, and how to know it worked. Each ends with a
verification step, and a prompt is only `done` when that step passes.

## How to run them

```bash
node scripts/prompt-status.mjs next          # what to run now
/run-prompt P04                              # execute it
node scripts/prompt-status.mjs list          # where we are
```

`/run-prompt` loads the prompt, dispatches the right agent, runs the verification, and
sets the status. Do not set a status by hand unless you are correcting a mistake.

## Status

`status:` in each prompt's front matter is the **single source of truth**. The table below
is generated from it by `node scripts/prompt-status.mjs sync`, and CI fails if it has
drifted. Two hand-maintained copies of the same state diverge, and a stale index claiming
`done` for something half-built is worse than no index.

| Icon | Status | Meaning |
|---|---|---|
| ☐ | `pending` | not started |
| ◐ | `in-progress` | started, not verified |
| ☑ | `done` | **compiled and its acceptance checks passed** |
| ⛔ | `blocked` | cannot proceed; the prompt says why |

**`done` is earned, not asserted.** It means the build ran and the acceptance criteria in
that prompt were checked. `prompt-status.mjs set <id> done` refuses if a dependency is
unfinished.

<!-- STATUS-TABLE:START -->
**9 of 17 complete.**

| | ID | Prompt | Status | Depends on | |
|---|---|---|---|---|---|
| ☑ | `P00` | [Project scaffold — Astro, React, TypeScript, Tailwind, Vitest](P00-scaffold.md) | done | — |  |
| ☑ | `P01` | [Design tokens, base layout, and the ADR-0003 invariants](P01-design-tokens-shell.md) | done | P00 |  |
| ☑ | `P02` | [Tax-year schema, loader and build-time validation](P02-tax-data-schema.md) | done | P00 |  |
| ☑ | `P03` | [Y/A 2025/2026 tax data file](P03-data-2025-26.md) | done | P02 |  |
| ☑ | `P04` | [Engine part 1 — partition, deduction, the normal ladder](P04-engine-core.md) | done | P03 |  |
| ☑ | `P05` | [Engine part 2 — separately-rated components, the rate cap, and refusal](P05-engine-components.md) | done | P04 |  |
| ☑ | `P06` | [Engine part 3 — credits and the payment schedule](P06-engine-credits-schedule.md) | done | P05 |  |
| ☑ | `P07` | [Fixture harness — worked examples become the test suite](P07-fixture-harness.md) | done | P06 |  |
| ☑ | `P08` | [UI primitives, including the currency field](P08-ui-primitives.md) | done | P01 |  |
| ☐ | `P09` | [The ADR-0003 components — warnings, refusals, citations, year selector](P09-constrained-components.md) | pending | P08, P07 |  |
| ☐ | `P10` | [Calculator island — persona picker, year, question groups](P10-calculator-island.md) | pending | P09 | waiting on P09 |
| ☐ | `P11` | [The remittance route picker — the question that distinguishes this tool](P11-remittance-route-picker.md) | pending | P10 | waiting on P10 |
| ☐ | `P12` | [Result panel — refusals, warnings, the figure, the working, the schedule](P12-result-panel.md) | pending | P11 | waiting on P11 |
| ☐ | `P13` | [Rates pages, sources register and changelog — generated from data](P13-rates-and-sources-pages.md) | pending | P09, P03 | waiting on P09 |
| ☐ | `P14` | [Guidance pages from the research documents](P14-guidance-pages.md) | pending | P13 | waiting on P13 |
| ☐ | `P15` | [Print stylesheet and full accessibility audit](P15-print-and-accessibility.md) | pending | P12, P14 | waiting on P12, P14 |
| ☐ | `P16` | [CI pipeline and GitHub Pages deployment](P16-deploy.md) | pending | P15 | waiting on P15 |
<!-- STATUS-TABLE:END -->

## Phases

**Foundation (P00–P03)** — scaffold, tokens, schema, data. Nothing user-visible. Get this
wrong and everything downstream inherits it.

**Engine (P04–P07)** — the calculation, built in three slices with fixtures behind them.
No UI. The engine is testable in isolation and must be tested that way, because a wrong
number is this project's only unrecoverable failure.

**Interface (P08–P12)** — primitives, then the constrained components ADR-0003 requires,
then the calculator itself.

**Content and release (P13–P16)** — pages generated from data and research, accessibility,
deployment.

## Rules that apply to every prompt

These are not repeated in each file. They bind regardless.

1. **No tax figure without a citation.** In code, that means every rate reaching the UI
   carries its `src`. See [`../../CLAUDE.md`](../../CLAUDE.md).
2. **Integer rupees. No floats in any calculation path.** Rates are basis points.
3. **Every figure is scoped to a year of assessment.** A function that computes tax
   without being told the Y/A is a bug.
4. **The engine refuses rather than guesses.** Unresolved treatment produces a refusal,
   never a plausible number.
5. **ADR-0003 invariants are not negotiable** — persistent disclaimer, as-at stamp beside
   every figure, warnings above the result and never collapsed.
6. **Do not invent tax data.** If a value is missing from `data/tax-years/`, stop and say
   so. Do not fill it from memory; that is the exact failure this repo is built against.
7. **Adding a year of assessment must not require code changes.** If a prompt tempts you
   to special-case a year in the engine, the schema is wrong — stop and raise it.

## If a prompt is wrong

The prompts were written before the code existed and will contain mistakes. If one
contradicts the specs, **the specs win** — they are traceable to the Act. Fix the prompt,
say so in the report, and carry on. Do not implement something you believe to be wrong
because a prompt said it.
