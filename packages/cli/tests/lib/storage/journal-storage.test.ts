import fs from 'fs';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { JournalStore } from '../../../src/lib/storage/journal-storage';

describe('JournalStore', () => {
  let store: JournalStore;
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(process.cwd(), 'test-temp-journals');
    store = new JournalStore(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create and load journal entry', () => {
    const content = 'Test journal entry';

    store.create('20250102', content);
    const retrieved = store.load('20250102');

    expect(retrieved).toBe(content);
  });

  it('should return null for non-existent entry', () => {
    const entry = store.load('20991231');
    expect(entry).toBeNull();
  });

  it('should check if entry exists', () => {
    store.create('20250102', 'Test entry');

    expect(store.exists('20250102')).toBe(true);
    expect(store.exists('20991231')).toBe(false);
  });

  it('should delete journal entry', () => {
    store.create('20250102', 'Test entry');
    expect(store.exists('20250102')).toBe(true);

    store.delete('20250102');
    expect(store.exists('20250102')).toBe(false);
  });

  it('should list all journal entries', () => {
    store.create('20250101', 'First entry');
    store.create('20250102', 'Second entry');

    const entries = store.list();

    expect(entries).toHaveLength(2);
    expect(entries[0].date).toBe('20250102'); // sorted descending
    expect(entries[1].date).toBe('20250101');
  });

  it('should list entries with file metadata', () => {
    store.create('20250101', 'Test content');

    const entries = store.list();

    expect(entries[0].date).toBe('20250101');
    expect(entries[0].path).toContain('20250101.md');
    expect(entries[0].size).toBeGreaterThan(0);
    expect(entries[0].modified).toBeInstanceOf(Date);
  });
});
