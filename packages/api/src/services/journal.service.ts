import {
  generateContentHash,
  JournalData,
  JournalListResponse,
  JournalMetadataListResponse,
  JournalResponse,
} from '@rewrlution/papyrus-shared';
import { encrypt, decrypt } from '../lib/encryption.js';
import { journalRepository } from '../domain/repositories/journal.repository.js';
import { logger } from '../lib/logger.js';
import { JournalMapper } from '../domain/mappers/journal.mapper.js';
import { NotFoundError } from '../lib/errors.js';
import type { Journal } from '@prisma/client';

export const JournalService = {
  /**
   * Encrypts journal content and generates content hash
   *
   * @param content - Plaintext content to encrypt
   * @returns Encryption data and content hash
   */
  encryptJournalContent(content: string) {
    return {
      encrypted: encrypt(content),
      hash: generateContentHash(content),
    };
  },

  /**
   * Decrypts journal content with error handling
   *
   * @param entity - Journal entity with encryption fields
   * @returns Decrypted content or error placeholder
   */
  decryptJournalContent(entity: Journal): string {
    try {
      return decrypt({
        ciphertext: entity.ciphertext,
        iv: entity.iv,
        authTag: entity.authTag,
      });
    } catch (err) {
      logger.error('Failed to decrypt journal', { id: entity.id, err });
      return '[Decryption failed]';
    }
  },

  /**
   * Validates journal exists and is not deleted
   *
   * @param entity - Journal entity or null
   * @throws NotFoundError if journal not found or deleted
   */
  validateJournalAccess(entity: Journal | null): void {
    if (!entity) {
      throw new NotFoundError('Journal not found');
    }
    if (entity.deletedAt) {
      throw new NotFoundError('Journal has been deleted');
    }
  },

  /**
   * Create a new journal entry
   *
   * @param userId - User ID creating the journal
   * @param journal - Journal data with plaintext content
   * @returns Success response with created journal
   */
  async create(userId: string, journal: JournalData): Promise<JournalResponse> {
    logger.info('Creating journal', { userId, date: journal.date });

    const { encrypted, hash } = this.encryptJournalContent(journal.content);

    const entity = await journalRepository.create({
      date: journal.date,
      hash,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      user: {
        connect: { id: userId },
      },
    });

    logger.info('Journal created', { journalId: entity.id });

    return {
      success: true,
      message: 'Journal entry created successfully',
      data: JournalMapper.toJournalData(entity, journal.content),
    };
  },

  /**
   * Get all journal entries for a user with pagination
   *
   * @param userId - User ID to fetch journals for
   * @param page - Page number (1-indexed)
   * @param limit - Number of entries per page
   * @returns Paginated list of journals
   */
  async findAllByUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<JournalListResponse> {
    logger.info('Fetching journals by user', { userId, page, limit });

    const skip = (page - 1) * limit;

    const [entities, total] = await Promise.all([
      journalRepository.findByUserId(userId, skip, limit),
      journalRepository.countByUserId(userId),
    ]);

    logger.info('Decrypting journals', { count: entities.length });
    const data = entities.map((entity) => {
      const content = this.decryptJournalContent(entity);
      return JournalMapper.toJournalData(entity, content);
    });

    return {
      success: true,
      message: `Retrieved ${data.length} journal ${data.length === 1 ? 'entry' : 'entries'}`,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  /**
   * Find a single journal entry by date
   *
   * @param userId - User ID
   * @param date - Journal date (YYYYMMDD format)
   * @returns Journal data or null if not found
   */
  async findOne(userId: string, date: string): Promise<JournalResponse> {
    logger.info('Finding journal by date', { userId, date });

    const entity = await journalRepository.findByUserAndDate(userId, date);

    if (!entity) {
      throw new NotFoundError('Journal not found');
    }

    if (entity.deletedAt) {
      throw new NotFoundError('Journal has been deleted');
    }

    const content = this.decryptJournalContent(entity);

    return {
      success: true,
      message: 'Journal retrieved successfully',
      data: JournalMapper.toJournalData(entity, content),
    };
  },

  /**
   * Update an existing journal entry's content
   *
   * @param userId - User ID
   * @param date - Journal date (YYYYMMDD format)
   * @param data - New content data
   * @returns Updated journal data
   */
  async update(
    userId: string,
    date: string,
    data: { content: string }
  ): Promise<JournalResponse> {
    logger.info('Updating journal', { userId, date });

    const entity = await journalRepository.findByUserAndDate(userId, date);
    this.validateJournalAccess(entity);

    const { encrypted, hash } = this.encryptJournalContent(data.content);

    const updated = await journalRepository.update(entity!.id, {
      hash,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    });

    return {
      success: true,
      message: 'Journal entry updated successfully',
      data: JournalMapper.toJournalData(updated, data.content),
    };
  },

  /**
   * Soft delete a journal entry
   *
   * @param userId - User ID
   * @param date - Journal date (YYYYMMDD format)
   * @returns Success response
   */
  async delete(userId: string, date: string): Promise<JournalResponse> {
    logger.info('Deleting journal', { userId, date });

    const entity = await journalRepository.findByUserAndDate(userId, date);
    this.validateJournalAccess(entity);

    await journalRepository.softDelete(entity!.id);

    logger.info('Journal deleted', { journalId: entity!.id });

    return {
      success: true,
      message: 'Journal entry deleted successfully',
      data: null,
    };
  },

  async findAllMetadataByUser(
    userId: string
  ): Promise<JournalMetadataListResponse> {
    logger.info('Finding all journal metadata by user', { userId });

    const entities = await journalRepository.findAllMetadata(userId);
    const journals = entities.map((entity) =>
      JournalMapper.toJournalMetadata(entity)
    );

    return {
      success: true,
      message: 'All metadata retrieved successfully.',
      data: journals,
      pagination: {
        page: 1,
        limit: journals.length,
        total: journals.length,
        totalPages: 1,
      },
    };
  },
};
