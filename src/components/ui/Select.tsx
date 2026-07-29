/**
 * A select, on `@radix-ui/react-select`.
 *
 * WHY NOT A NATIVE `<select>`
 * The native control cannot carry a second line of text per option, and the
 * year selector (P09) has to show "not yet law" and "3 figures unconfirmed"
 * against a year. Radix gives the full listbox keyboard contract — Enter/Space
 * and Alt+Down to open, Up/Down/Home/End to move, type-ahead to jump, Escape to
 * close with focus returned to the trigger — which is precisely the contract a
 * hand-rolled dropdown fails to honour.
 *
 * THE TRIGGER HAS A REAL `<label>`. `<button>` is a labelable element in HTML,
 * so `<label for="…">` associates properly and clicking the label opens the
 * list. This is not the `aria-label` shortcut; the label is visible text, and
 * the "placeholder" is an empty-state prompt shown *in addition to* it, never
 * instead of it.
 *
 * STATE MATRIX
 *
 *   empty     `value === null`: the trigger shows the prompt in muted text and
 *             `data-state="empty"`. No option is preselected — the year of
 *             assessment in particular is never defaulted (ADR-0003).
 *   valid     an option chosen; the trigger shows its label.
 *   invalid   `aria-invalid` on the trigger, message in the live error region,
 *             danger border plus a warning triangle.
 *   disabled  real `disabled` on the trigger, or per option.
 *   focus     the base layer's ring on the trigger; inside the open list, Radix
 *             moves `data-highlighted` and the item carries a visible
 *             background *and* a tick — not colour alone.
 *   hover     trigger border to accent; item background to accent-subtle.
 */

import * as SelectPrimitive from '@radix-ui/react-select';
import { useId } from 'react';
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
} from './icons.tsx';
import './ui.css';

export interface SelectOption {
  value: string;
  label: string;
  /** Second line inside the option. Announced with the option. */
  note?: string;
  disabled?: boolean;
}

export interface SelectProps {
  label: string;
  /** `null` is "nothing chosen". */
  value: string | null;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  /** Empty-state prompt shown on the trigger. Never a substitute for `label`. */
  prompt: string;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export function Select({
  label,
  value,
  onValueChange,
  options,
  prompt,
  hint,
  error = null,
  disabled = false,
  id,
  name,
}: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="ui-field" data-invalid={error ? '' : undefined}>
      <label className="ui-field__label" htmlFor={fieldId}>
        {label}
      </label>
      {hint && (
        <p className="ui-field__hint" id={hintId}>
          {hint}
        </p>
      )}

      <SelectPrimitive.Root
        // `''` is the "nothing chosen" sentinel, not `undefined` — see the same note in
        // RadioCardGroup.tsx. `undefined` is Radix's own "uncontrolled" signal, and a
        // year-of-assessment selector always starts at `null` per ui-behaviour.md ("No
        // default is preselected on first visit"), so every first choice warned React
        // about switching from uncontrolled to controlled. `SelectPrimitive.Value`
        // falls back to `placeholder` whenever `value` matches no item, so `''` renders
        // identically to `undefined` here — no option in this tool is ever `''`.
        value={value ?? ''}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectPrimitive.Trigger
          id={fieldId}
          className="ui-select-trigger touch-target"
          data-state-value={value === null ? 'empty' : 'chosen'}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint ? `${hintId} ${errorId}` : errorId}
        >
          <SelectPrimitive.Value placeholder={prompt} />
          <SelectPrimitive.Icon className="ui-select-trigger__icon">
            <IconChevronDown />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="ui-select-content"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.ScrollUpButton className="ui-select-scroll">
              <IconChevronUp />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="ui-select-viewport">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="ui-select-item touch-target"
                >
                  <span className="ui-select-item__mark" aria-hidden="true">
                    <SelectPrimitive.ItemIndicator>
                      <IconCheck />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <span className="ui-select-item__text">
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                    {option.note && (
                      <span className="ui-select-item__note">{option.note}</span>
                    )}
                  </span>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="ui-select-scroll">
              <IconChevronDown />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      <p className="ui-field__error" id={errorId} aria-live="polite">
        {error && (
          <>
            <IconAlertTriangle className="ui-field__error-icon" />
            <span className="visually-hidden">Error: </span>
            <span>{error}</span>
          </>
        )}
      </p>
    </div>
  );
}
