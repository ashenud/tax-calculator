# Open questions — the unverified register

> **Status:** live register
> **Sources held:** ir-act-24-2017, ir-amendment-act-2-2025, pn-it-2025-01, iit-return-form-2024-25, iit-return-guide-2024-25, iit-comprehensive-guide-2024-25
> **Last reviewed:** 2026-07-28

This is the honest account of what this project does and does not know. Figures marked
`unverified` have **not** been checked against primary legislation and may not be copied
into research prose, personas, worked examples or tax data.

This file is exempt from `scripts/check-citations.mjs` — it is the designated home for
uncited provisional figures, and that is the entire point of it existing.

## State of verification

The three core instruments are now held, and a first verification pass has run. The
Y/A 2025/2026 rate structure is **verified from two independent primary sources** — the
Act itself and IRD's own notice, which agree.

What remains open falls into three groups:

1. **The amendment chain has a hole.** Acts 2018–2024 are not held. This is not a
   theoretical gap: Act 2/2025 amends First Schedule ¶10(1)(d)(ii), but in the 2017 base
   act that item is at ¶10(1)(b)(i). The schedule was **re-lettered by an amendment we do
   not hold**, so every citation to the base act's First Schedule lettering is suspect.
2. **The withholding circular does not exist yet, or we do not have it.**
   PN/IT/2025-01 ¶2.3 defers APIT tables and WHT circulars to "in due course".
3. **The wording verifies the rule but not its edges.** We now have the exact remittance
   condition; we still cannot answer timing, partial remittance, or intermediaries.

## Verified — moved into research prose

These are settled and now live in the research documents with citations. Retained here
for the record.

| # | Claim | Verified value | Authority |
|---|---|---|---|
| Q1 | Personal relief, resident individual or non-resident citizen, from Y/A 2025/26 | Rs. 1,800,000 | [PN/IT/2025-01, para 1] |
| Q2 | Normal individual ladder, Y/A 2025/26 | 1st 1,000,000 @6%; next 500,000 @18%; next 500,000 @24%; next 500,000 @30%; balance @36% | [Act 2/2025 s.3, First Schedule para 1(1D)]; [PN/IT/2025-01, para 2.1(a)] |
| Q3 | The 12% band no longer appears in the ladder from 1 Apr 2025 | confirmed absent | [Act 2/2025 s.3] |
| Q4 | Service-export / foreign-source income maximum rate | 15% | [Act 2/2025 s.3]; [PN/IT/2025-01, para 2.1(b)] |
| Q7 | Reduced rate is conditional on remittance through a bank to Sri Lanka | condition confirmed | [Act 2/2025 s.3] |
| Q8 | Exact operative wording of the condition | quoted verbatim in `05-foreign-currency-service-income.md` | [Act 2/2025 s.3] |
| Q15 | AIT on interest or discounts, from 1 Apr 2025 | 10% | [Act 2/2025 s.3, First Schedule para 10(1)(d)(ii)]; [PN/IT/2025-01, para 2.3] |
| Q24 | E-filing mandatory | yes, from Y/A 2023/2024 | [IRA s.113(1)(B)]; [Guidelines for e-Filing IIT Return Y/A 2024/2025] |
| Q35 | Non-resident citizens receive the same personal relief | yes | [PN/IT/2025-01, para 1] |
| Q21 | Instalment dates | 15 Aug, 15 Nov, 15 Feb in the Y/A; 15 May of the next Y/A | [IRA s.90(2)(a)] |
| Q23 | Filing deadline | eight months after the end of the Y/A — a rule, not a date | [IRA s.93(1)] |
| Q25 | Instalment basis | `(A − C) / B` on the s.91/92 estimate, not the final liability | [IRA s.90(3)] |
| Q28 | An employee whose employer need not withhold is an instalment payer | yes, expressly | [IRA s.90(1)(b)] |
| Q30 | APIT deduction obligation | arises where the Commissioner-General specifies the circumstances, not directly from the Act | [IRA s.83(1)] |
| — | Estimate due date | by the date for payment of the first instalment | [IRA s.91(1)] |
| — | Personal relief provision | Fifth Schedule item (v), deducted via s.52(1) | [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)]; [IRA s.52(1)] |
| — | Exemption removal mechanism | Third Schedule para (u)(iii)–(iv) closed off at 1 Apr 2025 | [IRA Sch.3 para (u), as amended by Act 2/2025 s.4] |
| — | Sinhala text prevails over the **Tamil** text — not over the English | correction to an earlier note here | [Act 2/2025 s.6] |
| — | Commencement of Act 2/2025 | 1 April 2025 | [Act 2/2025 s.1(2)] |
| — | Individual business income from betting/gaming, liquor or tobacco | 45% flat | [Act 2/2025 s.3]; [PN/IT/2025-01, para 2.1(c)] |
| — | Service-export and foreign-source exemptions removed | from 1 Apr 2025 | [PN/IT/2025-01, para 3] |
| — | Relief is deducted from **aggregated** assessable income, not per head | confirmed by return structure | [Asmt_IIT_001 Y/A 2024/2025, Section 01 Parts A–B] |

