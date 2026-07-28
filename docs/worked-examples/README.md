# Worked examples

> **Status:** format corrected against the implemented engine (P07); one example written
> **Now unblocked:** normal-ladder cases for Y/A 2025/2026 — the rates are verified
> **Still blocked:** anything asserting a figure for a taxpayer with both capped and
> uncapped income (Q14) — that case is written as a **refusal** fixture, not a figure

Fully computed cases: a taxpayer's facts, the computation line by line with citations,
and the resulting liability and payment schedule.

## These are tests, not illustrations

Each file is parsed and consumed **verbatim** as a fixture by the calculation engine's
test suite. Two consequences:

**The format is not decorative.** The YAML front matter is machine-read. Field names,
integer rupees, no thousands separators inside the front matter.

**The expected outputs are assertions.** An arithmetic slip here does not produce a
flawed document — it produces a test that permanently asserts a wrong answer and will
fail correct code. Worse, once a test passes, the wrong figure acquires the authority of
being tested.

## What can and cannot be written now

**Can be written.** The Y/A 2025/2026 personal relief and normal individual ladder are
verified from two independent primary sources — see
[`../research/04-rate-tables.md`](../research/04-rate-tables.md). Examples on the normal
ladder can be written with real citations and `verified: true`:

- income below the relief threshold
- each normal-ladder band boundary
- salary with no APIT deducted (persona p2), for the tax figure itself
- relief applied once across two heads of income

**Cannot be written.** Anything depending on the reduced service-export / foreign-source
schedule. The 15% maximum is verified, but the band structure beneath it is not stated in
the sources held, and whether personal relief applies against that income is open (Q6). An
example would have to invent the intermediate bands — baking a guess into the test suite
where its provisional status would quietly disappear.

Anything spanning both schedules is blocked on Q14, and anything asserting an instalment
date is blocked on Q21–Q23.

> **Correction (P07).** The second sentence no longer holds. Q21 (the instalment dates),
> Q23 (the filing deadline as a rule, eight months after the year end) and Q25 (the
> `(A − C) / B` basis) are all in the **verified** table of
> [`../research/12-open-questions.md`](../research/12-open-questions.md) and are cited in
> the tax-year data. An instalment schedule is therefore assertable. What is still
> unverified is **Q22** — whether a final payment date exists separately from the fourth
> instalment — so `schedule.finalPayment.due` is `""` and no fixture states a date for it.

> **Correction (P07).** The paragraph above was written when the foreign-income treatment
> was still modelled as a separate rate schedule with its own bands. It is not: it is a
> **maximum-rate cap** on the normal ladder [IRA Sch.1 para 1(6), ins. Act 2/2025
> s.3(1)(d)], so there are no intermediate bands to invent — the ladder's own bands run,
> each charged at `min(bandRateBp, 15%)`. A single-source foreign case, remitted or not
> remitted, is therefore writable with real citations.
>
> Two conditions on writing one. **Q6 is only partially verified**: that personal relief
> is available against capped income is a structural reading of s.52(1), not an express
> statement, so a foreign fixture asserts an answer to it and carries `verified: false`
> with an `unverifiedBecause` naming Q6. And a taxpayer holding **both** capped and
> uncapped income remains blocked: the Act does not say which occupies the lower bands
> (Q14). That case is still written as a worked example, but it asserts a **refusal** —
> see the refusal shape below. It must not contain a figure.

If an example must be written before its rates are verified, it carries a prominent
warning at the top of the file, `verified: false`, an `unverifiedBecause` naming the rate
and its open question, and a row in
[`../research/12-open-questions.md`](../research/12-open-questions.md). The harness prints
that reason beside the fixture on every run.

## File naming

```
<persona>-<distinguishing-fact>-<Y/A>.md

p1-foreign-remitted-2025-26.md
p1-foreign-not-remitted-2025-26.md
p2-salary-no-apit-2025-26.md
```

The distinguishing fact matters in the filename: contrast pairs should sort next to each
other.

## Format

> **Correction (P07).** Everything under this heading was rewritten. The format previously
> documented here was designed before the engine existed, and named fields the engine has
> never had: income items carried a `schedule:` (foreign treatment was then modelled as a
> separate rate schedule; it is a **cap** on the normal ladder), `deductions` was keyed by
> made-up names like `businessExpenses` rather than by head, and the `expected` block used
> `totalAssessable` / `reliefsApplied` / `taxableIncome` / `allocation` / `bandBreakdown`,
> none of which appear in `TaxResult`. A fixture written to that format could not be run at
> all, and — worse — a fixture *author* working from it would reason in a vocabulary the
> law and the engine do not share.
>
> The format below maps one-to-one onto the implemented types: `input` **is** `TaxInput`
> and `expected` mirrors `TaxResult`, field for field, so that asserting is literal and no
> translation layer can hide a disagreement. `src/lib/tax/fixtures.ts` validates it
> strictly, and the type of `toTaxInput` there is a compile-time proof that the two have
> not drifted. The authority for the result shape is
> [`../spec/calculation-engine.md`](../spec/calculation-engine.md), "Result shape".

