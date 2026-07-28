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
      "src": "act-2-2025#s.5(3)"        // IRA Sch.5 para 2(a)(v)
    }
  },

  "qualifyingPayments": [
    // { "id": "...", "cap": 0, "rate": 0, "src": "..." }
  ],

  "rateSchedules": {
    "individual-normal": {
      "label": "Resident individual — normal rates",
      "bands": [
        { "width": 1000000, "rateBp":  600, "src": "act-2-2025#s.3(1)(b)" },
        { "width":  500000, "rateBp": 1800, "src": "act-2-2025#s.3(1)(b)" },
        { "width":  500000, "rateBp": 2400, "src": "act-2-2025#s.3(1)(b)" },
        { "width":  500000, "rateBp": 3000, "src": "act-2-2025#s.3(1)(b)" },
        { "width":  null,   "rateBp": 3600, "src": "act-2-2025#s.3(1)(b)" }
      ]
    }
  },

  // A rate CAP on `appliesToSchedule`, not a schedule of its own — see design notes.
  "rateCaps": {
    "service-export-foreign": {
      "label": "Service export / foreign source gains and profits — maximum rate",
      "appliesToSchedule": "individual-normal",
      "maxRateBp": 1500,
      "conditions": ["remitted-through-bank-to-sri-lanka"],
      "src": "act-2-2025#s.3(1)(d)"     // IRA Sch.1 para 1(6)
    }
  },

  "conditions": {
    "remitted-through-bank-to-sri-lanka": {
      "question": "Were these earnings remitted through a bank to Sri Lanka?",
      "ifNotMet": null,                 // cap simply does not apply; normal ladder stands
      "evidence": "Bank inward remittance advice",
      "src": "act-2-2025#s.3(1)(d)"
    }
  },

  // Components the Act rates separately, leaving "only the remainder" on the ladder
  // [IRA Sch.1 para 1(2)(d), 2017].
  "separatelyRated": {
    "capital-gain": {
      "label": "Gains on realisation of investment assets",
      "rateBp": 1000,
      "reliefEligible": false,          // [IRA Sch.5 para 2(a), 2017]
      "verified": false,                // 2017 rate; superseded by Act 11/2026 — Q42
      "src": "ira-2017#sch.1-para-1(2)(a)"
    },
    "terminal-benefit": {
      "label": "Terminal benefits",
      "selector": { "field": "serviceYears", "thresholdYears": 20 },
      "tablesBySelector": {
        "atOrBelow": [
          { "width": 2000000, "rateBp":    0, "src": "ira-2017#sch.1-para-1(2)(b)(i)" },
          { "width": 1000000, "rateBp":  500, "src": "ira-2017#sch.1-para-1(2)(b)(i)" },
          { "width": null,    "rateBp": 1000, "src": "ira-2017#sch.1-para-1(2)(b)(i)" }
        ],
        "above": [
          { "width": 5000000, "rateBp":    0, "src": "ira-2017#sch.1-para-1(2)(b)(ii)" },
          { "width": 1000000, "rateBp":  500, "src": "ira-2017#sch.1-para-1(2)(b)(ii)" },
          { "width": null,    "rateBp": 1000, "src": "ira-2017#sch.1-para-1(2)(b)(ii)" }
        ]
      },
      "verified": false,                // 2017 tables — Q32
      "src": "ira-2017#sch.1-para-1(2)(b)"
    },
    "special-business": {
      "label": "Betting and gaming; liquor; tobacco",
      "rateBp": 4500,
      "src": "act-2-2025#s.3(1)(c)"
    }
  },

  "apit": { "tables": [], "src": "..." },
  "wht":  {
    "interest": { "rateBp": 1000, "src": "act-2-2025#s.3(3)" }
  },

  "calendar": {
    "instalments": [
      { "quarter": 1, "due": "2025-08-15", "src": "ira-2017#s.90(2)(a)" },
      { "quarter": 2, "due": "2025-11-15", "src": "ira-2017#s.90(2)(a)" },
      { "quarter": 3, "due": "2026-02-15", "src": "ira-2017#s.90(2)(a)" },
      { "quarter": 4, "due": "2026-05-15", "src": "ira-2017#s.90(2)(a)" }
    ],
    // Derived, not stored: period.to + 8 months [IRA s.93(1)].
    "returnDueRule": { "monthsAfterYearEnd": 8, "src": "ira-2017#s.93(1)" }
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

**Reduced rates are a cap, not a schedule — corrected.** An earlier version of this spec
modelled service-export and foreign-source income as its own band table. **That was
wrong**, and it was wrong in a way that would have produced correct answers for the simple
case and silently wrong ones for the mixed case.

The Act says the specified gains and profits are taxed at "the **maximum rate** of 15%",
*notwithstanding* the normal ladder [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. The
normal ladder still runs; the rate charged on that component is capped at 15%. So a
`rateCap` entry names the schedule it modifies, and the engine applies
`min(bandRateBp, maxRateBp)` to the capped component.

The familiar "first Rs. 1,000,000 at 6%, balance at 15%" is a *consequence* of this — the
6% band is under the cap and survives; every band above it collapses to 15%. Modelling it
as two hardcoded bands would encode the output of the rule instead of the rule, and would
break the moment a band moved.

`ifNotMet` is `null` for a cap: an unmet condition means the cap does not apply and the
normal ladder stands unmodified. For a genuine alternative *schedule* it would name the
fallback.

**Conditions are data, and they are questions.** `conditions` carries the human-facing
question, the fallback schedule when the condition is not met, and the evidence the
taxpayer needs. This is what lets the UI ask "were these earnings remitted through a
bank?" without the question being hardcoded — and it means the answer's
consequence (`ifNotMet`) is stated in the same place a maintainer updates the rule.

**`status` distinguishes proposed from enacted.** Budget announcements are not law. A
`proposed` year must not be used for a filing calculation, and the UI must label it.

**Superseded years are retained forever.** Amended and late returns are filed years
afterwards. Deleting a year makes the tool useless to exactly the taxpayer most likely
to need help.

**Deadlines that are rules are stored as rules.** The return due date is "eight months
after the end of the year of assessment" [IRA s.93(1)] — so the data carries
`returnDueRule.monthsAfterYearEnd`, not a literal date. Storing the date means every new
year needs a new entry and invites a stale one. Instalment dates *are* stored, because
s.90(2)(a) names specific months rather than an offset.

**`verified` is a first-class field.** Several values held here are 2017 text known to be
superseded — the capital gains rate above all. The engine reads this flag and emits a
warning for any unverified rate it actually applied. Removing the flag to make a warning
go away is the failure this field exists to prevent.

## Validation

Zod is the source of truth for the schema; the JSON Schema file is generated from it.

Validation enforces, at minimum:

- Every `src` resolves to a key in `sources`
- Every leaf value object has a `src` — **no exceptions**
- Rates are integers in basis points, 0–10000
- Amounts are non-negative integers
- Exactly one band per schedule has `width: null`, and it is last
- `period` is 12 months, 1 April to 31 March
- Where `maxRateBp` is set, it is **below** the top marginal rate of the schedule it caps
- Every `conditions[].ifNotMet` is `null`, or names an existing schedule
- Instalment due dates fall within or shortly after `period`

> **Correction (P05).** The `maxRateBp` line above previously read "no band exceeds it".
> That was left over from the draft that modelled reduced rates as a separate schedule,
> and it is the opposite of what a cap requires: bands above the cap are exactly what a
> cap exists to reduce, and a `maxRateBp` at or above the schedule's top rate reduces
> nothing — so income the Act entitles to a maximum rate would be charged the full ladder.
> The design note above ("Reduced rates are a cap, not a schedule") and
> [`calculation-engine.md`](calculation-engine.md) step 6 are what the schema and the
> engine implement; both throw on a cap that is not below the top marginal rate. The
> post-cap invariant the engine asserts is that no *charged* rate exceeds `maxRateBp`.

## Adding a year of assessment

Follow [`update-playbook.md`](update-playbook.md), or run `/add-tax-year`.
