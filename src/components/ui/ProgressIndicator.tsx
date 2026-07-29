/**
 * How far through the questions the user is, on `@radix-ui/react-progress`.
 *
 * **The number is text, not just a bar.** Radix supplies the `progressbar` role
 * and the `aria-valuenow`/`aria-valuemin`/`aria-valuemax` triple; this
 * component insists on a visible caption as well ("Question 3 of 8"), because a
 * bar's fill is a colour-and-length signal and colour never carries meaning
 * alone. On a 320px screen the difference between 60% and 70% of a 200px bar is
 * 20 pixels; the words are what the user actually reads.
 *
 * NOT FOR TAX FIGURES. This shows progress through a form. It is not a gauge of
 * liability, and there is no variant that fills proportionally to an amount —
 * ADR-0003's prohibition on animating a tax figure would be trivially defeated
 * by a bar that grows as a figure changes.
 *
 * STATE MATRIX
 *
 *   empty          `value === 0` — started, nothing answered. Distinct from…
 *   indeterminate  `value === null` — the total is unknown. Radix sets
 *                  `data-state="indeterminate"` and omits `aria-valuenow`,
 *                  which is the correct ARIA for "working, length unknown".
 *   valid          0 < value <= max, caption showing both numbers.
 *   invalid        n/a — progress is derived from state the user cannot enter
 *                  wrongly.
 *   disabled       n/a — not a control; it has no tab stop and takes no input.
 *   focus / hover  n/a for the same reason.
 */

import * as Progress from '@radix-ui/react-progress';
import { useId } from 'react';
import './ui.css';

export interface ProgressIndicatorProps {
  /** Completed units, or `null` for indeterminate. */
  value: number | null;
  max: number;
  /**
   * The visible caption. Written by the caller so the words fit the context —
   * "Question 3 of 8", "Section 2 of 5". Also names the progress bar.
   */
  label: string;
  id?: string;
}

export function ProgressIndicator({ value, max, label, id }: ProgressIndicatorProps) {
  const generatedId = useId();
  const barId = id ?? generatedId;
  const labelId = `${barId}-label`;

  const percent = value === null || max <= 0 ? 0 : Math.min(100, (value / max) * 100);

  return (
    <div className="ui-progress">
      <p className="ui-progress__label" id={labelId}>
        {label}
      </p>
      <Progress.Root
        className="ui-progress__track"
        value={value}
        max={max}
        id={barId}
        aria-labelledby={labelId}
      >
        <Progress.Indicator
          className="ui-progress__fill"
          // The only inline style in the component set, and unavoidable: the
          // fill's width IS the datum. It is a computed percentage, not a
          // hardcoded size, so there is no token it could resolve to.
          style={{ inlineSize: `${percent}%` }}
        />
      </Progress.Root>
    </div>
  );
}
