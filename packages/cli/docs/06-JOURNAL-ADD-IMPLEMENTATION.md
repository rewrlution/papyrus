# Implementing the Journal Add Command

A complete, step-by-step guide to building a journal entry command that opens an external editor with templates.

## What We're Building

A journal add command that:

1. Accepts optional date parameter (defaults to today)
2. Loads existing entry if it exists, or creates new one
3. Appends template comments at the bottom for guidance
4. Opens editor (vi/vim/code) for user to write
5. Waits for user to save and close editor
6. Strips template comments from saved content
7. Validates content is not empty
8. Saves to local storage with metadata
9. Provides clear feedback and error handling

**Note:** This implementation makes `add` work for both creating **new** entries and editing **existing** entries. If you want separate commands (`add` for create-only, `amend` for edit-only), see the Enhancements section.

## Final Result

```bash
$ papyrus add

Opening journal for December 10, 2025 in vi...

# [vi opens with this content]

---
id: "550e8400-e29b-41d4-a716-446655440000"
createdAt: "2025-12-10T10:00:00Z"
updatedAt: "2025-12-10T10:00:00Z"
synced: false
---

# December 10, 2025


<!-- ================================================================ -->
<!-- Symbol Guide                                                     -->
<!-- ---------------------------------------------------------------- -->
<!-- @person     Tag people           @alice, @bob                    -->
<!-- #project    Tag projects         #papyrus, #feature-x            -->
<!-- +tech       Tag technologies     +typescript, +react             -->
<!-- ================================================================ -->

# [User writes content, saves, and exits]

$

✅ Journal entry saved for 20251210
📝 Words: 42 | Characters: 234

$ papyrus add -d 20241225

Opening journal for December 25, 2024 in vi...
✅ Journal entry saved for 20241225
```

**Editing existing entry:**

```bash
$ papyrus add -d 20251210

📖 Loading existing entry for December 10, 2025...
Opening in vi...

# [vi opens with existing content + template at bottom]
# [User edits, saves, exits]

✅ Journal entry updated for 20251210
```

## Architecture

```
┌──────────────────────────┐
│   add command            │
│   (entry point)          │
│   - Parse date option    │
│   - Validate date format │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│   JournalStore           │
│   (Storage layer)        │
│   - Check if exists      │
│   - Load existing entry  │
│   - Save new/updated     │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│   Editor Manager         │
│   (Editor orchestration) │
│   - Detect available     │
│   - Create temp file     │
│   - Open editor          │
│   - Wait for close       │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│   Template Processor     │
│   (Content processing)   │
│   - Append template      │
│   - Strip template       │
│   - Validate content     │
└──────────────────────────┘
```

**Flow diagram:**

```
User runs command
      ↓
Parse date (default: today)
      ↓
Check JournalStore for existing entry
      ↓
   ┌──┴──┐
   │     │
Exists   New
   │     │
   ↓     ↓
Load    Create metadata
content  (id, timestamps)
   │     │
   └──┬──┘
      ↓
Append template to content
      ↓
Write to temp file
      ↓
Detect available editor (vi → vim → code)
      ↓
Open editor with temp file
      ↓
Wait for editor to close
      ↓
Read temp file content
      ↓
Strip template comments
      ↓
Validate (not empty?)
      ↓
   ┌──┴──┐
   │     │
  YES    NO
   │     │
   ↓     ↓
Save   Error
to     message
store
   │
   ↓
Show success
Delete temp file
```

## Prerequisites

Ensure you have completed:

- [01-STORAGE-LAYER.md](./01-STORAGE-LAYER.md) - Storage layer with JournalStore
- [ARCHITECTURE-JOURNAL-STORAGE.md](./ARCHITECTURE-JOURNAL-STORAGE.md) - Journal storage format

**Install required libraries:**

```bash
cd packages/cli
pnpm add gray-matter uuid
pnpm add -D @types/node @types/uuid
```

**Why these libraries?**

- **gray-matter** - Parse/serialize Markdown with YAML frontmatter
- **uuid** - Generate unique IDs for entries

**Note:** We use Node's built-in `child_process` for running editors - no external library needed!

**Assumed knowledge:**

- Basic file I/O in Node.js
- Commander.js command registration
- Understanding of temp files

## Implementation

### Step 1: Date Utilities (Already Exist!)

The date utilities already exist in `src/utils/date.ts` and provide everything we need:

