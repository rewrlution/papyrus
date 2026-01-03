# Architecture Decision: Journal Storage Format

An architecture decision record (ADR) documenting why we chose Markdown with YAML frontmatter for storing journal entries locally.

## Context and Problem Statement

The CLI needs to persist journal entries locally for offline editing and sync operations. When fetching journals from the API, we receive:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "20240101",
  "content": "# My journal entry\n\nToday I learned...",
  "hash": "abc123def456",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T15:30:00Z"
}
```

**Key requirements:**

1. **Human-editable** - Users should edit entries with any text editor
2. **Metadata preservation** - Store API metadata (hash, timestamps, ID) for sync
3. **Conflict detection** - Detect changes between local and remote versions
4. **Developer-friendly** - Easy to understand, debug, and version control
5. **Simple implementation** - Avoid over-engineering

**The question:** How should we store this data locally?

## Decision Drivers

- **Simplicity** - Prefer straightforward solutions over complex ones
- **Industry standards** - Use established patterns when available
- **User experience** - Easy to edit, read, and understand
- **Maintainability** - Easy for developers to work with
- **Popular libraries** - Don't reinvent the wheel

## Considered Options

### Option 1: Markdown with YAML Frontmatter ✅ CHOSEN

Store entries as `.md` files with metadata in YAML frontmatter:

```markdown
---
id: '550e8400-e29b-41d4-a716-446655440000'
createdAt: '2024-01-01T10:00:00Z'
updatedAt: '2024-01-01T15:30:00Z'
serverHash: 'abc123def456'
synced: true
---

# My journal entry

Today I learned...
```

**Pros:**

- ✅ **Industry standard** - Same pattern as Jekyll, Hugo, Obsidian, Gatsby
- ✅ **Zero transformation** - Edit directly, no conversion needed
- ✅ **Human-readable** - Metadata is visible but separated
- ✅ **Git-friendly** - Clean diffs, line-by-line changes
- ✅ **Popular library** - `gray-matter` (1M+ weekly downloads)
- ✅ **Type-safe** - Validate frontmatter with Zod
- ✅ **Cross-editor** - Works with VS Code, Vim, Obsidian, etc.
- ✅ **Search-friendly** - Grep/search through content easily

**Cons:**

- ⚠️ Users can edit metadata (but we validate on load)
- ⚠️ Need to parse frontmatter (library handles this)

### Option 2: Pure JSON

Store entries as `.json` files:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "# My journal entry\n\nToday I learned...",
  "metadata": {
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T15:30:00Z",
    "serverHash": "abc123def456",
    "synced": true
  }
}
```

**Pros:**

- ✅ Easy to parse (native JSON)
- ✅ Structured data

**Cons:**

- ❌ **Not human-editable** - Content has escaped newlines (`\n`)
- ❌ **Needs transformation layer** - Convert JSON ↔ Markdown for editing
- ❌ **Poor readability** - Hard to read/write content
- ❌ **Not markdown-editor friendly** - Can't open in Obsidian, Typora, etc.
- ❌ **Complex editing flow** - Load JSON → Extract content → Edit → Re-embed → Save
- ❌ **Against principles** - Over-engineered for this use case

### Option 3: Separate Files (Content + Metadata)

Store content and metadata in separate files:

```
journals/
  20240101/
    entry.md           # Content only
    .metadata.json     # Metadata
```

**Pros:**

- ✅ Clean separation of concerns
- ✅ Content is pure Markdown

**Cons:**

- ❌ **Two files can desync** - Content updated but metadata stale
- ❌ **Complex operations** - Need atomic writes for consistency
- ❌ **More file I/O** - Read/write two files per operation
- ❌ **User confusion** - Hidden metadata file (starts with `.`)
- ❌ **Unnecessary complexity** - Solving a problem we don't have

### Option 4: SQLite Database

Store entries in local SQLite database:

**Pros:**

- ✅ ACID transactions
- ✅ Query capabilities

**Cons:**

- ❌ **Not human-editable** - Binary format
- ❌ **Not Git-friendly** - Can't diff changes
- ❌ **Over-engineered** - Too much for simple storage
- ❌ **Extra dependency** - Need SQLite bindings
- ❌ **Against requirements** - Users want to edit with text editors

## Decision Outcome

**Chosen option: Markdown with YAML Frontmatter (Option 1)**

This option best balances all requirements:

1. **Human-editable** ✅ - Open in any text editor
2. **Metadata preservation** ✅ - YAML frontmatter stores all API data
3. **Conflict detection** ✅ - Compare `serverHash` with computed hash
4. **Developer-friendly** ✅ - Standard pattern, easy to understand
5. **Simple implementation** ✅ - Use `gray-matter` library

**Why this works:**

- Follows **"use popular libraries"** principle - `gray-matter` is battle-tested
- Follows **"no unnecessary complexity"** principle - No transformation layer
- Follows **"use established patterns"** principle - Industry standard format
- Matches user expectations - Same as Obsidian, Jekyll, Hugo

