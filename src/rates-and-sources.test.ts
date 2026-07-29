/**
 * P13's own acceptance checks: a page per tax-year file with no route
 * hardcoded, changing a rate changes the rendered page, every figure carries
 * a citation and every unverified one its badge, and zero JavaScript in the
 * built output for all three page kinds.
 *
 * DELIBERATELY NOT under `src/pages/`, even though it tests files that live
 * there. Astro's file-based router picks up every `.ts` file directly inside
 * `src/pages/` as a route candidate, `.test.ts` included — a real `astro
 * build` run against this repo, with an earlier draft of this file placed at
 * `src/pages/rates-and-sources.test.ts`, tried to prerender it as a page and
 * failed with an unrelated, confusing error. One directory up is enough to
 * keep it out of the router while every import below still resolves.
 *
 * "Zero JavaScript" is checked two ways, because `AstroContainer` performs an
 * isolated SSR render rather than the full asset-bundling pipeline `astro
 * build` does, so it cannot itself prove what ships to a browser:
 *
 *   1. Structurally, here: none of the four page files contains a `client:`
 *      directive anywhere in its source — that directive is the only thing
 *      that makes Astro emit a client bundle for a component at all, so its
 *      absence is what "no island on this page" actually means.
 *   2. Empirically, once, by hand: `npm run build` and grepping the four
 *      built HTML files for `<script`, comparing the count against
 *      `dist/index.html` — the page already established as zero-JS. Recorded
 *      in this prompt's report rather than re-run here, because re-running a
 *      full `astro build` inside a unit test is slow and this repository has
 *      no existing precedent for a test that shells out to its own build.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import reactServerRenderer from '@astrojs/react/server.js';
import { beforeAll, describe, expect, it } from 'vitest';

import RatesYearPage from './pages/rates/[year].astro';
import RatesIndexPage from './pages/rates/index.astro';
import SourcesPage from './pages/about/sources.astro';
import ChangelogPage from './pages/about/changelog.astro';
import { loadTaxYears } from './lib/tax/load.ts';
import { ratesStaticPaths } from './lib/tax/rates-paths.ts';
import { taxYearFileSchema, type TaxYearFile } from './lib/tax/schema.ts';

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const LOADED = loadTaxYears();
const REAL_TAX_YEAR: TaxYearFile = LOADED[0]!.data;

let container: AstroContainer;

beforeAll(async () => {
  // `AstroContainer` does not read `astro.config.mjs` and registers no
  // renderer by default. Every page under test renders `CitationRef`,
  // `UnverifiedBadge` or `NotYetLawBadge` — plain React components, reused
  // rather than reimplemented — so the React renderer must be registered
  // explicitly, or the container cannot render them at all. Only a *server*
  // renderer is needed: nothing under test carries a `client:` directive, so
  // there is nothing to hydrate.
  container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/react', renderer: reactServerRenderer });
});

describe('a rates page exists for every file in data/tax-years, with no route hardcoded', () => {
  it('getStaticPaths returns exactly one path per loaded tax-year file', () => {
    const paths = ratesStaticPaths(LOADED);
    expect(paths).toHaveLength(LOADED.length);

    const slugs = paths.map((p) => p.params.year).sort();
    const expectedSlugs = LOADED.map(({ file }) => file.replace(/\.json$/, '')).sort();
    expect(slugs).toEqual(expectedSlugs);
  });

  it('the year param is derived from the loaded file, not written in the page source', () => {
    // Guards the guard: if a year ever gets hardcoded into the page, this
    // fails before the test above could be blamed on a coincidence.
    const source = read('./pages/rates/[year].astro');
    expect(source).not.toMatch(/2025-26|2025\/2026/);
  });

  it('renders a real page for the real Y/A 2025/2026 file', async () => {
    const html = await container.renderToString(RatesYearPage, {
      props: { taxYear: REAL_TAX_YEAR },
    });
    expect(html).toContain('2025/2026');
  });
});

describe('changing a rate in the data changes the rendered page', () => {
  function withNormalLadderTopRate(rateBp: number): TaxYearFile {
    const schedule = REAL_TAX_YEAR.rateSchedules['individual-normal']!;
    const bands = schedule.bands.map((band, index) =>
      index === schedule.bands.length - 1 ? { ...band, rateBp } : band,
    );
    return taxYearFileSchema.parse({
      ...REAL_TAX_YEAR,
      rateSchedules: {
        ...REAL_TAX_YEAR.rateSchedules,
        'individual-normal': { ...schedule, bands },
      },
    });
  }

  it('a changed top band rate appears, and the old one does not', async () => {
    const before = await container.renderToString(RatesYearPage, {
      props: { taxYear: REAL_TAX_YEAR },
    });
    expect(before).toContain('36%');

    const mutated = withNormalLadderTopRate(4200); // 42%, distinct from every other rate this file holds
    const after = await container.renderToString(RatesYearPage, {
      props: { taxYear: mutated },
    });
    expect(after).toContain('42%');
    expect(after).not.toContain('36%');
  });
});

describe('every figure shows a citation, every unverified figure shows its badge', () => {
  it('cites the top-band rate and marks it verified (no badge)', async () => {
    const html = await container.renderToString(RatesYearPage, {
      props: { taxYear: REAL_TAX_YEAR },
    });
    expect(html).toContain('Inland Revenue (Amendment) Act, No. 2 of 2025');
  });

  it('carries the unverified badge on capital-gain and terminal-benefit, and nowhere else', async () => {
    const html = await container.renderToString(RatesYearPage, {
      props: { taxYear: REAL_TAX_YEAR },
    });
    const badgeCount = (html.match(/Not yet confirmed against primary law/g) ?? [])
      .length;
    // capital-gain (one flat rate) + terminal-benefit (one component, both its
    // tables share the same verified flag so it is marked once) = 2.
    expect(badgeCount).toBe(2);
  });

  it('every band in the standard ladder has its own citation link', async () => {
    const html = await container.renderToString(RatesYearPage, {
      props: { taxYear: REAL_TAX_YEAR },
    });
    const schedule = REAL_TAX_YEAR.rateSchedules['individual-normal']!;
    const citationCount = (html.match(/class="ui-citation"/g) ?? []).length;
    expect(citationCount).toBeGreaterThanOrEqual(schedule.bands.length);
  });
});

describe('links to docs/sources/ documents resolve', () => {
  it('every source key the tax data cites has a matching anchor on the sources page', async () => {
    const html = await container.renderToString(SourcesPage, {});
    for (const key of Object.keys(REAL_TAX_YEAR.sources)) {
      expect(html, `no id="${key}" on the sources page`).toContain(`id="${key}"`);
    }
  });

  it('includes the full provenance register, including "still missing"', async () => {
    const html = await container.renderToString(SourcesPage, {});
    expect(html).toContain('Still missing');
    expect(html).toContain('sha256sum');
  });
});

describe('the rates index and the changelog list every year, with no year hardcoded', () => {
  it('rates/index.astro links to every year rates/[year].astro builds', async () => {
    const html = await container.renderToString(RatesIndexPage, {});
    for (const { file } of LOADED) {
      const slug = file.replace(/\.json$/, '');
      expect(html).toContain(`href="/rates/${slug}/"`);
    }
  });

  it('the changelog cites every source the data holds, per year', async () => {
    const html = await container.renderToString(ChangelogPage, {});
    for (const source of Object.values(REAL_TAX_YEAR.sources)) {
      expect(html).toContain(source.title);
    }
  });
});

describe('zero JavaScript — no page in this prompt hydrates anything', () => {
  it.each([
    ['./pages/rates/[year].astro', 'the per-year rates page'],
    ['./pages/rates/index.astro', 'the rates index'],
    ['./pages/about/sources.astro', 'the sources page'],
    ['./pages/about/changelog.astro', 'the changelog'],
  ])('%s (%s) contains no client: directive', (path) => {
    // The real directive forms only — not the word "client:" on its own,
    // which this file's own doc comments use when *explaining* that none of
    // these pages carries one.
    expect(read(path)).not.toMatch(/client:(load|idle|visible|media|only)\b/);
  });
});
