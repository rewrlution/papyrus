import type { AiTrialUsage } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

/**
 * Repository for AiTrialUsage table operations
 *
 * Handles features with one-time free trials (e.g., Promotion Builder)
 */
export const aiTrialUsageRepository = {
  /**
   * Check if a user has used their free trial for a feature
   * Returns true if trial has been used, false if still available
   */
  async hasUsedTrial(userId: string, feature: string): Promise<boolean> {
    const record = await prisma.aiTrialUsage.findUnique({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
    });
    return !!record;
  },

  /**
   * Mark a trial as used.
   * Creates a record indicating the user has used their free trial
   */
  async markTrialUsed(userId: string, feature: string): Promise<AiTrialUsage> {
    return prisma.aiTrialUsage.create({ data: { userId, feature } });
  },

  /**
   * Get trial usage record (if exists)
   * Returns null if trial hasn't been used yet
   */
  async findTrialUsage(
    userId: string,
    feature: string
  ): Promise<AiTrialUsage | null> {
    return prisma.aiTrialUsage.findUnique({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
    });
  },
};
