/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from 'ink';
import React from 'react';

import { AppLayout } from '../../components/AppLayout.js';
import { withAlternateScreen } from '../../utils/alternate-screen.js';
import * as msg from '../../utils/messages.js';

export async function launchApp(): Promise<void> {
  try {
    // Render the new app layout in alternate screen
    await withAlternateScreen(async () => {
      const { waitUntilExit } = render(React.createElement(AppLayout));
      await waitUntilExit();
    });
  } catch (error: any) {
    msg.error(`Failed to launch Papyrus app: ${error.message}`);
  }
}
