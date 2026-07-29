/**
 * Sits on any figure whose underlying data carries `verified: false`.
 *
 * `docs/spec/ui-behaviour.md`, states table: "Unverified data — `UnverifiedBadge`
 * on the affected line, plus a warning listing which figures are unconfirmed."
 * The badge is the marker on the line; `WarningList` carries the `unverified-rate`
 * warning above the figure. Both, not either.
 *
 * "Unverified" here has one specific meaning, from CLAUDE.md rule 3: the value
 * has not been confirmed against a primary source in `docs/sources/`. It is not
 * a guess about whether the value is right — it is a statement about whether
 * anybody has checked.
 *
 * NEVER COLOUR ALONE. The badge is a caution triangle *and* the words "Not yet
 * confirmed", in the caution `-strong` text token. Removing the words and
 * keeping the triangle, or keeping a colour and dropping both, fails a user
 * reading in greyscale, a user printing the page, and a user with a screen
 * reader — all three at once.
 *
 * NOT A TOOLTIP. `docs/spec/ui-design-system.md` prohibits a tooltip as the only
 * carrier of something a user must see, and this is one of them. The words are
 * on the page.
 *
 * STATE MATRIX
 *
 *   The badge has one state. It is present when the data says `verified: false`
 *   and absent otherwise; it holds no value and takes no input, so empty /
 *   valid / invalid / disabled / focus / hover do not apply. There is
 *   deliberately no "verified" counterpart badge: marking the confirmed figures
 *   would turn an unmarked figure into an implicit claim, and this project does
 *   not make claims by omission.
 */

import { IconAlertTriangle, IconNote } from './icons.tsx';
import './ui.css';

export interface UnverifiedBadgeProps {
  /**
   * What is unconfirmed, in a few words — "the capital gains rate". Read out
   * after the badge text so a screen-reader user hears which figure it is on,
   * and displayed where there is room.
   */
  what?: string;
  /** Renders the label inline and compact, for use inside a table cell. */
  compact?: boolean;
}

export function UnverifiedBadge({ what, compact = false }: UnverifiedBadgeProps) {
  return (
    <span
      className="ui-badge"
      data-tone="caution"
      data-compact={compact ? '' : undefined}
    >
      <IconAlertTriangle className="ui-badge__icon" />
      <span className="ui-badge__text">
        Not yet confirmed against primary law
        {what && <span className="ui-badge__what"> — {what}</span>}
      </span>
    </span>
  );
}

export interface NotYetLawBadgeProps {
  /** The year of assessment this is said about. Never inferred from the clock. */
  yearOfAssessment: string;
}

/**
 * "Not yet law", for a tax year whose data carries `status: "proposed"`.
 *
 * ADR-0003 decision 4 requires this "everywhere their figures appear", and
 * lists "presenting a `proposed` year's figures without the not-yet-law label"
 * among the things that need a superseding ADR. It lives beside
 * `UnverifiedBadge` because the two answer different questions about the same
 * figure — *has anyone checked this?* and *is this in force?* — and a reader
 * needs both answers separately.
 */
export function NotYetLawBadge({ yearOfAssessment }: NotYetLawBadgeProps) {
  return (
    <span className="ui-badge" data-tone="caution">
      <IconNote className="ui-badge__icon" />
      <span className="ui-badge__text">
        Not yet law
        <span className="visually-hidden"> — year of assessment {yearOfAssessment}</span>
      </span>
    </span>
  );
}
