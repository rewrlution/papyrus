import fs from 'fs';
import path from 'path';

import { BaseStorage } from './base-storage.js';

export interface JournalFileInfo {
  date: string;
  path: string;
  size: number;
  modified: Date;
}

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
   * Create a new journal entry
   */
  create(date: string, content: string = ''): void {
    const filepath = this.getEntryPath(date);
    this.writeFile(filepath, content);
  }

  /**
   * Get journal entry by date
   */
  load(date: string): string | null {
    const filepath = this.getEntryPath(date);
    return this.readFile(filepath);
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
  list(): JournalFileInfo[] {
    this.ensureDir(this.journalsDir);

    const files = fs.readdirSync(this.journalsDir);
    return files
      .filter((f) => f.endsWith('.md') && /^\d{8}\.md$/.test(f))
      .map((f) => {
        const date = f.replace('.md', '');
        const filepath = path.join(this.journalsDir, f);
        const stats = fs.statSync(filepath);
        return {
          date,
          path: filepath,
          size: stats.size,
          modified: stats.mtime,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }
}
