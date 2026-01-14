import Stripe from 'stripe';

import { env } from '../env/config.js';
import { logger } from './logger.js';

/**
 * Stripe client singleton
 *
 * Configured with:
 * - API version (latest)
 * - TypeScript support
 * - App info for Stripe dashboard
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
  appInfo: {
    name: 'Papyrus',
    version: '0.0.1',
  },
});

/**
 * Verify Stripe webhook signature
 *
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @returns Stripe event object
 * @throws Error if signature validation fails
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Create or retrieve a Stripe customer for a user
 *
 * @param userId - User ID
 * @param email - User email
 * @returns Stripe customer ID
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string
): Promise<string> {
  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      logger.debug('Found existing Stripe customer', {
        customerId: existingCustomers.data[0].id,
        email,
      });
      return existingCustomers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        papyrusUserId: userId,
      },
    });

    logger.info('Created new Stripe customer', {
      customerId: customer.id,
      email,
    });

    return customer.id;
  } catch (err) {
    logger.error('Failed to get or create Stripe customer', {
      error: err instanceof Error ? err.message : 'Unknown error',
      email,
    });
    throw err;
  }
}

/**
 * Format amount for display
 *
 * @param amount - Amount in cents
 * @param currency - Currency code (default: 'usd')
 * @returns Formatted amount (e.g., "$9.00")
 */
export function formatAmount(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}
