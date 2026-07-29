/**
 * A single-line text input.
 *
 * STATE MATRIX
 *
 *   empty     `value === ''`. The label and hint carry the prompt; there is no
 *             placeholder, and nothing is shown that could be mistaken for a
 *             value the user supplied.
 *   valid     filled, `aria-invalid` absent. No green tick: a tick on a field
 *             the tool has not actually checked is a claim it cannot support.
 *   invalid   `aria-invalid="true"`, the message in the live error region, and
 *             a red-*and*-thicker border, because colour never carries meaning
 *             alone. Set by the caller after blur, never on keystroke.
 *   disabled  real `disabled`; the whole field dims and the border drops to the
 *             decorative token.
 *   focus     the base layer's ring (P01). Not restated.
 *   hover     border moves to `--color-accent`, 150ms.
 *
 * Validation is the caller's, deliberately. A generic text field cannot know
 * what a TIN or a name should look like; `CurrencyField` owns its own rules
 * because money is the one case where the rule is universal.
 */

import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { describedBy, FieldFrame } from './Field.tsx';
import './ui.css';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'className' | 'placeholder' | 'type' | 'id'
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  disabled?: boolean;
  /** Supply to make the id stable across renders; otherwise `useId` provides one. */
  id?: string;
  /** Renders in the tabular numeric face. For reference numbers, not amounts. */
  numeric?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error = null,
  optional = false,
  disabled = false,
  id,
  numeric = false,
  onBlur,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  return (
    <FieldFrame
      htmlFor={fieldId}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      disabled={disabled}
      hintId={hintId}
      errorId={errorId}
    >
      <input
        // `type="text"` and never `type="number"`. The spinner on a number
        // input changes a declared figure on a stray scroll wheel, and this
        // repository exists because of figures that were quietly wrong.
        type="text"
        id={fieldId}
        className={numeric ? 'ui-input figure' : 'ui-input'}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId, Boolean(hint))}
        onChange={(event) => onChange(event.currentTarget.value)}
        onBlur={onBlur}
        {...rest}
      />
    </FieldFrame>
  );
}
