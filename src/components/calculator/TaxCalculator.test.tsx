/**
 * @vitest-environment jsdom
 *
 * The calculator, driven the way a person drives it.
 *
 * Four of this prompt's acceptance criteria are behavioural and are checked
 * here rather than argued for in a comment:
 *
 *   - every persona reaches a result for a case its own persona document calls
 *     computable, and p3's blocked branch reaches a refusal instead
 *   - changing persona mid-flow loses nothing
 *   - a user on persona p2 can still open the investment section
 *   - recomputation is debounced 300ms and the figure lands in a polite live
 *     region
 *
 * The data-driven condition question — the acceptance test that matters most —
 * has a file of its own: `conditions-from-data.test.tsx`.
 */

import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { conditionsForCappedIncome } from './model.ts';
import {
  REAL_TAX_YEAR,
  answerCondition,
  choosePersona,
  enterAmount,
  figureText,
  renderCalculator,
  startFlow,
} from './test-driver.tsx';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';

installDomPolyfills();
afterEach(cleanup);

const P1 = /overseas clients and get paid in foreign currency/i;
const P2 = /employed but no tax is deducted/i;
const P3 = /salary and also do freelance work/i;
const P4 = /interest, dividends or rent/i;

/** Read from the data, never named here. */
const CONDITION = conditionsForCappedIncome(REAL_TAX_YEAR)[0]!;

const PAY = /Pay from your job for the whole year/i;
const FOREIGN = /Paid to you by clients outside Sri Lanka/i;
const INTEREST = /Interest, before any tax was taken off/i;

/* ========================================================================= */

describe('the persona picker', () => {
  it('offers the four situations and a way out of all of them', () => {
    renderCalculator();
    for (const situation of [P1, P2, P3, P4]) {
      expect(screen.getByRole('radio', { name: situation })).not.toBeNull();
    }
    expect(screen.getByRole('radio', { name: /None of these/i })).not.toBeNull();
  });

  it('preselects nothing, and asks for a year before any figure', async () => {
    const { user } = renderCalculator();
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.getAttribute('aria-checked')).toBe('false');
    }
    // The year of assessment step does not exist until a situation is picked,
    // and no year is preselected when it does.
    expect(screen.queryByRole('combobox', { name: /year of assessment/i })).toBeNull();

    await choosePersona(user, P2);
    const trigger = screen.getByRole('combobox', { name: /year of assessment/i });
    expect(trigger.textContent).toMatch(/Choose a year of assessment/);
    expect(trigger.textContent).not.toMatch(/\d{4}\/\d{4}/);
  });
});

/* ========================================================================= */

describe('the persona routes but does not constrain', () => {
  it('opens the employment questions for p2 and not the investment ones', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P2);

    expect(screen.getByLabelText(PAY)).not.toBeNull();
    expect(screen.queryByLabelText(INTEREST)).toBeNull();
    expect(container.querySelector('[data-section="investment"]')).toBeNull();
  });

  it('lets a user on p2 open the investment section anyway', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P2);

    await user.click(
      screen.getByRole('button', { name: /Add interest, dividends or rent/i }),
    );

    expect(container.querySelector('[data-section="investment"]')).not.toBeNull();
    expect(screen.getByLabelText(INTEREST)).not.toBeNull();

    // And it is usable, not merely present.
    await enterAmount(user, INTEREST, '900000');
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));
  });

  it('keeps every entered figure when the persona changes mid-flow', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P2);
    await enterAmount(user, PAY, '3600000');
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));
    const before = figureText(container);

    // Change of situation, several steps in.
    await choosePersona(user, P4);

    // The figure is still entered, still visible, and still being taxed — the
    // employment section stays on screen because it holds an amount, so nothing
    // can be counted while off-screen.
    expect((screen.getByLabelText(PAY) as HTMLInputElement).value).toBe('3,600,000');
    expect(container.querySelector('[data-section="employment"]')).not.toBeNull();
    await waitFor(() => expect(figureText(container)).toBe(before));

    // And p4's own sections have opened alongside it.
    expect(screen.getByLabelText(INTEREST)).not.toBeNull();
  });
});

/* ========================================================================= */

