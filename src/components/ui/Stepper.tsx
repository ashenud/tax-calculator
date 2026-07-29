/**
 * Progress through the guided questions: persona → year → questions → result.
 *
 * A `<nav>` containing an ordered list, because that is what it is. The current
 * step carries `aria-current="step"`.
 *
 * STATUS IS NEVER COLOUR ALONE. Each step shows three things: its number or a
 * tick glyph, a visually hidden word ("Completed", "Current step", "Not started
 * yet"), and a border weight. A user who cannot separate the tones still reads
 * the tick and the number.
 *
 * STATE MATRIX
 *
 *   empty     n/a — a stepper always has steps; a zero-step stepper renders
 *             nothing rather than an empty shell.
 *   valid     `complete` — the step has been answered.
 *   invalid   n/a as a *field* state, but a step whose section holds an error
 *             is marked `attention`, which is the seventh status this component
 *             adds: a triangle plus the hidden word "Needs attention", so a
 *             user who has scrolled past a problem can find it again.
 *   disabled  `upcoming` steps are not links. They render as plain text rather
 *             than dead buttons — there is nothing to press and nothing to
 *             explain.
 *   focus     the base layer's ring on the completed steps that are buttons.
 *   hover     background to `--color-accent-subtle` on those same steps.
 */

import { IconAlertTriangle, IconCheck } from './icons.tsx';
import './ui.css';

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'attention';

const STATUS_WORD: Record<StepStatus, string> = {
  complete: 'Completed',
  current: 'Current step',
  upcoming: 'Not started yet',
  attention: 'Needs attention',
};

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
  /**
   * Makes the step activatable. Only supply for steps the user may return to;
   * a step that cannot be reached yet must not be a control.
   */
  onSelect?: () => void;
}

export interface StepperProps {
  /** Names the navigation region. There may be more than one `<nav>` on a page. */
  ariaLabel: string;
  steps: readonly Step[];
}

export function Stepper({ ariaLabel, steps }: StepperProps) {
  if (steps.length === 0) return null;

  return (
    <nav className="ui-stepper" aria-label={ariaLabel}>
      <ol className="ui-stepper__list">
        {steps.map((step, index) => {
          const label = (
            <>
              <span className="ui-stepper__marker" aria-hidden="true">
                {step.status === 'complete' ? (
                  <IconCheck className="ui-stepper__glyph" />
                ) : step.status === 'attention' ? (
                  <IconAlertTriangle className="ui-stepper__glyph" />
                ) : (
                  <span className="ui-stepper__number figure">{index + 1}</span>
                )}
              </span>
              <span className="ui-stepper__text">
                <span className="visually-hidden">{STATUS_WORD[step.status]}: </span>
                {step.label}
              </span>
            </>
          );

          return (
            <li
              key={step.id}
              className="ui-stepper__item"
              data-status={step.status}
              aria-current={step.status === 'current' ? 'step' : undefined}
            >
              {step.onSelect ? (
                <button
                  type="button"
                  className="ui-stepper__control touch-target"
                  onClick={step.onSelect}
                >
                  {label}
                </button>
              ) : (
                <span className="ui-stepper__static">{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
