import fs from 'fs';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TokenStore } from '../../../src/lib/storage/token-store';

describe('TokenStore', () => {
  let store: TokenStore;
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(process.cwd(), 'test-temp-token');
    store = new TokenStore(testDir);
  });

  afterEach(() => {
    store.clear();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return null when no token exists', () => {
    const token = store.get();
    expect(token).toBeNull();
  });

  it('should save and get token', () => {
    store.save('my-secret-token');
    const token = store.get();
    expect(token).toBe('my-secret-token');
  });

  it('should check if token exists', () => {
    expect(store.exists()).toBe(false);
    store.save('token');
    expect(store.exists()).toBe(true);
  });

  it('should clear token', () => {
    store.save('token');
    store.clear();
    expect(store.get()).toBeNull();
    expect(store.exists()).toBe(false);
  });
});
