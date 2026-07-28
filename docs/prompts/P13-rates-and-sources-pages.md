---
id: P13
title: Rates pages, sources register and changelog — generated from data
status: pending
depends: [P09, P03]
agent: ui-builder
---

# P13 — Rates, sources, changelog

## Read first

- [`../spec/site-architecture.md`](../spec/site-architecture.md) — routes
- [`../sources/README.md`](../sources/README.md) — the register these pages render

## Task

**`/rates/[year]`** — one static page per year of assessment, generated from the data
file. Every figure with its citation and its `verified` state. Zero JavaScript.

This is what lets a sceptical reader check the tool without running it. Because it renders
the same data the engine consumes, the published tables and the computation **cannot
disagree** — which is the point, and is why this must not be hand-written content.

**`/about/sources`** — the provenance register: each document, its status, its SHA-256
prefix, and what is still missing. Include the "still missing" section; a user deciding
whether to trust a figure benefits more from knowing what is absent than from any
reassurance.

**`/about/changelog`** — what changed, when, and under which instrument, derived from the
data files' `sources` and `lastReviewed`.

## Do not

- Hand-write a rate table. Generate it.
- Omit `verified: false` markers to make the page look tidier
- Hide the missing-sources list

## Acceptance

- A page exists for every file in `data/tax-years/`, with no route hardcoded
- Changing a rate in a data file changes the rendered page with no code change
- Every figure shows a citation; every unverified figure shows its badge
- Zero JavaScript in the built output for all three pages
- Links to `docs/sources/` documents resolve

## Report

Confirmation of the change-data-see-page check, and the zero-JS check.
