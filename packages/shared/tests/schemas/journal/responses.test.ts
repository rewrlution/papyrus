import { describe, it, expect } from 'vitest';
import {
  JournalResponseSchema,
  JournalMetadataListResponseSchema,
  JournalListResponseSchema,
} from '../../../src/schemas/journal/responses.js';

describe('JournalResponseSchema', () => {
  describe('Empty Journal (Non-existing date)', () => {
    it('should validate a success response with null data and message', () => {
      const emptyJournalResponse = {
        success: true,
        data: null,
        message: 'No journal entry found for this date',
      };

      const result = JournalResponseSchema.safeParse(emptyJournalResponse);
      expect(result.success).toBe(true);
      if (result.success && result.data.success) {
        expect(result.data.data).toBeNull();
        expect(result.data.message).toBe(
          'No journal entry found for this date'
        );
      }
    });
  });

  describe('Single Journal', () => {
    it('should validate a valid journal response', () => {
      const journalResponse = {
        success: true,
        data: {
          date: '2025-12-24',
          hash: 'abc123def456',
          content: 'Today was a productive day. I worked on several projects.',
          createdAt: new Date('2025-12-24T10:00:00Z'),
          updatedAt: new Date('2025-12-24T15:30:00Z'),
          deletedAt: null,
        },
        message: 'Journal retrieved successfully',
      };

      const result = JournalResponseSchema.safeParse(journalResponse);
      expect(result.success).toBe(true);
      if (result.success && result.data.success) {
        expect(result.data.data?.date).toBe('2025-12-24');
        expect(result.data.data?.content).toBe(
          'Today was a productive day. I worked on several projects.'
        );
        expect(result.data.data?.deletedAt).toBeNull();
      }
    });

    it('should validate a journal with deletedAt timestamp', () => {
      const journalResponse = {
        success: true,
        data: {
          date: '2025-12-24',
          hash: 'deleted123',
          content: 'This was deleted.',
          createdAt: new Date('2025-12-24T10:00:00Z'),
          updatedAt: new Date('2025-12-24T10:00:00Z'),
          deletedAt: new Date('2025-12-24T12:00:00Z'),
        },
        message: 'Journal retrieved successfully',
      };

      const result = JournalResponseSchema.safeParse(journalResponse);
      expect(result.success).toBe(true);
      if (result.success && result.data.success) {
        expect(result.data.data?.deletedAt).toBeInstanceOf(Date);
      }
    });
  });
});

describe('JournalMetadataListResponseSchema', () => {
  describe('Empty List', () => {
    it('should validate an empty list of metadata', () => {
      const emptyListResponse = {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        message: 'No journal entries found',
      };

      const result =
        JournalMetadataListResponseSchema.safeParse(emptyListResponse);
      expect(result.success).toBe(true);
      if (result.success && result.data.success) {
        expect(result.data.data).toHaveLength(0);
        expect(result.data.pagination.total).toBe(0);
      }
    });
  });

  describe('List of Metadata', () => {
    it('should validate a list of journal metadata', () => {
      const metadataListResponse = {
        success: true,
        data: [
          {
            date: '2025-12-24',
            hash: 'hash1',
            createdAt: new Date('2025-12-24T10:00:00Z'),
            updatedAt: new Date('2025-12-24T10:00:00Z'),
            deletedAt: null,
          },
          {
            date: '2025-12-23',
            hash: 'hash2',
            createdAt: new Date('2025-12-23T09:00:00Z'),
            updatedAt: new Date('2025-12-23T09:00:00Z'),
            deletedAt: null,
          },
          {
            date: '2025-12-22',
            hash: 'hash3',
            createdAt: new Date('2025-12-22T08:00:00Z'),
            updatedAt: new Date('2025-12-22T08:00:00Z'),
            deletedAt: new Date('2025-12-22T12:00:00Z'),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
        },
        message: 'Metadata retrieved successfully',
      };

      const result =
        JournalMetadataListResponseSchema.safeParse(metadataListResponse);
      expect(result.success).toBe(true);
      if (result.success && result.data.success) {
        expect(result.data.data).toHaveLength(3);
        expect(result.data.pagination.total).toBe(3);
        expect(result.data.data[0].date).toBe('2025-12-24');
        expect(result.data.data[2].deletedAt).toBeInstanceOf(Date);
      }
    });
  });
});

describe('JournalListResponseSchema', () => {
  describe('Empty List', () => {
    it('should validate an empty list of journals', () => {
      const emptyListResponse = {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
        message: 'No journals found',
      };

      const result = JournalListResponseSchema.safeParse(emptyListResponse);
      expect(result.success).toBe(true);
      if (result.success && result.data.success) {
        expect(result.data.data).toHaveLength(0);
        expect(result.data.pagination.total).toBe(0);
      }
    });
  });

  describe('List of Journals', () => {
    it('should validate a list of journals with full content', () => {
      const journalListResponse = {
        success: true,
        data: [
          {
            date: '2025-12-24',
            hash: 'hash1',
            content: 'Today was amazing! I learned so much about TypeScript.',
            createdAt: new Date('2025-12-24T10:00:00Z'),
            updatedAt: new Date('2025-12-24T10:00:00Z'),
            deletedAt: null,
          },
          {
            date: '2025-12-23',
            hash: 'hash2',
            content: 'Working on the journal API. Making great progress.',
            createdAt: new Date('2025-12-23T09:00:00Z'),
            updatedAt: new Date('2025-12-23T09:00:00Z'),
            deletedAt: null,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
        message: 'Journals retrieved successfully',
      };

      const result = JournalListResponseSchema.safeParse(journalListResponse);
      expect(result.success).toBe(true);
      if (result.success && result.data.success) {
        expect(result.data.data).toHaveLength(2);
        expect(result.data.data[0].content).toBeDefined();
        expect(result.data.data[1].content).toBeDefined();
        expect(result.data.pagination.total).toBe(2);
      }
    });

    it('should validate a paginated list with mixed deleted states', () => {
      const journalListResponse = {
        success: true,
        data: [
          {
            date: '2025-12-24',
            hash: 'active1',
            content: 'This journal is active.',
            createdAt: new Date('2025-12-24T10:00:00Z'),
            updatedAt: new Date('2025-12-24T10:00:00Z'),
            deletedAt: null,
          },
          {
            date: '2025-12-23',
            hash: 'deleted1',
            content: 'This journal was deleted.',
            createdAt: new Date('2025-12-23T09:00:00Z'),
            updatedAt: new Date('2025-12-23T09:00:00Z'),
            deletedAt: new Date('2025-12-23T15:00:00Z'),
          },
        ],
        pagination: {
          page: 1,
          limit: 2,
          total: 10,
          totalPages: 5,
        },
        message: 'Journals retrieved successfully',
      };

      const result = JournalListResponseSchema.safeParse(journalListResponse);
      expect(result.success).toBe(true);
      if (result.success && result.data.success) {
        expect(result.data.data[0].deletedAt).toBeNull();
        expect(result.data.data[1].deletedAt).toBeInstanceOf(Date);
      }
    });
  });
});
