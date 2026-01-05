import { format, parse, addDays, subDays, parseISO } from 'date-fns';

import { DATE_FORMAT, DateStringSchema } from '@rewrlution/papyrus-shared';

/**
 * Use local timezone to get today's date in YYYYMMDD format.
 * If you're in PST on Dec 10, you get "20251210"
 * even if UTC is Dec 11
 *
 * @returns today's date in YYYYMMDD format
 */
export function getTodayDate(): string {
  return format(new Date(), DATE_FORMAT);
}

/**
 * Convert YYYYMMDD to readable format like "December 10, 2025"
 *
 * @param date - date in YYYYMMDD format
 * @returns readable format of the same date
 */
export function formatDate(date: string): string {
  const dateObj = parse(date, DATE_FORMAT, new Date());
  return format(dateObj, ' MMMM d, yyyy');
}

/**
 * Parse user input and convert to YYYYMMDD format.
 * Supports:
 * - YYYYMMDD: "20251218"
 * - ISO: "2025-12-18"
 * - Relative: "today", "yesterday", "tomorrow"
 * - Offsets: "+1", "-7"
 *
 * @param input - user input
 * @returns date in YYYYMMDD format
 * @throws Error if input cannot be parsed or is invalid
 */
export function parseDate(input: string): string {
  let result: string;

  // Parse ISO format: 2025-12-10 → 20251210
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    result = format(parseISO(input), DATE_FORMAT);
  }
  // Parse relative dates
  else if (input === 'today') {
    result = getTodayDate();
  } else if (input === 'yesterday') {
    result = format(subDays(new Date(), 1), DATE_FORMAT);
  } else if (input === 'tomorrow') {
    result = format(addDays(new Date(), 1), DATE_FORMAT);
  }
  // Parse offsets: +1, -7 (days from today)
  else if (/^([+-]\d+)$/.test(input)) {
    const days = parseInt(input);
    result = format(addDays(new Date(), days), DATE_FORMAT);
  }
  // Assume YYYYMMDD
  else {
    result = input;
  }

  // Validate using shared schema
  const validation = DateStringSchema.safeParse(result);
  if (!validation.success) {
    throw new Error(`Invalid date: ${input}. Expected YYYYMMDD format.`);
  }

  return result;
}

/**
 * Check if date string is valid YYYYMMDD.
 * Uses shared validation schema.
 *
 * @param date - date string
 * @returns true if it is a valid date, otherwise false
 */
export function isValidDate(date: string): boolean {
  return DateStringSchema.safeParse(date).success;
}

/**
 * Parse date string (YYYYMMDD) to Date object in local timezone at noon.
 *
 * This function is needed for creating consistent timestamps from date strings
 * while avoiding timezone edge cases. By using noon (12:00:00), we ensure the
 * date stays correct regardless of timezone offsets.
 *
 * Use case: When reading legacy journal files without frontmatter, we need to
 * create timestamps from the filename (e.g., "20251231.md") that reflect the
 * correct date in the user's local timezone.
 *
 * @param dateString - date in YYYYMMDD format
 * @returns Date object at noon in local timezone
 * @example
 * parseDateToLocalTimestamp("20251231") // Dec 31, 2025 12:00:00 (local time)
 */
export function parseDateToLocalTimestamp(dateString: string): Date {
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateString.substring(6, 8), 10);

  // Create date at noon local time to avoid timezone edge cases
  return new Date(year, month, day, 12, 0, 0);
}

/**
 * Format date string as "Month DD, YYYY (Day)"
 * Example: "20260104" → "January 4, 2026 (Saturday)"
 */
export function formatDateHeader(dateStr: string): string {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  const date = new Date(`${year}-${month}-${day}`);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };

  return date.toLocaleDateString('en-US', options);
}
