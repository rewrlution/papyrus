import { z, ZodType } from 'zod';

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.object({
    code: z.string(),
    details: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        })
      )
      .optional(),
  }),
});

export const ApiSuccessResponseSchema = <T extends ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema.optional(),
    message: z.string().optional(),
  });

export const ApiPaginatedResponseSchema = <T extends ZodType>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
    message: z.string().optional(),
  });

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export type ApiSuccessResponse<T> = {
  success: true;
  data?: T;
  message?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ApiPaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};
