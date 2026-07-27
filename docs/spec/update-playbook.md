# Update playbook — the law changed, now what

> **Status:** spec
> **Audience:** whoever maintains this after the next budget
> **Automated form:** the [`tax-year-rollover`](../../.claude/skills/tax-year-rollover/SKILL.md) skill, via `/add-tax-year`

Sri Lankan tax law changes most Aprils, and sometimes mid-year. This is the runbook.

## 0. Get the document into the repo

**Nothing else can start until this is done.** Claude Code web sessions cannot reach
`www.ird.gov.lk` — the egress proxy blocks it. Download the act or notice yourself and
commit it to `docs/sources/`, with a row in
[`../sources/README.md`](../sources/README.md) including its SHA-256 and status.

An agent asked to update rates without the document will either stop (correct) or
reconstruct the figures from memory of news coverage (catastrophic). Removing the
temptation is the point of this step being first.

## 1. Classify the change

| Kind | Example | Route |
|---|---|---|
| **Value change** | Relief moves from 1.2M to 1.8M | Data only → step 2 |
| **Structural change** | A band is added or removed | Data → step 2, plus fixtures |
| **Regime change** | A new class of income, or a new condition on an existing one | Research first → step 5, then data |
| **Administrative change** | A deadline moves, a form changes | Data `calendar` + research doc 10/11 |

Regime changes are the ones that go wrong. A new *condition* on a relief looks like a
small edit and is actually a change to what the calculator must ask the user. Route it
through research before touching data.

## 2. Update the data

`/add-tax-year 2026/2027` — or by hand following
[`../../.claude/skills/tax-year-rollover/SKILL.md`](../../.claude/skills/tax-year-rollover/SKILL.md).

The discipline that matters: **every leaf value gets a verdict** — `changed`,
`confirmed unchanged`, or `unverified`. Not "left alone".

The failure this prevents: copying last year's file, updating the two figures that were
in the news, and shipping four values that also changed quietly in a schedule nobody
reported on. Wrong headline rates get noticed. Stale quiet ones do not.

## 3. Verify the new figures

`/verify-rates` on each new or changed figure, one claim per run. Anything that comes
back `not-found` stays `unverified` in
[`../research/12-open-questions.md`](../research/12-open-questions.md) and must be
surfaced as a warning in the UI — not quietly shipped.

## 4. Update rate-table research

Append the new year to [`../research/04-rate-tables.md`](../research/04-rate-tables.md).
**Never overwrite a prior year.** Amended and late returns are filed for years
afterwards, and a taxpayer amending Y/A 2023/24 needs the 2023/24 tables.

## 5. Research any regime change

`/research-topic <the new regime>`. This produces the analysis; then revisit the
personas — a new condition usually means the calculator must ask a new question, and
that question belongs in the data file's `conditions`, not in a component.

## 6. Fixtures

At least one worked example per changed schedule, plus boundary cases either side of any
moved threshold. `/new-worked-example`.

**A rate change with no fixture change means the tests were not exercising that rate.**
Treat it as a coverage gap, not as a sign that no fixture was needed.

## 7. Regression check

```bash
node scripts/check-citations.mjs
npm run test           # once the engine exists
npm run build
```

**If a fixture for an earlier year of assessment now fails, that is a bug in the engine
— not a fixture to update.** A historical year's computed result must never move because
a later year's law changed. If it does, some rate is being resolved globally instead of
per Y/A, and that defect will silently corrupt every historical calculation.

## 8. Publish honestly

- Set `status`: `proposed` for an announced-but-unenacted budget measure, `enacted` for
  passed law. A `proposed` year must be visibly labelled and must not be presented as a
  basis for filing.
- Update the changelog page with what changed, effective from when, under which
  instrument.
- Update the `lastReviewed` date.
- List anything still `unverified` in the commit message, so it is not mistaken for
  settled by whoever reads the log next.

## Checklist

- [ ] Instrument committed to `docs/sources/` and registered
- [ ] Change classified; regime changes routed through research
- [ ] Every leaf value has a verdict and a `src`
- [ ] New figures verified, one claim per run
- [ ] `04-rate-tables.md` appended; prior years untouched
- [ ] Fixtures added for every changed schedule and moved threshold
- [ ] Citation check, tests, build all pass
- [ ] Prior-year fixtures still pass — unchanged results
- [ ] `status` and `lastReviewed` set honestly
- [ ] Remaining unverified items listed in the commit message