```typescript
// src/utils/date.ts - Already implemented!
import { format, parse, addDays, subDays, parseISO } from 'date-fns';
import { DATE_FORMAT, DateStringSchema } from '@rewrlution/papyrus-shared';

/**
 * Parse user input to YYYYMMDD format
 * Supports: "today", "yesterday", "tomorrow", "+1", "-7", "2025-12-10", "20251210"
 */
export function parseDate(input: string): string {
  // Returns YYYYMMDD format (e.g., "20251210")
}

/**
 * Format YYYYMMDD to readable format
 * "20251210" → " December 10, 2025"
 */
export function formatDate(date: string): string {
  // Returns human-readable format
}

/**
 * Get today's date in YYYYMMDD format
 */
export function getTodayDate(): string {
  // Returns "20251210" for Dec 10, 2025
}
```

**Key points:**

- **Date format is YYYYMMDD** - e.g., "20251210" (not "2025-12-10")
- **Filenames use YYYYMMDD** - e.g., `20251210.md` (not `2025-12-10.md`)
- **Shared constants** - `DATE_FORMAT` from `@rewrlution/papyrus-shared` is `'yyyyMMdd'`
- **Validation** - Uses `DateStringSchema` from shared package

**Why YYYYMMDD for filenames?**

- No special characters (works on all filesystems)
- Sorts correctly in directory listings
- Shorter (easier to type)
- Matches shared package convention

### Step 2: Create Editor Manager

Create a module to detect and run editors using Node's built-in `child_process`. We use **synchronous operations** because waiting for the user to edit is inherently blocking - there's no benefit to async here.

```typescript
// src/utils/editor.ts
import { spawnSync, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Supported editors in order of preference
 * Platform-specific fallbacks at the end
 */
const EDITORS = ['vi', 'vim', 'nano', 'code'];

/**
 * Check if a command is available on the system
 */
function isCommandAvailable(command: string): boolean {
  try {
    const checkCommand = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checkCommand} ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect which editor is available on the system
 * Falls back to platform defaults (notepad on Windows, nano on Unix)
 */
export function detectEditor(): string {
  // Try preferred editors first
  for (const editor of EDITORS) {
    if (isCommandAvailable(editor)) {
      return editor;
    }
  }

  // Platform-specific fallbacks - always available
  if (process.platform === 'win32') {
    // Notepad is always installed on Windows (since Windows 1.0)
    if (isCommandAvailable('notepad')) {
      return 'notepad';
    }
  } else {
    // nano is included in most Unix/Linux distributions and all macOS
    if (isCommandAvailable('nano')) {
      return 'nano';
    }
  }

  // If we get here, something is seriously wrong
  throw new Error(
    'No text editor found. Please install one of: vi, vim, nano, VS Code'
  );
}

/**
 * Open content in editor and wait for user to finish
 * Uses synchronous operations - we WANT to block until editing is done
 *
 * @param content - Initial content to load in editor
 * @param filename - Temp filename (for syntax highlighting)
 * @returns Content after user saves and closes editor
 */
export function openInEditor(
  content: string,
  filename: string = 'temp.md'
): string {
  // Create temp file
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, filename);

  // Write initial content
  fs.writeFileSync(tempFile, content, 'utf-8');

  try {
    // Detect editor
    const editor = detectEditor();

    console.log(`Opening in ${editor}...`);

    // Determine args based on editor
    const args = editor === 'code' ? ['--wait', tempFile] : [tempFile];

    // Spawn editor synchronously - blocks until user closes it
    const result = spawnSync(editor, args, {
      stdio: 'inherit', // Let editor take over terminal
    });

    // Check for errors
    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0 && result.status !== null) {
      throw new Error(`Editor exited with code ${result.status}`);
    }

    // Read edited content
    const editedContent = fs.readFileSync(tempFile, 'utf-8');

    // Clean up temp file
    fs.unlinkSync(tempFile);

    return editedContent;
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    throw error;
  }
}
```

**Key features:**

- **Uses synchronous operations** - Simpler code, appropriate for blocking task
- **No async/await complexity** - Straightforward sequential flow
- **Auto-detect editor** - Tries vi → vim → nano → code in order
- **Platform-specific fallbacks** - notepad (Windows), nano (Unix/macOS)
- **Always succeeds** - Falls back to universally available editors
- **Cross-platform** - Uses `which` on Unix, `where` on Windows
- **Automatic cleanup** - Removes temp file even on errors

**Why synchronous operations?**

For a journal app, editing is inherently blocking - you **want** to wait for the user to finish. Async operations add unnecessary complexity with no benefit:

```typescript
// Async (unnecessarily complex)
const edited = await openInEditor(content); // Promises, async/await
// Event handlers
// Promise boilerplate

// Sync (appropriate and simpler)
const edited = openInEditor(content); // Just works
// Sequential, clear flow
// Half the code
```

**Editor fallback strategy:**

