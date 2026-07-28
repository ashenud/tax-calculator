---
id: P12
title: Result panel — refusals, warnings, the figure, the working, the schedule
status: pending
depends: [P11]
agent: ui-builder
---

# P12 — Result panel

## Read first

- [`../spec/ui-behaviour.md`](../spec/ui-behaviour.md) — "Result", and the order is normative
- [`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md)

## Task

Render `TaxResult`, in this order, top to bottom:

1. **Refusals** — replacing the figure entirely
2. **Warnings** — expanded
3. **The figure**, with `AsAtStamp` beside it
4. **The working** — every pipeline step: partition, deduction, each component, band
   breakdown, credits. Each rate carries its `CitationRef`.
5. **Payment schedule** — instalment dates and amounts, final payment, return due date
6. **What next** — TIN, e-filing, verify-before-filing

Sticky on desktop above 1024px. On mobile, a summary bar showing the figure, a "see
working" affordance, and — critically — **a blocking-warning indicator**, since the full
panel is off-screen.

The working is a real `<table>` with scoped headers. Every figure uses tabular numerals so
columns align; a working a user cannot scan is a working they cannot check.

## Do not

- Lead with the figure
- Animate or count up the number
- Compute anything here. Every value comes from `TaxResult`; a subtotal computed in the
  component is a subtotal no fixture covers.
- Let the mobile summary bar hide a blocking warning

## Acceptance

- DOM order matches the list above — verified with CSS disabled
- A refused result renders **no figure anywhere** on the page
- Every displayed rate has a citation link that resolves
- Result updates announced `aria-live="polite"`; refusals `role="alert"`
- Mobile summary bar surfaces a blocking warning indicator
- `prefers-reduced-motion` honoured; the figure never animates regardless
- Axe clean at 320px and 1440px

## Report

The CSS-disabled DOM order check, and confirmation that no component computes a value.
