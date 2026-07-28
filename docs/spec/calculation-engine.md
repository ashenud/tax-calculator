# Calculation engine

> **Status:** spec — no code exists yet. **Revised 2026-07-28** after the research sweep.
> **Related:** [`data-model.md`](data-model.md), [`../worked-examples/README.md`](../worked-examples/README.md)

The engine is a pure function. Facts in, computed liability out, no I/O, no dates read
from the system clock, no globals.

```ts
computeTax(input: TaxInput, taxYear: TaxYearData): TaxResult
```

Everything time-dependent — the year of assessment, the rate tables, the deadlines —
arrives as data. That is what makes the worked examples usable as fixtures: a fixture that
depended on today's date would rot.

## What changed in this revision

The first draft of this spec was written before the Act had been read. Five things in it
were wrong, and each would have produced plausible wrong numbers:

1. Relief was applied to **all** income including capital gains. The Fifth Schedule says
   relief "is not available to be deducted against gains from the realisation of
   investment assets" [IRA Sch.5 para 2(a), as enacted 2017].
2. The foreign-income treatment was modelled as a **separate rate schedule**. It is a
   **maximum-rate cap** on the normal ladder [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)].
3. Terminal benefits and capital gains were not modelled at all as separately-rated
   components, though the Act carves them out explicitly [IRA Sch.1 para 1(2), 2017].
4. Relief and qualifying payments were two steps. Under s.52(1) they are one deduction of
   the aggregate Fifth Schedule amount [IRA s.52(1)].
5. Instalments were "a quarter each". The Act gives a formula on the taxpayer's
   **estimate** [IRA s.90(3)].

## Non-negotiables

**Integer rupees end to end.** No floats in any path. Rates are basis points (6% = `600`),
applied as `amount * rateBp / 10000` with the division last.

**Rounding is specified per operation, never defaulted.** Each step states its rule.

**Every step is retained.** `TaxResult` carries the full working. The UI shows it, and a
failing fixture must be diagnosable to the step that diverged.

**No rate is resolved globally.** Everything comes from the `taxYear` argument.

## Pipeline

The order is itself a correctness property.

### 1. Assessable income, per head

Employment, business, investment, other — each net of its own deductions. Rounded to the
rupee at the end of each head.

Each amount carries **tags** describing what it is, because tags drive steps 3–5:

| Tag | Meaning |
|---|---|
| `capital-gain` | gain on realisation of an investment asset — separately rated, **and outside relief** |
| `terminal-benefit` | separately rated on its own tables, with `serviceYears` |
| `special-business` | betting/gaming, liquor, tobacco — separately rated flat |
| `foreign-capped` | qualifies for the maximum-rate cap, **subject to its condition** |

Untagged income is ordinary income for the normal ladder.

### 2. Partition before deducting anything

Split total assessable income into:

- **`reliefEligible`** — everything except `capital-gain`
- **`reliefIneligible`** — the `capital-gain` amounts

This partition happens **before** step 3 and it is not optional. Pooling gains with income
and then deducting relief overstates the relief and understates the tax
[IRA Sch.5 para 2(a), as enacted 2017].

### 3. Taxable income

```
deduction   = fifthScheduleAggregate   // personal relief + qualifying payments, one step
taxableMain = max(0, reliefEligible − deduction)
taxableGain = reliefIneligible          // no deduction applies
```

Relief and qualifying payments are deducted together as the aggregate Fifth Schedule
amount [IRA s.52(1)]. **Relief is applied exactly once**, against aggregated income — not
per head. Applying it per head is the commonest error in this domain and must be covered
by a fixture.

The floor at zero is real. Note it applies to `taxableMain` only: unused relief does not
spill onto gains.

### 4. Separate the specially-rated components

From `taxableMain`, carve out the components the Act rates separately, then:

> "only the remainder of the individual's taxable income shall be taxed at the rates
> referred to in subparagraph (1)"

[IRA Sch.1 para 1(2)(d), as enacted 2017]

| Component | Treatment |
|---|---|
| `capital-gain` | own flat rate — **rate is currently superseded, see below** |
| `terminal-benefit` | own table, selected by `serviceYears` against the table's threshold |
| `special-business` | own flat rate |
| remainder | the normal ladder |

### 5. The maximum-rate cap

`foreign-capped` income is **not** a separate schedule. The normal ladder still runs; the
rate charged on that component is capped:

```
effectiveRateBp = min(bandRateBp, cap.maxRateBp)
```

[IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]

**Evaluate the condition first.** If the cap's condition is not met — the earnings were not
remitted through a bank to Sri Lanka — the cap simply does not apply and the ladder stands
unmodified. There is no fallback schedule to switch to; `ifNotMet` is `null`.

#### Ordering — unresolved, and the engine must refuse