| Platform   | Try in order           | Fallback    | Always available?                   |
| ---------- | ---------------------- | ----------- | ----------------------------------- |
| Windows    | vi → vim → nano → code | **notepad** | ✅ Yes (built-in since Windows 1.0) |
| Unix/macOS | vi → vim → nano → code | **nano**    | ✅ Usually (most distros)           |

**Why these fallbacks?**

- **notepad (Windows)** - Cannot be uninstalled, works in restricted environments, GUI-based
- **nano (Unix)** - More universal than vi, easier for beginners, shows help at bottom

**Why `stdio: 'inherit'`?**

This allows the editor to take over the terminal completely. The user sees the editor UI directly, not through Node's pipes.

### Step 3: Extend JournalStore

Ensure your `JournalStore` has these methods (based on architecture doc):

```typescript
// src/lib/storage/journal-store.ts
import crypto from 'crypto';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { BaseStorage } from './base-storage.js';

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

  /**
   * Create a new journal entry with metadata
   * @param date - Date in YYYYMMDD format
   * @param content - Initial content
   */
  create(date: string, content: string = ''): JournalEntry {
    const now = new Date().toISOString();
    return {
      metadata: {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        synced: false,
      },
      content,
    };
  }

  /**
   * Save journal entry (create or update)
   * @param date - Date in YYYYMMDD format (e.g., "20251210")
   * @param entry - Entry to save
   */
  save(date: string, entry: JournalEntry): void {
    const filePath = this.getFilePath(date);

    // Update timestamp
    entry.metadata.updatedAt = new Date().toISOString();

    // Compute hash for sync
    entry.metadata.serverHash = this.computeHash(entry.content);

    // Mark as unsynced
    entry.metadata.synced = false;

    // Serialize with gray-matter
    const fileContent = matter.stringify(entry.content, entry.metadata);

    fs.writeFileSync(filePath, fileContent, 'utf-8');
  }

  /**
   * Load journal entry
   * @param date - Date in YYYYMMDD format
   */
  load(date: string): JournalEntry | null {
    const filePath = this.getFilePath(date);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    // Validate metadata
    const metadata = JournalMetadataSchema.parse(data);

    return { metadata, content };
  }

  /**
   * Check if entry exists
   * @param date - Date in YYYYMMDD format
   */
  exists(date: string): boolean {
    return fs.existsSync(this.getFilePath(date));
  }

  /**
   * Compute SHA-256 hash of content for sync
   */
  private computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get file path for date
   * @param date - Date in YYYYMMDD format
   * @returns Path like ~/.local/share/papyrus/journals/20251210.md
   */
  private getFilePath(date: string): string {
    return path.join(this.journalsDir, `${date}.md`);
  }
}

// Singleton instance
export const journalStore = new JournalStore();
```

**Key points:**

- **Filenames use YYYYMMDD** - e.g., `20251210.md`
- **Metadata preserved on update** - Only `updatedAt` changes
- **Hash computed** - For sync conflict detection
- **Marked unsynced** - After any edit

### Step 4: Implement Add Command

Now implement the main add command. Notice it's **not async** - since `openInEditor()` is synchronous, this command is too:

```typescript
// src/commands/journal/add.ts
import { journalStore } from '../../lib/storage/journal-store.js';
import { formatDate, parseDate } from '../../utils/date.js';
import { openInEditor } from '../../utils/editor.js';
import {
  JOURNAL_TEMPLATE,
  stripTemplateComments,
} from '../../utils/template.js';

interface AddOptions {
  date?: string;
}

export function add(options: AddOptions): void {
  try {
    // 1. Parse date (default to today)
    const date = parseDate(options.date || 'today'); // Returns YYYYMMDD
    const displayDate = formatDate(date); // Returns " December 10, 2025"

    console.log(`\n📝 Opening journal for${displayDate}...\n`);

    // 2. Load existing entry or create new one
    let entry = journalStore.load(date);
    let isNew = false;

    if (entry) {
      console.log(`📖 Loading existing entry...`);
    } else {
      console.log(`✨ Creating new entry...`);
      isNew = true;
      // Create with empty content - we'll set it after editing
      entry = journalStore.create(date, '');
    }

    // 3. Prepare content for editor (append template)
    const contentWithTemplate = entry.content + '\n\n' + JOURNAL_TEMPLATE;

    // 4. Open editor - synchronous, blocks until user closes editor
    const editedContent = openInEditor(
      contentWithTemplate,
      `papyrus-${date}.md`
    );

    // 5. Strip template comments
    const finalContent = stripTemplateComments(editedContent);

    // 6. Validate content
    if (!finalContent.trim()) {
      console.log('⚠️  No content written. Entry not saved.');
      return;
    }

    // 7. Update entry content
    entry.content = finalContent;

    // 8. Save to store
    journalStore.save(date, entry);

    // 9. Show success message with stats
    const words = countWords(finalContent);
    const chars = finalContent.length;

    console.log(
      `\n✅ Journal entry ${isNew ? 'created' : 'updated'} for ${date}`
    );
    console.log(`📊 Words: ${words} | Characters: ${chars}\n`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}
```

