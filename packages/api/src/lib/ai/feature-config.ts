import { env } from '../../env/config.js';

/**
 * Free tier configuration using discriminated unions
 * Maps directly to database tables:
 * - 'monthly': Uses AiUsage table (count per month)
 * - 'trial': Uses AiTrialUsage table (one-time check)
 * - 'none': No free tier (skip to purchase check)
 */
export type FreeTierConfig =
  | { type: 'monthly'; limit: number }
  | { type: 'trial' } // Always one-time, no limit needed
  | { type: 'none' };

/**
 * Configuration for each AI feature
 */
export type FeatureConfig = {
  name: string;
  product: string;
  freeTier: FreeTierConfig;
  rateLimit: number;
  price: number; // in cents
  duration: number; // in days
};

/**
 * Feature configuration map
 *
 * - standup: Monthly free tier (daily habit feature)
 * - promotion: One-time trial (one-time trial per account)
 * - resume & interview: No free tier, shared product
 */
export const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  standup: {
    name: 'standup',
    product: 'standup-pro',
    freeTier: { type: 'monthly', limit: env.AI_STANDUP_FREE_LIMIT },
    rateLimit: 20,
    price: 900, // $9
    duration: 90,
  },
  promotion: {
    name: 'promotion',
    product: 'promotion-pro',
    freeTier: { type: 'trial' },
    rateLimit: 10,
    price: 1900, // $19
    duration: 30,
  },
  interview: {
    name: 'interview',
    product: 'interview-pro',
    freeTier: { type: 'none' },
    rateLimit: 20,
    price: 2900, // $29
    duration: 30,
  },
};

/**
 * Get feature configuration by name
 * Throws if feature not found
 */
export function getFeatureConfig(feature: string): FeatureConfig {
  const config = FEATURE_CONFIG[feature];
  if (!config) {
    throw new Error(`Unknown feature: ${feature}`);
  }
  return config;
}
