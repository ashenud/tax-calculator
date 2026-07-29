/**
 * The one call into the engine, and the three things that can come back.
 *
 * `computeTax` is pure and synchronous, so there is no loading state and
 * nothing asynchronous here — the whole computation happens in the browser
 * between one keystroke and the next. **Nothing in this module, or anywhere
 * under `src/components/calculator/`, makes a network request**; the figures a
 * person enters never leave the tab they typed them in
 * [`docs/spec/ui-behaviour.md`, "Compute locally, keep nothing"]. That is
 * asserted mechanically by `no-network.test.ts`.
 *
 * ---------------------------------------------------------------------------
 * WHY A THROW IS CAUGHT HERE RATHER THAN PREVENTED IN THE FORM
 * ---------------------------------------------------------------------------
 *
 * The engine throws, deliberately, on inputs whose treatment no document in
 * this repository settles — a head carrying both a deduction and separately
 * rated income, a loss, a terminal benefit whose periods disagree. Those are
 * not user mistakes and they are not bugs; they are places the law, or the
 * spec, runs out.
 *
 * Two ways to handle them. Re-implement each of those rules in the form so the
 * throw never happens — which puts a second copy of the engine's reasoning in
 * the UI, to drift from the first the day either changes. Or catch it and show
 * what the engine said. This does the second, and shows the engine's own
 * message verbatim: it names the exact combination and the exact provision, and
 * a paraphrase would be a third version of the same rule.
 *
 * What it never does is produce a figure. An `uncomputable` result renders like
 * a refusal — no amount, anywhere.
 *
 * The gaps that *are* the form's job — an unanswered condition, a missing
 * length of service — never reach the engine at all: `buildTaxInput` reports
 * them as questions still to answer, which is the honest state for something
 * the user simply has not got to yet.
 */

import { buildTaxInput, type CalculatorState, type MissingAnswer } from './model.ts';
import { computeTax, type TaxResult } from '../../lib/tax/engine.ts';
import type { TaxYearFile } from '../../lib/tax/schema.ts';

export type Computation =
  /** Not enough has been answered. No figure, and never `Rs. 0`. */
  | { status: 'incomplete'; missing: readonly MissingAnswer[] }
  /** The engine declined to compute on this combination. No figure. */
  | { status: 'uncomputable'; detail: string }
  /** A result — which may itself be a refusal. `RefusalPanel` decides. */
  | { status: 'computed'; result: TaxResult };

export function compute(
  state: CalculatorState,
  taxYear: TaxYearFile | null,
): Computation {
  const built = buildTaxInput(state, taxYear);
  if (built.status === 'incomplete') {
    return { status: 'incomplete', missing: built.missing };
  }
  if (!taxYear) {
    // Unreachable: a null year is already reported as missing above. Explicit
    // rather than asserted, because the alternative is a non-null assertion on
    // the value every rate in the computation comes from.
    return {
      status: 'incomplete',
      missing: [{ key: 'year', what: 'the year of assessment you are working out' }],
    };
  }

  try {
    return { status: 'computed', result: computeTax(built.input, taxYear) };
  } catch (error) {
    return {
      status: 'uncomputable',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
