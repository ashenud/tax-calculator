/**
 * A bordered notice: information, caution, danger, confirmation, plain note.
 *
 * WHAT THIS COMPONENT WILL NOT DO, AND WHY
 *
 * There is **no dismiss control and no collapse**. ADR-0003 prohibits
 * collapsing a warning, refusal or disclaimer behind a disclosure, and this is
 * the component those are built from (P09's `WarningList` and `RefusalPanel`).
 * A `collapsible` prop added here in a later tidy-up would quietly undo that
 * decision everywhere at once, so the prop does not exist and
 * `Callout.test.tsx` asserts the rendered markup contains no `<details>`,
 * `<summary>` or dismiss button.
 *
 * There is also no `toast` variant. A warning that disappears has not been
 * given to the user.
 *
 * COLOUR NEVER CARRIES MEANING ALONE. Each tone renders three signals: a
 * distinctly *shaped* icon (triangle / octagon / circle / tick / document), a
 * visually hidden word naming the tone for anyone not reading the shape, and a
 * heading in the tone's `-strong` text token. Per P01's measurements a status
 * colour cannot carry its own body text — `--color-caution` is 3.62:1 on
 * surface — so text uses `-strong` and the base token is confined to the icon
 * and the border.
 *
 * STATE MATRIX
 *
 *   The states P08 lists are states of an *input*. A callout holds no value and
 *   takes no input, so empty / valid / invalid / disabled / focus / hover do
 *   not apply to it; its variation is tonal. This is documented rather than
 *   faked, per the prompt's instruction to use judgment and say which were
 *   skipped. The one interactive element a callout may contain — a link in its
 *   body — inherits focus and hover from the base layer.
 */

import type { ReactNode } from 'react';
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconInfo,
  IconNote,
  IconOctagonAlert,
} from './icons.tsx';
import './ui.css';

export type CalloutTone = 'info' | 'caution' | 'danger' | 'positive' | 'neutral';

const TONE: Record<
  CalloutTone,
  { icon: typeof IconInfo; /** Read out; not painted. */ word: string }
> = {
  info: { icon: IconInfo, word: 'Information' },
  caution: { icon: IconAlertTriangle, word: 'Warning' },
  danger: { icon: IconOctagonAlert, word: 'Important' },
  positive: { icon: IconCheckCircle, word: 'Confirmed' },
  neutral: { icon: IconNote, word: 'Note' },
};

export interface CalloutProps {
  tone?: CalloutTone;
  /** Required. A notice with no heading is a wall of text nobody triages. */
  title: string;
  /**
   * Heading level, so the page keeps a real outline with no skipped levels.
   * Defaults to 3 — callouts normally sit inside an h2 section.
   */
  headingLevel?: 2 | 3 | 4 | 5;
  children?: ReactNode;
  /** Rendered under the body: citations, an as-at stamp, a link onward. */
  footer?: ReactNode;
  id?: string;
}

export function Callout({
  tone = 'info',
  title,
  headingLevel = 3,
  children,
  footer,
  id,
}: CalloutProps) {
  const { icon: Glyph, word } = TONE[tone];
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5';
  const headingId = id ? `${id}-title` : undefined;

  return (
    <section
      className="ui-callout"
      data-tone={tone}
      id={id}
      aria-labelledby={headingId}
      // A callout is a region of interest, not a landmark. `role` is left off
      // deliberately: P09's RefusalPanel adds `role="alert"`, and a nested
      // alert inside an alert would announce twice.
    >
      <Glyph className="ui-callout__icon" />
      <div className="ui-callout__body">
        <Heading className="ui-callout__title" id={headingId}>
          <span className="visually-hidden">{word}: </span>
          {title}
        </Heading>
        {children && <div className="ui-callout__content">{children}</div>}
        {footer && <div className="ui-callout__footer">{footer}</div>}
      </div>
    </section>
  );
}
