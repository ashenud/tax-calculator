/**
 * @vitest-environment jsdom
 *
 * `YearSelector`: chosen, never assumed.
 *
 * The one thing this suite is really for is the first `describe`. "No default is
 * preselected on first visit" (`docs/spec/ui-behaviour.md` §2) and "defaulting
 * the year of assessment from the system clock and hiding the selector" is
 * listed by ADR-0003 among the changes that need a superseding ADR. A default
 * would be an easy, well-meaning addition, and it would silently give the wrong
 * answer to two of the three ordinary reasons someone opens this tool.
 */

import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  YearSelector,
  countUnverifiedFigures,
  newestFirst,
  reviewedOnLabel,
  toYearOption,
  yearSpanLabel,
  type YearOption,
} from './YearSelector.tsx';
import { loadTaxYears } from '../../lib/tax/load.ts';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';
import { resolveSibling } from '../../test/resolve-sibling.ts';

installDomPolyfills();
afterEach(cleanup);

const loaded = loadTaxYears();
const realYear = loaded[0]!.data;

/** Y/A 2025/2026 as the data actually describes it. */
const REAL: YearOption = toYearOption(realYear);

/** A proposed year. No data file declares one yet, and the badge must work the
 * day one does — so it is constructed here rather than waiting for the data. */
const PROPOSED: YearOption = {
  yearOfAssessment: '2026/2027',
  status: 'proposed',
  lastReviewed: '2026-07-28',
  unverifiedCount: 5,
};

const CLEAN: YearOption = {
  yearOfAssessment: '2024/2025',
  status: 'enacted',
  lastReviewed: '2025-04-01',
  unverifiedCount: 0,
};

const YEARS = [REAL, PROPOSED, CLEAN];

function Harness({ initial = null }: { initial?: string | null }) {
  const [value, setValue] = useState<string | null>(initial);
  return <YearSelector years={YEARS} value={value} onChange={setValue} />;
}

describe('counting unverified figures', () => {
  it('finds every verified:false in the real data file', () => {
    // A second, independent method — a text scan of the serialised file rather
    // than the recursive walk the component uses. If the two ever disagree, one
    // of them is wrong and this fails rather than under-reporting the count.
    const byTextScan = (JSON.stringify(realYear).match(/"verified":false/g) ?? []).length;
    expect(countUnverifiedFigures(realYear)).toBe(byTextScan);
    // Not vacuous: Y/A 2025/2026 really does carry unconfirmed figures.
    expect(countUnverifiedFigures(realYear)).toBeGreaterThan(0);
  });

  it('reads the year’s status and review date straight from the file', () => {
    expect(REAL.status).toBe(realYear.status);
    expect(REAL.lastReviewed).toBe(realYear.lastReviewed);
    expect(REAL.yearOfAssessment).toBe(realYear.yearOfAssessment);
  });
});

describe('labels', () => {
  it('spells the year of assessment out as a span of dates', () => {
    expect(yearSpanLabel('2025/2026')).toBe('1 Apr 2025 – 31 Mar 2026');
  });

  it('formats the review date, and falls back to the raw value if it is not a date', () => {
    expect(reviewedOnLabel('2026-07-28')).toBe('28 July 2026');
    expect(reviewedOnLabel('not-a-date')).toBe('not-a-date');
    // Rolls over rather than being a real date, so it is not reformatted.
    expect(reviewedOnLabel('1999-02-30')).toBe('1999-02-30');
  });

  it('orders years newest first without parsing a date or reading a clock', () => {
    expect(newestFirst(YEARS).map((y) => y.yearOfAssessment)).toEqual([
      '2026/2027',
      '2025/2026',
      '2024/2025',
    ]);
  });

  it('reads no clock anywhere in the component source', () => {
    const source = readFileSync(
      resolveSibling(import.meta.url, './YearSelector.tsx'),
      'utf8',
    );
    expect(source).not.toMatch(/Date\.now|new Date\(\)|getFullYear/);
  });
});