**Key features:**

1. **Synchronous execution** - No async/await, simpler flow
2. **Uses existing date utilities** - `parseDate()` and `formatDate()` from `utils/date.ts`
3. **YYYYMMDD format** - All dates handled in this format
4. **Load or create** - Handle both new and existing entries
5. **Template appending** - Adds guidance comments
6. **Editor integration** - Opens user's editor with synchronous `child_process`
7. **Template stripping** - Removes comments after save
8. **Validation** - Ensure content is not empty
9. **Metadata management** - Automatic timestamps and IDs
10. **User feedback** - Clear messages and stats

**Why not async?**

Since `openInEditor()` is synchronous, the entire command can be synchronous. This makes the code simpler and more straightforward - no promises, no async/await, just sequential execution.

### Step 5: Register Command

Register the add command with Commander. Since `add()` is synchronous, no async needed:

```typescript
// src/commands/journal/index.ts
import { Command } from 'commander';
import { add } from './add.js';

export function registerJournalCommands(program: Command) {
  const journal = program
    .command('journal')
    .description('Manage journal entries');

  journal
    .command('add')
    .description('Create or edit a journal entry')
    .option(
      '-d, --date <date>',
      'Entry date (YYYYMMDD, YYYY-MM-DD, "today", "yesterday")',
      'today'
    )
    .action((options) => {
      add(options);
    });

  // Alias at top level for convenience
  program
    .command('add')
    .description('Create or edit a journal entry (alias for journal add)')
    .option('-d, --date <date>', 'Entry date', 'today')
    .action((options) => {
      add(options);
    });
}
```

**Why both `journal add` and `add`?**

- **`papyrus journal add`** - Explicit, organized under journal namespace
- **`papyrus add`** - Convenient shortcut for most common operation
- Users can use whichever they prefer

**Why not async?**

Since `add()` is a synchronous function, we don't need `async/await` in the action handler. Commander will handle synchronous actions just fine.

### Step 6: Template (Already Exists)

The template is already defined in `src/utils/template.ts`:

```typescript
// src/utils/template.ts - Already implemented!
export const JOURNAL_TEMPLATE = `
<!-- ================================================================ -->
<!-- Symbol Guide                                                     -->
<!-- ---------------------------------------------------------------- -->
<!-- @person     Tag people           @alice, @bob                    -->
<!-- #project    Tag projects         #papyrus, #feature-x            -->
<!-- +tech       Tag technologies     +typescript, +react             -->
<!-- ================================================================ -->
`;

export function stripTemplateComments(content: string): string {
  return content
    .split('\n')
    .filter((line) => !line.trim().match(/^<!--.*-->$/))
    .join('\n')
    .trim();
}
```

**Why this template design?**

- **HTML comments** - Visible in editor but won't render in markdown
- **Clear visual separation** - Box drawing makes it stand out
- **Easy to strip** - Regex removes all HTML comment lines
- **Extensible** - Easy to add more symbols/conventions

## Testing the Add Command

### 1. Build and Run

```bash
cd packages/cli
pnpm build
node dist/cli.js add
```

### 2. Test with tsx (faster during development)

```bash
tsx src/cli.tsx add
```

### 3. Test Different Scenarios

**Create new entry for today:**

```bash
papyrus add
# Opens editor with template
# Write some content, save, exit
# Should show success message
```

**Create entry for specific date:**

```bash
papyrus add -d 20241225        # YYYYMMDD format
papyrus add -d 2024-12-25      # YYYY-MM-DD format (parsed to YYYYMMDD)
papyrus add --date 20241225
```

**Edit existing entry:**

```bash
# Run twice with same date
papyrus add -d 20251210
# Make changes, save, exit
papyrus add -d 20251210
# Should load previous content
```

**Use date shortcuts:**

```bash
papyrus add -d today
papyrus add -d yesterday
papyrus add -d tomorrow
papyrus add -d +1    # Tomorrow
papyrus add -d -7    # Week ago
```

**Verify saved files:**

```bash
# Linux/Mac
cat ~/.local/share/papyrus/journals/20251210.md

# Windows
type %LOCALAPPDATA%\papyrus\Data\journals\20251210.md
```

Should show markdown with YAML frontmatter and your content (no template comments).

**Check filename format:**

