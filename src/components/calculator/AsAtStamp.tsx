/**
 * The ADR-0003 as-at stamp, for use *inside* the hydrated calculator.
 *
 * WHY THIS EXISTS ALONGSIDE `src/components/AsAtStamp.astro`
 *
 * The stamp goes "beside every computed figure, not only in the page footer,
 * because screenshots are how these figures actually travel" [ADR-0003 decision
 * 2]. The computed figure in this tool is rendered by a React island from
 * client-side state — the year of assessment is chosen in the browser — so the
 * `.astro` component, which renders once at build time, cannot reach it. This
 * is the same stamp in the same words for the client side.
 *
 * The two derivations are shared, not re-implemented: `yearSpanLabel` and
 * `reviewedOnLabel` come from `YearSelector.tsx`, which itself documents them
 * as "the same derivation as `AsAtStamp.astro`, deliberately, so the two never
 * disagree". `src/components/calculator/as-at-stamp.test.ts` asserts this
 * component and the `.astro` one say the same two things.
 *
 * Both props are REQUIRED and neither has a default:
 *
 *   - `yearOfAssessment` is never derived from the clock [CLAUDE.md rule 5].
 *   - `dataReviewedOn` comes from the year's own `lastReviewed`. Defaulting it
 *     to the build date would claim the data was checked on a day nobody
 *     checked it.
 */

import { reviewedOnLabel, yearSpanLabel } from '../ui/index.ts';
import './calculator.css';

export interface AsAtStampProps {
  /** `YYYY/YYYY`, e.g. `2025/2026`. */
  yearOfAssessment: string;
  /** ISO `YYYY-MM-DD` — the day that year's data was last reviewed. */
  dataReviewedOn: string;
}

export function AsAtStamp({ yearOfAssessment, dataReviewedOn }: AsAtStampProps) {
  return (
    <p className="calc-as-at">
      <span className="calc-as-at__line">
        <span className="calc-as-at__label">Year of assessment:</span>
        <span className="calc-as-at__value figure">{yearOfAssessment}</span>
        <span className="calc-as-at__span">({yearSpanLabel(yearOfAssessment)})</span>
      </span>
      <span className="calc-as-at__line">
        Figures as at{' '}
        <time dateTime={dataReviewedOn}>{reviewedOnLabel(dataReviewedOn)}</time>
      </span>
    </p>
  );
}
