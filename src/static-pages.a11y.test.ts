/**
 * Axe over every static (non-hydrated) route this build produces —
 * everything the calculator's own `calculator.a11y.test.tsx` does not
 * already cover.
 *
 * DELIBERATELY NOT under `src/pages/` — see `rates-and-sources.test.ts`'s
 * header for why: Astro's router treats a `.ts` file directly inside
 * `src/pages/` as a route candidate.
 *
 * WHY A HAND-BUILT `JSDOM` INSTANCE, NOT VITEST'S OWN JSDOM TEST ENVIRONMENT
 *
 * `astro/container`'s SSR renderer and vitest's file-wide jsdom test
 * environment do not mix: turning that environment on for this file makes
 * `container.renderToString` throw `NoMatchingRenderer` for every page,
 * React or not, because the global `document` it then detects changes which
 * code path Astro's renderer takes. (Do not turn it on to check — the
 * pragma vitest scans for anywhere in a file's leading comment is real even
 * spelled out in prose, and writing it out nearly cost an afternoon to a
 * self-inflicted repeat of the exact bug this paragraph describes.)
 * Constructing a `JSDOM` instance directly from the `jsdom` package and
 * running axe against *that* document — never touching the global
 * environment — avoids the conflict entirely and is exactly what
 * `calculator.a11y.test.tsx`'s own comment already explains about
 * `color-contrast`: jsdom performs no real layout, so that one rule is
 * disabled everywhere below too, for the same reason.
 *
 * WHAT "BOTH THEMES" AND "BOTH WIDTHS" MEAN HERE, AND WHAT THEY DO NOT
 *
 * `docs/prompts/P15-print-and-accessibility.md` asks for axe "at 320px and
 * 1440px, in both themes." jsdom performs no layout at all, so nothing here
 * can differ by viewport width, and with `color-contrast` disabled (the
 * only theme-sensitive axe rule) nothing here can differ by theme either —
 * running the same markup twice under a different `data-theme` attribute
 * would be theatre, not a second check. Contrast in both themes is verified
 * for real, per token, in `src/styles/tokens.test.ts`. What this file
 * actually proves is theme- and width-*independent*: correct roles, labels,
 * landmark structure, heading order and form semantics — real defects that
 * width and colour cannot hide or reveal. A genuine 320px/1440px/both-theme
 * axe pass needs a real browser and is not run here; see this prompt's
 * report for what that leaves undone.
 */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import reactServerRenderer from '@astrojs/react/server.js';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import IndexPage from './pages/index.astro';
import RatesIndexPage from './pages/rates/index.astro';
import RatesYearPage from './pages/rates/[year].astro';
import SourcesPage from './pages/about/sources.astro';
import ChangelogPage from './pages/about/changelog.astro';
import GuidesIndexPage from './pages/guides/index.astro';
import ForeignCurrencyPage from './pages/guides/foreign-currency-income.astro';
import EmployerNotDeductingPage from './pages/guides/employer-not-deducting.astro';
import FilingYourReturnPage from './pages/guides/filing-your-return.astro';
import DeadlinesPage from './pages/guides/deadlines.astro';
import CapitalGainsPage from './pages/guides/capital-gains.astro';
import { loadTaxYears } from './lib/tax/load.ts';

const TAX_YEAR = loadTaxYears()[0]!.data;

async function containerWithReact(): Promise<AstroContainer> {
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/react', renderer: reactServerRenderer });
  return container;
}

async function axeReport(html: string, route: string): Promise<void> {
  const dom = new JSDOM(html);
  const results = await axe.run(dom.window.document.body, {
    rules: { 'color-contrast': { enabled: false } },
  });

  if (results.violations.length > 0) {
    const report = results.violations
      .map((v) => `[${v.impact}] ${v.id} — ${v.help}\n    ${v.helpUrl}`)
      .join('\n\n');
    expect.fail(
      `axe found ${results.violations.length} violation(s) on ${route}:\n\n${report}`,
    );
  }

  expect(results.violations).toEqual([]);
  // A scan that found nothing to check would pass "zero violations" vacuously.
  expect(results.passes.length).toBeGreaterThan(0);
}

describe('axe — every static route', () => {
  it('/', async () => {
    const container = await containerWithReact();
    const html = await container.renderToString(IndexPage);
    await axeReport(html, '/');
  });

  it('/rates/', async () => {
    const container = await containerWithReact();
    const html = await container.renderToString(RatesIndexPage);
    await axeReport(html, '/rates/');
  });

  it('/rates/2025-26/', async () => {
    const container = await containerWithReact();
    const html = await container.renderToString(RatesYearPage, {
      props: { taxYear: TAX_YEAR },
    });
    await axeReport(html, '/rates/2025-26/');
  });

  it('/about/sources/', async () => {
    const container = await containerWithReact();
    const html = await container.renderToString(SourcesPage);
    await axeReport(html, '/about/sources/');
  });

  it('/about/changelog/', async () => {
    const container = await containerWithReact();
    const html = await container.renderToString(ChangelogPage);
    await axeReport(html, '/about/changelog/');
  });

  it('/guides/', async () => {
    const container = await containerWithReact();
    const html = await container.renderToString(GuidesIndexPage);
    await axeReport(html, '/guides/');
  });

  it.each([
    ['/guides/foreign-currency-income/', ForeignCurrencyPage],
    ['/guides/employer-not-deducting/', EmployerNotDeductingPage],
    ['/guides/filing-your-return/', FilingYourReturnPage],
    ['/guides/deadlines/', DeadlinesPage],
    ['/guides/capital-gains/', CapitalGainsPage],
  ])('%s', async (route, Page) => {
    const container = await containerWithReact();
    const html = await container.renderToString(Page);
    await axeReport(html, route);
  });
});
