---
id: p4-capital-gain-with-ordinary-income-2025-26
persona: p4
yearOfAssessment: "2025/2026"
verified: false
unverifiedBecause: >-
  Q42 — the capital gains rate applied here (10%) is the 2017 text and is KNOWN SUPERSEDED
  by the Inland Revenue (Amendment) Act, No. 11 of 2026, which this repository does not
  hold. The engine says so itself: it raises an "unverified-rate" warning stating that the
  separately-rated component "capital-gain" is marked verified: false in the Y/A 2025/2026
  data and that Rs. 5,000,000 was charged from a rate that has not been confirmed against a
  primary source, and that the figure should not be relied on until it is. Secondary
  reporting puts the individual rate at 15% from 10%; that is unverified too. The partition
  this fixture is really about — that relief does not touch the gain — does not depend on
  the rate and is verified.

input:
  residency: resident
  income:
    investment:
      - label: Interest on fixed deposits, gross
        amount: 900000
    other:
      - label: Gain on realisation of an inherited house in Negombo
        amount: 5000000
        tags: [capital-gain]
  creditsPaid:
    ait: 90000

expected:
  assessableByHead: { employment: 0, business: 0, investment: 900000, other: 5000000 }
  partition: { reliefEligible: 900000, reliefIneligible: 5000000 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 0
  taxableGain: 5000000
  components:
    - kind: ladder
      amount: 0
      bands: []
      tax: 0
    - kind: capital-gain
      amount: 5000000
      bands:
        - amount: 5000000
          rateBp: 1000
          effectiveRateBp: 1000
          tax: 500000
          src: "ira-2017#Sch.1 para 1(2)(a) as enacted 2017; relief exclusion IRA Sch.5 para 2(a)"
      tax: 500000
  grossTax: 500000
  credits: { apit: 0, ait: 90000, foreign: 0, total: 90000, excess: 0 }
  taxPayable: 410000
  schedule:
    instalments: []
    finalPayment: { due: "", amount: 0 }
    returnDue: "2026-11-30"
  warnings:
    - { code: unverified-rate, severity: warn }
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "ira-2017#Sch.1 para 1(2)(a) as enacted 2017; relief exclusion IRA Sch.5 para 2(a)"
    - "ira-2017#s.93(1)"
---

> **The tax on the gain in this document is computed from a superseded rate.** The 10% is
> the 2017 figure; it has been changed by the Inland Revenue (Amendment) Act, No. 11 of
> 2026, which this repository does not hold — **Q42** in
> [`../research/12-open-questions.md`](../research/12-open-questions.md). The Rs. 500,000
> and the Rs. 410,000 below are **not answers**. What this example is *for* — that the
> relief does not touch the gain — does not depend on the rate and is verified.

# P4 — a capital gain alongside ordinary income, Y/A 2025/2026

## Facts

Priya ([persona P4](../personas/p4-investment-cgt-terminal.md)) inherited a house in Negombo
and sold it during Y/A 2025/2026 (1 April 2025 – 31 March 2026). She never lived in it, so
the principal-residence exclusion does not reach it: that exclusion requires the property to
have been owned continuously for the three years before disposal **and** lived in for at
least two of those three, counted daily [IRA s.195, definition of "investment asset"]. The
gain is squarely inside the charge.

She is resident in Sri Lanka. Besides the sale her only income is interest on fixed
deposits.

| | Amount |
|---|---|
| Fixed deposit interest, **gross** | 900,000 |
| Tax withheld by the bank on that interest | 90,000 |
| Gain on realisation of the house | 5,000,000 |

The gain is entered as a **gain**, not as proceeds: the base cost of a pre-commencement
asset is its market value at 30 September 2017 [IRA transitional provisions], not what
anyone paid for it, and computing the gain from proceeds and base cost happens before this
engine sees the figure. She made no qualifying payments and filed no Statement of Estimated
Tax.

## Computation

### Steps 1 and 2 — assessable income, then the partition

The partition happens **before** anything is deducted, and it is the whole point of this
example.

| Head | Assessable | Partition | Authority |
|---|---|---|---|
| Investment (interest) | 900,000 | relief-**eligible** | [IRA Sch.5 para 2(a), as enacted 2017] |
| Other (gain on realisation) | 5,000,000 | relief-**ineligible** | [IRA Sch.5 para 2(a), as enacted 2017] |
| **Total assessable income** | **5,900,000** | | [IRA s.3] |

The Fifth Schedule says the relief "is not available to be deducted against gains from the
realisation of investment assets" [IRA Sch.5 para 2(a), as enacted 2017]. So the
Rs. 5,000,000 gain leaves the relief pool before the relief is applied, not after.

### Step 3 — one deduction, against the relief-eligible pool only

| Step | Amount | Authority |
|---|---|---|
| Relief-eligible income | 900,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income on the main computation** | **0** | [IRA s.52(1)] |
| **Taxable gain** | **5,000,000** | [IRA Sch.5 para 2(a), as enacted 2017] |

**The relief exceeds the ordinary income, and the unused Rs. 900,000 of it does not spill
onto the gain.** The floor at zero applies to `taxableMain` only. Priya's interest income is
wholly sheltered; her gain is not sheltered at all.

This is the assertion the fixture exists for, and the arithmetic makes the error visible:

| | Correct: partition first | Wrong: pool, then deduct |
|---|---|---|
| Relief-eligible income | 900,000 | 5,900,000 |
| Less relief | (1,800,000) → floored to 0 | (1,800,000) |
| Taxable on the ladder | 0 | 4,100,000 (all of it treated as gain) |
| Taxable gain | 5,000,000 | 4,100,000 |
| Tax on the gain at 10% | **500,000** | 410,000 |

Pooling the gain with the income before deducting overstates the relief and understates the
tax by **Rs. 90,000** — exactly 10% of the Rs. 900,000 of relief that had nowhere to go.
Both columns use the same superseded rate; the Rs. 90,000 gap is the partition error alone,
and it would be proportionately larger at a higher rate.

### Steps 4 to 6 — the components

Two components are produced, in the engine's fixed order.

**The ladder**, at nil. Taxable income on the main computation is zero, so no band is
reached and no band carries an amount. The component is recorded at Rs. 0 with an empty band
list rather than omitted: the ladder was applied, and it produced nothing.

**The gain**, separately rated. The Act rates gains on the realisation of investment assets
on their own footing rather than on the ladder [IRA Sch.1 para 1(2)(a), as enacted 2017],
and "only the remainder of the individual's taxable income shall be taxed at the rates
referred to in subparagraph (1)" [IRA Sch.1 para 1(2)(d), as enacted 2017].

| Component | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| Ladder | 0 | — | 0 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Capital gain | 5,000,000 | 10% — **superseded, see the warning above** | 500,000 | [IRA Sch.1 para 1(2)(a), as enacted 2017] |
| **Gross tax** | | | **500,000** | |

The engine raises an `unverified-rate` warning here, because the `capital-gain` entry in the
Y/A 2025/2026 data carries `verified: false`. That warning is why this document must be
`verified: false` too — the harness cross-checks the two, so a fixture cannot claim a
verified figure while the computation behind it applied an unconfirmed rate.

### Step 7 — credits

The bank withheld **Rs. 90,000** on the interest, and Priya holds the certificate. The
figure is entered as it appears there, alongside the **gross** interest of Rs. 900,000 —
entering net interest *and* claiming the credit would relieve the same tax twice, which is
where this goes wrong most often for this persona.

No APIT was deducted; she has no employer. No foreign tax was paid on the gain or on any
source [IRA s.81(1)].

```
gross tax          500,000
less AIT           (90,000)
tax payable        410,000
```

**Tax payable is Rs. 410,000**, with no excess credit. Note where the credit lands: the
withholding was suffered on the interest, but it is credited against the *total* gross tax,
which here comes entirely from the gain. Credits are not ring-fenced to the income they were
withheld from.

## Payment schedule

Priya filed no Statement of Estimated Tax, so there is no **A** for `(A − C) / B`
[IRA s.90(3)] and no instalments are computed.

The return is due **30 November 2026**, eight months after the year of assessment ends on
31 March 2026 [IRA s.93(1)].

**A caution this document cannot resolve.** Whether a capital gain carries its own payment
deadline running from the realisation, rather than from the year end, is Q43 and is
unverified. Priya's persona note records that she has probably already missed a deadline
that ran from her sale date. The return due date above is the *filing* deadline for the year
and must not be read as the date the tax on the gain was payable.

No final payment date is stated (Q22, unresolved).

## Notes

**What is verified here:** the partition rule [IRA Sch.5 para 2(a), as enacted 2017], the
separate rating of gains [IRA Sch.1 para 1(2)(a), as enacted 2017], the carve-out language
[IRA Sch.1 para 1(2)(d), as enacted 2017], the Rs. 1,800,000 relief
[PN/IT/2025-01, para 1], and the return due rule [IRA s.93(1)].

**What is not:** the 10% rate. It is the 2017 figure and has been changed by Act No. 11 of
2026, which is not held (Q42). Secondary reporting puts individual and partnership capital
gains at 15% from 10%, which is itself unverified and is not used here — the engine applies
what the data holds and says loudly that the data is stale, rather than substituting a
number from a news report.

Also unresolved and not modelled: the base cost of inherited assets where no arm's-length
price exists (Q45), and capital gains loss treatment (Q44).

What this fixture would catch if it broke: a gain pooled with income before the relief,
relief spilling onto a gain, the gain laddered instead of separately rated, the ladder
component being omitted where taxable income is nil, the components emitted out of order,
and — most importantly — a known-superseded rate being applied *silently*, without the
`unverified-rate` warning.

## Self-check

- Band-by-band tax sums to the stated component tax: ladder 0 = 0; capital gain
  500,000 = 500,000. Components sum to gross tax: 0 + 500,000 = 500,000.
- Taxable income falls within the bands charged: the ladder charges nil on nil; the gain of
  Rs. 5,000,000 is charged in full at the flat rate.
- Instalments plus final payment sum to the liability: no estimate, so no schedule was
  computed.
- Personal relief applied exactly once, after aggregating assessable income, and **only to
  the relief-eligible pool**: one deduction of Rs. 1,800,000 against Rs. 900,000, floored at
  nil, with nothing reaching the Rs. 5,000,000 gain.
- The taxable gain equals the relief-ineligible partition: 5,000,000 = 5,000,000.
- Credits sum correctly: 0 + 90,000 + 0 = 90,000, and 500,000 − 90,000 = 410,000 with no
  excess.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
