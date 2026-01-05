# Papyrus CLI - Claude Development Guide

This guide explains how to develop, run, and test the Papyrus CLI tool locally.

## Overview

The Papyrus CLI is an AI-powered journaling tool for developers. It's built using:

- **Commander.js** - Command-line interface framework with git-like commands
- **Ink** - React for interactive CLI applications
- **React** - Component-based UI (rendered in terminal)
- **Chalk** - Terminal string styling and colors
- **TypeScript** - Type-safe development

## Prerequisites

Make sure you're in the monorepo root and have installed dependencies:

```bash
cd /path/to/papyrus
pnpm install
```

## Development Workflow

### 1. Run in Development Mode

The fastest way to develop and see live changes:

```bash
cd packages/cli
pnpm dev
```

This runs `tsx watch src/cli.tsx` which:

- Watches for file changes
- Auto-reloads on save
- No build step required
- Instant feedback

### 2. Build the CLI

To compile TypeScript to JavaScript:

```bash
cd packages/cli
pnpm build
```

This creates the `dist/` folder with compiled JavaScript files.

### 3. Test the Built CLI

After building, test the production version:

```bash
cd packages/cli
pnpm start

# Or run it directly
node dist/cli.js

# Test specific commands
node dist/cli.js add
node dist/cli.js list
node dist/cli.js show --date yesterday
```

### 4. Run Tests

Run the test suite with Vitest:

```bash
cd packages/cli
pnpm test
```

Or from the monorepo root:

```bash
pnpm test --filter=@rewrlution/papyrus-cli
```

## Project Structure

```
packages/cli/
├── src/
│   ├── cli.tsx                        # Entry point with Commander setup
│   ├── commands/
│   │   ├── index.ts                  # Command registration exports
│   │   ├── types.ts                  # Command option types
│   │   ├── auth/
│   │   │   ├── index.ts              # Auth command registration
│   │   │   ├── login.ts              # Login command (Ink form)
│   │   │   ├── logout.ts             # Logout command
│   │   │   └── register.ts           # Register command (Ink form)
│   │   └── journal/
│   │       ├── index.ts              # Journal command registration
│   │       ├── add.ts                # Create new entry (editor)
│   │       ├── amend.ts              # Modify existing entry (editor)
│   │       ├── edit.ts               # Edit utilities
│   │       ├── show.ts               # Display entry
│   │       ├── list.ts               # List all entries
│   │       └── sync.ts               # Sync with server
│   ├── components/
│   │   ├── Browser.tsx               # Interactive journal browser
│   │   ├── BrowserHeader.tsx         # Browser header (title, count)
│   │   ├── BrowserFooter.tsx         # Browser footer (shortcuts)
│   │   ├── JournalListView.tsx       # Virtual scrolling journal list
│   │   ├── JournalViewer.tsx         # Full journal reader with scrolling
│   │   ├── ColdStart.tsx             # Cold start aware spinner
│   │   ├── FormInput.tsx             # Reusable form input component
│   │   ├── LoginForm.tsx             # Login form (email/password)
│   │   ├── RegisterForm.tsx          # Registration form (multi-step)
│   │   ├── StatusMessage.tsx         # Status message display
│   │   ├── SyncProgress.tsx          # Sync progress with real-time updates
│   │   └── Logo.tsx                  # ASCII art logo with gradient
│   ├── lib/
│   │   ├── api/
│   │   │   ├── api-client.ts         # Axios-based API client
│   │   │   └── index.ts              # API client exports
│   │   ├── auth/
│   │   │   ├── require-auth.ts       # Reusable auth middleware
│   │   │   └── index.ts              # Auth utilities exports
│   │   ├── storage/
│   │   │   ├── base-storage.ts       # Base storage class (XDG)
│   │   │   ├── config-store.ts       # Config storage
│   │   │   ├── journal-storage.ts    # Journal storage (Markdown)
│   │   │   ├── sync-meta-store.ts    # Sync metadata storage
│   │   │   ├── token-store.ts        # JWT token storage
│   │   │   └── index.ts              # Storage exports
│   │   └── sync/
│   │       └── sync-engine.ts        # Hash-based sync logic
│   └── utils/
│       ├── date.ts                   # Date parsing utilities
│       ├── editor.ts                 # External editor integration
│       ├── template.ts               # Journal template utilities
│       └── token.ts                  # JWT token utilities
├── docs/                             # Tutorial documentation
│   ├── README.md                     # Documentation index
│   ├── 01-STORAGE-LAYER.md          # Storage layer tutorial
│   ├── 02-API-CLIENT-SETUP.md       # API client tutorial
│   ├── 03-REACT-CLI-COMPONENTS.md   # Ink components tutorial
│   ├── 04-LOGIN-IMPLEMENTATION.md   # Login feature tutorial
│   ├── 05-REGISTER-IMPLEMENTATION.md # Register feature tutorial
│   ├── 06-JOURNAL-ADD-IMPLEMENTATION.md # Journal commands tutorial
│   ├── 07-SYNC-IMPLEMENTATION.md    # Sync feature tutorial
│   ├── 08-TOKEN-MANAGEMENT.md       # Token management tutorial
│   ├── 09-LIST-BROWSE-MIGRATION.md # List/browse feature migration
│   ├── ARCHITECTURE-JOURNAL-STORAGE.md # ADR for journal format
│   ├── sync.md                       # Sync algorithm explanation
│   ├── cold-start-handling.md       # Cold start handling
│   └── token-expiration-handling.md # Token expiration strategies
├── tests/
│   └── cli.test.ts                   # Test files
├── dist/                             # Build output (generated)
├── package.json
├── tsconfig.json
└── CLAUDE.md                         # This file
```