```bash
# Linux/Mac
ls ~/.local/share/papyrus/journals/

# Windows
dir %LOCALAPPDATA%\papyrus\Data\journals\

# Should see:
# 20251210.md
# 20241225.md
# NOT: 2025-12-10.md (wrong format)
```

### 4. Test Edge Cases

**Empty content (just save without writing):**

```bash
papyrus add
# Open editor, save immediately without writing anything
# Should show: "⚠️  No content written. Entry not saved."
```

**Invalid date format:**

```bash
papyrus add -d "invalid-date"
# Should show error: Invalid date
```

**Editor not available:**

```bash
# Temporarily rename vi/vim/code executables (or test on system without them)
papyrus add
# Should show: "No supported editor found..."
```

**Cancel editing (Ctrl+C in vi):**

```bash
papyrus add
# In vi: press Esc, then :q!
# Process should exit gracefully
```

## How It Works

### Date Format Throughout

**User input → Parsing → Storage:**

```
User types:          parseDate() returns:     Filename:
"today"           →  "20251210"           →   20251210.md
"yesterday"       →  "20251209"           →   20251209.md
"2025-12-10"      →  "20251210"           →   20251210.md
"20251210"        →  "20251210"           →   20251210.md
"+1"              →  "20251211"           →   20251211.md
```

**Why YYYYMMDD everywhere?**

- Defined in shared package: `DATE_FORMAT = 'yyyyMMdd'`
- Consistent across frontend and backend
- No special characters in filenames
- Sorts chronologically automatically

### Editor Detection Flow

```typescript
detectEditor() tries:
  1. Check if 'vi' exists (which vi / where vi)
     ✓ Found → return 'vi'
     ✗ Not found → try next

  2. Check if 'vim' exists
     ✓ Found → return 'vim'
     ✗ Not found → try next

  3. Check if 'code' exists
     ✓ Found → return 'code'
     ✗ Not found → throw error
```

**Platform differences:**

- **Unix/Linux/Mac**: Uses `which` command
- **Windows**: Uses `where` command

### Editor Process Flow

```typescript
1. Write content to temp file: /tmp/papyrus-20251210.md
2. Spawn editor process: spawn('vi', ['/tmp/papyrus-20251210.md'], { stdio: 'inherit' })
3. Wait for process to exit (user saves and closes)
4. Read temp file: fs.readFileSync('/tmp/papyrus-20251210.md')
5. Delete temp file: fs.unlinkSync('/tmp/papyrus-20251210.md')
6. Return edited content
```

**Why `stdio: 'inherit'`?**

Allows the editor to take over the terminal completely. User interacts directly with vi/vim/code, not through Node's pipes.

### Template Stripping Logic

```typescript
stripTemplateComments("Hello\n<!-- comment -->\nWorld")
  ↓
Split by newline: ["Hello", "<!-- comment -->", "World"]
  ↓
Filter out HTML comments: ["Hello", "World"]
  ↓
Join back: "Hello\nWorld"
  ↓
Trim whitespace: "Hello\nWorld"
```

**Regex breakdown:**

```javascript
/^<!--.*-->$/
  ^          Start of line
  <!--       Literal "<!--"
  .*         Any characters
  -->        Literal "-->"
  $          End of line
```

Only removes lines that are **entirely** HTML comments, so inline comments like `Hello <!-- note --> World` are preserved.

### Metadata Management

**New entry:**

```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",  // Generated with uuid
  createdAt: "2025-12-10T10:00:00Z",            // Current time
  updatedAt: "2025-12-10T10:00:00Z",            // Same as created
  synced: false                                 // Not synced yet
}
```

**Updated entry:**

```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",  // Same ID
  createdAt: "2025-12-10T10:00:00Z",            // Original time
  updatedAt: "2025-12-10T15:30:00Z",            // New time
  synced: false                                 // Mark unsynced
}
```

**Why track `synced` flag?**

- Know which entries need to be pushed to server
- Useful for `sync` command to identify changes
- See [sync.md](./sync.md) for sync algorithm

## Add vs Amend: Design Considerations

This tutorial implements `add` as a **unified command** that handles both creation and editing. This is the simplest approach.

### Current Implementation: Unified `add`

```bash
papyrus add              # Create if new, edit if exists
papyrus add -d 20241225  # Create if new, edit if exists
```

**Benefits:**

- ✅ Simple UX - one command to remember
- ✅ Natural workflow - "I want to add to my journal"
- ✅ Less code to maintain
- ✅ Matches git behavior (`git add` works for both)

### Alternative: Separate `add` and `amend`

If you want separate commands for safety:

```bash
papyrus add              # Create only (error if exists)
papyrus amend            # Edit only (error if doesn't exist)
```

**Benefits:**

