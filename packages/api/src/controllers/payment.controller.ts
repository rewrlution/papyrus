import { Request, Response } from 'express';

import * as paymentService from '../services/payment.service.js';
import { verifyWebhookSignature } from '../lib/stripe.js';
import { logger } from '../lib/logger.js';
import { BadRequestError } from '../lib/errors.js';

/**
 * Create a Stripe checkout session
 *
 * POST /api/payments/checkout
 *
 * Body:
 * - product: 'standup-pro' | 'promotion-pro' | 'resume-interview-pro'
 *
 * Response:
 * - sessionId: Stripe checkout session ID
 * - url: Redirect URL for checkout
 */
export async function createCheckout(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.userId!; // Set by auth middleware
  const userEmail = req.userEmail!; // Set by auth middleware
  const { product } = req.body;

  if (!product) {
    throw new BadRequestError('Product is required');
  }

  const session = await paymentService.createCheckoutSession(
    userId,
    userEmail,
    product
  );

  res.status(200).json({
    success: true,
    data: session,
  });
}

/**
 * Handle Stripe webhook events
 *
 * POST /api/payments/webhook
 *
 * This endpoint receives events from Stripe:
 * - checkout.session.completed (payment succeeded)
 * - checkout.session.expired (payment failed/canceled)
 */
export async function handleWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    throw new BadRequestError('Missing Stripe signature');
  }

  // Verify webhook signature
  const event = verifyWebhookSignature(req.body, signature);

  logger.info('Received Stripe webhook', {
    eventType: event.type,
    eventId: event.id,
  });

  // Handle event based on type
  switch (event.type) {
    case 'checkout.session.completed':
      await paymentService.handlePaymentSuccess(event);
      break;

    case 'checkout.session.expired':
      await paymentService.handlePaymentFailed(event);
      break;

    default:
      logger.warn('Unhandled webhook event type', {
        eventType: event.type,
      });
  }

  res.status(200).json({ received: true });
}

/**
 * Get checkout session status
 *
 * GET /api/payments/checkout/:sessionId
 *
 * Returns the status of a checkout session after redirect
 */
export async function getCheckoutStatus(
  req: Request,
  res: Response
): Promise<void> {
  const { sessionId } = req.params;

  const status = await paymentService.getCheckoutSessionStatus(sessionId);

  res.status(200).json({
    success: true,
    data: status,
  });
}

/**
 * Get user's purchase history
 *
 * GET /api/payments/purchases
 *
 * Returns all purchases for the authenticated user
 */
export async function getPurchases(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.userId!;

  const purchases = await paymentService.getUserPurchases(userId);

  res.status(200).json({
    success: true,
    data: purchases,
  });
}
