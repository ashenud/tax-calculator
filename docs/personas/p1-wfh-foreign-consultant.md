# P1 — Work-from-home consultant paid in foreign currency

> **Status:** unverified — the tax treatment below is provisional
> **Related research:** [`../research/05-foreign-currency-service-income.md`](../research/05-foreign-currency-service-income.md)
> **Priority:** highest

## The person

Nirmala works from home in Colombo as a software consultant. Her clients are in Australia
and the UK; she has none in Sri Lanka. She invoices in USD and the money arrives in her
account here — some months through her bank, some months into a Wise balance she draws
down when the rate looks good.

She has no employer, so nothing is deducted at source. For several years she understood
this income to be exempt and filed nothing. She has heard that changed in 2025 and does
not know what it means for her.

She has never dealt with the IRD. She does not have a tax practitioner and would rather
not pay for one.

## Why she is underserved

Every consumer calculator she can find asks for a monthly salary and applies the standard
ladder. None of them ask the question that actually determines her liability: **how her
money reached Sri Lanka.**

If the reduced-rate regime applies, her liability is materially lower than the standard
ladder would produce. If it does not — because her earnings sat offshore, or because the
Wise route breaks the chain — she owes considerably more. Same gross income, different
answer, and nothing in her experience tells her the question exists.

## What is uncertain

Nearly all of it. The regime and its conditions are unverified —
[`../research/12-open-questions.md`](../research/12-open-questions.md) Q4–Q13. Specifically
unresolved and directly affecting her:

- Whether personal relief applies against this income at all (Q6)
- The exact wording of the remittance condition (Q8)
- Whether **partial** remittance qualifies partially or fails entirely (Q11) — this is her
  actual situation
- Whether a Wise or Payoneer balance settling into a local bank satisfies the condition
- Whether a foreign-currency account held at a Sri Lankan bank counts (Q13)
- Which exchange rate converts her USD invoices, and at what date

Until these are settled from primary sources, the tool must not give her a figure it
presents as reliable.

## Decision path

```
Resident in Sri Lanka for the Y/A?
├─ no  → different treatment; out of scope for this persona
└─ yes → Income is service export / foreign source?
         ├─ no  → normal ladder (persona p3 territory if mixed)
         └─ yes → Were the earnings remitted to Sri Lanka through a licensed bank?
                  ├─ yes    → reduced schedule
                  ├─ no     → normal ladder — materially more tax
                  └─ partly → UNRESOLVED (Q11). Refuse; do not guess.
```

The `partly` branch is not an edge case. It is the common pattern for this population,
and the tool refusing it honestly is better than the tool picking a reading — see
[`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md).

## What the calculator must ask her

Phrased in terms of what actually happened to her money, not in statutory language:

1. Year of assessment — explicit, never inferred from today's date
2. Were you resident in Sri Lanka for that year?
3. Total invoiced to overseas clients, in the currency invoiced
4. **How did the money reach you?** Offer the real options, not a yes/no:
   - Direct transfer into a Sri Lankan bank account
   - Into a foreign-currency account at a Sri Lankan bank
   - Via Wise / Payoneer / PayPal, then withdrawn to a Sri Lankan bank
   - Held in an overseas account
   - A mixture — and how much by each route
5. Any income from Sri Lankan clients? (routes to p3)
6. Business expenses — home office share, equipment, internet, software, bank charges on
   inward remittances
7. Any tax withheld overseas?
8. Any qualifying payments?
9. Whether she has a TIN and has filed before

Question 4 is the one that distinguishes this tool. It must not be reduced to "did you
remit through a bank?" — she would not know how to answer that, and a wrong answer is
worse than no tool.

## What she needs told, beyond the number

- That her instalment obligations run through the year, not just at filing time
- Which dates she has already missed, if she is filing late, and what that implies
- What evidence of remittance she should be keeping from now on
- That she needs a TIN before she can do anything else
- That she should verify with IRD or a practitioner — she has no employer's payroll
  function standing between her and a mistake

## What the tool must not do

Tell her to route her payments differently to reduce her tax. That is advice, and this
project does not give it — see rule 6 in [`../../CLAUDE.md`](../../CLAUDE.md). Describing
what the law provides is the whole permitted scope; she can draw her own conclusions.

## Worked examples needed

- Remitted in full through a bank
- Same gross, held offshore — the contrast that shows what the condition is worth
- Mixed routes — blocked on Q11
- With overseas tax withheld, testing foreign tax credit
