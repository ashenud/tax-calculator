---
description: Roll the tax data forward to a new year of assessment, or apply an amendment act
argument-hint: <Y/A, e.g. 2026/2027 — optionally with the instrument, e.g. "2026/2027 Act 8/2026">
---

Roll forward the tax data for: **$ARGUMENTS**

Use the `tax-data-updater` subagent, which follows the `tax-year-rollover` skill.

Before dispatching, confirm the governing instrument is committed in `docs/sources/` and
registered in `docs/sources/README.md`. This environment cannot download from
`ird.gov.lk` — if the act or notice is not in the repo, stop and ask for it rather than
proceeding on secondary knowledge.

Require the agent to return a **diff table covering every leaf value**, each with a
verdict of `changed`, `confirmed unchanged`, or `unverified` — and a citation. A field
reported as unchanged without a citation was not checked; send it back.

After it reports:

- Run `node scripts/check-citations.mjs`.
- Run the fixture suite if the engine exists. **If a fixture for an earlier year now
  fails, treat it as a bug in the engine, not a fixture to update** — a historical
  year's computed result must not move because later law changed.
- Route any changed *regime* (a new condition, a new class of income, a changed basis of
  charge) to `/research-topic`, and any newly asserted figure to `/verify-rates`.
- Confirm the new file's `status` is set honestly: `proposed` for an unenacted budget
  measure, `enacted` for passed law.
