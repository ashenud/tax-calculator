/**
 * A placeholder box for content that has not arrived.
 *
 * STATE MATRIX
 *
 *   A skeleton has exactly one state — loading — which is why it exists.
 *   empty / valid / invalid / disabled / focus / hover do not apply: it holds
 *   no value and is not focusable. Documented rather than invented.
 *
 * TWO RULES IT DOES CARRY
 *
 *  - **It is `aria-hidden`.** A screen reader must not read out three grey
 *    rectangles. Where the wait needs announcing, pass `label`; the component
 *    then wraps itself in a polite live region carrying that text, so the
 *    announcement is words rather than shapes.
 *
 *  - **The shimmer stops under `prefers-reduced-motion`.** Handled by the base
 *    layer in `global.css`, which zeroes animation durations globally, so
 *    nothing is restated here.
 *
 * WHERE IT IS *NOT* USED: never behind a tax figure. The computation is
 * synchronous and local; a skeleton where a number will appear implies the
 * number is on its way from somewhere, and nothing in this tool travels.
 */

import './ui.css';

export interface SkeletonProps {
  /**
   * Width as a share of the container. Named rather than numeric so nothing
   * hardcodes a size — each maps to a rule in `ui.css`.
   */
  width?: 'full' | 'half' | 'short';
  /** `text` matches a line of body copy; `block` is a paragraph-sized area. */
  variant?: 'text' | 'block';
  /** Number of lines. Only meaningful for `text`. */
  lines?: number;
  /** Announced politely while loading. Omit inside an already-announced region. */
  label?: string;
}

export function Skeleton({
  width = 'full',
  variant = 'text',
  lines = 1,
  label,
}: SkeletonProps) {
  const bars = Array.from({ length: lines }, (_, index) => (
    <span
      key={index}
      className="ui-skeleton"
      data-variant={variant}
      // The last line of a multi-line block is short, as real text is.
      data-width={index === lines - 1 ? width : 'full'}
      aria-hidden="true"
    />
  ));

  if (!label) return <>{bars}</>;

  return (
    <span className="ui-skeleton-group" role="status">
      <span className="visually-hidden">{label}</span>
      {bars}
    </span>
  );
}
