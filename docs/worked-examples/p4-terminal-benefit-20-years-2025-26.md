---
id: p4-terminal-benefit-20-years-2025-26
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
  is. Separately, where the twenty-year threshold falls is asserted here from the 2017
  wording alone; the 2017 definition and both tables are verified for 2017, their currency
  for this year is not.

input:
  residency: resident
  income:
    employment:
      - label: Salary to the date of retirement, 12 months of accrued pay and allowances
        amount: 2400000
      - label: Retirement gratuity after exactly 20 years of service
        amount: 9000000
        tags: [terminal-benefit]
        serviceYears: 20
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
        - amount: 2000000
          rateBp: 0
          effectiveRateBp: 0
          tax: 0
          src: "ira-2017#Sch.1 para 1(2)(b)(i) as enacted 2017"
        - amount: 1000000
          rateBp: 500
          effectiveRateBp: 500
          tax: 50000
          src: "ira-2017#Sch.1 para 1(2)(b)(i) as enacted 2017"
        - amount: 6000000
          rateBp: 1000
          effectiveRateBp: 1000
          tax: 600000
          src: "ira-2017#Sch.1 para 1(2)(b)(i) as enacted 2017"
      tax: 650000
  grossTax: 686000
  credits: { apit: 200000, ait: 0, foreign: 0, total: 200000, excess: 0 }
  taxPayable: 486000
  schedule:
    instalments: []
    finalPayment: { due: "", amount: 0 }
    returnDue: "2026-11-30"
  warnings:
    - { code: unverified-rate, severity: warn }
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
    - "ira-2017#Sch.1 para 1(2)(b)(i) as enacted 2017"
    - "ira-2017#s.93(1)"
---

> **The tax on the gratuity in this document is computed from tables whose currency is not
> established.** They are the 2017 text — **Q32** in
> [`../research/12-open-questions.md`](../research/12-open-questions.md). The Rs. 650,000
> and the Rs. 486,000 below are **not answers**. What this example is *for* — which side of
> the twenty-year threshold a service length of exactly twenty years falls on — is a
> question about the wording, not about the figures.

# P4 — retirement gratuity at exactly 20 years of service, Y/A 2025/2026

## Facts

Chandana is a [persona P4](../personas/p4-investment-cgt-terminal.md) taxpayer: an employee
meeting a one-off obligation he had no reason to know about. He retired during
Y/A 2025/2026 (1 April 2025 – 31 March 2026) after **exactly twenty years** with the same
employer, and received his ordinary pay to the retirement date and a gratuity under his
employer's scheme. He is resident in Sri Lanka.

| | Amount |
|---|---|
| Salary and allowances for the year | 2,400,000 |
| Retirement gratuity | 9,000,000 |
| Tax deducted by his employer | 200,000 |
| Length of service | **20 years — exactly on the threshold** |

No qualifying payments, no other income, no Statement of Estimated Tax.

This fixture and
[`p4-terminal-benefit-28-years-2025-26.md`](p4-terminal-benefit-28-years-2025-26.md) are a
contrast pair: **identical in every figure**, differing only in length of service — twenty
years against twenty-eight. Chandana and the taxpayer in the paired document retired from
the same employer, under the same scheme, with the same gratuity, in the same year.

## Which table — the boundary

The Act gives two tables, selected by the period of contribution or employment
[IRA Sch.1 para 1(2)(b), as enacted 2017]:

| Table | Applies where | Nil band | Authority |
|---|---|---|---|
| First | period is **twenty years or less** | 2,000,000 | [IRA Sch.1 para 1(2)(b)(i), as enacted 2017] |
| Second | period is **more than twenty years** | 5,000,000 | [IRA Sch.1 para 1(2)(b)(ii), as enacted 2017] |

**The threshold year itself sits on the first table.** "Twenty years or less" includes
twenty; "more than twenty years" begins at twenty years and a day. So Chandana's exactly
twenty years takes the **less generous** table, with a nil band of Rs. 2,000,000 rather than
Rs. 5,000,000.

That is a boundary worth pinning in a test. The difference between the two readings on these
facts is Rs. 300,000, and the wording is the only thing that settles it — a threshold read
as "twenty or more" rather than "more than twenty" would move Chandana onto the second table
and be invisible in any figure except this one.

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

A terminal benefit stays in the relief pool at the partition — only `capital-gain` leaves it
[IRA Sch.5 para 2(a), as enacted 2017] — so the single deduction is taken first and the
carve-out follows.

### Step 4 — carve out the terminal benefit

