---
id: P14
title: Guidance pages from the research documents
status: done
depends: [P13]
agent: ui-builder
---

# P14 — Guidance pages

## Read first

- [`../research/`](../research/) — the source material
- [`../personas/`](../personas/) — who each page is for
- [`../spec/ui-behaviour.md`](../spec/ui-behaviour.md) — "Guidance pages"

## Task

Static pages, zero JavaScript, one per topic:

| Route | From |
|---|---|
| `/guides/foreign-currency-income` | research 05 + persona p1 |
| `/guides/employer-not-deducting` | research 06 + persona p2 |
| `/guides/filing-your-return` | research 11 |
| `/guides/deadlines` | research 10 |
| `/guides/capital-gains` | research 08 + persona p4 |

These are the entry point from search, so **each opens by answering the question the
reader arrived with** — "is my foreign income taxed?" — before explaining the mechanism.
A page that starts with statutory background loses the reader who needed one sentence.

Translate the research into plain language **without dropping the citations**. Where the
research says a point is unresolved, the page says so too — in the reader's terms, not as
a "Q11" reference they cannot look up.

## Do not

- Restate a figure that the research marks unverified as though it were settled
- Drop citations in the name of readability. They become links, not footnotes.
- Add advice. Describing the law is the whole permitted scope.
- Let a page contradict its research document — the research is the source of truth

## Acceptance

- Zero JavaScript in the built output
- Every figure carries a citation link that resolves to the sources page
- Every unverified figure carries its badge and a plain-language caveat
- `node scripts/check-citations.mjs` still passes
- Reading level check: the opening paragraph of each page answers the title question
- Lighthouse accessibility ≥ 95 on each page

## Report

For each page: the question it opens by answering, and the unresolved points it discloses.
