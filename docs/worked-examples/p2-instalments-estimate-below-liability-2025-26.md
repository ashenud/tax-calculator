---
id: p2-instalments-estimate-below-liability-2025-26
persona: p2
yearOfAssessment: "2025/2026"
verified: true

input:
  residency: resident
  income:
    employment:
      - label: Salary from a twelve-person firm in Kandy, 12 months
        amount: 3240000
  estimatedTaxForInstalments: 100000

expected:
  assessableByHead: { employment: 3240000, business: 0, investment: 0, other: 0 }
  partition: { reliefEligible: 3240000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 1440000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 1440000
      bands:
        - amount: 1000000
          rateBp: 600
          effectiveRateBp: 600
          tax: 60000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
        - amount: 440000
          rateBp: 1800
          effectiveRateBp: 1800
          tax: 79200
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 139200
  grossTax: 139200
  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }
  taxPayable: 139200
  schedule:
    instalments:
      - { quarter: 1, due: "2025-08-15", amount: 25000 }
      - { quarter: 2, due: "2025-11-15", amount: 25000 }
      - { quarter: 3, due: "2026-02-15", amount: 25000 }
      - { quarter: 4, due: "2026-05-15", amount: 25000 }
    finalPayment: { due: "", amount: 39200 }
    returnDue: "2026-11-30"
  warnings:
    - { code: final-payment-date-unresolved, severity: warn }
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
    - "ira-2017#s.90(2)(a)"
    - "ira-2017#s.93(1)"
---

# P2 — instalments computed from an estimate that falls short of the liability, Y/A 2025/2026

## Facts

Rajitha ([persona P2](../personas/p2-employee-no-apit.md)) works for a twelve-person firm in
Kandy. His payslip shows EPF and no income tax. After a colleague mentioned filing, he
registered, obtained a TIN, and filed a **Statement of Estimated Tax** for Y/A 2025/2026
(1 April 2025 – 31 March 2026) putting his tax for the year at **Rs. 100,000** — a round
guess, made before he had worked anything out.

He is resident in Sri Lanka.

| | Amount |
|---|---|
| Salary and allowances for the year | 3,240,000 |
| APIT deducted by his employer | **nil** |
| His own estimate of tax payable, per the SET | 100,000 |

No other income, no qualifying payments, no foreign tax.

This fixture exists to show that the instalments follow the **estimate**, and the final
payment settles the gap between the estimate and the liability actually computed. The two
figures are Rs. 39,200 apart here.

## Computation of the liability

| Step | Amount | Authority |
|---|---|---|
| Employment income | 3,240,000 | [IRA s.5] |
| **Total assessable income** | **3,240,000** | [IRA s.3] |
| Relief-eligible portion | 3,240,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **1,440,000** | [IRA s.52(1)] |

Nothing is carved out and no cap applies [IRA Sch.1 para 1(2)(d), as enacted 2017;
IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)].

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | 60,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 440,000 | 18% | 79,200 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Gross tax** | | | **139,200** | |

His employer deducted no APIT, no AIT applies to salary and no foreign tax was paid
[IRA s.81(1)], so credits are nil and **tax payable is Rs. 139,200** — the whole of it his to
pay. An employer's failure to deduct does not move the liability off the employee (Q27,
partially verified; it is the premise of this persona and is strongly implied by
[IRA s.90(1)(b)], which makes such an employee an instalment payer in his own right).

## Payment schedule

### The instalments are driven by the estimate, not by the liability

[IRA s.90(3)] gives a formula, not a quarter each:

```
instalment = (A − C) / B

A = the taxpayer's current estimated tax payable under s.91 or s.92   = 100,000
B = the number of instalments remaining, including this one
C = tax already paid for the year before this instalment's due date
```

**A is Rajitha's Rs. 100,000, not the Rs. 139,200 computed above.** The statute runs the
formula on the estimate the taxpayer is required to make, and the engine does not substitute
its own figure for it. Working the formula through, with C accumulating the plan's earlier
instalments:

