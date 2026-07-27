# 07 — Withholding, advance income tax, and credits

> **Status:** unverified — research brief, not findings
> **Sources:** none held
> **Last reviewed:** 2026-07-27

## What this document must establish

What tax is taken at source before the taxpayer sees the money, and how it is claimed
back as a credit on the return.

## Why self-filers get this wrong

Two recurring errors, both worth designing against:

**Double counting.** A bank certificate shows gross interest and tax withheld. A taxpayer
enters the net figure as income and also claims the withheld tax as a credit — relieving
the same tax twice. The input labels must make gross-versus-net unambiguous.

**Forgetting the credit entirely.** Tax withheld on interest, dividends and service fees
is real tax already paid. A taxpayer who omits it pays twice. This is the more common
error and it costs the taxpayer money, which makes surfacing it a genuine service.

## Questions to answer

**Rates and thresholds**

1. WHT/AIT on interest — rate, and whether any exemption or threshold applies.
2. Dividends — rate, and whether it is final or creditable.
3. Rent — rate and threshold.
4. **Service fees paid to resident individuals** — rate and the monthly threshold.
   **Sources disagree on the threshold (Q18) and this is the designated first test of the
   verification loop.** Relevant to any consultant with local as well as overseas clients.
5. Whether rates differ for residents and non-residents.

**Mechanics**

6. Who must withhold, and what certificate must be issued.
7. Is AIT on interest automatic, or does it depend on the taxpayer's declaration to the
   bank?
8. Whether any withholding is **final** — meaning the income is excluded from the return
   entirely rather than reported with a credit. Getting this wrong in either direction
   misstates the return.

**Credits**

9. The statutory order in which credits are applied.
10. **Is excess credit refundable, or carried forward, or lost?** (Q20.) This matters for
    a taxpayer with substantial withheld tax and low taxable income — a real pattern for
    someone living off interest income.
11. What evidence must accompany a credit claim.
12. Foreign tax credit: availability, limit, and interaction with the reduced rate on
    foreign income (see [`05-foreign-currency-service-income.md`](05-foreign-currency-service-income.md)).

## What the calculator needs from this

- Investment income inputs labelled explicitly gross or net, matching what appears on the
  certificates users will be reading from
- Separate credit inputs per type, itemised in the result so a user can check each
  against its certificate
- Explicit handling of excess credit — surfaced, not silently floored to zero
- Any final-withholding income excluded from the return rather than reported

## Where to look

IRA 2017 — the withholding provisions, the credit provisions, and the schedules of rates.
Current IRD WHT/AIT circular or notice, which is what will settle Q18. Amendment acts for
rate changes.

## Open questions

Q15–Q20 in [`12-open-questions.md`](12-open-questions.md). Q18 is a live conflict.
