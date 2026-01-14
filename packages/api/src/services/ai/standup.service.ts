import type { Journal } from '@prisma/client';

import { StandupRequest } from '@rewrlution/papyrus-shared';

import { journalRepository } from '../../domain/repositories/journal.repository.js';
import {
  buildStandupPrompt,
  buildStandupPromptForRange,
  checkUsage,
  incrementUsage,
  getFeatureConfig,
  AnthropicProvider,
  type UsageInfo,
} from '../../lib/ai/index.js';
import { decrypt } from '../../lib/encryption.js';
import { logger } from '../../lib/logger.js';

export type StandupEvent =
  | { type: 'thinking'; message: string }
  | { type: 'content'; text: string }
  | { type: 'done'; journal_date: string; usage: UsageInfo }
  | { type: 'error'; message: string };

/**
 * Standup service - generates standup notes from journal entries
 */
export const StandupService = {
  async *generateStream(
    userId: string,
    options: StandupRequest = {}
  ): AsyncGenerator<StandupEvent> {
    // Step 1: Check usage limit (free tier first, then premium)
    const usageInfo = await checkUsage(userId, 'standup');

    if (!usageInfo.allowed) {
      const config = getFeatureConfig('standup');
      const message = usageInfo.resets_at
        ? `You've used ${usageInfo.used}/${usageInfo.limit} free requests this month. Resets on ${new Date(usageInfo.resets_at).toLocaleDateString()}.`
        : `You've used your free trail. Purchase ${config.product} to continue.`;

      yield { type: 'error', message };
      return;
    }

    // Step 2: Load journals from database
    const { journals, dateRange } = await this.loadJournals(userId, options);
    if (journals.length === 0) {
      const message =
        'No journals found. Use `papyrus add` to create journals and `papyrus sync` to sync your local journals to the server.';
      yield { type: 'error', message };
    }

    // Step 3: Yield thinking event
    yield { type: 'thinking', message: 'Analyzing journals ...' };

    // Step 4: Build prompt
    const decryptedJournals: Array<{ date: string; content: string }> =
      journals.map((j) => ({
        date: j.date,
        content: decrypt(j),
      }));
    const prompt =
      decryptedJournals.length === 1
        ? buildStandupPrompt({
            date: decryptedJournals[0].date,
            content: decryptedJournals[0].content,
          })
        : buildStandupPromptForRange(decryptedJournals);

    // Step 5: Stream AI response
    const aiProvider = new AnthropicProvider();
    for await (const chunk of aiProvider.stream(prompt)) {
      yield { type: 'content', text: chunk };
    }
    try {
    } catch (error) {
      console.error('[Standup] AI streaming error:', error);
      yield {
        type: 'error',
        message: 'AI service temporarily unavailable. Please try again later.',
      };
      return;
    }

    // Step 6: Increment usage counter (only on success, only for free tier)
    await incrementUsage(userId, 'standup', usageInfo);

    const updatedUsage = await checkUsage(userId, 'standup');
    yield {
      type: 'done',
      journal_date: dateRange,
      usage: updatedUsage,
    };
  },

  async loadJournals(
    userId: string,
    options: StandupRequest
  ): Promise<{ journals: Journal[]; dateRange: string }> {
    let journals: Journal[];
    let dateRange: string;

    if (options.date) {
      // Specific date
      const journal = await journalRepository.findByUserAndDate(
        userId,
        options.date
      );
      journals = journal ? [journal] : [];
      dateRange = options.date;
    } else if (options.from) {
      // Date range (with default 'to' if not provided)
      const toDate = options.to || this.getCurrentDate();

      journals = await journalRepository.findByUserAndDateRange(
        userId,
        options.from,
        toDate
      );
      dateRange = `${options.from} to ${toDate}`;
    } else {
      // most recent journal
      const journal = await journalRepository.findMostRecent(userId);
      journals = journal ? [journal] : [];
      dateRange = journal?.date || 'unknown';
    }

    return { journals, dateRange };
  },

  // TODO: move all date related functions to the shared package, uitls
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * TODO: this is copied directly from journals service. need to refactor it
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
};
