---
id: P05
title: Engine part 2 — separately-rated components, the rate cap, and refusal
status: done
depends: [P04]
agent: engine-builder
---

# P05 — Components, cap, refusal

## Read first

- [`../spec/calculation-engine.md`](../spec/calculation-engine.md) — steps 4 and 5
- [`../research/05-foreign-currency-service-income.md`](../research/05-foreign-currency-service-income.md) — why the cap is a cap
- [`../research/09-terminal-benefits.md`](../research/09-terminal-benefits.md) — the tables and the "only the remainder" pattern

## Task

**Separately-rated components.** Carve `capital-gain`, `terminal-benefit` and
`special-business` out of taxable income, rate each on its own basis, and put **only the
remainder** on the ladder [IRA Sch.1 para 1(2)(d), as enacted 2017]. Terminal benefits
select their table by `serviceYears` against the data's threshold.

**The maximum-rate cap.** `foreign-capped` income is *not* a separate schedule. Run the
ladder and cap the rate per band:

```
effectiveRateBp = min(bandRateBp, cap.maxRateBp)
```

Evaluate the cap's condition first. If unmet, the cap does not apply and the ladder stands
— there is no fallback schedule; `ifNotMet` is `null`.

**Refusal.** Where the taxpayer has **both** capped and uncapped ordinary income, the Act
does not say which occupies the lower bands. Return a refusal: no figure, a code, and an
explanation naming Q14.

## This is the prompt most likely to be got wrong

The temptation is to model the cap as a two-band table — 6% then 15% — because that is
what every secondary source says and it gives the right answer for the simple case. **Do
not.** That encodes the *output* of the rule instead of the rule, and it breaks silently
the moment a band moves. Cap the ladder.

The second temptation is to resolve the mixed case with a reasonable-looking rule.
Resolving it is not yours to do — see
[`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md).

## Do not

- Add a `service-export-foreign` rate schedule to the data or the engine
- Guess the mixed-income ordering, even behind a flag or a comment saying "probably"
- Let a fixture encode a mixed-income number

## Acceptance

- Pure capped income: first band at 6%, everything above at 15% — arrived at **by capping
  the ladder**, verified by a test that changes a band rate in a fixture and sees the
  capped result change accordingly
- Same gross, condition unmet: full ladder, up to 36%
- Mixed capped and uncapped: **returns a refusal, not a number** — asserted
- Terminal benefit on each table; the service-length boundary at exactly the threshold
- Capital gain rated separately, remainder on the ladder
- A `maxRateBp` violation in data **throws**, not silently overcharges
- Any rate with `verified: false` that is actually applied produces a warning

## Report

The cap-not-table test, the refusal test, and confirmation no mixed-income figure exists
anywhere in the fixtures.
