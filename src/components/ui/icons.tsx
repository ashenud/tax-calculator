/**
 * Icons, inline.
 *
 * `ui-design-system.md` names Lucide as the icon set. These are drawn to
 * Lucide's grid (24×24, 2px stroke, round caps) but written out by hand rather
 * than pulled from `lucide-react`, for the same reason P01 hand-wrote the SVGs
 * in `Disclaimer.astro` and `ThemeToggle.astro`: the site's audience is
 * "frequently on a phone with a poor connection", and eight glyphs do not
 * justify a runtime dependency on every island that renders a callout.
 *
 * Every icon is `aria-hidden`. **An icon is never the only carrier of meaning.**
 * Each is paired with text — visible text where there is room, and a
 * `visually-hidden` word where the visual signal is the icon's own shape. The
 * shapes are deliberately distinct from one another (triangle, octagon, circle,
 * tick) so that a user who cannot distinguish the tones by colour can still
 * distinguish them by outline.
 */

import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Caution / warning. A triangle — distinct in outline from every other tone. */
export function IconAlertTriangle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

/** Danger / blocking. An octagon. */
export function IconOctagonAlert(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.6 2h6.8L22 8.6v6.8L15.4 22H8.6L2 15.4V8.6Z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </Icon>
  );
}

/** Information. A circle. */
export function IconInfo(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

/** Positive / condition met. A tick in a circle. */
export function IconCheckCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21.8 10.9A10 10 0 1 1 15.9 3" />
      <path d="m9 11 3 3L22 4" />
    </Icon>
  );
}

/** Neutral note. A square-cornered document. */
export function IconNote(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 3h11l5 5v13H4Z" />
      <path d="M15 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </Icon>
  );
}

/** A bare tick, for completed steps and selected options. */
export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

/** Disclosure chevron for the select trigger. */
export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function IconChevronUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m18 15-6-6-6 6" />
    </Icon>
  );
}
