/**
 * Button.
 *
 * STATE MATRIX — the six P08 asks for, and what each means here:
 *
 *   empty     n/a. A button holds no value; the "nothing yet" case belongs to
 *             the field it submits, not to the control. Documented rather than
 *             invented, per the prompt's instruction to use judgment and say so.
 *   valid     n/a for the same reason.
 *   invalid   n/a. A button is not a value-bearing control. Where a form cannot
 *             be submitted, the error lives on the field and in the error
 *             summary — never as a red button with no explanation.
 *   disabled  real `disabled`, not `aria-disabled`, and always paired with a
 *             visible reason supplied by the caller (`disabledReason`) so the
 *             user is never left pressing a dead control and guessing.
 *   focus     inherited from the base layer's `:focus-visible` ring. Not
 *             restated here — one definition, one place (P01).
 *   hover     background and border shift, 150ms, `--duration-state`.
 *   busy      a seventh state this component does add: `busy` keeps the control
 *             focusable and announces via `aria-busy`. Nothing in the
 *             calculator is asynchronous (the computation is local and
 *             synchronous), so it exists only for the print/export affordances
 *             that P15 will need.
 *
 * `type` defaults to `"button"`. HTML's default is `"submit"`, which means a
 * button dropped into a form without a `type` submits it — on a tax form that
 * is a figure sent somewhere the user did not intend.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './ui.css';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'
> {
  /**
   * `primary` for the one action a screen is about; `secondary` for the
   * alternatives; `quiet` for tertiary actions inside dense areas; `danger`
   * for anything that discards what the user has entered.
   */
  variant?: ButtonVariant;
  /** Fills its container. Used on mobile, where a full-width target is easier. */
  block?: boolean;
  /**
   * Why the button is disabled. Rendered as visible text beside it. A disabled
   * control with no explanation is the commonest way an interface loses someone
   * who is already anxious.
   */
  disabledReason?: string;
  busy?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  block = false,
  disabled = false,
  disabledReason,
  busy = false,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const button = (
    <button
      type={type}
      className="ui-button touch-target"
      data-variant={variant}
      data-block={block ? '' : undefined}
      disabled={disabled}
      aria-busy={busy || undefined}
      {...rest}
    >
      {children}
    </button>
  );

  if (!disabled || !disabledReason) return button;

  return (
    <span className="ui-button-group">
      {button}
      <span className="ui-button__reason">{disabledReason}</span>
    </span>
  );
}
