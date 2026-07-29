/**
 * The year of assessment. Chosen, never assumed.
 *
 * "Never infer the year of assessment from the clock. In July 2026 a user could
 * be filing 2025/26, estimating 2026/27, or amending 2023/24. All three are
 * ordinary" [`docs/spec/ui-behaviour.md`]. ADR-0003 lists "defaulting the year
 * of assessment from the system clock and hiding the selector" among the
 * changes that need a superseding ADR.
 *
 * So: **no default is preselected**, on first visit or ever. `value` starts
 * `null` and this component neither picks one nor sorts one to the top and calls
 * it chosen. There is no `Date` in this file, and no reading of any clock.
 *
 * WHAT IT SHOWS FOR THE CHOSEN YEAR — all three from `ui-behaviour.md` §2:
 *
 *   - the option label as `2025/2026 (1 Apr 2025 – 31 Mar 2026)`, because "year
 *     of assessment" is a term a first-time filer has not met
 *   - a **"not yet law" badge and a caution notice** on a `proposed` year
 *     [ADR-0003 decision 4]
 *   - **the count of unverified figures**: "3 figures in this year are not yet
 *     confirmed against primary law"
 *
 * WHERE THE OPTIONS COME FROM. `data/tax-years/*.json`, through
 * `loadTaxYears()` and `toYearOption()`. Nothing about a year is hardcoded here
 * — adding a year of assessment is a data change, not a code change
 * [CLAUDE.md rule 7].
 *
 * STATE MATRIX (the `Select` primitive carries these; see `Select.tsx`)
 *
 *   empty     `value === null` — the trigger shows the prompt, muted, and no
 *             option is ticked. The summary below the control is absent, not
 *             blank: nothing is said about a year nobody has chosen.
 *   valid     a year chosen; label on the trigger, summary below it.
 *   invalid   `error` set: message in the field's live region, danger border,
 *             warning triangle.
 *   disabled  passed through to the trigger.
 *   focus     the base layer's ring; hover, the accent border.
 */

import { Callout } from './Callout.tsx';
import { Select } from './Select.tsx';
import { NotYetLawBadge, UnverifiedBadge } from './UnverifiedBadge.tsx';
import { UI_WARNING_CODES, warningCopy } from './warning-copy.ts';
import type { TaxYearFile } from '../../lib/tax/schema.ts';
import './ui.css';

// ---------------------------------------------------------------------------
// Deriving an option from a tax-year file
// ---------------------------------------------------------------------------

export interface YearOption {
  /** `"2025/2026"`. The value this control emits. */
  yearOfAssessment: string;
  /** From the data file, not from the clock. */
  status: 'proposed' | 'enacted' | 'superseded';
  /** ISO `YYYY-MM-DD` — the day the year's data was last reviewed. */
  lastReviewed: string;
  /**
   * How many objects in that year's data carry `verified: false`. A count of
   * records in this repository, not a tax figure — nothing is computed from it.
   */
  unverifiedCount: number;
}

/**
 * Count the `verified: false` objects in one tax-year file.
 *
 * A generic walk rather than a list of the places `verified` is allowed to
 * appear, for the same reason `schema.ts` collects `src` pointers generically:
 * when the schema grows a new kind of rate object, this keeps counting without
 * anyone remembering to extend it. A hand-maintained list would quietly
 * under-report, and under-reporting *this* number is the failure mode that
 * matters.
 */
export function countUnverifiedFigures(file: TaxYearFile): number {
  let count = 0;
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node !== null && typeof node === 'object') {
      const record = node as Record<string, unknown>;
      if (record['verified'] === false) count += 1;
      for (const value of Object.values(record)) walk(value);
    }
  };
  walk(file);
  return count;
}

export function toYearOption(file: TaxYearFile): YearOption {
  return {
    yearOfAssessment: file.yearOfAssessment,
    status: file.status,
    lastReviewed: file.lastReviewed,
    unverifiedCount: countUnverifiedFigures(file),
  };
}

/**
 * `2025/2026` → `1 Apr 2025 – 31 Mar 2026`.
 *
 * Derived from the year of assessment string, not from `period`, and with no
 * `Date` object: Sri Lanka's year of assessment runs 1 April to 31 March and
 * `schema.ts` enforces exactly that on `period.from` and `period.to`, so the
 * span is a fact about the label rather than a computation over data. Same
 * derivation as `AsAtStamp.astro`, deliberately, so the two never disagree.
 */
export function yearSpanLabel(yearOfAssessment: string): string {
  const [from, to] = yearOfAssessment.split('/');
  if (!from || !to) return yearOfAssessment;
  return `1 Apr ${from} – 31 Mar ${to}`;
}

