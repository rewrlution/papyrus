/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Response } from 'express';

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

    // Helper to delay execution
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Event 1: thinking (shows progress immediately)
      writeEvent('thinking', { message: 'Analyzing journals...' });
      await sleep(500);

      // Event 2-4: Content chunks (simulate streaming AI response)
      writeEvent('Content', {
        text: 'Yesterday:\n- Fixed authenciation bug in user service',
      });
      await sleep(500);

      writeEvent('Content', {
        text: '\n- REviewed 3 PRs from team members\n\n',
      });
      await sleep(500);

      writeEvent('Content', {
        text: 'Today:\n- Deploy hotfix to production',
      });
      await sleep(500);

      writeEvent('Content', {
        text: '\n- Attend team planning meatting\n\n',
      });
      await sleep(500);

      writeEvent('Content', {
        text: 'Blockers:\n- Waiting on design approval for feature x',
      });
      await sleep(300);

      writeEvent('done', {
        journal_date: '2025-01-08',
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
