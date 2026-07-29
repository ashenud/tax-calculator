/**
 * A `src` pointer from the tax data, rendered as a visible, reachable citation.
 *
 * "Every figure is a rupee amount, a percentage, a rate band, a threshold or a
 * deadline, and every one of them carries a citation to primary law"
 * [CLAUDE.md rule 1]. `ui-design-system.md` puts this component "beside every
 * displayed rate". A rate on this site without one of these is a bug.
 *
 * WHAT A `src` LOOKS LIKE
 *
 *   "ira-2017"                                    a whole document
 *   "act-2-2025#s.3(1)(d) — IRA Sch.1 para 1(6)"  document + pinpoint
 *
 * The part before `#` is a key in that tax-year file's own `sources` map — the
 * schema guarantees it resolves (`schema.ts`, "every src resolves to a key in
 * sources"). The part after `#` is a human-readable pinpoint and is displayed
 * as written.
 *
 * WHAT THIS COMPONENT WILL NOT DO
 *
 *   - **It is never a tooltip.** A citation carried only by a `title` attribute
 *     or a hover card is unreachable on a touch device, which is most of this
 *     site's audience. Prohibited by `ui-design-system.md`. The reference is
 *     visible text and, where it resolves, a real link.
 *   - **It never disappears.** If the key does not resolve against the `sources`
 *     map it is passed, the pointer is still rendered — as plain text, with the
 *     unresolved key visible. A missing citation must look missing, not absent.
 *   - It never invents a title. Titles come from the data file.
 *
 * LINK TARGET. `/about/sources/` is where `docs/spec/site-architecture.md` puts
 * the provenance register (`src/pages/about/sources.astro`), and `Base.astro`'s
 * navigation already uses that path. The page itself lands in a later prompt; a
 * caller that wants a different target passes `sourcesHref`. P16 set a GitHub
 * Pages `base`, so the default is now resolved through `withBase()`; a caller
 * passing its own `sourcesHref` is responsible for prefixing it, which is why
 * the prop keeps taking a plain string.
 */

import './ui.css';
import { withBase } from '../../lib/base-path.ts';

export interface CitationSource {
  title: string;
  /** Path to the primary document in `docs/sources/`. Displayed, not linked:
   * the PDFs are not published with the site. */
  file?: string;
}

export interface CitationRefProps {
  /** The `src` pointer, exactly as it appears in the tax-year data. */
  src: string;
  /**
   * That tax-year file's `sources` map, so the key can be shown as the
   * document's real title rather than as a slug. Optional — without it the key
   * is shown as-is, which is degraded but honest.
   */
  sources?: Readonly<Record<string, CitationSource>>;
  /** Where the provenance register lives. */
  sourcesHref?: string;
  /**
   * Prefix read out before the reference, e.g. "Rate from". Visible.
   * Defaults to nothing — most citations sit directly after the figure.
   */
  label?: string;
}

/** A `src` may carry a pinpoint after `#`; only the part before it is a key. */
export function splitSrc(src: string): { key: string; pinpoint: string | null } {
  const hash = src.indexOf('#');
  if (hash === -1) return { key: src.trim(), pinpoint: null };
  const pinpoint = src.slice(hash + 1).trim();
  return { key: src.slice(0, hash).trim(), pinpoint: pinpoint === '' ? null : pinpoint };
}

export function CitationRef({
  src,
  sources,
  sourcesHref = withBase('/about/sources/'),
  label,
}: CitationRefProps) {
  const { key, pinpoint } = splitSrc(src);
  const entry = sources?.[key];
  const title = entry?.title ?? key;

  const body = (
    <>
      <span className="ui-citation__title">{title}</span>
      {pinpoint && <span className="ui-citation__pinpoint">, {pinpoint}</span>}
    </>
  );

  return (
    <span className="ui-citation" data-resolved={entry ? '' : undefined}>
      {label && <span className="ui-citation__label">{label} </span>}
      <span aria-hidden="true">[</span>
      {entry ? (
        <a className="ui-citation__link" href={`${sourcesHref}#${key}`}>
          {body}
        </a>
      ) : (
        // Unresolved: no link, because a link to an anchor that is not on the
        // sources page is worse than no link. The key stays visible so the gap
        // is diagnosable from a screenshot.
        <span className="ui-citation__unresolved">
          {body}
          <span className="visually-hidden">
            {' '}
            (this source is not registered in the data for the year shown)
          </span>
        </span>
      )}
      <span aria-hidden="true">]</span>
    </span>
  );
}