| | Amount |
|---|---|
| Taxable income | 9,600,000 |
| Less the terminal benefit, separately rated | (9,000,000) |
| **Remainder, for the normal ladder** | **600,000** |

"Only the remainder of the individual's taxable income shall be taxed at the rates referred
to in subparagraph (1)" [IRA Sch.1 para 1(2)(d), as enacted 2017]. Taxable income exceeds
the gratuity, so the gratuity survives in full and the ladder gets the salary net of the
relief.

### Steps 5 and 6 — the two rate bases

No service-export or foreign-source income, so no maximum-rate cap arises
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)] and `effectiveRateBp` equals `rateBp`
throughout.

**The remainder, on the normal ladder:**

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 600,000 | 6% | 36,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Ladder tax** | | | **36,000** | |

**The gratuity, on the ≤ 20 years table** [IRA Sch.1 para 1(2)(b)(i), as enacted 2017]:

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 2,000,000 | 2,000,000 | 0% | 0 | [IRA Sch.1 para 1(2)(b)(i), as enacted 2017] |
| Next 1,000,000 | 1,000,000 | 5% | 50,000 | [IRA Sch.1 para 1(2)(b)(i), as enacted 2017] |
| Balance | 6,000,000 | 10% | 600,000 | [IRA Sch.1 para 1(2)(b)(i), as enacted 2017] |
| **Terminal benefit tax** | | | **650,000** | |

```
ladder            36,000
terminal benefit 650,000
gross tax        686,000
```

### Step 7 — credits

His employer deducted **Rs. 200,000**, taken from the certificate as given; no APIT table for
Y/A 2025/2026 is held [PN/IT/2025-01, para 2.3], so the engine cannot check the employer's
figure. No AIT, no foreign tax [IRA s.81(1)].

```
gross tax        686,000
less APIT       (200,000)
tax payable      486,000
```

**Tax payable is Rs. 486,000**, with no excess credit.

## What the threshold is worth

| | 20 years (this document) | 28 years (the pair) |
|---|---|---|
| Gratuity | 9,000,000 | 9,000,000 |
| Nil band | 2,000,000 | 5,000,000 |
| Terminal benefit tax | 650,000 | 350,000 |
| Gross tax | 686,000 | 386,000 |
| **Tax payable** | **486,000** | **186,000** |

**Rs. 300,000** — the whole difference is the Rs. 3,000,000 of extra nil band on the
longer-service table, taxed at the 10% rate that band displaces. Everything else about the
two taxpayers is the same.

This is why length of service is a required input and why the engine refuses to compute a
terminal benefit without it. It is also why it refuses when two terminal-benefit items
declare different service lengths: the table is selected once, for the whole benefit, and how
to select it across broken service is not settled (Q32).

## Payment schedule

No Statement of Estimated Tax, so no **A** for `(A − C) / B` [IRA s.90(3)] and no
instalments. The return is due **30 November 2026**, eight months after the year of
assessment ends [IRA s.93(1)]. No final payment date is stated (Q22, unresolved).

## Notes

The boundary reading asserted here — that exactly twenty years takes the first table — comes
from the 2017 wording "twenty years or less" against "more than twenty years"
[IRA Sch.1 para 1(2)(b)(i)–(ii), as enacted 2017]. What is *not* established is whether
these are still the tables in force for Y/A 2025/2026 (Q32), which is why the fixture is
`verified: false` and why the engine raises an `unverified-rate` warning on the computation.

Also unresolved: how "period of employment" is measured across broken service, and whether
any cumulative limit applies where an earlier terminal benefit has already been received.

What this fixture would catch if it broke: the threshold comparison flipping from `<=` to
`<` — the single most likely off-by-one in table selection, and one that would silently
under-tax every twenty-year retiree by Rs. 300,000 on these figures — plus the ≤ 20 years
nil band, the 5% band width, and the carve-out order.

## Self-check

- Band-by-band tax sums to the stated component tax: ladder 36,000 = 36,000; terminal
  benefit 0 + 50,000 + 600,000 = 650,000. Components sum to gross tax:
  36,000 + 650,000 = 686,000.
- Taxable income falls within the bands charged: 600,000 on the ladder plus 9,000,000 on the
  terminal-benefit table = 9,600,000. The terminal-benefit band amounts sum to
  2,000,000 + 1,000,000 + 6,000,000 = 9,000,000.
- Instalments plus final payment sum to the liability: no estimate, so no schedule was
  computed.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 11,400,000, before the carve-out.
- Credits sum correctly: 200,000 + 0 + 0 = 200,000, and 686,000 − 200,000 = 486,000 with no
  excess.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
