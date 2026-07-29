---
id: p4-terminal-benefit-28-years-2025-26
persona: p4
yearOfAssessment: "2025/2026"
verified: false
unverifiedBecause: >-
  Q32 — the terminal benefit tables applied here are the 2017 text, and whether they are
  still the tables in force for Y/A 2025/2026 is not established by anything held in
  docs/sources/. The engine says so itself: it raises an "unverified-rate" warning stating
  that the separately-rated component "terminal-benefit" is marked verified: false in the
  Y/A 2025/2026 data and that Rs. 9,000,000 was charged from a rate that has not been
  confirmed against a primary source, and that the figure should not be relied on until it
  is. The 2017 definition and both tables are verified for 2017; their currency for this
  year is not.

input:
  residency: resident
  income:
    employment:
      - label: Salary to the date of retirement, 12 months of accrued pay and allowances
        amount: 2400000
      - label: Retirement gratuity after 28 years of service
        amount: 9000000
        tags: [terminal-benefit]
        serviceYears: 28
  creditsPaid:
    apit: 200000

expected:
  assessableByHead: { employment: 11400000, business: 0, investment: 0, other: 0 }
  partition: { reliefEligible: 11400000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 9600000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 600000
      bands:
        - amount: 600000
          rateBp: 600
          effectiveRateBp: 600
          tax: 36000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 36000
    - kind: terminal-benefit
      amount: 9000000
      bands:
        - amount: 5000000
          rateBp: 0
          effectiveRateBp: 0
          tax: 0
          src: "ira-2017#Sch.1 para 1(2)(b)(ii) as enacted 2017"
        - amount: 1000000
          rateBp: 500
          effectiveRateBp: 500
          tax: 50000
          src: "ira-2017#Sch.1 para 1(2)(b)(ii) as enacted 2017"
        - amount: 3000000
          rateBp: 1000
          effectiveRateBp: 1000
          tax: 300000
          src: "ira-2017#Sch.1 para 1(2)(b)(ii) as enacted 2017"
      tax: 350000
  grossTax: 386000
  credits: { apit: 200000, ait: 0, foreign: 0, total: 200000, excess: 0 }
  taxPayable: 186000
  schedule:
    instalments: []
    finalPayment: { due: "", amount: 0 }
    returnDue: "2026-11-30"
  warnings:
    - { code: unverified-rate, severity: warn }
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
    - "ira-2017#Sch.1 para 1(2)(b)(ii) as enacted 2017"
    - "ira-2017#s.93(1)"
---

> **The tax on the gratuity in this document is computed from tables whose currency is not
> established.** They are the 2017 text — **Q32** in
> [`../research/12-open-questions.md`](../research/12-open-questions.md). The Rs. 350,000
> and the Rs. 186,000 below are **not answers**. What this example is *for* — that the
> longer-service table is a different table, selected by a fact about the taxpayer rather
> than about the money — does not depend on the figures in it.

# P4 — retirement gratuity after 28 years, on the > 20 years table, Y/A 2025/2026

## Facts

Ranjith is a [persona P4](../personas/p4-investment-cgt-terminal.md) taxpayer, and the
counterpart to Chandana in
[`p4-terminal-benefit-20-years-2025-26.md`](p4-terminal-benefit-20-years-2025-26.md). He
retired from the same employer in the same year, under the same scheme, with the same
gratuity — after **twenty-eight years** rather than exactly twenty.

| | Amount |
|---|---|
| Salary and allowances for the year | 2,400,000 |
| Retirement gratuity | 9,000,000 |
| Tax deducted by his employer | 200,000 |
| Length of service | **28 years — above the threshold** |

Resident in Sri Lanka, no qualifying payments, no other income, no Statement of Estimated
Tax. Every figure in this document is identical to the paired one. The only difference is
the number of years.

## Which table

Twenty-eight years is **more than twenty**, so the second table applies
[IRA Sch.1 para 1(2)(b)(ii), as enacted 2017] — the one with the Rs. 5,000,000 nil band
rather than the Rs. 2,000,000 one. This is the "far more generous" table persona P4 records,
and the generosity is concentrated entirely in the nil band: the 5% and 10% bands are the
same in both.

## Computation

### Steps 1 to 3 — assessable income, partition, one deduction

| Step | Amount | Authority |
|---|---|---|
| Salary | 2,400,000 | [IRA s.5] |
| Gratuity | 9,000,000 | [IRA s.5] |
| **Total assessable income** | **11,400,000** | [IRA s.3] |
| Relief-eligible portion | 11,400,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **9,600,000** | [IRA s.52(1)] |

Identical to the paired document, as it must be: length of service selects a rate table and
has no bearing on assessable income, the partition, or the deduction.

### Step 4 — carve out the terminal benefit

| | Amount |
|---|---|
| Taxable income | 9,600,000 |
| Less the terminal benefit, separately rated | (9,000,000) |
| **Remainder, for the normal ladder** | **600,000** |

[IRA Sch.1 para 1(2)(d), as enacted 2017]

### Steps 5 and 6 — the two rate bases

No service-export or foreign-source income, so no maximum-rate cap arises
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]; `effectiveRateBp` equals `rateBp`
throughout.

