import { registry } from '../../registry.js';
import {
  CreateJournalSchema,
  JournalResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

/**
 * POST /journals
 * Create a new journal entry
 */
registry.registerPath({
  method: 'post',
  path: '/journals',
  tags: ['Journal'],
  summary: 'Create a new journal entry',
  description: `Creates a new journal entry for the specified date.

- Each user can only have one journal per date
- Date must be in YYYYMMDD format
- Content must be 1-100,000 characters
- Returns 409 if journal already exists for this date

Requires authentication.`,
  security: [{ bearerAuth: [] }],

  request: {
    body: {
      description: 'Journal entry data',
      required: true,
      content: {
        'application/json': {
          schema: CreateJournalSchema,
          example: {
            date: '20231215',
            content:
              'Today was a great day! I finished the OpenAPI documentation...',
          },
        },
      },
    },
  },

  responses: {
    201: {
      description: 'Journal entry created successfully',
      content: {
        'application/json': {
          schema: JournalResponseSchema,
          example: {
            success: true,
            message: 'Journal entry created successfully',
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
      description: 'Invalid input or validation error',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          examples: {
            invalidDate: {
              summary: 'Invalid date format',
              value: {
                success: false,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: [
                    {
                      field: 'date',
                      message: 'Date must be in YYYYMMDD format',
                    },
                  ],
                },
              },
            },
            contentTooLong: {
              summary: 'Content exceeds maximum length',
              value: {
                success: false,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: [
                    {
                      field: 'content',
                      message: 'Content must be less than 100,000 characters',
                    },
                  ],
                },
              },
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

    409: {
      description: 'Journal entry already exists for this date',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          example: {
            success: false,
            message: 'Journal entry already exists for this date',
            error: { code: 'JOURNAL_EXISTS' },
          },
        },
      },
    },
  },
});
