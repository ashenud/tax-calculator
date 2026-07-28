# 03 — Reliefs and qualifying payments

> **Status:** partial — personal relief verified; qualifying payments not
> **Sources:** pn-it-2025-01.pdf, iit-return-form-2024-25.pdf
> **Last reviewed:** 2026-07-28

## Verified — personal relief, Y/A 2025/2026

The relief is Rs. 1,800,000 [PN/IT/2025-01, para 1], deductible in arriving at the taxable
income of an individual who is **resident in Sri Lanka, or a non-resident but a citizen of
Sri Lanka**, for any year of assessment commencing from Y/A 2025/2026
[PN/IT/2025-01, para 1].

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
