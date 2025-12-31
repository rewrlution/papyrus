# Journal Sync System - Overview

## Introduction

This document outlines the complete design and implementation of the journal synchronization system for Papyrus. The sync system enables users to work with journals across multiple devices while maintaining data consistency and handling conflicts gracefully.

## Key Design Decisions

### 1. Date-Based Public Identifier

**Decision**: Use `date` (YYYYMMDD format) as the public-facing identifier for journals, while keeping internal `id` (CUID) for database operations.

**Rationale**:

- **Natural key**: One journal per day matches the business model
- **Intuitive API**: Endpoints like `GET /journals/20251206` are self-documenting
- **Client predictability**: Clients know the identifier before server interaction
- **Better logging**: Internal ID provides stable reference for debugging
- **Flexibility**: Can evolve requirements without breaking API contract

**Trade-offs**:

- ✅ Simpler client logic (no ID mapping needed)
- ✅ Better UX (dates are meaningful to users)
- ✅ Safer database operations (immutable IDs for foreign keys)
- ⚠️ Slightly more complex schema (unique constraint on `userId + date`)

### 2. Conflict Resolution Strategy

**Problem Scenario**:

```
Timeline:
t=0:  Both Client A and Client B synced, journal 20251206 has updatedAt = x
t=1:  Client A goes offline
t=2:  User edits on Client B → pushes → server updatedAt = x+3
t=3:  User edits SAME journal on Client A (offline) → local updatedAt = x+5
t=4:  Client A comes online, tries to push → CONFLICT!
```

**Why This Happens**:
Client A is pushing changes based on stale data (version at `x`), but server already has a newer version (at `x+3`). Without conflict detection, Client B's changes would be lost.

**Strategies Evaluated**:

| Strategy                  | Pros                                                        | Cons                                                     | Verdict                           |
| ------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- | --------------------------------- |
| **Last-Write-Wins**       | Simple, no conflict detection needed                        | **Data loss** - earlier changes get overwritten silently | ❌ Unacceptable for journal data  |
| **Reject on Conflict**    | No data loss, user makes decision                           | Requires conflict UI, user interruption                  | ✅ Good but complex               |
| **Auto-Merge (Append)**   | No data loss, no user interruption, preserves both versions | Might create messy entries                               | ✅ **CHOSEN** - Best for journals |
| **Operational Transform** | Sophisticated auto-merge                                    | Extremely complex implementation                         | ❌ Overkill                       |

**Decision**: **Auto-Merge with Append Strategy**

When a conflict is detected:

1. Server returns both versions (server's and client's via conflict detection)
2. Client automatically appends local version to server version
3. Client pushes merged version back to server
4. User is notified: "Auto-merged conflicting changes for Dec 6"

**Merge Format**:

```
[Server's version content]

---
[Merged from Device Name on 2025-12-06 10:30:00]
---

[Client's local version content]
```

**Benefits**:

- ✅ **Zero data loss** - both versions preserved
- ✅ **Zero user interruption** - sync continues automatically
- ✅ **User can clean up later** - manual editing if needed
- ✅ **Simple implementation** - just string concatenation
- ✅ **Transparent** - user sees what happened

### 3. Sync Architecture

**Two-Endpoint Design**:

1. **Pull Sync**: `GET /journals/sync?since=<timestamp>`
   - Client fetches all changes since last sync
   - Returns journals created, updated, or deleted
   - Server returns current timestamp for next sync

2. **Push Sync**: `POST /journals/batch`
   - Client sends local changes in bulk
   - Server detects conflicts by comparing timestamps
   - Returns results and any conflicts found

**Sync Flow**:

