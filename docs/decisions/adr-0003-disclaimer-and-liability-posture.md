# ADR 0003 — Disclaimer and liability posture

**Status:** accepted · **Date:** 2026-07-27

## Context

People will use this tool's output to decide what to pay the Inland Revenue Department
and what to put on a return. Getting a figure wrong is not a cosmetic bug — it exposes a
real person to underpayment, penalties and interest, or to overpaying tax they did not
owe.

The users this project targets are the least protected. A salaried employee with APIT
deducted has an employer's payroll function between them and the mistake. A work-from-home
consultant self-assessing foreign income, or an employee whose employer deducts nothing,
has nobody. They are also the users most likely to accept a confident number from a
website as authoritative, because the alternative is paying for advice they may not be
able to afford.

That asymmetry — highest stakes, least protection, most trust — is what this ADR responds
to.

## Decision

The tool presents itself as **decision support**, never as an authority, and never as
advice. Specifically:

**1. A persistent disclaimer on every page.** In the base layout, not a footer link, not
a dismissible banner. It says plainly: not tax advice, verify with IRD or a qualified
practitioner before filing.

**2. An "as at" stamp adjacent to every computed figure.** Showing the year of assessment
used and the date the underlying data was last reviewed — beside the number, not only in
the page footer. A screenshot of a result must carry its own provenance, because
screenshots are how these figures actually travel.

**3. Warnings render above the result, expanded.** `TaxResult.warnings` carries the
things a user must not miss: a rate that is unverified, a condition that was not met and
the fallback applied instead, a calculation the engine declined to perform. Below the
result or behind a disclosure triangle is equivalent to absent.

**4. `proposed` tax years are labelled as not yet law**, everywhere their figures appear.

**5. The engine refuses rather than guesses.** Where the correct treatment is genuinely
unresolved — currently, how relief is allocated across rate schedules for mixed
employment-and-foreign income — the engine returns a refusal explaining what is
unresolved. It does not pick the most plausible reading and present the result as a
number. A refusal sends the user to a practitioner; a plausible wrong number sends them
to IRD with a wrong return.

**6. No advisory language.** The tool describes what the law provides and what the user's
figures produce under it. It does not tell anyone what to do, and it does not suggest
arrangements that would reduce their liability. "The reduced rate applies where earnings
are remitted through a licensed bank" is a statement of law. "Route your payments through
a local bank to save tax" is advice, and this project does not give it.

**7. The result shows its working.** Every pipeline step and every rate applied, with
citations. A number a user cannot check is a number they must take on faith, and this
tool has not earned that.

## Consequences

**Good**

- A user who acts on the output has been told, unavoidably, what its limits are
- Showing the working turns a black box into something checkable — which is the actual
  differentiator against every other calculator in this space
- Refusing unresolved cases keeps the tool's confidence proportional to its knowledge
- The MIT warranty disclaimer is reinforced by the product's own behaviour rather than
  contradicted by it

**Costs**

- More visual chrome than a clean calculator would have. Accepted.
- Some users will bounce off a refusal where a competitor gives them a number. Also
  accepted — the competitor's number is not more correct for being offered.
- Every future UI change must preserve these elements, which constrains design work.

## Explicitly not permitted

The following are ruled out in advance, because each is a natural-seeming improvement
that would quietly undo the decision:

- Removing or shrinking the disclaimer in a visual cleanup pass
- Collapsing warnings behind a disclosure, or moving them below the result
- Defaulting the year of assessment from the system clock and hiding the selector
- Presenting a `proposed` year's figures without the not-yet-law label
- Adding a "what if" or optimisation feature that recommends arrangements
- Producing output styled to look like a completed IRD return or an official document

Any of these requires a superseding ADR, argued on its own terms.
