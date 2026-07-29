---
id: p2-below-relief-threshold-2025-26
persona: p2
yearOfAssessment: "2025/2026"
verified: true

input:
  residency: resident
  income:
    employment:
      - label: Salary from a firm in Kandy, 12 months
        amount: 1740000

expected:
  assessableByHead: { employment: 1740000, business: 0, investment: 0, other: 0 }
  partition: { reliefEligible: 1740000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 0
  taxableGain: 0
  components:
    - kind: ladder
      amount: 0
      bands: []
      tax: 0
  grossTax: 0
  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }
  taxPayable: 0
  schedule:
    instalments: []
    finalPayment: { due: "", amount: 0 }
    returnDue: "2026-11-30"
  warnings: []
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "ira-2017#s.93(1)"
---

# P2 — salary below the personal relief threshold, Y/A 2025/2026

## Facts

Rajitha ([persona P2](../personas/p2-employee-no-apit.md)) is employed by a twelve-person
firm in Kandy and is resident in Sri Lanka. His payslip shows a deduction for EPF and no
income tax, and he has assumed that means he does not earn enough to be taxed.

For Y/A 2025/2026 (1 April 2025 – 31 March 2026) he was paid Rs. 145,000 a month for
twelve months, Rs. 1,740,000 in all. He has no other income, made no qualifying payments,
holds no employer deduction certificate because nothing was deducted, and filed no
Statement of Estimated Tax.

On these facts his assumption is correct, and this example exists to show *why* — the
relief, not the absence of a deduction, is what makes the liability nil.

## Computation

| Step | Amount | Authority |
|---|---|---|
| Employment income | 1,740,000 | — |
| Business, investment, other | 0 | — |
| **Total assessable income** | **1,740,000** | [IRA s.3, s.5] |
| Relief-eligible portion | 1,740,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less personal relief | (1,800,000) | [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| Less qualifying payments | (0) | [IRA s.52(1)] |
| **Taxable income** | **0** | [IRA s.52(1)] |

The relief and the qualifying payments are a **single deduction** of the aggregate Fifth
Schedule amount, not two successive steps [IRA s.52(1)]. There is one head of income here,
so this example does not exercise the rule that the deduction is taken once against
aggregated income rather than once per head — that is a separate example.

The deduction of Rs. 1,800,000 [PN/IT/2025-01, para 1] exceeds the relief-eligible income
of Rs. 1,740,000, so taxable income is nil rather than negative, and the unused
Rs. 60,000 of relief is not carried anywhere. There are no gains on the realisation of
investment assets in this year, so nothing sits outside the relief
[IRA Sch.5 para 2(a), as enacted 2017].

### Rate schedule

The normal individual ladder applies: there is no service-export or foreign-source income
to which a maximum rate could apply [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)], no
terminal benefit, no special business income and no capital gain, so nothing is carved out
and the whole of taxable income — nil — goes on the ladder
[IRA Sch.1 para 1(2)(d), as enacted 2017].

| Band | Amount | Rate | Tax |
|---|---|---|---|
| First 1,000,000 | 0 | 6% [Act 2/2025 s.3(1)(b) — IRA Sch.1 para 1(1D)] | 0 |
| **Gross tax** | | | **0** |

Taxable income is nil, so the first band is not reached and no band carries an amount. The
component is recorded at Rs. 0 with an empty band list rather than omitted: the ladder was
applied, and it produced nothing.

### Credits

Nothing was deducted at source. APIT nil — the point of this persona — AIT nil, and no
foreign tax was paid on any source [IRA s.81(1)]. Gross tax nil less credits nil leaves
**tax payable of Rs. 0**, and there is no excess credit to account for.

That the employer deducted no APIT does not by itself mean nothing was payable; here
nothing was payable because the relief exceeds the income. Where the two come apart — a
salary above the threshold with no deduction — the whole liability falls on the employee,
and that is a different example.

## Payment schedule

Rajitha filed no Statement of Estimated Tax, so there is no **A** for the instalment
formula `(A − C) / B` [IRA s.90(3)] and no instalments are computed. The engine does not
substitute the liability it has computed for the estimate the taxpayer is required to
make: they are different figures.

The return itself is still due **30 November 2026** — eight months after the end of the
year of assessment on 31 March 2026 [IRA s.93(1)]. The filing obligation does not depend
on there being tax to pay.

No date is stated for a final payment. Whether one exists separately from the fourth
instalment is unresolved (Q22), and there is in any event no balance to settle.

## Notes

This is the harness's smoke test: the simplest fact pattern in which every field of the
result is checkable by hand, written to prove that the fixture format and the runner
round-trip against the real Y/A 2025/2026 data. Every rate it depends on — the personal
relief and the existence of a nil charge below it — is verified from a primary source held
in `docs/sources/`, so it carries `verified: true`.

Two things it deliberately does **not** cover, and which the band-boundary examples must:

- No band is walked, so an error in the ladder arithmetic would not fail this fixture.
- The instalment formula is not exercised, because there is no estimate.

## Self-check

- Band-by-band tax sums to the stated gross tax: 0 = 0.
- Taxable income falls within the bands charged: nil income, no band charged.
- Instalments plus final payment sum to the liability: no instalments, final payment nil,
  liability nil.
- Personal relief applied exactly once, after aggregating assessable income: one
  deduction of 1,800,000 against 1,740,000 of aggregate relief-eligible income.
- Front matter is valid YAML and matches the schema in
  [`README.md`](README.md).
- Every rate carries a citation in the prose.
