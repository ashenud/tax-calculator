/**
 * The five routes a person's foreign earnings can have taken, and what each one
 * means for the computation.
 *
 * NO REACT IN THIS FILE. `RemittanceRoutePicker.tsx` renders it and `compute.ts`
 * reads one id out of it; keeping the table here is what lets the computation
 * layer know that one route refuses without importing a component.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS ONE CONDITION IS NAMED IN CODE, WHEN NO OTHER IS
 * ---------------------------------------------------------------------------
 *
 * `model.ts` and `ConditionQuestions.tsx` name no condition at all: questions
 * come from `taxYear.conditions`, so an amendment that adds one adds a question
 * with no code change [CLAUDE.md rule 7]. That generic rendering is a yes/no,
 * and for one condition it is known to be the wrong shape:
 *
 *   "For foreign-currency income, the naive rendering of the condition is a
 *   yes/no … A consultant cannot reliably answer that, and a wrong answer here
 *   swings the liability more than any other input."
 *   [`docs/spec/ui-behaviour.md`, "The remittance question"]
 *
 * So the id below buys a *better* rendering for a condition the data already
 * declares. It does not decide whether the question is asked, what it asks, or
 * what it is worth — all three still come from the data file. If the id ever
 * changes, or the condition is withdrawn, this module simply stops matching and
 * the generic yes/no takes over again: nothing breaks, and no question
 * disappears. That is the failure direction to be in.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE ROUTES MAY NOT SAY
 * ---------------------------------------------------------------------------
 *
 * Each route describes what happened to somebody's money. None of them is
 * phrased as a statutory test, none is presented as preferable to another, and
 * nothing here compares them or hints at what a different arrangement would
 * produce. "Suggest that one route would be better than another … is advice,
 * and it is prohibited by rule 6 of CLAUDE.md"
 * [`docs/prompts/P11-remittance-route-picker.md`]. The picker states
 * consequences; the reader draws their own conclusions.
 *
 * Three of the five routes are not decided at all. Q11, Q13 and Q41 in
 * `docs/research/12-open-questions.md` are open, and a default that looked
 * sensible would be a guess wearing the clothes of an answer.
 */

/**
 * The condition in `data/tax-years/*.json` that this picker replaces the
 * rendering of. Matched, never asserted: see the header.
 */
export const REMITTANCE_CONDITION_ID = 'remitted-through-bank-to-sri-lanka';

/** True when the route picker is the right rendering for this condition. */
export function isRemittanceCondition(conditionId: string): boolean {
  return conditionId === REMITTANCE_CONDITION_ID;
}

/**
 * What follows from a route, for the computation.
 *
 *   met          the condition is answered `true`; the cap applies if the
 *                engine's own rules also allow it
 *   not-met      answered `false`; the ordinary ladder stands, and the engine
 *                raises `rate-cap-condition-not-met` saying so
 *   unresolved   **left unanswered.** Not "no". The computation stays
 *                incomplete and the picker says why, naming the open question
 *   refused      no computation at all — `compute.ts` produces a refusal
 */
export type RouteOutcome =
  | { kind: 'met' }
  | { kind: 'not-met' }
  | { kind: 'unresolved'; question: 'Q13' | 'Q41'; detail: string }
  | { kind: 'refused'; question: 'Q11' };

export interface RemittanceRoute {
  /** Stored in `CalculatorState.conditionRoutes`. Opaque to `model.ts`. */
  id: string;
  /** What happened to the money, in the first person. Never statutory language. */
  label: string;
  /** One sentence making the route unmistakable from its neighbours. */
  description: string;
  /** The label used when this route is one line of a mixture. */
  splitLabel: string;
  outcome: RouteOutcome;
}

/** The route that refuses. Read by `compute.ts`; see `RouteOutcome`. */
export const MIXTURE_ROUTE_ID = 'a-mixture-of-routes';

