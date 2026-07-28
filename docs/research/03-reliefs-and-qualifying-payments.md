# 03 — Reliefs and qualifying payments

> **Status:** partial — personal relief verified; qualifying payments not
> **Sources:** pn-it-2025-01.pdf, iit-return-form-2024-25.pdf
> **Last reviewed:** 2026-07-28

## Verified — personal relief, Y/A 2025/2026

The relief is Rs. 1,800,000 [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)], deductible in
arriving at the taxable income of an individual who is **resident in Sri Lanka, or a
non-resident but a citizen of Sri Lanka**, for any year of assessment commencing on or
after 1 April 2025 [PN/IT/2025-01, para 1].

The operative words, inserted as a new item (v):

> "Rs. 1,800,000, for each year of assessment commencing on or after April 1, 2025"

[IRA Fifth Schedule para 2(a)(v), as inserted by Act 2/2025 s.5(3)]

**Where it sits structurally matters.** Personal relief is not a free-standing deduction —
it lives in the **Fifth Schedule**, which s.52(1) deducts as "the aggregate qualifying
payments referred to in the Fifth Schedule" in arriving at taxable income [IRA s.52(1)].
Relief and qualifying payments are therefore one deduction step in the Act's scheme, not
two, and the engine should model them that way.

So a non-resident citizen receives the same relief as a resident — settling Q35.

### Relief is applied once, against aggregated assessable income

The Y/A 2024/2025 return form settles the ordering question directly. Its Section 01
computes:

- **Part A — income liable to tax:** employment (Schedule 1) + business (Schedule 2) +
  investment (Schedule 3) + other (Schedule 4) = **assessable income**
  [Asmt_IIT_001 Y/A 2024/2025, Section 01 Part A]
- **Part B — deductions from assessable income:** reliefs, then qualifying payments
  [Asmt_IIT_001 Y/A 2024/2025, Section 01 Part B]

Relief is therefore deducted **once, from the aggregate**, not per head of income. This is
the rule the engine already asserts, and it now has documentary support rather than
assumption. It must stay covered by a fixture with income under two heads — applying
relief twice is the most common error in this domain and produces an entirely plausible
wrong answer.

> **Still open:** whether relief is available against income taxed under the reduced
> service-export / foreign-source schedule (Q6), and how it is allocated where income
> spans two schedules (Q14). The 2024/25 return predates that regime, so it cannot answer
> either. See [`12-open-questions.md`](12-open-questions.md).

### Relief is not available against capital gains

The Fifth Schedule provides that the personal relief

> "is not available to be deducted against gains from the realisation of investment
> assets"

[IRA Sch.5 para 2(a), as enacted 2017]

It also excludes an individual acting **as a trustee, receiver, executor or liquidator**
from deducting it in that capacity [IRA Sch.5 para 2(a), as enacted 2017].

Both are structural rules rather than amounts, so they are less likely to have been
amended away than the figures — but both are 2017 text and need confirming against the
current Fifth Schedule.

## The other reliefs — 2017 text, currency not established

Paragraph 2 of the Fifth Schedule carries more than the personal relief. As enacted:

| Relief | 2017 amount | Cited |
|---|---|---|
| Personal | Rs. 500,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Employment income | Rs. 700,000, capped at the individual's employment income | [IRA Sch.5 para 2(b), as enacted 2017] |
| Rental income | 25% of total rental income, in lieu of claiming actual repair, maintenance and depreciation costs | [IRA Sch.5 para 2(c), as enacted 2017] |
| Senior citizen interest | Rs. 1,500,000, capped at the individual's interest income from a financial institution | [IRA Sch.5 para 2(d), as enacted 2017] |
| **Foreign-currency service income** | Rs. 15,000,000, capped at such income for the year | [IRA Sch.5 para 2(e), as enacted 2017] |

> **Do not use these figures.** Personal relief alone is known to have moved from
> Rs. 500,000 [IRA Sch.5 para 2(a), as enacted 2017] to Rs. 1,800,000
> [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)], and the route it took proves the
> schedule was restructured on the way: Act 2/2025 inserts an **item (v)** into
> subparagraph (a), but the 2017 subparagraph (a) has no items at all. An amendment we do
> not hold rewrote it into a series of period-keyed items. The same is likely true of the
> others.

### Paragraph 2(e) matters to persona p1

The 2017 Fifth Schedule contained a relief of Rs. 15,000,000 [IRA Sch.5 para 2(e), 2017]
specifically for a resident individual with income
earned in foreign currency in Sri Lanka from services rendered to a person to be utilised
outside Sri Lanka — the same population now caught by the 15% cap [IRA Sch.1 para 1(6)],
analysed in
[`05-foreign-currency-service-income.md`](05-foreign-currency-service-income.md).

