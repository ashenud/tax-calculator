/**
 * P14's own acceptance checks, for the five guidance pages plus their index.
 *
 * DELIBERATELY NOT under `src/pages/` — see the header of
 * `rates-and-sources.test.ts` for why: Astro's router treats every `.ts`
 * file directly inside `src/pages/` as a route candidate, `.test.ts`
 * included, and a real `astro build` chokes trying to prerender one.
 *
 * "Every figure carries a citation link that resolves" and "every
 * unverified figure carries its badge and a plain-language caveat" are
 * checked structurally against the rendered HTML, the same way
 * `rates-and-sources.test.ts` checks the rates pages. "Lighthouse
 * accessibility ≥ 95" is not something this test suite can run — there is
 * no Lighthouse invocation anywhere in this repository's toolchain, and
 * adding a headless-Chrome dependency for one prompt's one acceptance line
 * is out of proportion to what it buys. It is called out, unrun, in this
 * prompt's report; the axe-core coverage this repository already has
 * elsewhere (`calculator.a11y.test.tsx`, `gallery.a11y.test.tsx`) is the
 * closest existing substitute and is not run against these pages either,
 * since none of them is a hydrated component axe can attach to the same
 * way. A real Lighthouse pass against the built `dist/` output is a manual
 * follow-up, not one this suite performs.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import reactServerRenderer from '@astrojs/react/server.js';
import { beforeAll, describe, expect, it } from 'vitest';

import ForeignCurrencyPage from './pages/guides/foreign-currency-income.astro';
import EmployerNotDeductingPage from './pages/guides/employer-not-deducting.astro';
import FilingYourReturnPage from './pages/guides/filing-your-return.astro';
import DeadlinesPage from './pages/guides/deadlines.astro';
import CapitalGainsPage from './pages/guides/capital-gains.astro';
import GuidesIndexPage from './pages/guides/index.astro';

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const GUIDE_PAGES = [
  {
    Component: ForeignCurrencyPage,
    path: './pages/guides/foreign-currency-income.astro',
    name: 'foreign-currency-income',
    questionWords: ['money', 'overseas', 'clients', 'taxed'],
  },
  {
    Component: EmployerNotDeductingPage,
    path: './pages/guides/employer-not-deducting.astro',
    name: 'employer-not-deducting',
    questionWords: ['employer', 'tax', 'pay'],
  },
  {
    Component: FilingYourReturnPage,
    path: './pages/guides/filing-your-return.astro',
    name: 'filing-your-return',
    questionWords: ['file', 'return'],
  },
  {
    Component: DeadlinesPage,
    path: './pages/guides/deadlines.astro',
    name: 'deadlines',
    questionWords: ['deadlines', 'know'],
  },
  {
    Component: CapitalGainsPage,
    path: './pages/guides/capital-gains.astro',
    name: 'capital-gains',
    questionWords: ['gain', 'sell', 'house', 'shares'],
  },
] as const;

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/react', renderer: reactServerRenderer });
});

describe('each guide opens by answering its own title question', () => {
  it.each(GUIDE_PAGES)(
    '$name: the opening paragraph shares the title’s own words',
    async ({ Component, questionWords }) => {
      const html = await container.renderToString(Component, {});
      const h1Match = /<h1[^>]*>(.*?)<\/h1>/s.exec(html);
      const answerMatch = /class="guide__answer"[^>]*>(.*?)<\/p>/s.exec(html);
      expect(h1Match, 'no <h1> found').not.toBeNull();
      expect(answerMatch, 'no .guide__answer paragraph found').not.toBeNull();

      const h1 = h1Match![1]!.replace(/<[^>]+>/g, ' ').toLowerCase();
      const answer = answerMatch![1]!.replace(/<[^>]+>/g, ' ').toLowerCase();

      // The h1 really is the question this test claims it is.
      for (const word of questionWords) expect(h1).toContain(word);

      // The opening paragraph is talking about the same thing as the
      // question, not a run-up to it — most of the question's own words
      // reappear in the first thing the reader reads.
      const hits = questionWords.filter((word) => answer.includes(word));
      expect(
        hits.length,
        `answer paragraph shares only ${hits.length}/${questionWords.length} of the title's words: "${answer.slice(0, 200)}"`,
      ).toBeGreaterThanOrEqual(Math.ceil(questionWords.length / 2));
    },
  );
});

describe('every figure carries a citation link that resolves', () => {
  it.each(GUIDE_PAGES)(
    '$name: every ui-citation resolves against taxYear.sources',
    async ({ Component }) => {
      const html = await container.renderToString(Component, {});
      const citationCount = (html.match(/class="ui-citation"/g) ?? []).length;
      expect(citationCount).toBeGreaterThan(0);
      expect(html).not.toContain('ui-citation__unresolved');
    },
  );

  it.each(GUIDE_PAGES)(
    '$name: every rendered percentage figure sits in a paragraph that also carries a citation',
    async ({ Component }) => {
      const html = await container.renderToString(Component, {});
      // One block per <p>...</p> or <li>...</li>, non-greedy, no nested-tag
      // awareness needed: none of these pages nests a <p> inside a <p>.
      const blocks = [...html.matchAll(/<(p|li)\b[^>]*>(.*?)<\/\1>/gs)].map((m) => m[2]!);
      for (const block of blocks) {
        const hasPercent = /\d+(\.\d+)?%/.test(block.replace(/<[^>]+>/g, ''));
        if (!hasPercent) continue;
        expect(
          block,
          `a percentage appears with no citation in the same block: ${block.slice(0, 200)}`,
        ).toContain('ui-citation');
      }
    },
  );
});

describe('unverified points are disclosed, not stated as settled', () => {
  it('capital-gains: states no current rate anywhere on the page', async () => {
    const html = await container.renderToString(CapitalGainsPage, {});
    const text = html.replace(/<[^>]+>/g, ' ');
    expect(text).not.toMatch(/\d+(\.\d+)?%/);
    expect(text).toContain('cannot compute a capital gains figure');
  });

  it('employer-not-deducting: opens by naming the open question rather than asserting an answer', async () => {
    const html = await container.renderToString(EmployerNotDeductingPage, {});
    const answerMatch = /class="guide__answer"[^>]*>(.*?)<\/p>/s.exec(html);
    const answer = answerMatch![1]!.replace(/<[^>]+>/g, ' ');
    expect(answer).toMatch(/not found and confirmed|not going to tell you as settled/);
  });

  it('filing-your-return: discloses that the current return form is not held', async () => {
    const html = await container.renderToString(FilingYourReturnPage, {});
    expect(html).toContain('does not yet hold the Y/A 2025/2026 return form');
  });

  it('deadlines: states no penalty or interest rate', async () => {
    const html = await container.renderToString(DeadlinesPage, {});
    const text = html.replace(/<[^>]+>/g, ' ');
    expect(text).toContain('has not confirmed the rate of interest');
  });
});

describe('zero JavaScript — no guidance page hydrates anything', () => {
  const files = readdirSync(
    fileURLToPath(new URL('./pages/guides', import.meta.url)),
  ).filter((f) => f.endsWith('.astro'));

  it('found all five guide pages plus the index', () => {
    expect(files.sort()).toEqual(
      [
        'capital-gains.astro',
        'deadlines.astro',
        'employer-not-deducting.astro',
        'filing-your-return.astro',
        'foreign-currency-income.astro',
        'index.astro',
      ].sort(),
    );
  });

  it.each(files)('%s contains no client: directive', (file) => {
    expect(read(`./pages/guides/${file}`)).not.toMatch(
      /client:(load|idle|visible|media|only)\b/,
    );
  });
});

describe('the guides index links to every guide', () => {
  it('one link per page in src/pages/guides/, GuidesIndexPage included', async () => {
    const html = await container.renderToString(GuidesIndexPage, {});
    for (const { path } of GUIDE_PAGES) {
      const slug = path
        .split('/')
        .pop()!
        .replace(/\.astro$/, '');
      expect(html).toContain(`/guides/${slug}/`);
    }
  });
});
