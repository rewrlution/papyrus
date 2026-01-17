import { describe, it, expect } from 'vitest';

import { truncateToWidth, padToWidth } from '../../src/utils/text.js';

describe('truncateToWidth', () => {
  it('should return text as-is when it fits', () => {
    expect(truncateToWidth('Hello', 10)).toBe('Hello');
  });

  it('should truncate text with ellipsis when too long', () => {
    expect(truncateToWidth('Hello World', 8)).toBe('Hello W…');
  });

  it('should handle empty string', () => {
    expect(truncateToWidth('', 5)).toBe('');
  });

  it('should handle zero maxWidth', () => {
    expect(truncateToWidth('Hello', 0)).toBe('');
  });

  it('should handle CJK characters (wide chars)', () => {
    // 你好 = 2 chars × 2 columns = 4 columns
    expect(truncateToWidth('你好世界', 5)).toBe('你好…');
  });

  it('should handle emoji (wide chars)', () => {
    // 👋 = 2 columns, space = 1, 'He' = 2, ellipsis = 1 → total 6
    expect(truncateToWidth('👋 Hello', 6)).toBe('👋 He…');
  });
});

describe('padToWidth', () => {
  it('should pad text with spaces to reach target width', () => {
    expect(padToWidth('Hello', 10)).toBe('Hello     ');
  });

  it('should return text as-is when already at target width', () => {
    expect(padToWidth('Hello', 5)).toBe('Hello');
  });

  it('should truncate text when too long', () => {
    expect(padToWidth('Hello World', 8)).toBe('Hello W…');
  });

  it('should handle empty string', () => {
    expect(padToWidth('', 5)).toBe('     ');
  });

  it('should handle CJK characters (wide chars)', () => {
    // 你好 = 2 chars × 2 columns = 4 columns, need 2 more spaces to reach 6
    expect(padToWidth('你好', 6)).toBe('你好  ');
  });

  it('should handle emoji (wide chars)', () => {
    // 👋 = 2 columns, need 3 more spaces to reach 5
    expect(padToWidth('👋', 5)).toBe('👋   ');
  });
});
