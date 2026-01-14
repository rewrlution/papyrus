import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stripe from 'stripe';

import * as paymentService from '../../src/services/payment.service.js';
import { stripe } from '../../src/lib/stripe.js';
import { aiPurchaseRepository } from '../../src/domain/repositories/index.js';

// Mock Stripe SDK
vi.mock('../../src/lib/stripe.js', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
    },
    customers: {
      list: vi.fn(),
      create: vi.fn(),
    },
  },
  getOrCreateCustomer: vi.fn(),
}));

// Mock repository
vi.mock('../../src/domain/repositories/index.js', () => ({
  aiPurchaseRepository: {
    createPurchase: vi.fn(),
    findByCheckoutSessionId: vi.fn(),
    findAllByUser: vi.fn(),
  },
}));

describe('Payment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('creates checkout session with correct product details', async () => {
      // Mock customer creation
      const mockGetOrCreateCustomer = vi.mocked(
        require('../../src/lib/stripe.js').getOrCreateCustomer
      );
      mockGetOrCreateCustomer.mockResolvedValue('cus_123');

      // Mock checkout session creation
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_123',
        customer: 'cus_123',
        amount_total: 900,
        currency: 'usd',
        metadata: {
          userId: 'user123',
          product: 'standup-pro',
          durationDays: '90',
        },
      } as Stripe.Checkout.Session);

      // Execute
      const result = await paymentService.createCheckoutSession(
        'user123',
        'test@example.com',
        'standup-pro'
      );

      // Verify
      expect(result.sessionId).toBe('cs_test_123');
      expect(result.url).toContain('checkout.stripe.com');
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
          mode: 'payment',
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'usd',
                unit_amount: 900,
              }),
            }),
          ]),
        })
      );
    });

    it('includes metadata in checkout session', async () => {
      const mockGetOrCreateCustomer = vi.mocked(
        require('../../src/lib/stripe.js').getOrCreateCustomer
      );
      mockGetOrCreateCustomer.mockResolvedValue('cus_123');

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      } as Stripe.Checkout.Session);

      await paymentService.createCheckoutSession(
        'user456',
        'test@example.com',
        'promotion-pro'
      );

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: 'user456',
            product: 'promotion-pro',
            durationDays: '30',
          },
        })
      );
    });
  });

  describe('handlePaymentSuccess', () => {
    it('creates purchase record from webhook event', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_123',
            payment_intent: 'pi_123',
            amount_total: 1900,
            currency: 'usd',
            metadata: {
              userId: 'user123',
              product: 'promotion-pro',
              durationDays: '30',
            },
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      vi.mocked(
        aiPurchaseRepository.findByCheckoutSessionId
      ).mockResolvedValue(null);
      vi.mocked(aiPurchaseRepository.createPurchase).mockResolvedValue({
        id: 'purchase123',
        userId: 'user123',
        product: 'promotion-pro',
      } as any);

      await paymentService.handlePaymentSuccess(mockEvent);

      expect(aiPurchaseRepository.createPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          product: 'promotion-pro',
          amount: 1900,
          currency: 'usd',
          stripeCustomerId: 'cus_123',
          stripeCheckoutSessionId: 'cs_test_123',
          stripePaymentIntentId: 'pi_123',
          paymentStatus: 'succeeded',
        })
      );
    });

    it('handles duplicate webhook events (idempotency)', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              userId: 'user123',
              product: 'standup-pro',
              durationDays: '90',
            },
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      // Mock existing purchase
      vi.mocked(
        aiPurchaseRepository.findByCheckoutSessionId
      ).mockResolvedValue({
        id: 'existing_purchase',
        stripeCheckoutSessionId: 'cs_test_123',
      } as any);

      await paymentService.handlePaymentSuccess(mockEvent);

      // Should not create duplicate
      expect(aiPurchaseRepository.createPurchase).not.toHaveBeenCalled();
    });

    it('calculates correct expiration date', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_123',
            payment_intent: 'pi_123',
            amount_total: 900,
            currency: 'usd',
            metadata: {
              userId: 'user123',
              product: 'standup-pro',
              durationDays: '90',
            },
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      vi.mocked(
        aiPurchaseRepository.findByCheckoutSessionId
      ).mockResolvedValue(null);
      vi.mocked(aiPurchaseRepository.createPurchase).mockResolvedValue({
        id: 'purchase123',
      } as any);

      await paymentService.handlePaymentSuccess(mockEvent);

      const createCall = vi.mocked(aiPurchaseRepository.createPurchase).mock
        .calls[0][0];

      // Verify expiration is approximately 90 days from now
      const expectedExpiration = new Date();
      expectedExpiration.setDate(expectedExpiration.getDate() + 90);

      const actualExpiration = createCall.expiresAt;
      const timeDiff = Math.abs(
        actualExpiration!.getTime() - expectedExpiration.getTime()
      );

      // Allow 1 second difference for test execution time
      expect(timeDiff).toBeLessThan(1000);
    });
  });

  describe('getCheckoutSessionStatus', () => {
    it('retrieves session status from Stripe', async () => {
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
        id: 'cs_test_123',
        payment_status: 'paid',
        customer_details: {
          email: 'test@example.com',
        },
        amount_total: 900,
      } as Stripe.Checkout.Session);

      const result = await paymentService.getCheckoutSessionStatus(
        'cs_test_123'
      );

      expect(result).toEqual({
        status: 'paid',
        customerEmail: 'test@example.com',
        amountTotal: 900,
      });
    });
  });

  describe('getUserPurchases', () => {
    it('returns formatted purchase history', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      vi.mocked(aiPurchaseRepository.findAllByUser).mockResolvedValue([
        {
          id: 'purchase1',
          product: 'standup-pro',
          amount: 900,
          currency: 'usd',
          purchasedAt: now,
          expiresAt: future,
          paymentStatus: 'succeeded',
        } as any,
      ]);

      const result = await paymentService.getUserPurchases('user123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'purchase1',
        product: 'standup-pro',
        amount: 900,
        currency: 'usd',
        purchasedAt: now.toISOString(),
        expiresAt: future.toISOString(),
        paymentStatus: 'succeeded',
        isActive: true,
      });
    });

    it('marks expired purchases as inactive', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      vi.mocked(aiPurchaseRepository.findAllByUser).mockResolvedValue([
        {
          id: 'purchase1',
          product: 'promotion-pro',
          amount: 1900,
          currency: 'usd',
          purchasedAt: new Date('2024-01-01'),
          expiresAt: past,
          paymentStatus: 'succeeded',
        } as any,
      ]);

      const result = await paymentService.getUserPurchases('user123');

      expect(result[0].isActive).toBe(false);
    });
  });
});
