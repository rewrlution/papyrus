import { render } from 'ink';
import React from 'react';

import {
  StandupRequestSchema,
  type StandupRequest,
} from '@rewrlution/papyrus-shared';

import { StandupStream } from '../../components/StandupStream.js';
import { ensureAuthenticated } from '../../lib/auth/require-auth.js';
import { error } from '../../utils/messages.js';

export async function generateStandup(options: StandupRequest): Promise<void> {
  ensureAuthenticated();

  // Validate options using shared schema
  const result = StandupRequestSchema.safeParse(options);
  if (!result.success) {
    error(result.error.issues[0].message);
    process.exit(1);
  }

  const { waitUntilExit } = render(
    React.createElement(StandupStream, {
      ...result.data,
      onComplete: () => {
        // Component will call this when done
      },
    })
  );

  await waitUntilExit();
}
