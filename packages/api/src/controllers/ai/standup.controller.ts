/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Response } from 'express';

import { StandupRequest } from '@rewrlution/papyrus-shared';

import { RequestWithUser } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/handlers.js';
import { ValidatedRequest } from '../../middleware/validate.js';
import { StandupService } from '../../services/ai/standup.service.js';

export const StandupController = {
  generate: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<StandupRequest>,
      res: Response
    ) => {
      const userId = req.user.id;
      const options: StandupRequest = req.validated;

      // Usage allowed - proceed with streaming
      // set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Helper to write SSE events
      const writeEvent = (event: string, data: any) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        for await (const event of StandupService.generateStream(
          userId,
          options
        )) {
          switch (event.type) {
            case 'thinking':
              writeEvent('thinking', { message: event.message });
              break;
            case 'content':
              writeEvent('content', { text: event.text });
              break;
            case 'done':
              writeEvent('done', {
                journal_date: event.journal_date,
                usage: event.usage,
              });
              break;
            case 'error':
              writeEvent('error', { message: event.message });
              break;
          }
        }

        // close the stream
        res.end();
      } catch (error) {
        console.error('[Standup] stream error:', error);
        writeEvent('error', {
          message: 'An error occurred while generating standup notes',
        });
        res.end();
      }
    }
  ),
};
