/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from 'ink';
import React from 'react';

import { JournalViewer } from '../../components/JournalViewer.js';
import { journalStore } from '../../lib/storage/index.js';
import { formatDate, parseDate } from '../../utils/date.js';
import * as msg from '../../utils/messages.js';
import { ShowOptions } from '../types.js';

export async function showEntry(options: ShowOptions): Promise<void> {
  const dateInput = options.date;

  try {
    // 1. Parse and validate date
    const date = parseDate(dateInput);
    const displayDate = formatDate(date);

    // 2. Check if entry exists
    if (!journalStore.exists(date)) {
      msg.error(
        `No journal entry found for ${displayDate}`,
        `Run 'papyrus add -d ${date}' to create one`
      );
    }

    // 3. Load the entry
    const content = journalStore.load(date);
    if (!content) {
      msg.error(`Failed to load journal entry for ${date}`);
    }

    // 4. Display the entry
    const { waitUntilExit } = render(
      React.createElement(JournalViewer, { date, content })
    );

    await waitUntilExit();
  } catch (error: any) {
    msg.error(
      error.message,
      'Use formats like: today, yesterday, tomorrow, or YYYYMMDD (e.g., 20260104)'
    );
  }
}
