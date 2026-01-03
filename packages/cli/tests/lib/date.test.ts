import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  getTodayDate,
  formatDate,
  isValidDate,
  parseDate,
} from '../../src/lib/date.js';

describe('date utilities', () => {
  describe('getTodayDate', () => {
    beforeEach(() => {
      // Mock the current date to December 10, 2025
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-10T15:30:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return today's date in YYYYMMDD format", () => {
      expect(getTodayDate()).toBe('20251210');
    });

    it('should use local timezone', () => {
      // Even if we set time that's different in UTC, should use local date
      vi.setSystemTime(new Date('2025-12-10T23:30:00'));
      expect(getTodayDate()).toBe('20251210');
    });
  });

  describe('formatDate', () => {
    it('should format YYYYMMDD to readable format', () => {
      expect(formatDate('20251210')).toBe(' December 10, 2025');
    });

    it('should handle January dates', () => {
      expect(formatDate('20250101')).toBe(' January 1, 2025');
    });

    it('should handle December dates', () => {
      expect(formatDate('20251231')).toBe(' December 31, 2025');
    });

    it('should handle leap year dates', () => {
      expect(formatDate('20240229')).toBe(' February 29, 2024');
    });

    it('should handle single digit days', () => {
      expect(formatDate('20250305')).toBe(' March 5, 2025');
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate('20251210')).toBe(true);
      expect(isValidDate('20250101')).toBe(true);
      expect(isValidDate('20251231')).toBe(true);
    });

    it('should return true for leap year Feb 29', () => {
      expect(isValidDate('20240229')).toBe(true);
    });

    it('should return false for non-leap year Feb 29', () => {
      expect(isValidDate('20250229')).toBe(false);
    });

    it('should return false for invalid months', () => {
      expect(isValidDate('20251301')).toBe(false);
      expect(isValidDate('20250001')).toBe(false);
    });

    it('should return false for invalid days', () => {
      expect(isValidDate('20251232')).toBe(false);
      expect(isValidDate('20250431')).toBe(false); // April only has 30 days
      expect(isValidDate('20250230')).toBe(false); // Feb 30 doesn't exist
    });

    it('should return false for wrong format', () => {
      expect(isValidDate('2025-12-10')).toBe(false);
      expect(isValidDate('123')).toBe(false);
      expect(isValidDate('202512100')).toBe(false); // 9 digits
      expect(isValidDate('abcd1210')).toBe(false);
    });

    it('should return false for empty or invalid strings', () => {
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('        ')).toBe(false);
    });
  });

  describe('parseDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-10T15:30:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should parse YYYYMMDD format as-is', () => {
      expect(parseDate('20251210')).toBe('20251210');
      expect(parseDate('20250101')).toBe('20250101');
    });

    it('should parse ISO format', () => {
      expect(parseDate('2025-12-10')).toBe('20251210');
      expect(parseDate('2025-01-01')).toBe('20250101');
    });

    it('should parse relative dates', () => {
      expect(parseDate('today')).toBe('20251210');
      expect(parseDate('yesterday')).toBe('20251209');
      expect(parseDate('tomorrow')).toBe('20251211');
    });

    it('should parse positive day offsets', () => {
      expect(parseDate('+1')).toBe('20251211');
      expect(parseDate('+7')).toBe('20251217');
      expect(parseDate('+30')).toBe('20260109');
    });

    it('should parse negative day offsets', () => {
      expect(parseDate('-1')).toBe('20251209');
      expect(parseDate('-7')).toBe('20251203');
      expect(parseDate('-30')).toBe('20251110');
    });

    it('should handle month boundaries in offsets', () => {
      vi.setSystemTime(new Date('2025-01-01T15:30:00'));
      expect(parseDate('-1')).toBe('20241231');
      expect(parseDate('+31')).toBe('20250201');
    });
  });
});
