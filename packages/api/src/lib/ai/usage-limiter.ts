import {
  aiUsageRepository,
  aiTrialUsageRepository,
  aiPurchaseRepository,
} from '../../domain/repositories/index.js';

import { getFeatureConfig, FeatureConfig } from './feature-config.js';

/**
 * Usage information returned by checkUsage()
 */
export interface UsageInfo {
  allowed: boolean;
  reason: 'free_tier' | 'premium' | 'limit_exceeded';

  // For free tier
  used?: number;
  limit?: number;
  resets_at?: string | null; // When free tier resets (ISO date string, null for trials)

  // For premium tier
  expires_at?: string; // ISO date string
}

export async function checkUsage(
  userId: string,
  feature: string
): Promise<UsageInfo> {
  const config = getFeatureConfig(feature);

  // Step 1: Check FREE TIER first
  const freeUsage = await checkFreeTier(userId, feature, config);

  if (freeUsage.allowed) {
    return freeUsage;
  }

  // Step 2: Free tier exhausted - check for premium purchase
  const activePurchase = await aiPurchaseRepository.findActivePurchase(
    userId,
    config.product
  );

  if (activePurchase) {
    return {
      allowed: true,
      reason: 'premium',
      expires_at: activePurchase.expiresAt?.toISOString(),
    };
  }

  // Step 3: No free tier, no premium - denied
  return freeUsage; // Contains limit_exceeded info
}

async function checkFreeTier(
  userId: string,
  feature: string,
  config: FeatureConfig
): Promise<UsageInfo> {
  const { freeTier } = config;

  switch (freeTier.type) {
    case 'none':
      return {
        allowed: false,
        reason: 'limit_exceeded',
        used: 0,
        limit: 0,
        resets_at: null,
      };

    case 'monthly': {
      const month = getCurrentMonth();
      const used = await aiUsageRepository.getUsageCount(
        userId,
        feature,
        month
      );
      const allowed = used < freeTier.limit;

      return {
        allowed,
        reason: allowed ? 'free_tier' : 'limit_exceeded',
        used,
        limit: freeTier.limit,
        resets_at: getNextMonthStart().toISOString(),
      };
    }

    case 'trial': {
      const hasUsed = await aiTrialUsageRepository.hasUsedTrial(
        userId,
        feature
      );
      const used = hasUsed ? 1 : 0;
      const allowed = !hasUsed;

      return {
        allowed,
        reason: allowed ? 'free_tier' : 'limit_exceeded',
        used,
        limit: 1,
        resets_at: null,
      };
    }
  }
}

/**
 * Get current month in 'YYYY-MM' format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get start of next month (for resets_at timestamp)
 */
function getNextMonthStart(): Date {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  // First day of next month
  return new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
}
