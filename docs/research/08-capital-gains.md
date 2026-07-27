# 08 — Capital gains

> **Status:** unverified — research brief, not findings
> **Sources:** none held
> **Last reviewed:** 2026-07-27

## What this document must establish

How gains on the realisation of investment assets are taxed for individuals: what counts
as an investment asset, how the gain is computed, at what rate, and when it must be paid.

## Why it is in scope

It is outside the two priority personas, but it catches people who otherwise have simple
affairs — someone who sells an inherited property or a parcel of shares has a one-off
obligation, often with its own short payment deadline, and no reason to have known about
it. That is the same shape of problem as the rest of this project.

## Questions to answer

**Scope**

1. What is an "investment asset"? Reproduce the definition.
2. What is excluded — principal residence, personal assets below a threshold, particular
   classes of shares?
3. What constitutes a "realisation"? Sale is obvious; gift, transfer on death, transfer
   between relatives, and change of use may also trigger it.

**Computation**

4. How is the gain computed — proceeds less cost of acquisition and improvement, less
   incidental costs?
5. Is there any indexation or rebasing for assets held a long time? For assets acquired
   before the act commenced, what is the deemed base cost?
6. How are losses treated — offset against other gains, carried forward, or lost?
7. Valuation where there is no arm's-length price.

**Rate and payment**

8. The rate, and whether it is flat or banded.
9. Whether the gain is added to taxable income or taxed separately. This matters
   structurally: if separate, it is its own rate schedule in the data model rather than
   another head of income.
10. **The payment deadline.** Capital gains commonly carry a short deadline running from
    the realisation, separate from the annual cycle — if so, that is the most useful fact
    this document produces.
11. Whether it is reported on the annual return, a separate return, or both.

## What the calculator needs from this

- A separate capital gains flow rather than another income input, if the tax is computed
  separately
- The realisation-date payment deadline surfaced prominently, since missing it is the
  usual failure
- A base-cost input that handles inherited and long-held assets

## Where to look

IRA 2017 — the capital gains provisions and the definition of investment asset; the
relevant schedule for the rate. Amendment acts for rate changes. IRD guidance on the
separate return and payment mechanism.

## Open questions

Q31 in [`12-open-questions.md`](12-open-questions.md).
