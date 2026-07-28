#!/usr/bin/env node
/**
 * Generates data/schema/tax-year.schema.json from the Zod schema in
 * src/lib/tax/schema.ts, using zod v4's native `z.toJSONSchema()`.
 *
 * Zod is the source of truth (see docs/spec/data-model.md, "Validation"); this file
 * exists only so someone maintaining data/tax-years/*.json without reading
 * TypeScript still gets editor validation.
 *
 * Usage: node scripts/generate-json-schema.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { taxYearFileSchema } from '../src/lib/tax/schema.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = resolve(ROOT, 'data/schema/tax-year.schema.json');

const jsonSchema = z.toJSONSchema(taxYearFileSchema, {
  // Custom (`superRefine`) cross-field checks — src cross-reference, band shape,
  // period shape, etc. — cannot be expressed in JSON Schema. Zod represents them as
  // an "unrepresentable" note rather than failing; this is expected and does not
  // reduce the value of the generated file for editor autocomplete/validation of the
  // structural shape, which is most of what an editor can check anyway.
  unrepresentable: 'any',
});

jsonSchema.$id = 'https://github.com/tax-calculator/data/schema/tax-year.schema.json';
jsonSchema.title = 'Sri Lanka tax-year data file';
jsonSchema.description =
  'Generated from src/lib/tax/schema.ts — do not hand-edit. Run `node scripts/generate-json-schema.mjs` to regenerate. ' +
  'Structural checks only: the cross-field rules (every src resolves to a sources key, band shape, period shape, ' +
  'rateCaps/conditions references) are enforced by the Zod schema at build time, not by this JSON Schema file.';

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, `${JSON.stringify(jsonSchema, null, 2)}\n`, 'utf-8');

console.log(`wrote ${OUT_FILE}`);
