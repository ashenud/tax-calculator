---
id: p3-instalments-estimate-above-liability-2025-26
persona: p3
yearOfAssessment: "2025/2026"
verified: false
unverifiedBecause: >-
  Q6 — that the personal relief is available against service-export / foreign-source income
  is a structural reading of s.52(1), not an express statement, and is recorded
  "partially verified" in docs/research/12-open-questions.md. This computation deducts the
  full Rs. 1,800,000 relief against a pool that includes foreign-source freelance income, so
  it asserts an answer to Q6. Every rate the engine applies here is verified — the maximum
  rate cap does not apply, because the condition was not met — and no "unverified-rate"
  warning is raised; the downgrade is on the availability of the relief against this income,
  not on a rate.

input:
  residency: resident
  income:
    employment:
      - label: Salary from a Colombo company, APIT deducted, 12 months
        amount: 3000000
    business:
      - label: Evening design work for two EU clients, paid into an account she holds abroad
        amount: 2000000
        tags: [foreign-capped]
        conditions: { remitted-through-bank-to-sri-lanka: false }
  creditsPaid:
    apit: 200000
  estimatedTaxForInstalments: 550002

expected:
  assessableByHead: { employment: 3000000, business: 2000000, investment: 0, other: 0 }
  partition: { reliefEligible: 5000000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 3200000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 3200000
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
        - amount: 700000
          rateBp: 3600
          effectiveRateBp: 3600
          tax: 252000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 672000
  grossTax: 672000
  credits: { apit: 200000, ait: 0, foreign: 0, total: 200000, excess: 0 }
  taxPayable: 472000
  schedule:
    instalments:
      - { quarter: 1, due: "2025-08-15", amount: 137500 }
      - { quarter: 2, due: "2025-11-15", amount: 137500 }
      - { quarter: 3, due: "2026-02-15", amount: 137501 }
      - { quarter: 4, due: "2026-05-15", amount: 137501 }
    finalPayment: { due: "", amount: -78002 }
    returnDue: "2026-11-30"
  warnings:
    - { code: rate-cap-condition-not-met, severity: warn }
    - { code: estimate-exceeds-liability, severity: warn }
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
    - "ira-2017#s.90(2)(a)"
    - "ira-2017#s.93(1)"
---

> **One point below is unverified.** Whether the personal relief is available against
> service-export / foreign-source income is **Q6**, recorded as *partially verified* in
> [`../research/12-open-questions.md`](../research/12-open-questions.md). The deduction of
> Rs. 1,800,000 is an answer to that question. Every *rate* applied here is verified.

# P3 — an estimate that overshoots: instalments exceeding the liability, Y/A 2025/2026

## Facts

Fathima ([persona P3](../personas/p3-mixed-employment-business.md)) has a full-time job at a
Colombo company that deducts APIT, and does design work in the evenings for two EU clients
paid in EUR.

This is persona P3's **tractable branch**. Her freelance earnings were paid into an account
she holds abroad and stayed there, so the maximum-rate cap does not apply and everything sits
on the normal ladder. Where the freelance income *is* remitted, the case is refused — see
[`p3-mixed-capped-and-uncapped-refusal-2025-26.md`](p3-mixed-capped-and-uncapped-refusal-2025-26.md).

For Y/A 2025/2026 (1 April 2025 – 31 March 2026), resident in Sri Lanka:

| | Amount |
|---|---|
| Salary, employment income | 3,000,000 |
| APIT deducted by her employer | 200,000 |
| Freelance design fees from EU clients, net of expenses | 2,000,000 |
| Her estimate of tax payable, per her Statement of Estimated Tax | **550,002** |
| Was the freelance income remitted through a bank to Sri Lanka? | **no** |

She filed the Statement of Estimated Tax early in the year, computing it from projected
billings converted at the exchange rates then current — which is why it is not a round
number. Her billings then fell short of the projection, so the estimate proved too high. No
qualifying payments, no foreign tax paid.

## Computation of the liability

### Steps 1 to 3

| Step | Amount | Authority |
|---|---|---|
| Employment income | 3,000,000 | [IRA s.5] |
| Business income (freelance design, net of expenses) | 2,000,000 | [IRA s.6] |
| **Total assessable income** | **5,000,000** | [IRA s.3] |
| Relief-eligible portion | 5,000,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **3,200,000** | [IRA s.52(1)] |

One deduction of Rs. 1,800,000 against the aggregate of two heads, not one per head
[IRA s.52(1)].

### Step 5 — the condition, unmet, and why that makes this case computable

The freelance income is tagged for the maximum-rate cap, so the cap's condition is evaluated
**first**. The Act requires the payment to be received in foreign currency **and** remitted
through a bank to Sri Lanka [IRA Sch.1 para 1(6)(a),(b), ins. Act 2/2025 s.3(1)(d)].
Fathima's earnings satisfy the first limb and not the second.

The cap therefore does not apply, and there is no reduced fallback schedule to switch to —
`ifNotMet` is `null` and the normal ladder stands unmodified
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. The engine records a
`rate-cap-condition-not-met` warning and produces a `ladder` component only; there is no
`capped` component.

**This is what makes the case computable.** With no capped income there is nothing to order
against her salary, so Q14 — which of the capped and uncapped income occupies the lower bands
— never arises. The same taxpayer with the same figures, remitting through a bank, gets a
refusal instead of the number below.

### Steps 4 and 6 — the ladder

Nothing is carved out [IRA Sch.1 para 1(2)(d), as enacted 2017], and both heads share one
ladder.

| Band | Amount | Rate | Charged at | Tax | Authority |
|---|---|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | 6% | 60,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 18% | 18% | 90,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 24% | 24% | 120,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Next 500,000 | 500,000 | 30% | 30% | 150,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| Balance | 700,000 | 36% | 36% | 252,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Gross tax** | | | | **672,000** | |

Every `effectiveRateBp` equals its `rateBp`: no cap bit.

### Step 7 — credits

Her employer deducted **Rs. 200,000** of APIT, taken from her certificate as given; no APIT
table for Y/A 2025/2026 is held [PN/IT/2025-01, para 2.3]. No AIT — withholding on service
fees under [IRA s.85(1)(a)] covers an enumerated list that ordinary design work probably
falls outside, and her clients are overseas in any case. No foreign tax was paid
[IRA s.81(1)].

```
gross tax        672,000
less APIT       (200,000)
tax payable      472,000
```

**Tax payable is Rs. 472,000**, with no excess credit.

## Payment schedule

### The instalments follow the estimate — including its rounding residue

[IRA s.90(3)]: `instalment = (A − C) / B`, with **A = Rs. 550,002**, her own estimate. Each
division is floored and C carries forward:

| Quarter | Due | A − C | B | (A − C) / B | Instalment | Authority |
|---|---|---|---|---|---|---|
| 1 | 15 Aug 2025 | 550,002 | 4 | 137,500.5 | 137,500 | [IRA s.90(2)(a)] |
| 2 | 15 Nov 2025 | 412,502 | 3 | 137,500.67 | 137,500 | [IRA s.90(2)(a)] |
| 3 | 15 Feb 2026 | 275,002 | 2 | 137,501 | 137,501 | [IRA s.90(2)(a)] |
| 4 | 15 May 2026 | 137,501 | 1 | 137,501 | 137,501 | [IRA s.90(2)(a)] |
| | | | | | **550,002** | |

**The residue lands on the last instalments, and nothing leaks.** Flooring each division and
carrying C forward is self-correcting: the fourth instalment has B = 1, so it is exactly
A − C, the whole unpaid balance of the estimate. The four sum to Rs. 550,002 exactly — the
estimate, to the rupee.

This is what distinguishes the statutory formula from "a quarter each": a quarter of
Rs. 550,002 is Rs. 137,500.50, which is not an integer number of rupees, and four of them
would leave two rupees unallocated. The formula never does.

### The final payment is negative — an overpayment

```
tax payable                    472,000
less instalments             (550,002)
                             ---------
final payment                  -78,002
```

**The final payment is minus Rs. 78,002.** The instalments computed from Fathima's estimate
come to Rs. 78,002 more than the tax this computation makes payable, so what the schedule
shows is an **overpayment, not a balance due**.

The amount is signed and is **never clamped to zero**. Clamping would hide the overpayment
and break the rule that instalments plus final payment sum exactly to the liability:
550,002 − 78,002 = 472,000. The engine raises an `estimate-exceeds-liability` warning saying
so in terms.

Whether the Rs. 78,002 is refunded or carried forward is not settled by the sources this
project holds (Q20 — refunds demonstrably exist, [PN/IT/2025-01, para 4], but the general
treatment of an overpayment of this kind is unconfirmed), so no treatment is assumed.

Paying instalments on an estimate that later proves too high is ordinary and not an error.
The estimate can be revised under [IRA s.91], which reshapes every remaining instalment
through the same `(A − C) / B` formula — this document shows the schedule as it stood on the
estimate she actually filed.

The return is due **30 November 2026**, eight months after the year of assessment ends
[IRA s.93(1)].

## Notes

`verified: false` for Q6 only: the relief is deducted against a pool including foreign-source
income, which is a structural reading of [IRA s.52(1)] rather than an express statement. No
rate applied here is unverified — the ladder [IRA Sch.1 para 1(1D), ins. Act 2/2025
s.3(1)(b)] and the relief amount [PN/IT/2025-01, para 1] are both confirmed, the cap is not
applied at all, and the engine raises no `unverified-rate` warning. The instalment dates
(Q21), the eight-month filing rule (Q23) and the `(A − C) / B` basis (Q25) are all in the
verified table of [`../research/12-open-questions.md`](../research/12-open-questions.md).

Its counterpart,
[`p2-instalments-estimate-below-liability-2025-26.md`](p2-instalments-estimate-below-liability-2025-26.md),
is the case where the estimate falls **short** and the final payment is positive.

What this fixture would catch if it broke: a final payment clamped at zero, the sign dropped
from an overpayment, `A / B` computed without carrying C forward, rounding done on the total
rather than per instalment, the `estimate-exceeds-liability` warning going missing, a failed
cap condition silently applying the cap, and warnings emitted in the wrong order.

## Self-check

- Band-by-band tax sums to the stated gross tax:
  60,000 + 90,000 + 120,000 + 150,000 + 252,000 = 672,000.
- Taxable income falls within the bands charged:
  1,000,000 + 500,000 + 500,000 + 500,000 + 700,000 = 3,200,000.
- Instalments plus final payment sum exactly to the liability:
  137,500 + 137,500 + 137,501 + 137,501 = 550,002, plus (−78,002) = 472,000 = tax payable.
- The instalments sum exactly to the estimate: 550,002 = 550,002.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 5,000,000 drawn from two heads.
- Credits sum correctly: 200,000 + 0 + 0 = 200,000, and 672,000 − 200,000 = 472,000 with no
  excess.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate and every date carries a citation in the prose.