- ✅ Prevents accidental overwrites
- ✅ Clear intent (create vs edit)
- ✅ Can have different behavior (e.g., amend without template)

**Implementation:**

```typescript
// src/commands/journal/add.ts
export async function add(options: AddOptions): Promise<void> {
  const date = parseDate(options.date || 'today');

  // Check if exists
  if (journalStore.exists(date)) {
    console.error(`❌ Entry for ${date} already exists. Use 'amend' to edit.`);
    process.exit(1);
  }

  // Create new entry...
}

// src/commands/journal/amend.ts
export async function amend(options: AmendOptions): Promise<void> {
  const date = parseDate(options.date || 'today');

  // Check if exists
  if (!journalStore.exists(date)) {
    console.error(`❌ Entry for ${date} not found. Use 'add' to create.`);
    process.exit(1);
  }

  // Edit existing entry...
}
```

**Which to choose?**

- **Start with unified `add`** - Simpler for users
- **Add `amend` later** if users request it

## Enhancements

### Add Editor Preference Configuration

Allow users to set preferred editor:

```typescript
// src/utils/editor.ts

export async function detectEditor(): Promise<string> {
  // 1. Check user config first
  const preferred = configStore.get('editor');
  if (preferred) {
    try {
      const command = process.platform === 'win32' ? 'where' : 'which';
      await execAsync(`${command} ${preferred}`);
      return preferred;
    } catch {
      console.warn(
        `⚠️  Configured editor "${preferred}" not found. Trying defaults...`
      );
    }
  }

  // 2. Fall back to auto-detection
  for (const editor of EDITORS) {
    // ... existing code
  }
}
```

**Set editor:**

```bash
papyrus config set editor vim
papyrus config set editor code
papyrus config set editor nano
```

### Add Custom Template Support

Let users customize the template:

```typescript
// In add command, before appending template:

let template = JOURNAL_TEMPLATE;

// Check for custom template
const customTemplatePath = path.join(
  configStore.baseDir,
  'templates',
  'journal.md'
);

if (fs.existsSync(customTemplatePath)) {
  template = fs.readFileSync(customTemplatePath, 'utf-8');
}

const contentWithTemplate = entry.content + '\n\n' + template;
```

**User creates custom template:**

```bash
mkdir -p ~/.config/papyrus/templates
cat > ~/.config/papyrus/templates/journal.md << 'EOF'
<!-- My custom template -->
## What I Did

## What I Learned

## Blockers

## Tomorrow
EOF
```

### Add Auto-Save Draft

Save a draft before opening editor in case of crash:

```typescript
// Before opening editor:
const draftFile = path.join(os.tmpdir(), `papyrus-draft-${date}.md`);
fs.writeFileSync(draftFile, contentWithTemplate, 'utf-8');

console.log(`💾 Draft saved to: ${draftFile}`);

// After successful save:
if (fs.existsSync(draftFile)) {
  fs.unlinkSync(draftFile);
}
```

If editor crashes, user can recover from draft file.

### Add Backup Before Overwrite

When editing existing entry, create backup:

```typescript
if (!isNew) {
  const backupDir = path.join(journalStore.baseDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `${date}-${timestamp}.md`);

  const originalPath = path.join(journalStore.journalsDir, `${date}.md`);
  fs.copyFileSync(originalPath, backupFile);

  console.log(`💾 Backup created: ${backupFile}`);
}
```

### Add Word Count Goals

Track daily word count goals:

```typescript
// After saving:
const words = countWords(finalContent);
const goal = configStore.get('wordGoal') || 300;

if (words >= goal) {
  console.log(`🎉 Goal reached! ${words}/${goal} words`);
} else {
  console.log(
    `📊 Progress: ${words}/${goal} words (${Math.round((words / goal) * 100)}%)`
  );
}
```

### Support Multiple Editors

Let user choose editor each time:

```bash
papyrus add --editor vim
papyrus add --editor code
papyrus add -e nano
```

```typescript
interface AddOptions {
  date?: string;
  editor?: string;
}

// In add command:
if (options.editor) {
  // Validate requested editor exists
  // Use it instead of auto-detect
}
```

### Add Rich Preview

Show preview of entry after saving:

```typescript
// After saving:
console.log('\n📄 Preview:\n');
console.log('─'.repeat(60));
console.log(finalContent.substring(0, 200));
if (finalContent.length > 200) {
  console.log('\n... (truncated)');
}
console.log('─'.repeat(60));
```

## Testing

### Unit Tests

Test individual functions:

