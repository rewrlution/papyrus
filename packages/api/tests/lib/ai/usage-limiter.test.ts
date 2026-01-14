/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUsageCount: vi.fn(),
  hasUsedTrial: vi.fn(),
  findActivePurchase: vi.fn(),
}));

vi.mock('../../../src/domain/repositories/index.js', () => ({
  aiUsageRepository: { getUsageCount: mocks.getUsageCount },
  aiTrialUsageRepository: { hasUsedTrial: mocks.hasUsedTrial },
  aiPurchaseRepository: { findActivePurchase: mocks.findActivePurchase },
}));

import { checkUsage } from '../../../src/lib/ai/usage-limiter.js';

describe('checkUsage', () => {
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('standup (monthly free tier)', () => {
    it('should allow usage when under limit', async () => {
      mocks.getUsageCount.mockResolvedValue(2);

      const result = await checkUsage(userId, 'standup');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('free_tier');
      expect(result.used).toBe(2);
    });

    it('should deny usage when limit exceeded and no purchase', async () => {
      mocks.getUsageCount.mockResolvedValue(100);
      mocks.findActivePurchase.mockResolvedValue(null);

      const result = await checkUsage(userId, 'standup');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('limit_exceeded');
    });

    it('should allow usage with premium when limit exceeded', async () => {
      mocks.getUsageCount.mockResolvedValue(100);
      mocks.findActivePurchase.mockResolvedValue({
        id: 'purchase-123',
        expiresAt: new Date('2025-12-31'),
      } as any);

      const result = await checkUsage(userId, 'standup');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('premium');
      expect(result.expires_at).toBeDefined();
    });
  });

  describe('promotion (trial free tier)', () => {
    it('should allow usage when trial not used', async () => {
      mocks.hasUsedTrial.mockResolvedValue(false);

      const result = await checkUsage(userId, 'promotion');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('free_tier');
      expect(result.used).toBe(0);
      expect(result.limit).toBe(1);
    });

    it('should deny usage when trial already used and no purchase', async () => {
      mocks.hasUsedTrial.mockResolvedValue(true);
      mocks.findActivePurchase.mockResolvedValue(null);

      const result = await checkUsage(userId, 'promotion');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('limit_exceeded');
      expect(result.used).toBe(1);
    });
  });

  describe('interview (no free tier)', () => {
    it('should deny usage without purchase', async () => {
      mocks.findActivePurchase.mockResolvedValue(null);

      const result = await checkUsage(userId, 'interview');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('limit_exceeded');
      expect(result.limit).toBe(0);
    });

    it('should allow usage with active purchase', async () => {
      mocks.findActivePurchase.mockResolvedValue({
        id: 'purchase-123',
        expiresAt: new Date('2025-12-31'),
      } as any);

      const result = await checkUsage(userId, 'interview');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('premium');
    });
  });
});