/** `2026-07-28` → `28 July 2026`. Falls back to the raw string, never to
 * "Invalid Date" — a stamp that reads as an error tells the user nothing. */
export function reviewedOnLabel(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) {
    return iso;
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

/** Newest first. `YYYY/YYYY` is fixed width, so a descending string sort is a
 * descending chronological sort, with no date parsing and no clock. */
export function newestFirst(years: readonly YearOption[]): YearOption[] {
  return [...years].sort((a, b) => b.yearOfAssessment.localeCompare(a.yearOfAssessment));
}

function unverifiedSentence(count: number): string {
  if (count === 0) {
    return 'No figure in this year’s data is marked as unconfirmed against primary law.';
  }
  if (count === 1) {
    return '1 figure in this year is not yet confirmed against primary law.';
  }
  return `${count} figures in this year are not yet confirmed against primary law.`;
}

// ---------------------------------------------------------------------------
// The component
// ---------------------------------------------------------------------------

export interface YearSelectorProps {
  /** From `loadTaxYears().map(({ data }) => toYearOption(data))`. */
  years: readonly YearOption[];
  /** `null` until the user chooses. Never seeded from the clock. */
  value: string | null;
  onChange: (yearOfAssessment: string) => void;
  label?: string;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  id?: string;
  /** Heading level for the caution notice on a proposed year. */
  headingLevel?: 2 | 3 | 4 | 5;
}

export function YearSelector({
  years,
  value,
  onChange,
  label = 'Year of assessment',
  hint = 'Sri Lanka’s year of assessment runs 1 April to 31 March. Choose the year you are working out, not the year it is now.',
  error = null,
  disabled = false,
  id,
  headingLevel = 3,
}: YearSelectorProps) {
  const ordered = newestFirst(years);
  const selected =
    value === null ? null : (ordered.find((y) => y.yearOfAssessment === value) ?? null);

  if (ordered.length === 0) {
    // Not an empty dropdown. A control with nothing in it invites the reading
    // that the tool covers no years, when in fact its data failed to arrive.
    return (
      <Callout
        tone="danger"
        title="No years of assessment are available"
        headingLevel={headingLevel}
      >
        <p>
          This build carries no tax-year data, so nothing can be worked out. That is a
          fault in the site, not in anything you entered.
        </p>
      </Callout>
    );
  }

  const options = ordered.map((year) => {
    const notes: string[] = [];
    if (year.status === 'proposed') notes.push('Not yet law');
    if (year.unverifiedCount > 0) notes.push(unverifiedSentence(year.unverifiedCount));
    return {
      value: year.yearOfAssessment,
      label: `${year.yearOfAssessment} (${yearSpanLabel(year.yearOfAssessment)})`,
      ...(notes.length > 0 ? { note: notes.join(' · ') } : {}),
    };
  });

  const proposedCopy = warningCopy(UI_WARNING_CODES.proposedYear);

  return (
    <div className="ui-year-selector">
      <Select
        label={label}
        prompt="Choose a year of assessment"
        hint={hint}
        options={options}
        value={value}
        onValueChange={onChange}
        error={error}
        disabled={disabled}
        id={id}
      />

      {selected && (
        <div className="ui-year-selector__summary">
          <p className="ui-year-selector__facts">
            <span className="ui-year-selector__year figure">
              {selected.yearOfAssessment}
            </span>
            <span className="ui-year-selector__span">
              {yearSpanLabel(selected.yearOfAssessment)}
            </span>
            <span className="ui-year-selector__reviewed">
              Data last reviewed{' '}
              <time dateTime={selected.lastReviewed}>
                {reviewedOnLabel(selected.lastReviewed)}
              </time>
            </span>
          </p>

          <p className="ui-year-selector__badges">
            {selected.status === 'proposed' && (
              <NotYetLawBadge yearOfAssessment={selected.yearOfAssessment} />
            )}
            {selected.unverifiedCount > 0 && (
              <UnverifiedBadge
                what={
                  selected.unverifiedCount === 1
                    ? '1 figure in this year'
                    : `${selected.unverifiedCount} figures in this year`
                }
                compact
              />
            )}
          </p>

          {/* The count is stated in full text as well as on the badge: the badge
              is a marker, and a marker is not a sentence. */}
          <p className="ui-year-selector__unverified">
            {unverifiedSentence(selected.unverifiedCount)}
          </p>

          {selected.status === 'proposed' && (
            <Callout
              tone="caution"
              title={proposedCopy.title}
              headingLevel={headingLevel}
            >
              <p>{proposedCopy.meaning}</p>
            </Callout>
          )}
        </div>
      )}
    </div>
  );
}
