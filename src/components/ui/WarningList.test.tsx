/**
 * @vitest-environment jsdom
 *
 * `WarningList`: everything renders, nothing collapses, nothing is dropped, and
 * severity is legible without colour.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WarningList } from './WarningList.tsx';
import { SEVERITY_LABEL, UNKNOWN_WARNING_COPY, warningCopy } from './warning-copy.ts';
import { WARNING_CODES, type ResultWarning } from '../../lib/tax/engine.ts';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';

installDomPolyfills();
afterEach(cleanup);

const INFO: ResultWarning = {
  code: WARNING_CODES.qualifyingPaymentTypes,
  severity: 'info',
  message: 'An informational message from the engine.',
};

const WARN: ResultWarning = {
  code: WARNING_CODES.unverifiedRate,
  severity: 'warn',
  message: 'Rate schedule "individual-normal" is marked verified: false.',
};

const BLOCKING: ResultWarning = {
  code: WARNING_CODES.componentNotImplemented,
  severity: 'blocking',
  message: 'No rate is held for this component, so the figure understates the liability.',
};

describe('empty is nothing, not a reassurance', () => {
  it('renders nothing at all when there are no warnings', () => {
    const { container } = render(<WarningList warnings={[]} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('every warning reaches the page', () => {
  it('renders one item per warning, including duplicates of the same code', () => {
    const { container } = render(<WarningList warnings={[WARN, WARN, BLOCKING, INFO]} />);
    expect(container.querySelectorAll('.ui-callout')).toHaveLength(4);
  });

  it('renders the engine message verbatim, not a summary of it', () => {
    render(<WarningList warnings={[WARN]} />);
    expect(screen.getByText(WARN.message)).toBeTruthy();
  });

  it('renders the plain-language wording for the code as the heading', () => {
    render(<WarningList warnings={[WARN]} />);
    expect(
      screen.getByRole('heading', { name: new RegExp(warningCopy(WARN.code).title) }),
    ).toBeTruthy();
  });

  it('renders an unrecognised code on the engine message rather than dropping it', () => {
    const unknown: ResultWarning = {
      code: 'a-code-from-a-later-engine',
      severity: 'warn',
      message: 'Something specific the engine wanted to say.',
    };
    const { container } = render(<WarningList warnings={[unknown]} />);

    expect(container.querySelectorAll('.ui-callout')).toHaveLength(1);
    expect(screen.getByText(unknown.message)).toBeTruthy();
    expect(screen.getByText(UNKNOWN_WARNING_COPY.meaning)).toBeTruthy();
    // The bare code is still shown — it is what a bug report quotes — but it is
    // never the only thing shown.
    expect(container.textContent).toContain(unknown.code);
  });
});

describe('nothing collapses and nothing disappears', () => {
  it('has no disclosure, no dismiss control and nothing hidden', () => {
    const { container } = render(<WarningList warnings={[BLOCKING, WARN, INFO]} />);
    expect(container.querySelector('details')).toBeNull();
    expect(container.querySelector('summary')).toBeNull();
    expect(container.querySelector('[hidden]')).toBeNull();
    expect(container.querySelector('[aria-expanded]')).toBeNull();
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});

describe('severity never rests on colour', () => {
  it.each([
    ['blocking', BLOCKING],
    ['warn', WARN],
    ['info', INFO],
  ] as const)('%s carries its severity in words', (severity, warning) => {
    render(<WarningList warnings={[warning]} />);
    expect(screen.getByText(SEVERITY_LABEL[severity])).toBeTruthy();
  });

  it('carries an icon as well as the words', () => {
    const { container } = render(<WarningList warnings={[BLOCKING]} />);
    const icon = container.querySelector('.ui-callout__icon');
    expect(icon).not.toBeNull();
    // Icons are decorative because the words beside them carry the meaning.
    expect(icon!.getAttribute('aria-hidden')).toBe('true');
  });

  it('maps blocking to the danger tone and warn to caution', () => {
    const { container } = render(<WarningList warnings={[BLOCKING, WARN, INFO]} />);
    const tones = [...container.querySelectorAll('.ui-callout')].map((el) =>
      el.getAttribute('data-tone'),
    );
    expect(tones).toEqual(['danger', 'caution', 'info']);
  });
});

describe('ordering within the list', () => {
  it('puts blocking first and info last, whatever order the engine emitted', () => {
    const { container } = render(<WarningList warnings={[INFO, WARN, BLOCKING]} />);
    const severities = [...container.querySelectorAll('.ui-warning__severity')].map(
      (el) => el.getAttribute('data-severity'),
    );
    expect(severities).toEqual(['blocking', 'warn', 'info']);
  });

  it('is stable — the engine’s own order survives inside a severity', () => {
    const first: ResultWarning = { ...WARN, message: 'first' };
    const second: ResultWarning = { ...WARN, message: 'second' };
    const { container } = render(<WarningList warnings={[first, second, BLOCKING]} />);
    const details = [...container.querySelectorAll('.ui-warning__detail')].map(
      (el) => el.textContent,
    );
    expect(details).toEqual([BLOCKING.message, 'first', 'second']);
  });
});

describe('headings keep the page outline intact', () => {
  it('places each item one level below the list heading', () => {
    const { container } = render(<WarningList warnings={[WARN]} headingLevel={2} />);
    expect(container.querySelector('h2.ui-warning-list__heading')).not.toBeNull();
    expect(container.querySelector('h3.ui-callout__title')).not.toBeNull();
  });
});
