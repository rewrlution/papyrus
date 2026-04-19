import os from 'os';
import path from 'path';

import { describe, it, expect } from 'vitest';

import { PATHS } from '../src/paths.js';

describe('PATHS', () => {
  it('journalDir is inside dataDir', () => {
    expect(PATHS.journalDir).toBe(path.join(PATHS.dataDir, 'journals'));
  });

  it('profilePath is inside configDir', () => {
    expect(PATHS.profilePath).toBe(path.join(PATHS.configDir, 'profile.md'));
  });

  it('all paths are absolute', () => {
    for (const [key, value] of Object.entries(PATHS)) {
      expect(path.isAbsolute(value), `${key} should be absolute`).toBe(true);
    }
  });

  it('all paths are under the home directory', () => {
    const home = os.homedir();
    for (const [key, value] of Object.entries(PATHS)) {
      expect(value.startsWith(home), `${key} should be under home dir`).toBe(
        true
      );
    }
  });

  it('paths do not contain the suffix -nodejs', () => {
    // env-paths adds -nodejs suffix by default — we suppress it with { suffix: '' }
    for (const [key, value] of Object.entries(PATHS)) {
      expect(value, `${key} should not contain '-nodejs'`).not.toContain(
        '-nodejs'
      );
    }
  });
});
