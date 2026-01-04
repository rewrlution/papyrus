import { AddOptions } from '../types.js';

import { editJournalEntry } from './edit.js';

export async function addEntry(options: AddOptions): Promise<void> {
  editJournalEntry({ date: options.date, createIfMissing: true });
}
