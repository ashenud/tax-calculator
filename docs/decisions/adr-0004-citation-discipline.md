# ADR 0004 — Citation discipline and its enforcement

**Status:** accepted · **Date:** 2026-07-27

## Context

Most of this repository's content is produced by AI agents reading legislation. That
brings a specific and well-understood failure mode: a model asked about Sri Lankan tax
rates will produce plausible, confidently-stated, well-formatted figures whether or not
it has read the act. The 2025 rate changes were widely reported, so the numbers are
familiar — and familiarity is indistinguishable, from the inside, from knowledge.

The environment makes it worse. Claude Code web sessions cannot reach `www.ird.gov.lk`;
the egress proxy blocks it. Web search still works and returns confident secondary
summaries that disagree with each other — during initial research on this project, two
sources gave different monthly thresholds for withholding on service fees to resident
individuals, and neither could be checked against the source.

Without a hard rule, the path of least resistance produces a repository full of numbers
that look cited, sound right, and cannot be traced to anything.

## Decision

**No tax figure is stated as fact without a citation to a primary source held in
`docs/sources/`.**

**Format.** The citation follows the figure immediately, in the same sentence:

```
[IRA s.85(1)(a)]                              base act
[IRA s.52, as amended by Act 2/2025 s.14]     amended — cite both
[PN/IT/2025-01, para 3]                       IRD notice
```

Amended provisions cite the base section *and* the amending act. A bare `[IRA s.52]` for
a figure that exists only because of a 2025 amendment misleads a reader who checks the
2017 act and finds a different number.

**In data files**, the same discipline appears as a `src` pointer on every leaf value.
Schema validation rejects a value without one.

**Unverified figures go to `docs/research/12-open-questions.md`** — never into prose,
personas, or data as fact. Downgrading a claim to unverified is always allowed and needs
no justification. Upgrading requires a verbatim quote from a primary source.

**Research and verification are separate agents.** `tax-researcher` writes; only
`tax-rule-verifier` may mark something verified, and it is read-only and adversarial. An
agent that checks its own research confirms its own reading of an ambiguous provision.

**Enforcement is mechanical.** `scripts/check-citations.mjs` fails CI when a rupee amount
or percentage appears in `docs/research/` or `docs/personas/` without an adjacent
citation.

## Consequences

**Good**

- Any figure can be traced to a provision by a reader who does not trust the repo — which
  is the correct posture for a reader to have
- The gap between "we know this" and "we have heard this" is visible in the file tree
  rather than hidden in prose
- Applying a future amendment is tractable: the citations show which values were checked
  against which instrument
- The site can publish rate tables with sources attached, letting users verify rather
  than trust

**Costs**

- Denser prose. A paragraph with four figures carries four bracketed citations.
- Research is blocked on documents being committed by hand. This is the intended
  behaviour — the blockage is the mechanism — but it does mean the repo can sit in a
  scaffolded state waiting on a human.
- The script is a lint, not a fact-checker. It catches missing brackets, not a wrong
  section number. It must not be mistaken for verification.

## The limit of mechanical enforcement

`check-citations.mjs` proves only that a citation is *present*. A fabricated citation
passes it perfectly. The script exists to stop the discipline decaying through
carelessness as the docs grow; it does nothing about a confident agent inventing
`[IRA s.85(3)]`.

Only `tax-rule-verifier` reading the actual document catches that — which is why the
verifier is read-only, adversarial, separate from the author, and required to produce a
verbatim quote. If it cannot quote the provision, the verdict is `not-found`, and
`not-found` on a figure everyone believes is the correct and useful answer.
