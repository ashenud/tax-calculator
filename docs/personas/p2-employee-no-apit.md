# P2 — Employee whose employer deducts nothing

> **Status:** unverified — the tax treatment below is provisional
> **Related research:** [`../research/06-apit.md`](../research/06-apit.md)
> **Priority:** high

## The person

Rajitha works for a twelve-person firm in Kandy. His payslip shows gross and net, and the
difference is EPF — no income tax. He assumed that meant he did not earn enough to be
taxed.

A colleague mentioned filing a return. Looking into it, Rajitha now suspects he has been
liable for at least two years and has paid nothing. He does not know whether this is his
employer's fault or his own, whether he owes penalties, or whether raising it will cause
a problem at work.

## Why he is underserved

Salary calculators assume APIT was deducted. They compute a liability, subtract the
deduction, and show a small balance or zero. For Rajitha the deduction is zero, so the
whole liability is his to pay — and the tools do not tell him the second, worse part:
that it was payable in **instalments through the year**, not in a lump at filing.

He is likely already late on instalments he did not know existed, accruing interest on
each.

## What is uncertain

- Whether APIT deduction is mandatory for the employer or elective with employee consent
  (Q30). This changes whether his employer defaulted or whether the arrangement was
  lawful, and the guidance page reads very differently either way.
- Whether non-deduction leaves the liability with him (Q27) — the working assumption, and
  the premise of this persona
- Whether he is obliged to pay by instalment (Q28)
- Whether any relief exists where the employer was at fault (Q29)
- Penalty and interest rates (Q26)
- Whether a voluntary disclosure route exists for the earlier years

**This persona's core claim is unverified.** If Q27 comes back contradicted, the persona
needs rewriting rather than adjusting.

## Decision path

```
Employment income for the Y/A
└─ Was APIT deducted?
   ├─ in full  → standard case; credit the deduction, likely small balance
   ├─ partly   → credit what was deducted; balance payable
   └─ not at all
      └─ liability remains with the employee (Q27 — unverified)
         ├─ instalment obligation for the current year (Q28)
         └─ earlier years unpaid?
            └─ back liability + interest + penalties (Q26, Q29)
```

The left branches are what other calculators handle. The bottom-right branch is Rajitha,
and it is where this tool earns its place.

## What the calculator must ask him

1. Year of assessment — and offer earlier years, because his problem is that there are
   several
2. Gross employment income for that year, including allowances and benefits
3. **How much APIT was deducted?** With "none" as a first-class answer, not an edge case,
   and a path that leads onward rather than to a zero result
4. Does he have a deduction certificate from his employer?
5. Any other income — investment, freelance
6. Qualifying payments
7. Has he filed for this year? For earlier years?
8. Does he have a TIN?

Question 3 must not treat "none" as an error state. That is the whole population this
persona exists for, and a form that fights them at that field loses them.

## What he needs told, beyond the number

- Plainly, whether the liability is his — this is his first question and he is anxious
  about it
- The instalment dates for the current year, and which have passed
- That earlier years need to be dealt with, and how, without alarming him past the point
  of acting
- That he needs a TIN
- That he should get professional help if several years are involved — the honest advice
  here is sometimes "this is beyond what a calculator should tell you"

## Tone

He is worried he has done something wrong, and in the common case he has not — he was not
told. Guidance should be matter-of-fact about the obligation and free of any suggestion
that he was careless.

Equally, the tool must not tell him what to do about his employer. Whether to raise it,
and how, is not a tax calculation.

## Worked examples needed

- Salary with no APIT deducted, current year, computing the instalment schedule
- The same salary with APIT correctly deducted — the contrast
- Salary just above the relief threshold, where the liability is small but real
- Two prior years unpaid, showing accumulated position — blocked on Q26
