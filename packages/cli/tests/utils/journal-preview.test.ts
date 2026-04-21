import { describe, it, expect } from 'vitest';

import { extractPreview } from '../../src/utils/journal-preview.js';

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

  it('should skip markdown headings and return first prose line', () => {
    const content = `---
created_at: "2025-01-01T00:00:00Z"
---

## What I worked on

Fixed the auth bug in the login flow.`;

    expect(extractPreview(content)).toBe(
      'Fixed the auth bug in the login flow.'
    );
  });

  it('should skip multiple headings before prose', () => {
    const content = `---
created_at: "2025-01-01T00:00:00Z"
---

# Top-level heading

## Section heading

### Sub-section

Actual content here.`;

    expect(extractPreview(content)).toBe('Actual content here.');
  });

  it('should skip h1 through h6 headings', () => {
    for (let level = 1; level <= 6; level++) {
      const heading = '#'.repeat(level);
      const content = `${heading} Heading\n\nSome content.`;
      expect(extractPreview(content)).toBe('Some content.');
    }
  });

  it('should return "(empty)" when content is only headings', () => {
    const content = `---
created_at: "2025-01-01T00:00:00Z"
---

## What I worked on

## What I owned`;

    expect(extractPreview(content)).toBe('(empty)');
  });

  it('should return prose even when heading has no space after #', () => {
    const content = `#Heading without space\n\nProse content.`;
    expect(extractPreview(content)).toBe('Prose content.');
  });
});
