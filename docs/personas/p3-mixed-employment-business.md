# P3 — Salary plus foreign freelance income

> **Status:** blocked — the central computation is unresolved
> **Related research:** [`../research/05-foreign-currency-service-income.md`](../research/05-foreign-currency-service-income.md), [`../research/03-reliefs-and-qualifying-payments.md`](../research/03-reliefs-and-qualifying-payments.md)

## The person

Fathima has a full-time job at a Colombo company that deducts APIT correctly. She also
takes on design work in the evenings for two overseas clients, paid in EUR into her bank
account here.

Her employer's deduction covers her salary. The freelance income is hers to declare, and
she has no idea how the two fit together — whether the freelance income is added on top
of her salary and taxed at her marginal rate, or taxed separately under the reduced
regime, or something in between.

## Why this is the hardest case

Her income spans **two rate schedules**: salary on the normal ladder, foreign freelance
income on the reduced one. Personal relief is a single deduction. How it is allocated
between the two schedules changes her liability materially, and the candidate readings
give genuinely different answers:

- Relief set against normal-rate income first, remainder to the reduced schedule
- Relief apportioned pro rata by assessable amount
- The two computed wholly separately, with relief against normal-rate income only

There is a second, related question: whether the reduced schedule's own band ladder
starts fresh for her freelance income, or whether her salary has already consumed the
lower bands.

## Status: blocked

This is **Q14** in [`../research/12-open-questions.md`](../research/12-open-questions.md),
and it is the single unresolved item that blocks the calculation engine.

Per [`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md),
**the engine must refuse this case** until it is resolved from primary sources. It must
not pick the most plausible reading and present a number.

The reasoning: Fathima cannot tell a correct answer from a plausible one. If the tool
gives her a figure, she will file on it. A refusal that explains what is unresolved sends
her to a practitioner, which is the right outcome for a genuinely unsettled point. A
confident wrong number sends her to IRD with a wrong return.

The IIT return form may resolve this faster than the act — see
[`../research/11-filing-walkthrough.md`](../research/11-filing-walkthrough.md). The
structure of the form's schedules should reveal how IRD expects the computation to run.

## Decision path

```
Employment income (APIT deducted) + foreign freelance income
├─ freelance income remitted through a bank to Sri Lanka?
│  ├─ no  → both on the normal ladder — this case IS computable
│  └─ yes → two schedules
│           └─ how is relief allocated?  ← Q14, UNRESOLVED → refuse
└─ credit APIT already deducted
```

Note the tractable branch: if the freelance income was **not** remitted, everything sits
on the normal ladder and the case is a straightforward aggregation. That path can ship
while Q14 is open.

## What the calculator must ask her

1. Year of assessment
2. Gross employment income, and APIT deducted
3. Foreign freelance income, currency, and **how the money reached her** — the same
   question as persona p1, with the same real-world options
4. Any Sri Lankan freelance clients — a third schedule question if so. Do **not** assume
   withholding was applied to those fees [IRA s.85(1)(a)]: that provision covers an
   enumerated list which ordinary consultancy work probably falls outside. See
   [`../research/07-wht-ait-and-credits.md`](../research/07-wht-ait-and-credits.md).
5. Business expenses attributable to the freelance work
6. Qualifying payments
7. Any tax withheld overseas

## What she needs told

- That her employer's deduction does not cover the freelance income
- That the freelance income likely brings an instalment obligation her salary alone did
  not
- Where the two are reported separately on the return
- Honestly, where the treatment is unsettled — and that this is a case worth taking to a
  practitioner

## Worked examples needed

- Salary plus foreign income **not** remitted — computable now, both on the normal ladder
- Salary plus foreign income remitted — **blocked on Q14**
- Salary plus local freelance income — normal ladder throughout, computable now

Writing the blocked example prematurely would enshrine a guessed allocation as an
expected test result, which is worse than having no fixture: the guess would then be
defended by a passing test.
