# 10 — Compliance calendar

> **Status:** partial — instalments, estimates and the filing deadline verified; penalties not
> **Sources:** ir-act-24-2017.pdf
> **Last reviewed:** 2026-07-28

## Verified

### Who must pay by instalment

A person is an **instalment payer** who derives or expects to derive assessable income
during a year of assessment [IRA s.90(1)]:

> "(a) from a business or investment; or **(b) from an employment where the employer is not
> required to withhold tax under section 83**."

[IRA s.90(1)]

Limb (b) is persona p2 stated in the Act's own words, and limb (a) covers persona p1.
This settles Q28: an employee whose employer does not withhold is an instalment payer,
with the obligation arising directly from s.90 rather than from anything the employer
does or fails to do.

### Instalment dates

For a taxpayer whose year of assessment is the twelve months ending 31 March, instalments
fall due on or before the fifteenth day of **August, November and February** in that year
of assessment, and the fifteenth day of **May** of the next succeeding year of assessment
[IRA s.90(2)(a)].

Note the fourth instalment falls in the *following* year of assessment — a detail that a
naive "four quarters within the year" model gets wrong.

### How much each instalment is

Not a flat quarter of the liability. The Act gives a formula [IRA s.90(3)]: `(A − C) / B`,
where **A** is the current estimated tax payable under s.91 or s.92, **B** is the number of
instalments remaining including the current one, and **C** is tax already paid for the year
[IRA s.90(3)].

Two consequences for the engine: instalments are driven by the taxpayer's **estimate**,
not by the final computed liability; and a revised estimate reshapes every remaining
instalment. This settles Q25.

### The estimate

Every instalment payer must file an estimate of tax payable for the year with the
Commissioner-General **by the date for payment of the first instalment** [IRA s.91(1)].

### Filing deadline

> "every person shall file with the Commissioner-General **not later than eight months
> after the end of each year of assessment** a return of income for the year."

[IRA s.93(1)]

**This is a rule, not a date.** For Y/A 2025/2026, ending 31 March 2026, eight months
gives 30 November 2026 — but the data model should carry the rule and derive the date, so
that a new year of assessment needs no new deadline entry. This settles Q23.

## What this document must still establish

Every date an individual taxpayer must meet, what must be done by each, and what happens
when one is missed.

## Why the dates matter more than the arithmetic

For both priority personas, the deadlines are the thing they did not know about. A
consultant who correctly computes their liability and pays it all in November has still
missed four instalments and accrued interest on each. The tool's most valuable output for
these users may be a schedule of dates, not a single number.

## Questions to answer

**Estimated tax and instalments**

1. Who must file a Statement of Estimated Tax, and by when?
2. On what basis is the estimate computed — the taxpayer's own forecast, or a prior-year
   safe harbour?
3. The four instalment dates and the period each covers.
4. How each instalment amount is derived from the estimate.
5. What happens when the estimate turns out to be wrong — is it revised mid-year, and is
   there a penalty for a materially low estimate?
6. Whether an employee with APIT fully deducted is relieved of the instalment obligation,
   and whether that relief is lost when the employer does not deduct. **This is the pivot
   for persona p2.**

**Final payment and return**

7. The final payment date, and how the balance is computed.
8. The return filing deadline.
9. Whether e-filing is mandatory, from when, and for whom.
10. Whether the payment deadline and the filing deadline differ — they appear to, and a
    taxpayer who assumes filing and paying happen together will be late on one.

**When something is missed**

11. Penalty for late filing — how computed.
12. Interest on late payment — rate and how it accrues.
13. Penalty for underestimating instalments, if separate.
14. Whether there is any voluntary disclosure route, and what it costs. Directly relevant
    to a persona p2 employee discovering several unpaid years.

**Other dates**

15. Registration deadline for a person becoming liable for the first time.
16. Deadlines for the separate obligations — capital gains payment, amended returns.
17. Record-keeping period.

## What the calculator needs from this

- A personalised schedule of dates, not a generic calendar — output alongside every
  computed liability
- Instalment amounts derived from the estimate, since the estimate and the final
  liability routinely differ
- Clear treatment of the taxpayer who is already late, without either understating the
  consequence or being alarming about it

## A caution on the tool's own dates

The instalment dates must come from the tax year data file, not from a hardcoded
constant, and not from the system clock. In July 2026 a user might be filing for Y/A
2025/26, estimating for 2026/27, or amending 2023/24 — the correct dates differ, and
inferring "the current year" from `Date.now()` would silently give two of those three
users the wrong schedule.

## Where to look

IRA 2017 — the payment and filing provisions. The IRD Tax Calendar for the relevant year.
The SET form and its guide. IRD notices on e-filing.

## Open questions

Q22 (a separate final-payment date, if one exists beyond the fourth instalment) and Q26
(penalties and interest) in [`12-open-questions.md`](12-open-questions.md). Q21, Q23, Q25
and Q28 are verified above.