describe('nothing is selected until the user selects it', () => {
  it('renders no option as chosen on first visit', () => {
    render(<Harness />);
    const trigger = screen.getByRole('combobox', { name: /year of assessment/i });
    // Radix marks the trigger with data-placeholder while nothing is chosen.
    expect(trigger.getAttribute('data-placeholder')).not.toBeNull();
    expect(trigger.textContent).toContain('Choose a year of assessment');
    for (const year of YEARS) {
      expect(trigger.textContent).not.toContain(year.yearOfAssessment);
    }
  });

  it('says nothing about any year until one is chosen', () => {
    const { container } = render(<Harness />);
    expect(container.querySelector('.ui-year-selector__summary')).toBeNull();
  });

  it('does not select the newest year, the only year, or today’s year', () => {
    const onChange = vi.fn();
    render(<YearSelector years={[REAL]} value={null} onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
    const trigger = screen.getByRole('combobox', { name: /year of assessment/i });
    expect(trigger.textContent).not.toContain(REAL.yearOfAssessment);
  });

  it('shows the year once the user picks it', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.click(screen.getByRole('combobox', { name: /year of assessment/i }));
    await user.click(
      screen.getByRole('option', { name: new RegExp(REAL.yearOfAssessment) }),
    );

    const summary = container.querySelector('.ui-year-selector__summary');
    expect(summary).not.toBeNull();
    expect(summary!.textContent).toContain(REAL.yearOfAssessment);
  });
});

describe('a proposed year is labelled not yet law', () => {
  it('badges it and carries a caution notice', () => {
    const { container } = render(
      <YearSelector
        years={YEARS}
        value={PROPOSED.yearOfAssessment}
        onChange={() => {}}
      />,
    );

    const summary = container.querySelector('.ui-year-selector__summary')!;
    expect(summary.textContent).toContain('Not yet law');
    // The caution notice, not just the badge — ui-behaviour.md §2 asks for both.
    const notice = summary.querySelector('.ui-callout[data-tone="caution"]');
    expect(notice).not.toBeNull();
    expect(notice!.textContent).toMatch(/not been enacted/i);
    // And not collapsed behind anything.
    expect(summary.querySelector('details')).toBeNull();
  });

  it('does not badge an enacted year as not yet law', () => {
    const { container } = render(
      <YearSelector years={YEARS} value={REAL.yearOfAssessment} onChange={() => {}} />,
    );
    expect(
      container.querySelector('.ui-year-selector__summary')!.textContent,
    ).not.toContain('Not yet law');
  });

  it('marks the proposed year in the option list too', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('combobox', { name: /year of assessment/i }));
    const option = screen.getByRole('option', {
      name: new RegExp(PROPOSED.yearOfAssessment),
    });
    expect(option.textContent).toContain('Not yet law');
  });
});

describe('the unverified-figure count for the selected year', () => {
  it('states the count in a sentence, plural', () => {
    const { container } = render(
      <YearSelector years={YEARS} value={REAL.yearOfAssessment} onChange={() => {}} />,
    );
    const text = container.querySelector('.ui-year-selector__unverified')!.textContent;
    expect(text).toContain(String(REAL.unverifiedCount));
    expect(text).toMatch(/not yet confirmed against primary law/);
  });

  it('uses the singular for one', () => {
    const one: YearOption = { ...CLEAN, unverifiedCount: 1 };
    const { container } = render(
      <YearSelector years={[one]} value={one.yearOfAssessment} onChange={() => {}} />,
    );
    expect(container.querySelector('.ui-year-selector__unverified')!.textContent).toBe(
      '1 figure in this year is not yet confirmed against primary law.',
    );
  });

  it('states the position for a year with none, rather than staying silent', () => {
    const { container } = render(
      <YearSelector years={YEARS} value={CLEAN.yearOfAssessment} onChange={() => {}} />,
    );
    // Deliberately a statement about how the data is *marked*, not a claim that
    // every figure is right. This project does not make claims by omission.
    expect(container.querySelector('.ui-year-selector__unverified')!.textContent).toBe(
      'No figure in this year’s data is marked as unconfirmed against primary law.',
    );
    expect(container.querySelector('.ui-badge')).toBeNull();
  });

  it('badges the affected year as well as counting it', () => {
    const { container } = render(
      <YearSelector years={YEARS} value={REAL.yearOfAssessment} onChange={() => {}} />,
    );
    expect(container.querySelector('.ui-badge')!.textContent).toContain(
      'Not yet confirmed against primary law',
    );
  });
});

describe('no years at all', () => {
  it('says so instead of showing an empty dropdown', () => {
    const { container } = render(
      <YearSelector years={[]} value={null} onChange={() => {}} />,
    );
    expect(container.querySelector('.ui-callout[data-tone="danger"]')).not.toBeNull();
    expect(container.querySelector('.ui-select-trigger')).toBeNull();
  });
});
