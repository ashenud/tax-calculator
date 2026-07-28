---
id: special-business-liquor-2025-26
yearOfAssessment: "2025/2026"
verified: true

input:
  residency: resident
  income:
    investment:
      - label: Rent from a shop unit let to a neighbouring trader, net of expenses
        amount: 2600000
    business:
      - label: Profits of a licensed retail liquor business
        amount: 6000000
        tags: [special-business]

expected:
  assessableByHead: { employment: 0, business: 6000000, investment: 2600000, other: 0 }
  partition: { reliefEligible: 8600000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 6800000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 800000
      bands:
        - amount: 800000
          rateBp: 600
          effectiveRateBp: 600
          tax: 48000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 48000
    - kind: special-business
      amount: 6000000
      bands:
        - amount: 6000000
          rateBp: 4500
          effectiveRateBp: 4500
          tax: 2700000
          src: "act-2-2025#s.3(1)(c) — IRA Sch.1 para 1(1D)/(2); PN/IT/2025-01 para 2.1(c)"
      tax: 2700000
  grossTax: 2748000
  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }
  taxPayable: 2748000
  schedule:
    instalments: []
    finalPayment: { due: "", amount: 0 }
    returnDue: "2026-11-30"
  warnings: []
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
    - "act-2-2025#s.3(1)(c) — IRA Sch.1 para 1(1D)/(2); PN/IT/2025-01 para 2.1(c)"
    - "ira-2017#s.93(1)"
---

# Special business income at the 45% flat rate, alongside ordinary income, Y/A 2025/2026

## Facts

**No persona covers this taxpayer.** The four situations in
[`../personas/`](../personas/) — a foreign-currency consultant, an employee with no APIT
deducted, a mixed employment-and-business case, and an investment/capital-gains/terminal-
benefit case — do not include a person carrying on betting and gaming, or the manufacture,
import and sale of liquor or tobacco. That is a genuine gap in the persona set, recorded
here rather than papered over by attaching this example to a persona it does not fit.

The taxpayer runs a licensed retail liquor business and also lets a shop unit. Resident in
Sri Lanka. For Y/A 2025/2026 (1 April 2025 – 31 March 2026):

| | Amount |
|---|---|
| Profits of the liquor business | 6,000,000 |
| Rent from the shop unit, net of expenses | 2,600,000 |

No qualifying payments, nothing withheld at source, no Statement of Estimated Tax, no
capital gain and no foreign income.

The rent is stated net of expenses rather than gross with a `deductions.investment` figure.
That is not cosmetic: the engine refuses a head that carries both a deduction and tagged
income, because how the deduction would apportion between them is unspecified. Here the tag
is on the *business* head and the deduction would be on *investment*, so it would in fact be
allowed — but stating income net keeps the two heads independent and the example readable.

## Computation

### Steps 1 to 3 — assessable income, partition, one deduction

| Step | Amount | Authority |
|---|---|---|
| Business income (liquor retail) | 6,000,000 | [IRA s.6] |
| Investment income (rent) | 2,600,000 | [IRA s.7] |
| **Total assessable income** | **8,600,000** | [IRA s.3] |
| Relief-eligible portion | 8,600,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **6,800,000** | [IRA s.52(1)] |

**Special business income stays in the relief pool at the partition.** Only `capital-gain`
leaves it [IRA Sch.5 para 2(a), as enacted 2017]. The single deduction is taken against the
aggregate of both heads first, and the carve-out happens afterwards.

The Y/A 2025/2026 data marks this component `reliefEligible: false`, but the engine does not
consult that flag: the partition in step 2 is authoritative and turns on `capital-gain` only,
per [`../spec/calculation-engine.md`](../spec/calculation-engine.md) steps 2 and 4. This
fixture pins that reading — a relief pool computed from the data flag instead of from the
spec would give Rs. 2,600,000 of relief-eligible income here, not Rs. 8,600,000, and the
whole computation would move.

### Step 4 — carve out the special business income

> "only the remainder of the individual's taxable income shall be taxed at the rates
> referred to in subparagraph (1)"

[IRA Sch.1 para 1(2)(d), as enacted 2017]

| | Amount |
|---|---|
| Taxable income | 6,800,000 |
| Less the special business income, separately rated | (6,000,000) |
| **Remainder, for the normal ladder** | **800,000** |