## Implementation Details

### File Structure

```
~/.local/share/papyrus/journals/
  2024-01-01.md
  2024-01-02.md
  2024-01-15.md
```

**Date-based filenames** make it easy to:

- Sort chronologically
- Find specific dates
- List all entries

### Storage API

```typescript
// src/lib/storage/journal-store.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import { BaseStorage } from './base-storage.js';

// Validate frontmatter with Zod
const JournalMetadataSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  serverHash: z.string().optional(),
  synced: z.boolean().default(false),
});

type JournalMetadata = z.infer<typeof JournalMetadataSchema>;

interface JournalEntry {
  metadata: JournalMetadata;
  content: string;
}

export class JournalStore extends BaseStorage {
  private journalsDir: string;

  constructor(baseDir?: string) {
    super(baseDir);
    this.journalsDir = path.join(this.dataDir, 'journals');
    this.ensureDir(this.journalsDir);
  }

  // Save journal entry (from API or after editing)
  save(date: string, entry: JournalEntry): void {
    const filePath = this.getFilePath(date);

    // Serialize with gray-matter
    const fileContent = matter.stringify(entry.content, entry.metadata);

    fs.writeFileSync(filePath, fileContent, 'utf-8');
  }

  // Load journal entry
  load(date: string): JournalEntry | null {
    const filePath = this.getFilePath(date);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    // Validate and type-check metadata
    const metadata = JournalMetadataSchema.parse(data);

    return { metadata, content };
  }

  // List all entries
  list(): Array<{ date: string; metadata: JournalMetadata }> {
    const files = fs
      .readdirSync(this.journalsDir)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .reverse(); // Most recent first

    return files
      .map((file) => {
        const date = path.basename(file, '.md');
        const entry = this.load(date);
        return entry ? { date, metadata: entry.metadata } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }

  // Check if entry exists
  exists(date: string): boolean {
    return fs.existsSync(this.getFilePath(date));
  }

  // Delete entry
  delete(date: string): void {
    const filePath = this.getFilePath(date);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private getFilePath(date: string): string {
    return path.join(this.journalsDir, `${date}.md`);
  }
}

// Singleton instance
export const journalStore = new JournalStore();
```

### Usage Examples

#### Save Entry from API

```typescript
// After fetching from server
const apiResponse = await api.getJournal('2024-01-01');

journalStore.save('2024-01-01', {
  metadata: {
    id: apiResponse.id,
    createdAt: apiResponse.createdAt,
    updatedAt: apiResponse.updatedAt,
    serverHash: apiResponse.hash,
    synced: true,
  },
  content: apiResponse.content,
});
```

#### Load and Edit

```typescript
// Load entry
const entry = journalStore.load('2024-01-01');

if (entry) {
  // Open in editor (user edits content)
  const updatedContent = await openInEditor(entry.content);

  // Mark as unsynced
  entry.content = updatedContent;
  entry.metadata.synced = false;

  // Save back
  journalStore.save('2024-01-01', entry);
}
```

#### List All Entries

```typescript
const entries = journalStore.list();

console.log('Your journals:');
entries.forEach(({ date, metadata }) => {
  const syncStatus = metadata.synced ? '✅' : '⚠️';
  console.log(`${syncStatus} ${date} - ${metadata.updatedAt}`);
});
```

## Conflict Detection

Using `serverHash` field for three-way comparison:

```typescript
import crypto from 'crypto';

function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function detectConflict(
  date: string
): 'no-change' | 'local-change' | 'remote-change' | 'conflict' {
  const local = journalStore.load(date);
  if (!local) return 'remote-change'; // New from server

  const localHash = computeHash(local.content);
  const serverHash = local.metadata.serverHash;

  // Fetch from server
  const remote = await api.getJournal(date);
  const remoteHash = remote.hash;

  // Three-way comparison
  const localChanged = localHash !== serverHash;
  const remoteChanged = remoteHash !== serverHash;

  if (!localChanged && !remoteChanged) return 'no-change';
  if (localChanged && !remoteChanged) return 'local-change';
  if (!localChanged && remoteChanged) return 'remote-change';
  return 'conflict'; // Both changed
}
```

**How it works:**

1. **`serverHash`** - Hash when last synced with server (baseline)
2. **`localHash`** - Current content hash (computed on-demand)
3. **`remoteHash`** - Current server hash (from API)

**Comparison logic:**

| Local Changed? | Remote Changed? | Result       | Action           |
| -------------- | --------------- | ------------ | ---------------- |
| No             | No              | No changes   | Do nothing       |
| Yes            | No              | Local only   | Push to server   |
| No             | Yes             | Remote only  | Pull from server |
| Yes            | Yes             | **CONFLICT** | Merge or choose  |

See [sync.md](./sync.md) for complete sync algorithm.

## File Example