## Command Architecture

### Command Registration Pattern

The CLI uses a modular command registration pattern:

```typescript
// src/cli.tsx
const program = new Command();

program
  .name('papyrus')
  .description('AI-powered developer journaling')
  .version('1.0.0');

// Register command groups
registerAuthCommands(program);
registerJournalCommands(program);

program.parse(process.argv);
```

### Available Commands

#### Journal Commands

- `papyrus add [-d <date>]` - Create a new journal entry
- `papyrus amend [-d <date>]` - Modify an existing entry
- `papyrus show [-d <date>]` - Display an entry in reader view
- `papyrus list` or `papyrus ls` - Browse all entries interactively
- `papyrus sync` - Sync journals with server

#### Auth Commands

- `papyrus login` - Log in to your account
- `papyrus logout` - Log out from your account
- `papyrus register` - Create a new account

### Command Types

Command option types are defined in `src/commands/types.ts`:

```typescript
export interface DateOption {
  date?: string; // e.g., "20260101", "yesterday", "today"
}

export interface AddOptions extends DateOption {}
export interface AmendOptions extends DateOption {}
export interface ShowOptions extends DateOption {}
```

This pattern allows commands to share common options (like `--date`) while maintaining type safety.

### Adding New Commands

To add a new command:

1. **Create command handler** in appropriate directory:

   ```typescript
   // src/commands/journal/delete.ts
   export async function deleteEntry(options: DeleteOptions): Promise<void> {
     // Implementation
   }
   ```

2. **Add types** if needed in `src/commands/types.ts`:

   ```typescript
   export interface DeleteOptions extends DateOption {
     force?: boolean;
   }
   ```

3. **Register the command** in the appropriate index file:
   ```typescript
   // src/commands/journal/index.ts
   program
     .command('delete')
     .description('Delete a journal entry')
     .option('-d, --date <date>', 'Date of entry to delete')
     .option('-f, --force', 'Skip confirmation')
     .action(async (options) => await deleteEntry(options));
   ```

## User Feedback & Messaging Patterns

The CLI uses a **dual messaging strategy** for consistent, compact user feedback:

### When to Use Console (msg utility)

Use `src/utils/messages.ts` functions for **simple, non-interactive commands**:

- ✅ Quick confirmations (logout, delete)
- ✅ Simple errors (file not found, invalid input)
- ✅ One-off informational messages
- ✅ Progress messages in transactional commands

**Available functions:**

