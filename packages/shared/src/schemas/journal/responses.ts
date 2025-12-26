import { z } from 'zod';
import {
  ApiPaginatedResponseSchema,
  ApiResponseSchema,
} from '../common/response.js';
import { JournalDataSchema, JournalMetadataSchema } from '../common/journal.js';

export const JournalResponseSchema = ApiResponseSchema(
  JournalDataSchema
).openapi('JournalResponse', {
  description: 'Single journal entry response',
  example: {
    success: true,
    data: {
      date: '2025-12-25',
      hash: 'abc123def456',
      content: 'Today was a great day!',
      createdAt: '2025-12-25T10:00:00Z',
      updatedAt: '2025-12-25T10:00:00Z',
      deletedAt: null,
    },
    message: 'Journal entry retrieved successfully',
  },
});

export const JournalMetadataListResponseSchema = ApiPaginatedResponseSchema(
  JournalMetadataSchema
).openapi('JournalMetadataListResponse', {
  description: 'Paginated list of journal metadata',
  example: {
    success: true,
    data: [
      {
        date: '2025-12-25',
        hash: 'abc123',
        createdAt: '2025-12-25T10:00:00Z',
        updatedAt: '2025-12-25T10:00:00Z',
        deletedAt: null,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
    message: 'Journal entries retrieved successfully',
  },
});

export const JournalListResponseSchema = ApiPaginatedResponseSchema(
  JournalDataSchema
).openapi('JournalListResponse', {
  description: 'Paginated list of journal entries with full content',
  example: {
    success: true,
    data: [
      {
        date: '2025-12-25',
        hash: 'abc123',
        content: 'Today was a great day!',
        createdAt: '2025-12-25T10:00:00Z',
        updatedAt: '2025-12-25T10:00:00Z',
        deletedAt: null,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
    message: 'Journal entries retrieved successfully',
  },
});

export type JournalResponse = z.infer<typeof JournalResponseSchema>;
export type JournalMetadataListResponse = z.infer<
  typeof JournalMetadataListResponseSchema
>;
export type JournalListResponse = z.infer<typeof JournalListResponseSchema>;
