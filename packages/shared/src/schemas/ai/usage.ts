import { z } from '../zod.js';

/**
 * Usage information schema for API responses
 *
 * This is what gets sent to clients in the 'done' event.
 * Does not include internal fields like 'reason' or 'allowed'.
 */
export const UsageInfoSchema = z.object({
  tier: z.enum(['free', 'premium']),
  used: z.number().int().nonnegative().nullable().optional(),
  limit: z.number().int().positive().nullable().optional(),
  resets_at: z.iso.datetime().nullable().optional(),
  expires_at: z.iso.datetime().nullable().optional(),
});

export type UsageInfo = z.infer<typeof UsageInfoSchema>;
