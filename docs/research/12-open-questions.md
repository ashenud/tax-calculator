# Open questions — the unverified register

> **Status:** live register
> **Sources held:** none
> **Last reviewed:** 2026-07-27

This is the honest account of what this project does not yet know. Every figure below is
**provisional** and has **not** been checked against primary legislation. None of it may
be copied into research prose, personas, worked examples or tax data until verified.

This file is exempt from `scripts/check-citations.mjs` — it is the designated home for
uncited figures, and that is the entire point of it existing.

## Why everything is unverified

No primary sources are committed to [`../sources/`](../sources/). Claude Code web
sessions cannot reach `www.ird.gov.lk` (the egress proxy returns 403 on CONNECT), so the
acts must be added to the repo by hand. See
[`../sources/README.md`](../sources/README.md) for the list.

The provisional values below were gathered from web search of secondary sources — news
coverage, tax advisory firms, other calculators. They are recorded so the verification
work has a target list, **not** because they are believed.

## Register

Status values: `unverified` · `verified` · `contradicted` · `conflict` · `unresolved`

### Rates and thresholds — Y/A 2025/2026

| # | Claim | Provisional value | Would be settled by | Status |
|---|---|---|---|---|
| Q1 | Personal relief, resident individual | Rs. 1,800,000 (up from Rs. 1,200,000) | Amendment Act 2/2025 | unverified |
| Q2 | Normal individual rate ladder | 1st 1,000,000 @ 6%; next 500,000 @ 18%; next 500,000 @ 24%; next 500,000 @ 30%; balance @ 36% | Amendment Act 2/2025, First Schedule | unverified |
| Q3 | The 12% band was abolished from 1 Apr 2025 | — | Amendment Act 2/2025, First Schedule | unverified |
| Q4 | Service-export / foreign-source income: maximum rate | 15% | Amendment Act 2/2025 | unverified |
| Q5 | Rate ladder for that income | 1st 1,000,000 @ 6%; balance @ 15% | Amendment Act 2/2025, First Schedule | unverified |
| Q6 | Personal relief also applies to that income before the reduced ladder | assumed yes | Amendment Act 2/2025 | unverified |

### The remittance condition — highest priority

| # | Claim | Provisional value | Would be settled by | Status |
|---|---|---|---|---|
| Q7 | Reduced rate is conditional on remittance to Sri Lanka through a licensed bank | condition exists | Amendment Act 2/2025; PN/IT/2025-01 | unverified |
| Q8 | **Exact operative wording** of the condition | unknown | Amendment Act 2/2025 | unverified |
| Q9 | Consequence of failing the condition | full normal ladder (up to 36%) applies | Amendment Act 2/2025 | unverified |
| Q10 | Timing — must remittance occur within the year of assessment? | unknown | Act + PN/IT/2025-01 | unverified |
| Q11 | Partial remittance — is the condition applied per-payment or all-or-nothing? | unknown | Act + IRD guidance | unverified |
| Q12 | Evidence IRD accepts for inward remittance | assumed bank remittance advice | IRD guidance | unverified |
| Q13 | Does income received into a foreign-currency account held in Sri Lanka qualify? | unknown | Act definitions | unverified |

**Q8 and Q10–Q13 are the substance of this project.** Whether the provision says
"remitted through a bank" or "received in Sri Lanka through a bank", and whether partial
remittance qualifies partially, decides the answer for the primary persona. They cannot
be resolved from secondary sources — the wording is what matters, and secondary sources
paraphrase it.

### Schedule interaction — blocks the engine

| # | Claim | Provisional value | Would be settled by | Status |
|---|---|---|---|---|
| Q14 | How personal relief is allocated when income falls under both the normal and reduced schedules | **unknown** | Act; IRD guidance; the IIT return form itself | **unresolved** |

