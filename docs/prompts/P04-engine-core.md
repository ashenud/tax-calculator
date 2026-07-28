---
id: P04
title: Engine part 1 — partition, deduction, the normal ladder
status: in-progress
depends: [P03]
agent: engine-builder
---

# P04 — Engine core

## Read first

- [`../spec/calculation-engine.md`](../spec/calculation-engine.md) — **authoritative**, steps 1–3 and 6

## Task

`src/lib/tax/engine.ts`. A pure function; no I/O, no clock, no globals.

Implement steps 1, 2, 3 and the band walk of step 6:

1. **Assessable income per head**, each amount carrying its tags
2. **Partition** into `reliefEligible` and `reliefIneligible` — `capital-gain` goes to the
   latter. This happens *before* any deduction.
3. **Deduction**: the aggregate Fifth Schedule amount (personal relief + qualifying
   payments) as **one step** [IRA s.52(1)], applied **once** to `reliefEligible` only,
   floored at zero.
4. **Band walk**: `floor(bandAmount * rateBp / 10000)` per band, **floor per band then
   sum** — never sum-then-round.

Return the `TaxResult` shape from the spec, populated as far as this slice goes. Leave
later fields present but empty rather than absent, so downstream prompts extend rather
than reshape.

## The two errors this slice exists to prevent

**Relief applied per head.** It is applied once, to the aggregate. This produces a
plausible wrong answer and is the commonest mistake in the domain.

**Relief applied to capital gains.** It is not available against gains from realisation
[IRA Sch.5 para 2(a), as enacted 2017]. Pooling gains with income before deducting
overstates relief and understates tax.

Both must have a failing-before-fixing test.

## Do not

- Use floats anywhere, including intermediate values
- Read the current date
- Resolve any rate from anywhere but the `taxYear` argument
- Implement the cap, the separately-rated components, credits, or the schedule — later
  prompts, and doing them here will produce a tangle

## Acceptance

- Income below the relief threshold → zero tax
- Each band boundary, just below and just above, computes correctly
- Relief applied once across two heads — asserted explicitly
- A capital gain plus ordinary income: **the gain is untouched by relief** — asserted
  explicitly
- Property test: output is always a non-negative integer for any non-negative integer input
- `npm run typecheck`, `npm run test` pass

## Report

The band-boundary cases you covered, and the two error-prevention tests.