**Whether it survives to Y/A 2025/2026 is unknown and consequential.** If it does, a
consultant's first Rs. 15,000,000 [IRA Sch.5 para 2(e), 2017] of qualifying foreign income
may be relieved before the capped ladder applies at all, which would change persona p1's answer by more than the rate
itself does. Neither Act 2/2025 nor PN/IT/2025-01 mentions it — and silence is not repeal.
Recorded as Q47.

## Qualifying payments

The Fifth Schedule paragraph 1 lists what s.52 deducts as qualifying payments
[IRA Sch.5 para 1, as enacted 2017]:

- **(a)** money donations to an approved charitable institution providing institutionalised
  care for the sick or needy and declared as approved by the Minister — capped for an
  individual at one-third of taxable income or Rs. 75,000 [IRA Sch.5 para 1(a)(iia), 2017],
  whichever is less
- **(b)** donations in money or otherwise to the Government, a local authority, specified
  higher education institutions, and a list of named public funds
  [IRA Sch.5 para 1(b), as enacted 2017]
- **(c)** profits remitted to the President's Fund by a public corporation where required by
  the law establishing it [IRA Sch.5 para 1(c), as enacted 2017]

Note how narrow (a) is. It is not "charitable donations" generally — the institution must
provide **institutionalised care for the sick or the needy** *and* be declared approved by
the Minister [IRA Sch.5 para 1(a), as enacted 2017]. A donation to an ordinary registered
charity does not qualify. The calculator must not offer a generic "charitable donations"
field.

The former expenditure relief for health, education and housing does not appear in the
2017 Fifth Schedule at all, so descriptions of it in circulating secondary material relate
to the pre-2017 law or to reliefs introduced and removed between 2018 and 2024. Q33
remains open pending those acts.

## What this document must still establish

What is deducted between assessable income and taxable income, for whom, and once or
repeatedly.

## Why this is more error-prone than it looks

Personal relief is a single large deduction. Applying it twice — once against employment
income and again against business income — produces a wrong answer that looks entirely
reasonable and will not be caught by inspection. It is the most common arithmetic error
in this domain, appearing in published articles as well as in other calculators.

The rule to establish and then enforce with a fixture: **relief is applied once, against
total assessable income.**

## Questions to answer

**Personal relief**

1. ~~The amount for Y/A 2025/2026~~ — **verified above.** Still needed: the amount for
   each prior year the tool supports, which requires the 2018–2024 amendment acts.
2. ~~Which taxpayers get it~~ — **verified above** for residents and non-resident
   citizens. Still open: whether a non-resident non-citizen is excluded entirely.
3. Whether it is proportioned for a part-year of residency.
4. ~~Applied against total assessable income or per head~~ — **settled above** by the
   return's structure. Still worth locating the statutory basis rather than relying on
   the form alone.
5. Whether it applies against income taxed under the reduced service-export/foreign
   schedule, or only against normal-rate income. **This is Q6, and it is central** — for a
   consultant with only foreign income, whether relief applies at all changes the
   liability substantially.
6. Whether unused relief is lost or can be carried.

**Qualifying payments**

7. Which qualifying payments survive for Y/A 2025/2026. Several were removed in the 2023
   changes and secondary sources still describe reliefs that no longer exist — this is a
   place where stale information is actively circulating.
8. For each surviving one: the cap, the rate of relief, and the evidence required.
9. Whether the former expenditure relief (health, education, housing and similar) still
   exists in any form.
10. Treatment of contributions to approved funds — EPF, ETF, approved pension schemes.
11. Charitable and government donations.

**Interaction**

12. Ordering: personal relief before qualifying payments, or after? If both are capped by
    reference to income, order changes the result.

## What the calculator needs from this

- Relief applied exactly once, enforced by a fixture with income under two heads
- A qualifying-payments input listing only reliefs that actually exist for the selected
  Y/A — driven by the tax data file, so a removed relief disappears from the form when
  the year changes
- An explicit answer on relief against reduced-schedule income, since the primary persona
  depends on it

## Where to look

IRA 2017 — the relief and qualifying payment provisions and the relevant schedule. Then
every amendment act, since this is among the most frequently amended areas. Act 2/2025 for
the current personal relief figure.

## Open questions

Q6, Q33 in [`12-open-questions.md`](12-open-questions.md). Q1 and Q35 are verified and
recorded above.
