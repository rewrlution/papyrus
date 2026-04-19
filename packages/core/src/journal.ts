/**
 * Journal read/write operations.
 *
 * Journals are stored as markdown files with YAML frontmatter:
 *   {journalDir}/YYYYMMDD.md
 *
 * This module is the single source of truth for journal file operations.
 * Both the CLI and plugin skills should use this — not raw fs calls.
 */

import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

import matter from 'gray-matter';

import { PATHS } from './paths.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface JournalEntry {
  date: string; // YYYYMMDD
  content: string; // body text, frontmatter stripped
  hash: string; // SHA-256 of content
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface JournalMeta {
  date: string;
  path: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function journalPath(date: string, journalDir: string): string {
  return path.join(journalDir, `${date}.md`);
}

function contentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Read a single journal entry. Returns null if no entry exists for that date.
 */
export function readJournal(
  date: string,
  journalDir: string = PATHS.journalDir
): JournalEntry | null {
  const filePath = journalPath(date, journalDir);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    date: String(data.date ?? date),
    content: content.trim(),
    hash: String(data.hash ?? contentHash(content)),
    createdAt: String(data.createdAt ?? new Date().toISOString()),
    updatedAt: String(data.updatedAt ?? new Date().toISOString()),
  };
}

/**
 * Write a journal entry for a given date.
 * Preserves createdAt if an entry already exists.
 */
export function writeJournal(
  date: string,
  content: string,
  journalDir: string = PATHS.journalDir
): void {
  ensureDir(journalDir);

  const now = new Date().toISOString();
  const existing = readJournal(date, journalDir);

  const frontmatter = {
    date,
    hash: contentHash(content),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  fs.writeFileSync(
    journalPath(date, journalDir),
    matter.stringify(content, frontmatter),
    'utf-8'
  );
}

/**
 * List all journal entries sorted newest first.
 * Returns metadata only — use readJournal() to get content.
 */
export function listJournals(
  journalDir: string = PATHS.journalDir
): JournalMeta[] {
  if (!fs.existsSync(journalDir)) return [];

  return fs
    .readdirSync(journalDir)
    .filter((f) => /^\d{8}\.md$/.test(f))
    .map((f) => ({
      date: f.replace('.md', ''),
      path: path.join(journalDir, f),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Read all journal entries within an inclusive date range.
 * from and to are YYYYMMDD strings.
 */
export function readJournalsInRange(
  from: string,
  to: string,
  journalDir: string = PATHS.journalDir
): JournalEntry[] {
  return listJournals(journalDir)
    .filter(({ date }) => date >= from && date <= to)
    .flatMap(({ date }) => {
      const entry = readJournal(date, journalDir);
      return entry ? [entry] : [];
    });
}

// ─── CLI entry point ─────────────────────────────────────────────────────────
// Skills call this file directly to perform journal operations.
//
// Usage:
//   node dist/journal.js list
//   node dist/journal.js read 20260411
//   node dist/journal.js write 20260411 "<content>"
//   node dist/journal.js range 20260101 20260411

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const [, , command, ...args] = process.argv;

  const output = (() => {
    switch (command) {
      case 'list':
        return listJournals();

      case 'read': {
        const entry = readJournal(args[0] ?? '');
        if (!entry) {
          process.stderr.write(`No journal found for ${args[0]}\n`);
          process.exit(1);
        }
        return entry;
      }

      case 'range':
        return readJournalsInRange(args[0] ?? '', args[1] ?? '');

      case 'write': {
        const [date, content] = args;
        if (!date || !content) {
          process.stderr.write(
            'Usage: journal.ts write <YYYYMMDD> <content>\n'
          );
          process.exit(1);
        }
        writeJournal(date, content);
        return { ok: true };
      }

      default:
        process.stderr.write(
          'Usage: journal.ts list | read <YYYYMMDD> | write <YYYYMMDD> <content> | range <from> <to>\n'
        );
        process.exit(1);
    }
  })();

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}
