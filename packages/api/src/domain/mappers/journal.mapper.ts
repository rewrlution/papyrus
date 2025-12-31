import type { Journal } from '@prisma/client';
import type { JournalMetaData, JournalData } from '@rewrlution/papyrus-shared';

export class JournalMapper {
  /**
   * Transform database entity to domain model with decrypted content
   *
   * @param journal - Journal entity from database
   * @param content - Decrypted content (passed from service layer)
   * @returns Domain model with decrypted content
   */
  static toJournalData(journal: Journal, content: string): JournalData {
    return {
      date: journal.date,
      hash: journal.hash,
      content,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt,
      deletedAt: journal.deletedAt,
    };
  }

  static toJournalMetadata(
    journal: Pick<
      Journal,
      'date' | 'hash' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >
  ): JournalMetaData {
    return {
      date: journal.date,
      hash: journal.hash,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt,
      deletedAt: journal.deletedAt,
    };
  }
}
