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

import {
  buildTaxInput,
  type CalculatorState,
  type MissingAnswer,
  type MoneyFieldId,
} from './model.ts';
import { MIXTURE_ROUTE_ID } from './remittance-routes.ts';
import { HEADS, computeTax, type Head, type TaxResult } from '../../lib/tax/engine.ts';
import { UI_REFUSAL_CODES } from '../ui/RefusalPanel.tsx';
import type { TaxYearFile } from '../../lib/tax/schema.ts';

export type Computation =
  /** Not enough has been answered. No figure, and never `Rs. 0`. */
  | { status: 'incomplete'; missing: readonly MissingAnswer[] }
  /** The engine declined to compute on this combination. No figure. */
  | { status: 'uncomputable'; detail: string }
  /** A result — which may itself be a refusal. `RefusalPanel` decides. */
  | { status: 'computed'; result: TaxResult };

/**
 * Income fields the user said arrived by a mixture of routes, and which hold an
 * amount for that to be about.
 *
 * The amount check matters: the route picker is on screen from the moment the
 * section opens, so a route can be chosen before anything has been entered.
 * Refusing a computation over money nobody has told us about would be a refusal
 * with nothing behind it.
 */
function fieldsWithAMixtureOfRoutes(state: CalculatorState): readonly MoneyFieldId[] {
  return Object.entries(state.conditionRoutes)
    .filter(
      ([fieldId, routes]) =>
        (state.amounts[fieldId as MoneyFieldId] ?? null) !== null &&
        Object.values(routes ?? {}).includes(MIXTURE_ROUTE_ID),
    )
    .map(([fieldId]) => fieldId as MoneyFieldId);
}

/**
 * The refusal for Q11, in the shape the engine uses for its own (Q14).
 *
 * Every numeric field is a zeroed placeholder and none of them may be rendered
 * — `RefusalPanel` guarantees that by construction, since the figure is
 * produced by a callback it does not call on this path. `components` is empty
 * rather than partially filled, because no computation was performed at all.
 *
 * Built here rather than in the engine on purpose. The engine is handed
 * `conditions: Record<string, boolean>`; "the money arrived three different
 * ways" is not a value in that space, and it is not the engine's question. The
 * refusal is the same refusal either way, and `docs/spec/ui-behaviour.md`
 * requires the mixture case be refused rather than decided.
 */
function mixtureOfRoutesRefusal(yearOfAssessment: string): TaxResult {
  const zeroByHead = Object.fromEntries(HEADS.map((head) => [head, 0])) as Record<
    Head,
    number
  >;

  return {
    yearOfAssessment,
    assessableByHead: zeroByHead,
    partition: { reliefEligible: 0, reliefIneligible: 0 },
    deduction: { personalRelief: 0, qualifyingPayments: 0, total: 0 },
    taxableMain: 0,
    taxableGain: 0,
    components: [],
    grossTax: 0,
    credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 },
    taxPayable: 0,
    schedule: { instalments: [], finalPayment: { due: '', amount: 0 }, returnDue: '' },
    refusals: [
      {
        code: UI_REFUSAL_CODES.partialRemittanceMixture,
        question: 'Q11',
        explanation:
          'You said the money from your clients outside Sri Lanka reached you by more than one route. The maximum rate applies to gains and profits where the payment is received in foreign currency and remitted through a bank to Sri Lanka [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. The Act does not say what happens when only part of the earnings arrived that way — whether the test is applied to each payment on its own, apportioned across the whole, or failed for all of it. The readings give materially different liabilities, so no figure has been computed and no amounts you entered against the individual routes have been added together. See Q11 in docs/research/12-open-questions.md; Inland Revenue Department guidance, or the return form for this year of assessment, is the most likely thing to settle it.',
      },
    ],
    warnings: [],
    sourcesUsed: [],
  };
}

export function compute(
  state: CalculatorState,
  taxYear: TaxYearFile | null,
): Computation {
  // Before anything else, and deliberately before `buildTaxInput`. A mixture of
  // routes leaves the condition unanswered, so building the input would report
  // it as a question still to answer — which it is not. It is a question that
  // cannot be answered from the law as it stands, and the honest output is a
  // refusal rather than a prompt the user can never satisfy.
  if (taxYear && fieldsWithAMixtureOfRoutes(state).length > 0) {
    return {
      status: 'computed',
      result: mixtureOfRoutesRefusal(taxYear.yearOfAssessment),
    };
  }

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
