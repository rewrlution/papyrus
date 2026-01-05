/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from 'ink';
import React from 'react';

import { Browser } from '../../components/Browser.js';
import { journalStore } from '../../lib/storage/index.js';
import * as msg from '../../utils/messages.js';

export async function listEntries(): Promise<void> {
  try {
    // Load all journal entries
    const journals = journalStore.list();

    // Render the interactive browser
    const { waitUntilExit } = render(
      React.createElement(Browser, { journals })
    );

    await waitUntilExit();
  } catch (error: any) {
    msg.error(`Failed to list journal entries: ${error.message}`);
  }
}
