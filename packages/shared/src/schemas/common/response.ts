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
    // .nullish() = .nullable().optional()
    // Accepts: value | null | undefined (field can be omitted)
    // Use cases:
    // 1. Actual data: { success: true, data: <value>, message: "Retrieved successfully" }
    // 2. Empty result: { success: true, data: null, message: "No journal found" }
    // 3. No content: { success: true, message: "Deleted successfully" } (DELETE/void operations)
    data: dataSchema.nullish(),
    message: z.string(),
  });

export const ApiPaginatedSuccessResponseSchema = <T extends ZodType>(
  itemSchema: T
) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
    message: z.string(),
  });

export const ApiResponseSchema = <T extends ZodType>(dataSchema: T) =>
  z.union([ApiSuccessResponseSchema(dataSchema), ApiErrorResponseSchema]);

export const ApiPaginatedResponseSchema = <T extends ZodType>(dataSchema: T) =>
  z.union([
    ApiPaginatedSuccessResponseSchema(dataSchema),
    ApiErrorResponseSchema,
  ]);

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export type ApiSuccessResponse<T> = {
  success: true;
  data?: T | null;
  message: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ApiPaginatedSuccessResponse<T> = {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
};

export type ApiPaginatedResponse<T> =
  | ApiPaginatedSuccessResponse<T>
  | ApiErrorResponse;
