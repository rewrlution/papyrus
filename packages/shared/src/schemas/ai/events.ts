import { z } from '../zod.js';

import { UsageInfoSchema } from './usage.js';

/**
 * SSE Event Schemas for AI Standup Streaming
 *
 * These schemas define the shape of events sent to clients during AI generation.
 */

export const ThinkingEventSchema = z.object({
  message: z.string(),
});

export const ContentEventSchema = z.object({
  text: z.string(),
});

export const DoneEventSchema = z.object({
  journal_date: z.string(), // YYYYMMDD or "YYYYMMDD to YYYYMMDD" for date ranges
  usage: UsageInfoSchema,
});

export const ErrorEventSchema = z.object({
  message: z.string(),
});

// Type exports
export type ThinkingEvent = z.infer<typeof ThinkingEventSchema>;
export type ContentEvent = z.infer<typeof ContentEventSchema>;
export type DoneEvent = z.infer<typeof DoneEventSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

/**
 * Zod schema for SSE events using a discriminated union.
 *
 * A discriminated union is a union of types sharing a common "discriminant"
 * property (here, 'type') with literal values. This enables:
 * - TypeScript to auto-narrow types based on the discriminant in conditionals
 * - Zod to efficiently validate by checking the discriminant first
 */
export const StandupStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('thinking'), message: z.string() }),
  z.object({ type: z.literal('content'), text: z.string() }),
  z.object({
    type: z.literal('done'),
    journal_date: z.string(),
    usage: UsageInfoSchema,
  }),
  z.object({ type: z.literal('error'), message: z.string() }),
]);

export type StandupStreamEvent = z.infer<typeof StandupStreamEventSchema>;
