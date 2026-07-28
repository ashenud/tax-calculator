# 08 — Capital gains

> **Status:** partial — the 2017 framework is verified, but the **rate is known to be superseded**
> **Sources:** ir-act-24-2017.pdf
> **Last reviewed:** 2026-07-28

## Read this first: the rate in this document is out of date

Everything below is the position under the Inland Revenue Act as enacted in 2017. The
individual capital gains rate **has since been changed** by the Inland Revenue
(Amendment) Act, No. 11 of 2026 — an act this repository **does not hold**. See
[`12-open-questions.md`](12-open-questions.md) Q42 and
[`../sources/README.md`](../sources/README.md).

Do not build a capital gains calculator from this document. It establishes the framework —
what an investment asset is, how a gain is computed, what is excluded — which is
structurally stable. It does not establish the current rate.

## What is taxed

Gains from the **realisation of investment assets**.

### Investment asset

> "means a capital asset held as part of an investment, but excludes the principal place
> of residence of an individual, provided it has been owned by the individual continuously
> for the three years before disposal and lived in for at least two of those three years
> (calculated on a daily basis)"

[IRA s.195, definition of "investment asset"]

The principal-residence exclusion is **conditional and the conditions are strict**. Both
must hold:

- continuous ownership for the **three years before disposal**, and
- lived in for at least **two of those three years**, calculated on a **daily** basis.

A homeowner who moved out eighteen months before selling, or who bought two years ago,
does not qualify — and would very reasonably assume they did. For persona p4 this is the
single most important thing on the page, and the calculator must ask about occupancy
rather than assuming "it's my home, so it's exempt".

"Land or buildings" is defined broadly and includes structural improvements, interests in
land or buildings, and leases [IRA s.195, definition of "land or buildings"].

## Rate — superseded, recorded for the historical years

| Taxpayer | Rate on gains from realisation of investment assets |
|---|---|
| Individual | 10% [IRA Sch.1 para 1(2)(a), as enacted 2017] — **superseded, see above** |
| Partnership | 10% [IRA Sch.1 para 2, as enacted 2017] |
| Trust | 10% on such gains; other taxable income at the trust rate [IRA Sch.1 para 3(2), as enacted 2017] |

These are the 2017 figures. The First Schedule has been amended repeatedly since, and the
lettering has moved — see the re-lettering warning in
[`07-wht-ait-and-credits.md`](07-wht-ait-and-credits.md). They are recorded here as the
base position and as a starting point for reconstructing historical years once the
intervening amendment acts are held.

## Relief is not available against these gains

The Fifth Schedule provides that the personal relief

> "is not available to be deducted against gains from the realisation of investment assets"

[IRA Sch.5 para 2(a), as enacted 2017]

This is a **structural rule, not a rate**, and it is much less likely to have been
amended away than the rate itself — though it must still be confirmed against the
current Fifth Schedule.

Its effect on the engine is significant: capital gains cannot simply be added to the
income pool before relief is deducted. Relief attaches to the other income; the gain is
taxed separately at its own rate. That is a distinct computation path, not another head
of income — as anticipated in [`../spec/calculation-engine.md`](../spec/calculation-engine.md).

## Assets held before the Act commenced

Where an asset was owned before the Act's commencement, its cost is taken as

> "equal to the market value of the asset at that time"

[IRA transitional provisions], the relevant date being 30 September 2017
[IRA transitional provisions].

This matters for exactly the persona p4 case — an inherited house held for decades. The
base cost is not what was paid for it; it is its market value at that date, which usually
requires a valuation.

## Still unestablished

| | |
|---|---|
| The **current** rate | Act No. 11 of 2026 — not held (Q42) |
| The **payment deadline** on a realisation | Not located in the base act. Capital gains commonly carry a short deadline running from the realisation rather than from the year end; if so it is the most useful fact this document could carry. Q43. |
| Whether a separate return is required | Q43 |
| Loss treatment — offset against other gains, carry forward | Q44 |
| Base cost for inherited assets specifically (as distinct from pre-commencement assets) | Q45 |
| Valuation rules where there is no arm's-length price | Q45 |

## Questions to answer

1. The current rate and its commencement, from Act No. 11 of 2026.
2. The payment and filing mechanism on a realisation, and its deadline.
3. Whether the principal-residence conditions have been amended since 2017.
4. How losses on realisation are treated.
5. Acquisition cost rules for gifts, inheritances and transfers between relatives.
6. Whether motor vehicles remain outside the charge — Act No. 11 of 2026 reportedly
   changed the treatment of vehicle disposals with effect from 1 April 2024, which is
   retrospective and would affect returns already filed. Q46.

## Where to look

Act No. 11 of 2026 first — it is the current law and it changes the rate. Then the base
act's realisation and cost-of-asset provisions, and the amendment acts of 2018–2024 for
the intervening rate history.

## Open questions

Q31 (now partly answered and partly superseded), Q42–Q46 in
[`12-open-questions.md`](12-open-questions.md).
