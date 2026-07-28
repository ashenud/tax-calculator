# Documentation

Everything this project knows about Sri Lankan individual income tax, and everything
it plans to build. Written to be read in order.

## Reading order

**1. Start here — the ground rules**

- [`../CLAUDE.md`](../CLAUDE.md) — citation discipline, integer money, Y/A scoping.
  Read this before writing anything into `docs/`.
- [`sources/README.md`](sources/README.md) — what primary law we hold, what is missing,
  and the provenance of each document.

**2. The law** — [`research/`](research/)

Numbered in dependency order. `00` explains the shape of the system; later files assume
the earlier ones.

| | |
|---|---|
| [`00-overview.md`](research/00-overview.md) | How the system fits together: assessable → taxable → payable |
| [`01-residency-and-source.md`](research/01-residency-and-source.md) | Who is taxed on what; resident vs non-resident citizen; source rules |
| [`02-assessable-income.md`](research/02-assessable-income.md) | The heads of income |
| [`03-reliefs-and-qualifying-payments.md`](research/03-reliefs-and-qualifying-payments.md) | Personal relief and deductions |
| [`04-rate-tables.md`](research/04-rate-tables.md) | Every rate table, by year of assessment |
| [`05-foreign-currency-service-income.md`](research/05-foreign-currency-service-income.md) | **Priority.** The reduced-rate regime and the remittance condition |
| [`06-apit.md`](research/06-apit.md) | APIT, and the employee's position when the employer doesn't deduct |
| [`07-wht-ait-and-credits.md`](research/07-wht-ait-and-credits.md) | Withholding, advance income tax, and claiming credit |
| [`08-capital-gains.md`](research/08-capital-gains.md) | Realisation of investment assets |
| [`09-terminal-benefits.md`](research/09-terminal-benefits.md) | Gratuity, retirement, compensation |
| [`10-compliance-calendar.md`](research/10-compliance-calendar.md) | Instalments, deadlines, penalties |
| [`11-filing-walkthrough.md`](research/11-filing-walkthrough.md) | TIN, e-Services, the return itself |
| [`12-open-questions.md`](research/12-open-questions.md) | **Live register of everything not yet verified** |

> If you read only one file, read `12-open-questions.md`. It is the honest account of
> what this project does and does not yet know.

**3. The people** — [`personas/`](personas/)

Concrete taxpayer situations, each ending with the questions the calculator must ask.

- [`p1-wfh-foreign-consultant.md`](personas/p1-wfh-foreign-consultant.md)
- [`p2-employee-no-apit.md`](personas/p2-employee-no-apit.md)
- [`p3-mixed-employment-business.md`](personas/p3-mixed-employment-business.md)
- [`p4-investment-cgt-terminal.md`](personas/p4-investment-cgt-terminal.md)

**4. The arithmetic** — [`worked-examples/`](worked-examples/)

Fully computed cases in a machine-readable format. These are not illustrations; they
become the calculation engine's test fixtures verbatim. See
[`worked-examples/README.md`](worked-examples/README.md) for the format.

**5. What to build** — [`spec/`](spec/)

- [`data-model.md`](spec/data-model.md) — the tax-year data file schema
- [`calculation-engine.md`](spec/calculation-engine.md) — the computation pipeline
- [`site-architecture.md`](spec/site-architecture.md) — Astro, routes, deployment
- [`ui-design-system.md`](spec/ui-design-system.md) — tokens, type, colour, components
- [`ui-behaviour.md`](spec/ui-behaviour.md) — flows, states, validation, accessibility
- [`update-playbook.md`](spec/update-playbook.md) — the runbook for when the law changes

**5a. How to build it** — [`prompts/`](prompts/)

[`prompts/INDEX.md`](prompts/INDEX.md) is the ordered build sequence, P00 to P16, with
live execution status. Start there when writing application code.

```bash
node scripts/prompt-status.mjs next     # what to run now
/run-prompt                             # run it
/build-status                           # where we are
```

**6. Why it is built that way** — [`decisions/`](decisions/)

- [`adr-0001-static-site-astro.md`](decisions/adr-0001-static-site-astro.md)
- [`adr-0002-tax-data-as-versioned-json.md`](decisions/adr-0002-tax-data-as-versioned-json.md)
- [`adr-0003-disclaimer-and-liability-posture.md`](decisions/adr-0003-disclaimer-and-liability-posture.md)
- [`adr-0004-citation-discipline.md`](decisions/adr-0004-citation-discipline.md)

## Document conventions

Every research and persona document opens with a status block:

```markdown
> **Status:** unverified · **Sources:** none held · **Last reviewed:** 2026-07-27
```

- `verified` — every figure confirmed against a primary source in `docs/sources/`
- `partial` — some figures confirmed, the rest listed in `12-open-questions.md`
- `unverified` — no primary source held; the document is a research brief, not findings

A document may only claim `verified` if a `tax-rule-verifier` run backs each figure.