describe('every persona reaches a result for a case its own document calls computable', () => {
  it('p1 — paid by overseas clients, remitted', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, '6000000');
    await answerCondition(user, CONDITION.condition.question, 'Yes');

    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. [\d,]+$/));
  });

  it('p2 — a salary with nothing deducted', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P2);
    await enterAmount(user, PAY, '3600000');
    await enterAmount(user, /Tax an employer already deducted/i, '0');

    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. [\d,]+$/));
  });

  it('p3 — salary plus foreign income that was not remitted: both on one ladder', async () => {
    // "Note the tractable branch: if the freelance income was **not** remitted,
    // everything sits on the normal ladder and the case is a straightforward
    // aggregation" [docs/personas/p3-mixed-employment-business.md].
    const { user, container } = renderCalculator();
    await startFlow(user, P3);
    await enterAmount(user, PAY, '3600000');
    await enterAmount(user, FOREIGN, '2400000');
    await answerCondition(user, CONDITION.condition.question, 'No');

    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. [\d,]+$/));
  });

  it('p3 — the same figures remitted: a refusal, and no figure anywhere', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P3);
    await enterAmount(user, PAY, '3600000');
    await enterAmount(user, FOREIGN, '2400000');
    await answerCondition(user, CONDITION.condition.question, 'Yes');

    const refusal = await screen.findByRole('alert');
    expect(refusal.textContent).toMatch(/We are not going to guess at your tax/);
    expect(refusal.textContent).toMatch(/No figure has been computed/);
    // ADR-0003 decision 5: the refusal replaces the figure entirely.
    expect(figureText(container)).toBeNull();
  });

  it('p4 — a leaving payment, once its length of service is given', async () => {
    // The length-of-service question hangs off the tag, not off the field's
    // name, and the Act has no safe default for it: the two tables differ
    // materially, so the figure waits until it is answered.
    const { user, container } = renderCalculator();
    await startFlow(user, P4);
    await enterAmount(user, /The payment you received for leaving/i, '4000000');

    await screen.findByText(/Nothing has been worked out yet/);
    expect(figureText(container)).toBeNull();

    await user.type(
      screen.getByLabelText(/How many whole years you worked there/i),
      '19',
    );
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. [\d,]+$/));
  });

  it('p1 — overseas tax on the same income, once the date it was paid is given', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, '6000000');
    await answerCondition(user, CONDITION.condition.question, 'Yes');
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));
    const before = figureText(container);

    // The date is not asked until there is a figure for it to be about.
    expect(screen.queryByLabelText(/The date that overseas tax was paid/i)).toBeNull();
    await enterAmount(user, /Tax another country already took off/i, '300000');

    await screen.findByText(/Nothing has been worked out yet/);
    await user.type(
      screen.getByLabelText(/The date that overseas tax was paid/i),
      '2026-07-15',
    );

    await waitFor(() => expect(figureText(container)).not.toBe(before));
  });

  it('p4 — interest with tax withheld', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P4);
    await enterAmount(user, INTEREST, '2400000');
    await enterAmount(user, /Tax already withheld on interest/i, '240000');

    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. [\d,]+$/));
  });
});

/* ========================================================================= */

describe('empty is not zero', () => {
  it('shows no figure at all until something has been entered', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P2);

    await screen.findByText(/Nothing has been worked out yet/);
    expect(figureText(container)).toBeNull();
    expect(container.textContent).not.toMatch(/Rs\.\s*0\b/);
  });

  it('does not compute while a condition on capped income is unanswered', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, '6000000');

    await screen.findByText(/Nothing has been worked out yet/);
    expect(figureText(container)).toBeNull();

    // The gap is listed by the question it is about, and answering it from
    // there moves focus to the control that answers it.
    const gap = screen.getByRole('button', { name: CONDITION.condition.question });
    await user.click(gap);
    const group = screen.getByRole('radiogroup', { name: CONDITION.condition.question });
    expect(group.contains(document.activeElement)).toBe(true);

    await user.click(within(group).getByRole('radio', { name: 'Yes' }));
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));
  });
});

/* ========================================================================= */

describe('the states that produce no figure', () => {
  it('shows the engine’s own refusal, and no amount, when it declines a combination', async () => {
    // Expenses against a head that also holds separately-rated income: how the
    // deduction divides is not specified anywhere, and the engine will not
    // guess. It is not a user error and it is not a bug.
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, '6000000');
    await answerCondition(user, CONDITION.condition.question, 'Yes');
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));

    await enterAmount(user, /What it cost you to do that work/i, '400000');

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/We are not going to guess at your tax/);
    // The engine's own words, naming the provision it stopped on.
    expect(alert.textContent).toMatch(/not specified in docs\/spec/);
    expect(figureText(container)).toBeNull();
    expect(container.textContent).not.toMatch(/Rs\.\s*0\b/);
  });

  it('keeps the last figure and marks it stale when an entry cannot be read', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P2);
    await enterAmount(user, PAY, '3600000');
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));
    const before = figureText(container);

    // A half-typed decimal: unreadable, and not something to silently round.
    await enterAmount(user, PAY, '3600000.5');

    await screen.findByText(/cannot be read at the moment/);
    // Not blanked — the user has not deleted anything.
    expect(figureText(container)).toBe(before);
    expect(container.querySelector('.calc-figure')?.hasAttribute('data-stale')).toBe(
      true,
    );
  });
});

/* ========================================================================= */

describe('recomputation', () => {
  it('waits 300ms after the last change, and announces politely', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P2);
    await screen.findByText(/Nothing has been worked out yet/);

    vi.useFakeTimers();
    try {
      const input = screen.getByLabelText(PAY);
      fireEvent.change(input, { target: { value: '3600000' } });

      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(figureText(container)).toBeNull();

      act(() => {
        vi.advanceTimersByTime(1);
      });

      const figure = container.querySelector('.calc-figure');
      expect(figure?.textContent).toMatch(/^Rs\. [\d,]+$/);

      // Announced by the one live region the result has — `RefusalPanel`'s.
      // A second one would say the same figure twice.
      const live = container.querySelectorAll('[aria-live="polite"]');
      const regionsHoldingTheFigure = [...live].filter((region) =>
        region.contains(figure!),
      );
      expect(regionsHoldingTheFigure).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
