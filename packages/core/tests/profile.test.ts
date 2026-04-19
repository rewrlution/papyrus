import fs from 'fs';
import os from 'os';
import path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { readProfile, writeProfile, profileExists } from '../src/profile.js';
import type { ProfileInput } from '../src/profile.js';

let tmpDir: string;
let profilePath: string;

const sampleProfile: ProfileInput = {
  level: 'senior',
  goal: 'promotion',
  years_at_level: 'over_2',
  company_type: 'big_tech',
  domain: 'backend',
  staff_archetype: null,
};

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'papyrus-profile-test-'));
  profilePath = path.join(tmpDir, 'profile.md');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('profileExists', () => {
  it('returns false when no profile file exists', () => {
    expect(profileExists(profilePath)).toBe(false);
  });

  it('returns true after writing a profile', () => {
    writeProfile(sampleProfile, profilePath);
    expect(profileExists(profilePath)).toBe(true);
  });
});

describe('writeProfile / readProfile', () => {
  it('writes and reads back all fields correctly', () => {
    writeProfile(sampleProfile, profilePath);
    const profile = readProfile(profilePath);

    expect(profile).not.toBeNull();
    expect(profile!.level).toBe('senior');
    expect(profile!.goal).toBe('promotion');
    expect(profile!.company_type).toBe('big_tech');
    expect(profile!.domain).toBe('backend');
    expect(profile!.staff_archetype).toBeNull();
  });

  it('returns null when no profile exists', () => {
    expect(readProfile(profilePath)).toBeNull();
  });

  it('preserves created_at across updates', () => {
    writeProfile(sampleProfile, profilePath);
    const first = readProfile(profilePath)!;

    writeProfile({ ...sampleProfile, goal: 'job_search' }, profilePath);
    const second = readProfile(profilePath)!;

    expect(second.created_at).toBe(first.created_at);
    expect(second.goal).toBe('job_search');
  });

  it('creates parent directories if they do not exist', () => {
    const nestedPath = path.join(tmpDir, 'nested', 'dir', 'profile.md');
    writeProfile(sampleProfile, nestedPath);
    expect(fs.existsSync(nestedPath)).toBe(true);
  });
});
