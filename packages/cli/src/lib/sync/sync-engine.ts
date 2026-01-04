import { generateContentHash } from '@rewrlution/papyrus-shared';

import { api } from '../api/index.js';
import { journalStore, syncMetaStore } from '../storage/index.js';

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  conflicts: number;
}

/**
 * Perform three-way sync between local and remote journals
 * Uses hash-based conflict detection
 *
 * @param onProgress - Progress callback options
 * @returns Sync statistics
 */
export async function performSync(
  onProgress?: (message: string) => void
): Promise<SyncResult> {
  const result: SyncResult = {
    uploaded: 0,
    downloaded: 0,
    conflicts: 0,
  };

  // Get all local journals
  const localJournals = journalStore.list();
  const localByDate = new Map(localJournals.map((j) => [j.date, j]));

  // Get remote journal metadata (includes hashes)
  const remoteJournals = await api.listJournalsMetadata();
  const remoteByDate = new Map(remoteJournals.map((j) => [j.date, j]));

  // Process union of all dates
  const allDates = new Set([...localByDate.keys(), ...remoteByDate.keys()]);

  onProgress?.(`Syncing ${allDates.size} journal(s)...`);

  for (const date of allDates) {
    const local = localByDate.get(date);
    const remote = remoteByDate.get(date);
    const syncMeta = syncMetaStore.get(date);

    // Case 1: Only exists remotely → Download
    if (!local && remote) {
      onProgress?.(`↓ Downloading ${date}.md`);

      const entry = await api.getJournal(date);
      journalStore.create(date, entry.content);
      syncMetaStore.update(date, entry.hash);
      result.downloaded++;
      continue;
    }

    // Case 2: Only exists locally → Upload
    if (local && !remote) {
      onProgress?.(`↑ Uploading ${date}.md`);

      const content = journalStore.load(date);
      if (content) {
        const created = await api.createJournal(date, content);
        syncMetaStore.update(date, created.hash);
        result.uploaded++;
      }
      continue;
    }

    // Case 3: Exists on both → Three-way comparison
    if (local && remote) {
      const localContent = journalStore.load(date);
      if (!localContent) continue; // Shouldn't happen, but guard against it

      const currentHash = generateContentHash(localContent);
      const remoteHash = remote.hash;
      const lastSyncedHash = syncMeta?.lastSyncHash;

      const localChanged = currentHash !== lastSyncedHash;
      const remoteChanged = remoteHash !== lastSyncedHash;

      // Both changed → Conflict
      if (localChanged && remoteChanged) {
        onProgress?.(`⚠️  Conflict in ${date}.md - merging`);

        const { content: remoteContent } = await api.getJournal(date);

        // Merge Strategy: append both versions
        const merged = `${localContent}\n\n<!-- MERGED FROM SERVER -->\n\n${remoteContent}`;

        journalStore.create(date, merged);
        const updated = await api.updateJournal(date, merged);
        syncMetaStore.update(date, updated.hash);
        result.conflicts++;
        continue;
      }

      // Only local changed → Upload
      if (localChanged) {
        onProgress?.(`↑ Uploading changes to ${date}.md`);

        const updated = await api.updateJournal(date, localContent);
        syncMetaStore.update(date, updated.hash);
        result.uploaded++;
        continue;
      }

      // Only remote changed → Download
      if (remoteChanged) {
        onProgress?.(`↓ Downloading changes to ${date}.md`);

        const remoteEntry = await api.getJournal(date);
        journalStore.create(date, remoteEntry.content);
        syncMetaStore.update(date, remoteHash);
        result.downloaded++;
        continue;
      }

      // No changes → Skip
    }
  }

  // Update last sync timestamp
  syncMetaStore.updateLastSync();

  return result;
}
