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

  it('should save and get journal entry', () => {
    const journal = {
      date: '20250102',
      hash: 'abc123',
      content: 'Test journal entry',
      createdAt: new Date('2025-01-02T10:00:00.000Z'),
      updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      deletedAt: null,
    };

    store.save(journal);
    const retrieved = store.get('20250102');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.date).toBe('20250102');
    expect(retrieved?.content).toBe('Test journal entry');
    expect(retrieved?.hash).toBe('abc123');
  });

  it('should return null for non-existent entry', () => {
    const entry = store.get('20991231');
    expect(entry).toBeNull();
  });

  it('should check if entry exists', () => {
    const journal = {
      date: '20250102',
      hash: 'abc123',
      content: 'Test entry',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    store.save(journal);

    expect(store.exists('20250102')).toBe(true);
    expect(store.exists('20991231')).toBe(false);
  });

  it('should delete journal entry', () => {
    const journal = {
      date: '20250102',
      hash: 'abc123',
      content: 'Test entry',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    store.save(journal);
    expect(store.exists('20250102')).toBe(true);

    store.delete('20250102');
    expect(store.exists('20250102')).toBe(false);
  });

  it('should list all journal entries', () => {
    const journal1 = {
      date: '20250101',
      hash: 'hash1',
      content: 'First entry',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const journal2 = {
      date: '20250102',
      hash: 'hash2',
      content: 'Second entry',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    store.save(journal1);
    store.save(journal2);

    const entries = store.list();

    expect(entries).toHaveLength(2);
    expect(entries[0].date).toBe('20250102'); // sorted descending
    expect(entries[1].date).toBe('20250101');
  });

  describe('Serialization', () => {
    it('should serialize journal to markdown with YAML frontmatter', () => {
      const journal = {
        date: '20250102',
        hash: 'abc123',
        content: 'My journal content',
        createdAt: new Date('2025-01-02T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T11:00:00.000Z'),
        deletedAt: null,
      };

      store.save(journal);

      // Read raw file to check format
      const filepath = path.join(testDir, 'journals', '20250102.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('---');
      expect(content).toContain("date: '20250102'");
      expect(content).toContain('hash: abc123');
      expect(content).toContain("createdAt: '2025-01-02T10:00:00.000Z'");
      expect(content).toContain("updatedAt: '2025-01-02T11:00:00.000Z'");
      expect(content).toContain('deletedAt: null');
      expect(content).toContain('My journal content');
    });

    it('should parse journal from markdown with YAML frontmatter', () => {
      const journal = {
        date: '20250103',
        hash: 'xyz789',
        content: '# My Journal\n\nSome content here',
        createdAt: new Date('2025-01-03T08:00:00.000Z'),
        updatedAt: new Date('2025-01-03T09:00:00.000Z'),
        deletedAt: null,
      };

      store.save(journal);
      const retrieved = store.get('20250103');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.date).toBe('20250103');
      expect(retrieved?.hash).toBe('xyz789');
      expect(retrieved?.content).toBe('# My Journal\n\nSome content here');
      expect(retrieved?.createdAt.toISOString()).toBe(
        '2025-01-03T08:00:00.000Z'
      );
      expect(retrieved?.updatedAt.toISOString()).toBe(
        '2025-01-03T09:00:00.000Z'
      );
      expect(retrieved?.deletedAt).toBeNull();
    });

    it('should handle legacy content-only files without frontmatter', () => {
      // Create a legacy file without frontmatter
      const journalsDir = path.join(testDir, 'journals');
      fs.mkdirSync(journalsDir, { recursive: true });

      const legacyContent = 'Just plain markdown content without frontmatter';
      const filepath = path.join(journalsDir, '20250104.md');
      fs.writeFileSync(filepath, legacyContent);

      const retrieved = store.get('20250104');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.date).toBe('20250104');
      expect(retrieved?.content).toBe(legacyContent);
      expect(retrieved?.hash).toBeTruthy(); // Should generate hash
      expect(retrieved?.createdAt).toBeInstanceOf(Date);
      expect(retrieved?.updatedAt).toBeInstanceOf(Date);
      expect(retrieved?.deletedAt).toBeNull();
    });

    it('should preserve deletedAt timestamp when set', () => {
      const journal = {
        date: '20250105',
        hash: 'def456',
        content: 'Deleted entry',
        createdAt: new Date('2025-01-05T10:00:00.000Z'),
        updatedAt: new Date('2025-01-05T11:00:00.000Z'),
        deletedAt: new Date('2025-01-05T12:00:00.000Z'),
      };

      store.save(journal);
      const retrieved = store.get('20250105');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.deletedAt).not.toBeNull();
      expect(retrieved?.deletedAt?.toISOString()).toBe(
        '2025-01-05T12:00:00.000Z'
      );
    });
  });
});
