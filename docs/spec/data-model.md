# Tax data model

> **Status:** spec — no data files exist yet
> **Governs:** `data/tax-years/*.json`
> **Related:** [`../decisions/adr-0002-tax-data-as-versioned-json.md`](../decisions/adr-0002-tax-data-as-versioned-json.md)

## The requirement this exists to satisfy

Tax law changes every year, usually in April, sometimes twice. The person maintaining
this site will not want to read TypeScript to update a rate band. So:

**Adding a year of assessment is adding one JSON file. No code changes.**

If a legislative change cannot be expressed in this schema, that is a signal to extend
the schema deliberately — with an ADR and a version bump — not to special-case it in the
engine. Special cases in the engine are how a calculator becomes unmaintainable within
two budget cycles.

## Two non-negotiable properties

### 1. Every leaf value carries a source pointer

```jsonc
"personal": { "amount": 1800000, "src": "act-2-2025#s.14" }
```

Not `"personal": 1800000`. The pointer is what makes the file auditable: a reader can
trace any number to the provision that sets it, and a maintainer applying next year's
budget can see at a glance which values have been checked against which instrument.

Schema validation **rejects any value without a `src`**. That is the mechanism, not a
convention.

### 2. Money is integers, rates are basis points

Amounts are integer Sri Lankan rupees. Rates are integer **basis points** — 6% is `600`,
15% is `1500`, 36% is `3600`.

Rates are never stored as `0.06`. Binary floating point cannot represent it exactly, and
a tax calculation that multiplies a large rupee amount by an inexact rate produces
off-by-one-rupee errors that are individually trivial and collectively corrosive to
trust in the tool. Basis points multiply cleanly against integers.

## File layout

```
data/
  tax-years/
    2023-24.json
    2024-25.json
    2025-26.json
    2026-27.json
  schema/
    tax-year.schema.json     JSON Schema, generated from the Zod schema
```

One file per year of assessment. Filenames use the start year and a two-digit end year.

## Schema

```jsonc
{
  "schemaVersion": 1,

  "yearOfAssessment": "2025/2026",
  "period": { "from": "2025-04-01", "to": "2026-03-31" },
  "status": "enacted",              // proposed | enacted | superseded
  "lastReviewed": "2026-07-27",

  // Every `src` in the file resolves to a key here.
  "sources": {
    "ira-2017": {
      "title": "Inland Revenue Act, No. 24 of 2017",
      "file": "docs/sources/ir-act-24-2017.pdf"
    },
    "act-2-2025": {
      "title": "Inland Revenue (Amendment) Act, No. 2 of 2025",
      "file": "docs/sources/ir-amendment-act-2-2025.pdf"
    }
  },

  "reliefs": {
    "personal": {
      "amount": 1800000,
      "appliesTo": ["resident", "non-resident-citizen"],
      "src": "act-2-2025#s.14"
    }
  },

  "qualifyingPayments": [
    // { "id": "...", "cap": 0, "rate": 0, "src": "..." }
  ],

  "rateSchedules": {
    "individual-normal": {
      "label": "Resident individual — normal rates",
      "bands": [
        { "width": 1000000, "rateBp":  600, "src": "act-2-2025#sch.1" },
        { "width":  500000, "rateBp": 1800, "src": "act-2-2025#sch.1" },
        { "width":  500000, "rateBp": 2400, "src": "act-2-2025#sch.1" },
        { "width":  500000, "rateBp": 3000, "src": "act-2-2025#sch.1" },
        { "width":  null,   "rateBp": 3600, "src": "act-2-2025#sch.1" }
      ]
    },

    "service-export-foreign": {
      "label": "Service export / foreign source income — reduced rates",
      "bands": [
        { "width": 1000000, "rateBp":  600, "src": "act-2-2025#sch.1" },
        { "width":  null,   "rateBp": 1500, "src": "act-2-2025#sch.1" }
      ],
      "maxRateBp": 1500,
      "conditions": ["remitted-through-licensed-lk-bank"],
      "src": "act-2-2025#sch.1"
    }
  },

  "conditions": {
    "remitted-through-licensed-lk-bank": {
      "question": "Were these earnings remitted to Sri Lanka through a licensed bank?",
      "ifNotMet": "individual-normal",
      "evidence": "Bank inward remittance advice",
      "src": "act-2-2025#s.7"
    }
  },

  "apit": { "tables": [], "src": "..." },
  "wht":  {
    // "interest": { "rateBp": 1000, "src": "..." },
    // "serviceFeeResidentIndividual": { "rateBp": 500, "monthlyThreshold": 0, "src": "..." }
  },
  "capitalGains":     { "rateBp": null, "src": "..." },
  "terminalBenefits": { "bands": [], "src": "..." },

  "calendar": {
    "instalments": [
      { "quarter": 1, "due": "2025-08-15", "src": "ira-2017#s.90" },
      { "quarter": 2, "due": "2025-11-15", "src": "ira-2017#s.90" },
      { "quarter": 3, "due": "2026-02-15", "src": "ira-2017#s.90" },
      { "quarter": 4, "due": "2026-05-15", "src": "ira-2017#s.90" }
    ],
    "finalPayment": { "due": "2026-09-30", "src": "ira-2017#s.90" },
    "returnDue":    { "due": "2026-11-30", "src": "ira-2017#s.93" }
  }
}
```

> Every figure shown above is **illustrative and unverified** — see
> [`../research/12-open-questions.md`](../research/12-open-questions.md). This document
> specifies the shape, not the values.

## Design notes

**Bands use `width`, not `upTo`.** A band's width is what the statute states ("the next
Rs. 500,000"), so a band table transcribed from a schedule matches the source
line-for-line and can be checked against it by eye. Cumulative thresholds are derived at
load time. Deriving is safe; transcribing cumulative totals by hand is where
transcription errors hide. The final band has `width: null` — the balance.

**Reduced rates are a schedule, not a discount.** The reduced treatment of service-export
and foreign-source income is modelled as its own band table, not as a cap applied
afterwards to a normal computation. `maxRateBp` is recorded alongside as a documented
invariant the engine asserts, so a future band added above the cap fails loudly instead
of quietly overcharging.

**Conditions are data, and they are questions.** `conditions` carries the human-facing
question, the fallback schedule when the condition is not met, and the evidence the
taxpayer needs. This is what lets the UI ask "were these earnings remitted through a
licensed bank?" without the question being hardcoded — and it means the answer's
consequence (`ifNotMet`) is stated in the same place a maintainer updates the rule.

**`status` distinguishes proposed from enacted.** Budget announcements are not law. A
`proposed` year must not be used for a filing calculation, and the UI must label it.

**Superseded years are retained forever.** Amended and late returns are filed years
afterwards. Deleting a year makes the tool useless to exactly the taxpayer most likely
to need help.

## Validation

Zod is the source of truth for the schema; the JSON Schema file is generated from it.

Validation enforces, at minimum:

- Every `src` resolves to a key in `sources`
- Every leaf value object has a `src` — **no exceptions**
- Rates are integers in basis points, 0–10000
- Amounts are non-negative integers
- Exactly one band per schedule has `width: null`, and it is last
- `period` is 12 months, 1 April to 31 March
- Where `maxRateBp` is set, no band exceeds it
- Every `conditions[].ifNotMet` names an existing schedule
- Instalment due dates fall within or shortly after `period`

## Adding a year of assessment

Follow [`update-playbook.md`](update-playbook.md), or run `/add-tax-year`.
