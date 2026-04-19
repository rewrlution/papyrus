import fs from 'fs';
import os from 'os';
import path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  readJournal,
  writeJournal,
  listJournals,
  readJournalsInRange,
} from '../src/journal.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'papyrus-journal-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('writeJournal / readJournal', () => {
  it('writes and reads back content correctly', () => {
    writeJournal('20260411', 'Fixed a gnarly auth bug today.', tmpDir);
    const entry = readJournal('20260411', tmpDir);

    expect(entry).not.toBeNull();
    expect(entry!.content).toBe('Fixed a gnarly auth bug today.');
    expect(entry!.date).toBe('20260411');
  });

  it('returns null for a date with no entry', () => {
    const entry = readJournal('20260101', tmpDir);
    expect(entry).toBeNull();
  });

  it('preserves createdAt across updates', () => {
    writeJournal('20260411', 'First write.', tmpDir);
    const first = readJournal('20260411', tmpDir)!;

    writeJournal('20260411', 'Updated content.', tmpDir);
    const second = readJournal('20260411', tmpDir)!;

    expect(second.createdAt).toBe(first.createdAt);
    expect(second.content).toBe('Updated content.');
  });

  it('updates the hash when content changes', () => {
    writeJournal('20260411', 'Original.', tmpDir);
    const before = readJournal('20260411', tmpDir)!;

    writeJournal('20260411', 'Changed.', tmpDir);
    const after = readJournal('20260411', tmpDir)!;

    expect(after.hash).not.toBe(before.hash);
  });
});

describe('listJournals', () => {
  it('returns empty array when directory does not exist', () => {
    expect(listJournals('/nonexistent/path')).toEqual([]);
  });

  it('lists only valid YYYYMMDD.md files, sorted newest first', () => {
    writeJournal('20260409', 'Entry 1', tmpDir);
    writeJournal('20260411', 'Entry 3', tmpDir);
    writeJournal('20260410', 'Entry 2', tmpDir);
    fs.writeFileSync(path.join(tmpDir, 'notes.md'), 'ignored');

    const list = listJournals(tmpDir);
    expect(list.map((e) => e.date)).toEqual([
      '20260411',
      '20260410',
      '20260409',
    ]);
  });
});

describe('readJournalsInRange', () => {
  beforeEach(() => {
    writeJournal('20260408', 'Before range', tmpDir);
    writeJournal('20260409', 'Start of range', tmpDir);
    writeJournal('20260410', 'Middle', tmpDir);
    writeJournal('20260411', 'End of range', tmpDir);
    writeJournal('20260412', 'After range', tmpDir);
  });

  it('returns only entries within the inclusive date range', () => {
    const entries = readJournalsInRange('20260409', '20260411', tmpDir);
    expect(entries.map((e) => e.date)).toEqual([
      '20260411',
      '20260410',
      '20260409',
    ]);
  });

  it('returns empty array when no entries fall in range', () => {
    const entries = readJournalsInRange('20260101', '20260201', tmpDir);
    expect(entries).toEqual([]);
  });
});
