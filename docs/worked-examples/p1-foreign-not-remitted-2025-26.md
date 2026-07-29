---
id: p1-foreign-not-remitted-2025-26
persona: p1
yearOfAssessment: "2025/2026"
verified: false
unverifiedBecause: >-
  Q6 — that the personal relief is available against service-export / foreign-source income
  is a structural reading of s.52(1), not an express statement, and is recorded
  "partially verified" in docs/research/12-open-questions.md. This computation deducts the
  full Rs. 1,800,000 relief against foreign-source income, so it asserts an answer to Q6.
  The ladder rates applied are verified; the relief's availability against this income is
  not. This document is also one half of a contrast pair, and the difference it exists to
  quantify is only as settled as the capped figure it is compared against.

input:
  residency: resident
  income:
    business:
      - label: Consultancy fees invoiced to clients in Australia and the UK
        amount: 6000000
        tags: [foreign-capped]
        conditions: { remitted-through-bank-to-sri-lanka: false }

expected:
  assessableByHead: { employment: 0, business: 6000000, investment: 0, other: 0 }
  partition: { reliefEligible: 6000000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 4200000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 4200000
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
        - amount: 1700000
          rateBp: 3600
          effectiveRateBp: 3600
          tax: 612000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 1032000
  grossTax: 1032000
  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }
  taxPayable: 1032000
  schedule:
    instalments: []
    finalPayment: { due: "", amount: 0 }
    returnDue: "2026-11-30"
  warnings:
    - { code: rate-cap-condition-not-met, severity: warn }
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
    - "ira-2017#s.93(1)"
---

> **This figure rests on an unverified point.** Whether the personal relief is available
> against service-export / foreign-source income is **Q6**, recorded as *partially
> verified* in [`../research/12-open-questions.md`](../research/12-open-questions.md). The
> deduction of Rs. 1,800,000 below is an answer to that question, not a settled rule.

# P1 — the same consultancy income, held offshore, Y/A 2025/2026

## Facts

Nirmala ([persona P1](../personas/p1-wfh-foreign-consultant.md)), the same taxpayer as
[`p1-foreign-remitted-2025-26.md`](p1-foreign-remitted-2025-26.md), on the same
Rs. 6,000,000 of consultancy income for Y/A 2025/2026, with **one fact changed**: the money
never came to Sri Lanka. Her overseas clients paid into an account she holds abroad and it
stayed there for the whole year.

Resident in Sri Lanka, no employer, no other income, no qualifying payments, no overseas tax
paid, no Statement of Estimated Tax. In the input the single changed field is
`conditions: { remitted-through-bank-to-sri-lanka: false }`.

Nothing else differs. That is the point of the pair.

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

**Taxable income is identical to the paired fixture.** The condition governs the *rate*, not
the computation of taxable income, so every line above this point is the same Rs. 4,200,000.
Whatever divergence there is between the two documents happens entirely in the next step.

Note also that the income is still **taxable**. The exemption Nirmala remembers was removed
with effect from 1 April 2025; failing the remittance condition does not restore it.

### Rate schedule — the condition, unmet

The condition is evaluated **before** any rate is applied. The Act requires the payment to
be received in foreign currency **and** remitted through a bank to Sri Lanka
[IRA Sch.1 para 1(6)(a),(b), ins. Act 2/2025 s.3(1)(d)]. Nirmala's earnings satisfy the
first limb and not the second.

When the condition is not met, **the cap simply does not apply**. There is no reduced
fallback schedule to switch to — `ifNotMet` is `null` — and the normal ladder stands
unmodified [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. The result records this as a
`rate-cap-condition-not-met` warning and produces a `ladder` component; there is **no
`capped` component at all**, because a failed condition does not produce a capped component
with `conditionsMet: false` — it produces no capped component.

| Band | Amount | Rate | Charged at | Tax | Authority |
|---|---|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | 6% | 60,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 18% | 18% | 90,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 24% | 24% | 120,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 30% | 30% | 150,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Balance | 1,700,000 | 36% | 36% | 612,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Gross tax** | | | | **1,032,000** | |

Every band's `effectiveRateBp` equals its `rateBp`. No cap bit.

### Credits

Nil, exactly as in the paired fixture: no employer and so no APIT, no withholding on fees
invoiced overseas, and no foreign tax paid [IRA s.81(1)]. **Tax payable is Rs. 1,032,000.**

## What the condition is worth

| | Remitted through a bank | Held offshore |
|---|---|---|
| Gross income | 6,000,000 | 6,000,000 |
| Taxable income | 4,200,000 | 4,200,000 |
| Gross tax | 540,000 | 1,032,000 |
| **Tax payable** | **540,000** | **1,032,000** |

**Rs. 492,000** — the same income, taxed at nearly twice the amount, on a fact about how the
money travelled. That difference is why persona P1's calculator must ask how the money
reached her rather than only how much she earned, and why an example showing only the
favourable path would teach nothing about the condition she has to satisfy.

This is a statement of what the law provides. It is **not** a suggestion to route payments
differently: that would be advice, which this project does not give
[CLAUDE.md rule 6].

## Payment schedule

No Statement of Estimated Tax, so no **A** for `(A − C) / B` [IRA s.90(3)] and no
instalments — though a liability of this size plainly carried an instalment obligation
through the year [IRA s.90(1)(b)], due 15 August 2025, 15 November 2025, 15 February 2026
and 15 May 2026 [IRA s.90(2)(a)].

The return is due **30 November 2026**, eight months after the year of assessment ends
[IRA s.93(1)]. No final payment date is stated (Q22, unresolved).

## Notes

`verified: false` for the same reason as its pair: the deduction of the relief against
foreign-source income answers Q6, which is only partially verified. The ladder rates
themselves [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] are verified, and the engine
raises no `unverified-rate` warning here — the flag is a downgrade on the *availability of
the relief*, which CLAUDE.md rule 3 permits without justification and which the contrast
above depends on being applied identically on both sides.

What is genuinely unsettled about Nirmala's own case is which of these two documents
describes her. She is paid partly through her bank and partly into a Wise balance she draws
down. Whether that satisfies the condition (Q41), and whether **partial** remittance
qualifies partially or fails entirely (Q11), are both open — and the tool refuses that
branch rather than picking a reading.

What this fixture would catch if it broke: a failed condition silently applying the cap
anyway, a failed condition producing a `capped` component instead of a `ladder` one, the
absence of the `rate-cap-condition-not-met` warning, and any invented fallback schedule for
unremitted foreign income.

## Self-check

- Band-by-band tax sums to the stated gross tax: 60,000 + 90,000 + 120,000 + 150,000 +
  612,000 = 1,032,000.
- Taxable income falls within the bands charged: 1,000,000 + 500,000 + 500,000 + 500,000 +
  1,700,000 = 4,200,000.
- Instalments plus final payment sum to the liability: no estimate, so no schedule was
  computed.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 6,000,000 — the same deduction, on the same income, as the
  paired fixture.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
