# Sync

Syncing files to different devices is a very difficult problem.

I have already cut some of the requirements since they do not apply to the journaling app:

- no collaboration: a user usually edits one file at a time, and that journal is private to that user
- no real time updates

but still, I need to solve the following problems:

- client clock might be different from server clock
- conflict resolution logic is complicated
- distinguish between "missing files needed to be downloaded" and "this file is deleted locally, do not download it from the server again".

After doing some research, I have decided to:

- use "hash" to detect conflict, no "clock" is involved here
- conflict resolution: do not use "last-write-wins" logic, since data is precious, just merge them together by appending content
- do not support deleting journal yet - who cares, data is precious, you are the only owner of it, these are just work journals

well, adding support for deletion is not super crazy, but we do need an extra logic to store the "state" of the journal, so that we can tell the difference between a new journal or a deleted journal.

The very first implementation of the syncing logic is purely based on "last modified time", which has a flaw!

think about this scenario:

- at time T, you upload journal_1 to the server from device A
- at time T+3, you work from device B, and you download journal_1 from the server
- journal_1 now has the `last modified time` set to `T+3`
- when you run the sync logic again, the server thought it's a new piece of data, and client will upload the journal_1
- now journal_1 is at `T+3`, and when sync with device A again, it downloads the same copy.

this is annoying, not preserving the modified time, a waste of network bandwidth, and could potentially cause disasters!

The solution here is to simply use file hash.

## Data Structure

**Server returns (via API):**

```json
{
  "date": "20241210",
  "hash": "abc",
  "createdAt": "2024-12-10T10:00:00Z",
  "updatedAt": "2024-12-10T15:00:00Z"
}
```

**Client tracks locally (in sync-meta.json):**

```json
{
  "20241210": {
    "lastSyncedHash": "def"
  }
}
```

The key insight: `lastSyncedHash` is **per-device state**, stored only on the client. The server doesn't need to track which device last synced when - it just returns its current state.

## Sync Algorithm

```ts
// Client computes current hash from local file
const { hash: currentHash } = getJournalWithHash(date);

// Client reads what it stored after last successful sync
const syncMeta = getSyncMetadata(date);
const lastSyncedHash = syncMeta?.lastSyncedHash;

// Client fetches remote hash from server
const remote = await api.getJournal(date);
const remoteHash = remote.hash;

// Three-way comparison
const localChanged = currentHash !== lastSyncedHash;
const remoteChanged = remoteHash !== lastSyncedHash;

if (localChanged && remoteChanged) {
  // Conflict: both changed since last sync
  // Merge by appending both versions
} else if (localChanged) {
  // Only local file updated
  // Upload new content to the server
} else if (remoteChanged) {
  // Only server file updated
  // Download new content to the client
}
// else: no changes, skip

// After successful sync, update the baseline
updateSyncMetadata(date, newHash);
```

This is what I plan to implement.

## Why This Works

The `lastSyncedHash` acts as the "common ancestor" (like Git's three-way merge):

- **Base**: `lastSyncedHash` (what we agreed on last time)
- **Ours**: current file hash (local changes)
- **Theirs**: server hash (remote changes)

Each device independently tracks its own `lastSyncedHash`, enabling multi-device sync without server-side per-device state tracking.
