import { render } from 'ink';
import React from 'react';

import { SyncProgress } from '../../components/SyncProgress.js';
import { tokenStore } from '../../lib/storage/index.js';

export async function syncEntries(): Promise<void> {
  if (!tokenStore.exists()) {
    console.error('\n❌ Error: Not authenticated.');
    console.error('💡 Run "papyrus login" first.\n');
    process.exit(1);
  }

  render(React.createElement(SyncProgress));
}
