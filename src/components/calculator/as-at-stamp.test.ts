/**
 * The two as-at stamps say the same thing.
 *
 * ADR-0003 decision 2 puts the stamp "beside every computed figure". There are
 * two implementations of it — `src/components/AsAtStamp.astro` for anything
 * rendered at build time, and `src/components/calculator/AsAtStamp.tsx` for the
 * figure inside the hydrated island, which cannot reach the `.astro` one — and
 * two implementations of the same requirement is exactly how a screenshot ends
 * up carrying a year span that disagrees with the page it came from.
 *
 * So both are rendered here, from the same inputs, and asserted to produce the
 * same year of assessment, the same span, and the same review date.
 */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';
import { AsAtStamp as ReactStamp } from './AsAtStamp.tsx';
import AstroStamp from '../AsAtStamp.astro';
import { loadTaxYears } from '../../lib/tax/load.ts';

const taxYear = loadTaxYears()[0]!.data;

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

/** Tags stripped, entities decoded enough to compare the words. */
function text(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('the client-side as-at stamp matches the build-time one', () => {
  it('states the same year of assessment, span and review date', async () => {
    const props = {
      yearOfAssessment: taxYear.yearOfAssessment,
      dataReviewedOn: taxYear.lastReviewed,
    };

    const astro = text(await container.renderToString(AstroStamp, { props }));
    const react = text(renderToStaticMarkup(createElement(ReactStamp, props)));

    for (const fragment of [
      'Year of assessment',
      taxYear.yearOfAssessment,
      // `1 Apr 2025 – 31 Mar 2026`, derived the same way in both.
      `1 Apr ${taxYear.yearOfAssessment.split('/')[0]}`,
      `31 Mar ${taxYear.yearOfAssessment.split('/')[1]}`,
      'Figures as at',
    ]) {
      expect(astro, `the .astro stamp is missing ${fragment}`).toContain(fragment);
      expect(react, `the React stamp is missing ${fragment}`).toContain(fragment);
    }

    // The formatted review date, whatever it formats to, must be identical.
    const dateFragment = /Figures as at (.+)$/.exec(astro)?.[1]?.trim();
    expect(dateFragment).toBeTruthy();
    expect(react).toContain(dateFragment!);
  });

  it('carries a machine-readable date on both', async () => {
    const props = {
      yearOfAssessment: taxYear.yearOfAssessment,
      dataReviewedOn: taxYear.lastReviewed,
    };
    const astro = await container.renderToString(AstroStamp, { props });
    const react = renderToStaticMarkup(createElement(ReactStamp, props));

    // Case-insensitively: HTML attribute names are ASCII case-insensitive and
    // React's server renderer emits the JSX spelling (`dateTime`), which every
    // HTML parser reads as `datetime`.
    const attribute = new RegExp(`datetime="${taxYear.lastReviewed}"`, 'i');
    expect(astro).toMatch(attribute);
    expect(react).toMatch(attribute);
  });
});
