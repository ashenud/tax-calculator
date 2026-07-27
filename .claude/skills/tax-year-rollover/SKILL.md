---
name: tax-year-rollover
description: Step-by-step procedure for adding a new year of assessment to the tax data, or applying an amendment act, budget change or IRD notice to existing rates, thresholds, reliefs and deadlines. Use when the law changes or when rolling forward to a new Y/A.
---

# Rolling forward a year of assessment

Adding a year of assessment must not require code changes. If it does, the schema is
wrong and needs extending deliberately — with an ADR — rather than patching the engine.

## Before you start

- The instrument must be committed in `docs/sources/` and registered in
  `docs/sources/README.md`. This environment cannot download from `ird.gov.lk`; if the
  document is not there, stop and ask for it.
- Read `docs/spec/data-model.md`. The schema is authoritative over anything here.
- Read the prior year's data file end to end **before** copying it, so you know what is
  in scope.

## Procedure

### 1. Create the file

Copy `data/tax-years/<prior>.json` → `data/tax-years/<new>.json`. Set:

```jsonc
"yearOfAssessment": "2026/2027",
"period": { "from": "2026-04-01", "to": "2027-03-31" },
"status": "draft"
```

`status` stays `draft` for the whole of this procedure. Set it at the end, and set it
honestly:

| Status | Meaning |
|---|---|
| `proposed` | Announced (e.g. in a budget) but not enacted. Must not drive a filing calculation. |
| `enacted` | Passed into law, whether or not it has commenced. `period` carries the dates. |
| `superseded` | Later law replaced it. Retained — late and amended returns still need it. |

### 2. Register the source

Add the new instrument to `sources` in the data file, and add its row to
`docs/sources/README.md` with SHA-256 and status.

### 3. Walk every leaf — this is the whole job

For **every** leaf value in the file, produce a verdict. Not "leave it alone" — a
verdict.

| Field | Prior | New | Verdict | Citation |
|---|---|---|---|---|
| `reliefs.personal.amount` | 1200000 | 1800000 | changed | [IRA s.52, as amended by Act 2/2025 s.14] |
| `rateSchedules.individual-normal.bands[1].rate` | 1200 | 1800 | changed | [IRA First Schedule, as amended by Act 2/2025] |
| `wht.interest.rate` | 1000 | 1000 | confirmed unchanged | [IRA s.84, unamended by Act 2/2025] |
| `calendar.returnDue` | 2025-11-30 | 2026-11-30 | changed (rolled) | [IRA s.93(1)] |

**"Confirmed unchanged" means you checked.** A field you did not check is `unverified`
and goes to `docs/research/12-open-questions.md`.

The reason for the ceremony: the dangerous error is not a wrong headline rate — someone
notices those. It is the two headline figures being updated correctly while four
quieter values in a schedule change and are carried forward stale.

### 4. Every leaf keeps its `src`

Schema validation rejects a value without a source pointer. If you cannot source a
value, **omit the field and record the gap** — do not fabricate a pointer to make
validation pass.

### 5. Update the rate-table research

Add the new year's tables to `docs/research/04-rate-tables.md`. **Append; never
overwrite.** Historical years must remain computable — returns are amended and filed
late for years afterwards.

### 6. Flag substantive changes for research

A changed number is a data change and yours to make. A changed *regime* — a new
condition, a new class of income, a changed basis of charge — needs analysis. Flag it
for `tax-researcher`; do not rewrite the legal analysis yourself.

### 7. Add fixtures

At minimum one worked example per rate schedule that changed. A rate change with no
corresponding fixture change means the test suite was not exercising that rate.

Where a threshold moved, add boundary fixtures just below and just above it.

### 8. Verify

```bash
node scripts/check-citations.mjs
```

Then the fixture suite, once the engine exists.

**If a previously passing fixture for an earlier year now fails, that is a bug to
report — not a fixture to update.** A historical year's computed result must never move
because a later year's law changed. If it does, the engine is resolving rates globally
instead of per Y/A.

### 9. Set the status

Move from `draft` to `proposed` or `enacted`. Only mark the prior year `superseded` if
it genuinely is — most prior years stay live.

## Checklist

- [ ] Instrument committed and registered in `docs/sources/README.md`
- [ ] New data file created; `period` correct
- [ ] Every leaf has a verdict: changed / confirmed unchanged / unverified
- [ ] Every leaf has a `src`, or its absence is recorded as a gap
- [ ] `04-rate-tables.md` appended, prior years untouched
- [ ] Regime changes flagged for `tax-researcher`
- [ ] Fixtures added for every changed schedule, plus boundary cases
- [ ] `check-citations.mjs` passes; prior-year fixtures still pass
- [ ] `status` set honestly
- [ ] Unresolved items listed in `12-open-questions.md`
