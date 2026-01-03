import fs from 'fs';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SyncMetaStore } from '../../../src/lib/storage/sync-meta-store';

describe('SyncMetaStore', () => {
  let store: SyncMetaStore;
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(process.cwd(), 'test-temp-sync-meta');
    store = new SyncMetaStore(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return empty object when metadata does not exist', () => {
    const metadata = store.load();
    expect(metadata).toEqual({});
  });

  it('should save and load metadata', () => {
    const metadata = {
      '20260101': { lastSyncHash: 'abc123' },
      '20260102': { lastSyncHash: 'def456' },
    };

    store.save(metadata);
    const loaded = store.load();

    expect(loaded).toEqual(metadata);
  });

  it('should get metadata for specific date', () => {
    store.update('20260101', 'abc123');

    const meta = store.get('20260101');
    expect(meta).toEqual({ lastSyncHash: 'abc123' });
  });

  it('should return undefined for non-existent date', () => {
    const meta = store.get('20991231');
    expect(meta).toBeUndefined();
  });

  it('should update metadata for specific date', () => {
    store.update('20260101', 'abc123');
    store.update('20260102', 'def456');

    const allMeta = store.load();
    expect(allMeta['20260101'].lastSyncHash).toBe('abc123');
    expect(allMeta['20260102'].lastSyncHash).toBe('def456');
  });

  it('should overwrite existing metadata when updating', () => {
    store.update('20260101', 'old-hash');
    store.update('20260101', 'new-hash');

    const meta = store.get('20260101');
    expect(meta?.lastSyncHash).toBe('new-hash');
  });

  it('should handle invalid JSON gracefully', () => {
    const metaPath = path.join(testDir, 'sync-meta.json');
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(metaPath, 'invalid json{', 'utf-8');

    const metadata = store.load();
    expect(metadata).toEqual({});
  });
});
