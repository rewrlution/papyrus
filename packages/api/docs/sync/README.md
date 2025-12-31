# Journal Sync System Documentation

## Quick Links

1. **[Overview](./00-overview.md)** - Start here! Understand the design decisions, conflict resolution strategy, and system architecture
2. **[Schema Updates](./01-schema-updates.md)** - Database and TypeScript schema changes needed
3. **[Server Implementation](./02-server-implementation.md)** - Complete server-side code for service, controller, and routes
4. **[Conflict Resolution](./03-conflict-resolution.md)** - Deep dive into how conflicts are detected and resolved
5. **[Client Implementation](./04-client-implementation.md)** - Guide for implementing sync on client applications
6. **[Testing Strategy](./05-testing.md)** - How to test the sync system thoroughly

## What's New in This Design

This documentation represents a complete redesign of the sync system with these key improvements:

### ✨ Date-Based Identifiers

- **Before**: Used auto-generated IDs (CUIDs) for public API
- **After**: Use `date` (YYYYMMDD) as public identifier, keep internal ID for database
- **Why**: More intuitive, matches business logic (one journal per day), eliminates client-side ID mapping

### ✨ Auto-Merge Conflict Resolution

- **Before**: No conflict detection (data loss possible)
- **After**: Automatic conflict detection with append-based merging
- **Why**: Zero data loss, zero user interruption, transparent to user

### ✨ Comprehensive Conflict Handling

- Server detects conflicts via timestamp comparison
- Client receives both versions
- Client auto-merges by appending local version to server version
- Merged version pushed back to server
- User sees notification: "Auto-merged X conflicted journals"

### ✨ Soft Deletes for Sync