Here's what a saved journal entry looks like:

```markdown
---
id: 550e8400-e29b-41d4-a716-446655440000
createdAt: '2024-01-01T10:00:00Z'
updatedAt: '2024-01-01T15:30:00Z'
serverHash: abc123def456789
synced: true
---

# January 1st, 2024

## What I Did Today

- Fixed authentication bug in the CLI
- Implemented token refresh logic
- Added tests for edge cases

## What I Learned

The JWT token expiration handling was more complex than expected. Need to handle:

1. Token expired during request
2. Token expired between requests
3. Refresh token also expired

## Blockers

None today!

## Tomorrow

- Implement journal sync logic
- Write documentation
```

**User can open this with:**

- VS Code: Full markdown preview
- Vim: Syntax highlighting for YAML + Markdown
- Obsidian: Renders as normal note (ignores frontmatter in preview)
- Any text editor: Readable plain text

## Benefits Summary

### For Users

- ✅ Edit with any editor (VS Code, Vim, Obsidian, Notepad++)
- ✅ Readable format - no escaped characters
- ✅ Can grep/search through journals easily
- ✅ Version control with Git (if desired)
- ✅ Familiar format (same as blog posts, Obsidian notes)

### For Developers

- ✅ Simple implementation (~50 lines for full CRUD)
- ✅ Industry standard pattern (well-documented)
- ✅ Type-safe with Zod validation
- ✅ Easy to debug (just open the file)
- ✅ Popular library (`gray-matter`) - battle-tested
- ✅ No transformation layer needed

### For Sync Logic

- ✅ Conflict detection via hash comparison
- ✅ Metadata tracks sync state (`synced` flag)
- ✅ Baseline hash (`serverHash`) enables three-way merge
- ✅ Each file is independent (parallel sync possible)

## Installation

```bash
cd packages/cli
pnpm add gray-matter
```

## Trade-offs

### Accepted Trade-offs

**Users can manually edit metadata:**

- **Risk:** Corruption of ID, timestamps, or hash
- **Mitigation:** Zod validation catches invalid metadata on load
- **Rationale:** Trust users; provide clear error messages if corrupted

**Metadata is visible in file:**

- **Alternative:** Hidden metadata file (`.metadata.json`)
- **Rationale:** Transparency is better; users can see sync state

**Need frontmatter parser:**

- **Alternative:** Pure JSON (no parsing needed)
- **Rationale:** `gray-matter` is stable, popular, and small

### Rejected Alternatives

**JSON storage:** Fails "human-editable" requirement
**Separate metadata files:** Unnecessary complexity
**SQLite database:** Over-engineered, not Git-friendly
**Custom format:** Don't reinvent the wheel

## References

- [gray-matter](https://github.com/jonschlinkert/gray-matter) - YAML frontmatter parser
- [Jekyll Frontmatter](https://jekyllrb.com/docs/front-matter/) - Industry standard
- [Obsidian Frontmatter](https://help.obsidian.md/Editing+and+formatting/Properties) - Same pattern
- [Hugo Frontmatter](https://gohugo.io/content-management/front-matter/) - Same pattern
- [01-STORAGE-LAYER.md](./01-STORAGE-LAYER.md) - Storage layer foundation
- [sync.md](./sync.md) - Sync algorithm using hashes

## Related Decisions

- **Storage location:** See [01-STORAGE-LAYER.md](./01-STORAGE-LAYER.md) for XDG paths
- **Sync strategy:** See [sync.md](./sync.md) for hash-based conflict detection
- **File naming:** Date-based (`YYYY-MM-DD.md`) for chronological sorting

## Status

**Accepted** - This is the chosen approach for journal storage.

## Consequences

### Positive

- Simple, maintainable implementation
- Excellent user experience (edit anywhere)
- Industry-standard pattern (familiarity)
- Git-friendly for power users
- Easy to debug and inspect

### Neutral

- Users can edit metadata (validated on load)
- Dependency on `gray-matter` (but it's stable)

### Negative

None identified that outweigh the benefits.

## Future Considerations

### Encryption at Rest

If we add encryption later:

```markdown
---
encrypted: true
algorithm: aes-256-gcm
---

[encrypted content here]
```

- Frontmatter stays readable (shows it's encrypted)
- Content is encrypted base64
- User can still see which entries exist

### Additional Metadata Fields

Easy to extend frontmatter:

```yaml
---
id: '...'
tags: [work, learning, bug-fix]
mood: happy
location: home
---
```

YAML frontmatter makes schema evolution trivial.

### Migration from Other Formats

If users have JSON exports:

```typescript
// Easy to migrate
const json = JSON.parse(fs.readFileSync('old-journal.json'));
journalStore.save(json.date, {
  metadata: {
    /* ... */
  },
  content: json.content,
});
```

## Decision Date

2026-01-02

## Decision Makers

Project maintainers

## Approval Status

Approved and implemented
