/**
 * The persona picker's cards.
 *
 * `ui-behaviour.md` writes each persona as a situation rather than a category —
 * "I work for overseas clients and get paid in foreign currency", not "foreign
 * service income". Statutory categories are the tool's problem to resolve, not
 * the user's, and this component's shape follows from that: a first-person
 * sentence as the option's name, and a short list of what the choice will ask
 * about, so a user can tell whether they are in the right place before
 * committing to a path.
 *
 * WHY IT IS A RADIO GROUP AND NOT A SET OF LINKS
 * Choosing a persona is answering a question, not navigating. It has to be
 * changeable — `ui-behaviour.md` draws the "change persona" arrow back from
 * every later step — and a radio group makes the current answer visible and
 * reversible. Radix supplies the roving tabindex, so the whole picker is one
 * tab stop with arrow-key movement, which is what the WAI-ARIA radio pattern
 * requires.
 *
 * WHY IT IS SEPARATE FROM `RadioCardGroup`
 * Same primitive, different content contract: a persona card carries a
 * `covers` list and a "none of these" escape hatch that must always be present.
 * `ui-behaviour.md` is explicit that the persona is "a routing convenience, not
 * a constraint" and that "a misrouted user must not be trapped", so the escape
 * hatch is part of the component rather than something each caller remembers.
 *
 * STATE MATRIX
 *
 *   empty     `value === null`. No persona is preselected — the tool does not
 *             guess who the user is.
 *   valid     one card selected: filled radio dot, heavier border, tick-free
 *             (the dot is the non-colour signal).
 *   invalid   group-level, via `error` — "Choose the situation closest to
 *             yours, or 'none of these'".
 *   disabled  whole group. Individual personas are never disabled: every
 *             persona is always available, by design.
 *   focus     the base layer's ring on the card holding roving focus.
 *   hover     border to `--color-accent`; the whole card is the hit area.
 */

import * as RadioGroup from '@radix-ui/react-radio-group';
import { useId } from 'react';
import { IconAlertTriangle } from './icons.tsx';
import './ui.css';

export interface Persona {
  /** Persona id from `docs/personas/` — `p1`, `p2`, … */
  id: string;
  /** First person, present tense, describing a situation. */
  situation: string;
  /** What choosing this will ask about. Short noun phrases. */
  covers?: readonly string[];
}

export interface PersonaCardGroupProps {
  /** The question above the cards. */
  legend: string;
  hint?: string;
  personas: readonly Persona[];
  value: string | null;
  onValueChange: (id: string) => void;
  /**
   * The escape hatch's id and wording. Always rendered. Defaults to the copy in
   * `ui-behaviour.md`; a caller may reword it but cannot remove it.
   */
  noneOption?: { id: string; situation: string };
  error?: string | null;
  disabled?: boolean;
  id?: string;
}

const DEFAULT_NONE = {
  id: 'none',
  situation: 'None of these, or I am not sure',
} as const;

export function PersonaCardGroup({
  legend,
  hint,
  personas,
  value,
  onValueChange,
  noneOption = DEFAULT_NONE,
  error = null,
  disabled = false,
  id,
}: PersonaCardGroupProps) {
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const legendId = `${groupId}-legend`;
  const hintId = `${groupId}-hint`;
  const errorId = `${groupId}-error`;

  const all: readonly Persona[] = [
    ...personas,
    {
      id: noneOption.id,
      situation: noneOption.situation,
      covers: ['Every section is available'],
    },
  ];

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
        className="ui-persona-cards"
        // `''` is the "nothing chosen" sentinel, not `undefined` — see the same note in
        // RadioCardGroup.tsx. `undefined` is Radix's own "uncontrolled" signal, and this
        // group always starts at `null`, so every first choice warned React about
        // switching from uncontrolled to controlled.
        value={value ?? ''}
        onValueChange={onValueChange}
        disabled={disabled}
        aria-labelledby={legendId}
        aria-describedby={hint ? `${hintId} ${errorId}` : errorId}
        aria-invalid={error ? true : undefined}
        orientation="vertical"
      >
        {all.map((persona) => {
          const optionId = `${groupId}-${persona.id}`;
          const coversId = `${optionId}-covers`;
          return (
            <RadioGroup.Item
              key={persona.id}
              className="ui-persona-card touch-target"
              value={persona.id}
              id={optionId}
              aria-labelledby={`${optionId}-situation`}
              aria-describedby={persona.covers?.length ? coversId : undefined}
            >
              <span className="ui-persona-card__mark" aria-hidden="true">
                <RadioGroup.Indicator className="ui-persona-card__dot" />
              </span>
              <span className="ui-persona-card__text">
                <span className="ui-persona-card__situation" id={`${optionId}-situation`}>
                  {persona.situation}
                </span>
                {persona.covers && persona.covers.length > 0 && (
                  <span className="ui-persona-card__covers" id={coversId}>
                    {persona.covers.join(' · ')}
                  </span>
                )}
              </span>
            </RadioGroup.Item>
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
