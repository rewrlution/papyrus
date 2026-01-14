import { DateStringSchema } from '../common/date.js';
import { z } from '../zod.js';

export const StandupRequestSchema = z
  .object({
    date: DateStringSchema.optional(),
    from: DateStringSchema.optional(),
    to: DateStringSchema.optional(),
  })
  .refine(
    (data) => {
      // Cannot mix 'date' with 'from'/'to'
      if (data.date && (data.from || data.to)) return false;

      // If 'to' is provided, 'from' must also be provided
      if (!data.from && data.to) return false;

      // If 'from' and 'to' are provided, 'from' must be before or equal to 'to'
      if (data.from && data.to && data.from > data.to) return false;

      return true;
    },
    {
      message:
        'Either provide "date", or "from" (with optional "to"), or neither. If both "from" and "to" are provided, ensure "from" <= "to"',
    }
  );

export type StandupRequest = z.infer<typeof StandupRequestSchema>;
