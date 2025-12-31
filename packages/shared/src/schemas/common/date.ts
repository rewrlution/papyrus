import { z } from 'zod';

import { DATE_FORMAT_REGEX } from './constants.js';

export const DateStringSchema = z
  .string()
  .regex(DATE_FORMAT_REGEX, 'Date must be in YYYYMMDD format')
  .refine(
    (date) => {
      const year = parseInt(date.substring(0, 4));
      const month = parseInt(date.substring(4, 6));
      const day = parseInt(date.substring(6, 8));

      if (month < 1 || month > 12) return false;
      if (day < 1 || day > 31) return false;

      const dateObj = new Date(year, month - 1, day);
      return (
        dateObj.getFullYear() === year &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getDate() === day
      );
    },
    { message: 'Invalid date' }
  );

export type DateString = z.infer<typeof DateStringSchema>;
