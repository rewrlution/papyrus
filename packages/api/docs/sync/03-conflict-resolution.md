# Conflict Resolution - Detailed Guide

## Overview

This document provides detailed information about how conflict detection and resolution work in the sync system.

## What is a Conflict?

A conflict occurs when:

1. Multiple devices edit the same journal entry
2. They edit at different times while offline
3. They both try to push their changes to the server

## Conflict Detection Mechanism

### How Server Detects Conflicts

The server uses **timestamp comparison** to detect conflicts:

```typescript
// In batchUpsert service method
const existing = await prisma.journal.findUnique({
  where: { userId_date: { userId, date } },
});

if (existing && existing.updatedAt > clientUpdatedAt) {
  // CONFLICT! Server has newer version than client knows about
  // Client's changes are based on stale data
}
```

**Key insight**: `clientUpdatedAt` represents the server timestamp that the client last saw for this journal. If server's current `updatedAt` is newer, the client is working with outdated data.

## Conflict Scenario Walkthrough

### Timeline Example

```
t=0 (10:00 AM):
  - Client A syncs: journal 20251206 has updatedAt = 10:00 AM
  - Client B syncs: journal 20251206 has updatedAt = 10:00 AM
  - Both clients have the same version

t=1 (10:15 AM):
  - Client A goes offline (airplane mode, no network, etc.)

t=2 (10:30 AM):
  - User opens Client B
  - Edits journal 20251206: "Today I learned about Rust ownership..."
  - Client B pushes to server
  - Server updatedAt = 10:30 AM ✅

t=3 (11:00 AM):
  - User opens Client A (still offline)
  - Edits journal 20251206: "Today I fixed a React bug..."
  - Client A stores locally with clientUpdatedAt = 10:00 AM
    (because that's the last server timestamp it saw)

t=4 (11:30 AM):
  - Client A comes back online
  - Client A tries to push changes
  - Client A sends: { date: "20251206", content: "...", clientUpdatedAt: 10:00 AM }

t=5 (Server Processing):
  - Server checks: existing.updatedAt (10:30 AM) > clientUpdatedAt (10:00 AM)
  - CONFLICT DETECTED! ⚠️
  - Server responds with:
    {
      results: [{ date: "20251206", status: "conflict", serverUpdatedAt: 10:30 AM }],
      conflicts: [{
        date: "20251206",
        content: "Today I learned about Rust ownership...",
        updatedAt: 10:30 AM
      }]
    }
```

### Why This is Important

Without conflict detection:

- Client A's push would **overwrite** Client B's changes
- User would lose the "Rust ownership" content
- **Data loss!** ❌

With conflict detection:

- Server rejects the stale update
- Client A receives both versions
- Client A can merge them
- **No data loss!** ✅

## Auto-Merge Strategy

### Client-Side Auto-Merge Logic

When client receives a conflict response:

```typescript
async function handleBatchResponse(response: BatchJournalResponse) {
  const conflicts = response.conflicts;

  if (conflicts.length === 0) {
    // No conflicts, sync complete
    return;
  }

  // Auto-merge conflicts
  const mergedJournals = [];

  for (const conflict of conflicts) {
    const localVersion = getLocalJournal(conflict.date);

    // Append local version to server version
    const merged = `${conflict.content}

---
[Merged from ${deviceName} on ${new Date().toLocaleString()}]
---

${localVersion.content}`;

    // Save merged version locally
    saveLocalJournal(conflict.date, merged, conflict.updatedAt);

    // Prepare to push back to server
    mergedJournals.push({
      date: conflict.date,
      content: merged,
      clientUpdatedAt: conflict.updatedAt, // Use server's timestamp!
    });
  }

  // Push merged versions back to server
  if (mergedJournals.length > 0) {
    await pushToServer(mergedJournals);
    showNotification(
      `Auto-merged ${mergedJournals.length} conflicted journals`
    );
  }
}
```

### Merged Content Example

**Server version (from Client B):**

```
Today I learned about Rust ownership. The borrow checker prevents
data races at compile time, which is amazing!
```

**Client A's local version:**

```
Today I fixed a React bug. The issue was with useEffect dependencies
not being properly specified.
```

**Merged result:**

```
Today I learned about Rust ownership. The borrow checker prevents
data races at compile time, which is amazing!

---
[Merged from MacBook Pro on 2025-12-06 11:30:00]
---

Today I fixed a React bug. The issue was with useEffect dependencies
not being properly specified.
```

### Why Append Strategy Works for Journals

1. **Both versions preserved** - No data loss
2. **Chronologically makes sense** - Both events happened on the same day
3. **User can edit later** - Manual cleanup if needed
4. **Transparent** - User sees what happened with the merge marker
5. **Simple to implement** - Just string concatenation

## Edge Cases

### Case 1: Client Pushes Same Merged Version Twice

**Problem**: What if push fails and client retries?

**Solution**: Server sees `clientUpdatedAt` matches `serverUpdatedAt`, accepts update as normal (idempotent).

### Case 2: Three-Way Conflict

**Scenario**:

- Client A, B, C all have version at t=0
- Client A edits at t=1, pushes successfully
- Client B edits at t=2, conflicts with A's version
- Client C edits at t=3, conflicts with A's version

