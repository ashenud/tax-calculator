# P4 — Investment income, capital gains and terminal benefits

> **Status:** unverified — the tax treatment below is provisional
> **Related research:** [`../research/07-wht-ait-and-credits.md`](../research/07-wht-ait-and-credits.md), [`../research/08-capital-gains.md`](../research/08-capital-gains.md), [`../research/09-terminal-benefits.md`](../research/09-terminal-benefits.md)

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
