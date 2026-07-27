# Calculation engine

> **Status:** spec — no code exists yet
> **Related:** [`data-model.md`](data-model.md), [`../worked-examples/README.md`](../worked-examples/README.md)

The engine is a pure function. Facts in, computed liability out, no I/O, no dates read
from the system clock, no globals.

```
computeTax(input: TaxInput, taxYear: TaxYearData): TaxResult
```

Everything time-dependent — the year of assessment, the rate tables, the deadlines —
arrives as data. This is what makes the worked examples usable as fixtures: a fixture
that depended on today's date would rot.

## Non-negotiables

**Integer rupees end to end.** No floats in any path. Rates are basis points
(6% = `600`), applied as `amount * rateBp / 10000` with the division performed last.

**Rounding is specified per operation, never defaulted.** Each step below states its
rule. `Math.round` applied wherever it happens to be convenient produces results that
drift from what a taxpayer computes by hand, and "your calculator says Rs. 3 different
from mine" destroys confidence out of all proportion to the amount.

**Every step is retained.** `TaxResult` carries the full working, not just the total. The
UI shows it, and a failing fixture must be diagnosable to the step that diverged.

**No rate is resolved globally.** Everything comes from the `taxYear` argument. If a
function can compute tax without being told the year of assessment, it is wrong.

## Pipeline

Strict order. The order is itself a correctness property — reliefs applied before
aggregation, or credits applied before the rate schedule, give wrong answers that look
plausible.

### 1. Assessable income, per head

Employment, business, investment, other — computed separately, each net of its own
deductions. Rounded to the rupee at the end of each head.

Each amount is tagged with the rate schedule it belongs to. Foreign-currency
consultancy income is business income *and* carries the `service-export-foreign` tag;
this tagging is what makes step 4 possible.

### 2. Total assessable income

Sum of heads. Exact — no rounding, the inputs are already integers.

### 3. Taxable income

```
taxable = max(0, totalAssessable − personalRelief − qualifyingPayments)
```

**Personal relief is applied exactly once**, against total assessable income — not once
per head, and not against a single head. Applying it per head is the single most common
error in this domain and must be covered by a fixture.

The floor at zero is real: reliefs do not create a refundable loss here.

### 4. Schedule allocation — the hard part

Where a taxpayer's income falls under more than one rate schedule (salary on the normal
ladder plus foreign consultancy on the reduced ladder), the engine must decide how
taxable income is distributed across schedules after a single pooled relief.

**This is not yet settled.** It is the most consequential open question in the project:
it changes the answer for persona `p3` materially, and getting it wrong produces a
confidently wrong number for the taxpayers this tool most wants to help. It is recorded
in [`../research/12-open-questions.md`](../research/12-open-questions.md) and must be
resolved from primary sources — statute and IRD guidance — before the engine is
implemented.

Candidate approaches, to be decided by the law and not by preference:

- Relief set against normal-rate income first, remainder to the reduced schedule
- Relief apportioned pro rata across schedules by assessable amount
- Reduced-rate income computed separately with its own band ladder, relief against the
  normal-rate income only

Do **not** implement a guess. Until it is resolved, the engine should compute the
single-schedule cases and explicitly refuse mixed cases with a message saying so. A
refusal is honest; a plausible wrong number is not.

Before allocation, evaluate each schedule's `conditions`. A schedule whose condition is
unmet falls back to the schedule named in `ifNotMet` — this is the mechanism by which
unremitted foreign income lands on the full ladder.

### 5. Gross tax

For each schedule, walk its bands in order, filling each band's `width` from the taxable
income allocated to it, at that band's `rateBp`. The final `width: null` band takes the
balance.

```
bandTax = floor(bandAmount * rateBp / 10000)
```

**Floor per band, then sum** — not sum-then-round. Assert the `maxRateBp` invariant
where the schedule declares one.

### 6. Credits

Subtract, in order: APIT already deducted, AIT/WHT already withheld, foreign tax credit.
Each credit is retained separately in the result — a taxpayer needs to see which credits
were applied to check them against their certificates.

```
taxPayable = max(0, grossTax − credits)
```

Whether excess credit is refundable or carried forward is an open question; until
resolved, surface the excess explicitly rather than silently flooring it away.

### 7. Payment schedule

From `calendar`: the four quarterly instalments, the final payment date, the return due
date. Instalments derive from estimated tax (SET), so the engine takes the estimate as
an input rather than assuming it equals the computed liability — they routinely differ,
and the difference is what the final payment settles.

Instalment rounding: round each to the rupee, and put any residue on the final payment,
so the instalments plus final payment sum exactly to the liability.

## Result shape

```ts
interface TaxResult {
  yearOfAssessment: string;
  assessableByHead: Record<Head, number>;
  totalAssessable: number;
  reliefsApplied: { personal: number; qualifyingPayments: number };
  taxableIncome: number;
  allocation: { schedule: string; amount: number; conditionsMet: boolean }[];
  bandBreakdown: { schedule: string; band: number; amount: number; rateBp: number; tax: number }[];
  grossTax: number;
  credits: { apit: number; ait: number; foreign: number; total: number };
  taxPayable: number;
  schedule: { instalments: { due: string; amount: number }[]; finalPayment: { due: string; amount: number } };
  warnings: string[];      // unverified rates, unmet conditions, refusals
  sourcesUsed: string[];
}
```

`warnings` is load-bearing, not decorative. It carries "this rate is unverified", "the
remittance condition was not met so the normal ladder was applied", and "mixed-schedule
allocation is unresolved — no figure produced". The UI must render it prominently; see
[`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md).

## Testing

Fixtures come from [`../worked-examples/`](../worked-examples/), parsed from their YAML
front matter and asserted field by field — not just on `taxPayable`. Asserting only the
total lets two compensating errors pass.

Required coverage:

- Below the relief threshold — zero tax
- Each band boundary, just below and just above
- Foreign income remitted vs. not remitted — same gross, different schedule
- Relief applied once across multiple heads
- Credits exceeding gross tax
- Every historical year of assessment still computing its original answer

That last one is a regression guard on the whole design: if adding Y/A 2026/27 changes
what Y/A 2025/26 computes, rates are being resolved globally somewhere.
