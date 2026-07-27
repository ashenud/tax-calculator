# Worked examples

> **Status:** format defined; no examples written yet
> **Blocked on:** verified rate tables — see [`../research/12-open-questions.md`](../research/12-open-questions.md)

Fully computed cases: a taxpayer's facts, the computation line by line with citations,
and the resulting liability and payment schedule.

## These are tests, not illustrations

Each file is parsed and consumed **verbatim** as a fixture by the calculation engine's
test suite. Two consequences:

**The format is not decorative.** The YAML front matter is machine-read. Field names,
integer rupees, no thousands separators inside the front matter.

**The expected outputs are assertions.** An arithmetic slip here does not produce a
flawed document — it produces a test that permanently asserts a wrong answer and will
fail correct code. Worse, once a test passes, the wrong figure acquires the authority of
being tested.

## Why no examples exist yet

Every rate is unverified. An example written against an unverified rate table would bake
a provisional number into the test suite, where its provisional status would quietly
disappear.

Examples get written once
[`../research/04-rate-tables.md`](../research/04-rate-tables.md) is verified, or — if
written earlier out of necessity — with a prominent warning at the top of the file and a
corresponding row in [`../research/12-open-questions.md`](../research/12-open-questions.md).

## File naming

```
<persona>-<distinguishing-fact>-<Y/A>.md

p1-foreign-remitted-2025-26.md
p1-foreign-not-remitted-2025-26.md
p2-salary-no-apit-2025-26.md
```

The distinguishing fact matters in the filename: contrast pairs should sort next to each
other.

## Format

````markdown
---
id: p1-foreign-remitted-2025-26
persona: p1
yearOfAssessment: "2025/2026"
verified: false          # true only when every rate used has been verified

input:
  residency: resident
  income:
    business:
      - label: Overseas consultancy
        amount: 6000000
        schedule: service-export-foreign
        conditions:
          remitted-through-licensed-lk-bank: true
    employment: []
    investment: []
  deductions:
    businessExpenses: 450000
  qualifyingPayments: 0
  creditsPaid:
    apit: 0
    ait: 0
    foreign: 0
  estimatedTaxForInstalments: 0

expected:
  totalAssessable: 5550000
  reliefsApplied:
    personal: 1800000
    qualifyingPayments: 0
  taxableIncome: 3750000
  allocation:
    - schedule: service-export-foreign
      amount: 3750000
      conditionsMet: true
  bandBreakdown:
    - { schedule: service-export-foreign, band: 0, amount: 1000000, rateBp: 600,  tax: 60000 }
    - { schedule: service-export-foreign, band: 1, amount: 2750000, rateBp: 1500, tax: 412500 }
  grossTax: 472500
  credits: { apit: 0, ait: 0, foreign: 0, total: 0 }
  taxPayable: 472500
  warnings:
    - unverified-rate-table
---

# P1 — consultancy income remitted through a licensed bank

## Facts

Prose description of the taxpayer's situation.

## Computation

| Step | Amount | Authority |
|---|---|---|
| Consultancy income | 6,000,000 | — |
| Less business expenses | (450,000) | [IRA s.__] |
| **Total assessable** | **5,550,000** | |
| Less personal relief | (1,800,000) | [IRA s.__, as amended by Act 2/2025 s.__] |
| **Taxable income** | **3,750,000** | |

### Rate schedule

Which schedule applies and why, with the condition that determines it.

| Band | Amount | Rate | Tax |
|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | 60,000 |
| Balance | 2,750,000 | 15% | 412,500 |
| **Gross tax** | | | **472,500** |

## Payment schedule

Instalment dates and amounts, final payment, return due date.

## Notes

Anything unresolved, and what the contrasting example shows.
````

> The figures above are **illustrative and unverified**. They demonstrate the format, not
> the law.

## Rules

**Integer rupees in front matter.** No separators, no decimals, no currency symbols. The
prose tables may use `6,000,000` for readability; the front matter may not.

**Rates as basis points** in front matter: 6% is `600`, 15% is `1500`.

**Every rate cited in the prose.** The front matter is for the machine; the prose is
where a human checks the work.

**Show every intermediate step.** When a fixture fails, the maintainer needs to see which
step diverged. A file that jumps from income to tax payable is useless at exactly the
moment it is needed.

**`verified: false` unless every rate used has been verified.** The engine's test runner
should report unverified fixtures separately so they cannot be mistaken for a green
suite.

## Contrast pairs

The most valuable examples come in pairs identical but for one fact, isolating a single
rule.

The essential pair is foreign-currency income **remitted** through a licensed bank versus
the **same income not remitted** — same gross, materially different liability. An example
showing only the favourable path teaches nothing about the condition the taxpayer has to
satisfy, which is the thing they most need to understand.

Also worth pairing: either side of a band boundary; employer-deducted versus not; a
terminal benefit on its own tables versus taxed as ordinary employment income.

## Coverage required before the engine ships

- [ ] Income below the relief threshold — zero tax
- [ ] Each band boundary, just below and just above
- [ ] Foreign income remitted / not remitted (contrast pair)
- [ ] Personal relief applied once across two heads of income
- [ ] Credits exceeding gross tax
- [ ] Salary with no APIT deducted, including the instalment schedule
- [ ] Terminal benefit on its own tables
- [ ] One example per historical year of assessment supported

## Self-check before committing an example

- Band-by-band tax sums to the stated gross tax
- Taxable income actually falls within the bands charged
- Instalments plus final payment sum exactly to the liability
- Personal relief applied exactly once, after aggregating assessable income
- Front matter is valid YAML and matches this schema
- Every rate carries a citation in the prose
