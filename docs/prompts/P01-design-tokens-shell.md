---
id: P01
title: Design tokens, base layout, and the ADR-0003 invariants
status: pending
depends: [P00]
agent: ui-builder
---

# P01 — Design tokens and the page shell

## Read first

- [`../spec/ui-design-system.md`](../spec/ui-design-system.md) — tokens, type, spacing, colour
- [`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md) — **the invariants below come from here**

## Task

**Tokens.** Implement the `@theme` block from the design system: semantic colours, type
scale, spacing, radii. Light and dark, with `@media (prefers-color-scheme: dark)` plus a
`:root[data-theme]` override so an explicit toggle wins in both directions.

**Base layout** (`src/layouts/Base.astro`): skip link, header with year-agnostic nav,
`<main>`, footer. Sets `lang`, meta, and the theme script.

**The constrained components**, in their static form:

- `Disclaimer.astro` — in the base layout, every page, not dismissible
- `AsAtStamp.astro` — props: year of assessment, data review date
- `ThemeToggle` — a small island; the only JS on a guidance page

## Do not

- Hardcode any colour or size in a component. Everything resolves to a token.
- Make the disclaimer a footer link, a dismissible banner, or anything a user can remove.
- Add a font from a CDN. Self-host; the CSP forbids external hosts.

## Acceptance

- `npm run build` passes; guidance pages still ship zero JS except the theme toggle
- Contrast checked in **both** themes: ≥ 4.5:1 body text, ≥ 3:1 UI boundaries. State the
  measured ratios for text-on-surface and accent-on-surface in your report.
- Focus ring visible on every interactive element, keyboard only
- `prefers-reduced-motion: reduce` removes all transitions
- The disclaimer appears on a page that does not include it explicitly — proving it comes
  from the layout and cannot be omitted by forgetting

## Report

Measured contrast ratios in both themes, and confirmation of the disclaimer-by-default
check.
