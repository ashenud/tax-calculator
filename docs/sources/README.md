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

| File | Document | Source URL | Retrieved | SHA-256 (first 16) | Status |
|---|---|---|---|---|---|
| _(none yet)_ | | | | | |

### Status values

- **in force** — currently operative law
- **in force, as amended** — base act still operative but modified; amendments must be read alongside
- **superseded** — retained for historical years of assessment only
- **draft/bill** — not yet law; may not be cited as authority

## Required documents

### Must have — research is blocked without these

**1. `ir-act-24-2017.pdf` — Inland Revenue Act, No. 24 of 2017**
The base act. Everything else amends it. Section numbers in citations refer to this act.
`https://www.ird.gov.lk/en/publications/Acts_Income%20Tax_2017/IR_Act_No_24_2017_E.pdf`

**2. `ir-amendment-act-2-2025.pdf` — Inland Revenue (Amendment) Act, No. 2 of 2025**
The act that makes the changes this project exists to explain: the personal relief
increase, the restructured rate bands, and the reduced-rate treatment of service-export
and foreign-source income from 1 April 2025. **Without this file the Y/A 2025/26 rate
tables cannot be verified at all.**
`https://www.parliament.lk/uploads/acts/gbills/english/6379.pdf`

**3. `pn-it-2025-01.pdf` — IRD Public Notice PN/IT/2025-01, 26 March 2025**
The department's own statement of how it will administer the 2025 changes.
`https://www.ird.gov.lk/en/Lists/Latest%20News%20%20Notices/Attachments/666/PN_IT_2025-01_26032025_E.pdf`

### Should have — needed for specific research documents

| Document | Unblocks |
|---|---|
| Inland Revenue (Amendment) Acts of 2018–2024 | `04-rate-tables.md` for prior years; the history in `05-foreign-currency-service-income.md` |
| APIT tables / instructions for Y/A 2025/26 | `06-apit.md` |
| WHT & AIT circular or notice, current | `07-wht-ait-and-credits.md` — **needed to settle the service-fee threshold conflict** |
| IRD Tax Calendar 2026 | `10-compliance-calendar.md` |
| IIT return form + guide to completion, Y/A 2025/26 | `11-filing-walkthrough.md`, and the field mapping in `../spec/data-model.md` |
| Statement of Estimated Tax (SET) form + guide | `10-compliance-calendar.md` |

### Nice to have

Gazettes on exemptions relevant to service exporters; IRD guidance on evidencing
inward remittance through a licensed bank.

## Adding a document

1. Download it yourself — an agent in this environment cannot.
2. Commit the PDF here under the naming convention: lowercase, hyphenated,
   `<instrument>-<number>-<year>.pdf`.
3. Add a row to the register above, including the SHA-256 prefix and status.
4. Mark any superseded document's row as `superseded`; do not delete it — historical
   years of assessment still need it.
5. Run `/verify-rates` against the claims in
   [`../research/12-open-questions.md`](../research/12-open-questions.md) that the new
   document should settle, and move whatever it confirms into the research prose.

## What counts as a citation

A citation points at a provision, not at a document. `[IRA s.85(1)(a)]` is a citation;
"per the Inland Revenue Act" is not. When a provision has been amended, cite both the
base section and the amending act: `[IRA s.52, as amended by Act 2/2025 s.14]`.
