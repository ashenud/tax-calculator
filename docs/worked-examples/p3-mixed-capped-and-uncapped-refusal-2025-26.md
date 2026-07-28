---
id: p3-mixed-capped-and-uncapped-refusal-2025-26
persona: p3
yearOfAssessment: "2025/2026"
verified: false
unverifiedBecause: >-
  This fixture asserts a refusal, not a figure — no tax is computed, so no rate is applied
  and none could be verified. The income lines it does assert deduct the Rs. 1,800,000
  relief against a pool that includes foreign-source income, which is Q6 (partially
  verified). The refusal itself is Q14: which of the capped and uncapped income occupies
  the lower bands, and how the single Fifth Schedule deduction divides between them, is not
  stated by the Act.

input:
  residency: resident
  income:
    employment:
      - label: Salary from a Colombo company, APIT deducted, 12 months
        amount: 3000000
    business:
      - label: Evening design work for two clients in the EU, paid in EUR
        amount: 4000000
        tags: [foreign-capped]
        conditions: { remitted-through-bank-to-sri-lanka: true }
  creditsPaid:
    apit: 240000

expected:
  refusal: { code: mixed-capped-and-uncapped-ordering, question: Q14 }
  assessableByHead: { employment: 3000000, business: 4000000, investment: 0, other: 0 }
  partition: { reliefEligible: 7000000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 5200000
  taxableGain: 0
  warnings: []
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
---

> **No figure was computed for this case, and none appears below.** The treatment is
> genuinely unresolved — **Q14** in
> [`../research/12-open-questions.md`](../research/12-open-questions.md) — and the engine
> refuses rather than produce a plausible answer. This document is a worked example of a
> refusal. If you are in this position, take it to a qualified tax practitioner or to IRD.

# P3 — salary plus foreign freelance income remitted through a bank: a refusal, Y/A 2025/2026

## Facts

Fathima ([persona P3](../personas/p3-mixed-employment-business.md)) has a full-time job at a
Colombo company that deducts APIT correctly, and takes on design work in the evenings for
two clients in the EU, paid in EUR.

For Y/A 2025/2026 (1 April 2025 – 31 March 2026), resident in Sri Lanka:

| | Amount |
|---|---|
| Salary, employment income | 3,000,000 |
| APIT deducted by her employer | 240,000 |
| Freelance design fees from EU clients, net of expenses | 4,000,000 |

The EUR payments were **received in foreign currency and remitted through a bank to
Sri Lanka**, so the answer to the cap's condition is `true`
[IRA Sch.1 para 1(6)(a),(b), ins. Act 2/2025 s.3(1)(d)]. She made no qualifying payments and
filed no Statement of Estimated Tax.

That combination — capped income *and* other ordinary income, both large enough that
something is left on the ladder for each after the deduction — is exactly the case the
engine refuses.

## What can be computed, and what stops

The computation runs normally up to the point where the law runs out. Those steps are stated
because they are what a practitioner taking the case over needs; they are not an answer.

| Step | Amount | Authority |
|---|---|---|
| Employment income | 3,000,000 | [IRA s.5] |
| Business income (freelance design, net of expenses) | 4,000,000 | [IRA s.6] |
| **Total assessable income** | **7,000,000** | [IRA s.3] |
| Relief-eligible portion | 7,000,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **5,200,000** | [IRA s.52(1)] |

And then it stops. **No rate schedule is applied, no gross tax is computed, the APIT of
Rs. 240,000 is never credited, and no payment schedule is produced** — not even the return
due date, which is derivable from the year alone, because a date printed beside a refusal
invites the reading that something was computed.

The result carries `refusals: [{ code: mixed-capped-and-uncapped-ordering, question: Q14 }]`
and an explanation. It is not a warning: a warning qualifies a figure that was produced, and
here none was.

## Why it stops — Q14

The maximum rate of 15% is imposed on foreign-currency service income *notwithstanding* the
normal ladder [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. The ladder is progressive:
its first Rs. 1,000,000 is charged at 6% and its balance above Rs. 2,500,000 at 36%
[IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)].

Fathima has Rs. 4,000,000 of income entitled to the cap and Rs. 3,000,000 that is not, and
both sit on the same schedule. **The Act does not say which of them occupies the lower
bands**, nor how the single Fifth Schedule deduction [IRA s.52(1)] divides between them.
Both questions change the answer materially, and neither is settled.

An illustration of the size of the problem, deliberately *not* stated as a candidate answer:
if her salary took the lower bands first, her freelance income would sit against bands whose
rates are all above 15% and would be charged at the flat maximum throughout. If her freelance
income took them first, part of it would be charged at 6% and her salary would be pushed up
the ladder into the 30% and 36% bands. The two readings are hundreds of thousands of rupees
apart on these facts. Selecting one and printing the result would be a guess presented as an
answer.

Per
[`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md),
the engine refuses. Fathima cannot tell a correct answer from a plausible one; if the tool
gives her a figure she will file on it. A refusal that explains what is unresolved sends her
to a practitioner, which is the right outcome for a genuinely unsettled point.

## What does *not* trigger the refusal

The refusal is narrower than "any capped income alongside anything else". Three neighbouring
cases are computable and are covered by their own fixtures:

- **All the ordinary income is capped.** Nothing is left to be ordered against it —
  [`p1-foreign-remitted-2025-26.md`](p1-foreign-remitted-2025-26.md).
- **The condition is not met**, so the cap never applies and everything sits on the
  unmodified ladder —
  [`p1-foreign-not-remitted-2025-26.md`](p1-foreign-not-remitted-2025-26.md) and
  [`p3-instalments-estimate-above-liability-2025-26.md`](p3-instalments-estimate-above-liability-2025-26.md),
  which is Fathima's own tractable branch.
- **The only other income is a capital gain.** A gain never touches this ladder — it is
  separately rated and outside the relief [IRA Sch.5 para 2(a), as enacted 2017] — so there
  is nothing to order. See
  [`p4-capital-gain-with-ordinary-income-2025-26.md`](p4-capital-gain-with-ordinary-income-2025-26.md).

A deduction large enough to reduce taxable income to nil is also computable, because every
ordering then gives zero.

## What would resolve it

The **Y/A 2025/2026 IIT return form**. The structure of its schedules should reveal how IRD
expects the two to be ordered — see
[`../research/11-filing-walkthrough.md`](../research/11-filing-walkthrough.md). Until then
Q14 stays open and this case stays refused.

## Notes

This document deliberately contains **no** `components`, `grossTax`, `credits`, `taxPayable`
or `schedule` in its front matter, and the fixture format rejects those keys beside a
`refusal`. On the refusal path those fields are zeroed placeholders; asserting
`taxPayable: 0` would record "no answer was produced" as "no tax is due", which is the worst
available outcome — a taxpayer with a real liability told they owe nothing, with a passing
test behind it.

The APIT of Rs. 240,000 is left in the input on purpose. It is what Fathima would enter, and
its fate here is instructive: credits are subtracted from a gross tax that was never
computed, so step 7 does not run at all. She has paid Rs. 240,000 towards a liability nobody
can yet state.

What this fixture would catch if it broke: the refusal being downgraded to a warning beside
a computed number, the refusal firing on one of the three computable cases above, working
being emitted where none was produced, or the income lines diverging from what the taxpayer
entered.

## Self-check

The self-check list in [`README.md`](README.md) is about a computed liability, so most of it
is inapplicable here. What can be checked:

- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 7,000,000 of aggregate relief-eligible income.
- Taxable income follows from the partition and the deduction:
  max(0, 7,000,000 − 1,800,000) = 5,200,000.
- The relief-ineligible partition and taxable gain agree at nil — there is no capital gain.
- No figure is stated anywhere in the front matter, and no band, rate or total appears in
  the prose as this taxpayer's liability.
- Front matter is valid YAML and matches the refusal schema in [`README.md`](README.md).
