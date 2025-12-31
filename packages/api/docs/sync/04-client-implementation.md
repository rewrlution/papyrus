# Client-Side Implementation Guide

## Overview

This guide shows how to implement the sync system on the client side. It includes TypeScript examples, but the logic applies to any language/platform.

## Prerequisites

- Client has authentication (JWT token)
- Client has local storage (SQLite, IndexedDB, Core Data, etc.)
- Client can make HTTP requests
- Client can run background tasks/timers

## Data Model

### Local Database Schema

Your client-side database should store:

```typescript
interface LocalJournal {
  date: string; // YYYYMMDD - primary key
  content: string; // Decrypted content
  updatedAt: Date; // Server's last known timestamp for this journal
  locallyModified: boolean; // True if edited locally since last sync
  deletedLocally: boolean; // True if deleted locally (pending sync)
}

interface SyncState {
  lastSyncTime: Date; // Last successful sync timestamp
  isSyncing: boolean; // Currently syncing (prevent concurrent syncs)
  deviceId: string; // Unique device identifier (for merge markers)
}
```

## Core Sync Functions

### 1. Pull Sync (Download from Server)

```typescript
async function pullFromServer(since: Date): Promise<PullSyncResult> {
  const response = await fetch(
    `${API_BASE_URL}/journals/sync?since=${since.toISOString()}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Pull sync failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    journals: data.journals.map((j: any) => ({
      date: j.date,
      content: j.content,
      createdAt: new Date(j.createdAt),
      updatedAt: new Date(j.updatedAt),
      deletedAt: j.deletedAt ? new Date(j.deletedAt) : null,
    })),
    serverTimestamp: new Date(data.serverTimestamp),
  };
}

