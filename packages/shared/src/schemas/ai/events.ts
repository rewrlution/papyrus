import { z } from '../zod.js';

import { UsageInfoSchema } from './usage.js';

export const ThinkingEventSchema = z.object({
  message: z.string(),
});

export const ContentEventSchema = z.object({
  text: z.string(),
});

export const DoneEventSchema = z.object({
  journal_date: z.string(), // YYYY-MM-DD or YYYY-MM-DD to YYYY-MM-DD
  usage: UsageInfoSchema,
});

export const ErrorEventSchema = z.object({
  message: z.string(),
});
