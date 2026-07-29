# 04 — Rate tables

> **Status:** partial — Y/A 2025/2026 individual rates verified; other years and other schedules not
> **Sources:** ir-amendment-act-2-2025.pdf, pn-it-2025-01.pdf, ir-act-24-2017.pdf
> **Last reviewed:** 2026-07-28

## What this document must establish

Every rate table, for every year of assessment the tool supports, transcribed from the
statutory schedule with citations.

This is the reference the tax data files are built from and checked against. It is the
single most consequential document in the repo: an error here propagates into every
computed figure.

## Rules for this document

**Append, never overwrite.** Each year of assessment gets its own section, retained
permanently. Returns are amended and filed late; a taxpayer sorting out Y/A 2023/24 in
2027 needs the 2023/24 tables, and a tool that has quietly replaced them with current
rates will give them a confidently wrong answer.

**Transcribe band widths as the statute states them**, rather than as cumulative
thresholds — so a band reads (illustrative) "the next Rs. 500,000". The transcription
then matches the source line for line and can be checked by eye. Cumulative figures are
derived at load time; deriving is safe, hand-computing them is where transcription errors
hide.

**Cite each band.** Rate tables live in schedules, and schedules are amended
independently of the sections that point at them.

## Y/A 2025/2026

Governed by the Inland Revenue (Amendment) Act, No. 2 of 2025, which came into operation
on 1 April 2025 [Act 2/2025 s.1(2)].

**Verified from two independent primary sources** — the Act's own First Schedule and
IRD's public notice — which agree.

### Personal relief

Rs. 1,800,000 [PN/IT/2025-01, para 1] for an individual resident in Sri Lanka, or a
non-resident who is a citizen of Sri Lanka, for any year of assessment commencing from
Y/A 2025/2026 [PN/IT/2025-01, para 1].

### Normal individual rates

Applied to **taxable income**, i.e. after relief.

| Band | Width | Rate |
|---|---|---|
| First | Rs. 1,000,000 | 6% [Act 2/2025 s.3, First Schedule para 1(1D)] |
| Next | Rs. 500,000 | 18% [Act 2/2025 s.3, First Schedule para 1(1D)] |
| Next | Rs. 500,000 | 24% [Act 2/2025 s.3, First Schedule para 1(1D)] |
| Next | Rs. 500,000 | 30% [Act 2/2025 s.3, First Schedule para 1(1D)] |
| Balance | — | 36% [Act 2/2025 s.3, First Schedule para 1(1D)] |

The Act states this cumulatively rather than as band widths. Its own form, for
cross-checking a transcription:

| Taxable income | Tax payable |
|---|---|
| Not exceeding Rs. 1,000,000 | 6% of the amount in excess of Rs. 0 [Act 2/2025 s.3] |
| Exceeding Rs. 1,000,000 but not exceeding Rs. 1,500,000 | Rs. 60,000 plus 18% of the amount in excess of Rs. 1,000,000 [Act 2/2025 s.3] |
| Exceeding Rs. 1,500,000 but not exceeding Rs. 2,000,000 | Rs. 150,000 plus 24% of the amount in excess of Rs. 1,500,000 [Act 2/2025 s.3] |
| Exceeding Rs. 2,000,000 but not exceeding Rs. 2,500,000 | Rs. 270,000 plus 30% of the amount in excess of Rs. 2,000,000 [Act 2/2025 s.3] |
| Exceeding Rs. 2,500,000 | Rs. 420,000 plus 36% of the amount in excess of Rs. 2,500,000 [Act 2/2025 s.3] |

The two forms reconcile exactly, which is the check worth doing on any transcription of a
banded schedule.

There is **no 12% band** in the schedule as substituted [Act 2/2025 s.3].

### Service export and foreign source income

Maximum rate 15% [Act 2/2025 s.3; PN/IT/2025-01, para 2.1(b)].

**This rate is conditional and the condition is part of the rate.** It applies only where
the payment is received in foreign currency and remitted through a bank to Sri Lanka. See
[`05-foreign-currency-service-income.md`](05-foreign-currency-service-income.md) for the
operative wording, which must be read before this rate is applied to anyone.

Where the condition is not met, the normal ladder above applies — up to 36% [Act 2/2025 s.3].

> **Not yet established:** whether personal relief is available against income taxed
> under this schedule (Q6), and how the reduced cap (unverified interaction) works
> alongside the normal ladder for a taxpayer with both kinds of income (Q14). The band
> structure beneath the cap is not stated in the sources held. See
> [`12-open-questions.md`](12-open-questions.md).

### Other individual rates

Business income from betting and gaming, or from the manufacture and sale or import and
sale of any liquor or tobacco product: 45% flat [Act 2/2025 s.3; PN/IT/2025-01, para 2.1(c)].

### Withholding / advance income tax

Interest or discount paid: 10% [Act 2/2025 s.3, First Schedule para 10(1)(d)(ii)];
[PN/IT/2025-01, para 2.3]. This replaced the previous rate.

Other withholding rates are **not settled** — see
[`07-wht-ait-and-credits.md`](07-wht-ait-and-credits.md), which explains why the First
Schedule's lettering cannot currently be trusted.

### Not yet established for this year

Terminal benefits (see [`09-terminal-benefits.md`](09-terminal-benefits.md)), capital
gains (see [`08-capital-gains.md`](08-capital-gains.md)), and qualifying payments.

## Earlier years

Not yet transcribed. Requires the amendment acts of 2018–2024, which are not held.

## Years to cover

| Y/A | Priority | Why |
|---|---|---|
| 2025/2026 | **first** | The return currently due; the year the new regime starts |
| 2026/2027 | high | The year in progress — needed for estimates and instalments |
| 2024/2025 | medium | Amended and late returns |
| 2023/2024 | medium | Amended and late returns; the year of the previous major change |
| earlier | low | Add if a user need appears |

## What must be captured beyond the numbers

- **The commencement date of each change.** Amendments commonly apply from 1 April, but
  not always, and not uniformly across an act's provisions.
- **Which instrument changed what.** The chain matters when a maintainer applies the next
  budget.
- **Whether a schedule was replaced wholesale or amended in part.** A replaced schedule
  means every band must be re-transcribed, not just the ones that were reported as
  changing.

## Where to look

The First Schedule to IRA 2017 and its replacements in each amendment act. Act 2/2025 for
Y/A 2025/2026. IRD public notices for the department's own statement of the tables, which
is a useful cross-check but not a substitute for the schedule.

## Open questions

Q6 (relief against the reduced schedule) and Q14 (schedule interaction) in
[`12-open-questions.md`](12-open-questions.md). Q1–Q4 are now verified and recorded above.

A stray uncited figure: Rs. 999,999 appears here for CI break-testing only.
