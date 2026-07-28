---
id: p1-foreign-remitted-2025-26
persona: p1
yearOfAssessment: "2025/2026"
verified: false
unverifiedBecause: >-
  Q6 — that the personal relief is available against service-export / foreign-source income
  is a structural reading of s.52(1), not an express statement, and is recorded
  "partially verified" in docs/research/12-open-questions.md. This computation deducts the
  full Rs. 1,800,000 relief against income whose rate is capped, so it asserts an answer to
  Q6. The 15% maximum rate itself and the ladder it caps are verified; the relief's
  availability against this income is not.

input:
  residency: resident
  income:
    business:
      - label: Consultancy fees invoiced to clients in Australia and the UK
        amount: 6000000
        tags: [foreign-capped]
        conditions: { remitted-through-bank-to-sri-lanka: true }

expected:
  assessableByHead: { employment: 0, business: 6000000, investment: 0, other: 0 }
  partition: { reliefEligible: 6000000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 4200000
  taxableGain: 0
  components:
    - kind: capped
      amount: 4200000
      conditionsMet: true
      bands:
        - amount: 1000000
          rateBp: 600
          effectiveRateBp: 600
          tax: 60000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
        - amount: 500000
          rateBp: 1800
          effectiveRateBp: 1500
          tax: 75000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
        - amount: 500000
          rateBp: 2400
          effectiveRateBp: 1500
          tax: 75000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
        - amount: 500000
          rateBp: 3000
          effectiveRateBp: 1500
          tax: 75000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
        - amount: 1700000
          rateBp: 3600
          effectiveRateBp: 1500
          tax: 255000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 540000
  grossTax: 540000
  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }
  taxPayable: 540000
  schedule:
    instalments: []
    finalPayment: { due: "", amount: 0 }
    returnDue: "2026-11-30"
  warnings: []
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
    - "act-2-2025#s.3(1)(d) — IRA Sch.1 para 1(6)"
    - "ira-2017#s.93(1)"
---

> **This figure rests on an unverified point.** Whether the personal relief is available
> against service-export / foreign-source income is **Q6**, recorded as *partially
> verified* in [`../research/12-open-questions.md`](../research/12-open-questions.md). The
> deduction of Rs. 1,800,000 below is an answer to that question, not a settled rule.

# P1 — consultancy income remitted through a bank to Sri Lanka, Y/A 2025/2026

## Facts

Nirmala ([persona P1](../personas/p1-wfh-foreign-consultant.md)) works from home in Colombo
as a software consultant. All her clients are overseas — Australia and the UK — and she has
none in Sri Lanka. She has no employer, so nothing is deducted at source.

For Y/A 2025/2026 (1 April 2025 – 31 March 2026) she invoiced the equivalent of
Rs. 6,000,000, stated here net of the business expenses attributable to the work. She is
resident in Sri Lanka for the year. She made no qualifying payments, paid no tax overseas,
and filed no Statement of Estimated Tax.

**The fact this fixture turns on:** every payment was received in foreign currency and came
into her account here **by direct transfer through a bank**. Nothing sat offshore and
nothing arrived by a payment platform. In the input that is
`conditions: { remitted-through-bank-to-sri-lanka: true }`.

Its pair, [`p1-foreign-not-remitted-2025-26.md`](p1-foreign-not-remitted-2025-26.md), is the
same Rs. 6,000,000 with that one answer reversed. The two documents exist to show what the
condition is worth.

The income is stated net of expenses rather than gross with a `deductions.business` figure,
deliberately: the engine refuses a head that carries both a deduction and tagged income,
because how the deduction would apportion between the tagged and untagged amounts in that
head is not specified in [`../spec/calculation-engine.md`](../spec/calculation-engine.md).

## Computation

| Step | Amount | Authority |
|---|---|---|
| Business income (consultancy, net of expenses) | 6,000,000 | — |
| Employment, investment, other | 0 | — |
| **Total assessable income** | **6,000,000** | [IRA s.3, s.5] |
| Relief-eligible portion | 6,000,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **4,200,000** | [IRA s.52(1)] |

The relief is deducted in arriving at taxable income under [IRA s.52(1)], a step the
maximum-rate provision does not touch: subparagraph (6) modifies the *rate*, not the
computation of taxable income. That is the structural reading recorded under Q6, and it is
why the full Rs. 1,800,000 comes off here. It is a reading, not an express statement, which
is why this fixture is `verified: false`.

### Rate schedule — the cap, and the condition that decides it

