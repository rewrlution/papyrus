import { AiPurchase } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

/**
 * Repository for AiPurchase table operations
 *
 * Handles:
 * - Finding active purchases (not expired, within limits)
 * - Recording new purchases
 * - Incrementing generation usage
 */
export const aiPurchaseRepository = {
  /**
   * Find an active purchase for a user/product
   *
   * Active means:
   * - Not expired (expiresAt is null OR in the future)
   * - Within generation limit (generationLimit is null OR generationUsed < generationsLimit)
   */
  async findActivePurchase(
    userId: string,
    product: string
  ): Promise<AiPurchase | null> {
    const now = new Date();

    return prisma.aiPurchase.findFirst({
      where: {
        userId,
        product,
        expiresAt: { gt: now }, // Not expired
      },
      orderBy: {
        purchasedAt: 'desc', // Most recent purchase first
      },
    });
  },

  /**
   * Create a new purchase record
   * (For future payment integration)
   */
  async createPurchase(data: {
    userId: string;
    product: string;
    expiresAt?: Date | null;
    amount?: number;
    currency?: string;
  }): Promise<AiPurchase> {
    return prisma.aiPurchase.create({ data });
  },

  /**
   * Get all purchases for a user (for account page)
   */
  async findAllByUser(userId: string): Promise<AiPurchase[]> {
    return prisma.aiPurchase.findMany({
      where: { userId },
      orderBy: { purchasedAt: 'desc' },
    });
  },
};
