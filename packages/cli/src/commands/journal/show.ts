import { render } from 'ink';
import React from 'react';

import { JournalViewer } from '../../components/JournalViewer.js';
import { journalStore } from '../../lib/storage/index.js';
import { formatDate, parseDate } from '../../utils/date.js';
import { ShowOptions } from '../types.js';

export async function showEntry(options: ShowOptions): Promise<void> {
  const dateInput = options.date;
  const date = parseDate(dateInput);
  const displayDate = formatDate(date);

  if (!date) {
    console.error(`Error: Invalid date "${dateInput}"`);
    console.error(
      'Use formats like: today, yesterday, tomorrow, or YYYYMMDD (e.g., 20260104)'
    );
    process.exit(1);
  }

  // Check if entry exists
  if (!journalStore.exists(date)) {
    console.error(`No journal entry found for ${displayDate}`);
    console.error(`Run 'papyrus add -d ${date}' to create one`);
    process.exit(1);
  }

  // Load the entry
  const content = journalStore.load(date);
  if (!content) {
    console.error(`Error: Failed to load journal entry for ${date}`);
    process.exit(1);
  }

  const { waitUntilExit } = render(
    React.createElement(JournalViewer, { date, content })
  );

  await waitUntilExit();
}
