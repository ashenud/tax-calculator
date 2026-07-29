/**
 * @vitest-environment jsdom
 *
 * **The acceptance test for P11**, and the closest thing this repository has to
 * a test of its own reason for existing.
 *
 * "Every other calculator either does not ask, or asks a yes/no. Getting this
 * right is the project's reason for existing"
 * [`docs/prompts/P11-remittance-route-picker.md`].
 *
 * Each `describe` below is one of that prompt's acceptance criteria:
 *
 *   1. kept offshore → the ladder result *and* a warning naming the condition
 *   2. a mixture of routes → a refusal, with no figure anywhere
 *   3. an unresolved route → flagged, and no treatment silently picked
 *   4. identical gross income, direct-to-bank against offshore → materially
 *      different tax, and both paths explain themselves
 *   5. no copy anywhere in the picker recommends routing money one way
 *
 * Everything goes through `user-event`, so what is asserted is what a person
 * gets rather than what a prop signature suggests.
 */

import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  REMITTANCE_ROUTES,
  conditionAnswerForRoute,
  isRemittanceCondition,
} from './remittance-routes.ts';
import { ROUTE_QUESTION } from './RemittanceRoutePicker.tsx';
import { conditionsForCappedIncome } from './model.ts';
import {
  REAL_TAX_YEAR,
  ROUTES,
  chooseRoute,
  enterAmount,
  figureText,
  renderCalculator,
  startFlow,
} from './test-driver.tsx';
import { UI_REFUSAL_CODES, UI_WARNING_CODES } from '../ui/index.ts';
import { WARNING_CODES } from '../../lib/tax/engine.ts';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';

installDomPolyfills();
afterEach(cleanup);

const P1 = /overseas clients and get paid in foreign currency/i;
const FOREIGN = /Paid to you by clients outside Sri Lanka/i;

/** Read from the data, never named here. */
const CONDITION = conditionsForCappedIncome(REAL_TAX_YEAR)[0]!;

/** One gross figure, used on every path, so only the route ever differs. */
const GROSS = '6000000';

function routePicker(): HTMLElement {
  return screen.getByRole('radiogroup', { name: ROUTE_QUESTION });
}

function warningsText(container: HTMLElement): string {
  return container.querySelector('.ui-warning-list')?.textContent ?? '';
}

/* ========================================================================= */

describe('the shape of the question', () => {
  it('replaces the yes/no for exactly one condition, and for no other', () => {
    expect(isRemittanceCondition(CONDITION.id)).toBe(true);
    expect(isRemittanceCondition('some-condition-a-later-act-adds')).toBe(false);
  });

  it('offers the five routes from the spec, and nothing preselected', async () => {
    const { user } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, GROSS);

    const options = within(routePicker()).getAllByRole('radio');
    expect(options).toHaveLength(5);
    for (const option of options) {
      // No default. A preselected route is an answer the user did not give,
      // on the input that moves the liability most.
      expect(option.getAttribute('aria-checked')).toBe('false');
    }

    // The condition's own words are still on the page, with a real citation
    // link rather than a tooltip — the tool says what it is resolving, it does
    // not merely resolve it.
    expect(
      screen.getByText(CONDITION.condition.question, { exact: false }),
    ).not.toBeNull();
    expect(
      document.querySelectorAll('.calc-condition__citation a').length,
    ).toBeGreaterThan(0);
  });

  it('is not reducible to a yes/no: no such control is on the page', async () => {
    const { user } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, GROSS);

    expect(
      screen.queryByRole('radiogroup', { name: CONDITION.condition.question }),
    ).toBeNull();
    expect(within(routePicker()).queryByRole('radio', { name: 'Yes' })).toBeNull();
    expect(within(routePicker()).queryByRole('radio', { name: 'No' })).toBeNull();
  });
});

/* ========================================================================= */

describe('1. kept offshore — the ladder, and a warning saying why', () => {
  it('produces a figure and names the condition as the reason', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, GROSS);
    await chooseRoute(user, ROUTES.offshore);

    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. [\d,]+$/));

    // The engine's own warning, above the figure, expanded, with the code
    // visible — the user must learn the condition exists.
    const warnings = warningsText(container);
    expect(warnings).toMatch(WARNING_CODES.rateCapConditionNotMet);
    expect(warnings).toMatch(/did not meet the condition/i);
    expect(warnings).toContain(CONDITION.id);
  });

  it('says so where the choice was made, as well as beside the figure', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, GROSS);
    await chooseRoute(user, ROUTES.offshore);

    const inline = container.querySelector('.calc-routes')?.textContent ?? '';
    expect(inline).toMatch(/the reduced treatment does not apply to this money/i);
    // The inline note carries no amount of its own: figures belong to the
    // engine's message, not to wording written in a component.
    expect(inline).not.toMatch(/Rs\./);
  });

  it('is a live input: the same money by a different route moves the figure', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, GROSS);
    await chooseRoute(user, ROUTES.offshore);
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));
    const offshore = figureText(container);

    await chooseRoute(user, ROUTES.direct);
    await waitFor(() => expect(figureText(container)).not.toBe(offshore));
    // And the warning goes with it — nothing failed the condition any more.
    expect(warningsText(container)).not.toMatch(WARNING_CODES.rateCapConditionNotMet);
  });
});

