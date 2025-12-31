import { z } from 'zod';

import { DateStringSchema } from './date.js';

export const IdParamSchema = z.object({
  id: z.string().min(1, 'Id is required'),
});

export const DateParamSchema = z.object({
  date: DateStringSchema,
});

export const PaginationParamSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be positive'),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Limit must be positive'),
});

export type IdParam = z.infer<typeof IdParamSchema>;
export type DateParam = z.infer<typeof DateParamSchema>;
export type PaginationParam = z.infer<typeof PaginationParamSchema>;
