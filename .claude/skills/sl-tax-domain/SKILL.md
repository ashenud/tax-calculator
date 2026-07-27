---
name: sl-tax-domain
description: Shared domain knowledge for working on Sri Lankan income tax in this repo — glossary, citation format, the integer-money rule, year-of-assessment scoping, and the guardrails on stating tax figures. Load this before any research, verification, data update, or worked-example work.
---

# Sri Lanka income tax — working knowledge for this repo

Load this before doing tax work here. It defines the vocabulary and the rules that make
outputs from different agents fit together.

## Vocabulary

| Term | Meaning |
|---|---|
| **Y/A** | Year of assessment. Runs **1 April – 31 March**. "Y/A 2025/2026" = 1 Apr 2025 to 31 Mar 2026. |
| **IRA** | Inland Revenue Act, No. 24 of 2017 — the base act. All section numbers refer to it unless stated. |
| **IRD** | Inland Revenue Department. |
| **TIN** | Taxpayer Identification Number. |
| **APIT** | Advance Personal Income Tax — deduction at source from employment income. The successor to PAYE; people still say PAYE. |
| **AIT** | Advance Income Tax — deduction at source from investment income (interest, dividends, rent). |
| **WHT** | Withholding tax, used loosely for both APIT and AIT and for deductions on service fees. |
| **SET** | Statement of Estimated Tax — the taxpayer's own forecast, which drives quarterly instalments. |
| **IIT** | Individual Income Tax (the return type). |
| **Assessable income** | Income from a head (employment / business / investment / other) after that head's deductions. |
| **Taxable income** | Total assessable income less reliefs and qualifying payments. **This is what the rate bands apply to.** |
| **Terminal benefits** | Gratuity, retirement, compensation for loss of office — taxed on separate tables. |
| **Service export income** | Services rendered from Sri Lanka to a person outside Sri Lanka, paid in foreign currency. |
| **Foreign source income** | Income arising outside Sri Lanka. |

### The distinction that matters most here

**Assessable ≠ taxable.** Reliefs come off between them. A very common error — in
articles, in other calculators, and in draft prose — is applying the rate bands to gross
income and forgetting the personal relief, or applying relief twice across two heads of
income. When reviewing any computation, check this first.

## Citation format

```
[IRA s.85(1)(a)]                              base act provision
[IRA s.52, as amended by Act 2/2025 s.14]     amended provision — cite both
[Act 2/2025 s.7]                              provision introduced by an amendment
[PN/IT/2025-01, para 3]                       IRD public notice
```

Rules:

- The citation goes **immediately after the figure**, in the same sentence. Not at the
  end of the paragraph, not in a footnote.
- Cite the **provision**, not the document. "Per the Inland Revenue Act" is not a
  citation.
- When a provision has been amended, cite the base section **and** the amending act. A
  bare `[IRA s.52]` for a figure that only exists because of a 2025 amendment is
  misleading — a reader checking the 2017 act will find a different number and conclude
  the repo is wrong.
- Only cite documents registered in `docs/sources/README.md`.

## The rules that govern every output

**1. No figure without a source you hold.**
`www.ird.gov.lk` is blocked in this environment. If a document is not in
`docs/sources/`, its contents are not available to you, however familiar the number
feels. Recognition is not verification.

**2. Unverified figures live in `docs/research/12-open-questions.md`.**
Never in prose as fact, never in a data file.

**3. Money is integer rupees.**
No floats in any calculation path. Rates are basis points or exact decimal strings.
Rounding is specified per operation in `docs/spec/calculation-engine.md`, never left to
the language default.

**4. Everything is scoped to a Y/A.**
There is no current rate. A figure without a year of assessment is malformed.

**5. Describe the law; do not advise.**
"The reduced rate applies where the income is remitted through a licensed bank" — yes.
"You should route your payments through a local bank to save tax" — no. This repo
produces decision support, and the distinction is what keeps it that.

## Shape of the computation

```
  employment income
+ business income
+ investment income
+ other income
= total assessable income
− reliefs (personal relief)
− qualifying payments
= taxable income
→ apply the rate schedule(s) for the Y/A
= gross tax
− credits (APIT already deducted, AIT/WHT already withheld, foreign tax credit)
= tax payable
→ less instalments already paid = balance due at final payment
```

`docs/spec/calculation-engine.md` is authoritative on ordering and on how income falling
under two schedules is handled.

## Known traps

- **The remittance condition.** Reduced-rate treatment of foreign-currency service
  income turns on the earnings reaching Sri Lanka through a licensed bank. Income kept
  offshore does not qualify and falls back to the standard progressive ladder. Any
  document, persona or example touching foreign income must address this explicitly.
- **Employer non-deduction does not discharge the employee.** If an employer fails to
  deduct APIT, the liability remains the employee's, together with the obligation to pay
  by instalment and file.
- **Rates changed materially from 1 April 2025.** Figures widely published before that
  date are wrong for Y/A 2025/26. Check the effective date on anything you recall.
- **Amendment acts, not the base act, carry the current numbers.** Reading only IRA 2017
  will give you superseded figures for almost every rate.
- **Prior years remain live.** Amended and late returns are filed years later; never
  delete or overwrite a historical year's data.
