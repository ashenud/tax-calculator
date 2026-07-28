# UI behaviour

> **Status:** spec — no code exists yet
> **Related:** [`ui-design-system.md`](ui-design-system.md), [`calculation-engine.md`](calculation-engine.md), [`../personas/`](../personas/)

What the interface *does*. The design system says how it looks; this says how it behaves,
including the cases where the honest behaviour is to give the user nothing.

## Principles

**Ask what the user can answer.** Not "is this service export income?" but "who were your
clients, and how did the money reach you?" Statutory categories are the tool's problem to
resolve, not the user's. Every question in this spec is phrased as something a person
knows about their own life.

**Never infer the year of assessment from the clock.** In July 2026 a user could be filing
2025/26, estimating 2026/27, or amending 2023/24. All three are ordinary.

**Compute locally, keep nothing.** No network call carries entered figures.

**A partial answer is better than a wrong one, and no answer is better than a guess.**

## Primary flow

```
Landing  →  Persona picker  →  Y/A selection  →  Guided questions  →  Result
                  ↑                                      ↓
                  └──────────── change persona ──────────┘
```

### 1. Persona picker

Four cards, each written as a situation rather than a category:

- "I work for overseas clients and get paid in foreign currency" → p1
- "I'm employed but no tax is deducted from my pay" → p2
- "I have a salary and also do freelance work" → p3
- "I have interest, dividends, rent, or I sold property" → p4

Plus "None of these / I'm not sure" → the general flow with all sections available.

The persona chooses which question groups appear. It is a **routing convenience, not a
constraint**: every user can open any section, because real situations overlap and a
misrouted user must not be trapped.

### 2. Year of assessment

Presented before any figures are entered, because it determines every rate that follows.

- Options come from the data files, newest first, labelled `2025/2026 (1 Apr 2025 – 31 Mar 2026)`
- No default is preselected on first visit. The user chooses.
- A `proposed`-status year carries a visible "not yet law" badge and a caution notice
- A year whose data has unverified values shows the count: "3 figures in this year are
  not yet confirmed against primary law"

### 3. Questions

Grouped, progressively disclosed, one concern per screen section on mobile.

**Income sections** appear per persona: employment, business/freelance, investment,
capital gains, terminal benefits.

**Condition questions are rendered from data**, never hardcoded — from
`taxYear.conditions` in [`data-model.md`](data-model.md). When an amendment adds a
condition, it appears here without a code change.

#### The remittance question — the one that matters

For foreign-currency income, the naive rendering of the condition is a yes/no: *"Were
these earnings remitted through a bank to Sri Lanka?"* A consultant cannot reliably answer
that, and a wrong answer here swings the liability more than any other input.

So this condition renders as a **route picker** with amount-per-route:

- Direct transfer into my Sri Lankan bank account
- Into a foreign-currency account at a Sri Lankan bank
- Through Wise / Payoneer / PayPal, then withdrawn to a Sri Lankan bank
- Kept in an account outside Sri Lanka
- A mixture — enter an amount against each

Behaviour by answer:

| Route | Behaviour |
|---|---|
| Direct to LK bank | condition met; cap applies |
| Kept offshore | condition not met; normal ladder, with an explicit warning that this is why |
| FX account at LK bank | **unresolved (Q13)** — flag, do not decide |
| Intermediary | **unresolved (Q41)** — flag, do not decide |
| Mixture | **unresolved (Q11)** — refuse the computation |

Where the treatment is unresolved the UI says so in the user's terms: "The law does not
clearly say how this case is treated. We are not going to guess at your tax." Then it
names what would settle it and points at a practitioner.

### 4. Result

Order on the page, top to bottom, and this order is normative:

1. **Refusals**, if any — replacing the figure entirely
2. **Warnings**, expanded
3. **The figure**, with its as-at stamp
4. **The working** — every pipeline step, each rate with its citation
5. **Payment schedule** — instalment dates and amounts, final payment, return due date
6. **What to do next** — TIN, e-filing, and the verify-before-you-file line

