import { describe, it, expect } from 'vitest';

import { StandupRequestSchema } from '../../../src/schemas/ai/standup';

describe('StandupRequestSchema', () => {
  describe('Valid inputs', () => {
    it('should accept empty object', () => {
      const result = StandupRequestSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept date only', () => {
      const result = StandupRequestSchema.safeParse({ date: '20260101' });
      expect(result.success).toBe(true);
    });

    it('should accept from only', () => {
      const result = StandupRequestSchema.safeParse({ from: '20250101' });
      expect(result.success).toBe(true);
    });

    it('should accept from and to', () => {
      const result = StandupRequestSchema.safeParse({
        from: '20260101',
        to: '20260107',
      });
      expect(result.success).toBe(true);
    });

    it('should accept from and to with same date', () => {
      const result = StandupRequestSchema.safeParse({
        from: '20260101',
        to: '20260101',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid inputs', () => {
    it('shoudl reject invalid date format', () => {
      const result = StandupRequestSchema.safeParse({ date: '2026-01-01' });
      expect(result.success).toBe(false);
    });

    it('should reject date mixed with from', () => {
      const result = StandupRequestSchema.safeParse({
        date: '20260101',
        from: '20260103',
      });
      expect(result.success).toBe(false);
    });

    it('should reject to without from', () => {
      const result = StandupRequestSchema.safeParse({ to: '20260107' });
      expect(result.success).toBe(false);
    });

    it('should recjt from > to', () => {
      const result = StandupRequestSchema.safeParse({
        from: '20260107',
        to: '20260101',
      });
      expect(result.success).toBe(false);
    });
  });
});