## Resolved against the base act, but not for the current year

| # | Claim | Finding | Status |
|---|---|---|---|
| **Q18** | **WHT on service fees to resident individuals: monthly threshold** | **Rs. 50,000/month** in the base act — [IRA First Schedule, para 10(1)(c)(i) as enacted 2017]. **Both provisional values were wrong**: Rs. 100,000 and Rs. 150,000 each came from secondary sources and neither appears anywhere in the Act. | **contradicted; unresolved for Y/A 2025/26** |
| Q19 | Rate on those service fees | 5% — [IRA First Schedule, para 10(1)(c)(i) as enacted 2017] | verified for 2017; unresolved for Y/A 2025/26 |

Both carry the same caveat, and it is a serious one: **the First Schedule has been
re-lettered since 2017.** Act 2/2025 amends ¶10(1)(d)(ii) for interest where the base act
has ¶10(1)(b)(i), which proves an intervening amendment renumbered the paragraph. The
service-fee item may likewise have moved, changed value, or been repealed. Closing these
requires the 2018–2024 amendment acts and the WHT circular.

Per [`../decisions/adr-0004-citation-discipline.md`](../decisions/adr-0004-citation-discipline.md)
the wrong values stay on the record. A figure that circulated wrong once tends to come
back, and the next person to read a tax blog will meet Rs. 100,000 again.

## New findings

| # | Finding | Authority | Status |
|---|---|---|---|
| **Q36** | **s.85(1)(a) is not a general service-fee withholding rule.** It applies only to enumerated categories: teaching, lecturing, examining, invigilating or supervising an examination; commission or brokerage to a resident insurance, sales or canvassing agent; endorsement fees; supply of an article on contract basis through tender or quotation; or matters prescribed by regulation. | [IRA s.85(1)(a)] | verified against base act |
| Q37 | Whether ordinary consultancy or freelance fees are brought in by regulation under s.85(1)(a)(v) | regulations not held | unverified |
| Q38 | s.85 does not apply to payments made by individuals unless made in conducting a business | [IRA s.85(3)(b)] | verified against base act |
| Q39 | Refund claims must be made within 30 months of the last date of the Y/A | [Act 2/2025 s.2]; [PN/IT/2025-01, para 4] | verified |
| Q40 | The Sinhala text of Act 2/2025 prevails over the English in case of inconsistency | [Act 2/2025] | verified — a standing limitation on every finely-worded conclusion here |

**Q36 matters more than Q18 did.** Every secondary source describes s.85 as "5%
withholding on service fees to resident individuals above a monthly threshold". The
provision is nothing of the sort. A consultant invoicing a Sri Lankan client is very
likely **outside** s.85(1)(a) altogether unless caught by a regulation under (a)(v) —
which changes what personas p1 and p3 should be told about local-client work.

## Still unverified

### The remittance condition — the edges

The wording is now known (Q8, verified). What it does not settle:

| # | Question | Status |
|---|---|---|
| Q10 | Must remittance occur within the year of assessment in which the income arises? | unverified |
| Q11 | Partial remittance — applied per-payment, apportioned, or all-or-nothing? | unverified |
| Q12 | Evidence IRD accepts for inward remittance | unverified |
| Q13 | Does a foreign-currency account held at a bank in Sri Lanka satisfy it? | unverified |
| Q41 | Do payment intermediaries (Wise, Payoneer, PayPal) settling into a local bank satisfy "remitted through a bank"? | unverified |
| Q9 | Consequence of failing the condition — assumed the normal ladder applies | unverified |