Never reorder so the figure leads. A user who scrolls past a blocking warning to reach a
number has been failed by the layout, not by their own carelessness.

## States

Every interactive surface specifies all of these. "Loading" is mostly absent by design —
the computation is synchronous and local.

| State | Behaviour |
|---|---|
| Empty | No figure. Prompt describing what to enter. Never `Rs. 0`. |
| Partial | Compute what is computable; label the rest "not yet entered". |
| Valid | Result updates live, debounced 300ms, announced politely. |
| Invalid | Inline message under the field; result panel retains the last valid figure, visibly marked stale. |
| Refused | `RefusalPanel` replaces the figure. Explains the unresolved point, cites the open question, suggests a practitioner. |
| Unverified data | `UnverifiedBadge` on the affected line, plus a warning listing which figures are unconfirmed. |
| Error | Engine throw is a bug, not a user state: show a plain apology and a link to report it. Never a partial number. |

### Empty is not zero

An untouched field is `null`. Displaying `Rs. 0` for an unentered field invites the user
to believe a computation happened. The result panel stays empty until at least one income
figure exists.

## Validation

**Validate on blur, not on keystroke.** Validating while typing tells someone their
half-entered number is wrong, which is hostile.

Rules:

- Amounts: non-negative integers; separators and `Rs.`/`LKR` prefixes stripped on parse
- Reject decimals with a message explaining rupee-integer handling rather than silently rounding
- Cross-field: expenses exceeding income is a warning, not an error — it happens, and a
  loss may be legitimate
- Service years required whenever a terminal benefit is entered, because it selects the table
- Submitting with errors focuses a summary at the top listing each problem as a link

## Warnings the UI must be able to render

Driven by `TaxResult.warnings`; the copy lives with the UI, the trigger with the engine.

| Code | User-facing meaning |
|---|---|
| `unverified-rate` | A rate used here is not yet confirmed against primary law |
| `stale-law` | This year's data predates a later amendment act the project does not hold |
| `condition-not-met` | The reduced rate did not apply, and why |
| `condition-unresolved` | The law is unclear for this route |
| `excess-credit` | Tax withheld exceeds the liability; treatment of the excess is unresolved |
| `proposed-year` | These figures are not yet law |
| `late-instalment` | One or more instalment dates for this year have passed |

`late-instalment` is persona p2's whole problem, and it must be prominent rather than a
footnote.

## Guidance pages

Static, zero JavaScript, one per research topic. Each carries the disclaimer, an as-at
stamp, and inline citations rendered as links to the sources page.

They are the entry point from search, so each opens by answering the question the reader
arrived with — "is my foreign income taxed?" — before explaining the mechanism.

## Rates pages

One page per year of assessment, rendered from the data file, every figure with its
citation and its `verified` state. This is what lets a sceptical reader check the tool
without running it, and it is generated from the same data the engine uses, so the two
cannot disagree.

## Responsive behaviour

| Width | Layout |
|---|---|
| < 768px | Single column; result panel below inputs; sticky summary bar showing the current figure |
| 768–1024px | Single column, wider gutters |
| > 1024px | Two columns; inputs left, sticky result panel right |

The mobile sticky summary bar shows the figure and a "see working" affordance. It must
also surface a blocking warning indicator — the one thing that must not be lost when the
full panel is off-screen.

## Keyboard and screen reader

- Skip link to main content
- Section headings are real headings, in order, no level skips
- The result panel is `aria-live="polite"`; refusals are `role="alert"`
- Route picker is a radio group, arrow-key navigable
- Escape closes any overlay; focus returns to the trigger
- The working table is a real `<table>` with scoped headers, not a grid of divs

## Print

Drops navigation, the year selector and all inputs-as-controls. Keeps entered values as
text, the full working, citations, the payment schedule, **the disclaimer and the as-at
stamp**. Page breaks avoided inside the working table.

## Explicitly out of scope

- Saving, accounts, or any server round-trip with figures
- Analytics recording entered values
- Filing or payment integration
- Any suggestion of how to reduce liability
- Comparing years to show a "saving"
