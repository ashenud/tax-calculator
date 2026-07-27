# ADR 0002 — Tax rules as versioned JSON, one file per year of assessment

**Status:** accepted · **Date:** 2026-07-27

## Context

Sri Lankan tax law changes most Aprils, sometimes mid-year. Y/A 2025/26 alone brought a
50% increase in personal relief, the removal of a rate band, and a new regime for
foreign-currency income.

Two requirements follow:

1. **Updating rates must be easy**, and must not require reading the calculation engine.
   Whoever applies the next budget may not be the person who wrote the code.
2. **Historical years must stay computable.** Returns are amended and filed late; a
   taxpayer sorting out Y/A 2023/24 in 2027 needs 2023/24 rates.

A conventional calculator hardcodes "the current rates" and updates them in place. That
fails both requirements, and fails the second silently — the historical answers simply
become wrong with no error.

## Decision

Tax rules live in **one JSON file per year of assessment** under `data/tax-years/`,
validated by a Zod schema at build time.

Three properties are load-bearing:

**Every leaf value carries a `src` pointer** to the provision that sets it. Schema
validation rejects a value without one.

**Money is integer rupees; rates are integer basis points.** No floats in any
calculation path.

**Adding a year of assessment is adding a file.** No code change. If a legislative
change cannot be expressed in the schema, the schema is extended deliberately with an
ADR — the engine does not grow a special case.

## Consequences

**Good**

- A maintainer applying a budget edits data, not code
- Every number is traceable to a provision — the file is auditable by someone who does
  not read TypeScript
- Historical years remain computable indefinitely, and are protected by fixtures that
  must not move
- Rate tables can be published on the site directly from the data, with citations
  attached, so the site and the engine cannot disagree
- Conditions (like the bank-remittance requirement) are data, so a new condition appears
  as a new question in the UI without a code change

**Costs**

- Verbose. `{ "amount": 1800000, "src": "act-2-2025#s.14" }` where `1800000` would do —
  accepted deliberately; the pointer is the feature
- The schema must anticipate structural change, and will occasionally need extending
- Basis-point arithmetic is less readable than decimal rates, and reviewers must
  remember 1500 means 15%

## Alternatives considered

**Rates hardcoded in TypeScript.** Type-safe and refactorable, but puts tax law behind a
code change and makes the numbers unreadable to a non-programmer maintainer — including
anyone checking them against the act.

**A single file with all years.** Fewer files, but every edit touches the file that holds
every historical year, and the diff for "added Y/A 2026/27" becomes indistinguishable
from "accidentally modified Y/A 2023/24". One file per year makes an unintended
historical change impossible to miss in review.

**A database or CMS.** Rejected outright — it would require a server, and the whole
architecture depends on there not being one. Git already provides what is actually
wanted: versioning, diffs, review, and an audit trail of who changed which rate and why.
