import { describe, it, expect } from 'vitest';

import { extractPreview } from './journal-preview.js';

describe('extractPreview', () => {
  it('should extract first line after frontmatter', () => {
    const content = `---
created_at: "2025-01-01T00:00:00Z"
---

This is the first line
This is the second line`;

    expect(extractPreview(content)).toBe('This is the first line');
  });

  it('should skip empty lines after frontmatter', () => {
    const content = `---
created_at: "2025-01-01T00:00:00Z"
---



This is the first line`;

    expect(extractPreview(content)).toBe('This is the first line');
  });

  it('should work with content without frontmatter', () => {
    const content = `This is the first line
This is the second line`;

    expect(extractPreview(content)).toBe('This is the first line');
  });

  it('should return "(empty)" for empty content', () => {
    expect(extractPreview('')).toBe('(empty)');
  });

  it('should return "(empty)" for content with only frontmatter', () => {
    const content = `---
created_at: "2025-01-01T00:00:00Z"
---

`;

    expect(extractPreview(content)).toBe('(empty)');
  });

  it('should return "(empty)" for content with only whitespace', () => {
    const content = `

    `;

    expect(extractPreview(content)).toBe('(empty)');
  });

  it('should handle CJK characters', () => {
    const content = `---
created_at: "2025-01-01T00:00:00Z"
---

今日はとても良い天気でした`;

    expect(extractPreview(content)).toBe('今日はとても良い天気でした');
  });

  it('should handle emoji', () => {
    const content = `---
created_at: "2025-01-01T00:00:00Z"
---

🎉 Today was a great day!`;

    expect(extractPreview(content)).toBe('🎉 Today was a great day!');
  });
});
