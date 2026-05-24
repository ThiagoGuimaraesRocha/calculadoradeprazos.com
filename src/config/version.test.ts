import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from './version';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const packageVersion = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf-8').replace(/^\uFEFF/, ''),
).version as string;

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

describe('APP_VERSION (CALC-24)', () => {
  it('segue formato SemVer major.minor.patch', () => {
    expect(APP_VERSION).toMatch(SEMVER_PATTERN);
  });

  it('reflete o campo version do package.json sem duplicar string', () => {
    expect(APP_VERSION).toBe(packageVersion);
  });
});
