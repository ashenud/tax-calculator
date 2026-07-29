/**
 * @vitest-environment jsdom
 *
 * **The acceptance test that matters for P10.**
 *
 * "Condition questions demonstrably come from data: add a condition to a test
 * fixture and it appears in the UI with no code change"
 * [`docs/prompts/P10-calculator-island.md`].
 *
 * What is actually being proved, and why it is worth a file of its own:
 *
 * Sri Lankan tax law changes by amendment act, and the reduced rate on foreign
 * service income already turns on a condition that did not exist before Act No.
 * 2 of 2025. The next amendment may add another. If a condition question is a
 * hand-written form field, that amendment becomes a code change — and a code
 * change nobody makes is a calculator that quietly charges the wrong rate,
 * because the engine will keep asking for an answer the form never collected.
 *
 * So the fixture below is the real Y/A 2025/2026 data with **one condition
 * added and named by the existing rate cap**, re-parsed through the actual Zod
 * schema so it is a data file the loader would accept. Nothing under
 * `src/components/calculator/` is touched, mocked or parameterised for it.
 *
 * Three things are then asserted:
 *
 *   1. the new question is on the page, in the words the data gives it
 *   2. the engine will not produce a figure until it is answered — an
 *      unanswered condition is not a "no"
 *   3. answering it changes the result, so it is a live input and not decoration
 */

import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ROUTE_QUESTION } from './RemittanceRoutePicker.tsx';
import {
  REAL_TAX_YEAR,
  ROUTES,
  answerCondition,
  chooseRoute,
  enterAmount,
  figureText,
  renderCalculator,
  startFlow,
} from './test-driver.tsx';
import { taxYearFileSchema, type TaxYearFile } from '../../lib/tax/schema.ts';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';

installDomPolyfills();
afterEach(cleanup);

const P1 = /overseas clients and get paid in foreign currency/i;
const FOREIGN = /Paid to you by clients outside Sri Lanka/i;

/**
 * The condition this fixture adds. Its wording is invented for the test and is
 * **not** a claim about the law — the `evidence` field says so, and its `src`
 * points at the same provision the cap it hangs off already cites, because the
 * schema requires every `src` to resolve to a source the file declares.
 */
const NEW_CONDITION_ID = 'invoiced-in-the-taxpayers-own-name';
const NEW_CONDITION_QUESTION = 'Were the invoices issued in your own name?';

function taxYearWithAnExtraCondition(): TaxYearFile {
  const capId = Object.keys(REAL_TAX_YEAR.rateCaps)[0]!;
  const cap = REAL_TAX_YEAR.rateCaps[capId]!;

  // A data change and nothing else: a new entry in `conditions`, and its id
  // added to the list the cap already names.
  return taxYearFileSchema.parse({
    ...REAL_TAX_YEAR,
    conditions: {
      ...REAL_TAX_YEAR.conditions,
      [NEW_CONDITION_ID]: {
        question: NEW_CONDITION_QUESTION,
        ifNotMet: null,
        evidence:
          'Constructed for a test of the data model. No primary source is claimed for this condition and it states nothing about the law.',
        src: cap.src,
      },
    },
    rateCaps: {
      ...REAL_TAX_YEAR.rateCaps,
      [capId]: { ...cap, conditions: [...cap.conditions, NEW_CONDITION_ID] },
    },
  });
}

const EXTENDED = taxYearWithAnExtraCondition();