- **Before**: Hard deletes (can't sync deletions)
- **After**: Soft deletes with `deletedAt` timestamp
- **Why**: Deletions must propagate across devices

## Implementation Roadmap

### Phase 1: Schema Updates (1-2 hours)

1. Update Prisma schema
2. Create and run migration
3. Update TypeScript schemas
4. Verify compilation

**Files to modify**:

- `prisma/schema.prisma`
- `src/schemas/common.schema.ts`
- `src/schemas/journal.schema.ts`
- `src/schemas/sync.schema.ts` (new file)

**Documentation**: See [01-schema-updates.md](./01-schema-updates.md)

### Phase 2: Server Implementation (2-4 hours)

1. Update journal service with new methods
2. Update controller for date-based operations
3. Add sync endpoints to routes
4. Test with Postman/curl

**Files to modify**:

- `src/services/journal.service.ts`
- `src/controllers/journal.controller.ts`
- `src/routes/journal.routes.ts`

**Documentation**: See [02-server-implementation.md](./02-server-implementation.md)

### Phase 3: Testing (2-3 hours)

1. Write unit tests for sync methods
2. Write integration tests for sync flow
3. Manual testing with two devices/browsers
4. Performance testing with large datasets

**Documentation**: See [05-testing.md](./05-testing.md)

### Phase 4: Client Implementation (4-8 hours)

1. Implement local database schema
2. Implement pull/push sync functions
3. Implement conflict handling
4. Add sync scheduling and triggers
5. Add UI indicators for sync status

**Documentation**: See [04-client-implementation.md](./04-client-implementation.md)

## Key Concepts

### Conflict Timeline

The documentation includes detailed timeline examples showing exactly how conflicts occur:

```
t=0:  Both clients synced (updatedAt = x)
t=1:  Client A goes offline
t=2:  Client B edits and pushes (updatedAt = x+3)
t=3:  Client A edits offline (still thinks updatedAt = x)
t=4:  Client A comes online and pushes → CONFLICT!
```

See [03-conflict-resolution.md](./03-conflict-resolution.md) for full details.

### Auto-Merge Format

When conflicts occur, the merged content looks like:

```
[Server's version from Client B]

---
[Merged from MacBook Pro on 2025-12-06 11:30:00]
---

[Client A's version]
```

This preserves both versions, making it clear what happened.

## API Endpoints

### CRUD Operations (Regular Endpoints)

| Method   | Endpoint          | Description                                     |
| -------- | ----------------- | ----------------------------------------------- |
| `GET`    | `/journals`       | List all journals (paginated)                   |
| `GET`    | `/journals/:date` | Get single journal (e.g., `/journals/20251206`) |
| `POST`   | `/journals`       | Create new journal                              |
| `PUT`    | `/journals/:date` | Update journal                                  |
| `DELETE` | `/journals/:date` | Soft delete journal                             |

### Sync Operations (New Endpoints)

| Method | Endpoint                         | Description                                   |
| ------ | -------------------------------- | --------------------------------------------- |
| `GET`  | `/journals/sync?since=<ISO8601>` | Pull changes since timestamp                  |
| `POST` | `/journals/batch`                | Push batch of changes with conflict detection |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client A                            │
│  ┌────────────┐    ┌──────────────┐   ┌──────────────────┐ │
│  │ Local DB   │◄───┤ Sync Manager │◄──┤ UI / User Action │ │
│  │ (SQLite)   │    │              │   │                  │ │
│  └────────────┘    └──────┬───────┘   └──────────────────┘ │
└────────────────────────────┼──────────────────────────────┘
                             │
                             │ HTTP/S
                             │
┌────────────────────────────▼──────────────────────────────┐
│                      API Server                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Routes     │─►│  Controller  │─►│    Service     │  │
│  │ (Express)    │  │  (Handler)   │  │ (Business Logic)│ │
│  └──────────────┘  └──────────────┘  └────────┬───────┘  │
│                                                 │          │
│  ┌──────────────────────────────────────────────▼───────┐ │
│  │            PostgreSQL Database                       │ │
│  │  - journals table (encrypted, with timestamps)       │ │
│  │  - Indexes for efficient sync queries                │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
                             │
                             │ HTTP/S
                             │
┌────────────────────────────▼──────────────────────────────┐
│                         Client B                            │
│  ┌────────────┐    ┌──────────────┐   ┌──────────────────┐ │
│  │ Local DB   │◄───┤ Sync Manager │◄──┤ UI / User Action │ │
│  │ (IndexedDB)│    │              │   │                  │ │
│  └────────────┘    └──────────────┘   └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Security & Privacy

- ✅ All content encrypted end-to-end (AES-256-GCM)
- ✅ Authentication required for all sync operations
- ✅ User isolation enforced (can only sync own journals)
- ✅ TLS for data in transit
- ✅ Rate limiting on batch operations (max 100 journals)

## Performance Characteristics

- **Pull sync**: O(n) where n = journals modified since last sync
- **Push sync**: O(m) where m = local changes to push
- **Conflict detection**: O(1) per journal (simple timestamp comparison)
- **Database queries**: Indexed on `(userId, updatedAt)` for efficiency

**Expected performance**:

- 100 journals pull sync: < 1 second
- 100 journals push sync: < 2 seconds
- 1000 journals pull sync: < 3 seconds

## FAQ

### Q: What happens if user edits the same journal on 3+ devices?

**A**: All versions are preserved with multiple merge markers. Each device that conflicts will append its version to the existing merged content.

### Q: Can conflicts cause infinite loops?

**A**: No. Each conflict resolution uses the server's latest timestamp, so the next push will succeed (no conflict).

### Q: What if the app crashes mid-sync?

**A**: Sync is idempotent. Restarting the sync will continue from where it left off using the last sync timestamp.

### Q: How do I test sync locally?

**A**: Use two browser windows with different user accounts, or use Chrome DevTools to simulate offline mode.

### Q: What's the maximum journal size?

**A**: Currently limited to 100,000 characters per journal (enforced by schema validation).

### Q: How long are deleted journals kept?

**A**: Soft-deleted journals are kept indefinitely. You can add a cleanup job to hard-delete old soft-deleted journals after 30 days if needed.

## Support and Contributing

For questions or issues:

1. Check the documentation in this folder
2. Review the timeline examples in [03-conflict-resolution.md](./03-conflict-resolution.md)
3. Run the test scenarios in [05-testing.md](./05-testing.md)
4. Check server logs for conflict detection warnings

## Next Steps

1. **Start with the overview**: Read [00-overview.md](./00-overview.md) to understand the design
2. **Update schemas**: Follow [01-schema-updates.md](./01-schema-updates.md)
3. **Implement server**: Follow [02-server-implementation.md](./02-server-implementation.md)
4. **Test thoroughly**: Use [05-testing.md](./05-testing.md)
5. **Implement client**: Follow [04-client-implementation.md](./04-client-implementation.md)

Good luck! 🚀
