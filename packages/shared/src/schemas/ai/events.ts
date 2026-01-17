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
 * Discriminated union type for SSE events.
 *
 * Each event has a 'type' field that identifies the event type,
 * allowing type-safe handling in TypeScript.
 */
export type StandupStreamEvent =
  | { type: 'thinking'; message: string }
  | { type: 'content'; text: string }
  | {
      type: 'done';
      journal_date: string;
      usage: z.infer<typeof UsageInfoSchema>;
    }
  | { type: 'error'; message: string };
