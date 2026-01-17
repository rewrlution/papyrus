import { describe, it, expect } from 'vitest';

import { generateContentHash } from '../../../src/utils/index.js';

describe('generateContentHash', () => {
  it('should generate same hash for same content', () => {
    const text1 = 'my first journal';
    const text2 = 'my first journal';
    expect(generateContentHash(text1)).toBe(generateContentHash(text2));
  });

  it('should generate different hash for different content', () => {
    const text1 = 'my first journal';
    const text2 = 'my second journal';
    expect(generateContentHash(text1)).not.toBe(generateContentHash(text2));
  });
});
