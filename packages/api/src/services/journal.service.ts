import {
  generateContentHash,
  JournalData,
  JournalListResponse,
  JournalResponse,
} from '@rewrlution/papyrus-shared';
import { encrypt } from '../lib/encryption.js';
import { journalRespository } from '../domain/repositories/journal.repository.js';
import { logger } from '../lib/logger.js';
import { JournalMapper } from '../domain/mappers/journal.mapper.js';

export const JournalService = {
  async create(userId: string, journal: JournalData): Promise<JournalResponse> {
    const { ciphertext, iv, authTag } = encrypt(journal.content);
    const hash = generateContentHash(journal.content);

    const journalEntity = await journalRespository.create({
      date: journal.date,
      hash,
      ciphertext,
      iv,
      authTag,
      user: {
        connect: { id: userId },
      },
    });

    logger.info('Journal created', { journalId: journalEntity.id });

    return {
      success: true,
      message: 'Journal entry created successfully',
      data: journal,
    };
  },

  async getJournals(
    userId: string,
    page: number,
    limit: number
  ): Promise<JournalListResponse> {
    logger.info('Fetching journals by user', { userId, page, limit });

    const skip = (page - 1) * limit;

    const [journals, total] = await Promise.all([
      journalRespository.findByUserId(userId, skip, limit),
      journalRespository.countByUserId(userId),
    ]);

    // Decrypt all journal contents
    logger.info('Decrypting journals', { count: journals.length });
    const data = journals.map((journal) =>
      JournalMapper.toJournalData(journal)
    );

    return {
      success: true,
      message: `Retrieved ${data.length} journal ${data.length === 1 ? 'entry' : 'entries'}`,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
};