The Act's phrase is "received in foreign currency and remitted through a bank to Sri
Lanka". It does not define "remitted", "bank", or the timing. These are questions for the
WHT circular, IRD guidance, or the Y/A 2025/26 return form.

### Schedule interaction — narrowed, still blocks the engine

| # | Claim | Status |
|---|---|---|
| Q6 | Personal relief is available against service-export / foreign-source income | **partially verified** |
| Q14 | How the 15% cap and the normal ladder interact for mixed income | **narrowed, still unresolved** |

**Q6 — the second pass largely answers this.** The 15% is a **maximum rate** applied to
"gains and profits", *notwithstanding* the ladder in subparagraph (1D)
[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. It modifies the rate only. Relief lives
in the Fifth Schedule and is deducted under s.52(1) in arriving at taxable income
[IRA s.52(1)], a step subparagraph (6) does not touch. So relief applies as normal. This
is a structural reading rather than an express statement, so it stays `partially verified`
until the Y/A 2025/26 return form or IRD guidance confirms it in terms.

**Q14 — narrowed but not closed.** The important correction: this is **not** two competing
schedules with relief to be divided between them. There is one ladder, and a cap on the
rate charged to part of the income. That removes most of the candidate readings previously
listed here.

What remains genuinely open is **ordering**: when a taxpayer has both capped and uncapped
income, which component occupies the lower bands? The Act does not say. For a taxpayer
with only capped income the answer is unambiguous (6% on the first Rs. 1,000,000, then
15%), so persona p1's pure case is computable; persona p3's mixed case is not.

Until ordering is settled the engine must refuse **mixed** cases per
[`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md).
Pure-capped and pure-normal cases can now ship. The **Y/A 2025/2026 return form** remains
the most likely thing to settle ordering.

### Reliefs, other heads, compliance

| # | Claim | Provisional value | Status |
|---|---|---|---|
| Q6 | Personal relief available against reduced-schedule income | assumed yes | unverified |
| Q16 | WHT on dividends | 15% | unverified |
| Q17 | WHT on rent | 10% to a resident person per base act ¶10(1)(b)(iii); lettering suspect | unverified for 2025/26 |
| Q20 | Excess credit refundable or carried forward | refunds exist; up to Rs. 180,000 processed within 3 months, senior citizens quarterly under Rs. 45,000 [PN/IT/2025-01, para 4] — general refundability of excess credit still unconfirmed | partial |
| Q22 | A final payment date separate from the fourth instalment | 30 September was assumed; s.90 shows a fourth instalment on 15 May instead — the assumption may be wrong | unverified |
| Q26 | Penalty and interest rates | unknown | unverified |
| Q27 | Employer non-deduction does not discharge the employee | strongly implied by s.90(1)(b), which makes such an employee an instalment payer in their own right; the express liability provision still needs locating | partial |
| Q29 | Relief where the employer was at fault | unknown | unverified |
| Q31 | Capital gains rate | unknown | unverified |
| Q32 | Terminal benefit tables | unknown | unverified |
| Q33 | Qualifying payments surviving for Y/A 2025/26 | unknown | unverified |
| Q34 | Residency test details | 183 days, assumed | unverified |

## Priority order

1. **Q14** — blocks the engine. Needs the Y/A 2025/26 return form.
2. **Q10–Q13, Q41** — the remittance edges. The project's core value.
3. **Q18, Q19, Q36, Q37** — the withholding picture, and whether consultancy fees are in
   scope at all. Needs the amendment acts and the WHT circular.
4. **Q30, Q27–Q29** — persona p2.
5. **Q21–Q23** — the compliance calendar, which is what both personas most need.
6. Everything else.

## Resolving these

One claim per run:

```
/verify-rates For Y/A 2025/2026, WHT on service fees to resident individuals is 5% above Rs. 50,000 per month
```

On a verdict: `verified` → move the figure into the research document with its citation
and update the row here. `contradicted` → correct it everywhere and record the wrong
value. `not-found` → add the settling document to
[`../sources/README.md`](../sources/README.md).
