---
id: P10
title: Calculator island — persona picker, year, question groups
status: pending
depends: [P09]
agent: ui-builder
---

# P10 — The calculator

## Read first

- [`../spec/ui-behaviour.md`](../spec/ui-behaviour.md) — the primary flow
- [`../personas/`](../personas/) — each persona ends with the questions to ask

## Task

The React island: persona picker → year of assessment → question groups → result.

**Persona picker.** Four situation cards plus "none of these / not sure". The persona
chooses which question groups show, but it is a **routing convenience, not a
constraint** — every section stays reachable, because real situations overlap and a
misrouted user must not be trapped.

**Question groups**, per persona: employment, business/freelance, investment, capital
gains, terminal benefits. Progressive disclosure, one concern per section on mobile.

**Condition questions render from `taxYear.conditions`** — never hardcoded. When a future
amendment adds a condition it must appear here without a code change. That is the promise
the data model exists to keep.

State lives in the island. Nothing is persisted, nothing leaves the browser.

## Do not

- Hardcode any condition question — including the remittance one, which P11 owns
- Lock a user into their chosen persona
- Send any entered figure anywhere
- Default the year of assessment

## Acceptance

- Every persona reaches a result for its computable cases
- A user can change persona mid-flow without losing entered figures
- A user on persona p2 can still open the investment section
- Condition questions demonstrably come from data: add a condition to a test fixture and
  it appears in the UI with no code change — **this is the acceptance test that matters**
- Recomputation debounced 300ms; result announced politely
- Full keyboard operation; axe clean
- No network request carries an entered figure — verified in the network panel

## Report

The data-driven-condition test, and confirmation of the no-network check.
