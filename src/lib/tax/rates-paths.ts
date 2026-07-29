/**
 * The `getStaticPaths` logic for `/rates/[year]/`, pulled out of the `.astro`
 * page into a plain function.
 *
 * Not for reuse elsewhere — the only caller is `src/pages/rates/[year].astro`.
 * It exists here, rather than inline in that file's frontmatter, because
 * TypeScript's ambient module type for `*.astro` only describes a default
 * export: `tsc --noEmit` (the second half of `npm run typecheck`, run over
 * the whole project rather than through Astro's own type-aware checker)
 * cannot see a named `getStaticPaths` exported from an `.astro` file at all,
 * and `rates-and-sources.test.ts` needs to call this function directly to
 * assert "one path per file in `data/tax-years/`, no route hardcoded" without
 * going through a full Astro render.
 */

import { loadTaxYears, type LoadedTaxYear } from './load.ts';
import type { TaxYearFile } from './schema.ts';

export interface RatesStaticPath {
  params: { year: string };
  props: { taxYear: TaxYearFile };
}

export function ratesStaticPaths(
  loaded: readonly LoadedTaxYear[] = loadTaxYears(),
): RatesStaticPath[] {
  return loaded.map(({ file, data }) => ({
    params: { year: file.replace(/\.json$/, '') },
    props: { taxYear: data },
  }));
}
