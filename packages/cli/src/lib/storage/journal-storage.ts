import fs from 'fs';
import path from 'path';

import matter from 'gray-matter';

import { generateContentHash, JournalData } from '@rewrlution/papyrus-shared';

import { parseDateToLocalTimestamp } from '../../utils/date.js';

import { BaseStorage } from './base-storage.js';

/**
 * Manages journal entries stored as markdown files with YAML frontmatter.
 *
 * File format:
 * ---
 * date: "20251210"
 * hash: "abc123..."
 * createdAt: "2025-12-10T10:00:00.000Z"
 * updatedAt: "2025-12-10T10:00:00.000Z"
 * deletedAt: null
 * ---
 *
 * # Journal content here
 */
export class JournalStore extends BaseStorage {
  private journalsDir: string;

  constructor(dataDir?: string) {
    super();
    const dir = dataDir ?? this.getDataDir();
    this.journalsDir = path.join(dir, 'journals');
  }

  private getEntryPath(date: string): string {
    return path.join(this.journalsDir, `${date}.md`);
  }

  /**
   * Serialize JournalData to markdown with YAML frontmatter
   */
  private serializeToMarkdown(journal: JournalData): string {
    return matter.stringify(journal.content, {
      date: journal.date,
      hash: journal.hash,
      createdAt: journal.createdAt.toISOString(),
      updatedAt: journal.updatedAt.toISOString(),
      deletedAt: journal.deletedAt ? journal.deletedAt.toISOString() : null,
    });
  }

  /**
   * Parse markdown file with YAML frontmatter to JournalData
   * Handles both files with frontmatter and content-only files
   */
  private parseFromMarkdown(
    markdown: string,
    date: string
  ): JournalData | null {
    try {
      const { data, content } = matter(markdown);

      // Case 1: Has frontmatter with all required fields
      if (data.date && data.hash && data.createdAt && data.updatedAt) {
        return {
          date: data.date,
          hash: data.hash,
          content: content.trim(),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
        };
      }

      // Case 2: No frontmatter - content-only file (legacy)
      // Use filename as date, create timestamps in local timezone
      if (Object.keys(data).length === 0) {
        const timestamp = parseDateToLocalTimestamp(date);

        return {
          date,
          hash: generateContentHash(content.trim()),
          content: content.trim(),
          createdAt: timestamp,
          updatedAt: timestamp,
          deletedAt: null,
        };
      }

      // Case 3: Partial/invalid frontmatter
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Save journal entry as markdown file
   */
  save(journal: JournalData): void {
    const markdown = this.serializeToMarkdown(journal);
    const filepath = this.getEntryPath(journal.date);
    this.writeFile(filepath, markdown);
  }

  /**
   * Get journal entry by date
   */
  get(date: string): JournalData | null {
    const filepath = this.getEntryPath(date);
    const markdown = this.readFile(filepath);

    if (!markdown) {
      return null;
    }

    return this.parseFromMarkdown(markdown, date);
  }

  /**
   * Delete journal entry
   */
  delete(date: string): void {
    const filepath = this.getEntryPath(date);
    this.deleteFile(filepath);
  }

  /**
   * Check if entry exists for date
   */
  exists(date: string): boolean {
    const filepath = this.getEntryPath(date);
    return this.fileExists(filepath);
  }

  /**
   * List all journal entries (sorted by date descending)
   */
  list(): JournalData[] {
    this.ensureDir(this.journalsDir);

    const files = fs.readdirSync(this.journalsDir);
    const entries: JournalData[] = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const date = file.replace('.md', '');
        const entry = this.get(date);
        if (entry) {
          entries.push(entry);
        }
      }
    }

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }
}
