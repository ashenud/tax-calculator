# 04 — Rate tables

> **Status:** unverified — no rate table in this document is confirmed
> **Sources:** none held
> **Last reviewed:** 2026-07-27

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

## Structure to follow, once sources are held

For each year of assessment:

### Y/A YYYY/YYYY

**Personal relief** — amount, with citation

**Normal individual rates** — band widths and rates, with citation

**Service export / foreign source income** — band widths and rates, the maximum rate,
**and the conditions**. A rate table for this schedule presented without the remittance
condition beside it is dangerously incomplete — the rate is meaningless without the
condition it depends on.

**Terminal benefits** — see [`09-terminal-benefits.md`](09-terminal-benefits.md)

**Capital gains** — see [`08-capital-gains.md`](08-capital-gains.md)

**Effective dates and the amending instrument**

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

Q1–Q6 in [`12-open-questions.md`](12-open-questions.md) — the entire content of this
document for Y/A 2025/2026 is currently unverified.
