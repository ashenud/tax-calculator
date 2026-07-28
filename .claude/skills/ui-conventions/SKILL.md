---
name: ui-conventions
description: Interface conventions for this repo — the ADR-0003 display invariants, token discipline, money-input rules, state definitions and accessibility floors. Load before building or changing any component or page.
---

# UI conventions

## Who this is for

Someone working out what they owe the Inland Revenue Department. Often their first time.
Often anxious. Frequently on a phone with a poor connection, and frequently without an
employer's payroll function or a practitioner standing between them and a mistake.

Design for that person, not for a portfolio screenshot.

## The invariants

From [ADR-0003](../../../docs/decisions/adr-0003-disclaimer-and-liability-posture.md).
These are content. They are not chrome, and they are not candidates for a cleanup pass.

| | |
|---|---|
| Disclaimer | Base layout, every page, not dismissible, not a footer link |
| As-at stamp | **Beside every computed figure** — screenshots are how figures travel |
| Warnings | **Above** the result, expanded, never collapsed |
| Refusals | **Replace** the figure entirely |
| Citations | On every displayed rate |
| Year of assessment | Always explicit, never defaulted from the clock |

A layout improvement that requires weakening any of these is rejected. Changing them takes
a superseding ADR.

## Token discipline

No component hardcodes a colour or a size. Everything resolves to a `@theme` token, so a
theme change is one file rather than a search-and-replace across components.

Semantic names only: `--color-danger`, not `--color-red`. The former survives a palette
change.

## Money

- `inputmode="numeric"`, never `type="number"` — spinners and scroll-to-change silently
  alter a declared figure
- Separators shown while typing, stripped on parse
- **Integer rupees leave the component.** Formatting never re-enters the model.
- **Empty is `null`, not `0`.** An untouched field has not been declared as nil, and
  showing `Rs. 0` implies a computation that did not happen.
- Decimals rejected with an explanation, never silently rounded
- `font-variant-numeric: tabular-nums` on every figure — a working whose columns do not
  align is a working nobody can check

## The UI never computes

Every displayed value comes from `TaxResult`. A subtotal computed in a component is
covered by no fixture and will drift from the engine without anyone noticing.

## States

Every interactive surface specifies: empty, valid, invalid, disabled, focus, hover — and
where applicable refused, and unverified-data.

Validate **on blur, not on keystroke**. Telling someone their half-typed number is wrong
is hostile.

## Accessibility floor

WCAG 2.2 AA, in **both** themes:

- Contrast ≥ 4.5:1 body, ≥ 3:1 UI boundaries
- Visible focus ring, never removed
- Touch targets ≥ 44×44px
- Real `<label>`s; placeholders are never labels
- Results announced `aria-live="polite"`; refusals `role="alert"`
- Full keyboard operation; logical heading order; skip link
- `prefers-reduced-motion` honoured
- Colour never carries meaning alone

Never fix a contrast failure by lowering the target. Never suppress an axe rule to clean a
report.

## Motion

150ms state changes, 250ms panel entry, ease-out. **The tax figure never animates.** A
number counting up is charming in marketing and corrosive to trust in a tax result.

## Prohibited

- Collapsing a warning, refusal or the disclaimer behind a disclosure
- A toast as the only carrier for a warning — it disappears
- A tooltip as the only carrier for a citation — unreachable on touch
- Hardcoding a condition question instead of rendering `taxYear.conditions`
- Any "optimise my tax" affordance
- Styling output to resemble an official IRD form
- A dashboard presenting a total without the working
