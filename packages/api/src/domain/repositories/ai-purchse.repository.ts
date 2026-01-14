import { AiPurchase } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

/**
 * Repository for AiPurchase table operations
 *
 * Handles:
 * - Finding active purchases (not expired)
 * - Recording new purchases
 */
export const aiPurchaseRepository = {
  /**
   * Find an active purchase for a user/product
   *
   * Active means:
   * - Not expired
   *
   * Time-based model: we only check expiration, not generation counts
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
   */
  async createPurchase(data: {
    userId: string;
    product: string;
    expiresAt?: Date | null;
    amount?: number;
    currency?: string;
    stripeCustomerId?: string;
    stripePaymentIntentId?: string;
    stripeCheckoutSessionId?: string;
    paymentStatus?: string;
  }): Promise<AiPurchase> {
    return prisma.aiPurchase.create({ data });
  },

  /**
   * Find purchase by Stripe checkout session ID
   * (For webhook idempotency)
   */
  async findByCheckoutSessionId(
    sessionId: string
  ): Promise<AiPurchase | null> {
    return prisma.aiPurchase.findUnique({
      where: {
        stripeCheckoutSessionId: sessionId,
      },
    });
  },

  /**
   * Find purchase by Stripe payment intent ID
   */
  async findByPaymentIntentId(
    paymentIntentId: string
  ): Promise<AiPurchase | null> {
    return prisma.aiPurchase.findUnique({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
    });
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