| Quarter | Due | A − C | B | Instalment | Authority |
|---|---|---|---|---|---|
| 1 | 15 Aug 2025 | 100,000 − 0 = 100,000 | 4 | 25,000 | [IRA s.90(2)(a)] |
| 2 | 15 Nov 2025 | 100,000 − 25,000 = 75,000 | 3 | 25,000 | [IRA s.90(2)(a)] |
| 3 | 15 Feb 2026 | 100,000 − 50,000 = 50,000 | 2 | 25,000 | [IRA s.90(2)(a)] |
| 4 | 15 May 2026 | 100,000 − 75,000 = 25,000 | 1 | 25,000 | [IRA s.90(2)(a)] |
| | | | | **100,000** | |

Note the **fourth instalment falls on 15 May 2026 — inside the following year of
assessment** [IRA s.90(2)(a)]. A model that assumes four dates inside the year is wrong, and
this fixture asserts the date.

The instalments sum to Rs. 100,000, the estimate. They do **not** sum to the liability, and
they are not a quarter of it: a quarter of Rs. 139,200 would be Rs. 34,800, which is not any
figure in the table above.

### The final payment settles the difference

```
tax payable                    139,200
less instalments             (100,000)
                             ---------
final payment                   39,200
```

**Rs. 39,200 remains payable** after the four instalments. The amount is **signed**: positive
here because the estimate fell short. It is never clamped, because instalments plus final
payment must sum exactly to the liability, with no rupee unaccounted for.

**No date is stated for it.** Whether a final payment date exists separately from the fourth
instalment is unresolved — **Q22** in
[`../research/12-open-questions.md`](../research/12-open-questions.md): 30 September was
assumed at one stage, but [IRA s.90] shows a fourth instalment on 15 May instead and the
assumption may simply be wrong. The engine states no date it cannot cite, so
`finalPayment.due` is `""` and an `final-payment-date-unresolved` warning says why. A filing
deadline is not necessarily a payment deadline.

The return itself is due **30 November 2026**, eight months after the year of assessment ends
on 31 March 2026 [IRA s.93(1)].

### What Rajitha needs told beyond the number

The dates above are what persona P2 exists for. Three of the four instalments — 15 August
2025, 15 November 2025 and 15 February 2026 — fall *within* the year of assessment, so a
taxpayer who discovers the obligation at filing time has already missed them. The engine does
not say which have passed: that needs today's date, which is the interface's to supply and
not something a pure function may read.

## Notes

Every rate applied is verified against a primary source in `docs/sources/`: the
Rs. 1,800,000 relief [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3); PN/IT/2025-01, para 1]
and the first two bands of the ladder
[IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)]. The instalment dates (Q21), the eight-month
filing rule (Q23) and the `(A − C) / B` basis (Q25) are each in the verified table of
[`../research/12-open-questions.md`](../research/12-open-questions.md). So `verified: true`.

Its counterpart,
[`p3-instalments-estimate-above-liability-2025-26.md`](p3-instalments-estimate-above-liability-2025-26.md),
is the case where the estimate **exceeds** the liability and the final payment is negative.

What this fixture would catch if it broke: instalments computed from the liability rather
than the estimate, instalments computed as `A / 4` rather than `(A − C) / B`, any instalment
date, the fourth instalment being pulled back inside the year of assessment, a final payment
clamped or omitted, a date invented for the final payment, and the eight-month return rule.

## Self-check

- Band-by-band tax sums to the stated gross tax: 60,000 + 79,200 = 139,200.
- Taxable income falls within the bands charged: 1,000,000 + 440,000 = 1,440,000, within the
  first two bands whose combined width is Rs. 1,500,000.
- Instalments plus final payment sum exactly to the liability:
  25,000 × 4 = 100,000, plus 39,200 = 139,200 = tax payable.
- The instalments sum exactly to the estimate: 100,000 = 100,000.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 3,240,000.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate and every date carries a citation in the prose.
