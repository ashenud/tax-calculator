# 07 — Withholding, advance income tax, and credits

> **Status:** partial — AIT on interest verified; the rest blocked by a gap in the amendment chain
> **Sources:** ir-act-24-2017.pdf, ir-amendment-act-2-2025.pdf, pn-it-2025-01.pdf
> **Last reviewed:** 2026-07-28

## Read this before citing any withholding rate

**The First Schedule has been re-lettered since 2017, by an amendment this repository
does not hold.**

The evidence: Act 2/2025 repeals and substitutes First Schedule **¶10(1)(d)(ii)** to set
interest or discount at 10% [Act 2/2025 s.3]. In the 2017 base act, the rate on interest
or discount sits at **¶10(1)(b)(i)** [IRA First Schedule, para 10(1)(b)(i) as enacted].
Those are different items. An amendment between 2018 and 2024 renumbered the paragraph.

Consequently **every citation to the base act's First Schedule lettering in this document
is to the 2017 text, and may no longer point at the right item.** Rates taken from it are
historical unless separately confirmed. Closing this requires the amendment acts of
2018–2024 — see [`../sources/README.md`](../sources/README.md).

## Verified

**Interest or discount paid: 10%** [Act 2/2025 s.3, First Schedule para 10(1)(d)(ii)],
with effect from 1 April 2025 [PN/IT/2025-01, para 2.3].

This replaced the earlier rate: the 2017 text had 5% [IRA Sch.1 para 10(1)(b)(i), 2017]
for interest or discount paid to a person other than a senior citizen with a bank deposit
account.

PN/IT/2025-01 states that APIT tables and withholding tax circulars "will be issued in
due course" [PN/IT/2025-01, para 2.3]. **Until that circular is held, the current
withholding position beyond interest cannot be established.**

## The finding that matters most: what s.85 actually covers

Secondary sources describe s.85 as a general 5% withholding (unverified gloss) on service
fees paid to resident individuals above a monthly threshold. **The provision is nothing of
the sort.**

s.85(1)(a) applies where a person pays a service fee with a source in Sri Lanka to a
resident individual who is **not an employee of the payer**, and only for these purposes
[IRA s.85(1)(a)]:

- teaching, lecturing, examining, invigilating or supervising an examination
- as a commission or brokerage to a resident insurance, sales or canvassing agent
- as an endorsement fee
- in relation to the supply of any article on a contract basis through tender or quotation
- **for such other matters as may be prescribed by regulation** [IRA s.85(1)(a)(v)]

It is an enumerated list, not a general charge. **A consultant invoicing a Sri Lankan
client for professional services is very likely outside s.85(1)(a) altogether**, unless
brought in by a regulation under (a)(v) — and the regulations are not held. That is
recorded as Q37.

Two further limits worth knowing:

- s.85 does **not** apply to payments made by individuals, unless made in conducting a
  business [IRA s.85(3)(b)]. A private individual paying a freelancer withholds nothing.
- s.85(1)(b) covers service fees and insurance premiums paid to **non-resident** persons,
  at a different rate [IRA s.85(1)(b)].

### The threshold — Q18, and why it is still open

For the enumerated s.85(1)(a) fees, the 2017 text sets the rate and threshold at
5% on amounts exceeding Rs. 50,000 per month [IRA Sch.1 para 10(1)(c)(i), 2017].

Two other thresholds circulated in this project before verification, taken from
secondary sources that disagreed with each other. **Neither appears anywhere in the Act.**
The values themselves are kept in the register rather than repeated here — see Q18 in
[`12-open-questions.md`](12-open-questions.md).

Nor can the Rs. 50,000 figure [IRA Sch.1 para 10(1)(c)(i), 2017] be relied on for
Y/A 2025/2026, for the re-lettering reason above. See Q18 and Q19.

## What this document must still establish

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

1. ~~WHT/AIT on interest~~ — **verified above** [Act 2/2025 s.3, First Schedule para
   10(1)(d)(ii)]. Still open: whether any exemption or threshold applies, and the separate
   senior-citizen treatment the 2017 text provided for
   [IRA First Schedule, para 10(1)(b)(ii) as enacted].
2. Dividends — rate, and whether it is final or creditable.
3. Rent — rate and threshold. The 2017 text had 10% [IRA Sch.1 para 10(1)(b)(iii), 2017]
   for rent paid to a resident person; unconfirmed for Y/A 2025/26.
4. **Service fees** — the enumerated s.85(1)(a) scope is established above. Still open:
   the current rate and threshold, and whether any regulation under s.85(1)(a)(v) brings
   ordinary consultancy fees into charge (Q37). Both need the WHT circular.
5. Whether rates differ for residents and non-residents. For s.85(1)(b) non-resident
   service fees and insurance premiums the 2017 text had 14% [IRA Sch.1 para 10(1)(c)(ii)–(iii), 2017].
   Unconfirmed for Y/A 2025/26.

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

Q16, Q17, Q20 in [`12-open-questions.md`](12-open-questions.md). Q15 is verified. Q18 and
Q19 are resolved against the 2017 text but remain open for Y/A 2025/2026 because of the
re-lettering gap. Q36–Q38 record the s.85 scope findings.
