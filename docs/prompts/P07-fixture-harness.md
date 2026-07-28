---
id: P07
title: Fixture harness — worked examples become the test suite
status: in-progress
depends: [P06]
agent: engine-builder
---

# P07 — Fixture harness

## Read first

- [`../worked-examples/README.md`](../worked-examples/README.md) — the fixture format
- [`../spec/calculation-engine.md`](../spec/calculation-engine.md) — required coverage

## Task

A harness that reads every `docs/worked-examples/*.md`, parses the YAML front matter, runs
the engine, and asserts **field by field** against `expected`.

Asserting only `taxPayable` lets two compensating errors pass. Assert the partition, the
deduction, each component, the band breakdown, the credits and the schedule.

Then write the worked examples themselves, using the `tax-worked-example` agent, for the
coverage the spec requires:

- Below the relief threshold — zero tax
- Each ladder band boundary, just below and just above
- Foreign income remitted vs not remitted — the contrast pair
- **Mixed capped and uncapped — asserts a refusal, not a number**
- Relief applied once across two heads
- Capital gain plus ordinary income — relief does not touch the gain
- Terminal benefit on each table, plus the service-length boundary
- Credits exceeding gross tax
- Instalment schedule where the estimate differs from the liability

## Fixtures with unverified rates

Several data values carry `verified: false`. A fixture depending on one must set
`verified: false` in its own front matter, and the runner must **report those separately**
so they cannot be mistaken for a green suite.

A fixture that asserts a number derived from a known-superseded rate is not a passing
test; it is a wrong answer with a tick next to it.

## Do not

- Write a fixture for the mixed-capped case that contains a figure. It asserts a refusal.
- Adjust a fixture to make the engine pass. If they disagree, one of them is wrong and you
  must work out which — silently editing the expectation is how a wrong engine ships.

## Acceptance

- Every worked example parses and runs
- `npm run test` reports verified and unverified fixtures **separately**, with counts
- Deliberately breaking one engine step fails at least one fixture — a suite that passes
  with a broken engine is not a suite
- Coverage list above is complete, or the gaps are named in the report

## Report

The fixture inventory, the verified/unverified split, and which engine step each fixture
would catch if it broke.
