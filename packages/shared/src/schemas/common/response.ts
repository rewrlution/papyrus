import { z, ZodType } from '../zod.js';

/**
 * API Response Base Schemas
 * ==========================
 *
 * This file defines 4 independent base schemas for all API responses:
 *
 * 1. ApiErrorResponseSchema - Error responses with error code and optional details
 * 2. ApiMessageResponseSchema - Success responses with only a message (no data field)
 * 3. ApiDataResponseSchema<T> - Success responses with data (nullable) and message
 * 4. ApiPaginatedResponseSchema<T> - Success responses with paginated array data
 *
 * Usage Guidelines:
 * -----------------
 * - ApiErrorResponseSchema: All error responses (4xx, 5xx)
 * - ApiMessageResponseSchema: Message-only (verify-email, logout)
 * - ApiDataResponseSchema<T>: Data responses (GET, POST, PUT, DELETE)
 * - ApiPaginatedResponseSchema<T>: List endpoints with pagination
 *
 * For comprehensive documentation on the design rationale, migration guide,
 * and detailed examples, see: @packages/shared/docs/api-response-design.md
 */

export const ApiErrorResponseSchema = z
  .object({
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
  })
  .openapi('ApiErrorResponse', {
    description: 'API error response',
    example: {
      success: false,
      message: 'An error occurred',
      error: {
        code: 'VALIDATION_ERROR',
        details: [{ field: 'email', message: 'Invalid email address' }],
      },
    },
  });

export const ApiMessageResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

export const ApiDataResponseSchema = <T extends ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema.nullable(),
    message: z.string(),
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
    message: z.string(),
  });

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export type ApiMessageResponse = z.infer<typeof ApiMessageResponseSchema>;

export type ApiDataResponse<T> = {
  success: true;
  data: T | null;
  message: string;
};

export type ApiPaginatedResponse<T> = {
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
