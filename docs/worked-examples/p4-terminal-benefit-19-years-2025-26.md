---
id: p4-terminal-benefit-19-years-2025-26
persona: p4
yearOfAssessment: "2025/2026"
verified: false
unverifiedBecause: >-
  Q32 — the terminal benefit tables applied here are the 2017 text, and whether they are
  still the tables in force for Y/A 2025/2026 is not established by anything held in
  docs/sources/. The engine says so itself: it raises an "unverified-rate" warning stating
  that the separately-rated component "terminal-benefit" is marked verified: false in the
  Y/A 2025/2026 data and that Rs. 4,000,000 was charged from a rate that has not been
  confirmed against a primary source, and that the figure should not be relied on until it
  is. The 2017 definition and both tables are themselves verified for 2017; their currency
  for this year is not. The ladder and relief applied to the salary are verified.

input:
  residency: resident
  income:
    employment:
      - label: Salary to the date of redundancy, 12 months of accrued pay and allowances
        amount: 2400000
      - label: Gratuity on redundancy after 19 years of service
        amount: 4000000
        tags: [terminal-benefit]
        serviceYears: 19
  creditsPaid:
    apit: 100000

expected:
  assessableByHead: { employment: 6400000, business: 0, investment: 0, other: 0 }
  partition: { reliefEligible: 6400000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 4600000
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
      amount: 4000000
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
        - amount: 1000000
          rateBp: 1000
          effectiveRateBp: 1000
          tax: 100000
          src: "ira-2017#Sch.1 para 1(2)(b)(i) as enacted 2017"
      tax: 150000
  grossTax: 186000
  credits: { apit: 100000, ait: 0, foreign: 0, total: 100000, excess: 0 }
  taxPayable: 86000
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
> [`../research/12-open-questions.md`](../research/12-open-questions.md) — and the 2017
> withholding and terminal-benefit figures have very likely moved. The Rs. 150,000 and the
> Rs. 86,000 below are **not answers**. What this example is *for* — that a terminal benefit
> is taxed on its own tables and never aggregated into the ladder — does not depend on the
> figures in the tables.

# P4 — gratuity after 19 years, on the ≤ 20 years table, Y/A 2025/2026

## Facts

Mohamed ([persona P4](../personas/p4-investment-cgt-terminal.md)) was made redundant after
nineteen years with the same employer. During Y/A 2025/2026 (1 April 2025 – 31 March 2026)
he received his ordinary pay up to the date he left and a gratuity on leaving, in one
payment. He is resident in Sri Lanka.

| | Amount |
|---|---|
| Salary and allowances for the year | 2,400,000 |
| Gratuity on redundancy | 4,000,000 |
| Tax deducted by his employer | 100,000 |
| Length of service | 19 years |

He made no qualifying payments, has no other income and filed no Statement of Estimated Tax.

**Length of service is a required input, not an optional refinement.** The Act rates
terminal benefits on two tables selected by whether the period of contribution or employment
exceeds twenty years [IRA Sch.1 para 1(2)(b), as enacted 2017], and the nil band differs by
Rs. 3,000,000 between them. The engine refuses to compute a terminal benefit without
`serviceYears` rather than pick a table, because guessing costs a real person real money in
either direction — and the person receiving a terminal benefit is typically newly out of
work.

The gratuity and the salary sit in the same head (employment) but as **separate income
items**, and only the gratuity is tagged. That matters: the tag, not the head, decides the
treatment.

## Computation

### Steps 1 to 3 — assessable income, partition, one deduction

| Step | Amount | Authority |
|---|---|---|
| Salary | 2,400,000 | [IRA s.5] |
| Gratuity | 4,000,000 | [IRA s.5] |
| **Employment income** | **6,400,000** | |
| Business, investment, other | 0 | — |
| **Total assessable income** | **6,400,000** | [IRA s.3] |
| Relief-eligible portion | 6,400,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **4,600,000** | [IRA s.52(1)] |

Only `capital-gain` leaves the relief pool at the partition [IRA Sch.5 para 2(a), as enacted
2017]; a terminal benefit does not. So the deduction is taken against the whole
Rs. 6,400,000 and the carve-out happens afterwards, in step 4 — the order matters and is
specified in [`../spec/calculation-engine.md`](../spec/calculation-engine.md).

### Step 4 — carve the terminal benefit out of taxable income

> "only the remainder of the individual's taxable income shall be taxed at the rates
> referred to in subparagraph (1)"

[IRA Sch.1 para 1(2)(d), as enacted 2017]

| | Amount |
|---|---|
| Taxable income | 4,600,000 |
| Less the terminal benefit, separately rated | (4,000,000) |
| **Remainder, for the normal ladder** | **600,000** |

The gratuity survives in full, because taxable income after the single deduction
(Rs. 4,600,000) is larger than the gratuity (Rs. 4,000,000). The deduction has therefore
been absorbed entirely by the ordinary income, and what reaches the ladder is
Rs. 600,000 — the Rs. 2,400,000 of salary less the Rs. 1,800,000 relief.

### Steps 5 and 6 — the two rate bases

No income is service-export or foreign-source, so the maximum-rate cap does not arise
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)] and `effectiveRateBp` equals `rateBp`
everywhere below.