describe('a condition added to the data appears in the UI, with no code change', () => {
  it('is a data file the loader’s own schema accepts', () => {
    // If this fails the rest proves nothing: the point is that a *valid* data
    // file carries a new question, not that the UI renders arbitrary objects.
    expect(() => taxYearFileSchema.parse(EXTENDED)).not.toThrow();
    expect(EXTENDED.conditions[NEW_CONDITION_ID]).toBeDefined();
  });

  it('renders the new question, in the words the data gives it', async () => {
    const { user } = renderCalculator([EXTENDED]);
    await startFlow(user, P1, EXTENDED.yearOfAssessment);
    await enterAmount(user, FOREIGN, '6000000');

    // Verbatim. The component neither paraphrases the question nor knows what
    // it is about.
    expect(
      screen.getByRole('radiogroup', { name: NEW_CONDITION_QUESTION }),
    ).not.toBeNull();
    // And the one that was already there is still asked — as the route picker,
    // which P11 substitutes for that one condition's rendering only.
    expect(screen.getByRole('radiogroup', { name: ROUTE_QUESTION })).not.toBeNull();
  });

  it('does not appear for the unmodified year, so it is the data doing the work', async () => {
    const { user } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, '6000000');

    expect(screen.queryByRole('radiogroup', { name: NEW_CONDITION_QUESTION })).toBeNull();
  });

  it('withholds the figure until the new question is answered too', async () => {
    const { user, container } = renderCalculator([EXTENDED]);
    await startFlow(user, P1, EXTENDED.yearOfAssessment);
    await enterAmount(user, FOREIGN, '6000000');

    // The old condition alone is no longer enough.
    await chooseRoute(user, ROUTES.direct);
    await screen.findByText(/Nothing has been worked out yet/);
    expect(figureText(container)).toBeNull();
    expect(screen.getByRole('button', { name: NEW_CONDITION_QUESTION })).not.toBeNull();

    await answerCondition(user, NEW_CONDITION_QUESTION, 'Yes');
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. [\d,]+$/));
  });

  it('is a live input: answering it "no" takes the cap away and says so', async () => {
    const { user, container } = renderCalculator([EXTENDED]);
    await startFlow(user, P1, EXTENDED.yearOfAssessment);
    await enterAmount(user, FOREIGN, '6000000');
    await chooseRoute(user, ROUTES.direct);
    await answerCondition(user, NEW_CONDITION_QUESTION, 'Yes');

    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. [\d,]+$/));
    const withCap = figureText(container);

    await answerCondition(user, NEW_CONDITION_QUESTION, 'No');
    await waitFor(() => expect(figureText(container)).not.toBe(withCap));

    // The user is told the condition is why, rather than being left to notice
    // that a number moved.
    const warnings = container.querySelector('.ui-warning-list');
    expect(warnings?.textContent).toMatch(/did not meet the condition/i);
  });

  it('shows the condition’s own evidence note and a citation for it', async () => {
    const { user, container } = renderCalculator([EXTENDED]);
    await startFlow(user, P1, EXTENDED.yearOfAssessment);
    await enterAmount(user, FOREIGN, '6000000');

    const evidence = [...container.querySelectorAll('.calc-condition__evidence')].map(
      (node) => node.textContent ?? '',
    );
    expect(evidence.some((text) => text.includes('Constructed for a test'))).toBe(true);

    // A citation, as a real link and never a tooltip.
    const citations = container.querySelectorAll('.calc-condition__citation a');
    expect(citations.length).toBeGreaterThan(0);
    expect(container.querySelector('.calc-condition [title]')).toBeNull();
  });
});

describe('the generic rendering P11 will build on', () => {
  it('is a yes/no radio group per condition, arrow-navigable as one tab stop', async () => {
    const { user } = renderCalculator([EXTENDED]);
    await startFlow(user, P1, EXTENDED.yearOfAssessment);
    await enterAmount(user, FOREIGN, '6000000');

    const group = screen.getByRole('radiogroup', { name: NEW_CONDITION_QUESTION });
    const options = within(group).getAllByRole('radio');
    expect(options.map((option) => option.textContent)).toEqual(['Yes', 'No']);

    await user.click(options[0]!);
    expect(options[0]!.getAttribute('aria-checked')).toBe('true');

    // Held down, then released — Radix moves *and* selects while the arrow is
    // down, which is the WAI-ARIA radio pattern. Same shape as the assertion in
    // `src/components/ui/keyboard.test.tsx`.
    await user.keyboard('{ArrowDown>}');
    try {
      await waitFor(() => expect(options[1]!.getAttribute('aria-checked')).toBe('true'));
    } finally {
      await user.keyboard('{/ArrowDown}');
    }
    expect(document.activeElement).toBe(options[1]);
  });
});