**The remainder, on the normal ladder:**

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 600,000 | 6% | 36,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Ladder tax** | | | **36,000** | |

**The gratuity, on the > 20 years table** [IRA Sch.1 para 1(2)(b)(ii), as enacted 2017]:

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 5,000,000 | 5,000,000 | 0% | 0 | [IRA Sch.1 para 1(2)(b)(ii), as enacted 2017] |
| Next 1,000,000 | 1,000,000 | 5% | 50,000 | [IRA Sch.1 para 1(2)(b)(ii), as enacted 2017] |
| Balance | 3,000,000 | 10% | 300,000 | [IRA Sch.1 para 1(2)(b)(ii), as enacted 2017] |
| **Terminal benefit tax** | | | **350,000** | |

```
ladder            36,000
terminal benefit 350,000
gross tax        386,000
```

Note what changed and what did not. The 5% band is Rs. 1,000,000 wide on both tables and
charges Rs. 50,000 on both. The whole of the Rs. 300,000 difference between Ranjith and
Chandana comes from Rs. 3,000,000 moving out of the 10% band and into the nil band.

### Step 7 — credits

His employer deducted **Rs. 200,000**, taken as given from the certificate; no APIT table for
Y/A 2025/2026 is held [PN/IT/2025-01, para 2.3]. No AIT, no foreign tax [IRA s.81(1)].

```
gross tax        386,000
less APIT       (200,000)
tax payable      186,000
```

**Tax payable is Rs. 186,000**, with no excess credit.

Both taxpayers had the same Rs. 200,000 deducted by the same employer. For Ranjith it covers
rather more than half the liability; for Chandana it covers well under half. An employer
deduction that looks the same on two payslips does not mean the two employees are in the
same position, which is the practical point persona P4 needs made.

## Payment schedule

No Statement of Estimated Tax, so no **A** for `(A − C) / B` [IRA s.90(3)] and no
instalments. The return is due **30 November 2026**, eight months after the year of
assessment ends [IRA s.93(1)]. No final payment date is stated (Q22, unresolved).

## Notes

`verified: false` for Q32: these are the 2017 tables, verified *as 2017 text*, with no source
held establishing that they are the tables in force for Y/A 2025/2026. The engine applies
what the data holds and raises an `unverified-rate` warning rather than substituting a figure
from anywhere else.

The qualification recorded in
[`p4-terminal-benefit-19-years-2025-26.md`](p4-terminal-benefit-19-years-2025-26.md) applies
here too: a payment qualifies for these tables only if it falls within the listed categories,
and compensation for loss of office counts only under a scheme the Commissioner-General
considers uniformly applicable to all employees [IRA Sch.1 para 1(3)(c), as enacted 2017].

What this fixture would catch if it broke: the wrong table selected above the threshold, the
> 20 years nil band of Rs. 5,000,000, the two tables being collapsed into one, and a stale
table applied without the `unverified-rate` warning. Together with its pair it pins the table
selector on both sides of the boundary and on the boundary itself.

## Self-check

- Band-by-band tax sums to the stated component tax: ladder 36,000 = 36,000; terminal
  benefit 0 + 50,000 + 300,000 = 350,000. Components sum to gross tax:
  36,000 + 350,000 = 386,000.
- Taxable income falls within the bands charged: 600,000 on the ladder plus 9,000,000 on the
  terminal-benefit table = 9,600,000. The terminal-benefit band amounts sum to
  5,000,000 + 1,000,000 + 3,000,000 = 9,000,000.
- Instalments plus final payment sum to the liability: no estimate, so no schedule was
  computed.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 11,400,000, before the carve-out.
- Credits sum correctly: 200,000 + 0 + 0 = 200,000, and 386,000 − 200,000 = 186,000 with no
  excess.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