Taxable income exceeds the special business income, so the latter survives in full: the
deduction has been absorbed entirely by the rent, and what reaches the ladder is
Rs. 2,600,000 of rent less the Rs. 1,800,000 relief.

### Steps 5 and 6 — the two rate bases

No service-export or foreign-source income, so no maximum-rate cap arises
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]; `effectiveRateBp` equals `rateBp`
throughout.

**The remainder, on the normal ladder:**

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 800,000 | 6% | 48,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Ladder tax** | | | **48,000** | |

**The liquor business, at its own flat rate.** Business income from betting and gaming, or
from the manufacture and sale or import and sale of liquor or tobacco products, is charged
at **45%** [IRA Sch.1 para 1(1D)/(2), ins. Act 2/2025 s.3(1)(c); PN/IT/2025-01, para 2.1(c)]:

| Component | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| Special business | 6,000,000 | 45% | 2,700,000 | [IRA Sch.1 para 1(1D)/(2), ins. Act 2/2025 s.3(1)(c)] |

**Flat, not laddered.** The whole Rs. 6,000,000 is charged at 45%; there is no first
Rs. 1,000,000 at 6% for it. That is what makes it a separately-rated component rather than
income at a high marginal rate, and it is why the component's band list contains exactly one
band spanning the whole amount.

```
ladder              48,000
special business 2,700,000
gross tax        2,748,000
```

The comparison worth stating: the same Rs. 6,000,000 on the ordinary ladder, on top of the
rent, would have run 60,000 + 90,000 + 120,000 + 150,000 on the four bounded bands plus 36%
of the Rs. 4,300,000 balance — Rs. 1,968,000 in all. The separate rating charges
Rs. 2,748,000. Unlike the terminal-benefit carve-out, this one is **adverse** to the
taxpayer, which is exactly why it must not be quietly skipped.

### Step 7 — credits

Nothing was withheld. No APIT — there is no employer. No AIT is credited on the rent:
withholding on rent paid to a resident person is [IRA Sch.1 para 10(1)(b)(iii)] in the base
act, whose lettering is suspect and whose rate for Y/A 2025/2026 is unverified (Q17), and in
any event the tenant withheld nothing and the taxpayer holds no certificate. Assuming a
credit that cannot be evidenced would understate the liability. No foreign tax was paid
[IRA s.81(1)].

Credits are nil, so **tax payable is Rs. 2,748,000**, with no excess credit.

## Payment schedule

No Statement of Estimated Tax was filed, so there is no **A** for the instalment formula
`(A − C) / B` [IRA s.90(3)] and no instalments are computed. A liability of this size plainly
carried an instalment obligation through the year [IRA s.90(1)(b)], due 15 August 2025,
15 November 2025, 15 February 2026 and 15 May 2026 [IRA s.90(2)(a)].

The return is due **30 November 2026**, eight months after the year of assessment ends on
31 March 2026 [IRA s.93(1)]. No final payment date is stated (Q22, unresolved).

## Notes

Every rate applied is verified against a primary source in `docs/sources/`: the
Rs. 1,800,000 relief [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3); PN/IT/2025-01, para 1],
the 6% first band [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)], and the 45% special
business rate [IRA Sch.1 para 1(1D)/(2), ins. Act 2/2025 s.3(1)(c); PN/IT/2025-01,
para 2.1(c)]. So `verified: true`.

This is the **only separately-rated component with a verified rate**. The capital gains rate
is superseded (Q42) and the terminal benefit tables are 2017 text of unestablished currency
(Q32), so their fixtures are unverified and cannot demonstrate that the carve-out arithmetic
is right rather than merely self-consistent. This one can.

What it would catch if it broke: special business income laddered instead of flat-rated, the
45% rate, the carve-out taken before rather than after the single deduction, the partition
consulting the data's `reliefEligible` flag instead of the spec's `capital-gain`-only rule,
components emitted out of order, and a separately-rated component silently charged nothing.

## Self-check

- Band-by-band tax sums to the stated component tax: ladder 48,000 = 48,000; special
  business 2,700,000 = 2,700,000. Components sum to gross tax:
  48,000 + 2,700,000 = 2,748,000.
- Taxable income falls within the bands charged: 800,000 on the ladder plus 6,000,000 at the
  flat rate = 6,800,000, the whole of taxable income.
- Instalments plus final payment sum to the liability: no estimate, so no schedule was
  computed.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 8,600,000 drawn from two heads, before the carve-out.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
