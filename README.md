# Sri Lanka Tax Return Support

A static site that helps individuals in Sri Lanka work out their income tax and
prepare their annual return — with the rate data kept in versioned, cited data files
so it can be updated when the law changes.

> **This is not tax advice.** It is a calculation aid. Figures are derived from
> published law as recorded in `docs/sources/`, but responsibility for what you file
> and pay rests with you. Verify against the Inland Revenue Department or a qualified
> tax practitioner before filing.

## Who this is for

Generic salary calculators cover the employee who has APIT deducted at source and
nothing else. This project targets the people they leave out:

**1. Work-from-home consultants earning foreign currency.**
The exemption on foreign-source and service-export income was removed with effect from
1 April 2025. Such income now falls under a reduced-rate regime — **but only when the
earnings are remitted to Sri Lanka through a licensed bank.** Earnings kept offshore
fall back to the full progressive ladder. That single condition swings the liability
enormously, and no consumer calculator asks about it.

**2. Employees whose employer does not deduct APIT.**
Non-deduction by the employer does not discharge the employee's liability. These
taxpayers must register, pay by instalment through the year, and file manually — and
usually discover this late.

**3. Mixed employment and business income.** Salary plus foreign freelance work, where
two different rate schedules interact. The most error-prone real case.

**4. Investment income, capital gains and terminal benefits** — interest, dividends,
rent, and claiming credit for tax already withheld.

## Status

**Phase 1 — research foundation and tooling. No application code yet.**

| | |
|---|---|
| Research documentation | scaffolded; awaiting primary sources |
| Claude agents / skills / commands | complete |
| Implementation spec | complete |
| Tax data files | not started |
| Astro site | not started |

### Primary sources are needed

The research documents cannot be completed until the legislation is committed to
`docs/sources/`. Claude Code web sessions cannot reach `www.ird.gov.lk` — the egress
policy blocks it — so the PDFs must be added to the repo by hand. See
[`docs/sources/README.md`](docs/sources/README.md) for the exact list and why each one
is needed.

Until then, every provisional figure lives in
[`docs/research/12-open-questions.md`](docs/research/12-open-questions.md), labelled
unverified. Nothing in this repo should be treated as settled while it sits there.

## Reading order

Start at [`docs/README.md`](docs/README.md).

## Working on this repo with Claude

Read [`CLAUDE.md`](CLAUDE.md) first — it sets out the citation discipline and the
constraints on how tax figures may be stated. Then:

```
/research-topic <topic>      research a topic from primary sources
/verify-rates <claim>        confirm or refute one figure against the acts
/add-tax-year <Y/A>          roll forward to a new year of assessment
/new-worked-example <case>   generate a worked example + test fixture
```

## Licence

MIT — see [`LICENSE`](LICENSE). Note the warranty disclaimer; it applies with full
force to the tax figures this project produces.
