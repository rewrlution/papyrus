import { registry } from '../../registry.js';
import {
  DateParamSchema,
  UpdateJournalSchema,
  JournalResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

/**
 * PUT /journals/{date}
 * Update a journal entry
 */
registry.registerPath({
  method: 'put',
  path: '/journals/{date}',
  tags: ['Journal'],
  summary: 'Update a journal entry',
  description: `Updates the content of an existing journal entry.

- Only content can be updated (date cannot be changed)
- Content must be 1-100,000 characters
- Updates the updatedAt timestamp
- Returns 404 if journal doesn't exist

Requires authentication.`,
  security: [{ bearerAuth: [] }],

  request: {
    params: DateParamSchema,
    body: {
      description: 'Updated journal content',
      required: true,
      content: {
        'application/json': {
          schema: UpdateJournalSchema,
          example: {
            content: 'Updated content for this journal entry...',
          },
        },
      },
    },
  },

  responses: {
    200: {
      description: 'Journal entry updated successfully',
      content: {
        'application/json': {
          schema: JournalResponseSchema,
          example: {
            success: true,
            message: 'Journal entry updated successfully',
            data: {
              date: '20231215',
              content: 'Updated content...',
              hash: 'a3f5e9d2c1b8a7f6e5d4c3b2a1',
              createdAt: '2023-12-15T10:30:00.000Z',
              updatedAt: '2023-12-15T14:45:00.000Z',
              deletedAt: null,
            },
          },
        },
      },
    },

    400: {
      description: 'Invalid input',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          example: {
            success: false,
            message: 'Validation failed',
            error: {
              code: 'VALIDATION_ERROR',
              details: [{ field: 'content', message: 'Content is required' }],
            },
          },
        },
      },
    },

    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
        },
      },
    },

    404: {
      description: 'Journal entry not found',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          example: {
            success: false,
            message: 'Journal entry not found',
            error: { code: 'JOURNAL_NOT_FOUND' },
          },
        },
      },
    },
  },
});
