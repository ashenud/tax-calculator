---
description: Generate a fully computed, cited worked example and test fixture
argument-hint: <scenario, e.g. "consultant, 8M foreign income, remitted, Y/A 2025/26">
---

Produce a worked example for: **$ARGUMENTS**

Use the `tax-worked-example` subagent.

Before dispatching, confirm the tax data file for the year of assessment exists and that
the rate schedules it needs are not `unverified`. If they are, the example may still be
written — but it must carry a prominent warning at the top and an entry in
`docs/research/12-open-questions.md`, because a fixture built on an unverified rate will
silently enshrine a wrong answer as the expected result.

Ask for the **contrast pair** where the scenario involves a conditional rule. Foreign
currency income is the standing example: the same income remitted through a licensed
bank versus not remitted produces materially different liability, and an example showing
only the favourable path teaches the reader nothing about the condition they have to
satisfy. Band boundaries and employer-deducted-versus-not are worth pairing too.

When it reports back, check before accepting:

- Band-by-band tax sums to the stated total
- Taxable income actually falls within the bands charged
- Instalments sum correctly against the annual liability
- Personal relief applied exactly once, and after aggregating assessable income
- Front matter parses as YAML and matches `docs/worked-examples/README.md`
- Integer rupees throughout — no floats, no thousands separators in front matter

These become test fixtures verbatim. An arithmetic slip here does not produce a flawed
document; it produces a test that permanently asserts the wrong answer.