Where a taxpayer has **both** capped and uncapped ordinary income, the Act does not say
which component occupies the lower bands. That changes the answer materially.

- Only capped income → unambiguous. Compute and return.
- Only uncapped income → unambiguous. Compute and return.
- **Both** → **refuse.** Return a result with no figure and a warning naming Q14.

Per [`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md),
a refusal sends the user to a practitioner; a plausible wrong number sends them to IRD with
a wrong return. Do not implement a guess, and do not let a fixture encode one.

### 6. Gross tax

Walk each applicable band in order, filling its `width`:

```
bandTax = floor(bandAmount * effectiveRateBp / 10000)
```

**Floor per band, then sum** — not sum-then-round. Assert any declared `maxRateBp`
invariant: a band whose capped rate still exceeds the cap is a data error and must throw,
not silently overcharge.

Gross tax is the sum across the ladder, the capped component, and every separately-rated
component.

### 7. Credits

Subtract, in order: APIT deducted, AIT/WHT withheld, foreign tax credit. Each is retained
separately so a taxpayer can check it against their certificates.

```
taxPayable = max(0, grossTax − credits)
```

Foreign tax credit is **calculated separately for each source and for each gain**, and
capped at the average Sri Lankan rate applied to that foreign income [IRA s.81(1)]. It is
allowed only if the foreign tax was paid within two years of the end of the year the
income was derived [IRA s.81(2)].

Whether **excess** credit is refundable or carried forward is open (Q20). Surface the
excess explicitly; never silently floor it away.

### 8. Payment schedule

Instalments are **not** a quarter of the liability each. The Act gives [IRA s.90(3)]:

```
instalment = (A − C) / B

A = current estimated tax payable under s.91 or s.92
B = number of instalments remaining, including this one
C = tax already paid for the year before the due date
```

So the engine takes the **estimate** as an input distinct from the computed liability.
They routinely differ, and the difference is what the final payment settles.

Instalment dates come from the tax-year data [IRA s.90(2)(a)]. Note the fourth instalment
falls in the **following** year of assessment — a model that assumes four dates inside the
year is wrong.

**The return due date is derived, not stored**: eight months after the end of the year of
assessment [IRA s.93(1)]. Storing a literal date means every new year needs a new entry
and invites a stale one.

Rounding: round each instalment to the rupee and put any residue on the final payment, so
the schedule sums exactly.

## Superseded inputs the engine must guard

The capital gains rate in the data is the 2017 figure and **has been changed** by an act
this repository does not hold (Q42). Terminal benefit tables are likewise 2017 text.

The engine must therefore honour a per-value `verified` flag from the data and emit a
warning for any unverified rate it actually applied. A computation that silently uses a
known-stale rate is exactly the failure ADR-0003 exists to prevent.

## Result shape

```ts
interface TaxResult {
  yearOfAssessment: string;
  assessableByHead: Record<Head, number>;
  partition: { reliefEligible: number; reliefIneligible: number };
  deduction: { personalRelief: number; qualifyingPayments: number; total: number };
  taxableMain: number;
  taxableGain: number;
  components: {
    kind: 'ladder' | 'capped' | 'capital-gain' | 'terminal-benefit' | 'special-business';
    amount: number;
    conditionsMet?: boolean;
    bands: { amount: number; rateBp: number; effectiveRateBp: number; tax: number; src: string }[];
    tax: number;
  }[];
  grossTax: number;
  credits: { apit: number; ait: number; foreign: number; total: number; excess: number };
  taxPayable: number;
  schedule: {
    instalments: { quarter: number; due: string; amount: number }[];
    finalPayment: { due: string; amount: number };
    returnDue: string;                       // derived from period.to + 8 months
  };
  refusals: { code: string; question: string; explanation: string }[];
  warnings: { code: string; message: string; severity: 'info' | 'warn' | 'blocking' }[];
  sourcesUsed: string[];
}
```

`refusals` is separate from `warnings` on purpose. A refusal means **no figure was
produced** for that path; a warning qualifies a figure that was. The UI renders them
differently and must never collapse either.

## Testing

Fixtures come from [`../worked-examples/`](../worked-examples/), asserted field by field —
not just on `taxPayable`. Asserting only the total lets two compensating errors pass.

Required coverage:

- Below the relief threshold — zero tax
- Each ladder band boundary, just below and just above
- Foreign income remitted vs not remitted — same gross, cap applied vs not
- **Mixed capped and uncapped income — asserts a refusal, not a number**
- Relief applied once across two heads
- **Capital gain plus ordinary income — asserts relief did not touch the gain**
- Terminal benefit on each table, and the service-length boundary
- Credits exceeding gross tax — excess surfaced
- Instalment schedule where the estimate differs from the final liability
- Every historical year still computing its original answer

The last is a regression guard on the whole design: if adding a year changes what an
earlier year computes, rates are being resolved globally somewhere.
