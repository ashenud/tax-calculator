/**
 * The ADR-0003 invariants, asserted against rendered HTML.
 *
 * The check that matters most here is the first one. ADR-0003 requires a
 * persistent disclaimer on every page; the only way that survives contact with
 * a codebase is for the layout to supply it, so that a page whose author never
 * thought about the disclaimer still has one. This suite renders a page that
 * does not mention `Disclaimer` anywhere and asserts the text is present.
 *
 * These are not style tests. Each one corresponds to a decision in ADR-0003
 * that was made because getting it wrong exposes a real person to a penalty.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

import AsAtStamp from '../components/AsAtStamp.astro';
import Disclaimer from '../components/Disclaimer.astro';
import IndexPage from '../pages/index.astro';
import { BASE_PATH } from '../lib/base-path.ts';

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('ADR-0003 §1 — the disclaimer comes from the layout', () => {
  it('the home page source does not itself render the disclaimer', () => {
    // Guards the guard. If someone adds <Disclaimer /> to index.astro, the
    // test below would pass for the wrong reason and stop proving anything.
    const source = read('../pages/index.astro');
    expect(source).not.toMatch(/<Disclaimer/);
    expect(source).not.toMatch(/from '\.\.\/components\/Disclaimer\.astro'/);
  });

  it('renders the disclaimer anyway, because Base.astro supplies it', async () => {
    const html = await container.renderToString(IndexPage);
    expect(html).toContain('This is not tax advice');
    expect(html).toContain('It is not advice and it is not an authority');
    expect(html).toContain(
      'Check any figure with the Inland Revenue Department or a qualified tax practitioner before you file or pay.',
    );
  });

  it('places the disclaimer above the main content, not in the footer', async () => {
    const html = await container.renderToString(IndexPage);
    const disclaimerAt = html.indexOf('This is not tax advice');
    const mainAt = html.indexOf('id="main"');
    const footerAt = html.indexOf('site-footer');

    expect(disclaimerAt).toBeGreaterThan(-1);
    expect(mainAt).toBeGreaterThan(-1);
    // Below the fold is, for this purpose, the same as absent.
    expect(disclaimerAt).toBeLessThan(mainAt);
    expect(disclaimerAt).toBeLessThan(footerAt);
  });

  it('offers no way to dismiss it', async () => {
    const html = await container.renderToString(Disclaimer);
    // No control to press, no disclosure to collapse it into, and no script to
    // remember that it was pressed.
    expect(html).not.toMatch(/<button/i);
    expect(html).not.toMatch(/<details/i);
    expect(html).not.toMatch(/<summary/i);
    // The `hidden` attribute, but not `aria-hidden` on the decorative icon.
    expect(html).not.toMatch(/(?<!-)\bhidden\b/i);
    expect(html).not.toMatch(/aria-expanded/i);
  });

  it('states the disclaimer in full rather than linking to it', async () => {
    const html = await container.renderToString(Disclaimer);
    // "Not a footer link" — a link labelled "disclaimer" is a thing users
    // decline to follow, which makes it equivalent to absent.
    expect(html).not.toMatch(/<a\s/i);
  });
});

describe('ADR-0003 §2 — the as-at stamp', () => {
  // Obviously-placeholder values. There is no tax data in this repo yet (P03
  // owns Y/A 2025/2026), and inventing one to make a demo look real is the
  // exact failure CLAUDE.md rule 6 and ADR-0004 exist to prevent.
  const PLACEHOLDER = { yearOfAssessment: '1999/2000', dataReviewedOn: '1999-12-31' };

  it('shows the year of assessment and the data review date together', async () => {
    const html = await container.renderToString(AsAtStamp, { props: PLACEHOLDER });
    expect(html).toContain('1999/2000');
    expect(html).toContain('31 December 1999');
    expect(html).toContain('Figures as at');
  });

  it('spells out the Y/A span, which a first-time filer will not know', async () => {
    const html = await container.renderToString(AsAtStamp, { props: PLACEHOLDER });
    // Sri Lanka's year of assessment runs 1 April to 31 March.
    expect(html).toContain('1 Apr 1999');
    expect(html).toContain('31 Mar 2000');
  });

  it('emits a machine-readable date', async () => {
    const html = await container.renderToString(AsAtStamp, { props: PLACEHOLDER });
    expect(html).toContain('datetime="1999-12-31"');
  });

  it('formats the date in UTC, so it is never off by one', async () => {
    // A bare ISO date parsed in local time lands on the previous day anywhere
    // west of Greenwich. A stamp that is off by one fails its only job.
    const html = await container.renderToString(AsAtStamp, {
      props: { yearOfAssessment: '2000/2001', dataReviewedOn: '2000-01-01' },
    });
    expect(html).toContain('1 January 2000');
  });

  it('refuses to render without a year of assessment', async () => {
    // CLAUDE.md rule 5: a figure that is not scoped to a Y/A is a bug. There is
    // deliberately no default, and no fallback to the system clock.
    await expect(
      container.renderToString(AsAtStamp, {
        props: { dataReviewedOn: '1999-12-31' },
      }),
    ).rejects.toThrow(/yearOfAssessment/);
  });

  it('refuses a malformed year of assessment', async () => {
    await expect(
      container.renderToString(AsAtStamp, {
        props: { yearOfAssessment: '2025', dataReviewedOn: '1999-12-31' },
      }),
    ).rejects.toThrow(/YYYY\/YYYY/);
  });

  it('refuses to render without a data review date', async () => {
    // Defaulting this to the build date would claim the tax data was reviewed
    // on a day nobody reviewed it.
    await expect(
      container.renderToString(AsAtStamp, {
        props: { yearOfAssessment: '1999/2000' },
      }),
    ).rejects.toThrow(/dataReviewedOn/);
  });

  it('refuses a date that is not a real date', async () => {
    await expect(
      container.renderToString(AsAtStamp, {
        props: { yearOfAssessment: '1999/2000', dataReviewedOn: '1999-02-30' },
      }),
    ).rejects.toThrow(/not a real date/);
  });
});

describe('page shell', () => {
  it('provides a skip link as the first focusable thing on the page', async () => {
    const html = await container.renderToString(IndexPage);
    const skipAt = html.indexOf('Skip to main content');
    expect(skipAt).toBeGreaterThan(-1);
    expect(skipAt).toBeLessThan(html.indexOf('site-header'));
    expect(html).toContain('href="#main"');
    expect(html).toContain('id="main"');
  });

  it('sets a language and a description', async () => {
    const html = await container.renderToString(IndexPage);
    expect(html).toMatch(/<html[^>]*lang="en-LK"/);
    expect(html).toMatch(/<meta name="description"/);
  });

  it('uses one h1 and does not skip a heading level', async () => {
    const html = await container.renderToString(IndexPage);
    const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });

  it('renders the theme toggle hidden, so no-JS users get no dead control', async () => {
    const html = await container.renderToString(IndexPage);
    expect(html).toMatch(/id="theme-toggle"[^>]*hidden|hidden[^>]*id="theme-toggle"/);
  });

  it('links to no route that does not exist in this build', async () => {
    // The nav is filtered against the pages present. P10-P14 add the rest; a
    // link to a page that has not been built yet is a 404 handed to a user.
    //
    // Derived from `src/pages/` rather than from a list of the routes that
    // happen not to exist yet. The list version had to be edited by each prompt
    // that added a page — it was edited by P10 — and a test that must be
    // rewritten to keep passing stops being a check on the thing it is named
    // after. This version passes unchanged as each page lands and fails the day
    // a link points somewhere nothing was built.
    //
    // P16 UPDATE: every internal link is now prefixed with the GitHub Pages
    // base path. That prefix is asserted here rather than pattern-matched away,
    // so a link that forgets `withBase()` fails this test too — an unprefixed
    // link is exactly the "404 handed to a user" this check is named after.
    const html = await container.renderToString(IndexPage);
    const rawHrefs = [...html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]!);
    expect(rawHrefs.length).toBeGreaterThan(0);
    for (const href of rawHrefs) {
      expect(
        href.startsWith(BASE_PATH),
        `${href} is not under the deployment base path ${BASE_PATH}`,
      ).toBe(true);
    }

    const hrefs = rawHrefs.map((href) => href.slice(BASE_PATH.length - 1));
    expect(hrefs).toEqual(expect.arrayContaining(['/']));

    const pagesDir = fileURLToPath(new URL('../pages', import.meta.url));
    const routes = new Set(
      readdirSync(pagesDir, { recursive: true, encoding: 'utf8' })
        .filter((entry) => entry.endsWith('.astro'))
        .map((entry) => {
          const withoutExtension = entry.replace(/\.astro$/, '').replace(/\\/g, '/');
          const route = withoutExtension.replace(/(^|\/)index$/, '');
          return route === '' ? '/' : `/${route}/`;
        }),
    );

    // Routes only — `/favicon.svg` and anything else out of `public/` is a
    // static asset, not a page, and is not this assertion's business.
    const routeHrefs = [...new Set(hrefs)].filter((href) => href.endsWith('/'));
    expect(routeHrefs.length).toBeGreaterThan(0);
    for (const href of routeHrefs) {
      expect(routes.has(href), `${href} is linked but no page builds it`).toBe(true);
    }
    // A positive control: the calculator page exists now, and is linked.
    expect(routes.has('/calculator/')).toBe(true);
    expect(hrefs).toEqual(expect.arrayContaining(['/calculator/']));
  });
});

describe('token discipline', () => {
  // No component hardcodes a colour or a size: a theme change must be one file.
  const COMPONENTS = [
    '../components/Disclaimer.astro',
    '../components/AsAtStamp.astro',
    '../components/ThemeToggle.astro',
    '../layouts/Base.astro',
    '../pages/index.astro',
  ] as const;

  /** The declarations in a component's <style>, with comments stripped. */
  const declarationsOf = (file: string): string =>
    (read(file).match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );

  it.each(COMPONENTS)('%s declares no literal colour', (file) => {
    const literals = [
      ...declarationsOf(file).matchAll(
        /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/gi,
      ),
    ].map((m) => m[0]);
    expect(literals).toEqual([]);
  });

  it.each(COMPONENTS)('%s declares no literal px or rem size', (file) => {
    // Rule widths — borders, outlines, underline thickness — are allowed up to
    // 2px as literals. They belong to no scale, and a spacing or type change
    // has no reason to reach them. Everything a theme change WOULD need to
    // reach (spacing, type size, radii, target size) must resolve to a token.
    const literals = [
      ...declarationsOf(file).matchAll(/(?<![\w-])(\d*\.?\d+)(px|rem)\b/g),
    ]
      .filter((m) => !(m[2] === 'px' && Number(m[1]) <= 2))
      .map((m) => m[0]);
    expect(literals).toEqual([]);
  });
});
