---
id: p2-band-boundary-2-5m-over-2025-26
persona: p2
yearOfAssessment: "2025/2026"
verified: true

input:
  residency: resident
  income:
    employment:
      - label: Salary as operations manager, 12 months, after a Rs. 1,000 monthly increment
        amount: 4312000

expected:
  assessableByHead: { employment: 4312000, business: 0, investment: 0, other: 0 }
  partition: { reliefEligible: 4312000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 2512000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 2512000
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
        - amount: 12000
          rateBp: 3600
          effectiveRateBp: 3600
          tax: 4320
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 424320
  grossTax: 424320
  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }
  taxPayable: 424320
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

# P2 — taxable income just inside the 36% band, Y/A 2025/2026

## Facts

The same taxpayer as
[`p2-band-boundary-2-5m-at-2025-26.md`](p2-band-boundary-2-5m-at-2025-26.md) — Suresh, a
[persona P2](../personas/p2-employee-no-apit.md) operations manager whose employer deducts
no APIT — with **one fact changed**: a Rs. 1,000-a-month increment took his pay for
Y/A 2025/2026 to Rs. 4,312,000.

Resident, no other income, no qualifying payments, no Statement of Estimated Tax, nothing
deducted at source. The pair isolates what happens when income crosses into the unbounded
top band.

## Computation

| Step | Amount | Authority |
|---|---|---|
| Employment income | 4,312,000 | — |
| Business, investment, other | 0 | — |
| **Total assessable income** | **4,312,000** | [IRA s.3, s.5] |
| Relief-eligible portion | 4,312,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **2,512,000** | [IRA s.52(1)] |

### Rate schedule

The normal individual ladder, with nothing carved out
[IRA Sch.1 para 1(2)(d), as enacted 2017] and no maximum-rate cap in play
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)].

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | 60,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 18% | 90,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 24% | 120,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 30% | 150,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Balance | 12,000 | 36% | 4,320 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Gross tax** | | | **424,320** | |

The four bounded bands fill exactly as in the paired fixture and charge the same
Rs. 420,000. The Rs. 12,000 of increment is the only amount to reach the **unbounded** final
band, where it is charged at 36% — Rs. 4,320.

The final band has no width: it takes whatever remains. That is what makes the ladder total
rather than partial, and it is asserted here for the first time in this fixture set — the
`-at` pair stops one rupee short of it. A ladder whose last band had a width would leave
income untaxed above it, which the engine treats as a data error and refuses to compute
through.

Gross tax is 60,000 + 90,000 + 120,000 + 150,000 + 4,320 = **Rs. 424,320**.

### Credits

Nil — no APIT, no withholding on salary, no foreign tax [IRA s.81(1)]. **Tax payable is
Rs. 424,320**, with no excess credit.

The comparison the pair is for: the same Rs. 12,000 increment that cost Nadeesha Rs. 2,160
at the 6%/18% boundary costs Suresh Rs. 4,320 here, because it lands in the 36% band
instead of the 18% one. Neither figure re-rates the income beneath it.

## Payment schedule

No Statement of Estimated Tax, so no **A** for `(A − C) / B` [IRA s.90(3)] and no
instalments. The return is due **30 November 2026**, eight months after the year of
assessment ends [IRA s.93(1)]. No final payment date is stated; whether one exists
separately from the fourth instalment is unresolved (Q22).

## Notes

Every rate applied is verified against a primary source in `docs/sources/` — the personal
relief [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3); PN/IT/2025-01, para 1] and all five
bands of the ladder [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] — so `verified: true`.

Between this fixture and its pair, every band of the Y/A 2025/2026 individual ladder is
asserted with a non-zero amount, and every boundary between them is pinned at its exact
rupee.

What it would catch if it broke: a width given to the final band, the top rate, and any
re-rating of lower bands when the top band is reached.

## Self-check

- Band-by-band tax sums to the stated gross tax: 60,000 + 90,000 + 120,000 + 150,000 +
  4,320 = 424,320.
- Taxable income falls within the bands charged: 1,000,000 + 500,000 + 500,000 + 500,000 +
  12,000 = 2,512,000, the whole of taxable income, the last band being unbounded.
- Instalments plus final payment sum to the liability: no estimate, so no schedule
  computed.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 4,312,000.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
