# CLAUDE.md — operating contract for this repository

This repo builds a tax return support tool for Sri Lankan individuals. Real people
will use its output to decide what to pay and what to file. That fact sets the rules
below. They are not style preferences; violating them produces a tool that confidently
tells someone the wrong number.

## The seven rules

### 1. Never state a tax figure without a citation

Every rupee amount, percentage, rate band, threshold, and deadline that appears in
`docs/` or in tax data files carries a citation to primary law.

Citation format:

```
[IRA s.85(1)(a)]                                  base act
[IRA s.52, as amended by Act 2/2025 s.14]         amended provision
[PN/IT/2025-01, para 3]                           IRD public notice
```

`IRA` = Inland Revenue Act No. 24 of 2017. Amendment acts are cited as `Act N/YYYY`.

`scripts/check-citations.mjs` enforces this mechanically and runs in CI. It is a
backstop, not the standard — it catches missing brackets, not wrong section numbers.

### 2. Primary sources beat secondary sources, always

If a document is in `docs/sources/`, it is the authority. Do not take a rate from a
blog, a Big Four tax alert, or another calculator when the act is sitting in the repo.
Secondary sources may be used to *locate* a provision; the provision itself is what
gets cited.

Note: `www.ird.gov.lk` is blocked by the egress policy in Claude Code web sessions.
Primary sources must be committed to `docs/sources/` and read locally with the `pdf`
skill. If you find yourself wanting to cite a web search result for a number, stop and
add the missing document to `docs/sources/README.md` as a gap instead.

### 3. Unverified means unverified

A figure that has not been confirmed against a primary source in `docs/sources/` goes
into `docs/research/12-open-questions.md`, marked `unverified`, with the provisional
value and where it came from. It does **not** go into research prose, persona docs, or
tax data files as though it were settled.

Downgrading a claim from `verified` to `unverified` is always allowed and never needs
justification. Upgrading requires a quoted passage from a primary source.

### 4. Money is integers

All monetary values are integer **Sri Lankan rupees**. No floats anywhere in a
calculation path — not in the engine, not in fixtures, not in data files. Rates are
stored as basis points or as exact decimal strings, never as binary floats that get
multiplied against money.

Rounding rules are specified per operation in `docs/spec/calculation-engine.md` and are
never left to the language default.

### 5. Every figure is scoped to a year of assessment

There is no "current rate" in this codebase. Every rate, threshold and relief belongs
to a specific year of assessment and is resolved by looking up a Y/A. A function that
takes an amount and returns tax without taking a Y/A is a bug.

Sri Lanka's year of assessment runs **1 April to 31 March**. Y/A 2025/2026 means
1 Apr 2025 – 31 Mar 2026.

### 6. This is decision support, not tax advice

Never phrase output as an instruction to file or pay a particular amount. The framing
is "based on the figures you entered and the law as recorded for Y/A X, the computed
liability is Y — verify with IRD or a qualified tax practitioner before filing."

Every computed result carries a visible "figures as at `<date>`" stamp. See
`docs/decisions/adr-0003-disclaimer-and-liability-posture.md`. This is not negotiable
and not something to trim for UI cleanliness.

### 7. Adding a year of assessment must not require code changes

New law lands as a new data file plus new fixtures. If a legislative change cannot be
expressed in the data model, that is a signal to extend the *schema*, deliberately and
with an ADR — not to hardcode a special case in the engine.

## Repository layout

```
docs/sources/       Primary law (PDFs) + provenance register. The authority.
docs/research/      Cited analysis of the law, numbered in reading order.
docs/personas/      The taxpayer situations this tool serves.
docs/worked-examples/  Fully computed cases. These become the engine's test fixtures.
docs/spec/          What to build: data model, engine, site, update playbook.
docs/decisions/     ADRs.
.claude/            Agents, skills and commands for working on this repo.
scripts/            Guardrails (citation check, link check).
```

## Agents

Use the right one; they have deliberately different powers.

| Agent | Use for | Notably |
|---|---|---|
| `tax-researcher` | Turning primary sources into cited research prose | No web access — forced to `docs/sources/` |
| `tax-rule-verifier` | Confirming or refuting one specific claim | Read-only, adversarial, quotes the source |
| `tax-data-updater` | Applying new law to tax data files | Diffs every changed value against the prior year |
| `tax-worked-example` | Producing a new worked example / fixture | Emits the machine-readable fixture format |

Research and verification are separate agents on purpose. An agent that checks its own
research will confirm its own mistakes.

## Current status

Phase 1 (this phase): research foundation and tooling. **No application code yet.**
The Astro site is built in a later phase from `docs/spec/`.

Before writing research prose, confirm `docs/sources/` actually contains the acts. If
it is empty, the honest output is a research *brief* saying what must be checked — not
prose synthesised from memory.