```
┌─────────┐                               ┌─────────┐
│ Client  │                               │ Server  │
└────┬────┘                               └────┬────┘
     │                                         │
     │ 1. GET /sync?since=lastSyncTime        │
     │───────────────────────────────────────>│
     │                                         │
     │ 2. {journals: [...], serverTimestamp}  │
     │<───────────────────────────────────────│
     │                                         │
     │ 3. Reconcile local changes              │
     │    (merge any overlaps)                 │
     │                                         │
     │ 4. POST /batch {journals: [...]}       │
     │───────────────────────────────────────>│
     │                                         │
     │ 5. Detect conflicts, process changes    │
     │                                         │
     │ 6. {results: [...], conflicts: [...]}  │
     │<───────────────────────────────────────│
     │                                         │
     │ 7. If conflicts: auto-merge & push     │
     │    POST /batch {merged journals}       │
     │───────────────────────────────────────>│
     │                                         │
     │ 8. {results: [...]}                    │
     │<───────────────────────────────────────│
```

### 4. Soft Delete Strategy

**Decision**: Use soft deletes (set `deletedAt` timestamp) instead of hard deletes.

**Rationale**:

- Deleted journals must sync to other devices
- Hard delete would make sync impossible (no record to sync)
- Soft delete allows "this journal was deleted" to propagate

**Implementation**:

- Regular CRUD operations filter out `deletedAt IS NOT NULL`
- Sync endpoints include soft-deleted journals
- Client recognizes `deletedAt` and removes from local storage

## Data Model

### Database Schema

```prisma
model Journal {
  id          String    @id @default(cuid())
  date        String    // YYYYMMDD format (public identifier)
  ciphertext  String    // encrypted content
  iv          String    // initialization vector
  authTag     String    // authentication tag
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime? // soft delete timestamp

  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])      // one journal per day per user
  @@index([userId, date])       // for efficient lookups
  @@index([userId, updatedAt])  // for sync queries
  @@index([deletedAt])          // for filtering deleted records
}
```

**Key Points**:

- `id`: Internal CUID for database integrity and logging
- `date`: Public-facing business identifier (YYYYMMDD)
- `@@unique([userId, date])`: Enforces one-journal-per-day constraint
- `updatedAt`: Automatically managed by Prisma for conflict detection
- `deletedAt`: Null for active journals, timestamp for deleted ones

### API Schema

**Public Response (what clients see)**:

```typescript
{
  date: string; // "20251206"
  content: string; // decrypted content
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // Note: `id` is NOT exposed to clients
}
```

**Internal Operations (server-side)**:

- Use `id` for database queries, logging, and security checks
- Use `date` only for client-facing operations
- Lookup journals by `userId_date` unique constraint

## Implementation Overview

The implementation is divided into several parts:

1. **[Schema Updates](./01-schema-updates.md)** - Database and TypeScript schemas
2. **[Server-Side Implementation](./02-server-implementation.md)** - Service layer and endpoints
3. **[Conflict Resolution](./03-conflict-resolution.md)** - Detailed conflict handling logic
4. **[Client-Side Guide](./04-client-implementation.md)** - How to implement sync on client side
5. **[Testing Strategy](./05-testing.md)** - How to verify sync works correctly

## Security Considerations

1. **Access Control**: All sync operations require authentication
2. **User Isolation**: `userId` filter ensures users only sync their own journals
3. **Encryption**: Content remains encrypted at rest and in transit
4. **Rate Limiting**: Batch operations limited to 100 journals per request

## Performance Considerations

1. **Incremental Sync**: Only fetch changes since last sync (not full dataset)
2. **Indexed Queries**: `userId + updatedAt` index for efficient sync queries
3. **Batch Operations**: Reduce HTTP requests by bundling changes
4. **Soft Delete Filtering**: Index on `deletedAt` for fast filtering

## Migration Path

For existing deployments:

1. Add `date` field and populate from existing `title` field
2. Create unique constraint on `userId + date`
3. Update API endpoints to use `date` parameter
4. Deploy server changes
5. Update clients to use new sync endpoints
6. (Optional) Remove `title` field after migration complete

## Future Enhancements

Possible improvements for v2:

1. **Conflict UI**: Allow users to manually resolve conflicts instead of auto-merge
2. **Version History**: Keep multiple versions of journals for rollback
3. **Partial Sync**: Sync only specific date ranges
4. **Compression**: Compress encrypted content for large journals
5. **Delta Sync**: Send only changed parts instead of full content
