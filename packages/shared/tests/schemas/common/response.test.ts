import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import {
  ApiErrorResponseSchema,
  ApiDataResponseSchema,
  ApiPaginatedResponseSchema,
  type ApiErrorResponse,
  type ApiDataResponse,
  type ApiPaginatedResponse,
} from '../../../src/schemas/common/response.js';

describe('ApiErrorResponseSchema', () => {
  it('should validate a valid error response without details', () => {
    const errorResponse = {
      success: false,
      message: 'Something went wrong',
      error: {
        code: 'INTERNAL_ERROR',
      },
    };

    const result = ApiErrorResponseSchema.safeParse(errorResponse);
    expect(result.success).toBe(true);
  });

  it('should validate a valid error response with details', () => {
    const errorResponse = {
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
        ],
      },
    };

    const result = ApiErrorResponseSchema.safeParse(errorResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.error.details).toHaveLength(2);
    }
  });

  it('should reject response with success: true', () => {
    const invalidResponse = {
      success: true,
      message: 'Error message',
      error: {
        code: 'ERROR_CODE',
      },
    };

    const result = ApiErrorResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it('should reject response without error object', () => {
    const invalidResponse = {
      success: false,
      message: 'Error message',
    };

    const result = ApiErrorResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });
});

describe('ApiDataResponseSchema', () => {
  it('should validate a success response with simple data', () => {
    const UserSchema = z.object({
      id: z.string(),
      name: z.string(),
    });

    const schema = ApiDataResponseSchema(UserSchema);

    const response = {
      success: true,
      data: {
        id: '123',
        name: 'John Doe',
      },
      message: 'User retrieved successfully',
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should validate a success response with message', () => {
    const StringSchema = z.string();
    const schema = ApiDataResponseSchema(StringSchema);

    const response = {
      success: true,
      data: 'test data',
      message: 'Operation successful',
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success && result.data.success) {
      expect(result.data.message).toBe('Operation successful');
    }
  });

  it('should reject response with success: false', () => {
    const StringSchema = z.string();
    const schema = ApiDataResponseSchema(StringSchema);

    const response = {
      success: false,
      data: 'test data',
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject response with invalid data type', () => {
    const NumberSchema = z.number();
    const schema = ApiDataResponseSchema(NumberSchema);

    const response = {
      success: true,
      data: 'not a number',
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject response without data field', () => {
    const StringSchema = z.string();
    const schema = ApiDataResponseSchema(StringSchema);

    const response = {
      success: true,
      message: 'Resource deleted successfully',
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject response without message', () => {
    const NumberSchema = z.number();
    const schema = ApiDataResponseSchema(NumberSchema);

    const response = {
      success: true,
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe('ApiPaginatedResponseSchema', () => {
  it('should validate a paginated response', () => {
    const ItemSchema = z.object({
      id: z.number(),
      title: z.string(),
    });

    const schema = ApiPaginatedResponseSchema(ItemSchema);

    const response = {
      success: true,
      data: [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
      message: 'Items retrieved successfully',
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success && result.data.success) {
      expect(result.data.data).toHaveLength(2);
      expect(result.data.pagination.page).toBe(1);
    }
  });

  it('should validate paginated response with empty data array', () => {
    const ItemSchema = z.object({ id: z.number() });
    const schema = ApiPaginatedResponseSchema(ItemSchema);

    const response = {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      message: 'No items found',
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should validate paginated response with optional message', () => {
    const ItemSchema = z.string();
    const schema = ApiPaginatedResponseSchema(ItemSchema);

    const response = {
      success: true,
      data: ['item1', 'item2'],
      pagination: {
        page: 2,
        limit: 5,
        total: 50,
        totalPages: 10,
      },
      message: 'Data retrieved successfully',
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success && result.data.success) {
      expect(result.data.message).toBe('Data retrieved successfully');
    }
  });

  it('should reject pagination with invalid page number', () => {
    const ItemSchema = z.string();
    const schema = ApiPaginatedResponseSchema(ItemSchema);

    const response = {
      success: true,
      data: ['item'],
      pagination: {
        page: 0, // Should be positive
        limit: 10,
        total: 10,
        totalPages: 1,
      },
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject pagination with negative total', () => {
    const ItemSchema = z.string();
    const schema = ApiPaginatedResponseSchema(ItemSchema);

    const response = {
      success: true,
      data: ['item'],
      pagination: {
        page: 1,
        limit: 10,
        total: -5, // Should be non-negative
        totalPages: 1,
      },
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject response without pagination field', () => {
    const ItemSchema = z.string();
    const schema = ApiPaginatedResponseSchema(ItemSchema);

    const response = {
      success: true,
      data: ['item1', 'item2'],
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject non-array data', () => {
    const ItemSchema = z.string();
    const schema = ApiPaginatedResponseSchema(ItemSchema);

    const response = {
      success: true,
      data: 'not an array',
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    const result = schema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe('Type inference', () => {
  it('should properly infer ApiErrorResponse type', () => {
    const errorResponse: ApiErrorResponse = {
      success: false,
      message: 'Error occurred',
      error: {
        code: 'TEST_ERROR',
      },
    };

    expect(errorResponse.success).toBe(false);
  });

  it('should properly infer ApiDataResponse type', () => {
    type User = { id: string; name: string };
    const successResponse: ApiDataResponse<User> = {
      success: true,
      data: {
        id: '1',
        name: 'Test User',
      },
      message: 'User retrieved successfully',
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.data?.name).toBe('Test User');
  });

  it('should properly infer ApiPaginatedResponse type', () => {
    type Item = { id: number };
    const paginatedResponse: ApiPaginatedResponse<Item> = {
      success: true,
      data: [{ id: 1 }, { id: 2 }],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
      message: 'Items retrieved successfully',
    };

    expect(paginatedResponse.success).toBe(true);
    if (paginatedResponse.success) {
      expect(paginatedResponse.data).toHaveLength(2);
    }
  });
});
