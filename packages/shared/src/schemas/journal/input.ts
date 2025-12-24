import { z } from 'zod';
import { DateStringSchema } from '../common/date.js';
import { JournalContentSchema } from '../common/journal.js';

export const CreateJournalSchema = z.object({
  date: DateStringSchema,
  content: JournalContentSchema,
});

export const UpdateJournalSchema = z.object({
  content: JournalContentSchema,
});

export type CreateJournalInput = z.infer<typeof CreateJournalSchema>;
export type UpdateJournalInput = z.infer<typeof UpdateJournalSchema>;
