import { render } from 'ink';
import React from 'react';

import { SyncProgress } from '../../components/SyncProgress.js';
import { ensureAuthenticated } from '../../lib/auth/require-auth.js';

export async function syncEntries(): Promise<void> {
  ensureAuthenticated();
  render(React.createElement(SyncProgress));
}
