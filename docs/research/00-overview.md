# 00 — Overview of the system

> **Status:** partial — the pipeline shape is confirmed against the return form
> **Sources:** iit-return-form-2024-25.pdf, ir-act-24-2017.pdf
> **Last reviewed:** 2026-07-28

## What this document must establish

The shape of Sri Lankan individual income tax: how a person's income becomes a number
they owe, and in what order. Enough that the numbered documents that follow have a frame
to hang on.

It is a map, not a rate table. No figures belong here — they live in
[`04-rate-tables.md`](04-rate-tables.md).

## The pipeline

Confirmed against the structure of the Y/A 2024/2025 individual return, whose Section 01
computes assessable income as the sum of the four heads (Part A) and then takes reliefs
and qualifying payments as "deductions from assessable income" (Part B)
[Asmt_IIT_001 Y/A 2024/2025, Section 01 Parts A–B]. The statutory basis for each step
still needs locating in the act.

```
  employment income
+ business income
+ investment income
+ other income
= total assessable income          (each head net of its own deductions)
− personal relief
− qualifying payments
= taxable income                   ← the rate bands apply to THIS
→ rate schedule(s) for the Y/A
= gross tax
− credits (APIT, AIT/WHT, foreign tax)
= tax payable
− instalments already paid
= balance at final payment
```

**The distinction that matters most: assessable ≠ taxable.** Reliefs come off in between.
Applying the bands to gross income, or applying personal relief once per head of income
instead of once in total, are the two errors that recur throughout secondary sources and
in other calculators. Any computation reviewed in this project should be checked for
these first.

## Year of assessment

1 April to 31 March. "Y/A 2025/2026" means 1 Apr 2025 – 31 Mar 2026.

There is no such thing as "the current rate" in this project. Every figure is scoped to a
year of assessment, because at any moment a user may be filing for the year just ended,
estimating for the year in progress, or amending a year several back — all three are
ordinary.

## Questions to answer

1. What are the statutory heads of income, and does the act's terminology match the
   working list above?
2. Where exactly do reliefs attach — against total assessable income, or per head?
3. What is the statutory ordering of credits, and does order affect the outcome?
4. Is there a loss regime for individuals, and can losses cross heads?
5. How does the act structure rate schedules — one table with special provisions, or
   genuinely separate schedules?
6. What terminology does the IIT return form use? The return's structure is the most
   reliable guide to how IRD expects the computation to run, and it should drive this
   document's vocabulary.

## Where to look

Inland Revenue Act No. 24 of 2017 — the charging provisions and the definitions in the
early parts, then the schedules. Read the amendment acts alongside; the base act's
figures are superseded almost everywhere.

## Open questions

Q14 (schedule interaction) is the structural one and is recorded in
[`12-open-questions.md`](12-open-questions.md).
