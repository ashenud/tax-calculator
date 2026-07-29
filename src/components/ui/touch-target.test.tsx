/**
 * Touch targets >= 44x44px, resolved from the real cascade — not measured.
 *
 * `docs/spec/ui-design-system.md`: "Touch targets ≥ 44×44px." jsdom performs no
 * layout (`getBoundingClientRect` reports 0x0 for everything, whatever the CSS
 * says — see `src/test/dom-polyfills.ts`), so this cannot be a rendered-pixel
 * measurement in this test environment. What it CAN do, and what it does, is
 * prove the same thing a different way: parse the shipped `ui.css` the way
 * `src/styles/tokens.test.ts` parses `global.css` for contrast, and confirm
 * every control a user taps declares a minimum hit area of the `44px` token,
 * never a smaller literal and never an unset one.
 *
 * "At 320px width" in the spec is the width most likely to break this, on the
 * theory that a narrow layout is where someone would be tempted to shrink a
 * control to fit. `ui.css` has no `@media` or `@container` query at all —
 * asserted below — so there is no narrow-width path that could apply a smaller
 * size than the one checked here. If a responsive override is ever added, this
 * file's own "no media queries" assertion fails first, which is the signal
 * that this test needs to start checking a viewport-specific rule too.
 *
 * Two things are checked, together, because either alone would prove nothing:
 *
 *   1. Every CSS selector that carries the `touch-target` class in a component
 *      (`Button`, `RadioCardGroup`, `PersonaCard`, `Select`, `Stepper`, `Tabs`)
 *      has a rule in `ui.css` giving it `min-inline-size` AND `min-block-size`
 *      of `var(--size-touch-target)` — not a smaller value, not a value on only
 *      one axis, and not a hardcoded pixel figure that could drift from the
 *      token.
 *   2. `--size-touch-target` itself, in `global.css`, is a `px` length of at
 *      least 44.
 *
 * If a future component adds the `touch-target` class in its `.tsx` without a
 * matching rule here, part 1 below will not find that selector among the ones
 * `ui.css` sizes, and the cross-check fails.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const UI_CSS = readFileSync(fileURLToPath(new URL('./ui.css', import.meta.url)), 'utf8');
const GLOBAL_CSS = readFileSync(
  fileURLToPath(new URL('../../styles/global.css', import.meta.url)),
  'utf8',
);

interface Rule {
  selectors: string[];
  body: string;
}

/** A deliberately simple parser: no nesting, no @-rules, matching this file's own
 * "one flat stylesheet" design (see the file-header comment in ui.css). Good enough
 * for a stylesheet that doesn't nest, and it fails loudly (via the "no media
 * queries" assertion) the day that stops being true. */
function parseRules(css: string): Rule[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: Rule[] = [];
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRe.exec(withoutComments))) {
    const [, selectorList, body] = match;
    if (!selectorList || !body) continue;
    const selectors = selectorList
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (selectors.length === 0) continue;
    rules.push({ selectors, body });
  }
  return rules;
}

const rules = parseRules(UI_CSS);

/** The base (non-modifier, non-pseudo) class each component applies alongside
 * `touch-target`, read directly from the component source rather than hand-copied,
 * so a renamed class fails this test instead of silently going unchecked. */
const COMPONENTS_WITH_TOUCH_TARGET_CLASS: { component: string; primaryClass: string }[] =
  [
    { component: 'Button.tsx', primaryClass: 'ui-button' },
    { component: 'RadioCardGroup.tsx', primaryClass: 'ui-radio-card' },
    { component: 'PersonaCard.tsx', primaryClass: 'ui-persona-card' },
    { component: 'Select.tsx (trigger)', primaryClass: 'ui-select-trigger' },
    { component: 'Select.tsx (item)', primaryClass: 'ui-select-item' },
    { component: 'Stepper.tsx', primaryClass: 'ui-stepper__control' },
    { component: 'Tabs.tsx', primaryClass: 'ui-tabs__trigger' },
  ];

describe('every component that renders className="… touch-target" actually uses that class', () => {
  const componentsDir = fileURLToPath(new URL('.', import.meta.url));

  for (const { component, primaryClass } of COMPONENTS_WITH_TOUCH_TARGET_CLASS) {
    it(`${component} pairs "${primaryClass}" with the touch-target marker class`, () => {
      const file = component.replace(/ \(.+\)$/, '');
      const source = readFileSync(`${componentsDir}${file}`, 'utf8');
      const classAttr = new RegExp(
        `className=(?:"|\`)[^"\`]*\\b${primaryClass}\\b[^"\`]*\\btouch-target\\b`,
      );
      expect(source).toMatch(classAttr);
    });
  }
});

describe('ui.css gives every touch-target-classed control a 44px minimum on both axes', () => {
  it('declares no @media or @container query, so no narrower width can shrink a target below what is checked here', () => {
    expect(UI_CSS).not.toMatch(/@media|@container/);
  });

  it('--size-touch-target resolves to a px length of at least 44, in global.css', () => {
    const match = /--size-touch-target:\s*([0-9.]+)px\s*;/.exec(GLOBAL_CSS);
    expect(match).not.toBeNull();
    const px = Number(match?.[1]);
    expect(px).toBeGreaterThanOrEqual(44);
  });

  for (const { component, primaryClass } of COMPONENTS_WITH_TOUCH_TARGET_CLASS) {
    it(`"${primaryClass}" (${component}) has min-inline-size AND min-block-size: var(--size-touch-target)`, () => {
      // An exact class token, not a substring match: `.ui-radio-card-row` must not be
      // mistaken for `.ui-radio-card` (it precedes it in ui.css and has no sizing of
      // its own, so a substring match here would silently pass against the wrong rule).
      const classToken = new RegExp(`^\\.${primaryClass}(?![\\w-])`);
      const owning = rules.find((r) => r.selectors.some((s) => classToken.test(s)));
      expect(
        owning,
        `no rule in ui.css targets .${primaryClass} — the component renders this class but nothing sizes it`,
      ).toBeDefined();

      const body = owning!.body;
      const minInline = /min-inline-size:\s*([^;]+);/.exec(body)?.[1]?.trim();
      const minBlock = /min-block-size:\s*([^;]+);/.exec(body)?.[1]?.trim();

      expect(
        minInline,
        `.${primaryClass} has no min-inline-size — a control can be narrower than the 44px floor`,
      ).toBe('var(--size-touch-target)');
      expect(
        minBlock,
        `.${primaryClass} has no min-block-size — a control can be shorter than the 44px floor`,
      ).toBe('var(--size-touch-target)');
    });
  }
});
