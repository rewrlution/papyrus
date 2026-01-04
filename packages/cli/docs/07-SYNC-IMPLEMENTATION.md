# Implementing Journal Sync Command

A complete guide to building hash-based journal synchronization with conflict detection and resolution.

## What We're Building

A sync command that:

1. Compares local and remote journals using hash-based three-way comparison
2. Uploads local changes to the server
3. Downloads remote changes from the server
4. Detects and resolves conflicts by merging content
5. Tracks sync state per-device without server-side coordination
6. Provides clear progress feedback during sync operations

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Sync Command                             │
│  Entry point - validates auth, displays progress             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                     Sync Logic                                │
│  Three-way comparison using hashes                           │
│  - localHash:  computed from local file                      │
│  - remoteHash: from server API                               │
│  - baseHash:   lastSyncedHash (stored locally)               │
└─────────┬────────────────────────────┬───────────────────────┘
          │                            │
          ↓                            ↓
┌─────────────────────┐     ┌──────────────────────┐
│   JournalStore      │     │     ApiClient        │
│   - list()          │     │     - listJournals() │
│   - load()          │     │     - getJournal()   │
│   - create()        │     │     - createJournal()│
└─────────────────────┘     │     - updateJournal()│
                            └──────────────────────┘
          │
          ↓
┌─────────────────────┐
│  SyncMetaStore      │
│  - get(date)        │
│  - update(date, hash)│
└─────────────────────┘
```

## Understanding the Sync Algorithm

### The Problem

Syncing across multiple devices is challenging because:

- **Clock drift** - Client and server clocks may differ
- **Conflict detection** - Both local and remote can change between syncs
- **Deleted files** - Distinguishing between "not yet synced" and "deleted locally"

### The Solution: Hash-Based Three-Way Comparison

Instead of relying on timestamps, we use **content hashes** (SHA-256):

**Three reference points:**

1. **Base hash** (`lastSyncedHash`) - What we agreed on during last sync
2. **Local hash** (`currentHash`) - Current state of local file
3. **Remote hash** (`remoteHash`) - Current state on server

**Comparison logic:**

```
localChanged = currentHash !== lastSyncedHash
remoteChanged = remoteHash !== lastSyncedHash

if (localChanged && remoteChanged):
    → CONFLICT (both changed since last sync)
    → Merge by appending both versions

else if (localChanged):
    → Only local changed
    → Upload to server

else if (remoteChanged):
    → Only remote changed
    → Download from server

else:
    → No changes
    → Skip
```

**After successful sync:** Update `lastSyncedHash` to the new hash (establishing new baseline).

**Key insight:** Each device independently tracks its own `lastSyncedHash`. The server doesn't need per-device sync state - it just returns its current hash.

### Why This Works

Example scenario:

1. **Device A** (T=0): Edit journal_1 → hash="abc" → Upload
   - Server now has: hash="abc"
   - Device A stores: lastSyncedHash="abc"

2. **Device B** (T=1): Run sync
   - Local: doesn't exist (hash=null, lastSyncedHash=null)
   - Remote: hash="abc"
   - Result: remoteChanged → Download
   - Device B stores: lastSyncedHash="abc"

3. **Device B** (T=2): Edit journal_1 → hash="def"
   - Local: hash="def", lastSyncedHash="abc"
   - Result: localChanged → Upload
   - Server now has: hash="def"
   - Device B stores: lastSyncedHash="def"

4. **Device A** (T=3): Run sync
   - Local: hash="abc", lastSyncedHash="abc"
   - Remote: hash="def"
   - Result: remoteChanged → Download (no false conflict!)
   - Device A stores: lastSyncedHash="def"

**No false conflicts** because each device tracks what _it_ agreed on, not global state.

## Prerequisites

**Packages already installed:**

- `axios` (for HTTP requests)
- `crypto` (Node.js built-in, for hashing)

**Completed tutorials:**

- [01-STORAGE-LAYER.md](./01-STORAGE-LAYER.md) - Storage foundation
- [02-API-CLIENT-SETUP.md](./02-API-CLIENT-SETUP.md) - API client setup

**Assumed knowledge:**

- Basic understanding of hashing
- Async/await in TypeScript
- HTTP API patterns

## Implementation

### Step 1: Add Hash Utility

Create a utility to compute SHA-256 hashes from content:

```typescript
// src/utils/hash.ts
import crypto from 'crypto';

/**
 * Compute SHA-256 hash of content
 * Used for detecting changes in journal entries
 *
 * @param content - Journal content to hash
 * @returns Hexadecimal hash string
 */
export function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}

/**
 * Get journal content with its computed hash
 *
 * @param content - Journal content
 * @returns Object with content and hash
 */
