import {
  JournalMetadataListResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

import { registry } from '../../registry.js';

/**
 * GET /journals/metadata
 * Get metadata for all journal entries
 */
registry.registerPath({
  method: 'get',
  path: '/journals/metadata',
  tags: ['Journal'],
  summary: 'Get metadata for all journal entries',
  description: `Retrieves metadata (date, hash, timestamps) for all journal entries without content.

- Returns only metadata (excludes content field for performance)
- Useful for syncing or displaying journal calendar/list views
- Only returns active entries (not soft-deleted)
- Returns empty array if no journals exist

Requires authentication.`,
  security: [{ bearerAuth: [] }],

  responses: {
    200: {
      description: 'Journal metadata retrieved successfully',
      content: {
        'application/json': {
          schema: JournalMetadataListResponseSchema,
          example: {
            success: true,
            message: 'Journal metadata retrieved successfully',
            data: [
              {
                date: '20231215',
                hash: 'a3f5e9d2c1b8a7f6e5d4c3b2a1',
                createdAt: '2023-12-15T10:30:00.000Z',
                updatedAt: '2023-12-15T10:30:00.000Z',
                deletedAt: null,
              },
              {
                date: '20231214',
                hash: 'b4g6f0e3d2c9b8a7f6e5d4c3b2',
                createdAt: '2023-12-14T09:15:00.000Z',
                updatedAt: '2023-12-14T09:15:00.000Z',
                deletedAt: null,
              },
            ],
            pagination: {
              page: 1,
              limit: 100,
              total: 150,
              totalPages: 2,
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
