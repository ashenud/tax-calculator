# P4 — Investment income, capital gains and terminal benefits

> **Status:** partial — the frameworks are verified; the rates are stale or superseded
> **Related research:** [`../research/07-wht-ait-and-credits.md`](../research/07-wht-ait-and-credits.md), [`../research/08-capital-gains.md`](../research/08-capital-gains.md), [`../research/09-terminal-benefits.md`](../research/09-terminal-benefits.md)

## What the sweep established

Three findings change what this persona needs to be asked.

**Priya's house may not be exempt.** The principal-residence exclusion is conditional: the
property must have been owned continuously for the three years before disposal **and**
lived in for at least two of those three years, counted daily
[IRA s.195, definition of "investment asset"]. An inherited house she never lived in is
squarely inside the charge. The calculator must ask about occupancy, not assume that "my
home" means exempt — and the base cost of a pre-commencement asset is its market value at
30 September 2017 [IRA transitional provisions], not what anyone paid for it.

**Relief does not shelter a gain.** Personal relief "is not available to be deducted
against gains from the realisation of investment assets"
[IRA Sch.5 para 2(a), as enacted 2017]. So the gain is taxed on its own footing; it cannot
be pooled with other income and covered by the relief.

**Mohamed's length of service is a required input.** The terminal benefit tables are keyed
to whether the period of contribution or employment exceeds twenty years, and the
longer-service table is far more generous [IRA Sch.1 para 1(2)(b), as enacted 2017]. Also:
his payment qualifies for the flat tables only if it falls within the listed categories —
compensation for loss of office counts only under a scheme the Commissioner-General
considers uniformly applicable to all employees [IRA Sch.1 para 1(3)(c), as enacted 2017],
so an individually negotiated exit package may not qualify at all.

## What is stale or superseded

**The capital gains rate is out of date.** It has been changed by the Inland Revenue
(Amendment) Act, No. 11 of 2026, which this repository does not hold — see Q42 in
[`../research/12-open-questions.md`](../research/12-open-questions.md). Priya cannot be
given a figure at all until that act is obtained.

The terminal benefit tables and the withholding rates on interest, dividends and rent are
2017 text and have very likely moved. This persona is the **least buildable** of the four
until the missing amendment acts land.

## The people

Three related situations, grouped because they share a shape: a taxpayer with otherwise
simple affairs meets a one-off or passive obligation they had no reason to know about.

**Sunil, retired.** Lives on fixed deposit interest and a small rental. His bank withholds
tax on the interest and gives him a certificate he files away. He does not know whether
he must file a return, or whether the withheld tax is the end of the matter.

**Priya, sold an inherited house.** One transaction, one gain, and a payment deadline
running from the sale rather than from the end of the year. She learned this existed
after the sale completed.

**Mohamed, made redundant after nineteen years.** Received a gratuity and compensation in
one payment. His employer deducted something. He does not know whether it was right, or
whether he now owes more.

## Why they are underserved

Each has a specific misconception that costs them money:

- **Sunil** may be paying twice, or may be entitled to a refund. If tax was withheld at a
  rate above his effective rate — quite possible with relief and a modest income — he is
  owed money he will never claim. The opposite error, entering net interest *and* claiming
  the credit, relieves the same tax twice.
- **Priya** has probably missed a deadline that ran from her sale date, not the year end.
- **Mohamed** may have been over-deducted if his gratuity was taxed as ordinary
  employment income rather than on the separate terminal-benefit tables — which would push
  nineteen years of accrued entitlement through the top band in one go.

## What is uncertain

Substantially everything — Q15–Q20, Q31, Q32 in
[`../research/12-open-questions.md`](../research/12-open-questions.md). Notably:

- Whether any withholding is **final**, meaning the income is excluded from the return
  entirely rather than reported with a credit (Sunil's whole question)
- Whether excess credit is refundable, carried forward, or lost (Q20 — decides whether
  Sunil is owed money)
- The capital gains rate, base cost rules for inherited assets, and the payment deadline
- The terminal benefit tables and whether relief interacts with them

## Decision paths

```
Investment income
└─ tax withheld at source?
   ├─ withholding final?  → exclude from return entirely
   └─ creditable?         → report gross, claim the credit
                            └─ credit > liability? → refund / carry forward / lost (Q20)
```

```
Realisation of an investment asset
└─ within scope?  → compute gain from base cost
                    └─ payment deadline runs from the realisation (Q31)
```

```
Terminal benefit received
└─ separate tables — never aggregated into employment income
   └─ employer deducted?  → check against the tables; over-deduction is common
```

## What the calculator must ask

**Investment income**

1. Year of assessment
2. Interest — **gross**, and tax withheld, entered separately. The input labels must match
   the wording on the bank certificate the user is reading from, because the gross/net
   confusion is where this goes wrong.
3. Dividends — gross and tax withheld
4. Rental income, and deductible expenses against it
5. Any other income, and whether relief has been used elsewhere

**Capital gains**

6. What was sold and when — the date drives the deadline
7. Proceeds, acquisition cost or inherited base cost, improvement and incidental costs
8. Whether it was a principal residence

**Terminal benefits**

9. Amount received, and its components — gratuity, compensation, fund payments
10. Years of service
11. Tax deducted by the employer
12. Whether any earlier terminal benefit has been received, if a cumulative limit exists

## What they need told

- Sunil: whether he must file at all, and whether he is owed a refund
- Priya: her deadline, immediately and prominently, before any computed figure
- Mohamed: whether the employer's deduction looks right, and that terminal benefits are
  taxed separately from salary

## Worked examples needed

- Interest with tax withheld, credit fully absorbed
- Interest with tax withheld exceeding the liability — the refund question
- Rental income net of expenses
- Capital gain on an inherited property
- Terminal benefit on the separate tables, contrasted with the same sum taxed as ordinary
  employment income — showing what the separate treatment is worth
