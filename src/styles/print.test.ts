/**
 * The print stylesheet, checked two ways — because jsdom has no real CSS
 * cascade or layout engine and cannot tell us what a printed page looks
 * like. Neither can this file: "print preview of a completed result" and
 * "print preview of a refused result" in `docs/prompts/P15-print-and-
 * accessibility.md`'s acceptance list are visual checks that need an
 * actual browser's print preview, which nothing in this repository's test
 * toolchain can drive. What is checked here instead:
 *
 *   1. The stylesheet's own source: every element P15 says must be dropped
 *      has a rule hiding it, under `@media print`; nothing P15 says must be
 *      kept (the disclaimer, the as-at stamp, warnings, refusals) is
 *      targeted at all.
 *   2. That the selectors in (1) actually target a real class — each one is
 *      checked against the component source file that assigns it, so a
 *      rename on either side (the component or this stylesheet) shows up
 *      here instead of silently hiding nothing on paper.
 *
 * Together these prove the CSS is internally consistent and aimed at real
 * targets. They do not prove a printed page looks right — that is the
 * "manual" half of this prompt's report.
 *
 * No jsdom here, matching `rates-and-sources.test.ts` and `guides.test.ts`:
 * `astro/container`'s SSR renderer and jsdom's `document` global do not mix
 * cleanly in the same Vitest environment (a `NoMatchingRenderer` error, not
 * a real incompatibility with the stylesheet itself), and nothing below
 * needs a DOM — every check is against source text.
 */

import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import { resolveSibling } from '../test/resolve-sibling.ts';
import IndexPage from '../pages/index.astro';

const read = (relative: string): string =>
  readFileSync(resolveSibling(import.meta.url, relative), 'utf-8');

const PRINT_CSS = read('./print.css');

/** The declarations for one selector inside the (single) `@media print` block. */
function rulesFor(rawSelector: string): string | null {
  const block = /@media print\s*{([\s\S]*)}\s*@page/.exec(PRINT_CSS)?.[1] ?? '';
  const escaped = rawSelector.replace(/[.[\]()='"]/g, (c) => `\\${c}`);
  const re = new RegExp(`${escaped}\\s*(?:,[^{]*)?{([^}]*)}`, 'm');
  return re.exec(block)?.[1] ?? null;
}

describe('what P15 says to drop is actually hidden', () => {
  it.each([
    '.site-header',
    '.skip-link',
    '.site-footer',
    '.ui-button',
    '.ui-stepper',
    '.ui-progress',
    '.calc-gaps',
    '.calc-more',
    '.calc-summary-bar',
  ])('%s is display: none under @media print', (selector) => {
    const rules = rulesFor(selector);
    expect(rules, `no @media print rule found for ${selector}`).not.toBeNull();
    expect(rules).toMatch(/display:\s*none/);
  });

  it('unchecked radio-card options are hidden, checked ones lose their control chrome', () => {
    expect(rulesFor(".ui-radio-card[data-state='unchecked']")).toMatch(/display:\s*none/);
    expect(rulesFor(".ui-radio-card[data-state='checked']")).toMatch(/border:\s*none/);
  });

  it('the working table avoids breaking across a printed page', () => {
    expect(rulesFor('.ui-table')).toMatch(/break-inside:\s*avoid/);
    expect(rulesFor('.ui-table tr')).toMatch(/break-inside:\s*avoid/);
  });

  it('the sticky result column reverts to static positioning', () => {
    expect(rulesFor('.calc-step--result')).toMatch(/position:\s*static/);
  });
});

describe('what P15 says to keep is never targeted', () => {
  it.each([
    '.disclaimer',
    '.as-at-stamp',
    '.calc-as-at',
    '.ui-refusal',
    '.ui-warning-list',
  ])('%s has no @media print rule at all', (selector) => {
    expect(rulesFor(selector)).toBeNull();
  });
});

describe('ui.css still declares no @media or @container query', () => {
  // Guards the reason print.css is a separate file: touch-target.test.tsx
  // already asserts this, but that guarantee is exactly what would silently
  // break if a future edit "helpfully" folded the two files back together.
  it('print rules were not folded into ui.css', () => {
    expect(read('../components/ui/ui.css')).not.toMatch(/@media|@container/);
  });
});

/* ========================================================================= */

describe('every selector above targets a class a real component still assigns', () => {
  const CLASS_IN_FILE: [selector: string, definedIn: string][] = [
    ['.ui-button', '../components/ui/Button.tsx'],
    ['.ui-stepper', '../components/ui/Stepper.tsx'],
    ['.ui-progress', '../components/ui/ProgressIndicator.tsx'],
    ['.ui-input', '../components/ui/CurrencyField.tsx'],
    ['.ui-input', '../components/ui/TextField.tsx'],
    ['.ui-currency', '../components/ui/CurrencyField.tsx'],
    ['.ui-field__hint', '../components/ui/Field.tsx'],
    ['.ui-radio-card', '../components/ui/RadioCardGroup.tsx'],
    ['.ui-radio-card__mark', '../components/ui/RadioCardGroup.tsx'],
    ['.ui-select-trigger', '../components/ui/Select.tsx'],
    ['.ui-select-trigger__icon', '../components/ui/Select.tsx'],
    ['.ui-table', '../components/ui/Table.tsx'],
    ['.ui-table-scroll', '../components/ui/Table.tsx'],
    ['.calc-gaps', '../components/calculator/TaxCalculator.tsx'],
    ['.calc-more', '../components/calculator/TaxCalculator.tsx'],
    ['.calc-summary-bar', '../components/calculator/ResultStep.tsx'],
    ['.calc-step--result', '../components/calculator/TaxCalculator.tsx'],
    ['.disclaimer', '../components/Disclaimer.astro'],
    ['.as-at-stamp', '../components/AsAtStamp.astro'],
    ['.calc-as-at', '../components/calculator/AsAtStamp.tsx'],
    ['.ui-refusal', '../components/ui/RefusalPanel.tsx'],
    ['.ui-warning-list', '../components/ui/WarningList.tsx'],
    ['.site-header', '../layouts/Base.astro'],
    ['.skip-link', '../layouts/Base.astro'],
    ['.site-footer', '../layouts/Base.astro'],
  ];

  it.each(CLASS_IN_FILE)('%s appears in %s', (className, file) => {
    expect(read(file)).toContain(className.replace(/^\./, ''));
  });
});

describe('the page shell renders the classes print.css relies on', () => {
  it('site-header, skip-link, site-footer and disclaimer are all present', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(IndexPage);
    for (const cls of ['site-header', 'skip-link', 'site-footer', 'disclaimer']) {
      expect(html, `class="${cls}" not found in rendered shell`).toMatch(
        new RegExp(`class="[^"]*\\b${cls}\\b`),
      );
    }
  });
});
