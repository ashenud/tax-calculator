---
id: p2-band-boundary-1m-over-2025-26
persona: p2
yearOfAssessment: "2025/2026"
verified: true

input:
  residency: resident
  income:
    employment:
      - label: Salary from a manufacturing firm in Kandy, 12 months, after a Rs. 1,000 monthly increment
        amount: 2812000

expected:
  assessableByHead: { employment: 2812000, business: 0, investment: 0, other: 0 }
  partition: { reliefEligible: 2812000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 1012000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 1012000
      bands:
        - amount: 1000000
          rateBp: 600
          effectiveRateBp: 600
          tax: 60000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
        - amount: 12000
          rateBp: 1800
          effectiveRateBp: 1800
          tax: 2160
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 62160
  grossTax: 62160
  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }
  taxPayable: 62160
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

# P2 — taxable income just above the top of the 6% band, Y/A 2025/2026

## Facts

The same taxpayer as
[`p2-band-boundary-1m-at-2025-26.md`](p2-band-boundary-1m-at-2025-26.md) — Nadeesha, a
[persona P2](../personas/p2-employee-no-apit.md) employee whose firm deducts no APIT —
with **one fact changed**: her employer gave her an increment of Rs. 1,000 a month, so her
pay for Y/A 2025/2026 was Rs. 2,812,000 rather than Rs. 2,800,000.

Everything else is identical: resident, no other income, no qualifying payments, no
Statement of Estimated Tax, no tax deducted at source. The pair isolates a single rule —
what happens to the twelve thousand rupees that cross a band boundary.

## Computation

| Step | Amount | Authority |
|---|---|---|
| Employment income | 2,812,000 | — |
| Business, investment, other | 0 | — |
| **Total assessable income** | **2,812,000** | [IRA s.3, s.5] |
| Relief-eligible portion | 2,812,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **1,012,000** | [IRA s.52(1)] |

The relief is unchanged at Rs. 1,800,000 [PN/IT/2025-01, para 1] — it is a fixed amount,
not a proportion, so the whole of the increment reaches taxable income.

### Rate schedule

The normal individual ladder again, with nothing carved out
[IRA Sch.1 para 1(2)(d), as enacted 2017] and no maximum-rate cap in play
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)].

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | 60,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 12,000 | 18% | 2,160 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Gross tax** | | | **62,160** | |

The first band fills to its width of Rs. 1,000,000 and charges Rs. 60,000, exactly as in the
paired fixture. Only the balance of Rs. 12,000 reaches the second band, where it is charged
at 18% — Rs. 2,160.

**The marginal rate applies to the excess, not to the whole.** This is the point most often
got wrong in conversation about the ladder: crossing into the 18% band does not re-rate the
first Rs. 1,000,000. Nadeesha's Rs. 12,000 increment costs her Rs. 2,160 of tax, not the
Rs. 122,160 that re-rating the whole Rs. 1,012,000 at 18% would produce, and not the
Rs. 60,720 that charging the whole amount at 6% would produce. The fixture asserts the band
list, so either error fails here.

Rs. 12,000 × 18% = Rs. 2,160 exactly, so again nothing is discarded by the floor-per-band
rule. Gross tax is Rs. 60,000 + Rs. 2,160 = **Rs. 62,160**.

### Credits

Nil, for the same reasons as the paired fixture: no APIT deducted, no withholding on salary
and no foreign tax paid [IRA s.81(1)]. **Tax payable is Rs. 62,160**, and there is no
excess credit.

The comparison the pair is for: an increment of Rs. 12,000 raised the liability by
Rs. 2,160, from Rs. 60,000 to Rs. 62,160.

## Payment schedule

No Statement of Estimated Tax, so no **A** for `(A − C) / B` [IRA s.90(3)] and no
instalments. The return is due **30 November 2026**, eight months after the year of
assessment ends [IRA s.93(1)]. No final payment date is stated (Q22 is unresolved) and no
schedule exists to attach one to.

## Notes

Every rate applied is verified against a primary source in `docs/sources/` — the personal
relief [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3); PN/IT/2025-01, para 1] and the
first two bands of the ladder [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] — so this
fixture carries `verified: true`.

What it would catch if it broke: a ladder that re-rates the whole of taxable income at the
marginal rate, a second band charged at the wrong rate, a band boundary read one rupee out
in either direction, and a relief treated as proportional rather than fixed.

## Self-check

- Band-by-band tax sums to the stated gross tax: 60,000 + 2,160 = 62,160.
- Taxable income falls within the bands charged: Rs. 1,012,000 = Rs. 1,000,000 + Rs. 12,000
  across the first two bands, whose combined width is Rs. 1,500,000.
- Instalments plus final payment sum to the liability: no estimate, so no schedule.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 2,812,000.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
