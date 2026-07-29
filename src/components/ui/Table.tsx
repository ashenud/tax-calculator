/**
 * A real `<table>`.
 *
 * `ui-behaviour.md` is explicit: "The working table is a real `<table>` with
 * scoped headers, not a grid of divs." The working is the artefact a user takes
 * to a practitioner, and a div grid cannot be navigated cell-by-cell by a
 * screen reader, cannot be read column-wise, and does not survive a copy-paste
 * into a spreadsheet.
 *
 * FOUR THINGS THIS DOES THAT A PLAIN TABLE DOES NOT
 *
 *  - **Numeric columns render in the tabular face and align to the end.** A
 *    column of rupee figures whose digits do not line up is a working nobody
 *    can check, which is the one thing this tool promises.
 *  - **The caption is required**, and by default visible. An unnamed table in a
 *    long page of workings is unnavigable.
 *  - **The empty state says words**, never `Rs. 0`. An empty working with a
 *    zero in it claims a computation that did not happen.
 *  - **Overflow scrolls with the keyboard.** On a 320px screen a five-column
 *    working scrolls sideways; the scroll container is a focusable, named
 *    region so a keyboard user can reach the columns off-screen. Without
 *    `tabindex` a scrollable box is a pointer-only affordance.
 *
 * STATE MATRIX
 *
 *   empty     `rows` is empty → one full-width cell carrying `emptyMessage`.
 *   loading   `loading` → skeleton rows inside a polite live region. Present
 *             for completeness; the computation is synchronous and local, so
 *             in practice this appears only where data is being fetched at
 *             build time.
 *   valid     rows rendered.
 *   invalid   n/a — a table displays what the engine produced. A figure that
 *             could not be computed is a refusal, and a refusal replaces the
 *             figure (ADR-0003), which is `RefusalPanel`'s job in P09, not a
 *             red row here.
 *   disabled  n/a — a table is not a control.
 *   focus     on the scroll region when it overflows; the base layer's ring.
 *   hover     row background lifts to `--color-surface-sunken`, which is a
 *             reading aid and carries no meaning.
 */

import type { ReactNode } from 'react';
import { useId } from 'react';
import { Skeleton } from './Skeleton.tsx';
import './ui.css';

export interface TableColumn {
  key: string;
  header: string;
  /** Tabular figures, aligned to the end of the cell. */
  numeric?: boolean;
  /** Renders this column's cell as `<th scope="row">`. At most one column. */
  rowHeader?: boolean;
}

export interface TableProps {
  /** Required. Describes what the table shows. */
  caption: string;
  /** Hide the caption visually — it stays in the accessibility tree. */
  captionHidden?: boolean;
  columns: readonly TableColumn[];
  rows: readonly Readonly<Record<string, ReactNode>>[];
  /** Shown when there are no rows. Words, never a zero. */
  emptyMessage: string;
  loading?: boolean;
  /** Rows to draw while loading. */
  loadingRows?: number;
  id?: string;
}

export function Table({
  caption,
  captionHidden = false,
  columns,
  rows,
  emptyMessage,
  loading = false,
  loadingRows = 3,
  id,
}: TableProps) {
  const generatedId = useId();
  const tableId = id ?? generatedId;
  const captionId = `${tableId}-caption`;

  const body = loading
    ? Array.from({ length: loadingRows }, (_, rowIndex) => (
        <tr key={`skeleton-${rowIndex}`}>
          {columns.map((column) => (
            <td key={column.key} className="ui-table__cell">
              <Skeleton width={column.numeric ? 'short' : 'full'} />
            </td>
          ))}
        </tr>
      ))
    : rows.map((row, rowIndex) => (
        // Rows are positional and this project has no react/no-array-index-key rule
        // configured (no eslint-plugin-react — see ui-design-system.md's note on
        // eslint-plugin-jsx-a11y being dropped for the same peer-conflict reason).
        <tr key={rowIndex}>
          {columns.map((column) =>
            column.rowHeader ? (
              <th key={column.key} scope="row" className="ui-table__row-header">
                {row[column.key]}
              </th>
            ) : (
              <td
                key={column.key}
                className={
                  column.numeric
                    ? 'ui-table__cell ui-table__cell--numeric figure'
                    : 'ui-table__cell'
                }
              >
                {row[column.key]}
              </td>
            ),
          )}
        </tr>
      ));

  return (
    <div
      className="ui-table-scroll"
      // Focusable so the horizontal scroll a narrow screen forces is reachable
      // from the keyboard. Named by the caption, so it is not an anonymous
      // tab stop.
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      aria-busy={loading || undefined}
    >
      <table className="ui-table" id={tableId}>
        <caption
          className={captionHidden ? 'visually-hidden' : 'ui-table__caption'}
          id={captionId}
        >
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={
                  column.numeric
                    ? 'ui-table__head ui-table__head--numeric'
                    : 'ui-table__head'
                }
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && !loading ? (
            <tr>
              <td className="ui-table__empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            body
          )}
        </tbody>
      </table>
    </div>
  );
}
