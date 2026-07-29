/**
 * @vitest-environment jsdom
 *
 * Axe over the calculator in every state it can be in, and a run through the
 * whole flow with nothing but a keyboard.
 *
 * `color-contrast` is disabled for the axe runs, for the same reason
 * `src/dev/gallery.a11y.test.tsx` disables it: axe's contrast check needs real
 * paint, and jsdom performs no layout at all, so the check cannot run
 * meaningfully here. Contrast is checked directly against the OKLCH tokens in
 * `src/styles/tokens.test.ts`, which is a stronger check than sampling pixels
 * and covers both themes. This calculator introduces no colour of its own —
 * every value in `calculator.css` is a token from `global.css`.
 */

import { cleanup, screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { ROUTE_QUESTION } from './RemittanceRoutePicker.tsx';
import {
  ROUTES,
  chooseRoute,
  enterAmount,
  figureText,
  renderCalculator,
  startFlow,
} from './test-driver.tsx';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';

installDomPolyfills();
afterEach(cleanup);

const P1 = /overseas clients and get paid in foreign currency/i;
const P3 = /salary and also do freelance work/i;
const NONE = /None of these/i;
const FOREIGN = /Paid to you by clients outside Sri Lanka/i;
const PAY = /Pay from your job for the whole year/i;

async function expectNoViolations(container: HTMLElement, state: string): Promise<void> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });

  if (results.violations.length > 0) {
    const report = results.violations
      .map((violation) => {
        const targets = violation.nodes
          .map((node) => node.target.join(' '))
          .join('\n    ');
        return `[${violation.impact}] ${violation.id} — ${violation.help}\n    ${targets}\n    ${violation.helpUrl}`;
      })
      .join('\n\n');
    expect.fail(
      `axe found ${results.violations.length} violation(s) in ${state}:\n\n${report}`,
    );
  }

  expect(results.violations).toEqual([]);
  // A scan that found nothing to check would pass "zero violations" vacuously.
  expect(results.passes.length).toBeGreaterThan(0);
}

describe('axe', () => {
  it('is clean at the persona picker, before anything is chosen', async () => {
    const { container } = renderCalculator();
    await expectNoViolations(container, 'the persona picker');
  }, 20_000);

  it('is clean with every question group open and nothing answered', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, NONE);
    await screen.findByText(/Nothing has been worked out yet/);
    await expectNoViolations(container, 'every section open, nothing entered');
  }, 30_000);

  it('is clean with a figure on the page', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, '6000000');
    await chooseRoute(user, ROUTES.direct);
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));
    await expectNoViolations(container, 'a computed figure');
  }, 30_000);

  it('is clean with the route picker flagging an unresolved route', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, '6000000');
    await chooseRoute(user, ROUTES.fxAccount);
    await screen.findByText(/The law does not clearly say how this case is treated/);
    await expectNoViolations(container, 'an unresolved remittance route');
  }, 30_000);

  it('is clean on the mixture refusal, with its amount-per-route boxes', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, '6000000');
    await chooseRoute(user, ROUTES.mixture);
    await screen.findByRole('alert');
    await expectNoViolations(container, 'a mixture of remittance routes');
  }, 30_000);

  it('is clean on a refusal', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P3);
    await enterAmount(user, PAY, '3600000');
    await enterAmount(user, FOREIGN, '2400000');
    await chooseRoute(user, ROUTES.direct);
    await screen.findByRole('alert');
    await expectNoViolations(container, 'a refusal');
  }, 30_000);
});

/* ========================================================================= */

/** Tab until `found()` returns the focused element, or give up loudly. */
async function tabTo(user: UserEvent, found: () => HTMLElement): Promise<HTMLElement> {
  for (let stop = 0; stop < 40; stop += 1) {
    await user.tab();
    if (document.activeElement === found()) return found();
  }
  throw new Error(
    `tabbed 40 times without reaching the expected control; last focus was ${
      document.activeElement?.outerHTML.slice(0, 120) ?? 'nothing'
    }`,
  );
}

describe('the whole flow works with nothing but a keyboard', () => {
  it('reaches a figure without a single mouse event', async () => {
    const { user, container } = renderCalculator();

    // 1. The situation. One tab stop for the group, Space to answer.
    const persona = await tabTo(user, () => screen.getByRole('radio', { name: P1 }));
    await user.keyboard(' ');
    expect(persona.getAttribute('aria-checked')).toBe('true');

    // 2. The year of assessment. Enter opens, Enter chooses.
    const year = await tabTo(user, () =>
      screen.getByRole('combobox', { name: /year of assessment/i }),
    );
    await user.keyboard('{Enter}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(year.textContent).toMatch(/\d{4}\/\d{4}/);

    // 3. Where you lived.
    const residency = await tabTo(user, () =>
      screen.getByRole('radio', { name: /I lived in Sri Lanka for that year/i }),
    );
    await user.keyboard(' ');
    expect(residency.getAttribute('aria-checked')).toBe('true');

    // 4. An amount.
    await tabTo(user, () => screen.getByLabelText(FOREIGN) as HTMLElement);
    await user.keyboard('6000000');

    // 5. The condition — asked here as the route picker, which is a radio
    //    group and is arrow-navigable as one tab stop
    //    [`docs/spec/ui-behaviour.md`, Keyboard and screen reader].
    const firstRoute = await tabTo(
      user,
      () =>
        screen
          .getByRole('radiogroup', { name: ROUTE_QUESTION })
          .querySelector('[role="radio"]') as HTMLElement,
    );
    await user.keyboard(' ');
    expect(firstRoute.getAttribute('aria-checked')).toBe('true');

    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. [\d,]+$/));
  }, 30_000);
});

/* ========================================================================= */

describe('the document outline', () => {
  it('skips no heading level', async () => {
    const { user, container } = renderCalculator();
    await startFlow(user, P1);
    await enterAmount(user, FOREIGN, '6000000');
    await chooseRoute(user, ROUTES.direct);
    await waitFor(() => expect(figureText(container)).toMatch(/^Rs\. /));

    const levels = [...container.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((heading) =>
      Number(heading.tagName.slice(1)),
    );
    expect(levels.length).toBeGreaterThan(0);

    // The island starts at h2 — the page's h1 is in the .astro page above it.
    expect(Math.min(...levels)).toBe(2);
    let previous = 1;
    for (const level of levels) {
      expect(
        level,
        `heading level jumped from h${previous} to h${level}`,
      ).toBeLessThanOrEqual(previous + 1);
      previous = level;
    }
  }, 30_000);
});
