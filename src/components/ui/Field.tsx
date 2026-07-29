/**
 * The scaffolding every input shares: a real label, a persistent hint, and an
 * error region that assistive technology hears about.
 *
 * THREE DECISIONS THAT ARE NOT NEGOTIABLE HERE
 *
 * 1. **There is no `placeholder` prop, anywhere.** A placeholder disappears the
 *    moment someone types, fails contrast in most implementations, and is read
 *    inconsistently by screen readers. `hint` renders as persistent visible
 *    text and is wired through `aria-describedby`, which is what a placeholder
 *    was being misused to do.
 *
 * 2. **The error region is always in the DOM**, empty when there is no error,
 *    and marked `aria-live="polite"`. A region created at the moment it fills
 *    is frequently missed by screen readers; one that already exists announces
 *    reliably. Validation runs on blur (see `ui-behaviour.md`), so this fires
 *    when the user has finished with the field — not while they are still
 *    halfway through a number.
 *
 * 3. **Optionality is stated in words**, not by an asterisk whose meaning has
 *    to be looked up in a legend somewhere else on the page. Fields are
 *    required unless marked, and the marking says "optional".
 */

import type { ReactNode } from 'react';
import { IconAlertTriangle } from './icons.tsx';
import './ui.css';

export interface FieldFrameProps {
  /** Id of the control this labels. Required — the label is a real `<label>`. */
  htmlFor: string;
  label: string;
  /** Persistent helper text. Never a substitute for the label. */
  hint?: string;
  /** Shown when non-empty. `null` is the ordinary "no error" case. */
  error?: string | null;
  optional?: boolean;
  disabled?: boolean;
  /** `${htmlFor}-hint` and `${htmlFor}-error`; supplied by the caller's ids. */
  hintId: string;
  errorId: string;
  children: ReactNode;
}

/**
 * Assemble the `aria-describedby` for a control.
 *
 * The hint is only referenced when it exists; the error region is referenced
 * *always*, because it is always in the DOM and referencing it only when filled
 * would reintroduce the announcement problem note 2 above exists to avoid.
 */
export function describedBy(hintId: string, errorId: string, hasHint: boolean): string {
  return hasHint ? `${hintId} ${errorId}` : errorId;
}

export function FieldFrame({
  htmlFor,
  label,
  hint,
  error,
  optional = false,
  disabled = false,
  hintId,
  errorId,
  children,
}: FieldFrameProps) {
  return (
    <div
      className="ui-field"
      data-invalid={error ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
    >
      <label className="ui-field__label" htmlFor={htmlFor}>
        {label}
        {optional && <span className="ui-field__optional"> (optional)</span>}
      </label>

      {hint && (
        <p className="ui-field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {children}

      {/* Always present, so the live region exists before it has anything to
          say. Empty renders nothing visible — see `.ui-field__error:empty`. */}
      <p className="ui-field__error" id={errorId} aria-live="polite">
        {error && (
          <>
            <IconAlertTriangle className="ui-field__error-icon" />
            {/* The word a sighted user reads from the triangle's shape.
                Colour never carries meaning alone. */}
            <span className="visually-hidden">Error: </span>
            <span>{error}</span>
          </>
        )}
      </p>
    </div>
  );
}
