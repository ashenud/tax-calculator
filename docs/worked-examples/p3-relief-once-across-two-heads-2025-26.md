---
id: p3-relief-once-across-two-heads-2025-26
persona: p3
yearOfAssessment: "2025/2026"
verified: true

input:
  residency: resident
  income:
    employment:
      - label: Salary from a Colombo company, APIT deducted, 12 months
        amount: 2400000
    business:
      - label: Evening design work for two Sri Lankan clients, gross fees
        amount: 1400000
  deductions:
    business: 200000
  creditsPaid:
    apit: 36000

expected:
  assessableByHead: { employment: 2400000, business: 1200000, investment: 0, other: 0 }
  partition: { reliefEligible: 3600000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 1800000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 1800000
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
        - amount: 300000
          rateBp: 2400
          effectiveRateBp: 2400
          tax: 72000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 222000
  grossTax: 222000
  credits: { apit: 36000, ait: 0, foreign: 0, total: 36000, excess: 0 }
  taxPayable: 186000
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

# P3 — one relief across two heads of income, Y/A 2025/2026

## Facts

Fathima ([persona P3](../personas/p3-mixed-employment-business.md)) has a full-time job at a
Colombo company that deducts APIT, and does design work in the evenings. In this year her
freelance clients were **Sri Lankan**, not overseas — which is what makes this case
computable end to end, and what distinguishes it from
[`p3-mixed-capped-and-uncapped-refusal-2025-26.md`](p3-mixed-capped-and-uncapped-refusal-2025-26.md).

For Y/A 2025/2026 (1 April 2025 – 31 March 2026), resident in Sri Lanka:

| | Amount |
|---|---|
| Salary, employment income | 2,400,000 |
| APIT deducted by her employer | 36,000 |
| Design fees from Sri Lankan clients, gross | 1,400,000 |
| Expenses attributable to the design work | 200,000 |

No qualifying payments, no Statement of Estimated Tax, no foreign income and no capital
gain.

This fixture exists for one rule: **the relief is deducted once, from aggregated income —
not once per head.** Applying it per head is the commonest error in this domain.

## Computation

### Step 1 — assessable income, per head

Each head is netted against its own deductions before anything is aggregated
[IRA s.3, s.5, s.6].

| Head | Gross | Deductions | Assessable |
|---|---|---|---|
| Employment | 2,400,000 | 0 | 2,400,000 |
| Business | 1,400,000 | (200,000) | 1,200,000 |
| Investment | 0 | 0 | 0 |
| Other | 0 | 0 | 0 |
| **Total assessable income** | | | **3,600,000** |

The Rs. 200,000 of expenses is keyed to the **business head**, not to an expense name, and
it reduces only that head. It could not be attributed to her employment income, and the
engine would refuse to apportion a head's deduction across tagged and untagged income within
that head — there is no tagged income here, so the question does not arise.

### Steps 2 and 3 — partition, then one deduction

| Step | Amount | Authority |
|---|---|---|
| Relief-eligible portion | 3,600,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **1,800,000** | [IRA s.52(1)] |

**One deduction of Rs. 1,800,000, against the aggregate of Rs. 3,600,000.** Not
Rs. 1,800,000 against the employment head and another Rs. 1,800,000 against the business
head.

The wrong answer is worth stating, because it is the one a taxpayer reaches unaided and the
one a per-head implementation produces:

| | Correct: one deduction | Wrong: one deduction per head |
|---|---|---|
| Employment taxable | — | 2,400,000 − 1,800,000 = 600,000 |
| Business taxable | — | 1,200,000 − 1,800,000 → floored to 0 |
| Aggregate taxable | 3,600,000 − 1,800,000 = **1,800,000** | 600,000 + 0 = **600,000** |
| Gross tax | **222,000** | 36,000 |

A per-head relief understates the liability by **Rs. 186,000** here, and the error grows
with the number of heads. The relief is a single Fifth Schedule amount deducted under
[IRA s.52(1)] in arriving at taxable income; the Act gives the taxpayer one of it, not one
per source of income.

Relief and qualifying payments are likewise **one** deduction of the aggregate Fifth
Schedule amount, not two successive steps [IRA s.52(1)]. There are no qualifying payments
here, so the aggregate is the relief alone.

Note also the floor at zero in the wrong column: it applies to taxable income, and unused
relief is not carried anywhere. That is what makes the per-head error asymmetric — the
Rs. 600,000 of relief the business head could not use simply vanishes, instead of sheltering
income that the aggregate approach shelters properly.

### Steps 4 to 6 — the rate schedule

Nothing is carved out: no terminal benefit, no special business income, no capital gain, so
the whole of taxable income goes on the normal ladder
[IRA Sch.1 para 1(2)(d), as enacted 2017]. No income is service-export or foreign-source, so
the maximum-rate cap has nothing to apply to
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)] and `effectiveRateBp` equals `rateBp`
throughout.

