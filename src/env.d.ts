/// <reference types="astro/client" />

/**
 * Fallback declaration so plain `tsc --noEmit` can resolve `.astro` imports
 * from `.ts` test files. Astro ships no `declare module '*.astro'`, because
 * `astro check` resolves components through the Astro language server instead,
 * and `tsc` has no idea how to read an `.astro` file.
 *
 * This is a FALLBACK, not a replacement. TypeScript prefers real module
 * resolution and only falls back to a wildcard ambient declaration when nothing
 * else matches, so `astro check` still resolves each component properly and
 * still typechecks its props. `npm run typecheck` runs both, which means a
 * wrong prop on <AsAtStamp> is still a build error — verified by deliberately
 * passing one and watching it fail.
 */
declare module '*.astro' {
  const Component: import('astro/runtime/server/index.js').AstroComponentFactory;
  export default Component;
}
