import { z } from '../zod.js';

/**
 * Usage information schema for API responses
 *
 * This is what gets sent to clients in the 'done' event.
 * Does not include internal fields like 'reason' or 'allowed'.
 */
export const UsageInfoSchema = z.object({
  allowed: z.boolean(),
  tier: z.enum(['free', 'premium']),
  reason: z.enum(['free_tier', 'premium', 'limit_exceeded']),
  used: z.number().int().nonnegative().nullable().optional(),
  limit: z.number().int().positive().nullable().optional(),
  resets_at: z.iso.datetime().nullable().optional(),
  expires_at: z.iso.datetime().nullable().optional(),
});

export type UsageInfo = z.infer<typeof UsageInfoSchema>;
