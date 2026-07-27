# 02 — Assessable income

> **Status:** unverified — research brief, not findings
> **Sources:** none held
> **Last reviewed:** 2026-07-27

## What this document must establish

What counts as income under each head, and what may be deducted in arriving at the
assessable amount for that head. This determines the questions the calculator asks — a
head the tool doesn't model is income a user will silently omit from their return.

## The heads

Working list, to be confirmed against the act's own terminology:

| Head | Typical content |
|---|---|
| Employment | Salary, wages, allowances, benefits in kind, terminal benefits (separately taxed) |
| Business | Trade, profession, vocation — including freelance and consultancy |
| Investment | Interest, dividends, rent, royalties |
| Other | Residual — windfalls, certain one-off receipts |

## Questions to answer

**Employment**

1. What is included beyond cash salary — which allowances and benefits, and how are
   benefits in kind valued?
2. What is excluded or exempt?
3. Are there deductions available against employment income, or is it taxed gross?

**Business — the persona-critical head**

4. Where does freelance and consultancy income sit? Is a solo consultant carrying on a
   "business" for these purposes, or is there a separate profession/vocation treatment?
5. What expenses are deductible for a person working from home? Specifically: a share of
   rent and utilities, equipment and depreciation, internet, software subscriptions,
   professional indemnity, bank charges on inward remittances, currency conversion
   losses.
6. What records must be kept, and is there any simplified or presumptive basis for small
   businesses?
7. Cash basis or accruals — and does a taxpayer have a choice?
8. **Which exchange rate converts foreign-currency receipts to rupees**, and at what
   date? This materially changes the assessable amount for the primary persona and is
   the sort of detail no consumer calculator handles.
9. Loss treatment: can a business loss be set against other heads, and can it be carried
   forward?

**Investment**

10. Whether investment income is assessed gross or net of the tax withheld on it — this
    is the usual source of double-counting when a taxpayer enters figures from a bank
    certificate.
11. Deductions available against rental income.

**Other**

12. What actually falls here in practice for individuals.

## What the calculator needs from this

- An input form per head that does not silently omit a category
- A deductions list for the home-working consultant, since expense deductibility is where
  that persona's assessable income is actually determined
- A defensible exchange-rate rule, stated in the UI rather than assumed
- Clarity on gross-vs-net entry for investment income, with the input labelled
  accordingly

## Where to look

IRA 2017 — the provisions defining each head and its deductions, plus the general
deduction and disallowance provisions. Amendment acts for changes to deductibility. The
IIT return form is worth reading directly: its schedules show what IRD expects to be
reported under each head.

## Open questions

None specific yet. Q33 (surviving qualifying payments) is adjacent and sits in
[`03-reliefs-and-qualifying-payments.md`](03-reliefs-and-qualifying-payments.md).
