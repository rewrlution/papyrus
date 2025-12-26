import { registry } from '../../registry.js';
import {
  DateParamSchema,
  JournalResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

/**
 * GET /journals/{date}
 * Get a specific journal entry by date
 */
registry.registerPath({
  method: 'get',
  path: '/journals/{date}',
  tags: ['Journal'],
  summary: 'Get a specific journal entry',
  description: `Retrieves a journal entry by date.

- Date must be in YYYYMMDD format
- Returns 404 if journal doesn't exist or was deleted
- User can only access their own journals

Requires authentication.`,
  security: [{ bearerAuth: [] }],

  request: {
    params: DateParamSchema,
  },

  responses: {
    200: {
      description: 'Journal entry retrieved successfully',
      content: {
        'application/json': {
          schema: JournalResponseSchema,
          example: {
            success: true,
            message: 'Journal entry retrieved successfully',
            data: {
              date: '20231215',
              content: 'Today was a great day!...',
              hash: 'a3f5e9d2c1b8a7f6e5d4c3b2a1',
              createdAt: '2023-12-15T10:30:00.000Z',
              updatedAt: '2023-12-15T10:30:00.000Z',
              deletedAt: null,
            },
          },
        },
      },
    },

    400: {
      description: 'Invalid date format',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          example: {
            success: false,
            message: 'Validation failed',
            error: {
              code: 'VALIDATION_ERROR',
              details: [
                { field: 'date', message: 'Date must be in YYYYMMDD format' },
              ],
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
          example: {
            success: false,
            message: 'Authentication required',
            error: { code: 'UNAUTHORIZED' },
          },
        },
      },
    },
  },
});
