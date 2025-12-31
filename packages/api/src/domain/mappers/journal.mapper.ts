import type { Journal } from '@prisma/client';
import { decrypt } from '../../lib/encryption.js';
import { logger } from '../../lib/logger.js';
import type { JournalMetaData, JournalData } from '@rewrlution/papyrus-shared';

export class JournalMapper {
  /**
   * Transform database entity to domain model (with decrypted content)
   *
   * @param journal - Encrypted journal entity from database
   * @returns Domain model with decrypted content
   */
  static toJournalData(journal: Journal): JournalData {
    const {
      date,
      hash,
      ciphertext,
      iv,
      authTag,
      createdAt,
      updatedAt,
      deletedAt,
    } = journal;

    let content: string;
    try {
      content = decrypt({ ciphertext, iv, authTag });
    } catch (err) {
      logger.error('Failed to decrypt journal', { id: journal.id, err });
      content = '[Decryption failed]';
    }

    return { date, hash, content, createdAt, updatedAt, deletedAt };
  }

  static toJournalMetadata(journal: Journal): JournalMetaData {
    return {
      date: journal.date,
      hash: journal.hash,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt,
      deletedAt: journal.deletedAt,
    };
  }
}