/* ========================================================================= */

describe('2. a mixture of routes — a refusal, with no figure', () => {
  it('refuses the whole computation and shows no amount anywhere', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, GROSS);
    await chooseRoute(user, ROUTES.mixture);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/We are not going to guess at your tax/);
    expect(alert.textContent).toContain(UI_REFUSAL_CODES.partialRemittanceMixture);
    expect(alert.textContent).toContain('Q11');

    // ADR-0003 decision 5. Not a small figure, not a zero — none at all.
    expect(figureText(container)).toBeNull();
    expect(container.textContent).not.toMatch(/Rs\.\s*0\b/);

    // The year of assessment is still stated on a refusal [CLAUDE.md rule 5].
    expect(alert.textContent).toContain(REAL_TAX_YEAR.yearOfAssessment);
  });

  it('takes an amount against each route, and computes nothing from them', async () => {
    // "A mixture — enter an amount against each" [`docs/spec/ui-behaviour.md`].
    // The amounts are a record to take to a practitioner, and the refusal
    // stands whatever is entered in them.
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, GROSS);
    await chooseRoute(user, ROUTES.mixture);

    await enterAmount(user, /^Amount that came by direct transfer/, '4000000');
    await enterAmount(user, /^Amount that stayed in an account outside/, '2000000');

    await screen.findByRole('alert');
    expect(figureText(container)).toBeNull();
    // No total, no subtotal: nothing here adds anything up.
    expect(container.querySelector('.calc-route-split')?.textContent).not.toMatch(
      /total/i,
    );
  });

  it('does not refuse over money nobody has entered yet', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await chooseRoute(user, ROUTES.mixture);

    await screen.findByText(/Nothing has been worked out yet/);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(figureText(container)).toBeNull();
  });
});

/* ========================================================================= */

describe('3. an unresolved route — flagged, and nothing decided', () => {
  const unresolved = [
    {
      name: 'a foreign-currency account at a Sri Lankan bank',
      route: ROUTES.fxAccount,
      question: 'Q13',
    },
    { name: 'Wise, Payoneer or PayPal', route: ROUTES.intermediary, question: 'Q41' },
  ] as const;

  for (const { name, route, question } of unresolved) {
    it(`${name} — says the law is unclear and works nothing out (${question})`, async () => {
      const { user, container } = renderCalculator();
      await startFlow(user, P1);
      await enterAmount(user, FOREIGN, GROSS);
      await chooseRoute(user, route);

      const inline = container.querySelector('.calc-routes')?.textContent ?? '';
      // The shared wording for exactly this case, in the user's terms.
      expect(inline).toMatch(/The law does not clearly say how this case is treated/);
      expect(inline).toMatch(/We are not going to guess at your tax/);
      expect(inline).toContain(UI_WARNING_CODES.conditionUnresolved);
      // Named, so the refusal is not a dead end: which question, and who settles it.
      expect(inline).toContain(question);
      expect(inline).toMatch(/qualified tax practitioner/);

      // Nothing decided: no figure, and the condition is still unanswered.
      await screen.findByText(/Nothing has been worked out yet/);
      expect(figureText(container)).toBeNull();
      expect(container.textContent).not.toMatch(/Rs\.\s*0\b/);
      expect(
        screen.getAllByText(CONDITION.condition.question, { exact: false }).length,
      ).toBeGreaterThan(0);
      // Still listed as a question to answer, not quietly treated as a "no".
      expect(
        screen.getByRole('button', { name: CONDITION.condition.question }),
      ).not.toBeNull();
    });
  }

  it('does not silently pick "not met": no condition-failure warning appears', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, GROSS);
    await chooseRoute(user, ROUTES.fxAccount);

    await screen.findByText(/Nothing has been worked out yet/);
    expect(warningsText(container)).not.toMatch(WARNING_CODES.rateCapConditionNotMet);
  });

  it('leaves the underlying condition genuinely unanswered, in the model', () => {
    for (const route of REMITTANCE_ROUTES) {
      const answer = conditionAnswerForRoute(route);
      if (route.outcome.kind === 'met') expect(answer).toBe(true);
      else if (route.outcome.kind === 'not-met') expect(answer).toBe(false);
      // `null`, not `false`. Answering an unresolved route "no" would take the
      // reduced treatment away on a reading nobody has established.
      else expect(answer).toBeNull();
    }
  });
});

