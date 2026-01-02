import fs from 'fs';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ConfigStore } from '../../../src/lib/storage/config-store';

describe('ConfigStore', () => {
  let store: ConfigStore;
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(process.cwd(), 'test-temp-config');
    store = new ConfigStore(testDir);
  });

  afterEach(() => {
    store.clear();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return empty object when no config exists', () => {
    const config = store.load();
    expect(config).toEqual({});
  });

  it('should save and load config', () => {
    store.save({ apiUrl: 'https://api.example.com', editor: 'vim' });
    const config = store.load();
    expect(config.apiUrl).toBe('https://api.example.com');
    expect(config.editor).toBe('vim');
  });

  it('should get specific config value', () => {
    store.save({ apiUrl: 'https://api.example.com' });
    const value = store.get('apiUrl');
    expect(value).toBe('https://api.example.com');
  });

  it('should set specific config value', () => {
    store.set('editor', 'nano');
    const config = store.load();
    expect(config.editor).toBe('nano');
  });

  it('should update existing config', () => {
    store.save({ apiUrl: 'https://api.example.com' });
    store.update({ editor: 'vim' });
    const config = store.load();
    expect(config.apiUrl).toBe('https://api.example.com');
    expect(config.editor).toBe('vim');
  });

  it('should clear all config', () => {
    store.save({ apiUrl: 'https://api.example.com' });
    store.clear();
    const config = store.load();
    expect(config).toEqual({});
  });
});
