---
id: P02
title: Tax-year schema, loader and build-time validation
status: pending
depends: [P00]
agent: app-builder
---

# P02 — Tax data schema and loader

## Read first

- [`../spec/data-model.md`](../spec/data-model.md) — **authoritative**; the JSON sketch there is the target shape
- [`../decisions/adr-0002-tax-data-as-versioned-json.md`](../decisions/adr-0002-tax-data-as-versioned-json.md)

## Task

`src/lib/tax/schema.ts` — a Zod schema for a tax-year file, and `src/lib/tax/load.ts` to
load and validate every file in `data/tax-years/` **at build time**.

The schema must enforce, and fail loudly on:

- Every leaf value object carries a `src` — **no exceptions, this is the point**
- Every `src` resolves to a key in the file's `sources` map
- Rates are integers in basis points, 0–10000; amounts are non-negative integers
- Exactly one band per table has `width: null`, and it is last
- `period` is 1 April to 31 March, twelve months
- Where a cap declares `maxRateBp`, no band's capped rate exceeds it
- Every `rateCaps[].appliesToSchedule` names a schedule that exists
- `conditions[].ifNotMet` is either `null` or an existing schedule id
- Instalment due dates fall within, or shortly after, `period`
- `status` is one of `proposed | enacted | superseded`

Export inferred TypeScript types. The engine consumes those types, never a hand-written
duplicate that can drift.

Also generate `data/schema/tax-year.schema.json` from the Zod schema so the files are
editable with editor validation by someone who does not read TypeScript. That is the whole
point of the data being JSON.

## Do not

- Make `src` optional "for now"
- Add a data file — P03 owns that
- Allow floats anywhere

## Acceptance

- `npm run typecheck` and `npm run test` pass
- Unit tests prove the schema **rejects**: a missing `src`; a dangling `src`; a float
  rate; two `null`-width bands; a `maxRateBp` violation; a bad `period`
- A deliberately malformed fixture fails `npm run build`, not just the test run —
  validation must be wired into the build, or it is decoration

## Report

The rejection tests you wrote, and confirmation that a malformed file breaks the build.