### Front matter

| Key | Required | Meaning |
|---|---|---|
| `id` | yes | Must equal the filename without `.md` |
| `persona` | no | `p1`–`p4`, linking to [`../personas/`](../personas/) |
| `yearOfAssessment` | yes | `"YYYY/YYYY"`, quoted. Resolves to `data/tax-years/YYYY-YY.json` |
| `verified` | yes | `true` only when every rate the computation **applies** has been verified |
| `unverifiedBecause` | when `verified: false` | Which rate is unconfirmed or superseded, and its open question |
| `input` | yes | A `TaxInput`, passed to `computeTax` unchanged |
| `expected` | yes | A `TaxResult`, asserted field by field |

### `input` — the `TaxInput` fields

Only `residency` and `income` are required; omit what does not apply rather than writing
zeroes. Each income item is `{ label, amount }` plus, as needed:

- `tags` — `capital-gain`, `terminal-benefit`, `special-business`, `foreign-capped`.
  Untagged income is ordinary income for the ladder. **There is no `schedule` field.**
- `serviceYears` — required on a `terminal-benefit` item; the two tables differ materially
  and the engine throws rather than pick one [IRA Sch.1 para 1(2)(b), as enacted 2017].
- `conditions` — answers by condition id, e.g.
  `{ remitted-through-bank-to-sri-lanka: true }`. Required for every condition a cap that
  would otherwise apply names; an unanswered condition throws, because it is not a "no".
- `foreignTax` — `{ paid, paidOn }`, attached to the source the tax was paid on. The credit
  is capped per source [IRA s.81(1)], so there is **no** `creditsPaid.foreign`; supplying
  one is rejected.

`deductions` is keyed **by head** — `{ business: 450000 }`, not by expense name. Note that
the engine refuses a head that carries both a deduction and tagged income, because how the
deduction apportions between them is unspecified; put the tagged amount under a head of its
own or state the income net.

### `expected` — the `TaxResult` fields

All of `assessableByHead`, `partition`, `deduction`, `taxableMain`, `taxableGain`,
`components`, `grossTax`, `credits`, `taxPayable`, `schedule` and `warnings` are required.
They are required rather than optional because an omitted field is an assertion nobody
makes, and a fixture that asserts less than it appears to is worse than no fixture.
`sourcesUsed` is optional; given, it is compared as a set.

- `components` is compared **in order**, by `kind` first. The engine emits `ladder`, then
  `capped`, then `terminal-benefit`, `special-business`, and `capital-gain` last — and it
  emits only the ones that exist. Where *all* ordinary income is capped there is **no
  `ladder` component at all**, not a `ladder` component of nil.
- Each band states `amount`, `rateBp` and `effectiveRateBp`. The pair is the point: under a
  cap `effectiveRateBp` is `min(rateBp, maxRateBp)`, so the fixture shows that a cap bit and
  by how much. `src` on a band is optional and is asserted where given.
- `warnings` is a list of **codes** (or `{ code, severity }`), in the order the engine emits
  them — not messages, which are meant to be improved. An empty list asserts that the
  computation raised nothing, which is itself worth asserting.
- `schedule.finalPayment.amount` is **signed**: negative is an overpayment. Its `due` is
  `""` — whether a final payment date exists separately from the last instalment is Q22.
- `schedule.instalments` is empty when `input.estimatedTaxForInstalments` is omitted. The
  engine does not substitute the liability it computed for the taxpayer's own estimate.

### The shape, on a real computation

````markdown
---
id: p1-foreign-remitted-2025-26
persona: p1
yearOfAssessment: "2025/2026"
verified: false          # true only when every rate applied has been verified
unverifiedBecause: "..." # required when verified: false — name the rate and its question

input:
  residency: resident
  income:
    business:
      - label: Overseas consultancy
        amount: 6000000
        tags: [foreign-capped]
        conditions: { remitted-through-bank-to-sri-lanka: true }
  estimatedTaxForInstalments: 500000

expected:
  assessableByHead: { employment: 0, business: 6000000, investment: 0, other: 0 }
  partition: { reliefEligible: 6000000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 4200000
  taxableGain: 0
  components:
    - kind: capped
      amount: 4200000
      conditionsMet: true
      bands:
        - { amount: 1000000, rateBp: 600,  effectiveRateBp: 600,  tax: 60000 }
        - { amount: 500000,  rateBp: 1800, effectiveRateBp: 1500, tax: 75000 }
        - { amount: 500000,  rateBp: 2400, effectiveRateBp: 1500, tax: 75000 }
        - { amount: 500000,  rateBp: 3000, effectiveRateBp: 1500, tax: 75000 }
        - { amount: 1700000, rateBp: 3600, effectiveRateBp: 1500, tax: 255000 }
      tax: 540000
  grossTax: 540000
  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }
  taxPayable: 540000
  schedule:
    instalments:
      - { quarter: 1, due: "2025-08-15", amount: 125000 }
      - { quarter: 2, due: "2025-11-15", amount: 125000 }
      - { quarter: 3, due: "2026-02-15", amount: 125000 }
      - { quarter: 4, due: "2026-05-15", amount: 125000 }
    finalPayment: { due: "", amount: 40000 }
    returnDue: "2026-11-30"
  warnings: [final-payment-date-unresolved]