```typescript
// tests/utils/date.test.ts
import { describe, it, expect } from 'vitest';
import { parseDate, formatDate } from '../../src/utils/date.js';

describe('Date utilities', () => {
  it('should parse various date formats to YYYYMMDD', () => {
    // Already exists - uses date-fns
    expect(parseDate('today')).toMatch(/^\d{8}$/);
    expect(parseDate('yesterday')).toMatch(/^\d{8}$/);
    expect(parseDate('2025-12-10')).toBe('20251210');
    expect(parseDate('20251210')).toBe('20251210');
  });

  it('should format YYYYMMDD for display', () => {
    expect(formatDate('20251210')).toContain('December');
    expect(formatDate('20251210')).toContain('2025');
  });
});
```

### Template Stripping Tests

```typescript
// tests/utils/template.test.ts
import { describe, it, expect } from 'vitest';
import { stripTemplateComments } from '../../src/utils/template.js';

describe('stripTemplateComments', () => {
  it('should strip HTML comment lines', () => {
    const input = 'Hello\n<!-- comment -->\nWorld';
    expect(stripTemplateComments(input)).toBe('Hello\nWorld');
  });

  it('should preserve inline comments', () => {
    const input = 'Hello <!-- note --> World';
    expect(stripTemplateComments(input)).toBe('Hello <!-- note --> World');
  });

  it('should handle multiple comment lines', () => {
    const input = '<!-- a -->\nContent\n<!-- b -->\n<!-- c -->';
    expect(stripTemplateComments(input)).toBe('Content');
  });

  it('should handle empty input', () => {
    expect(stripTemplateComments('')).toBe('');
  });
});
```

### Integration Tests

Test the full command flow:

```typescript
// tests/commands/journal/add.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { add } from '../../../src/commands/journal/add.js';
import { journalStore } from '../../../src/lib/storage/journal-store.js';

// Mock editor to return predefined content
vi.mock('../../../src/utils/editor.js', () => ({
  openInEditor: vi.fn(() => {
    // Simulate user writing content
    return Promise.resolve('# My Journal\n\nTest content');
  }),
  detectEditor: vi.fn(() => Promise.resolve('vi')),
}));

describe('add command', () => {
  it('should create new journal entry', async () => {
    await add({ date: '20251210' });

    const entry = journalStore.load('20251210');
    expect(entry).not.toBeNull();
    expect(entry!.content).toContain('Test content');
    expect(entry!.metadata.synced).toBe(false);
  });

  it('should update existing entry', async () => {
    // Create initial entry
    await add({ date: '20251210' });
    const initial = journalStore.load('20251210')!;

    // Update entry
    await add({ date: '20251210' });
    const updated = journalStore.load('20251210')!;

    // Same ID, different updatedAt
    expect(updated.metadata.id).toBe(initial.metadata.id);
    expect(updated.metadata.createdAt).toBe(initial.metadata.createdAt);
    expect(updated.metadata.updatedAt).not.toBe(initial.metadata.updatedAt);
  });
});
```

## Common Issues

### Editor doesn't open

**Symptom:** Command hangs or exits immediately

**Causes:**

1. Editor not in PATH
2. Editor name misspelled
3. VS Code installed but `code` command not in PATH

**Solutions:**

```bash
# Check if editor exists
which vi    # Unix/Mac
where vi    # Windows

# For VS Code, ensure shell command is installed:
# Open VS Code → Cmd+Shift+P → "Shell Command: Install 'code' command in PATH"

# Set explicit editor path in config
papyrus config set editor "/usr/bin/vim"
```

### Template comments not stripped

**Symptom:** Template comments appear in saved file

**Causes:**

1. Template regex doesn't match comment format
2. Extra whitespace in comments

**Solutions:**

```typescript
// Debug: Log content before stripping
console.log('Before strip:', content);
const stripped = stripTemplateComments(content);
console.log('After strip:', stripped);

// Check if comments have exact format
// Must be: <!-- comment -->
// Not: <!--comment--> (no spaces)
// Not: <!-- comment --> extra text
```

### Content validation fails even with content

**Symptom:** "No content written" even though you wrote something

**Causes:**

1. Content is only whitespace
2. Content is only template comments

**Solutions:**

```typescript
// Add better logging
const finalContent = stripTemplateComments(editedContent);
console.log(`Content length after strip: ${finalContent.trim().length}`);

if (!finalContent.trim()) {
  console.log('⚠️  No content written. Entry not saved.');
  console.log('   (Content was only whitespace or template comments)');
  return;
}
```

### Metadata validation errors

**Symptom:** "ZodError: Invalid metadata"

**Causes:**

1. Manually edited frontmatter with invalid values
2. Missing required fields

**Solutions:**

