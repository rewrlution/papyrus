import {
  UsageInfo,
  getCurrentMonth,
  getNextMonthStart,
} from '@rewrlution/papyrus-shared';

import {
  aiUsageRepository,
  aiTrialUsageRepository,
  aiPurchaseRepository,
} from '../../domain/repositories/index.js';

import { getFeatureConfig, FeatureConfig } from './feature-config.js';

/**
 * Internal usage information with decision-making fields.
 *
 * Used internally to determine whether to allow a request.
 * Transform to external UsageInfo before sending to clients.
 */
export interface InternalUsageInfo {
  allowed: boolean;
  reason: 'free_tier' | 'premium' | 'limit_exceeded';

  // For free tier
  used?: number;
  limit?: number;
  resets_at?: string | null; // When free tier resets (ISO date string, null for trials)

  // For premium tier
  expires_at?: string; // ISO date string
}

/**
 * Transform internal usage info to external API response format.
 *
 * Removes internal decision-making fields (allowed, reason) and maps
 * reason to tier for client consumption.
 */
export function toExternalUsageInfo(internal: InternalUsageInfo): UsageInfo {
  const tier = internal.reason === 'premium' ? 'premium' : 'free';

  return {
    tier,
    used: internal.used,
    limit: internal.limit,
    resets_at: internal.resets_at ?? undefined,
    expires_at: internal.expires_at,
  };
}

export async function checkUsage(
  userId: string,
  feature: string
): Promise<InternalUsageInfo> {
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

/**
 * Check free tier availability
 */
async function checkFreeTier(
  userId: string,
  feature: string,
  config: FeatureConfig
): Promise<InternalUsageInfo> {
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
 * Increment usage counter after successful AI generation.
 *
 * @param userId - User ID
 * @param feature - Feature name
 * @param usageInfo - Usage info from checkUsage (to determine if free or premium)
 */
export async function incrementUsage(
  userId: string,
  feature: string,
  usageInfo: InternalUsageInfo
): Promise<void> {
  // Only increment for free tier usage
  // Premium is time-based, no counting needed
  if (usageInfo.reason === 'free_tier') {
    const config = getFeatureConfig(feature);
    const { freeTier } = config;

    if (freeTier.type === 'monthly') {
      const month = getCurrentMonth();
      await aiUsageRepository.upsertUsage(userId, feature, month);
    } else if (freeTier.type === 'trial') {
      await aiTrialUsageRepository.markTrialUsed(userId, feature);
    }
  }
}
