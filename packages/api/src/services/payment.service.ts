import Stripe from 'stripe';

import { env } from '../env/config.js';
import { aiPurchaseRepository } from '../domain/repositories/index.js';
import { getFeatureConfig } from '../lib/ai/feature-config.js';
import { stripe, getOrCreateCustomer } from '../lib/stripe.js';
import { logger } from '../lib/logger.js';
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
} from '../lib/errors.js';

/**
 * Supported products for purchase
 */
export type PurchasableProduct =
  | 'standup-pro'
  | 'promotion-pro'
  | 'resume-interview-pro';

/**
 * Create a Stripe checkout session for a product purchase
 *
 * @param userId - User ID
 * @param email - User email
 * @param product - Product to purchase
 * @returns Checkout session with URL
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  product: PurchasableProduct
): Promise<{ sessionId: string; url: string }> {
  try {
    // Get product configuration (validates product exists)
    const productConfig = getProductConfig(product);

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(userId, email);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: productConfig.price,
            product_data: {
              name: productConfig.displayName,
              description: productConfig.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${env.APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.APP_URL}/purchase/cancel`,
      metadata: {
        userId,
        product,
        durationDays: productConfig.duration.toString(),
      },
    });

    if (!session.url) {
      throw new InternalServerError('Failed to create checkout session URL');
    }

    logger.info('Created Stripe checkout session', {
      sessionId: session.id,
      userId,
      product,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (err) {
    logger.error('Failed to create checkout session', {
      error: err instanceof Error ? err.message : 'Unknown error',
      userId,
      product,
    });
    throw err;
  }
}

/**
 * Handle successful payment webhook
 *
 * Creates purchase record and grants access
 *
 * @param event - Stripe webhook event
 */
export async function handlePaymentSuccess(
  event: Stripe.Event
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  try {
    const { userId, product, durationDays } = session.metadata || {};

    if (!userId || !product || !durationDays) {
      throw new BadRequestError('Missing required metadata in webhook');
    }

    // Check if purchase already exists (idempotency)
    const existingPurchase =
      await aiPurchaseRepository.findByCheckoutSessionId(session.id);

    if (existingPurchase) {
      logger.warn('Purchase already exists for checkout session', {
        sessionId: session.id,
        purchaseId: existingPurchase.id,
      });
      return;
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays, 10));

    // Create purchase record
    const purchase = await aiPurchaseRepository.createPurchase({
      userId,
      product: product as PurchasableProduct,
      amount: session.amount_total || 0,
      currency: session.currency || 'usd',
      stripeCustomerId: session.customer as string,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      paymentStatus: 'succeeded',
      expiresAt,
    });

    logger.info('Successfully created purchase from webhook', {
      purchaseId: purchase.id,
      userId,
      product,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    logger.error('Failed to handle payment success webhook', {
      error: err instanceof Error ? err.message : 'Unknown error',
      sessionId: session.id,
    });
    throw err;
  }
}

/**
 * Handle payment failure webhook
 *
 * @param event - Stripe webhook event
 */
export async function handlePaymentFailed(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  logger.error('Payment failed', {
    sessionId: session.id,
    userId: session.metadata?.userId,
    product: session.metadata?.product,
  });

  // Could send email notification to user here
}

/**
 * Get checkout session details
 *
 * @param sessionId - Stripe checkout session ID
 * @returns Session status and details
 */
export async function getCheckoutSessionStatus(sessionId: string): Promise<{
  status: string;
  customerEmail: string | null;
  amountTotal: number | null;
}> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      status: session.payment_status,
      customerEmail: session.customer_details?.email || null,
      amountTotal: session.amount_total,
    };
  } catch (err) {
    logger.error('Failed to retrieve checkout session', {
      error: err instanceof Error ? err.message : 'Unknown error',
      sessionId,
    });
    throw new NotFoundError('Checkout session not found');
  }
}

/**
 * Get user's active purchases
 *
 * @param userId - User ID
 * @returns List of active purchases
 */
export async function getUserPurchases(userId: string) {
  const purchases = await aiPurchaseRepository.findAllByUser(userId);

  return purchases.map((purchase) => ({
    id: purchase.id,
    product: purchase.product,
    amount: purchase.amount,
    currency: purchase.currency,
    purchasedAt: purchase.purchasedAt.toISOString(),
    expiresAt: purchase.expiresAt?.toISOString() || null,
    paymentStatus: purchase.paymentStatus,
    isActive: purchase.expiresAt ? purchase.expiresAt > new Date() : false,
  }));
}

/**
 * Product configuration with pricing and metadata
 */
interface ProductConfig {
  name: string;
  displayName: string;
  description: string;
  price: number; // in cents
  duration: number; // in days
}

/**
 * Get product configuration by product name
 */
function getProductConfig(product: PurchasableProduct): ProductConfig {
  const configs: Record<PurchasableProduct, ProductConfig> = {
    'standup-pro': {
      name: 'standup-pro',
      displayName: 'Standup Pro',
      description: 'Unlimited standup notes for 90 days',
      price: 900, // $9
      duration: 90,
    },
    'promotion-pro': {
      name: 'promotion-pro',
      displayName: 'Promotion Builder',
      description: 'Unlimited promotion documents for 30 days',
      price: 1900, // $19
      duration: 30,
    },
    'resume-interview-pro': {
      name: 'resume-interview-pro',
      displayName: 'Resume & Interview Pro',
      description: 'Unlimited resume and interview prep for 30 days',
      price: 2900, // $29
      duration: 30,
    },
  };

  const config = configs[product];
  if (!config) {
    throw new BadRequestError(`Invalid product: ${product}`);
  }

  return config;
}
