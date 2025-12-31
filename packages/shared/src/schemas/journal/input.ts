import { z } from 'zod';

import { DateStringSchema } from '../common/date.js';
import { JournalContentSchema } from '../common/journal.js';

export const CreateJournalSchema = z
  .object({
    date: DateStringSchema,
    content: JournalContentSchema,
  })
  .openapi('CreateJournalInput', {
    description: 'Create journal entry request body',
    example: {
      date: '2025-12-25',
      content: 'Today was a great day working on the papyrus project.',
    },
  });

export const UpdateJournalSchema = z
  .object({
    content: JournalContentSchema,
  })
  .openapi('UpdateJournalInput', {
    description: 'Update journal entry request body',
    example: {
      content:
        'Updated: Today was an amazing day working on the papyrus project!',
    },
  });

export type CreateJournalInput = z.infer<typeof CreateJournalSchema>;
export type UpdateJournalInput = z.infer<typeof UpdateJournalSchema>;
