/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Response } from 'express';

import { AnthropicProvider, buildStandupPrompt } from '../../lib/ai/index.js';
import { RequestWithUser } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/handlers.js';

export const StandupController = {
  generate: asyncHandler(async (req: RequestWithUser, res: Response) => {
    // set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // For debugging: log authenticate user
    console.log(`[Standup] generating for user: ${req.user.email}`);

    // Helper to write SSE events
    const writeEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const testJournal = {
        date: '2025-01-07',
        content: `Today was productive. Fixed the authentication bug that was causing 30% error rate during peak hours. Took about 90 minutes to diagnose using metrics and logs. Found it was a connection pool leak in the database client. Deployed hotfix and monitored for recurrence.

Also reviewed 3 PRs from the team - two frontend changes and one backend API update. Provided feedback on error handling and code structure.

Had a great pairing session with Alice on the database migration. We're moving from MySQL to PostgreSQL and discussed the schema changes needed. Planning to complete migration next week.

Tomorrow: Need to deploy the hotfix to production first thing. Then team planning meeting at 2pm to discuss Q1 roadmap. Want to start work on the new feature X if I have time.

Blocker: Still waiting on design team to approve mockups for feature X. Been waiting 3 days now, might affect timeline.`,
      };

      writeEvent('thinking', { message: 'Analyzing journals...' });

      const prompt = buildStandupPrompt(testJournal);

      const aiProvider = new AnthropicProvider();

      // Stream AI response
      for await (const chunk of aiProvider.stream(prompt)) {
        writeEvent('content', { text: chunk });
      }

      writeEvent('done', {
        journal_date: testJournal.date,
        usage: {
          used: 3,
          limit: 20,
          resets_at: '2025-02-01T00:00:00Z',
        },
      });

      // close the stream
      res.end();
    } catch (error) {
      console.error('[Standup] stream error:', error);
      writeEvent('error', {
        message: 'An error occurred while generating standup notes',
      });
      res.end();
    }
  }),
};
