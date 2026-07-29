/**
 * @vitest-environment jsdom
 *
 * Axe over the whole component gallery — every P08 primitive, in every state
 * `ComponentGallery.tsx` puts on the page. "Axe reports zero violations on the demo
 * page" (`docs/prompts/P08-ui-primitives.md`) is checked here with a real, automated
 * scan of the rendered DOM, not a manual walkthrough.
 *
 * `color-contrast` is disabled for this run specifically: axe's contrast check needs
 * real paint (computed background colours through the whole box-shadow/gradient
 * stack, which jsdom does not do — see `src/test/dom-polyfills.ts` on jsdom's layout
 * gap generally), and this repo already has a dedicated, more rigorous contrast
 * suite that does the maths directly against the OKLCH tokens rather than asking a
 * browser to render and sample pixels: `src/styles/tokens.test.ts`. Disabling it here
 * avoids a false pass/fail from a check jsdom cannot actually perform, not avoiding
 * contrast checking altogether.
 */

import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { ComponentGallery } from './ComponentGallery.tsx';
import { installDomPolyfills } from '../test/dom-polyfills.ts';

installDomPolyfills();
afterEach(cleanup);

describe('the component gallery', () => {
  it('has zero axe violations', async () => {
    const { container } = render(<ComponentGallery />);

    const results = await axe.run(container, {
      rules: {
        // See the file header: jsdom cannot paint, so this check cannot run
        // meaningfully here. Covered instead by src/styles/tokens.test.ts.
        'color-contrast': { enabled: false },
      },
    });

    if (results.violations.length > 0) {
      const report = results.violations
        .map((violation) => {
          const targets = violation.nodes
            .map((node) => node.target.join(' '))
            .join('\n    ');
          return `[${violation.impact}] ${violation.id} — ${violation.help}\n    ${targets}\n    ${violation.helpUrl}`;
        })
        .join('\n\n');
      // Printed via a failing assertion message, not console.log, so it survives
      // whatever reporter is running and isn't lost the moment the test passes again.
      expect.fail(`axe found ${results.violations.length} violation(s):\n\n${report}`);
    }

    expect(results.violations).toEqual([]);
    // A scan that finds nothing to check (e.g. the gallery rendered empty) would
    // pass "zero violations" vacuously. Guard against that.
    expect(results.passes.length).toBeGreaterThan(0);
  }, 20_000);
});