interface PullSyncResult {
  journals: {
    date: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }[];
  serverTimestamp: Date;
}
```

### 2. Push Sync (Upload to Server)

```typescript
async function pushToServer(journals: LocalJournal[]): Promise<PushSyncResult> {
  const payload = {
    journals: journals.map((j) => ({
      date: j.date,
      content: j.deletedLocally ? null : j.content,
      clientUpdatedAt: j.updatedAt.toISOString(),
    })),
  };

  const response = await fetch(`${API_BASE_URL}/journals/batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Push sync failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    results: data.results.map((r: any) => ({
      date: r.date,
      status: r.status,
      serverUpdatedAt: new Date(r.serverUpdatedAt),
    })),
    conflicts: data.conflicts.map((c: any) => ({
      date: c.date,
      content: c.content,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
    })),
    serverTimestamp: new Date(data.serverTimestamp),
  };
}

interface PushSyncResult {
  results: {
    date: string;
    status: 'created' | 'updated' | 'deleted' | 'conflict';
    serverUpdatedAt: Date;
  }[];
  conflicts: {
    date: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }[];
  serverTimestamp: Date;
}
```

### 3. Apply Server Changes Locally

```typescript
async function applyServerChanges(journals: PullSyncResult['journals']) {
  for (const journal of journals) {
    if (journal.deletedAt) {
      // Server deleted this journal
      await deleteLocalJournal(journal.date);
      continue;
    }

    const local = await getLocalJournal(journal.date);

    if (!local) {
      // New journal from server
      await saveLocalJournal({
        date: journal.date,
        content: journal.content,
        updatedAt: journal.updatedAt,
        locallyModified: false,
        deletedLocally: false,
      });
    } else if (local.locallyModified) {
      // Local has changes, don't overwrite
      // These will be pushed in next step
      continue;
    } else if (local.updatedAt < journal.updatedAt) {
      // Server has newer version
      await saveLocalJournal({
        date: journal.date,
        content: journal.content,
        updatedAt: journal.updatedAt,
        locallyModified: false,
        deletedLocally: false,
      });
    }
  }
}
```

### 4. Get Local Changes

```typescript
async function getLocalChanges(): Promise<LocalJournal[]> {
  // Query local database for journals with locallyModified = true
  return await db.journals.where('locallyModified').equals(true).toArray();
}
```

### 5. Handle Conflicts (Auto-Merge)

```typescript
async function handleConflicts(
  conflicts: PushSyncResult['conflicts']
): Promise<LocalJournal[]> {
  const mergedJournals: LocalJournal[] = [];

  for (const conflict of conflicts) {
    const local = await getLocalJournal(conflict.date);

    if (!local) {
      // Local was deleted, but server has content
      // Keep server version
      await saveLocalJournal({
        date: conflict.date,
        content: conflict.content,
        updatedAt: conflict.updatedAt,
        locallyModified: false,
        deletedLocally: false,
      });
      continue;
    }

    // Check if this is a deletion conflict
    if (local.deletedLocally) {
      // We tried to delete, but server has newer content
      // ALWAYS restore server's version (data is precious!)
      await saveLocalJournal({
        date: conflict.date,
        content: conflict.content,
        updatedAt: conflict.updatedAt,
        locallyModified: false,
        deletedLocally: false,
      });

      // Notify user about restoration
      showNotification(
        `Journal "${conflict.date}" restored - it was edited on another device`
      );
      continue;
    }

    // Auto-merge: append local version to server version
    const deviceName = await getDeviceName(); // e.g., "iPhone 15 Pro"
    const timestamp = new Date().toLocaleString();

    const merged = `${conflict.content}

---
[Merged from ${deviceName} on ${timestamp}]
---

${local.content}`;

    // Save merged version locally
    await saveLocalJournal({
      date: conflict.date,
      content: merged,
      updatedAt: conflict.updatedAt, // Use server's timestamp
      locallyModified: true, // Need to push this merged version
      deletedLocally: false,
    });

    mergedJournals.push({
      date: conflict.date,
      content: merged,
      updatedAt: conflict.updatedAt,
      locallyModified: true,
      deletedLocally: false,
    });
  }

  return mergedJournals;
}
```

### 6. Main Sync Function

```typescript
async function syncJournals(): Promise<SyncResult> {
  // Prevent concurrent syncs
  const syncState = await getSyncState();
  if (syncState.isSyncing) {
    console.log('Sync already in progress, skipping');
    return { success: false, message: 'Sync already in progress' };
  }

  try {
    await setSyncState({ isSyncing: true });

    // 1. Pull changes from server
    console.log('Pulling changes from server...');
    const pullResult = await pullFromServer(syncState.lastSyncTime);
    console.log(`Received ${pullResult.journals.length} journals from server`);

    // 2. Apply server changes to local database
    console.log('Applying server changes...');
    await applyServerChanges(pullResult.journals);

    // 3. Get local changes to push
    console.log('Getting local changes...');
    const localChanges = await getLocalChanges();
    console.log(`Found ${localChanges.length} local changes to push`);

    // 4. Push local changes to server
    if (localChanges.length > 0) {
      console.log('Pushing local changes...');
      const pushResult = await pushToServer(localChanges);

      // 5. Handle conflicts
      if (pushResult.conflicts.length > 0) {
        console.log(
          `Detected ${pushResult.conflicts.length} conflicts, auto-merging...`
        );
        const mergedJournals = await handleConflicts(pushResult.conflicts);

        // 6. Push merged versions back to server
        if (mergedJournals.length > 0) {
          console.log('Pushing merged journals...');
          await pushToServer(mergedJournals);
        }

        showNotification(
          `Synced successfully. Auto-merged ${pushResult.conflicts.length} conflicted journals.`
        );
      } else {
        showNotification('Sync completed successfully');
      }

      // 7. Mark local changes as synced
      for (const result of pushResult.results) {
        if (result.status !== 'conflict') {
          await markAsSynced(result.date, result.serverUpdatedAt);
        }
      }
    }

    // 8. Update last sync time
    await setSyncState({
      lastSyncTime: pullResult.serverTimestamp,
      isSyncing: false,
    });

    console.log('Sync completed successfully');
    return { success: true, message: 'Sync completed' };
  } catch (error) {
    console.error('Sync failed:', error);
    await setSyncState({ isSyncing: false });
    showNotification('Sync failed. Will retry later.');
    return { success: false, message: error.message };
  }
}

interface SyncResult {
  success: boolean;
  message: string;
}
```

## Helper Functions

### Mark Journal as Synced

```typescript
async function markAsSynced(date: string, serverUpdatedAt: Date) {
  await db.journals.update(date, {
    updatedAt: serverUpdatedAt,
    locallyModified: false,
    deletedLocally: false,
  });
}
```

### Mark Journal as Locally Modified

```typescript
async function markAsLocallyModified(date: string) {
  await db.journals.update(date, {
    locallyModified: true,
  });
}
```

### Create or Update Journal (User Action)

```typescript
async function createOrUpdateJournal(date: string, content: string) {
  const existing = await getLocalJournal(date);

  if (existing) {
    // Update existing
    await db.journals.update(date, {
      content,
      locallyModified: true,
    });
  } else {
    // Create new
    await db.journals.add({
      date,
      content,
      updatedAt: new Date(), // Temporary local timestamp
      locallyModified: true,
      deletedLocally: false,
    });
  }

  // Trigger sync (debounced)
  scheduleSyncSoon();
}
```

### Delete Journal (User Action)

```typescript
async function deleteJournal(date: string) {
  const existing = await getLocalJournal(date);

  if (!existing) {
    return; // Nothing to delete
  }

  if (existing.updatedAt.getTime() === 0) {
    // Never synced, just delete locally
    await db.journals.delete(date);
  } else {
    // Mark as deleted for sync
    await db.journals.update(date, {
      deletedLocally: true,
      locallyModified: true,
    });
  }

  // Trigger sync (debounced)
  scheduleSyncSoon();
}
```

## Sync Scheduling

### Automatic Sync Triggers

```typescript
// 1. When app comes to foreground
app.on('resume', () => {
  syncJournals();
});

// 2. Periodic background sync (every 15 minutes)
setInterval(
  () => {
    if (isOnline() && !isInBackground()) {
      syncJournals();
    }
  },
  15 * 60 * 1000
);

// 3. After user makes changes (debounced)
let syncTimeout: NodeJS.Timeout | null = null;

function scheduleSyncSoon() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    syncJournals();
    syncTimeout = null;
  }, 5000); // Wait 5 seconds after last change
}

// 4. When network connectivity restored
network.on('online', () => {
  syncJournals();
});
```

## User Interface Elements

### Sync Status Indicator

```typescript
function updateSyncStatusUI() {
  const syncState = getSyncState();
  const statusElement = document.getElementById('sync-status');

  if (syncState.isSyncing) {
    statusElement.textContent = 'Syncing...';
    statusElement.className = 'syncing';
  } else {
    const lastSync = syncState.lastSyncTime;
    const ago = formatTimeAgo(lastSync);
    statusElement.textContent = `Last synced ${ago}`;
    statusElement.className = 'synced';
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
```

### Offline Indicator

```typescript
function updateOnlineStatusUI() {
  const indicator = document.getElementById('online-status');

  if (navigator.onLine) {
    indicator.style.display = 'none';
  } else {
    indicator.textContent = 'Offline - Changes will sync when online';
    indicator.className = 'offline-banner';
    indicator.style.display = 'block';
  }
}

window.addEventListener('online', updateOnlineStatusUI);
window.addEventListener('offline', updateOnlineStatusUI);
```

## Error Handling

### Network Errors

```typescript
async function syncWithRetry(maxRetries = 3): Promise<SyncResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await syncJournals();
    } catch (error) {
      lastError = error;
      console.error(`Sync attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
```

### Authentication Errors

```typescript
async function syncJournals(): Promise<SyncResult> {
  try {
    // ... sync logic
  } catch (error) {
    if (error.status === 401) {
      // Token expired, refresh and retry
      await refreshAuthToken();
      return syncJournals();
    }
    throw error;
  }
}
```

## Testing

### Manual Testing Checklist

1. ✅ Create journal on Device A, sync, verify appears on Device B
2. ✅ Edit journal on Device A, sync, verify updated on Device B
3. ✅ Delete journal on Device A, sync, verify deleted on Device B
4. ✅ Edit same journal on both devices offline, sync both, verify merge
5. ✅ Create journal offline, sync when online, verify created on server
6. ✅ Force kill app mid-sync, restart, verify sync recovers

### Unit Testing

```typescript
describe('Sync System', () => {
  it('should merge conflicts correctly', async () => {
    const serverVersion = 'Server content';
    const localVersion = 'Local content';

    const merged = await handleConflicts([
      {
        date: '20251206',
        content: serverVersion,
        updatedAt: new Date(),
      },
    ]);

    expect(merged[0].content).toContain(serverVersion);
    expect(merged[0].content).toContain(localVersion);
    expect(merged[0].content).toContain('[Merged from');
  });
});
```

## Summary

Key client-side responsibilities:

- ✅ Pull changes from server periodically
- ✅ Push local changes to server
- ✅ Auto-merge conflicts by appending
- ✅ Handle offline gracefully
- ✅ Show sync status to user
- ✅ Retry on network errors
- ✅ Keep track of last sync timestamp
