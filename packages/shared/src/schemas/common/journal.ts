import { z } from 'zod';

export const JournalContentSchema = z
  .string()
  .min(1, 'Content is required')
  .max(100_000, 'Content must be less than 100,000 characters');

export const JournalMetadataSchema = z.object({
  date: z.string(),
  hash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const JournalDataSchema = JournalMetadataSchema.extend({
  content: JournalContentSchema,
});

export type JournalMetaData = z.infer<typeof JournalMetadataSchema>;
export type JournalData = z.infer<typeof JournalDataSchema>;
