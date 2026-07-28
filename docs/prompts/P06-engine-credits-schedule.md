---
id: P06
title: Engine part 3 — credits and the payment schedule
status: pending
depends: [P05]
agent: engine-builder
---

# P06 — Credits and payment schedule

## Read first

- [`../spec/calculation-engine.md`](../spec/calculation-engine.md) — steps 7 and 8
- [`../research/10-compliance-calendar.md`](../research/10-compliance-calendar.md) — the statutory formula

## Task

**Credits**, in order: APIT deducted, AIT/WHT withheld, foreign tax credit. Each retained
separately in the result so a user can check it against their certificates.

Foreign tax credit is calculated **separately for each source and for each gain**, capped
at the average Sri Lankan rate applied to that foreign income [IRA s.81(1)], and allowed
only if the foreign tax was paid within two years of the end of the year in which the
income was derived [IRA s.81(2)].

`taxPayable = max(0, grossTax − credits)`, and **surface the excess explicitly** — whether
it is refundable or carried forward is unresolved (Q20), so it must not vanish into the
floor.

**Payment schedule.** Instalments are not a quarter each. Implement [IRA s.90(3)]:

```
instalment = (A − C) / B
A = estimated tax payable (an INPUT, distinct from the computed liability)
B = instalments remaining, including this one
C = tax already paid for the year before this due date
```

Dates come from the data [IRA s.90(2)(a)]. **The fourth instalment falls in the following
year of assessment** — a model assuming four dates inside the year is wrong.

**Return due date is derived**: `period.to` plus the data's `monthsAfterYearEnd`
[IRA s.93(1)]. Never read a stored literal, never read the clock.

Rounding: round each instalment to the rupee, put the residue on the final payment, so the
schedule sums exactly to the liability.

## Do not

- Assume the estimate equals the computed liability — they routinely differ, and that
  difference is the whole point of the final payment
- Silently floor away excess credit
- Compute the return deadline from `Date.now()`

## Acceptance

- Instalments plus final payment sum **exactly** to the liability, for a spread of
  awkward amounts (property test)
- A case where the estimate differs from the final liability produces a correct schedule
- The fourth instalment date is in the following Y/A — asserted
- Return due date derives correctly, including a leap year
- Credits exceeding gross tax: `taxPayable` is 0 **and** `credits.excess` is the surplus
- Foreign tax credit capped at the average rate — asserted with a case where the foreign
  rate exceeds the Sri Lankan one

## Report

The rounding-residue property test, and the estimate-differs-from-liability case.
