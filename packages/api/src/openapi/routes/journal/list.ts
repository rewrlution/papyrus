import { registry } from '../../registry.js';
import {
  PaginationParamSchema,
  JournalListResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

/**
 * GET /journals
 * List all journal entries with pagination
 */
registry.registerPath({
  method: 'get',
  path: '/journals',
  tags: ['Journal'],
  summary: 'Get all journal entries',
  description: `Retrieves all journal entries for the authenticated user.

- Results are paginated (default 20 per page, max 100)
- Sorted by date (most recent first)
- Only returns active entries (not soft-deleted)
- Returns empty array if no journals exist

Requires authentication.`,
  security: [{ bearerAuth: [] }],

  request: {
    query: PaginationParamSchema,
  },

  responses: {
    200: {
      description: 'Journal entries retrieved successfully',
      content: {
        'application/json': {
          schema: JournalListResponseSchema,
          example: {
            success: true,
            message: 'Journal entries retrieved successfully',
            data: [
              {
                date: '20231215',
                content: 'Today was a great day!...',
                hash: 'a3f5e9d2c1b8a7f6e5d4c3b2a1',
                createdAt: '2023-12-15T10:30:00.000Z',
                updatedAt: '2023-12-15T10:30:00.000Z',
                deletedAt: null,
              },
              {
                date: '20231214',
                content: 'Worked on the API documentation...',
                hash: 'b4g6f0e3d2c9b8a7f6e5d4c3b2',
                createdAt: '2023-12-14T09:15:00.000Z',
                updatedAt: '2023-12-14T09:15:00.000Z',
                deletedAt: null,
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 150,
              totalPages: 8,
            },
          },
        },
      },
    },

    400: {
      description: 'Invalid pagination parameters',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          example: {
            success: false,
            message: 'Validation failed',
            error: {
              code: 'VALIDATION_ERROR',
              details: [{ field: 'page', message: 'Page must be positive' }],
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
