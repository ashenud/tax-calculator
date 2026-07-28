# Primary sources

This directory holds the legislation and official notices this project cites. It is the
authority for every figure in the repo. No tax figure may be stated as fact anywhere in
`docs/` unless it can be traced to a document listed here.

## Why these must be committed by hand

Claude Code web sessions run behind an egress proxy that **blocks `www.ird.gov.lk`**
(403 on CONNECT), along with most Sri Lankan tax advisory domains. Agents working in
this repo cannot download the acts themselves. Web *search* works, which means an agent
can find out that a rate exists — but not read the provision that sets it.

That gap is exactly where wrong numbers come from. Hence rule 2 in
[`../../CLAUDE.md`](../../CLAUDE.md): if the document is not here, the figure is not
verified, no matter how many search results agree on it.

## Register

Every PDF gets a row before it is used. Fill in `SHA-256` with
`sha256sum <file> | cut -c1-16` so a document can't be silently swapped.

| File | Document | Source | Retrieved | SHA-256 (first 16) | Status |
|---|---|---|---|---|---|
| `ir-act-24-2017.pdf` | Inland Revenue Act, No. 24 of 2017. Certified 24 Oct 2017 | ird.gov.lk | 2026-07-28 | `e857f11ec026b424` | in force, as amended |
| `ir-amendment-act-2-2025.pdf` | Inland Revenue (Amendment) Act, No. 2 of 2025. Certified 20 Mar 2025; gazette supplement 21 Mar 2025; in operation 1 Apr 2025 | parliament.lk | 2026-07-28 | `0dff13924d408a62` | in force |
| `pn-it-2025-01.pdf` | IRD Public Notice PN/IT/2025-01, 26 Mar 2025 — Notice to the Taxpayers | ird.gov.lk | 2026-07-28 | `b0faa89a25880bc3` | in force |
| `iit-return-form-2024-25.pdf` | Return of Income — Individual, Y/A 2024/2025 (`Asmt_IIT_001_E`) | ird.gov.lk | 2026-07-28 | `6b8777035b55b99d` | superseded for Y/A 2025/26 |
| `iit-return-guide-2024-25.pdf` | Guide to fill the Return of Income, Schedules & Statement of Assets and Liabilities — Individual, Y/A 2024/2025 (`Asmt_IIT_004_E`) | ird.gov.lk | 2026-07-28 | `97fd00d9e2fcab83` | superseded for Y/A 2025/26 |
| `iit-comprehensive-guide-2024-25.pdf` | Guidelines for e-Filing Individual Income Tax (IIT) Return, Y/A 2024/2025 | ird.gov.lk | 2026-07-28 | `4f987143f6c8aff5` | superseded for Y/A 2025/26 |

### Notes on specific documents

**`pn-it-2025-01.pdf` was downloaded with a `_T` suffix** (`PN_IT_2025-01_26032025_T.pdf`),
which on the IRD site usually denotes the Tamil edition. **It is the English text** —
confirmed by reading it. Do not re-download it looking for an English version.

**`ir-amendment-act-2-2025.pdf` was downloaded as `6379.pdf`**, the parliament.lk bill
number. Confirmed as Act No. 2 of 2025 by its title page. It is a short act — six
sections, amending IRA s.150 and the First, Third and Fifth Schedules. Section 6 provides
that where the **Sinhala and Tamil** texts are inconsistent, the Sinhala prevails
[Act 2/2025 s.6]; it says nothing about the English text. An earlier note here claimed
Sinhala prevailed over English — that was wrong.

**The IIT forms are Y/A 2024/2025** — one year before the service-export and
foreign-source regime began. They do **not** show where foreign-currency income is
reported on the return. The Y/A 2025/2026 form is listed under "Should have" below.

### Status values

- **in force** — currently operative law
- **in force, as amended** — base act still operative but modified; amendments must be read alongside
- **superseded** — retained for historical years of assessment only
- **superseded for Y/A N** — still authoritative for its own year, not for later ones
- **draft/bill** — not yet law; may not be cited as authority

## Extracted text — an index, not an authority

`python3 scripts/extract-sources.py` writes a plain-text form of each PDF to
`docs/sources/text/`. This is what makes the acts greppable, and therefore what makes
`tax-rule-verifier` able to work at all.

**The PDF is authoritative. The text is not.** Even a good extractor loses table geometry
and ligatures. The failure is silent — text that has lost a "not", or merged two columns
of a rate table, still reads perfectly fluently. Locate a provision in the text; **read it
in the PDF before quoting it as evidence.**

