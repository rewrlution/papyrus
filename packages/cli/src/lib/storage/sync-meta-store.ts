import path from 'path';

import { BaseStorage } from './base-storage.js';

export interface SyncMetadata {
  lastSyncHash: string;
}

/**
 * Map of date to sync metadata
 */
export type SyncMetaEntries = Record<string, SyncMetadata>;

/**
 * Sync metadata storage structure
 * Example: {
 *   "lastSync": "2026-01-04T10:30:00.000Z",
 *   "entries": {
 *     "20260101": { lastSyncHash: "abc123..." }
 *   }
 * }
 */
export interface SyncMetaStoreData {
  lastSync?: string;
  entries: SyncMetaEntries;
}

export class SyncMetaStore extends BaseStorage {
  private metaPath: string;

  constructor(dataDir?: string) {
    super();
    const dir = dataDir ?? this.getDataDir();
    this.metaPath = path.join(dir, 'sync-meta.json');
  }

  load(): SyncMetaStoreData {
    const content = this.readFile(this.metaPath);
    if (!content) return { entries: {} };

    try {
      return JSON.parse(content) as SyncMetaStoreData;
    } catch {
      return { entries: {} };
    }
  }

  save(data: SyncMetaStoreData): void {
    const content = JSON.stringify(data, null, 2);
    this.writeFile(this.metaPath, content);
  }

  get(date: string): SyncMetadata | null {
    const data = this.load();
    return data.entries[date] ?? null;
  }

  update(date: string, hash: string): void {
    const data = this.load();
    data.entries[date] = { lastSyncHash: hash };
    this.save(data);
  }

  /**
   * Update the last sync timestamp to now
   */
  updateLastSync(): void {
    const data = this.load();
    data.lastSync = new Date().toISOString();
    this.save(data);
  }

  /**
   * Get the last sync timestamp
   */
  getLastSync(): string | null {
    const data = this.load();
    return data.lastSync ?? null;
  }
}
