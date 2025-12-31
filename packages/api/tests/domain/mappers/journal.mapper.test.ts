import type { Journal } from '@prisma/client';
import { describe, it, expect } from 'vitest';

import { JournalMapper } from '../../../src/domain/mappers/journal.mapper.js';

describe('JournalMapper', () => {
  const mockJournal: Journal = {
    id: 'journal-123',
    userId: 'user-123',
    date: '20251230',
    hash: 'hash123',
    ciphertext: 'encrypted-content',
    iv: 'iv123',
    authTag: 'tag123',
    createdAt: new Date('2025-12-30T10:00:00Z'),
    updatedAt: new Date('2025-12-30T12:00:00Z'),
    deletedAt: null,
  };

  describe('toJournalData', () => {
    it('should transform journal entity to JournalData with provided content', () => {
      const decryptedContent = 'My journal entry content';

      const result = JournalMapper.toJournalData(mockJournal, decryptedContent);

      expect(result).toEqual({
        date: '20251230',
        hash: 'hash123',
        content: decryptedContent,
        createdAt: mockJournal.createdAt,
        updatedAt: mockJournal.updatedAt,
        deletedAt: null,
      });
    });

    it('should not include sensitive encryption fields in result', () => {
      const result = JournalMapper.toJournalData(mockJournal, 'content');

      expect(result).not.toHaveProperty('ciphertext');
      expect(result).not.toHaveProperty('iv');
      expect(result).not.toHaveProperty('authTag');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('userId');
    });

    it('should include deletedAt when journal is soft deleted', () => {
      const deletedJournal = {
        ...mockJournal,
        deletedAt: new Date('2025-12-30T15:00:00Z'),
      };

      const result = JournalMapper.toJournalData(deletedJournal, 'content');

      expect(result.deletedAt).toEqual(deletedJournal.deletedAt);
    });

    it('should handle empty content string', () => {
      const result = JournalMapper.toJournalData(mockJournal, '');

      expect(result.content).toBe('');
      expect(result.date).toBe('20251230');
    });

    it('should handle special characters in content', () => {
      const specialContent = 'Content with 特殊字符 and émojis 🎉';
      const result = JournalMapper.toJournalData(mockJournal, specialContent);

      expect(result.content).toBe(specialContent);
    });
  });

  describe('toJournalMetadata', () => {
    it('should transform journal entity to JournalMetaData without content', () => {
      const result = JournalMapper.toJournalMetadata(mockJournal);

      expect(result).toEqual({
        date: '20251230',
        hash: 'hash123',
        createdAt: mockJournal.createdAt,
        updatedAt: mockJournal.updatedAt,
        deletedAt: null,
      });
    });

    it('should not include sensitive encryption fields', () => {
      const result = JournalMapper.toJournalMetadata(mockJournal);

      expect(result).not.toHaveProperty('ciphertext');
      expect(result).not.toHaveProperty('iv');
      expect(result).not.toHaveProperty('authTag');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('userId');
      expect(result).not.toHaveProperty('content');
    });

    it('should include deletedAt when present', () => {
      const deletedJournal = {
        ...mockJournal,
        deletedAt: new Date('2025-12-30T15:00:00Z'),
      };

      const result = JournalMapper.toJournalMetadata(deletedJournal);

      expect(result.deletedAt).toEqual(deletedJournal.deletedAt);
    });
  });
});
