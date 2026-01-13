import type { AiUsage } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

/**
 * Repository for AiUsage table operations
 *
 * Handles:
 * - Finding usage records by user/feature/month
 * - Upserting (insert or update) usage counts
 */
export const aiUsageRepository = {
  /**
   * Find usage record for a specific user/feature/month
   * Returns null if no record exists (user hasn't used feature this month)
   */
  async findUsage(
    userId: string,
    feature: string,
    month: string // 'YYYY-MM' format
  ): Promise<AiUsage | null> {
    return prisma.aiUsage.findUnique({
      where: {
        userId_feature_month: {
          userId,
          feature,
          month,
        },
      },
    });
  },

  /**
   * Create or update usage count
   * If record doesn't exist, creates with count = 1
   * If record exists, increments count by 1
   */
  async upsertUsage(
    userId: string,
    feature: string,
    month: string
  ): Promise<AiUsage> {
    return prisma.aiUsage.upsert({
      where: {
        userId_feature_month: {
          userId,
          feature,
          month,
        },
      },
      create: {
        userId,
        feature,
        month,
        count: 1,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });
  },

  /**
   * Get current usage count for a user/feature/month
   * Returns 0 if no record exists
   */
  async getUsageCount(
    userId: string,
    feature: string,
    month: string
  ): Promise<number> {
    const usage = await this.findUsage(userId, feature, month);
    return usage?.count ?? 0;
  },
};
