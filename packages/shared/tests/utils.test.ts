import { describe, it, expect } from 'vitest';
import { formatMessage } from '../src/utils/index.js';

describe('formatMessage', () => {
  it('should format message with prefix', () => {
    const result = formatMessage('Hello world!');
    expect(result).toBe('[MyApp] Hello world!');
  });
});
