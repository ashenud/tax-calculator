/**
 * CurrencyField — the one that matters.
 *
 * Money entry is where calculators lose people. Everything below is a
 * consequence of that sentence.
 *
 * ── WHAT LEAVES THIS COMPONENT ──────────────────────────────────────────────
 *
 * `onChange` is called with `number | null` and nothing else. Never a string,
 * never a formatted string, never `NaN`, never a float. The comma-separated
 * text is a property of the view; it is written by `displayForTyping` and read
 * by nobody. Formatting never re-enters the model.
 *
 * `null` means **not entered**. It does not mean zero, and a caller that writes
 * `value ?? 0` has broken the invariant this component exists to hold. `0`
 * means the user typed a zero — a declared nil, which is a different statement
 * and produces different output.
 *
 * ── WHEN IT LEAVES ──────────────────────────────────────────────────────────
 *
 * On every keystroke that parses, so the result panel can update live
 * (`ui-behaviour.md`: valid → "result updates live, debounced 300ms"; the
 * debounce belongs to the consumer, not to the field).
 *
 * On a keystroke that does NOT parse, nothing is emitted at all. The model
 * keeps the last figure it was given, which is exactly what `ui-behaviour.md`'s
 * invalid state describes — "the result panel retains the last valid figure,
 * visibly marked stale". `onValidityChange` is how the consumer learns to mark
 * it stale. Emitting `null` here instead would silently blank a figure the user
 * has not deleted.
 *
 * ── WHEN THE ERROR APPEARS ──────────────────────────────────────────────────
 *
 * On blur. Not on keystroke. Telling someone that "12" is wrong while they are
 * still typing "1200" is hostile, and this tool's users are already anxious.
 * An error that has been earned clears as soon as the entry parses again.
 *
 * ── WHY type="text" ─────────────────────────────────────────────────────────
 *
 * `type="number"` brings a spinner and scroll-to-change. A mis-scroll over a
 * focused field silently alters a figure the user is going to declare to the
 * IRD, and they will not see it happen. `inputMode="numeric"` gets the phone
 * keypad, which is the only thing `type="number"` was wanted for.
 */

import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import {
  caretAfterFormat,
  displayForTyping,
  formatRupees,
  parseRupees,
} from './currency.ts';
import { describedBy, FieldFrame } from './Field.tsx';
import './ui.css';

export interface CurrencyFieldValidity {
  valid: boolean;
  /** The refusal message when invalid; `null` when valid. */
  message: string | null;
}

export interface CurrencyFieldProps {
  label: string;
  /**
   * Integer rupees, or `null` for "not entered".
   *
   * There is no default. A default of `0` would render `Rs. 0` into a field
   * nobody has filled in, which tells the user a computation happened when it
   * did not.
   */
  value: number | null;
  /** Receives integer rupees or `null`. Never a string, never a float. */
  onChange: (value: number | null) => void;
  /**
   * Called on blur, and whenever an earned error clears. Consumers use this to
   * mark a displayed figure stale while the field is unreadable.
   */
  onValidityChange?: (validity: CurrencyFieldValidity) => void;
  hint?: string;
  /**
   * An error from outside the field — a cross-field rule, say. Shown in the
   * same region as a parse refusal; the parse refusal wins if both are present,
   * because the field cannot be read at all in that case.
   */
  error?: string | null;
  optional?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  /** Marks the field as part of an unfinished section. Purely presentational. */
  autoComplete?: string;
}

/** STATE MATRIX
 *
 *   empty     `value === null` and the box is blank. Never `Rs. 0`, never `0`.
 *             `data-state="empty"` is on the wrapper for anyone styling it.
 *   valid     parses to an integer; `aria-invalid` absent; the figure is
 *             regrouped on blur ("1,2,3,4" → "1,234").
 *   invalid   a parse refusal after blur: `aria-invalid="true"`, the message in
 *             the live region, a thicker border in `--color-danger` *and* a
 *             warning triangle, because colour never carries meaning alone.
 *   disabled  real `disabled`.
 *   focus     the base layer's 2px ring, plus the wrapper picks up the accent
 *             border via `:focus-within` so the `Rs.` adornment stays part of
 *             the same visual control.
 *   hover     border to `--color-accent`, 150ms.
 */