```typescript
import * as msg from '../utils/messages.js';

// Success messages
msg.success('Logged out successfully');
msg.sparkles('Created your first journal entry!'); // Special occasions

// Error messages (exits with code 1)
msg.error('Journal not found', "Run 'papyrus list' to see all entries");

// Informational messages
msg.info('Opening in vim...');
msg.warn('Token expires in 5 minutes'); // Non-fatal warnings
msg.hint('Press Ctrl+C to cancel');
msg.stats('Uploaded: 3, Downloaded: 1, Conflicts: 0');
```

**Key characteristics:**

- Instant output (no React rendering overhead)
- Always compact spacing (`\n` before and after)
- Consistent icons (✅, ❌, 📖, ⚠️, 💡, 📊, ✨)
- `msg.error()` automatically exits with error code

### When to Use Ink Components

Use Ink components for **interactive, stateful, or rich UI**:

- ✅ Multi-step forms (login, register)
- ✅ Interactive browsers (list/read journals)
- ✅ Real-time progress (sync with live updates)
- ✅ Components with user input (keyboard navigation)

**Available components:**

```typescript
import { StatusMessage } from '../components/StatusMessage.js';
import { SyncProgress } from '../components/SyncProgress.js';
import { Browser } from '../components/Browser.js';

// Status messages with optional hints
<StatusMessage
  type="error"
  message="Invalid email address"
  hint="Use format: user@example.com"
/>

// Real-time progress updates
<SyncProgress
  currentFile={filename}
  totalFiles={10}
  processed={5}
/>
```

**Key characteristics:**

- Always compact (no marginTop/marginBottom)
- Consistent icons matching msg utility (✅, ❌, ℹ️, 🔄️)
- Supports hints with 💡 prefix
- Manages own state and lifecycle

### Messaging Guidelines

1. **Keep it compact** - Single `\n` before/after messages, no extra spacing
2. **Use consistent icons** - Same icons across console and Ink (✅, ❌, 💡, etc.)
3. **Provide helpful hints** - Add contextual help when users might be stuck
4. **Exit on fatal errors** - Use `msg.error()` to exit immediately with error code
5. **Non-blocking warnings** - Use `msg.warn()` for non-fatal issues

### Example: Migrating to New Pattern

**Before:**

```typescript
console.log(`\n✨ Created new entry for ${date}\n`);
console.error(`\n❌ Error: Journal not found`);
console.error(`💡 Run 'papyrus list' to see all entries\n`);
process.exit(1);
```

**After:**

```typescript
import * as msg from '../utils/messages.js';

msg.sparkles(`Created new entry for ${date}`);
msg.error('Journal not found', "Run 'papyrus list' to see all entries");
```

**Benefits:**

- Consistent spacing and icons
- Less boilerplate code
- Automatic process.exit() on errors
- Easier to maintain

## Architecture Overview

The CLI is organized into clear layers following separation of concerns:

### Layer 1: Commands (`src/commands/`)

- **Entry points** for user actions
- **Thin layer** that delegates to lib/ and utils/
- **Type-safe** with shared option types
- **Authenticated commands** use `ensureAuthenticated()` from auth middleware

### Layer 2: Business Logic (`src/lib/`)

- **API Client** - HTTP client for backend communication (Axios)
- **Auth Middleware** - Reusable authentication checking (`requireAuth`, `ensureAuthenticated`)
- **Storage** - Cross-platform file storage following XDG Base Directory spec
- **Sync Engine** - Hash-based three-way sync with conflict resolution

### Layer 3: Utilities (`src/utils/`)

- **Pure functions** with no side effects
- **Date parsing** - Parse "today", "yesterday", "YYYYMMDD"
- **Token utilities** - JWT decoding and expiration checking
- **Editor integration** - Launch external editors ($EDITOR)
- **Template handling** - Journal entry templates

### Layer 4: UI (`src/components/`)

- **React components** rendered in terminal via Ink
- **Interactive forms** - Login, register (multi-step)
- **Progress displays** - Sync progress with real-time updates
- **Reusable components** - Input, status messages, spinners

## Key Architecture Decisions

### Storage Layer (XDG Base Directory)

- **Platform-agnostic** paths (`~/.local/share/papyrus/`, `~/.config/papyrus/`)
- **Markdown with YAML frontmatter** for journals (human-editable)
- **Separate stores** for journals, tokens, config, sync metadata
- See: `docs/ARCHITECTURE-JOURNAL-STORAGE.md`

