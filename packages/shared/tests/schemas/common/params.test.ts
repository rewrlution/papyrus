import { describe, it, expect } from 'vitest';
import {
  IdParamSchema,
  DateParamSchema,
  PaginationParamSchema,
} from '../../../src/schemas/common/params.js';

describe('IdParamSchema', () => {
  it('should accept valid id', () => {
    const result = IdParamSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
  });

  it('should reject empty id', () => {
    const result = IdParamSchema.safeParse({ id: '' });
    expect(result.success).toBe(false);
  });
});

describe('DateParamSchema', () => {
  it('should accept valid date', () => {
    const result = DateParamSchema.safeParse({ date: '20231215' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid date', () => {
    const result = DateParamSchema.safeParse({ date: '2023-12-15' });
    expect(result.success).toBe(false);
  });
});

describe('PaginationParamSchema', () => {
  it('should use defaults when not provided', () => {
    const result = PaginationParamSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should parse valid pagination params', () => {
    const result = PaginationParamSchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it('should reject invalid page', () => {
    const result = PaginationParamSchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });
});
