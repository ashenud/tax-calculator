---
id: p4-credits-exceed-gross-tax-2025-26
persona: p4
yearOfAssessment: "2025/2026"
verified: true

input:
  residency: resident
  income:
    investment:
      - label: Interest on fixed deposits at two banks, gross
        amount: 2600000
  creditsPaid:
    ait: 260000

expected:
  assessableByHead: { employment: 0, business: 0, investment: 2600000, other: 0 }
  partition: { reliefEligible: 2600000, reliefIneligible: 0 }
  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }
  taxableMain: 800000
  taxableGain: 0
  components:
    - kind: ladder
      amount: 800000
      bands:
        - amount: 800000
          rateBp: 600
          effectiveRateBp: 600
          tax: 48000
          src: "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
      tax: 48000
  grossTax: 48000
  credits: { apit: 0, ait: 260000, foreign: 0, total: 260000, excess: 212000 }
  taxPayable: 0
  schedule:
    instalments: []
    finalPayment: { due: "", amount: 0 }
    returnDue: "2026-11-30"
  warnings:
    - { code: excess-credit, severity: warn }
  sourcesUsed:
    - "act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1"
    - "act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)"
    - "ira-2017#s.93(1)"
---

# P4 — tax withheld exceeds the liability, Y/A 2025/2026

## Facts

Sunil ([persona P4](../personas/p4-investment-cgt-terminal.md)) is retired and lives on
fixed deposit interest. His banks withhold tax on the interest and give him certificates,
which he files away. He does not know whether he must file a return, or whether the withheld
tax is the end of the matter.

For Y/A 2025/2026 (1 April 2025 – 31 March 2026), resident in Sri Lanka:

| | Amount |
|---|---|
| Interest on fixed deposits at two banks, **gross** | 2,600,000 |
| Tax withheld by the banks | 260,000 |

No employment, no business income, no capital gain, no qualifying payments, no Statement of
Estimated Tax.

**The interest is entered gross, and the withheld tax separately.** Entering the net figure
*and* claiming the credit would relieve the same tax twice, which is the error this persona
is most exposed to — the certificate shows both numbers and it is not always obvious which
one the form is asking for.

## Computation

### Steps 1 to 3

| Step | Amount | Authority |
|---|---|---|
| Investment income (interest, gross) | 2,600,000 | [IRA s.7] |
| Employment, business, other | 0 | — |
| **Total assessable income** | **2,600,000** | [IRA s.3] |
| Relief-eligible portion | 2,600,000 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Relief-ineligible portion (gains on realisation of investment assets) | 0 | [IRA Sch.5 para 2(a), as enacted 2017] |
| Less the aggregate Fifth Schedule deduction | (1,800,000) | [IRA s.52(1)]; [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)] |
| **Taxable income** | **800,000** | [IRA s.52(1)] |

The relief is available to a resident individual and is deducted here as it is against any
other head of income [IRA s.52(1)]. That is the whole reason Sunil's position comes out the
way it does: the bank withholding takes no account of it.

### Steps 4 to 6 — the ladder

Nothing is carved out and no cap applies [IRA Sch.1 para 1(2)(d), as enacted 2017;
IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)].

| Band | Amount | Rate | Tax | Authority |
|---|---|---|---|---|
| First 1,000,000 | 800,000 | 6% | 48,000 | [IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)] |
| **Gross tax** | | | **48,000** | |

Taxable income of Rs. 800,000 sits wholly inside the first band, so Sunil's **effective rate
on the interest is 48,000 / 2,600,000 ≈ 1.8%** — well under the rate at which the banks
withheld.

### Step 7 — credits, and the excess

```
gross tax                48,000
less AIT withheld      (260,000)
                       ---------
tax payable                   0
excess credit           212,000
```

**Tax payable is nil, and Rs. 212,000 of credit had nowhere to go.**

The excess is **surfaced, not floored away.** `taxPayable` is `max(0, grossTax − credits)`
and so cannot go negative, but `credits.excess` retains the surplus of
`max(0, credits − grossTax)` alongside it. A result that reported only "tax payable: 0"
would be arithmetically true and practically misleading: it would tell Sunil he owes
nothing, and say nothing at all about the Rs. 212,000 of his money that the banks have
already sent to IRD.

That is exactly the outcome persona P4 warns about — "he is owed money he will never claim".

The engine raises an `excess-credit` warning, and it does **not** state what happens to the
excess, because that is not settled by the sources this project holds. **Q20:** refunds
demonstrably exist — [PN/IT/2025-01, para 4] records that refunds up to Rs. 180,000 are
processed within three months, and that senior citizens' claims under Rs. 45,000 are
processed quarterly — but whether excess *credit* of this kind is refundable, carried
forward, or lost is not established. Sunil's Rs. 212,000 is above the Rs. 180,000 figure in
any event.

There is a second unresolved question underneath this one, and it is Sunil's actual
question. **Whether any of this withholding is final** — meaning the interest is excluded
from the return entirely rather than reported with a credit — is unresolved (Q15–Q19). This
computation assumes it is creditable, not final. If it turns out to be final, the whole shape
of his return changes.

No foreign tax was paid on any source [IRA s.81(1)], and there is no APIT: he has no
employer.

## Payment schedule

Sunil filed no Statement of Estimated Tax, so there is no **A** for `(A − C) / B`
[IRA s.90(3)] and no instalments are computed. Nothing was payable by instalment in any
event — the withholding exceeded the liability from the start.

The return is due **30 November 2026**, eight months after the year of assessment ends on
31 March 2026 [IRA s.93(1)]. **The filing obligation does not depend on there being tax to
pay**, which answers the first of Sunil's two questions; and on these figures filing is the
only route by which the Rs. 212,000 could ever be reclaimed, which bears on the second.

No final payment date is stated (Q22, unresolved), and there is no balance to settle.

## Notes

Every rate this computation applies is verified against a primary source in `docs/sources/`:
the Rs. 1,800,000 personal relief
[IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3); PN/IT/2025-01, para 1] and the 6% first band
[IRA Sch.1 para 1(1D), ins. Act 2/2025 s.3(1)(b)]. So `verified: true`.

The 10% withholding rate on interest [IRA Sch.1 para 10(1)(d)(ii), ins. Act 2/2025 s.3(3);
PN/IT/2025-01, para 2.3] is verified in the data but is **not applied by this computation** —
the Rs. 260,000 is a figure from Sunil's certificates, taken as given. The engine does not
recompute what a bank should have withheld.

What this fixture would catch if it broke: an excess credit silently floored away into
`taxPayable`, a negative `taxPayable`, the `excess-credit` warning going missing, credits
being netted before rather than after the ladder, and the return due date being suppressed
where no tax is payable.

## Self-check

- Band-by-band tax sums to the stated gross tax: 48,000 = 48,000.
- Taxable income falls within the bands charged: Rs. 800,000, inside the first band of
  Rs. 1,000,000.
- Instalments plus final payment sum to the liability: no estimate, so no schedule was
  computed; the liability is nil.
- Personal relief applied exactly once, after aggregating assessable income: one deduction
  of Rs. 1,800,000 against Rs. 2,600,000.
- Credits sum correctly: 0 + 260,000 + 0 = 260,000. Excess is
  max(0, 260,000 − 48,000) = 212,000. Tax payable is max(0, 48,000 − 260,000) = 0. The
  credit is fully accounted for: 48,000 absorbed + 212,000 excess = 260,000.
- Front matter is valid YAML and matches the schema in [`README.md`](README.md).
- Every rate carries a citation in the prose.