### Token Management (Decoupled)

- **JWT utilities** (`src/utils/token.ts`) - Pure functions for token operations
- **Auth middleware** (`src/lib/auth/`) - Reusable across all authenticated commands
- **Proactive validation** - Check expiration before operations
- **Consistent error messages** - All commands use same auth checking
- See: `docs/08-TOKEN-MANAGEMENT.md`

### Sync Strategy (Hash-Based)

- **Three-way comparison** using content hashes (SHA-256)
- **Per-device sync state** - No server coordination needed
- **Conflict resolution** - Automatic merging when both sides changed
- **Progress callbacks** - Real-time UI updates during sync
- See: `docs/07-SYNC-IMPLEMENTATION.md` and `docs/sync.md`

### API Client (Axios + Interceptors)

- **Automatic token injection** - Request interceptor adds auth header
- **Error handling** - Response interceptor handles 401s
- **Type-safe** - Uses shared types from `@rewrlution/papyrus-shared`
- **Timeout handling** - 90s timeout for cold starts
- See: `docs/02-API-CLIENT-SETUP.md`

## Key Files and Modules

### `src/cli.tsx`

Entry point that:

- Sets up Commander.js program
- Registers all command groups (auth, journal)
- Parses command-line arguments

### `src/commands/types.ts`

TypeScript interfaces for command options. Uses inheritance to share common options (like `--date`) across commands.

### `src/commands/journal/` & `src/commands/auth/`

Command handlers that:

- Parse options and validate input
- Call business logic from `lib/`
- Render Ink components for interactive UIs
- Handle errors and provide user feedback

### `src/lib/api/api-client.ts`

HTTP client for backend communication:

- Axios instance with base URL and timeout
- Request interceptor for automatic token injection
- Handles all API operations (auth, journals)
- Type-safe responses using shared types

### `src/lib/auth/require-auth.ts`

Reusable authentication middleware:

- `requireAuth()` - Returns detailed auth status
- `ensureAuthenticated()` - Validates or exits (convenience function)
- Checks token existence, expiration, and warns when expiring soon
- Consistent error messages across all commands

### `src/lib/storage/`

Cross-platform storage implementations:

- `BaseStorage` - Abstract base class with XDG path resolution
- `JournalStore` - Markdown file storage for journal entries
- `TokenStore` - Secure JWT token storage
- `SyncMetaStore` - Tracks last synced hashes per journal
- `ConfigStore` - App configuration storage

### `src/lib/sync/sync-engine.ts`

Hash-based synchronization logic:

- Three-way comparison (local, remote, last synced)
- Conflict detection and automatic merging
- Progress callbacks for UI updates
- Returns statistics (uploaded, downloaded, conflicts)

### `src/utils/token.ts`

Pure functions for JWT operations:

- `getTokenExpiration()` - Extract exp claim
- `isTokenExpired()` - Check if token is expired
- `isTokenExpiringSoon()` - Check if expiring within threshold
- `getTimeUntilExpiration()` - Human-readable time string

### `src/utils/date.ts`

Date parsing utilities:

- Parse "today", "yesterday", "tomorrow"
- Parse "YYYYMMDD" format
- Validate date strings

### `src/utils/editor.ts`

External editor integration:

- Detect $EDITOR, $VISUAL environment variables
- Fallback to common editors (vim, vi, nano, code)
- Launch editor and wait for completion
- Handle temp file creation and cleanup

### `src/components/`

React/Ink UI components:

- `Browser` - Interactive journal browser with list/reader views
- `BrowserHeader` - Header showing title and journal count
- `BrowserFooter` - Footer showing keyboard shortcuts
- `JournalListView` - Virtual scrolling list of journal entries
- `JournalViewer` - Full journal reader with line numbers and scrolling
- `LoginForm` - Email/password form with validation
- `RegisterForm` - Multi-step registration (email → password → confirm)
- `SyncProgress` - Real-time sync progress with spinner
- `FormInput` - Reusable input component
- `ColdStartAwareSpinner` - Spinner with cold start warning
- `Logo` - ASCII art logo with gradient colors