The reduced treatment of foreign-currency service income is **not a separate rate
schedule**. It is a maximum rate imposed on the normal ladder
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]: the ladder's own bands still run, and the
rate charged on each is `min(bandRateBp, 15%)`.

The condition is evaluated **first**. The Act requires the payment to be received in foreign
currency **and** remitted through a bank to Sri Lanka
[IRA Sch.1 para 1(6)(a),(b), ins. Act 2/2025 s.3(1)(d)]. Nirmala's earnings were, so the cap
applies to the whole Rs. 4,200,000 and `conditionsMet` is `true`. Note that the statute says
"a bank", not "a licensed bank" — the licensing qualifier is a secondary-source gloss.

| Band | Amount | Ladder rate | Charged at | Tax | Authority |
|---|---|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | 6% | 60,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 18% | 15% | 75,000 | cap: [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)] |
| Next 500,000 | 500,000 | 24% | 15% | 75,000 | cap: [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)] |
| Next 500,000 | 500,000 | 30% | 15% | 75,000 | cap: [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)] |
| Balance | 1,700,000 | 36% | 15% | 255,000 | cap: [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)] |
| **Gross tax** | | | | **540,000** | |

**The cap bites on four of the five bands and not on the first.** 6% is already below 15%,
so the first band is charged at its own rate — the cap is a *maximum*, and it never raises a
rate. This is the assertion that distinguishes a cap from a schedule, and it is why every
band states both `rateBp` and `effectiveRateBp`: the pair shows that a cap applied and by
how much.

It is also why there is **no two-band table** here. A "first Rs. 1,000,000 at 6%, balance at
15%" table gives the same Rs. 540,000 on these facts and is what several secondary sources
describe, but it is an *output* of capping this ladder, not an input. Encoding it would give
the right answer today and a silently wrong one the first time a band moves.

All of the ordinary income is capped, so there is **no `ladder` component at all** in the
result — not a `ladder` component of nil. Nothing was left over for it.

### Credits

Nirmala has no employer, so no APIT was deducted — the persona's defining feature. No AIT
or withholding applies to fees invoiced to overseas clients, and she paid no tax overseas,
so there is no foreign tax credit to compute under [IRA s.81(1)]. Note that the
`foreign-capped` tag and a foreign tax credit are independent: the tag is about the *rate*
charged here, the credit about tax another country already took.

Credits are nil, so **tax payable is Rs. 540,000**.

## Payment schedule

Nirmala filed no Statement of Estimated Tax, so there is no **A** for the instalment formula
`(A − C) / B` [IRA s.90(3)] and no instalments are computed. That is a gap in her affairs
rather than an absence of obligation: a taxpayer with no employer deducting at source is an
instalment payer in her own right [IRA s.90(1)(b)], and the instalment dates for this year
were 15 August 2025, 15 November 2025, 15 February 2026 and 15 May 2026
[IRA s.90(2)(a)]. The engine will not compute a schedule from the liability it derived,
because the statute runs the formula on the taxpayer's own estimate and the two are
different figures.

The return is due **30 November 2026**, eight months after the year of assessment ends on
31 March 2026 [IRA s.93(1)].

No final payment date is stated. Whether one exists separately from the fourth instalment
is unresolved (Q22).

## Notes

The rates applied here — the ladder [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)], the
15% maximum [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)] and the Rs. 1,800,000 relief
[PN/IT/2025-01, para 1] — are each verified against primary sources held in `docs/sources/`,
and the engine raises no `unverified-rate` warning on this computation. The fixture is
nevertheless `verified: false`, because the *availability of the relief against this income*
is Q6 and is only partially verified. Downgrading a claim never needs justification;
upgrading this one needs the Y/A 2025/2026 return form or IRD guidance saying so in terms.

Two further things this document does not settle, and which decide whether Nirmala's actual
affairs look like this fixture at all: whether a Wise or Payoneer balance drawn down into a
local bank satisfies the condition (Q41), and whether **partial** remittance qualifies
partially or fails entirely (Q11) — which is her real situation in the persona.

## Self-check

- Band-by-band tax sums to the stated gross tax: 60,000 + 75,000 + 75,000 + 75,000 +
  255,000 = 540,000.
- Taxable income falls within the bands charged: 1,000,000 + 500,000 + 500,000 + 500,000 +
  1,700,000 = 4,200,000.
- No band is charged above the cap: the effective rates are 6%, 15%, 15%, 15%, 15%, none
  above 15%, and none above its own ladder rate.
- Instalments plus final payment sum to the liability: no estimate, so no schedule was
  computed; the Rs. 540,000 is unsettled by instalments.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 6,000,000.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
