/**
 * A radio group whose options are cards big enough to carry a sentence.
 *
 * Built on `@radix-ui/react-radio-group`, which supplies the roving tabindex
 * that makes the group one tab stop with arrow-key movement inside it. That is
 * the behaviour `ui-behaviour.md` requires of the remittance route picker
 * ("Route picker is a radio group, arrow-key navigable"), and it is the part
 * people most often get wrong by building a group out of buttons.
 *
 * OPTIONS ARE DATA. Nothing here knows what a condition question is. P10 and
 * P11 render `taxYear.conditions` into this component's `options` prop; a
 * hardcoded question in a component is prohibited, because an amendment that
 * adds a condition would then need a code change (CLAUDE.md rule 7).
 *
 * STATE MATRIX
 *
 *   empty     `value === null` — nothing preselected, which is the required
 *             starting state everywhere in this tool. A preselected default is
 *             an answer the user did not give.
 *   valid     one card selected. Marked by a filled radio dot and a heavier
 *             border, never by fill colour alone.
 *   invalid   `aria-invalid` on the group plus the message in the shared error
 *             region; the selected-or-not state of individual cards is
 *             untouched, because the fault is with the group.
 *   disabled  the whole group, or one option (`option.disabled`), each with a
 *             visible reason where one is supplied.
 *   focus     the base layer's ring, on whichever card holds roving focus.
 *   hover     border to `--color-accent`; the card is the hit area, not the dot.
 */

import * as RadioGroup from '@radix-ui/react-radio-group';
import { useId } from 'react';
import { IconAlertTriangle } from './icons.tsx';
import './ui.css';

export interface RadioCardOption {
  value: string;
  label: string;
  /** One sentence, in the user's terms. Announced as the option's description. */
  description?: string;
  disabled?: boolean;
  /** Shown beside a disabled option so a dead control is never unexplained. */
  disabledReason?: string;
}

export interface RadioCardGroupProps {
  /** The question. A real group label, not a placeholder and not a heading. */
  legend: string;
  /** `null` is "not answered". There is deliberately no default. */
  value: string | null;
  onValueChange: (value: string) => void;
  options: readonly RadioCardOption[];
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  name?: string;
  id?: string;
}

export function RadioCardGroup({
  legend,
  value,
  onValueChange,
  options,
  hint,
  error = null,
  disabled = false,
  name,
  id,
}: RadioCardGroupProps) {
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const legendId = `${groupId}-legend`;
  const hintId = `${groupId}-hint`;
  const errorId = `${groupId}-error`;

  return (
    <div className="ui-fieldset" data-invalid={error ? '' : undefined}>
      <p className="ui-fieldset__legend" id={legendId}>
        {legend}
      </p>
      {hint && (
        <p className="ui-fieldset__hint" id={hintId}>
          {hint}
        </p>
      )}

      <RadioGroup.Root
        className="ui-radio-cards"
        // `''` is the "nothing selected" sentinel, not `undefined`. No option value in
        // this tool is ever the empty string, so `''` never matches an item — but unlike
        // `undefined`, it keeps Radix in controlled mode from the first render. Passing
        // `undefined` here (Radix's own "uncontrolled" signal) made every group that
        // starts at `null` — which is every group in this tool, since "no default is
        // preselected" [ui-behaviour.md] — warn on the first answer, when `value` turns
        // into a real string: "RadioGroup is changing from uncontrolled to controlled."
        // The translation happens here and nowhere else.
        value={value ?? ''}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
        aria-labelledby={legendId}
        aria-describedby={hint ? `${hintId} ${errorId}` : errorId}
        aria-invalid={error ? true : undefined}
        // Vertical: the cards stack, and Up/Down is what a user expects from a
        // stacked list. Left/Right still work — Radix maps both.
        orientation="vertical"
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          const descriptionId = `${optionId}-description`;
          return (
            <div className="ui-radio-card-row" key={option.value}>
              <RadioGroup.Item
                className="ui-radio-card touch-target"
                value={option.value}
                id={optionId}
                disabled={option.disabled}
                aria-labelledby={`${optionId}-label`}
                aria-describedby={option.description ? descriptionId : undefined}
              >
                <span className="ui-radio-card__mark" aria-hidden="true">
                  <RadioGroup.Indicator className="ui-radio-card__dot" />
                </span>
                <span className="ui-radio-card__text">
                  <span className="ui-radio-card__label" id={`${optionId}-label`}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="ui-radio-card__description" id={descriptionId}>
                      {option.description}
                    </span>
                  )}
                </span>
              </RadioGroup.Item>
              {option.disabled && option.disabledReason && (
                <p className="ui-radio-card__reason">{option.disabledReason}</p>
              )}
            </div>
          );
        })}
      </RadioGroup.Root>

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