## Package Scripts

| Script  | Command                 | Description                         |
| ------- | ----------------------- | ----------------------------------- |
| `build` | `tsc`                   | Compile TypeScript to JavaScript    |
| `dev`   | `tsx watch src/cli.tsx` | Run with hot reload for development |
| `start` | `node dist/cli.js`      | Run the built CLI                   |
| `test`  | `vitest run`            | Run tests once                      |

## How Commander.js Works

Commander.js provides a git-like CLI interface:

```typescript
program
  .command('add') // Command name
  .description('Create a new journal entry') // Help text
  .option('-d, --date <date>', 'Entry date', 'today') // Option with default
  .alias('a') // Short alias
  .action(async (options) => {
    // Handler
    await addEntry(options);
  });
```

**Key features:**

- Automatic help generation (`--help`)
- Subcommands and aliases
- Options with defaults and validation
- Version management (`--version`)
- Error handling

## How Ink Works

Ink lets you build CLI apps using React components:

```tsx
import { Box, Text } from 'ink';

export function App() {
  return (
    <Box flexDirection="column">
      <Text color="green">Hello from terminal!</Text>
    </Box>
  );
}
```

- Uses flexbox for layout
- Renders to terminal instead of browser
- Components re-render on state changes
- Supports hooks, context, and all React features

## Testing Strategy

Current tests are minimal. To add more tests:

1. **Command tests**: Test command handlers directly

   ```typescript
   import { addEntry } from '../src/commands/journal/add.js';

   it('should create entry for today', async () => {
     await addEntry({ date: 'today' });
     // Assert entry was created
   });
   ```

2. **CLI integration tests**: Test full command execution

   ```typescript
   import { execSync } from 'child_process';

   it('should show help', () => {
     const output = execSync('node dist/cli.js --help').toString();
     expect(output).toContain('papyrus');
   });
   ```

3. **Component tests**: Test Ink components

   ```typescript
   import { render } from 'ink-testing-library';
   import { App } from '../src/components/App.js';

   it('should render logo', () => {
     const { lastFrame } = render(<App />);
     expect(lastFrame()).toContain('PAPYRUS');
   });
   ```

## Local Testing with Global Install

To test the CLI as if it were globally installed:

```bash
# From packages/cli
pnpm build
pnpm link --global

# Now you can run it anywhere
papyrus add
papyrus list
papyrus show --date yesterday

# When done testing, unlink
pnpm unlink --global
```

## Debugging

### Using tsx directly

```bash
cd packages/cli
tsx src/cli.tsx add --date today
tsx src/cli.tsx list
```

### Adding console.log

Use `console.log()` or `console.error()` for debugging. They won't interfere with Ink's rendering.

### VS Code Debugging