**What happens**:

1. Client B receives conflict, merges A's content with B's content, pushes merged version
2. Client C receives conflict, merges A's content with C's content, pushes
3. Client C's push **conflicts again** with B's merged version!
4. Client C merges again (now has A + B + C content)

**Result**: All three versions eventually appear in the journal (multiple merge markers).

### Case 3: Simultaneous Pushes

**Scenario**: Client A and Client B push at the exact same time with same `clientUpdatedAt`.

**What happens**:

- Database transactions ensure only one succeeds first
- The other gets a conflict response
- Second client merges and pushes again

**Result**: No data loss, one of them wins the race, the other merges.

### Case 4: Delete Conflicts - The "Data is Precious" Philosophy

**Scenario**:

- Client A deletes journal (pushes `content: null`)
- Client B edits journal (pushes new content)
- They conflict

**Server behavior**:

- Whichever arrives first wins
- If delete arrives first: journal is soft-deleted, edit gets conflict
- If edit arrives first: journal is updated, delete gets conflict

**Client behavior - ALWAYS RESTORE DATA**:

When a deletion conflicts with an edit, we **ALWAYS restore the server's version**:

- **Rationale**: Data is precious. User's journal content represents irreplaceable thoughts
- **Philosophy**: Creation > Deletion. An edit represents new content creation
- **Conservative**: Better to have duplicate content than lost content
- **Reversible**: User can always delete again if they want
- **Clear Intent**: If someone edited it, they clearly wanted to keep it

**Implementation**:

```typescript
// Server returns conflict
if (content === null && existing && existing.updatedAt > clientUpdatedAt) {
  // Server has newer version - preserve it!
  logger.warn('Conflict detected during delete - preserving server data', {
    date,
    userId,
  });
  conflicts.push({
    date: existing.date,
    content: decryptJournal(existing),
    updatedAt: existing.updatedAt,
    deletedAt: existing.deletedAt,
  });
  results.push({
    date,
    status: 'conflict',
    serverUpdatedAt: existing.updatedAt,
  });
}

// Client restores from conflict
if (result.status === 'conflict' && local.content === null) {
  // We tried to delete, but server has newer content
  const conflict = conflicts.find((c) => c.date === result.date);
  await localDB.upsert({
    date: conflict.date,
    content: conflict.content,
    updatedAt: conflict.updatedAt,
  });
  showNotification(
    `Journal "${conflict.date}" restored - it was edited on another device`
  );
}
```

**Edge Cases**:

- **Both delete**: No conflict, both deletions succeed
- **A deletes, B deletes, C edits**: Edit creates new version, A and B restore on sync
- **User really wants to delete**: They can delete again with newer timestamp

## Conflict Prevention Best Practices

### For Client Developers

1. **Sync frequently**: Call sync every time app comes to foreground
2. **Pull before push**: Always pull latest changes before pushing local changes
3. **Show sync status**: Indicate to user when last sync occurred
4. **Handle offline gracefully**: Queue changes locally, sync when online

### Typical Sync Flow (Recommended)

```typescript
async function syncJournals() {
  // 1. Pull latest from server
  const { journals, serverTimestamp } = await pullFromServer(lastSyncTime);

  // 2. Apply server changes to local database
  for (const journal of journals) {
    if (journal.deletedAt) {
      deleteLocalJournal(journal.date);
    } else {
      const local = getLocalJournal(journal.date);
      if (!local || local.updatedAt < journal.updatedAt) {
        // Server has newer version, use it
        saveLocalJournal(journal.date, journal.content, journal.updatedAt);
      }
    }
  }

  // 3. Find local changes not yet on server
  const localChanges = getLocalChanges(lastSyncTime);

  // 4. Push local changes
  if (localChanges.length > 0) {
    const { results, conflicts } = await pushToServer(localChanges);

    // 5. Handle conflicts
    if (conflicts.length > 0) {
      await handleConflicts(conflicts);
    }
  }

  // 6. Update last sync timestamp
  setLastSyncTime(serverTimestamp);
}
```

## Monitoring and Debugging

### Server-Side Logging

Conflicts are logged with:

```typescript
logger.warn('Conflict detected during update', {
  date,
  userId,
  serverUpdatedAt: existing.updatedAt,
  clientUpdatedAt: item.clientUpdatedAt,
  timeDiff: existing.updatedAt.getTime() - item.clientUpdatedAt.getTime(),
});
```

### Client-Side Logging

Clients should log:

- When conflicts are detected
- How conflicts are resolved
- Merge attempts and results

### Metrics to Track

- **Conflict rate**: How often conflicts occur
- **Merge success rate**: How many merges succeed without errors
- **Sync latency**: Time between last edit and successful sync
- **Offline duration**: How long clients stay offline (correlates with conflicts)

## Summary

- ✅ Conflicts detected by comparing `clientUpdatedAt` vs `serverUpdatedAt`
- ✅ Server returns both versions when conflict detected
- ✅ Client auto-merges by appending local version to server version
- ✅ Merged version pushed back to server with correct timestamp
- ✅ **Deletion conflicts always restore server data** - data is precious
- ✅ No data loss, transparent to user
- ✅ Works for multi-way conflicts (multiple merge markers)
- ✅ Idempotent and safe for retries
