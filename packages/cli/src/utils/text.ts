import stringWidth from 'string-width';

/**
 * Truncate text to fit within maxWidth, handling wide characters.
 * Uses string-width to properly measure CJK and emoji characters.
 *
 * @param text - The text to truncate
 * @param maxWidth - Maximum width in columns
 * @returns Truncated text with ellipsis if needed
 *
 * @example
 * truncateToWidth('Hello World', 8) // "Hello W…"
 * truncateToWidth('你好世界', 6) // "你好…" (CJK chars are 2 columns each)
 */
export function truncateToWidth(text: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';

  const width = stringWidth(text);
  if (width <= maxWidth) {
    return text;
  }

  // Build string char by char, checking width
  let result = '';
  for (const char of text) {
    const testStr = result + char;
    if (stringWidth(testStr) > maxWidth - 1) {
      // -1 for ellipsis
      return result + '…';
    }
    result = testStr;
  }

  return result;
}

/**
 * Pad text to exact width, handling wide characters.
 *
 * @param text - The text to pad
 * @param targetWidth - Target width in columns
 * @returns Padded text (or truncated if too long)
 *
 * @example
 * padToWidth('Hello', 10) // "Hello     " (5 spaces added)
 * padToWidth('你好', 6) // "你好  " (2 spaces added, CJK chars are 2 columns each)
 */
export function padToWidth(text: string, targetWidth: number): string {
  const width = stringWidth(text);
  if (width >= targetWidth) {
    return truncateToWidth(text, targetWidth);
  }
  return text + ' '.repeat(targetWidth - width);
}
