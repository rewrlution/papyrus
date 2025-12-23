import { describe, it, expect } from 'vitest';
import { DateStringSchema } from '../src/schemas/common/date.js';

describe('DateStringSchema', () => {
  describe('valid dates', () => {
    it.each([
      ['20231215', 'valid date in YYYYMMDD format'],
      ['20240229', 'leap year date'],
      ['20230101', 'first day of month'],
      ['20230131', 'last day of month (31 days)'],
      ['20230430', 'last day of month (30 days)'],
      ['20230228', 'last day of February in non-leap year'],
    ])('should accept %s (%s)', (dateString) => {
      const result = DateStringSchema.safeParse(dateString);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid format', () => {
    it.each([
      ['2023-12-15', 'date with dashes', 'YYYYMMDD format'],
      ['2023/12/15', 'date with slashes', undefined],
      ['2023121', 'too few digits', undefined],
      ['202312155', 'too many digits', undefined],
      ['', 'empty string', undefined],
      ['abcdefgh', 'non-numeric string', undefined],
    ])('should reject %s (%s)', (dateString, _description, expectedMessage) => {
      const result = DateStringSchema.safeParse(dateString);
      expect(result.success).toBe(false);
      if (!result.success && expectedMessage) {
        expect(result.error.issues[0].message).toContain(expectedMessage);
      }
    });
  });

  describe('invalid dates', () => {
    it.each([
      ['20230015', 'invalid month (00)'],
      ['20231315', 'invalid month (13)'],
      ['20231200', 'invalid day (00)'],
      ['20231232', 'invalid day (32)'],
      ['20230230', 'February 30'],
      ['20230229', 'February 29 in non-leap year'],
      ['20230431', 'April 31 (month with only 30 days)'],
      ['20230631', 'June 31 (month with only 30 days)'],
      ['20230931', 'September 31 (month with only 30 days)'],
      ['20231131', 'November 31 (month with only 30 days)'],
    ])('should reject %s (%s)', (dateString) => {
      const result = DateStringSchema.safeParse(dateString);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid date');
      }
    });
  });
});
