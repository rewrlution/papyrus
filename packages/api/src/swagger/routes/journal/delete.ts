import {
  DateParamSchema,
  JournalResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

import { registry } from '../../registry.js';

/**
 * DELETE /journals/{date}
 * Soft delete a journal entry
 */
registry.registerPath({
  method: 'delete',
  path: '/journals/{date}',
  tags: ['Journal'],
  summary: 'Delete a journal entry',
  description: `Soft deletes a journal entry (sets deletedAt timestamp).

- Journal is not permanently deleted, only marked as deleted
- Deleted journals don't appear in list results
- Returns 404 if journal doesn't exist or was already deleted
- Operation is idempotent (deleting twice has same effect)

Requires authentication.`,
  security: [{ bearerAuth: [] }],

  request: {
    params: DateParamSchema,
  },

  responses: {
    200: {
      description: 'Journal entry deleted successfully',
      content: {
        'application/json': {
          schema: JournalResponseSchema,
          example: {
            success: true,
            message: 'Journal entry deleted successfully',
            data: null,
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
        },
      },
    },

    404: {
      description: 'Journal entry not found or already deleted',
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
