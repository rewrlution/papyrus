import { describe, it, expect } from 'vitest';
import { App } from '../src/index.js';

describe('CLI', () => {
  it('should export App component', () => {
    expect(App).toBeDefined();
  });
});