```typescript
// Add better error handling in load()
try {
  const metadata = JournalMetadataSchema.parse(data);
  return { metadata, content };
} catch (error) {
  console.error(`Invalid metadata in ${date}.md:`);
  if (error instanceof z.ZodError) {
    error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
  }
  throw new Error(`Corrupted journal entry for ${date}`);
}
```

### Temp file not deleted

**Symptom:** Temp files accumulate in `/tmp` or `%TEMP%`

**Causes:**

1. Editor process killed (Ctrl+C)
2. Exception during save

**Solutions:**

Already handled in `openInEditor()` - cleanup happens in both `close` and `error` event handlers.

### Permission errors

**Symptom:** "EACCES: permission denied"

**Causes:**

1. Journals directory not writable
2. Existing file owned by different user

**Solutions:**

```bash
# Check permissions
ls -la ~/.local/share/papyrus/journals/

# Fix permissions
chmod 755 ~/.local/share/papyrus/journals/
chmod 644 ~/.local/share/papyrus/journals/*.md
```

### Wrong filename format created

**Symptom:** Files named `2025-12-10.md` instead of `20251210.md`

**Cause:** Using wrong date format in code

**Solution:** Always use `parseDate()` which returns YYYYMMDD:

```typescript
// ✅ Correct
const date = parseDate(options.date || 'today'); // Returns "20251210"
journalStore.save(date, entry); // Saves as 20251210.md

// ❌ Wrong
journalStore.save('2025-12-10', entry); // Saves as 2025-12-10.md
```

## Next Steps

1. **Implement `show` command** - Display journal entries
2. **Implement `list` command** - List all entries
3. **Implement `sync` command** - Sync with server
4. **Add search functionality** - Search through journals
5. **Add tags support** - Tag entries for organization
6. **Add statistics** - Visualize writing habits

## Key Takeaways

**External Editor Integration:**

1. **Use Node's built-in `child_process`**:

   ```typescript
   spawn('vi', [tempFile], { stdio: 'inherit' });
   // No external dependencies needed!
   ```

2. **Detect available editors**:

   ```typescript
   // Try multiple editors in order of preference
   // Use which/where to check existence
   ```

3. **Use temp files for editing**:
   ```typescript
   // Write to temp → Open editor → Read back
   // Clean up in both success and error cases
   ```

**Date Format Consistency:**

1. **YYYYMMDD everywhere**:

   ```typescript
   // Shared constant from @rewrlution/papyrus-shared
   DATE_FORMAT = 'yyyyMMdd';
   ```

2. **Filenames use YYYYMMDD**:

   ```typescript
   20251210.md  // ✅ Correct
   2025-12-10.md  // ❌ Wrong
   ```

3. **Use existing utilities**:
   ```typescript
   import { parseDate, formatDate } from '../../utils/date.js';
   // Already handles all formats and validations
   ```

**Template Processing:**

1. **Append template for guidance**:

   ```typescript
   const withTemplate = content + '\n\n' + JOURNAL_TEMPLATE;
   ```

2. **Strip template after editing**:

   ```typescript
   const final = stripTemplateComments(editedContent);
   // Remove HTML comment lines with regex
   ```

3. **Validate before saving**:
   ```typescript
   if (!finalContent.trim()) {
     // Don't save empty content
   }
   ```

**Storage Integration:**

1. **Check before create**:

   ```typescript
   const existing = journalStore.load(date); // date is YYYYMMDD
   // Load or create new
   ```

2. **Preserve metadata on update**:

   ```typescript
   // Keep same ID and createdAt
   // Update only updatedAt and content
   ```

3. **Mark as unsynced**:
   ```typescript
   metadata.synced = false; // Needs sync
   ```

## Complete File Reference

Files created/used in this tutorial:

```
src/
├── commands/
│   └── journal/
│       ├── add.ts             # Add command implementation (NEW)
│       └── index.ts           # Command registration (UPDATED)
├── utils/
│   ├── date.ts                # Date parsing utilities (existing)
│   ├── editor.ts              # Editor detection and launch (NEW)
│   └── template.ts            # Template and stripping (existing)
└── lib/
    └── storage/
        └── journal-store.ts   # Storage layer (UPDATED)
```

## References

- [gray-matter](https://github.com/jonschlinkert/gray-matter) - Frontmatter parser
- [uuid](https://github.com/uuidjs/uuid) - UUID generation
- [date-fns](https://date-fns.org/) - Date manipulation (already used)
- [Node.js child_process](https://nodejs.org/api/child_process.html) - Process execution
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [ARCHITECTURE-JOURNAL-STORAGE.md](./ARCHITECTURE-JOURNAL-STORAGE.md) - Storage format rationale
- [sync.md](./sync.md) - Sync algorithm
- [01-STORAGE-LAYER.md](./01-STORAGE-LAYER.md) - Storage foundation
