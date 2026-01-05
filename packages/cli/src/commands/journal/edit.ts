/* eslint-disable @typescript-eslint/no-explicit-any */
import { journalStore } from '../../lib/storage/index.js';
import { formatDate, parseDate } from '../../utils/date.js';
import { openInEditor } from '../../utils/editor.js';
import * as msg from '../../utils/messages.js';
import {
  JOURNAL_TEMPATE,
  stripTemplateComments,
} from '../../utils/template.js';

interface EditOptions {
  date: string;
  createIfMissing: boolean; // Whether to create new entry if missing
}

export function editJournalEntry(options: EditOptions): void {
  const { date: inputDate, createIfMissing } = options;

  try {
    // 1. Parse and validate date
    const date = parseDate(inputDate);
    const displayDate = formatDate(date);

    // 2. Load existing or create new entry
    let entry = journalStore.load(date);
    let isNew = false;

    if (!entry) {
      if (!createIfMissing) {
        // amend: fail if entry doesn't exist
        msg.error(
          `No journal entry found for ${date}`,
          `Use 'papyrus add -d ${date}' to create a new entry`
        );
      }

      // add: create new entry
      isNew = true;
      entry = '';
      msg.sparkles(`Creating new entry for ${displayDate}...`);
    } else {
      msg.info(`Loading existing entry for ${displayDate}...`);
    }

    // 3. Append hint comments for user guidance
    const contentWithHints = `${entry}\n${JOURNAL_TEMPATE}`;

    // 4. Open editor
    const editedContent = openInEditor(contentWithHints, `papyrus-${date}.md`);
    const finalContent = stripTemplateComments(editedContent);

    if (!finalContent.trim()) {
      msg.warn('No content written. Entry not saved');
      return;
    }

    journalStore.create(date, finalContent);

    // 5. Show success message with stats
    const words = countWords(finalContent);
    const chars = finalContent.length;

    msg.success(`Journal entry ${isNew ? 'created' : 'updated'} for ${date}`);
    msg.stats(`Words: ${words} | Characters: ${chars}`);
  } catch (error: any) {
    msg.error(error.message);
  }
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}
