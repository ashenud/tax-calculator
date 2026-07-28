import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadTaxYears } from './load';

/** A minimal, structurally valid tax-year file, same shape as schema.test.ts's fixture. */
function validYearFile() {
  return {
    schemaVersion: 1,
    yearOfAssessment: '2025/2026',
    period: { from: '2025-04-01', to: '2026-03-31' },
    status: 'enacted',
    lastReviewed: '2026-07-27',
    sources: {
      'ira-2017': {
        title: 'Inland Revenue Act, No. 24 of 2017',
        file: 'docs/sources/ir-act-24-2017.pdf',
      },
    },
    reliefs: {
      personal: { amount: 1800000, appliesTo: ['resident'], src: 'ira-2017#s.14' },
    },
    qualifyingPayments: [],
    rateSchedules: {
      'individual-normal': {
        label: 'Resident individual — normal rates',
        verified: true,
        bands: [
          { width: 1000000, rateBp: 600, src: 'ira-2017#s.3' },
          { width: null, rateBp: 3600, src: 'ira-2017#s.3' },
        ],
      },
    },
    rateCaps: {},
    conditions: {},
    separatelyRated: {},
    apit: { tables: [], src: 'ira-2017#s.114' },
    wht: { interest: { rateBp: 1000, verified: true, src: 'ira-2017#s.3' } },
    calendar: {
      instalments: [
        { quarter: 1, due: '2025-08-15', src: 'ira-2017#s.90(2)(a)' },
        { quarter: 2, due: '2025-11-15', src: 'ira-2017#s.90(2)(a)' },
        { quarter: 3, due: '2026-02-15', src: 'ira-2017#s.90(2)(a)' },
        { quarter: 4, due: '2026-05-15', src: 'ira-2017#s.90(2)(a)' },
      ],
      returnDueRule: { monthsAfterYearEnd: 8, src: 'ira-2017#s.93(1)' },
    },
  };
}

let dirs: string[] = [];

function makeTmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'tax-years-load-test-'));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  dirs = [];
});

describe('loadTaxYears', () => {
  it('returns an empty array for an empty directory', () => {
    const dir = makeTmpDir();
    expect(loadTaxYears(dir)).toEqual([]);
  });

  it('loads and validates a well-formed file', () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, '2025-26.json'), JSON.stringify(validYearFile()));

    const loaded = loadTaxYears(dir);
    expect(loaded).toHaveLength(1);
    const [first] = loaded;
    expect(first?.file).toBe('2025-26.json');
    expect(first?.data.yearOfAssessment).toBe('2025/2026');
  });

  it('ignores non-JSON files such as .gitkeep', () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, '.gitkeep'), '');
    writeFileSync(join(dir, '2025-26.json'), JSON.stringify(validYearFile()));

    const loaded = loadTaxYears(dir);
    expect(loaded).toHaveLength(1);
  });

  it('throws, naming the file, when a file fails schema validation', () => {
    const dir = makeTmpDir();
    const bad = validYearFile() as any;
    delete bad.reliefs.personal.src; // missing src — must fail validation

    writeFileSync(join(dir, '2099-00.json'), JSON.stringify(bad));

    expect(() => loadTaxYears(dir)).toThrow(/2099-00\.json/);
  });

  it('throws when a file is not valid JSON', () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'broken.json'), '{ not json');

    expect(() => loadTaxYears(dir)).toThrow(/not valid JSON/);
  });

  it('throws when the directory does not exist', () => {
    expect(() => loadTaxYears('/nonexistent/path/for/sure')).toThrow();
  });
});
