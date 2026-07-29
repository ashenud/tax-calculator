---
id: p2-band-boundary-2-5m-at-2025-26
persona: p2
yearOfAssessment: "2025/2026"
verified: true

input:
  residency: resident
  income:
    employment:
      - label: Salary as operations manager, 12 months
        amount: 4300000

expected:
  assessableByHead: { employment: 4300000, business: 0, investment: 0, other: 0 }
  partition: { reliefEligible: 4300000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 2500000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 2500000
      bands:
        - amount: 1000000
          rateBp: 600
          effectiveRateBp: 600
          tax: 60000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
        - amount: 500000
          rateBp: 1800
          effectiveRateBp: 1800
          tax: 90000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
        - amount: 500000
          rateBp: 2400
          effectiveRateBp: 2400
          tax: 120000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
        - amount: 500000
          rateBp: 3000
          effectiveRateBp: 3000
          tax: 150000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 420000
  grossTax: 420000
  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }
  taxPayable: 420000
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

# P2 — taxable income exactly at the foot of the 36% band, Y/A 2025/2026

## Facts

Suresh is a [persona P2](../personas/p2-employee-no-apit.md) taxpayer — an operations
manager at a firm that has never deducted APIT from anyone's pay — resident in Sri Lanka,
paid Rs. 4,300,000 for Y/A 2025/2026 (1 April 2025 – 31 March 2026). No other income, no
qualifying payments, no Statement of Estimated Tax, nothing deducted at source.

Rs. 4,300,000 is chosen so that, after the personal relief, taxable income is **exactly
Rs. 2,500,000** — the point at which the four bounded bands of the ladder are exhausted and
the unbounded 36% band begins. Its pair,
[`p2-band-boundary-2-5m-over-2025-26.md`](p2-band-boundary-2-5m-over-2025-26.md), is the
same taxpayer after a Rs. 1,000-a-month increment, and it is the first fixture in which the
top band carries anything.

## Computation

| Step | Amount | Authority |
|---|---|---|
| Employment income | 4,300,000 | — |
| Business, investment, other | 0 | — |
| **Total assessable income** | **4,300,000** | [IRA s.3, s.5] |
| Relief-eligible portion | 4,300,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **2,500,000** | [IRA s.52(1)] |

### Rate schedule

The normal individual ladder, in full. Nothing is carved out
[IRA Sch.1 para 1(2)(d), as enacted 2017], and there is no service-export or foreign-source
income for the maximum-rate cap to touch
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)], so `effectiveRateBp` equals `rateBp`
throughout.

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | 60,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 18% | 90,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 24% | 120,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 30% | 150,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Balance | 0 | 36% | 0 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Gross tax** | | | **420,000** | |

This fixture walks **four** bands, and asserts each of them separately. It therefore also
pins the two interior boundaries — Rs. 1,500,000 between 18% and 24%, and Rs. 2,000,000
between 24% and 30% — which no other fixture reaches exactly: each of those bands is filled
to its width of Rs. 500,000 and no further.

The top band carries **nothing**, and no fifth band is emitted. Rs. 2,500,000 is the sum of
the four bounded widths (1,000,000 + 500,000 + 500,000 + 500,000), so the remainder after
the fourth band is nil and the walk stops before reaching the unbounded band. As with the
Rs. 1,000,000 boundary, the widths are inclusive: taxable income equal to the cumulative
width of the bounded bands does not spill a rupee into the 36% band.

Each band's tax is exact here — none of 6%, 18%, 24% or 30% applied to these amounts leaves
a fraction — so the floor-per-band rule discards nothing. Gross tax is
60,000 + 90,000 + 120,000 + 150,000 = **Rs. 420,000**.

### Credits

No APIT was deducted, no withholding applies to salary, and no foreign tax was paid on any
source [IRA s.81(1)]. Credits are nil, so **tax payable is Rs. 420,000**, with no excess
credit. The whole of it falls on Suresh personally: an employer's failure to deduct does not
move the liability off the employee (Q27, partially verified — the working assumption of
this persona).

## Payment schedule

No Statement of Estimated Tax was filed, so there is no **A** for `(A − C) / B`
[IRA s.90(3)] and no instalments are computed. Note what this means in Suresh's case: a
liability of this size carries an instalment obligation through the year
[IRA s.90(1)(b)] that he has neither estimated nor paid, and the tool cannot compute the
instalments for him because the statutory formula runs on *his* estimate, not on the figure
computed here.

The return is due **30 November 2026** — eight months after the year of assessment ends on
31 March 2026 [IRA s.93(1)]. No final payment date is stated: whether one exists separately
from the fourth instalment is unresolved (Q22).

## Notes

Every rate applied is verified against a primary source in `docs/sources/`: the personal
relief [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3); PN/IT/2025-01, para 1] and all four
bounded bands of the ladder [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)]. So
`verified: true`.

What it would catch if it broke: any of the four bounded band widths or rates, an interior
boundary read one rupee out, and — most importantly — a zero-amount top band being emitted
where the ladder is exactly exhausted.

## Self-check

- Band-by-band tax sums to the stated gross tax: 60,000 + 90,000 + 120,000 + 150,000 =
  420,000.
- Taxable income falls within the bands charged: 1,000,000 + 500,000 + 500,000 + 500,000 =
  2,500,000, the whole of taxable income, with nothing left for the balance band.
- Instalments plus final payment sum to the liability: no estimate, so no schedule
  computed.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 4,300,000.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
