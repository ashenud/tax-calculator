---
description: Verify a tax figure against primary legislation and update the open-questions register
argument-hint: <claim, or an open-question id, or "all" for the whole register>
---

Verify: **$ARGUMENTS**

Use the `tax-rule-verifier` subagent, which follows the `verify-tax-claim` skill.

**One claim per agent run.** If the argument is `all`, or names several figures, or is a
compound claim, split it into individual falsifiable claims first and dispatch one run
each. Batching produces a single confident sweep across items that each deserve separate
scrutiny — which is the exact failure this command exists to prevent.

Each claim must carry a year of assessment before dispatch. If the argument omits one,
supply it from context or ask; a claim without a Y/A is unverifiable.

For each verdict returned:

- `verified` → move the figure into the relevant research document with its citation,
  and update the register row. A document's status block goes to `verified` only when
  **every** figure in it has been verified.
- `contradicted` → correct the figure everywhere it appears — research, personas, worked
  examples, tax data — and leave a register row recording the wrong value and its
  source. Do not delete the history; a figure that was published wrong once tends to
  return.
- `partially-verified` → record the figure and the omitted condition as separate items.
- `not-found` → add the document that would settle it to the "Should have" list in
  `docs/sources/README.md`. Do not soften this into a `verified`.

Report the verdicts plainly, including any that contradict something currently written
down as fact.
