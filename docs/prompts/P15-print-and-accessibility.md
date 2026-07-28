---
id: P15
title: Print stylesheet and full accessibility audit
status: pending
depends: [P12, P14]
agent: ui-builder
---

# P15 — Print and accessibility

## Read first

- [`../spec/ui-design-system.md`](../spec/ui-design-system.md) — accessibility targets, print
- [`../spec/ui-behaviour.md`](../spec/ui-behaviour.md) — keyboard and screen reader

## Task

**Print stylesheet.** A real requirement: people take a printout to their practitioner.

Drops navigation, the year selector, and inputs-as-controls. **Keeps** entered values as
text, the full working with citations, the payment schedule, **the disclaimer and the
as-at stamp**. Avoid page breaks inside the working table.

A printed result without its provenance is precisely the artefact ADR-0003 exists to
prevent — it is the form in which a wrong number travels furthest.

**Accessibility audit** across the whole site, to WCAG 2.2 AA as a floor:

- Automated: axe on every route, at 320px and 1440px, in **both themes**
- Manual: full keyboard traversal of the calculator; screen-reader pass over the result
  panel including a refusal; contrast spot-checks
- `prefers-reduced-motion`; zoom to 200% without horizontal scroll; forced-colors mode

## Do not

- Print a figure without its as-at stamp or the disclaimer
- Fix a contrast failure by lowering the target
- Suppress an axe rule to make the report clean

## Acceptance

- Print preview of a completed result: disclaimer and as-at stamp present, working intact,
  no clipped columns
- Print preview of a **refused** result: shows the refusal, no figure
- Axe: zero violations across all routes, both themes, both widths
- Keyboard-only completion of a full calculation, start to result
- Screen reader announces: result updates politely, refusals assertively
- 200% zoom with no horizontal scroll at 320px

## Report

The axe summary per route, the manual checklist with outcomes, and both print previews
described.