/* ========================================================================= */

describe('4. the contrast the project exists to show', () => {
  it('same gross income, direct to bank against kept offshore, is materially different tax', async () => {
    // Persona p1's whole case: "Same gross income, different answer, and
    // nothing in her experience tells her the question exists"
    // [`docs/personas/p1-wfh-foreign-consultant.md`].
    const remitted = renderCalculator();
    await startFlow(remitted.user, P1);
    await enterAmount(remitted.user, FOREIGN, GROSS);
    await chooseRoute(remitted.user, ROUTES.direct);
    await waitFor(() => expect(figureText(remitted.container)).toMatch(/^Rs\. [\d,]+$/));
    const remittedFigure = figureText(remitted.container)!;
    cleanup();

    const offshore = renderCalculator();
    await startFlow(offshore.user, P1);
    await enterAmount(offshore.user, FOREIGN, GROSS);
    await chooseRoute(offshore.user, ROUTES.offshore);
    await waitFor(() => expect(figureText(offshore.container)).toMatch(/^Rs\. [\d,]+$/));
    const offshoreFigure = figureText(offshore.container)!;

    const rupees = (text: string): number => Number(text.replace(/[^\d]/g, ''));
    expect(rupees(offshoreFigure)).toBeGreaterThan(rupees(remittedFigure));
    // "Materially": not a rounding difference somebody could miss.
    expect(rupees(offshoreFigure) - rupees(remittedFigure)).toBeGreaterThan(100_000);
  });

  it('both paths explain themselves', async () => {
    // The offshore path is explained by the engine's warning; the remitted path
    // by the working and its citations. Neither is a bare number.
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, GROSS);

    await chooseRoute(user, ROUTES.offshore);
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));
    expect(warningsText(container)).toMatch(/maximum rate did not apply/i);

    await chooseRoute(user, ROUTES.direct);
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));
    // The as-at stamp sits beside the figure on both, per ADR-0003 decision 2.
    expect(container.querySelector('.calc-as-at')).not.toBeNull();
  });
});

/* ========================================================================= */

describe('5. the copy recommends nothing', () => {
  /**
   * A smoke check, not a substitute for someone reading it. "Suggest that one
   * route would be better than another … is advice, and it is prohibited by
   * rule 6 of CLAUDE.md" [P11].
   */
  const ADVICE = [
    /\bbetter\b/i,
    /\bbest\b/i,
    /\bprefer/i,
    /\brecommend/i,
    /\badvis(e|able)/i,
    /\bshould\b/i,
    /\bavoid\b/i,
    /\bsave (tax|money)\b/i,
    /\breduce your (tax|liability)\b/i,
    /\binstead of\b/i,
    /\bif you had\b/i,
    /\bwould have (paid|owed)\b/i,
  ];

  function expectNoAdvice(text: string, where: string): void {
    for (const pattern of ADVICE) {
      expect(pattern.test(text), `${where} matched ${pattern}: ${text}`).toBe(false);
    }
  }

  it('none of the five route labels or descriptions reads as a suggestion', () => {
    for (const route of REMITTANCE_ROUTES) {
      expectNoAdvice(route.label, `route label "${route.id}"`);
      expectNoAdvice(route.description, `route description "${route.id}"`);
      expectNoAdvice(route.splitLabel, `split label "${route.id}"`);
    }
  });

  it('nor does anything the picker renders, on any of the five routes', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, GROSS);

    for (const route of Object.values(ROUTES)) {
      await chooseRoute(user, route);
      const picker = container.querySelector('.calc-routes')?.textContent ?? '';
      expect(picker.length).toBeGreaterThan(0);
      expectNoAdvice(picker, `the picker on ${String(route)}`);
    }
  });

  it('never compares one route with another, or names a figure of its own', () => {
    for (const route of REMITTANCE_ROUTES) {
      const outcome = route.outcome;
      const text =
        outcome.kind === 'unresolved'
          ? outcome.detail
          : `${route.label} ${route.description}`;
      // No rupee amount, no percentage: every figure a user sees comes from
      // `TaxResult` [CLAUDE.md rule 1, the "UI never computes" rule].
      expect(text).not.toMatch(/Rs\.|\d+\s*%/);
    }
  });
});