**Both heads share one ladder.** The employment and business income are not laddered
separately and added; they are aggregated into a single taxable figure which is then
laddered once. Two separate ladders would give each head its own 6% band, understating the
tax again.

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | 60,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 18% | 90,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 300,000 | 24% | 72,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Gross tax** | | | **222,000** | |

### Step 7 — credits

Her employer deducted **APIT of Rs. 36,000** and gave her a certificate. That figure is
taken as given: [PN/IT/2025-01, para 2.3] records that the APIT tables for Y/A 2025/2026
"will be issued in due course", and none is held in `docs/sources/`, so the engine cannot
recompute what the employer should have deducted and does not try.

No AIT is credited on the design fees. Withholding on service fees under
[IRA s.85(1)(a)] covers an enumerated list which ordinary design and consultancy work
probably falls outside, so it must not be assumed — see
[`../research/07-wht-ait-and-credits.md`](../research/07-wht-ait-and-credits.md). Fathima's
clients withheld nothing, and the input says so rather than assuming a credit she cannot
evidence.

No foreign tax was paid on any source [IRA s.81(1)].

```
gross tax          222,000
less APIT          (36,000)
tax payable        186,000
```

**Tax payable is Rs. 186,000**, and there is no excess credit.

This is the number persona P3 needs to be told: her employer's deduction covers her salary
and nothing more. The Rs. 186,000 is hers to pay, and it exists entirely because of income
her payroll never saw.

## Payment schedule

Fathima filed no Statement of Estimated Tax, so there is no **A** for the instalment formula
`(A − C) / B` [IRA s.90(3)] and no instalments are computed. The freelance income brings an
instalment obligation her salary alone did not [IRA s.90(1)(b)], with dates of
15 August 2025, 15 November 2025, 15 February 2026 and 15 May 2026 [IRA s.90(2)(a)]; the
engine cannot compute the amounts, because the formula runs on her estimate and she made
none.

The return is due **30 November 2026**, eight months after the year of assessment ends on
31 March 2026 [IRA s.93(1)].

No final payment date is stated: whether one exists separately from the fourth instalment is
unresolved (Q22).

## Notes

Every rate applied is verified against a primary source in `docs/sources/`: the
Rs. 1,800,000 personal relief
[IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3); PN/IT/2025-01, para 1] and the first three
bands of the ladder [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)]. So `verified: true`.

What it would catch if it broke: a relief applied per head rather than once, a relief applied
before rather than after aggregation, two heads laddered separately, a head deduction
applied to the wrong head or to the aggregate, and a credit subtracted from the wrong side
of the ladder.

## Self-check

- Band-by-band tax sums to the stated gross tax: 60,000 + 90,000 + 72,000 = 222,000.
- Taxable income falls within the bands charged: 1,000,000 + 500,000 + 300,000 = 1,800,000,
  within the first three bands whose combined width is Rs. 2,000,000.
- Instalments plus final payment sum to the liability: no estimate, so no schedule was
  computed.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 3,600,000 of aggregate relief-eligible income drawn from two
  heads.
- Credits sum correctly: 36,000 + 0 + 0 = 36,000, and 222,000 − 36,000 = 186,000 with no
  excess.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