**The remainder, on the normal ladder:**

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 600,000 | 6% | 36,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Ladder tax** | | | **36,000** | |

**The gratuity, on the ≤ 20 years table.** Nineteen years does not exceed twenty, so the
first table applies [IRA Sch.1 para 1(2)(b)(i), as enacted 2017]:

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 2,000,000 | 2,000,000 | 0% | 0 | [IRA Sch.1 para 1(2)(b)(i), as enacted 2017] |
| Next 1,000,000 | 1,000,000 | 5% | 50,000 | [IRA Sch.1 para 1(2)(b)(i), as enacted 2017] |
| Balance | 1,000,000 | 10% | 100,000 | [IRA Sch.1 para 1(2)(b)(i), as enacted 2017] |
| **Terminal benefit tax** | | | **150,000** | |

```
ladder            36,000
terminal benefit 150,000
gross tax        186,000
```

**What the separate treatment is worth.** Persona P4 records that Mohamed may have been
over-deducted if his gratuity was taxed as ordinary employment income. Had the Rs. 4,000,000
been aggregated onto the ladder instead of carved out, the whole Rs. 4,600,000 of taxable
income would have run up the ladder: 60,000 + 90,000 + 120,000 + 150,000 on the four bounded
bands, plus 36% of the Rs. 2,100,000 balance — Rs. 756,000 — for a gross tax of
Rs. 1,176,000. The separate tables cost him Rs. 186,000 instead. Nineteen years of accrued
entitlement pushed through the top band in one go is precisely the error the carve-out
exists to prevent, and it is worth roughly **Rs. 990,000** on these facts.

That comparison holds whatever the tables turn out to say; the Rs. 186,000 itself does not,
because the tables are 2017 text (Q32).

### Step 7 — credits

His employer deducted **Rs. 100,000**, and that figure is taken from his certificate as
given. No APIT table for Y/A 2025/2026 is held — [PN/IT/2025-01, para 2.3] records that the
tables "will be issued in due course" — so the engine cannot check what the employer *should*
have deducted, and does not pretend to. No AIT and no foreign tax [IRA s.81(1)].

```
gross tax        186,000
less APIT       (100,000)
tax payable       86,000
```

**Tax payable is Rs. 86,000**, with no excess credit.

## Payment schedule

Mohamed filed no Statement of Estimated Tax, so there is no **A** for `(A − C) / B`
[IRA s.90(3)] and no instalments are computed.

The return is due **30 November 2026**, eight months after the year of assessment ends on
31 March 2026 [IRA s.93(1)]. No final payment date is stated (Q22, unresolved).

## Notes

**One qualification this engine cannot apply.** A payment qualifies for the flat tables only
if it falls within the listed categories, and compensation for loss of office counts only
under a scheme the Commissioner-General considers uniformly applicable to all employees
[IRA Sch.1 para 1(3)(c), as enacted 2017]. An individually negotiated exit package may not
qualify at all. This fixture assumes a gratuity that does qualify; whether a given payment
does is a question the tag records rather than one the engine decides.

**Contrast fixtures.** [`p4-terminal-benefit-20-years-2025-26.md`](p4-terminal-benefit-20-years-2025-26.md)
sits exactly on the threshold, and
[`p4-terminal-benefit-28-years-2025-26.md`](p4-terminal-benefit-28-years-2025-26.md) is the
same benefit on the longer-service table.

What this fixture would catch if it broke: a terminal benefit aggregated onto the ladder
instead of carved out, the wrong table selected for a sub-threshold service length, the nil
band of the ≤ 20 years table, the carve-out taken before rather than after the single
deduction, components emitted out of order, and a stale table applied without the
`unverified-rate` warning.

## Self-check

- Band-by-band tax sums to the stated component tax: ladder 36,000 = 36,000; terminal
  benefit 0 + 50,000 + 100,000 = 150,000. Components sum to gross tax:
  36,000 + 150,000 = 186,000.
- Taxable income falls within the bands charged: 600,000 on the ladder plus 4,000,000 on the
  terminal-benefit table = 4,600,000, the whole of taxable income. The terminal-benefit band
  amounts sum to 2,000,000 + 1,000,000 + 1,000,000 = 4,000,000.
- Instalments plus final payment sum to the liability: no estimate, so no schedule was
  computed.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 6,400,000, before the carve-out.
- Credits sum correctly: 100,000 + 0 + 0 = 100,000, and 186,000 − 100,000 = 86,000 with no
  excess.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
