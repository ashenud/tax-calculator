---
id: P09
title: The ADR-0003 components — warnings, refusals, citations, year selector
status: pending
depends: [P08, P07]
agent: ui-builder
---

# P09 — Constrained components

## Read first

- [`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md) — **these components exist because of this ADR**
- [`../spec/ui-behaviour.md`](../spec/ui-behaviour.md) — the warning codes table

## Task

| Component | Behaviour |
|---|---|
| `WarningList` | Renders `TaxResult.warnings`. **Above** the result, expanded, never an accordion. Severity styling; icon plus text, never colour alone. |
| `RefusalPanel` | Renders `TaxResult.refusals`. **Replaces the figure entirely.** Explains what is unresolved, in the user's terms, and suggests a practitioner. `role="alert"`. |
| `CitationRef` | Renders a `src` pointer as a link to the sources page. Appears beside every displayed rate. |
| `UnverifiedBadge` | On any figure whose data carries `verified: false`. |
| `YearSelector` | Options from the data, newest first, **no default preselected**. `proposed` years badged "not yet law". Shows the count of unverified figures for the selected year. |

Copy for each warning code from the `ui-behaviour.md` table. The trigger belongs to the
engine; the wording belongs here.

## The failure these prevent

A user scrolling past a blocking warning to reach a number has been failed by the layout.
A refusal rendered as a small note beside a figure is not a refusal — the figure is what
they will act on.

So: refusals **replace**, warnings sit **above**, and neither collapses.

## Do not

- Put warnings below the result, or behind a disclosure
- Render a refusal alongside a number
- Use a toast for anything — it disappears
- Use a tooltip as the only carrier for a citation — unreachable on touch
- Default the year selector from the system clock

## Acceptance

- Visual test: a refusal renders **no figure anywhere** on the page
- Warnings appear above the result in DOM order, not just visually — check with CSS disabled
- Refusal announced by `role="alert"`; result updates announced politely
- `YearSelector` with no prior choice renders nothing selected
- A `proposed`-status year shows the not-yet-law badge
- Axe clean

## Report

Confirmation of the DOM-order check with CSS disabled, and the no-figure-on-refusal check.
