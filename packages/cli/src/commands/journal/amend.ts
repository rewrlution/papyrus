import { AmendOptions } from '../types.js';

import { editJournalEntry } from './edit.js';

export async function amendEntry(options: AmendOptions): Promise<void> {
  editJournalEntry({ date: options.date, createIfMissing: false });
}
