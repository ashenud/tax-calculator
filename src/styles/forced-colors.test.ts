/**
 * Guards `forced-colors.css` — both that it does its job, and that it stays
 * small enough to keep deserving to exist.
 *
 * Windows High Contrast Mode cannot be driven from this toolchain (jsdom has no
 * paint, and `forced-colors` is an OS-level setting), so nothing here proves
 * what the repaired components look like to a user in that mode — that is a
 * manual check, recorded in P15's report. What is checked is what source text
 * can honestly establish:
 *
 *   1. Every repaired selector targets a class a real component still assigns,
 *      so a rename on either side surfaces here rather than silently repairing
 *      nothing. (Same guard, same reason, as `print.test.ts`.)
 *   2. The repairs use system colour keywords and no `var(--color-*)` token. A
 *      token in this mode reasserts the palette the user has explicitly
 *      overridden, which is the failure the file exists to prevent.
 *   3. The file repairs only the three indicators shown to be at risk. This is
 *      the assertion that stops it drifting into the blanket forced-colors
 *      stylesheet it deliberately is not: everything else in this project
 *      carries its meaning in words, glyphs or border *widths*, all of which
 *      forced colors leaves alone.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { resolveSibling } from '../test/resolve-sibling.ts';

const read = (relative: string): string =>
  readFileSync(resolveSibling(import.meta.url, relative), 'utf-8');

const CSS = read('./forced-colors.css');

/**
 * Comments stripped — this file is mostly reasoning, and every check below is
 * about the declarations, not the prose explaining them.
 */
const SOURCE = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

/** The one `@media (forced-colors: active)` block's contents. */
const BLOCK =
  /@media \(forced-colors: active\)\s*{([\s\S]*)}\s*$/.exec(SOURCE.trim())?.[1] ?? '';

/** The declarations for one selector inside that block. */
function rulesFor(rawSelector: string): string | null {
  const escaped = rawSelector.replace(/[.[\]()='"]/g, (c) => `\\${c}`);
  return new RegExp(`${escaped}\\s*(?:,[^{]*)?{([^}]*)}`, 'm').exec(BLOCK)?.[1] ?? null;
}

describe('the three indicators that would otherwise go invisible', () => {
  it('the radio-card selection dot gets an explicit system-colour fill', () => {
    const rules = rulesFor('.ui-radio-card__dot');
    expect(rules).toMatch(/forced-color-adjust:\s*none/);
    expect(rules).toMatch(/background-color:\s*CanvasText/);
  });

  it('the persona-card dot is repaired by the same rule', () => {
    expect(BLOCK).toContain('.ui-persona-card__dot');
  });

  it('the listbox keyboard cursor is restored as an outline', () => {
    const rules = rulesFor('.ui-select-item[data-highlighted]');
    expect(rules).toMatch(/outline:\s*2px solid Highlight/);
  });

  it('the progress fill stops rendering empty at every value', () => {
    const rules = rulesFor('.ui-progress__fill');
    expect(rules).toMatch(/forced-color-adjust:\s*none/);
    expect(rules).toMatch(/background-color:\s*CanvasText/);
  });
});

describe('the repairs use the user palette, not this project’s', () => {
  it('declares no --color-* token inside the forced-colors block', () => {
    expect(BLOCK).not.toMatch(/var\(--color-/);
  });
});

describe('the file stays minimal', () => {
  it('holds exactly one at-rule, and it is the whole file', () => {
    expect(SOURCE.match(/@[a-z-]+/g)).toEqual(['@media']);
    expect(BLOCK).not.toBe('');
  });

  it('repairs three indicators and no more', () => {
    const selectors = [...BLOCK.matchAll(/^\s*([^{}\n]+?)\s*[,{]\s*$/gm)].map(
      (m) => m[1]!,
    );
    expect(new Set(selectors)).toEqual(
      new Set([
        '.ui-radio-card__dot',
        '.ui-persona-card__dot',
        '.ui-select-item[data-highlighted]',
        '.ui-progress__fill',
      ]),
    );
  });
});

describe('every repaired selector is a class a real component still assigns', () => {
  const CLASS_IN_FILE: [selector: string, definedIn: string][] = [
    ['.ui-radio-card__dot', '../components/ui/RadioCardGroup.tsx'],
    ['.ui-persona-card__dot', '../components/ui/PersonaCard.tsx'],
    ['.ui-select-item', '../components/ui/Select.tsx'],
    ['.ui-progress__fill', '../components/ui/ProgressIndicator.tsx'],
  ];

  it.each(CLASS_IN_FILE)('%s appears in %s', (className, file) => {
    expect(read(file)).toContain(className.replace(/^\./, ''));
  });

  it('the styles it overrides are still the ones in ui.css', () => {
    const uiCss = read('../components/ui/ui.css');
    // If any of these stops being a bare background fill / suppressed outline,
    // the corresponding repair has become unnecessary and should be deleted
    // rather than left as an unexplained override.
    expect(uiCss).toMatch(
      /\.ui-radio-card__dot,\s*\.ui-persona-card__dot\s*{[^}]*background-color:\s*var\(--color-accent\)/,
    );
    expect(uiCss).toMatch(/\.ui-select-item\[data-highlighted\]\s*{[^}]*outline:\s*none/);
    expect(uiCss).toMatch(
      /\.ui-progress__fill\s*{[^}]*background-color:\s*var\(--color-accent\)/,
    );
  });
});

describe('the layout actually loads it', () => {
  it('Base.astro imports forced-colors.css', () => {
    expect(read('../layouts/Base.astro')).toContain(
      "import '../styles/forced-colors.css'",
    );
  });
});