Add this to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug CLI",
  "runtimeExecutable": "tsx",
  "args": [
    "${workspaceFolder}/packages/cli/src/cli.tsx",
    "add",
    "--date",
    "today"
  ],
  "skipFiles": ["<node_internals>/**"],
  "console": "integratedTerminal"
}
```

Change the `args` array to test different commands.

## Common Issues

### "Cannot find module"

- Run `pnpm install` in the monorepo root
- Check that `@rewrlution/papyrus-shared` is built if it's a dependency

### Build errors

- Ensure TypeScript is installed: `pnpm add -D typescript`
- Check `tsconfig.json` is correctly configured
- Clean build: `rm -rf dist && pnpm build`

### Terminal rendering issues

- Ensure terminal supports colors (most modern terminals do)
- Try running in a different terminal emulator
- Check if terminal width is sufficient

### Commander not parsing arguments

- Make sure `program.parse()` is called at the end
- Check that command names don't conflict
- Verify options use correct syntax (`-d, --date <value>`)

## Dependencies

Key dependencies and their purposes:

- **commander** (^14.0.2): CLI framework for git-like commands
- **ink** (^6.6.0): React renderer for CLI apps
- **react** (^19.2.3): UI component framework
- **chalk** (^5.6.2): Terminal string styling and colors
- **axios**: HTTP client for API communication
- **jwt-decode**: JWT token decoding (for expiration checking)
- **env-paths**: Cross-platform path resolution (XDG)
- **execa**: Process execution for external editor
- **@rewrlution/papyrus-shared**: Shared types and utilities

Dev dependencies:

- **tsx**: TypeScript executor for development
- **vitest**: Test runner
- **typescript**: Type checking and compilation
- **@types/\***: TypeScript type definitions

## Documentation

Comprehensive tutorials are available in the `docs/` directory:

### Getting Started

- **[Tutor Principles](../../../docs/TUTOR-PRINCIPLES.md)** - Guidelines for writing documentation (read first!)
- **[README](./docs/README.md)** - Documentation index and learning path

### Foundation Tutorials

1. **[Storage Layer](./docs/01-STORAGE-LAYER.md)** - XDG-based cross-platform storage
2. **[API Client Setup](./docs/02-API-CLIENT-SETUP.md)** - HTTP client with authentication
3. **[React CLI Components](./docs/03-REACT-CLI-COMPONENTS.md)** - Building UIs with Ink

### Feature Implementation

4. **[Login Implementation](./docs/04-LOGIN-IMPLEMENTATION.md)** - Interactive login form
5. **[Register Implementation](./docs/05-REGISTER-IMPLEMENTATION.md)** - Multi-step registration
6. **[Journal Commands](./docs/06-JOURNAL-ADD-IMPLEMENTATION.md)** - Add, amend, show commands
7. **[Sync Implementation](./docs/07-SYNC-IMPLEMENTATION.md)** - Hash-based synchronization
8. **[Token Management](./docs/08-TOKEN-MANAGEMENT.md)** - Decoupled auth middleware
9. **[List & Browse](./docs/09-LIST-BROWSE-MIGRATION.md)** - Interactive journal browser

### Architecture Decisions

- **[Journal Storage Format](./docs/ARCHITECTURE-JOURNAL-STORAGE.md)** - Why Markdown with YAML frontmatter
- **[Sync Strategy](./docs/sync.md)** - Hash-based three-way comparison algorithm
- **[Cold Start Handling](./docs/cold-start-handling.md)** - Managing serverless cold starts
- **[Token Expiration](./docs/token-expiration-handling.md)** - Handling JWT expiration

## Completed Features

The following features are fully implemented:

- ✅ **Authentication** - Login, logout, register with JWT tokens
- ✅ **Token management** - Decoupled, reusable auth checking with expiration warnings
- ✅ **Journal storage** - Markdown files with YAML frontmatter (XDG paths)
- ✅ **Date parsing** - Support for "today", "yesterday", "YYYYMMDD"
- ✅ **External editor** - Integration with $EDITOR, $VISUAL (vim, nano, code)
- ✅ **Journal commands** - Add, amend, show commands
- ✅ **Interactive browser** - List and read journals with vim-style navigation
- ✅ **Sync engine** - Hash-based three-way sync with conflict resolution
- ✅ **API client** - Axios with interceptors for auth and error handling
- ✅ **Interactive forms** - Login and registration using Ink
- ✅ **Cold start handling** - Spinner with warning for serverless cold starts
- ✅ **Real-time progress** - Sync progress with live updates

## Future Enhancements

Potential improvements and new features:

1. **Enhanced conflict resolution**
   - Interactive conflict resolution (choose local/remote/merge)
   - Diff view for conflicts
   - Custom merge strategies

2. **Search and filtering**
   - Full-text search across journals
   - Filter by date range
   - Tag support

3. **Rich formatting**
   - Syntax highlighting for Markdown display
   - Better table rendering
   - Image preview (if terminal supports it)

4. **Configuration**
   - User preferences (`.papyrusrc`)
   - Custom editor per file type
   - Sync frequency settings

5. **Offline mode**
   - Queue operations when offline
   - Auto-sync when connection restored
   - Offline indicator in commands

6. **Export/Import**
   - Export to PDF, HTML
   - Import from other formats
   - Backup and restore

7. **Advanced journal features**
   - Templates for different journal types
   - Attachments support
   - Encryption for sensitive entries

## Resources

- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Chalk Documentation](https://github.com/chalk/chalk)
- [React Documentation](https://react.dev)
- [Vitest Documentation](https://vitest.dev)
