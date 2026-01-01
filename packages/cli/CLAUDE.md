# Papyrus CLI - Claude Development Guide

This guide explains how to develop, run, and test the Papyrus CLI tool locally.

## Overview

The Papyrus CLI is an AI-powered journaling tool for developers. It's built using:

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
```

Or run it directly:

```bash
node dist/cli.js
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
│   ├── cli.tsx              # Entry point (#!/usr/bin/env node)
│   ├── index.tsx            # Main exports
│   └── components/
│       ├── App.tsx          # Root application component
│       └── Logo.tsx         # Colorful ASCII logo component
├── tests/
│   └── cli.test.ts          # Test files
├── dist/                    # Build output (generated)
├── package.json
├── tsconfig.json
└── CLAUDE.md               # This file
```

## Key Files

### `src/cli.tsx`

The executable entry point. Contains the shebang `#!/usr/bin/env node` and renders the main App component using Ink.

### `src/components/App.tsx`

The root React component that defines the CLI interface. Uses Ink components like `<Box>` and `<Text>` to create the terminal UI.

### `src/components/Logo.tsx`

Displays the colorful "PAPYRUS" ASCII art logo with gradient colors using Chalk.

## Package Scripts

| Script  | Command                 | Description                         |
| ------- | ----------------------- | ----------------------------------- |
| `build` | `tsc`                   | Compile TypeScript to JavaScript    |
| `dev`   | `tsx watch src/cli.tsx` | Run with hot reload for development |
| `start` | `node dist/cli.js`      | Run the built CLI                   |
| `test`  | `vitest run`            | Run tests once                      |

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

1. **Component tests**: Test Ink components using Ink's testing utilities
2. **Integration tests**: Test CLI commands and user interactions
3. **Snapshot tests**: Capture terminal output for regression testing

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { App } from '../src/components/App.js';

describe('App', () => {
  it('should render logo', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toContain('PAPYRUS');
  });
});
```

## Local Testing with Global Install

To test the CLI as if it were globally installed:

```bash
# From packages/cli
pnpm build
pnpm link --global

# Now you can run it anywhere
papyrus

# When done testing, unlink
pnpm unlink --global
```

## Debugging

### Using tsx directly

```bash
cd packages/cli
tsx src/cli.tsx
```

### Adding console.log

Since this is a CLI app, you can use `console.log()` or `console.error()` to debug. They won't interfere with Ink's rendering.

### VS Code Debugging

Add this to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug CLI",
  "runtimeExecutable": "tsx",
  "args": ["${workspaceFolder}/packages/cli/src/cli.tsx"],
  "skipFiles": ["<node_internals>/**"],
  "console": "integratedTerminal"
}
```

## Common Issues

### "Cannot find module"

- Make sure you've run `pnpm install` in the monorepo root
- Check that `@rewrlution/papyrus-shared` is built if it's a dependency

### Build errors

- Ensure TypeScript is installed: `pnpm add -D typescript`
- Check `tsconfig.json` is correctly configured
- Clean build: `rm -rf dist && pnpm build`

### Terminal rendering issues

- Make sure your terminal supports colors (most modern terminals do)
- Try running in a different terminal emulator
- Check if terminal width is sufficient

## Dependencies

Key dependencies and their purposes:

- **ink** (^6.6.0): React renderer for CLI apps
- **react** (^19.2.3): UI component framework
- **chalk** (^5.6.2): Terminal string styling
- **@rewrlution/papyrus-shared**: Shared utilities across packages

Dev dependencies:

- **tsx**: TypeScript executor for development
- **vitest**: Test runner
- **typescript**: Type checking and compilation

## Next Steps

To extend the CLI:

1. Add new commands (e.g., `papyrus new`, `papyrus list`)
2. Add command-line argument parsing (consider using `meow` or `commander`)
3. Integrate with the API package
4. Add interactive prompts (use `ink-text-input`, `ink-select-input`)
5. Implement the journaling functionality

## Resources

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Chalk Documentation](https://github.com/chalk/chalk)
- [React Documentation](https://react.dev)
- [Vitest Documentation](https://vitest.dev)
