/**
 * A raised container with an optional heading and footer.
 *
 * STATE MATRIX
 *
 *   A `Card` is a box. It holds no value, so empty / valid / invalid /
 *   disabled do not apply, and it is not focusable, so focus and hover do not
 *   either — deliberately: a card that lit up on hover without being clickable
 *   is a false affordance, and the selectable-card cases are `RadioCardGroup`
 *   and `PersonaCard`, which are real radios.
 *
 *   The one state it does carry is `tone`, used by the result panel to sit a
 *   figure inside a surface that matches its status, and `emphasis` for the
 *   result panel's larger radius (`--radius-lg`, per the design system).
 */

import type { ElementType, ReactNode } from 'react';
import './ui.css';

export interface CardProps {
  /** Optional heading. When present the card is a labelled `<section>`. */
  title?: string;
  headingLevel?: 2 | 3 | 4 | 5;
  /** Sits to the right of the title: an as-at stamp, a badge. */
  titleAside?: ReactNode;
  footer?: ReactNode;
  /** `lg` radius and heavier padding, for the result panel. */
  emphasis?: boolean;
  tone?: 'default' | 'sunken';
  /** Overrides the element. `section` when titled, `div` otherwise. */
  as?: ElementType;
  id?: string;
  children: ReactNode;
}

export function Card({
  title,
  headingLevel = 2,
  titleAside,
  footer,
  emphasis = false,
  tone = 'default',
  as,
  id,
  children,
}: CardProps) {
  const Element: ElementType = as ?? (title ? 'section' : 'div');
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5';
  const headingId = title && id ? `${id}-title` : undefined;

  return (
    <Element
      className="ui-card"
      data-emphasis={emphasis ? '' : undefined}
      data-tone={tone}
      id={id}
      aria-labelledby={headingId}
    >
      {title && (
        <div className="ui-card__header">
          <Heading className="ui-card__title" id={headingId}>
            {title}
          </Heading>
          {titleAside && <div className="ui-card__aside">{titleAside}</div>}
        </div>
      )}
      <div className="ui-card__body">{children}</div>
      {footer && <div className="ui-card__footer">{footer}</div>}
    </Element>
  );
}
