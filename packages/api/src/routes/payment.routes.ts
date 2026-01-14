import { Router } from 'express';

import * as paymentController from '../controllers/payment.controller.js';
import { requireAuthentication } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/handlers.js';

const router = Router();

/**
 * Create a checkout session for purchasing a product
 *
 * Requires authentication
 */
router.post(
  '/checkout',
  requireAuthentication,
  asyncHandler(paymentController.createCheckout)
);

/**
 * Get checkout session status
 *
 * Used after redirect from Stripe checkout
 */
router.get(
  '/checkout/:sessionId',
  requireAuthentication,
  asyncHandler(paymentController.getCheckoutStatus)
);

/**
 * Get user's purchase history
 *
 * Requires authentication
 */
router.get(
  '/purchases',
  requireAuthentication,
  asyncHandler(paymentController.getPurchases)
);

/**
 * Handle Stripe webhook events
 *
 * No authentication required - verified via Stripe signature
 * Must receive raw body (not JSON parsed)
 */
router.post('/webhook', asyncHandler(paymentController.handleWebhook));

export default router;