This blocks persona `p3` and step 4 of
[`../spec/calculation-engine.md`](../spec/calculation-engine.md). Candidate readings —
relief against normal-rate income first, pro-rata apportionment, or wholly separate
computation — give materially different answers. Per
[`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md)
the engine must **refuse** mixed cases until this is settled, not pick a reading.

The IIT return form and its guide may settle this faster than the act does — the form's
schedule structure reveals how IRD expects the computation to run.

### Withholding and advance tax

| # | Claim | Provisional value | Would be settled by | Status |
|---|---|---|---|---|
| Q15 | WHT/AIT on interest | 10% | Act + current WHT notice | unverified |
| Q16 | WHT on dividends | 15% | Act + current WHT notice | unverified |
| Q17 | WHT on rent | 10% | Act + current WHT notice | unverified |
| Q18 | **WHT on service fees to resident individuals: monthly threshold** | Rs. 100,000 **or** Rs. 150,000 — **sources disagree** | Current WHT notice / circular | **conflict** |
| Q19 | WHT rate on those service fees | 5% | Current WHT notice | unverified |
| Q20 | Whether excess credit is refundable or carried forward | unknown | IRA credit provisions | unverified |

**Q18 is the designated first test** of the verify loop. Two secondary sources gave
different thresholds during initial research and neither could be checked. It is a small
question with a definite answer, which makes it a good proof that the
PDF → agent → citation path works.

### Compliance calendar

| # | Claim | Provisional value | Would be settled by | Status |
|---|---|---|---|---|
| Q21 | Quarterly instalment dates | 15 Aug, 15 Nov, 15 Feb, 15 May | IRA payment provisions; Tax Calendar 2026 | unverified |
| Q22 | Final payment date | 30 September following Y/A end | IRA payment provisions | unverified |
| Q23 | Return filing deadline for Y/A 2025/26 | 30 November 2026 | IRA filing provisions | unverified |
| Q24 | E-filing mandatory | yes, under s.113(1B) | IRA s.113; IRD notice | unverified |
| Q25 | Basis on which instalments are computed (SET estimate vs prior year) | assumed SET estimate | IRA; SET guide | unverified |
| Q26 | Penalty and interest rates for late payment / late filing | unknown | IRA penalty provisions | unverified |

### Employer non-deduction — persona p2

| # | Claim | Provisional value | Would be settled by | Status |
|---|---|---|---|---|
| Q27 | Employer failure to deduct APIT does not discharge the employee's liability | assumed yes | IRA APIT provisions | unverified |
| Q28 | Whether such an employee must pay by quarterly instalment | assumed yes | IRA payment provisions | unverified |
| Q29 | Whether the employee has any relief where the employer was at fault | unknown | IRA | unverified |
| Q30 | Is APIT deduction mandatory for the employer, or elective with employee consent? | unknown — changed in recent years | IRA as amended; APIT tables | unverified |

Q30 matters: the answer determines whether persona p2 is an employer default or a lawful
arrangement, and therefore what the guidance page should say.

### Other heads

| # | Claim | Provisional value | Would be settled by | Status |
|---|---|---|---|---|
| Q31 | Capital gains rate on realisation of investment assets | unknown | IRA CGT provisions as amended | unverified |
| Q32 | Terminal benefit tables and thresholds | unknown | IRA schedules as amended | unverified |
| Q33 | Which qualifying payments survive for Y/A 2025/26 | unknown — several were removed in 2023 | IRA as amended | unverified |
| Q34 | Residency test details (183 days, and the counting rules) | 183 days in any 12-month period, assumed | IRA residency provisions | unverified |
| Q35 | Whether a non-resident citizen gets the same personal relief | assumed yes | IRA as amended by Act 2/2025 | unverified |

## Resolving these

One claim per run:

```
/verify-rates Q18
/verify-rates For Y/A 2025/2026, personal relief for a resident individual is Rs. 1,800,000
```

On a verdict:

- `verified` → move the figure into the relevant research document **with its citation**,
  and update the row here to `verified`
- `contradicted` → correct it everywhere, and leave the row recording the wrong value and
  where it came from. Do not delete the history — a figure published wrong once tends to
  come back
- `not-found` → add the document that would settle it to the "Should have" list in
  [`../sources/README.md`](../sources/README.md)

## Priority order

1. **Q8, Q10–Q13** — the remittance condition wording. The project's reason for existing.
2. **Q14** — schedule interaction. Blocks the engine.
3. **Q1–Q6** — the core rate tables. Everything numeric depends on them.
4. **Q18** — the conflict. Small, definite, and proves the verification loop works.
5. **Q27–Q30** — persona p2.
6. Everything else.
