import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  getTodayDate,
  formatDate,
  isValidDate,
  parseDate,
  parseDateToLocalTimestamp,
} from '../../src/utils/date.js';

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

  describe('parseDateToLocalTimestamp', () => {
    it('should parse YYYYMMDD to Date at noon local time', () => {
      const result = parseDateToLocalTimestamp('20251231');

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // December (0-indexed)
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('should handle different dates', () => {
      const jan1 = parseDateToLocalTimestamp('20250101');
      expect(jan1.getFullYear()).toBe(2025);
      expect(jan1.getMonth()).toBe(0); // January
      expect(jan1.getDate()).toBe(1);
      expect(jan1.getHours()).toBe(12);

      const feb29 = parseDateToLocalTimestamp('20240229'); // Leap year
      expect(feb29.getFullYear()).toBe(2024);
      expect(feb29.getMonth()).toBe(1); // February
      expect(feb29.getDate()).toBe(29);
      expect(feb29.getHours()).toBe(12);
    });

    it('should create date in local timezone', () => {
      const result = parseDateToLocalTimestamp('20251231');

      // The date should be in local timezone, not UTC
      // Check that the date string contains the correct local date
      const dateStr = result.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      expect(dateStr).toBe('2025-12-31');
    });
  });
});
