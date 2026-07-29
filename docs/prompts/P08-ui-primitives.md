---
id: P08
title: UI primitives, including the currency field
status: done
depends: [P01]
agent: ui-builder
---

# P08 — UI primitives

## Read first

- [`../spec/ui-design-system.md`](../spec/ui-design-system.md) — component inventory, `CurrencyField` notes
- [`../spec/ui-behaviour.md`](../spec/ui-behaviour.md) — states and validation

## Task

The unconstrained components, on Radix primitives where one exists: `Button`, `TextField`,
`CurrencyField`, `RadioCardGroup`, `Select`, `Callout`, `Card`, `Table`, `Stepper`,
`ProgressIndicator`, `Skeleton`.

Every one specifies all of: empty, valid, invalid, disabled, focus, hover.

### `CurrencyField` — the one that matters

Money entry is where calculators lose people.

- `inputmode="numeric"`, **not** `type="number"` — spinners and scroll-to-change are
  hazards on a tax form, and a mis-scroll silently changes a declared figure
- Thousands separators shown while typing, stripped on parse
- What leaves the component is an **integer rupee value**; formatting never re-enters the model
- **Empty is `null`, not `0`.** An untouched field has not been declared as nil.
- Rejects decimals with a message explaining rupee-integer handling — never silently rounds
- `font-variant-numeric: tabular-nums`

## Do not

- Use `type="number"`
- Treat an empty field as zero anywhere in the component or its callbacks
- Use a placeholder as a label
- Hardcode a colour or size — everything is a token

## Acceptance

- Storybook-style demo page (dev only, excluded from the build) showing every component in
  every state
- `CurrencyField` tests: `"1,234,567"` → `1234567`; `""` → `null`; `"12.50"` → rejected
  with a message; paste of `"Rs. 45,000"` → `45000`
- Keyboard-only operation of every component
- Axe reports zero violations on the demo page
- Touch targets ≥ 44×44px, verified at 320px width

## Report

The `CurrencyField` parse cases, and the axe result.