export function getContentWithHash(content: string): {
  content: string;
  hash: string;
} {
  return {
    content,
    hash: computeHash(content),
  };
}
```

**Why SHA-256?**

- Cryptographically secure (no collisions in practice)
- Fast to compute
- Standard 64-character hex output
- Built into Node.js

### Step 2: Extend API Client with Journal Methods

Add journal-related API methods to the existing ApiClient:

```typescript
// src/lib/api/api-client.ts
import axios, { AxiosInstance } from 'axios';
import type {
  SigninInput,
  SigninResponse,
  SignupInput,
  SignupResponse,
  JournalData,
  JournalMetaData,
} from '@rewrlution/papyrus-shared';
import { tokenStore } from '../storage/index.js';

export class ApiClient {
  // ... existing constructor and auth methods ...

  /**
   * List all journal metadata (without content)
   * Returns array of metadata with hashes
   */
  async listJournals(): Promise<JournalMetaData[]> {
    try {
      const response = await this.http.get<{ data: JournalMetaData[] }>(
        '/journals'
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get full journal entry with content
   *
   * @param date - Date in YYYYMMDD format
   */
  async getJournal(date: string): Promise<JournalData> {
    try {
      const response = await this.http.get<{ data: JournalData }>(
        `/journals/${date}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create new journal entry
   *
   * @param date - Date in YYYYMMDD format
   * @param content - Journal content
   * @returns Created entry with hash
   */
  async createJournal(date: string, content: string): Promise<JournalData> {
    try {
      const response = await this.http.post<{ data: JournalData }>(
        `/journals`,
        {
          date,
          content,
        }
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update existing journal entry
   *
   * @param date - Date in YYYYMMDD format
   * @param content - Updated content
   * @returns Updated entry with new hash
   */
  async updateJournal(date: string, content: string): Promise<JournalData> {
    try {
      const response = await this.http.put<{ data: JournalData }>(
        `/journals/${date}`,
        {
          content,
        }
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ... existing handleError method ...
}
```

**Key points:**

- All methods use shared types from `@rewrlution/papyrus-shared`
- Token automatically added by interceptor (already configured)
- Error handling unified through `handleError()`
- Returns unwrapped `data` field for cleaner usage

### Step 3: Implement Sync Logic

Create the core sync function with three-way comparison:

```typescript
// src/lib/sync/sync-engine.ts
import { JournalStore } from '../storage/journal-storage.js';
import { SyncMetaStore } from '../storage/sync-meta-store.js';
import { ApiClient } from '../api/api-client.js';
import { computeHash } from '../../utils/hash.js';

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  skipped: number;
}

export interface SyncProgress {
  onProgress?: (message: string) => void;
}

/**
 * Perform three-way sync between local and remote journals
 * Uses hash-based conflict detection
 *
 * @param apiClient - API client instance
 * @param options - Progress callback options
 * @returns Sync statistics
 */
export async function performSync(
  apiClient: ApiClient,
  options: SyncProgress = {}
): Promise<SyncResult> {
  const { onProgress } = options;

  const journalStore = new JournalStore();
  const syncMetaStore = new SyncMetaStore();

  const result: SyncResult = {
    uploaded: 0,
    downloaded: 0,
    conflicts: 0,
    skipped: 0,
  };

  // Get all local journals
  const localJournals = journalStore.list();
  const localByDate = new Map(localJournals.map((j) => [j.date, j]));

  // Get all remote journal metadata
  onProgress?.('📡 Fetching remote journals...');
  const remoteJournals = await apiClient.listJournals();
  const remoteByDate = new Map(remoteJournals.map((j) => [j.date, j]));

  // Process union of all dates
  const allDates = new Set([...localByDate.keys(), ...remoteByDate.keys()]);

  onProgress?.(`🔄 Syncing ${allDates.size} journal(s)...`);

  for (const date of allDates) {
    const local = localByDate.get(date);
    const remote = remoteByDate.get(date);
    const syncMeta = syncMetaStore.get(date);

    // Case 1: Only exists remotely → Download
    if (!local && remote) {
      onProgress?.(`↓ Downloading ${date}.md`);

      const entry = await apiClient.getJournal(date);
      journalStore.create(date, entry.content);
      syncMetaStore.update(date, remote.hash);
      result.downloaded++;
      continue;
    }

    // Case 2: Only exists locally → Upload
    if (local && !remote) {
      onProgress?.(`↑ Uploading ${date}.md`);

      const content = journalStore.load(date);
      if (content) {
        const created = await apiClient.createJournal(date, content);
        syncMetaStore.update(date, created.hash);
        result.uploaded++;
      }
      continue;
    }

    // Case 3: Exists on both → Three-way comparison
    if (local && remote) {
      const content = journalStore.load(date);
      if (!content) continue; // Shouldn't happen, but guard against it

      const currentHash = computeHash(content);
      const lastSyncedHash = syncMeta?.lastSyncHash ?? null;
      const remoteHash = remote.hash;

      const localChanged = currentHash !== lastSyncedHash;
      const remoteChanged = remoteHash !== lastSyncedHash;

      // Both changed → Conflict
      if (localChanged && remoteChanged) {
        onProgress?.(`⚠️  Conflict in ${date}.md - merging`);

        const remoteEntry = await apiClient.getJournal(date);

        // Merge strategy: append both versions
        const merged = `${content}\n\n<!-- MERGED FROM SERVER -->\n\n${remoteEntry.content}`;

        journalStore.create(date, merged);
        const updated = await apiClient.updateJournal(date, merged);
        syncMetaStore.update(date, updated.hash);
        result.conflicts++;
        continue;
      }

      // Only local changed → Upload
      if (localChanged) {
        onProgress?.(`↑ Uploading changes to ${date}.md`);

        const updated = await apiClient.updateJournal(date, content);
        syncMetaStore.update(date, updated.hash);
        result.uploaded++;
        continue;
      }

      // Only remote changed → Download
      if (remoteChanged) {
        onProgress?.(`↓ Downloading changes to ${date}.md`);

        const remoteEntry = await apiClient.getJournal(date);
        journalStore.create(date, remoteEntry.content);
        syncMetaStore.update(date, remoteHash);
        result.downloaded++;
        continue;
      }

      // No changes → Skip
      result.skipped++;
    }
  }

  return result;
}
```

**Key features:**

- **Three-way comparison** using hashes
- **Progress callbacks** for UI updates
- **Conflict resolution** by merging (data is precious)
- **Sync metadata update** after each operation
- **Error propagation** (let caller handle errors)

**Conflict resolution strategy:**

We merge conflicts by appending both versions:

```
[Local content]

<!-- MERGED FROM SERVER -->

[Remote content]
```

This is safe for journal entries because:

- Data is never lost (both versions preserved)
- User can manually resolve later
- No complex merge algorithms needed
- Journals are private (no collaboration conflicts)

### Step 4: Create Sync Command

Create a simple command that calls the sync engine:

```typescript
// src/commands/sync.ts
import { ApiClient } from '../lib/api/api-client.js';
import { tokenStore } from '../lib/storage/index.js';
import { performSync } from '../lib/sync/sync-engine.js';

const API_BASE_URL = process.env.PAPYRUS_API_URL || 'https://api.papyrus.dev';

export async function sync(): Promise<void> {
  try {
    // Check authentication
    if (!tokenStore.exists()) {
      console.error('\n❌ Error: Not authenticated.');
      console.error('💡 Run "papyrus login" first.\n');
      process.exit(1);
    }

    const apiClient = new ApiClient(API_BASE_URL);

    console.log('\n🔄 Starting sync...\n');

    // Perform sync with progress updates
    const result = await performSync(apiClient, {
      onProgress: (message) => {
        console.log(message);
      },
    });

    // Display results
    console.log('\n✅ Sync complete!\n');
    console.log(`   ↑ Uploaded:   ${result.uploaded}`);
    console.log(`   ↓ Downloaded: ${result.downloaded}`);
    console.log(`   ⚠️  Conflicts:  ${result.conflicts}`);
    console.log(`   ⏭  Skipped:    ${result.skipped}\n`);
  } catch (error: any) {
    console.error(`\n❌ Sync failed: ${error.message}\n`);
    process.exit(1);
  }
}
```

**Why this design?**

- **Simple entry point** - Just auth check + call sync engine
- **Clear feedback** - Progress messages during sync
- **Summary at end** - Shows what happened
- **Sync logic decoupled** - `sync-engine.ts` can be tested independently

### Step 5: Register Command

Register the sync command in your CLI:

```typescript
// src/cli.ts (or wherever you register commands)
import { Command } from 'commander';
import { add } from './commands/add.js';
import { amend } from './commands/amend.js';
import { show } from './commands/show.js';
import { sync } from './commands/sync.js';

const program = new Command();

program
  .name('papyrus')
  .description('AI-powered developer journaling')
  .version('1.0.0');

// ... other commands ...

// Sync command
program
  .command('sync')
  .description('Sync journals with server')
  .action(async () => {
    await sync();
  });

program.parse(process.argv);
```

## Testing

### Manual Testing

1. **Create local journal:**

   ```bash
   papyrus add -d 20260101
   # Write some content, save
   ```

2. **Sync to server:**

   ```bash
   papyrus sync
   # Should show: ↑ Uploaded: 1
   ```

3. **Edit on server** (via web app or another device):
   - Change the content remotely

4. **Sync again:**

   ```bash
   papyrus sync
   # Should show: ↓ Downloaded: 1
   ```

5. **Test conflict:**
   - Edit locally (don't sync)
   - Edit remotely
   - Run `papyrus sync`
   - Should merge both versions

### Testing Sync Logic

```typescript
// tests/sync-engine.test.ts
import { describe, it, expect, vi } from 'vitest';
import { performSync } from '../src/lib/sync/sync-engine.js';

describe('performSync', () => {
  it('should upload local-only journals', async () => {
    // Mock API client with no remote journals
    const mockApi = {
      listJournals: vi.fn().mockResolvedValue([]),
      createJournal: vi
        .fn()
        .mockResolvedValue({ hash: 'abc123', date: '20260101' }),
    };

    // Mock storage with one local journal
    // ... setup mocks ...

    const result = await performSync(mockApi as any);

    expect(result.uploaded).toBe(1);
    expect(result.downloaded).toBe(0);
  });

  it('should detect conflicts and merge', async () => {
    // Mock changed local and remote
    // ... test conflict resolution ...
  });
});
```

## Common Issues

### Issue: "Not authenticated" error

**Solution:** Run `papyrus login` first to get a token.

**Why it happens:** Sync requires authentication to access the API.

### Issue: False conflicts every sync

**Problem:** `lastSyncedHash` not being updated properly.

**Solution:** Check that `syncMetaStore.update()` is called after every operation.

**Debug:**

```bash
cat ~/.local/share/papyrus/sync-meta.json
```

Should show hash for each synced date.

### Issue: Network timeout

**Problem:** Large journals or slow connection.

**Solution:** Increase axios timeout in ApiClient constructor:

```typescript
timeout: 90000; // 90 seconds (already set for serverless cold starts)
```

### Issue: Merge conflicts look ugly

**Current approach:** Simple append with separator.

**Future improvement:** Use a diff library for better merging:

```typescript
import { diffLines } from 'diff';
// Create smarter merge with conflict markers
```

## Enhancements (Optional)

### 1. Better Conflict Resolution

Instead of simple appending, use diff markers like Git:

```typescript
const merged = `${content}
<<<<<<< LOCAL
${content}
=======
${remoteEntry.content}
>>>>>>> REMOTE`;
```

### 2. Selective Sync

Add options to sync specific date ranges:

```typescript
papyrus sync --from 20260101 --to 20260131
```

### 3. Dry Run Mode

See what would change without actually syncing:

```typescript
papyrus sync --dry-run
```

### 4. Progress Bar

Use `cli-progress` for visual feedback:

```typescript
import { SingleBar } from 'cli-progress';

const bar = new SingleBar({});
bar.start(totalJournals, 0);
// Update on each journal processed
bar.increment();
bar.stop();
```

### 5. Sync Statistics Storage

Track sync history:

```typescript
interface SyncHistory {
  timestamp: string;
  uploaded: number;
  downloaded: number;
  conflicts: number;
}

// Store in ~/.local/share/papyrus/sync-history.json
```

## Complete File Reference

Files created/updated in this tutorial:

```
src/
├── commands/
│   └── sync.ts                      # Sync command (NEW)
├── lib/
│   ├── api/
│   │   └── api-client.ts            # Extended with journal methods (UPDATED)
│   ├── sync/
│   │   └── sync-engine.ts           # Core sync logic (NEW)
│   └── storage/
│       ├── journal-storage.ts       # Journal file operations (existing)
│       └── sync-meta-store.ts       # Sync metadata storage (existing)
└── utils/
    └── hash.ts                      # Hash computation (NEW)
```

## Summary

You've implemented a robust journal sync system with:

1. **Hash-based conflict detection** - No reliance on timestamps
2. **Three-way comparison** - Tracks last synced state per-device
3. **Automatic conflict resolution** - Merges content safely
4. **Progress feedback** - Clear messages during sync
5. **Decoupled design** - Sync engine testable independently

**Key concepts:**

- **lastSyncedHash** is the baseline for comparison
- **Each device** tracks its own sync state
- **Server** only needs to return current hash
- **Conflicts** are resolved by merging (data is precious)

**Architecture decisions:**

- ✅ Hash-based (not timestamp-based)
- ✅ Three-way comparison (local, remote, base)
- ✅ Per-device state (no server coordination needed)
- ✅ Merge conflicts (never lose data)
- ✅ Simple progress feedback (console logs)

These commands now form a complete journal workflow:

```bash
papyrus add              # Create/edit entry
papyrus show             # Display entry
papyrus amend            # Edit existing
papyrus sync             # Sync with server
```

## References

- [sync.md](./sync.md) - Original sync strategy document
- [ARCHITECTURE-JOURNAL-STORAGE.md](./ARCHITECTURE-JOURNAL-STORAGE.md) - Storage format
- [Node.js crypto](https://nodejs.org/api/crypto.html) - Hash functions
- [02-API-CLIENT-SETUP.md](./02-API-CLIENT-SETUP.md) - API client foundation