export const REMITTANCE_ROUTES: readonly RemittanceRoute[] = [
  {
    id: 'direct-to-sri-lanka-bank',
    label: 'Direct transfer into my Sri Lankan bank account',
    description:
      'Your client sent the payment and it arrived in an ordinary account you hold with a bank here in Sri Lanka.',
    splitLabel: 'Amount that came by direct transfer into a Sri Lankan bank account',
    outcome: { kind: 'met' },
  },
  {
    id: 'foreign-currency-account-in-sri-lanka',
    label: 'Into a foreign-currency account at a Sri Lankan bank',
    description:
      'An account you hold with a bank here in Sri Lanka that keeps the money in dollars, pounds or another currency rather than in rupees.',
    splitLabel: 'Amount that went into a foreign-currency account at a Sri Lankan bank',
    outcome: {
      kind: 'unresolved',
      question: 'Q13',
      detail:
        'What is not settled is whether money paid into a foreign-currency account you hold at a bank in Sri Lanka counts as having been remitted through a bank to Sri Lanka. The Act does not define what counts, and this project holds no Inland Revenue Department guidance and no return form that answers it; it is recorded as open question Q13 in this project’s research register. Nothing has been assumed either way, so this question is still unanswered and no figure is being shown at all. Guidance from the Inland Revenue Department, or the return form for this year of assessment, would settle it. Until then it is a question for a qualified tax practitioner, who can look at the account and the statements with you.',
    },
  },
  {
    id: 'through-a-payment-service',
    label: 'Through Wise, Payoneer or PayPal, then withdrawn to a Sri Lankan bank',
    description:
      'Your client paid into your balance with one of those services, and you moved the money into your bank here afterwards.',
    splitLabel: 'Amount that came through Wise, Payoneer or PayPal',
    outcome: {
      kind: 'unresolved',
      question: 'Q41',
      detail:
        'What is not settled is whether a payment that reached you through Wise, Payoneer or PayPal and was then withdrawn to your bank here counts as having been remitted through a bank to Sri Lanka, or whether the service in the middle breaks that chain. The Act does not define what counts, and this project holds no Inland Revenue Department guidance and no return form that answers it; it is recorded as open question Q41 in this project’s research register. Nothing has been assumed either way, so this question is still unanswered and no figure is being shown at all. Guidance from the Inland Revenue Department, or the return form for this year of assessment, would settle it. Until then it is a question for a qualified tax practitioner, who can look at the statements from the service and from your bank with you.',
    },
  },
  {
    id: 'kept-outside-sri-lanka',
    label: 'Kept in an account outside Sri Lanka',
    description:
      'The money stayed in an account held abroad and did not come into Sri Lanka.',
    splitLabel: 'Amount that stayed in an account outside Sri Lanka',
    outcome: { kind: 'not-met' },
  },
  {
    id: MIXTURE_ROUTE_ID,
    label: 'A mixture — an amount against each',
    description:
      'More than one of the routes above describes part of this money. There is a box for each of them below.',
    splitLabel: '',
    outcome: { kind: 'refused', question: 'Q11' },
  },
];

/** The routes a mixture can be split across — every route but the mixture itself. */
export const SPLIT_ROUTES: readonly RemittanceRoute[] = REMITTANCE_ROUTES.filter(
  (route) => route.id !== MIXTURE_ROUTE_ID,
);

export function remittanceRoute(id: string | null): RemittanceRoute | null {
  if (id === null) return null;
  return REMITTANCE_ROUTES.find((route) => route.id === id) ?? null;
}

/**
 * The condition answer that follows from a route, or `null` for "deliberately
 * unanswered".
 *
 * `null` is the whole point of this module. An unresolved route is not a "no":
 * answering it "no" would take the reduced treatment away on a reading of the
 * law nobody has established, and answering it "yes" would grant it on the same
 * footing. Leaving it unanswered keeps the computation incomplete, which is the
 * honest state — "a partial answer is better than a wrong one, and no answer is
 * better than a guess" [`docs/spec/ui-behaviour.md`].
 */
export function conditionAnswerForRoute(route: RemittanceRoute): boolean | null {
  switch (route.outcome.kind) {
    case 'met':
      return true;
    case 'not-met':
      return false;
    case 'unresolved':
    case 'refused':
      return null;
  }
}
