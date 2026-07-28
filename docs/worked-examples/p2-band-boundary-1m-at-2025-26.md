---
id: p2-band-boundary-1m-at-2025-26
persona: p2
yearOfAssessment: "2025/2026"
verified: true

input:
  residency: resident
  income:
    employment:
      - label: Salary from a manufacturing firm in Kandy, 12 months
        amount: 2800000

expected:
  assessableByHead: { employment: 2800000, business: 0, investment: 0, other: 0 }
  partition: { reliefEligible: 2800000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 1000000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 1000000
      bands:
        - amount: 1000000
          rateBp: 600
          effectiveRateBp: 600
          tax: 60000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 60000
  grossTax: 60000
  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }
  taxPayable: 60000
  schedule:
    instalments: []
    finalPayment: { due: "", amount: 0 }
    returnDue: "2026-11-30"
  warnings: []
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
    - "ira-2017#s.93(1)"
---

# P2 — taxable income exactly at the top of the 6% band, Y/A 2025/2026

## Facts

Nadeesha is a [persona P2](../personas/p2-employee-no-apit.md) taxpayer: an employee of a
small firm — here a manufacturer in Kandy — whose payslip shows EPF and no income tax, so
nothing is deducted at source. She is a different person from Rajitha in
[`p2-below-relief-threshold-2025-26.md`](p2-below-relief-threshold-2025-26.md); the persona
describes a *pattern*, and this document sits at the other end of it, where the liability
is real.

She is resident in Sri Lanka. For Y/A 2025/2026 (1 April 2025 – 31 March 2026) she was paid
Rs. 2,800,000 in salary and allowances. She has no other income, made no qualifying
payments, and filed no Statement of Estimated Tax.

Rs. 2,800,000 is chosen for one reason: after the personal relief it leaves taxable income
of **exactly Rs. 1,000,000**, which is the width of the first rate band. The boundary is
where an off-by-one is invisible to inspection and permanent once tested, so this fixture
pins it. Its pair,
[`p2-band-boundary-1m-over-2025-26.md`](p2-band-boundary-1m-over-2025-26.md), is the same
taxpayer with a Rs. 1,000-a-month increment, and nothing else changed.

## Computation

| Step | Amount | Authority |
|---|---|---|
| Employment income | 2,800,000 | — |
| Business, investment, other | 0 | — |
| **Total assessable income** | **2,800,000** | [IRA s.3, s.5] |
| Relief-eligible portion | 2,800,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **1,000,000** | [IRA s.52(1)] |

Personal relief and qualifying payments are one deduction of the aggregate Fifth Schedule
amount, not two successive steps [IRA s.52(1)]. There are no qualifying payments here, so
the aggregate is the relief alone: Rs. 1,800,000 [PN/IT/2025-01, para 1].

### Rate schedule

Nothing is carved out. There is no terminal benefit, no special business income and no
capital gain, so the whole of taxable income goes on the normal individual ladder
[IRA Sch.1 para 1(2)(d), as enacted 2017]. No income is service-export or foreign-source,
so the maximum-rate cap in [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)] has nothing to
apply to and `effectiveRateBp` equals `rateBp` on every band.

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | 60,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 0 | 18% | 0 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Gross tax** | | | **60,000** | |

**The boundary is inclusive.** The first band's width is Rs. 1,000,000, so taxable income of
Rs. 1,000,000 is taken *entirely* within it: `min(1,000,000, 1,000,000) = 1,000,000`, the
remainder is nil, and the walk stops. The 18% band therefore carries no amount and is not
emitted at all — the result records only bands that actually bear income.

That is the assertion this fixture exists for. A width read exclusively would split the same
figure into Rs. 999,999 at 6% and Rs. 1 at 18%, producing two bands where there should be
one and a gross tax of Rs. 59,999 — a one-rupee error that no reader would notice and that
would compound at every boundary above it. Because the fixture states the band list, not
just the total, that mistake fails here rather than passing on a matching total.

Rs. 1,000,000 × 6% = Rs. 60,000 exactly, so the floor-per-band rule in step 6 of
[`../spec/calculation-engine.md`](../spec/calculation-engine.md) has nothing to discard on
this fixture. The `-over` pair is where flooring is visible.

### Credits

Her employer deducted no APIT — the defining fact of this persona — no AIT or other
withholding applies to salary, and no foreign tax was paid on any source [IRA s.81(1)].
Credits are nil, so the whole of the Rs. 60,000 gross tax is **tax payable of Rs. 60,000**,
and there is no excess credit.

## Payment schedule

Nadeesha filed no Statement of Estimated Tax, so there is no **A** for the instalment
formula `(A − C) / B` [IRA s.90(3)] and no instalments are computed. The engine does not
substitute the liability it computed for the estimate the taxpayer is required to make:
they are different figures, and the difference between them is what a final payment
settles. See
[`p2-instalments-estimate-below-liability-2025-26.md`](p2-instalments-estimate-below-liability-2025-26.md)
for the case where an estimate exists.

The return is due **30 November 2026**, eight months after the year of assessment ends on
31 March 2026 [IRA s.93(1)]. That is derived from the year, not stored as a date.

No date is stated for a final payment: whether one exists separately from the fourth
instalment is unresolved (Q22), and there is no instalment schedule here in any event.

## Notes

Every rate this computation applies — the Rs. 1,800,000 personal relief
[IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3); PN/IT/2025-01, para 1] and the 6% first
band [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] — is verified against a primary
source held in `docs/sources/`, so this fixture carries `verified: true`.

What it would catch if it broke: an exclusive reading of a band width, a relief applied
before rather than after aggregation, an empty band emitted where none should be, and any
change to the first band's rate.

## Self-check

- Band-by-band tax sums to the stated gross tax: 60,000 = 60,000.
- Taxable income falls within the bands charged: Rs. 1,000,000, wholly inside the first
  band of Rs. 1,000,000.
- Instalments plus final payment sum to the liability: no instalments and no estimate, so
  no schedule to reconcile; the liability of Rs. 60,000 stands unsettled by instalments.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 2,800,000 of aggregate relief-eligible income.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
