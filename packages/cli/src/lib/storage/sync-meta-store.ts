import path from 'path';

import { BaseStorage } from './base-storage.js';

export interface SyncMetadata {
  lastSyncHash: string;
}

/**
 * Map of date to sync metadata
 * Example: { "20260101": { lastSyncHash: "abc123..." } }
 */
export type SyncMetaMap = Record<string, SyncMetadata>;

export class SyncMetaStore extends BaseStorage {
  private metaPath: string;

  constructor(dataDir?: string) {
    super();
    const dir = dataDir ?? this.getDataDir();
    this.metaPath = path.join(dir, 'sync-meta.json');
  }

  load(): SyncMetaMap {
    const content = this.readFile(this.metaPath);
    if (!content) return {};

    try {
      return JSON.parse(content) as SyncMetaMap;
    } catch {
      return {};
    }
  }

  save(metadata: SyncMetaMap): void {
    const content = JSON.stringify(metadata, null, 2);
    this.writeFile(this.metaPath, content);
  }

  get(date: string): SyncMetadata | null {
    const allMetadata = this.load();
    return allMetadata[date];
  }

  update(date: string, hash: string): void {
    const allMetadata = this.load();
    allMetadata[date] = { lastSyncHash: hash };
    this.save(allMetadata);
  }
}