> **Why this script uses pdfplumber, and why that matters.** The first version was
> dependency-free, parsing FlateDecode streams with zlib. It silently dropped about
> **two-thirds** of the Inland Revenue Act and **three-quarters** of Act 2/2025 —
> including, precisely, First Schedule paragraph 1(6), the provision that sets the 15%
> maximum rate for individuals. It also reported the e-Filing guide as an unreadable scan
> when 112 of its 124 pages carry text. Nothing about its output looked wrong.
>
> If extraction is ever changed, re-run the verification pass. A lossy extractor does not
> announce itself; it hands you a plausible half of a statute.

Regenerate after adding a document. `--check` verifies the text is present without
rewriting it.

## Still missing

### 0. Inland Revenue (Amendment) Act, No. 11 of 2026 — CRITICAL, and newly discovered

**This repository has been treating Act No. 2 of 2025 as the latest law. It is not.**

A further amendment act was passed on 19 May 2026, certified 3 June 2026 and published
5 June 2026. It was found by web search while sweeping capital gains — nothing in the
documents held gives any hint of its existence, which is precisely the problem with
working from a fixed set of PDFs.

Reported to change, at minimum:

- **Capital gains tax to 15% for individuals and partnerships** (from 10%), and 10% for
  trusts, unit trusts, mutual funds and NGOs — which supersedes the rate in
  [`../research/08-capital-gains.md`](../research/08-capital-gains.md)
- **Motor vehicle disposals** no longer treated as "other income", with effect from
  **1 April 2024** — retrospective, so it reaches years already filed
- **TIN verification** mandatory for specified transactions from 1 April 2026
- Payments of Rs. 500,000 or more to be made by approved payment methods
- Enhanced capital allowances for qualifying investment

None of the above is verified — it comes from secondary reporting and is recorded in the
register as Q42–Q46, not in research prose. It is listed here to say what the document is
needed for.

**Until this act is held, no figure in this repository can be described as current**, and
Y/A 2026/27 — the year now in progress — cannot be modelled at all.

There is also an IRD notice `SEC/PN/IT/2026/02` dated 8 June 2026 which appears to be the
department's statement on this act. Obtain both.

### 1. Inland Revenue (Amendment) Acts, 2018–2024 — highest priority after the above

**This gap is larger than it looks.** Act 2/2025 amends First Schedule ¶10(1)(d)(ii) to
set the rate on interest, but in the 2017 base act that rate sits at ¶10(1)(b)(i). The
schedule was **re-lettered by an amendment nobody in this repo holds.**

Two consequences:

- Any citation to the base act's First Schedule lettering is **stale** and may point at
  the wrong item.
- Q18 and Q19 cannot be closed. The base act's service-fee threshold may have been
  amended, moved, or repealed in the interim, and we would not know.

Relevant acts include Nos. 10 of 2021, 45 of 2022 and 4 of 2023, but the full list should
be confirmed rather than assumed.

### 2. The WHT / AIT circular promised by PN/IT/2025-01

PN/IT/2025-01 ¶2.3 states that following the rate revisions, "Advance Personal Income Tax
(APIT) Tables and withholding tax circulars **will be issued in due course**." That
circular is the only thing that settles the current service-fee withholding threshold —
Q18, Q19.

### 3. Other documents

| Document | Unblocks |
|---|---|
| APIT tables / instructions, Y/A 2025/26 | `06-apit.md`; Q30 (mandatory vs elective deduction) |
| **IIT return form + guide, Y/A 2025/2026** | `11-filing-walkthrough.md`; may resolve **Q14** (relief allocation across schedules) by showing how IRD structures the computation. The 2024/25 forms held here predate the 15% regime. |
| IRD Tax Calendar 2026 | `10-compliance-calendar.md`; Q21–Q23 |
| Statement of Estimated Tax (SET) form + guide | `10-compliance-calendar.md`; Q25 |
| Regulations under IRA s.85(1)(a)(v) | Whether ordinary consultancy fees are within the service-fee withholding at all — see `07-wht-ait-and-credits.md` |

### Nice to have

IRD guidance on evidencing inward remittance through a bank (Q12); gazettes on
exemptions relevant to service exporters; the Sinhala text of Act 2/2025, which prevails
over the English in case of inconsistency.

## Adding a document

1. Download it yourself — an agent in this environment cannot.
2. Commit the PDF here under the naming convention: lowercase, hyphenated,
   `<instrument>-<number>-<year>.pdf`.
3. Add a row to the register above, including the SHA-256 prefix and status.
4. Run `python3 scripts/extract-sources.py` and commit the generated text, so the document
   is greppable by agents.
5. Mark any superseded document's row as `superseded`; do not delete it — historical
   years of assessment still need it.
6. Run `/verify-rates` against the claims in
   [`../research/12-open-questions.md`](../research/12-open-questions.md) that the new
   document should settle, and move whatever it confirms into the research prose.

## What counts as a citation

A citation points at a provision, not at a document. `[IRA s.85(1)(a)]` is a citation;
"per the Inland Revenue Act" is not. When a provision has been amended, cite both the
base section and the amending act: `[IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)]`.
