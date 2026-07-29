/**
 * `TaxResult.warnings`, rendered in full, above the figure, always expanded.
 *
 * ADR-0003 decision 3: "Warnings render above the result, expanded. Below the
 * result or behind a disclosure triangle is equivalent to absent."
 *
 * WHAT THIS COMPONENT WILL NOT DO
 *
 *   - It has no collapsed state, no "show more", no item limit and no summary
 *     count standing in for the items. Every warning is on the page.
 *   - It is not a live region and it is not a toast. A warning that announces
 *     itself once and disappears has not been given to the user.
 *   - It never filters. A warning the UI has no wording for still renders, on
 *     the engine's own `message` — see `warning-copy.ts`.
 *
 * POSITION IS NOT THIS COMPONENT'S TO GUARANTEE, AND IT IS GUARANTEED ANYWAY.
 * A caller could in principle place this below a figure. `RefusalPanel` exists
 * so that nobody has to: it renders this list and then the figure, in that
 * order, in one element, and that is the composition P10 uses. See
 * `RefusalPanel.tsx`.
 *
 * SEVERITY IS NEVER COLOUR ALONE. Each item carries the tone's distinctly
 * shaped icon, a visible severity label in words, and the heading in the tone's
 * `-strong` text token (a status colour cannot carry body text — P01 measured
 * `--color-caution` at 3.62:1 on surface).
 *
 * STATE MATRIX
 *
 *   empty     no warnings: renders **nothing at all**, not an empty box and not
 *             "no warnings". A reassurance is a claim, and this component is not
 *             the thing that has checked.
 *   populated one item per warning, sorted blocking-first, stable within.
 *
 *   valid / invalid / disabled / focus / hover do not apply: it holds no value
 *   and takes no input. Any link inside an item inherits focus and hover from
 *   the base layer.
 */

import { Callout } from './Callout.tsx';
import {
  SEVERITY_LABEL,
  SEVERITY_RANK,
  SEVERITY_TONE,
  warningCopy,
} from './warning-copy.ts';
import type { ResultWarning } from '../../lib/tax/engine.ts';
import './ui.css';

export interface WarningListProps {
  /** `TaxResult.warnings`, verbatim. Never pre-filtered by the caller. */
  warnings: readonly ResultWarning[];
  /**
   * Heading level for the list's own heading. Items sit one level below it, so
   * the page outline has no skipped level. Defaults to 3.
   */
  headingLevel?: 2 | 3 | 4;
  /**
   * The list's heading. The default is written as an instruction to read on
   * rather than as a category name, because "Warnings" is a word people scroll
   * past.
   */
  heading?: string;
  id?: string;
}

/** Stable sort: blocking, then warn, then info; engine order kept within each. */
function bySeverity(
  warnings: readonly ResultWarning[],
): { warning: ResultWarning; index: number }[] {
  return warnings
    .map((warning, index) => ({ warning, index }))
    .sort((a, b) => {
      const rank =
        (SEVERITY_RANK[a.warning.severity] ?? SEVERITY_RANK['info']!) -
        (SEVERITY_RANK[b.warning.severity] ?? SEVERITY_RANK['info']!);
      return rank !== 0 ? rank : a.index - b.index;
    });
}

export function WarningList({
  warnings,
  headingLevel = 3,
  heading = 'Read this before the figure',
  id,
}: WarningListProps) {
  if (warnings.length === 0) return null;

  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const itemLevel = (headingLevel + 1) as 3 | 4 | 5;
  const headingId = `${id ?? 'warnings'}-heading`;

  return (
    <section className="ui-warning-list" id={id} aria-labelledby={headingId}>
      <Heading className="ui-warning-list__heading" id={headingId}>
        {heading}
      </Heading>

      {bySeverity(warnings).map(({ warning, index }) => {
        const copy = warningCopy(warning.code);
        const severity = warning.severity;
        const tone = SEVERITY_TONE[severity] ?? 'caution';
        const label = SEVERITY_LABEL[severity] ?? SEVERITY_LABEL.warn;

        return (
          <Callout
            // The code is not unique — `unverified-rate` can fire more than once
            // in one computation — so the engine's own position is part of the key.
            key={`${warning.code}-${index}`}
            tone={tone}
            title={copy.title}
            headingLevel={itemLevel}
            footer={
              // The raw code, visible. It is what a bug report, a practitioner
              // and this repository's own docs all refer to, and a user who
              // cannot quote it cannot ask about it.
              <p className="ui-warning__code">
                Reference: <code>{warning.code}</code>
              </p>
            }
          >
            <p className="ui-warning__severity" data-severity={severity}>
              <span className="visually-hidden">Severity: </span>
              {label}
            </p>
            <p className="ui-warning__meaning">{copy.meaning}</p>
            {/* Straight from `TaxResult`. It carries the amounts and the
                citation; nothing here re-words or re-computes it. */}
            <p className="ui-warning__detail">{warning.message}</p>
          </Callout>
        );
      })}
    </section>
  );
}