---

# P1 — consultancy income remitted through a bank to Sri Lanka

## Facts

Prose description of the taxpayer's situation.

## Computation

| Step | Amount | Authority |
|---|---|---|
| Consultancy income | 6,000,000 | — |
| **Total assessable** | **6,000,000** | |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1] |
| **Taxable income** | **4,200,000** | |

### Rate schedule

Which schedule applies, and — where a cap applies — the condition that determines it, with
the answer for this taxpayer.

| Band | Amount | Rate | Capped at | Tax |
|---|---|---|---|---|
| First 1,000,000 | 1,000,000 | 6% | — | 60,000 |
| Next 500,000 | 500,000 | 18% | 15% | 75,000 |
| ... | | | | |
| **Gross tax** | | | | **540,000** |

## Payment schedule

Instalments and their dates, the final payment, and the return due date — each cited.

## Notes

Anything unresolved, and what the contrasting example shows.

## Self-check

The list at the end of this README, worked through explicitly.
````

> The figures above are **illustrative**: they are a real computation against the committed
> Y/A 2025/2026 data, shown to demonstrate the format, and the document they are cut from
> does not exist. The worked example that does is
> [`p2-below-relief-threshold-2025-26.md`](p2-below-relief-threshold-2025-26.md).

### A fixture that asserts a refusal

Where the law is unresolved the engine produces **no figure** — currently only the mixed
capped/uncapped ordering question (Q14). A fixture for such a case states `expected.refusal`
and **no figure at all**. The parser rejects `components`, `grossTax`, `credits`,
`taxPayable` or `schedule` appearing beside it: on that path those fields are zeroed
placeholders, and asserting `taxPayable: 0` would record "no answer was produced" as "no tax
is due".

The income fields stay, because they are what a practitioner taking the case over needs.

````markdown
expected:
  refusal: { code: mixed-capped-and-uncapped-ordering, question: Q14 }
  assessableByHead: { employment: 0, business: 7000000, investment: 0, other: 0 }
  partition: { reliefEligible: 7000000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 5200000
  taxableGain: 0
  warnings: []
````

## Rules

**Integer rupees in front matter.** No separators, no decimals, no currency symbols. The
prose tables may use `6,000,000` for readability; the front matter may not.

**Rates as basis points** in front matter: 6% is `600`, 15% is `1500`.

**Every rate cited in the prose.** The front matter is for the machine; the prose is
where a human checks the work.

**Show every intermediate step.** When a fixture fails, the maintainer needs to see which
step diverged. A file that jumps from income to tax payable is useless at exactly the
moment it is needed.

**`verified: false` unless every rate used has been verified.** The engine's test runner
should report unverified fixtures separately so they cannot be mistaken for a green
suite.

## Contrast pairs

The most valuable examples come in pairs identical but for one fact, isolating a single
rule.

The essential pair is foreign-currency income **remitted** through a bank versus
the **same income not remitted** — same gross, materially different liability. An example
showing only the favourable path teaches nothing about the condition the taxpayer has to
satisfy, which is the thing they most need to understand.

Also worth pairing: either side of a band boundary; employer-deducted versus not; a
terminal benefit on its own tables versus taxed as ordinary employment income.

## Coverage required before the engine ships

- [x] Income below the relief threshold — zero tax
      ([`p2-below-relief-threshold-2025-26.md`](p2-below-relief-threshold-2025-26.md))
- [ ] Each band boundary, just below and just above
- [ ] Foreign income remitted / not remitted (contrast pair)
- [ ] Personal relief applied once across two heads of income
- [ ] Credits exceeding gross tax
- [ ] Salary with no APIT deducted, including the instalment schedule
- [ ] Terminal benefit on its own tables
- [ ] One example per historical year of assessment supported

The authoritative list is the one in
[`../spec/calculation-engine.md`](../spec/calculation-engine.md), "Testing", which is
longer than this one: it also requires a **mixed capped and uncapped** case asserting a
refusal rather than a number, a **capital gain alongside ordinary income** asserting that
relief did not touch the gain, the terminal-benefit **service-length boundary**, and an
**instalment schedule where the estimate differs from the liability**. Where the two lists
differ, the spec wins.

## Self-check before committing an example

- Band-by-band tax sums to the stated gross tax
- Taxable income actually falls within the bands charged
- Instalments plus final payment sum exactly to the liability
- Personal relief applied exactly once, after aggregating assessable income
- Front matter is valid YAML and matches this schema
- Every rate carries a citation in the prose