export function CurrencyField({
  label,
  value,
  onChange,
  onValidityChange,
  hint,
  error = null,
  optional = false,
  disabled = false,
  id,
  name,
  autoComplete = 'off',
}: CurrencyFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const inputRef = useRef<HTMLInputElement | null>(null);
  /** Caret offset to restore after regrouping has moved the separators. */
  const pendingCaret = useRef<number | null>(null);
  /** True while the user is in the field; suppresses prop-driven rewrites. */
  const editing = useRef(false);

  const [text, setText] = useState(() => formatRupees(value));
  const [parseError, setParseError] = useState<string | null>(null);

  /**
   * Pull the display back into line with the model when the model changes from
   * outside — a reset button, a persona switch clearing a section.
   *
   * Guarded on `editing` so a controlled parent re-rendering mid-keystroke
   * cannot yank characters out from under the caret. This runs during render
   * rather than in an effect so there is no frame in which the field shows a
   * figure the model no longer holds.
   */
  const [lastValue, setLastValue] = useState<number | null>(value);
  if (value !== lastValue && !editing.current) {
    setLastValue(value);
    setText(formatRupees(value));
    setParseError(null);
  }

  useLayoutEffect(() => {
    const caret = pendingCaret.current;
    pendingCaret.current = null;
    if (
      caret !== null &&
      inputRef.current &&
      document.activeElement === inputRef.current
    ) {
      inputRef.current.setSelectionRange(caret, caret);
    }
  }, [text]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.currentTarget.value;
      const caret = event.currentTarget.selectionStart ?? raw.length;

      // Separators go in WHILE TYPING. `displayForTyping` regroups a clean run
      // of digits and echoes anything else back untouched, so a half-typed
      // "12." is still visible to the person typing it.
      const display = displayForTyping(raw);
      pendingCaret.current = caretAfterFormat(raw, caret, display);
      setText(display);

      const result = parseRupees(display);
      if (result.ok) {
        // `result.value` is an integer or null. Nothing else can be here.
        setLastValue(result.value);
        onChange(result.value);
        if (parseError !== null) {
          setParseError(null);
          onValidityChange?.({ valid: true, message: null });
        }
      }
      // Unparseable: emit nothing, say nothing. The model keeps its last good
      // figure and the message waits for blur.
    },
    [onChange, onValidityChange, parseError],
  );

  const handleBlur = useCallback(() => {
    editing.current = false;
    const result = parseRupees(text);

    if (result.ok) {
      // Normalise what is shown to the canonical grouping, now that the user
      // has finished. "1,2,3,4" becomes "1,234"; "0007" becomes "7".
      setText(formatRupees(result.value));
      setLastValue(result.value);
      setParseError(null);
      onChange(result.value);
      onValidityChange?.({ valid: true, message: null });
      return;
    }

    // Refused. Nothing is emitted — no rounded figure, no null, no zero.
    setParseError(result.message);
    onValidityChange?.({ valid: false, message: result.message });
  }, [onChange, onValidityChange, text]);

  const shownError = parseError ?? error;
  const isEmpty = text === '';

  return (
    <FieldFrame
      htmlFor={fieldId}
      label={label}
      hint={hint}
      error={shownError}
      optional={optional}
      disabled={disabled}
      hintId={hintId}
      errorId={errorId}
    >
      <div
        className="ui-currency"
        data-state={isEmpty ? 'empty' : shownError ? 'invalid' : 'valid'}
      >
        {/* Decorative: the unit is stated in words in the hint, which is what
            `aria-describedby` carries. Repeating "Rs." into the accessible
            name would have it read before every figure the user reviews. */}
        <span className="ui-currency__unit" aria-hidden="true">
          Rs.
        </span>
        <input
          ref={inputRef}
          id={fieldId}
          name={name}
          // NEVER type="number". See the header comment.
          type="text"
          inputMode="numeric"
          // Digits, separators and a currency prefix. Not a strict grammar —
          // the browser uses this to pick a keypad, and the real rule is
          // `parseRupees`. A pattern that rejected pasted text would be worse
          // than none.
          autoComplete={autoComplete}
          autoCorrect="off"
          spellCheck={false}
          // Tabular figures. Reuses P01's `figure` utility from global.css
          // rather than restating font-variant-numeric here.
          className="ui-input ui-currency__input figure"
          value={text}
          disabled={disabled}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedBy(hintId, errorId, Boolean(hint))}
          onFocus={() => {
            editing.current = true;
          }}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </div>
    </FieldFrame>
  );
}
