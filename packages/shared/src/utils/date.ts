import { format, startOfMonth, addMonths } from 'date-fns';

/**
 * Date utility functions using date-fns
 *
 * Date format conventions:
 * - YYYYMMDD - Database and API format
 * - YYYY-MM - Usage tracking format
 */

/**
 * Get current date in YYYYMMDD format
 *
 * @returns Current date string (e.g., '20260116')
 */
export function getCurrentDate(): string {
  return format(new Date(), 'yyyyMMdd');
}

/**
 * Get current month in YYYY-MM format
 *
 * @returns Current month string (e.g., '2026-01')
 */
export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/**
 * Get start of next month
 *
 * Used for calculating usage reset dates.
 *
 * @returns Date object representing 00:00:00 on the 1st of next month
 */
export function getNextMonthStart(): Date {
  return startOfMonth(addMonths(new Date(), 1));
}

/**
 * Parse YYYYMMDD string to Date object
 *
 * Helper function for internal use.
 *
 * @param yyyymmdd - Date in YYYYMMDD format
 * @returns Date object
 */
function parseYYYYMMDD(yyyymmdd: string): Date {
  const year = parseInt(yyyymmdd.slice(0, 4), 10);
  const month = parseInt(yyyymmdd.slice(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(yyyymmdd.slice(6, 8), 10);
  return new Date(year, month, day);
}

/**
 * Format YYYYMMDD as human-readable date
 *
 * Converts database format to display format.
 *
 * @param yyyymmdd - Date in YYYYMMDD format (e.g., "20250114")
 * @returns Formatted date string (e.g., "January 14, 2025")
 */
export function formatDateForDisplay(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) {
    throw new Error(`Invalid YYYYMMDD format: ${yyyymmdd}`);
  }

  const date = parseYYYYMMDD(yyyymmdd);
  return format(date, 'MMMM d, yyyy');
}

/**
 * Format date range as human-readable string
 *
 * @param from - Start date in YYYYMMDD format
 * @param to - End date in YYYYMMDD format
 * @returns Formatted range (e.g., "January 1 to January 14, 2025")
 */
export function formatDateRangeForDisplay(from: string, to: string): string {
  if (from === to) {
    return formatDateForDisplay(from);
  }

  const fromDate = parseYYYYMMDD(from);
  const toDate = parseYYYYMMDD(to);

  // Same year: "January 1 to January 14, 2025"
  if (fromDate.getFullYear() === toDate.getFullYear()) {
    return `${format(fromDate, 'MMMM d')} to ${format(toDate, 'MMMM d, yyyy')}`;
  }

  // Different years: "December 25, 2024 to January 14, 2025"
  return `${format(fromDate, 'MMMM d, yyyy')} to ${format(toDate, 'MMMM d, yyyy')}`;
}
