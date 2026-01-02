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
│   ├── cli.tsx                    # Entry point with Commander setup
│   ├── index.tsx                  # Main exports
│   ├── commands/
│   │   ├── index.ts              # Command registration exports
│   │   ├── types.ts              # Command option types
│   │   ├── journal/
│   │   │   ├── index.ts          # Journal command registration
│   │   │   ├── add.ts            # Create new entry
│   │   │   ├── amend.ts          # Modify existing entry
│   │   │   ├── show.ts           # Display entry
│   │   │   ├── list.ts           # List all entries
│   │   │   └── sync.ts           # Sync with server
│   │   └── auth/
│   │       └── index.ts          # Auth command registration (login/logout/register)
│   └── components/
│       ├── App.tsx               # Root React component
│       └── Logo.tsx              # ASCII art logo with gradient
├── tests/
│   └── cli.test.ts               # Test files
├── dist/                         # Build output (generated)
├── package.json
├── tsconfig.json
└── CLAUDE.md                     # This file
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
- `papyrus show [-d <date>]` - Display an entry
- `papyrus list` or `papyrus ls` - List all entries
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

## Key Files

### `src/cli.tsx`

Entry point that:

- Sets up Commander.js program
- Registers all command groups
- Renders the Ink App component for visual feedback
- Parses command-line arguments

### `src/commands/types.ts`

TypeScript interfaces for command options. Uses inheritance to share common options across commands.

### `src/commands/journal/index.ts` & `src/commands/auth/index.ts`

Command registration functions that attach commands to the Commander program. Keeps CLI setup modular and organized.

### `src/components/Logo.tsx`

Displays ASCII art logo using box-drawing characters with gradient colors via Chalk. To create similar logos:

- Use ASCII art generators or design manually
- Apply colors with `chalk.color('text')`
- Combine multiple colored segments per line
- Use Ink's `<Text>` component to render in terminal

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
- **@rewrlution/papyrus-shared**: Shared utilities across packages

Dev dependencies:

- **tsx**: TypeScript executor for development
- **vitest**: Test runner
- **typescript**: Type checking and compilation

## Next Steps

To extend the CLI:

1. **Add date parsing utility** - Parse "yesterday", "2024-01-15", etc.
2. **Integrate editor** - Use `editor` package to open $EDITOR for journal entries
3. **Add prompts** - Use `@inquirer/prompts` for interactive questions
4. **Connect to API** - Integrate with `@rewrlution/papyrus-api`
5. **Local storage** - Store entries locally before syncing
6. **Rich formatting** - Use Ink components for better output display
7. **Configuration file** - Support `.papyrusrc` for user preferences

## Resources

- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Chalk Documentation](https://github.com/chalk/chalk)
- [React Documentation](https://react.dev)
- [Vitest Documentation](https://vitest.dev)
