import { z } from '../zod.js';

export const UsageInfoSchema = z.object({
  used: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().nullable().optional(),
  resets_at: z.iso.datetime().nullable().optional(),
  tier: z.enum(['free', 'premium']),
});

export type UsageInfo = z.infer<typeof UsageInfoSchema>;
