# Part 4: Building the CLI - Terminal Application with Ink

Welcome to Part 4! We've built a shared package and an API. Now let's create something unique: a **CLI (Command-Line Interface) application** that also uses our shared code.

## The Big Picture

We're building a terminal application using **Ink** - a framework that lets you build CLI apps with React! Yes, React in the terminal. 🤯

Our CLI will:

- Display formatted messages using `formatMessage()` from shared
- Generate session IDs using `generateId()` from shared
- Show a nice UI in the terminal
- Be installable as a command (`myapp`)

## What is Ink?

Ink lets you write terminal UIs with React components. Instead of rendering to a browser, it renders to your terminal. Think of it as `create-react-app` but for command-line tools!

**Example:** Tools like `gatsby`, `next`, and `prisma` use similar tech for their CLIs.

## What You'll Learn

- How to build CLI applications with Ink
- How to use React in a non-browser environment
- How to configure JSX with TypeScript
- How to make an executable command
- How to share code between API and CLI

## Step 1: Create the Package Structure

Create the CLI package folders:

```bash
mkdir -p packages/cli/src/components
mkdir -p packages/cli/tests
```

Your monorepo now has:

```
packages/
├── shared/    (utilities)
├── api/       (Express server)
└── cli/       (terminal app - new!)
    ├── src/
    │   └── components/
    └── tests/
```

## Step 2: Configure the Package

Create `packages/cli/package.json`:

```json
{
  "name": "@myapp/cli",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "myapp": "./dist/cli.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/cli.tsx",
    "start": "node dist/cli.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@myapp/shared": "workspace:*",
    "ink": "^5.0.1",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "tsx": "^4.19.2"
  }
}
```

**New concepts:**

- `"bin": { "myapp": "./dist/cli.js" }` - Creates a command called `myapp` that runs your CLI
- `ink` - The React renderer for terminals
- `react` - Yes, actual React! (but rendering to terminal instead of DOM)

## Step 3: Install Dependencies

From the root:

```bash
pnpm install
```

This installs Ink and React for your CLI package.

## Step 4: Configure TypeScript for JSX

Create `packages/cli/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"],
  "references": [{ "path": "../shared" }]
}
```

**New options:**

- `"jsx": "react-jsx"` - Use the new JSX transform (no need to import React in every file!)
- `"jsxImportSource": "react"` - Tell TypeScript to use React's JSX

## Step 5: Create Your First Component

Create `packages/cli/src/components/App.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { formatMessage, generateId } from '@myapp/shared';

export function App() {
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setMessage(formatMessage('CLI is running'));
    setSessionId(generateId());
  }, []);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="green">
      <Box marginBottom={1}>
        <Text bold color="green">
          MyApp CLI
        </Text>
      </Box>

      <Box flexDirection="column" gap={1}>
        <Text>
          <Text color="cyan">Status:</Text> {message}
        </Text>
        <Text>
          <Text color="cyan">Session ID:</Text> {sessionId}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
}
```

**Understanding this component:**

- It's just React! `useState`, `useEffect`, etc. all work
- Instead of `<div>` we use `<Box>` (Ink's container component)
- Instead of CSS, we use props like `padding`, `borderStyle`, `color`
- We import `formatMessage` and `generateId` from our shared package!

**Ink components:**

- `<Box>` - Container (like `<div>`)
- `<Text>` - Text display (like `<span>`)
- Both accept layout props (flexbox-style)

## Step 6: Create the CLI Entry Point

Create `packages/cli/src/cli.tsx`:

```typescript
#!/usr/bin/env node
import { render } from 'ink';
import { App } from './components/App.js';

render(<App />);
```

**Important details:**

- `#!/usr/bin/env node` - **Shebang** line! Tells the OS: "Run this with Node.js"
- `render(<App />)` - Renders your React component to the terminal
- The `.js` extension in the import (ESM requirement)

The shebang makes this file executable as a command.

## Step 7: Create Programmatic API

Create `packages/cli/src/index.tsx`:

```typescript
export { App } from "./components/App.js";
```

This allows other packages to import your CLI components if needed.

## Step 8: Add Tests

Create `packages/cli/tests/cli.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { App } from "../src/index.js";

describe("CLI", () => {
  it("should export App component", () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe("function");
  });
});
```

Create `packages/cli/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

## Step 9: Build the CLI

From the root:

```bash
pnpm build
```

Turbo will build all three packages in dependency order:

1. `@myapp/shared` (no dependencies)
2. `@myapp/api` and `@myapp/cli` (both depend on shared)

All should build successfully!

## Step 10: Run Your CLI

Run it directly:

```bash
cd packages/cli
pnpm start
```

You should see a beautiful terminal UI:

```
╭──────────────────────────────────────╮
│                                      │
│ MyApp CLI                            │
│                                      │
│ Status: [MyApp] CLI is running       │
│                                      │
│ Session ID: 1234567890-abc123        │
│                                      │
│ Press Ctrl+C to exit                 │
│                                      │
╰──────────────────────────────────────╯
```

Press `Ctrl+C` to exit.

## Step 11: Install as a Global Command

Want to run `myapp` from anywhere? Link it:

```bash
# From the root
pnpm --filter @myapp/cli link --global
```

Now you can run:

```bash
myapp
```

From any directory! 🎉

## Understanding the Magic

When you run `myapp`:

1. The OS reads the shebang (`#!/usr/bin/env node`)
2. Runs the file with Node.js
3. Node loads your compiled JavaScript
4. Ink renders your React component to the terminal
5. Uses `formatMessage` and `generateId` from the shared package

Three packages working together seamlessly!

## Development Mode

For development with hot reload:

```bash
cd packages/cli
pnpm dev
```

Now edit `src/components/App.tsx` and watch your CLI update automatically!

## Try It Yourself: Add User Input

Let's make it interactive! Update `App.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { Text, Box, useInput } from 'ink';
import { formatMessage, generateId } from '@myapp/shared';

export function App() {
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    setMessage(formatMessage('CLI is running'));
    setSessionId(generateId());
  }, []);

  useInput((input, key) => {
    if (key.upArrow) {
      setCount(c => c + 1);
    }
    if (key.downArrow) {
      setCount(c => c - 1);
    }
    if (input === 'q') {
      process.exit(0);
    }
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="green">
      <Box marginBottom={1}>
        <Text bold color="green">
          MyApp CLI
        </Text>
      </Box>

      <Box flexDirection="column" gap={1}>
        <Text>
          <Text color="cyan">Status:</Text> {message}
        </Text>
        <Text>
          <Text color="cyan">Session ID:</Text> {sessionId}
        </Text>
        <Text>
          <Text color="cyan">Counter:</Text> {count}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑ ↓ to change counter | q to quit</Text>
      </Box>
    </Box>
  );
}
```

Rebuild and run:

```bash
pnpm build
pnpm start
```

Now you can:

- Press ↑ to increment the counter
- Press ↓ to decrement it
- Press `q` to quit

Interactive CLI with React! 🚀

## Component Composition

You can create multiple components. Add `packages/cli/src/components/Counter.tsx`:

```typescript
import { Text, Box } from 'ink';

interface CounterProps {
  value: number;
}

export function Counter({ value }: CounterProps) {
  return (
    <Box>
      <Text color="yellow">Count: {value}</Text>
    </Box>
  );
}
```

Then use it in `App.tsx`:

```typescript
import { Counter } from './Counter.js';

// Inside your component:
<Counter value={count} />
```

It's just React - all the patterns you know work here!

## What We've Accomplished

You've built a CLI that:

✅ Uses React for terminal UIs (with Ink)
✅ Imports shared utilities and types
✅ Can be installed as a global command
✅ Supports user input and interactivity
✅ Has tests
✅ Builds with TypeScript

## The Monorepo Advantage

Notice how all three packages share code:

```
@myapp/shared (formatMessage, generateId, types)
    ↓                           ↓
@myapp/api              @myapp/cli
(uses in endpoints)     (uses in UI)
```

Change `formatMessage` in shared, rebuild - both API and CLI get the update!

## Common Issues and Solutions

**Issue:** `Cannot find module 'ink'`
**Solution:** Run `pnpm install` at the root

**Issue:** JSX syntax errors
**Solution:** Check `"jsx": "react-jsx"` in tsconfig.json

**Issue:** CLI doesn't render properly
**Solution:** Make sure you're running in a real terminal (not integrated terminal in some IDEs)

**Issue:** `command not found: myapp`
**Solution:** Run `pnpm --filter @myapp/cli link --global` after building

## Ink Components Cheat Sheet

Here are some useful Ink components:

```typescript
// Layout
<Box flexDirection="row" gap={1}>       // Container
<Spacer />                               // Flexible space

// Text
<Text bold>Bold text</Text>
<Text color="green">Colored</Text>
<Text dimColor>Faded text</Text>

// Input
<TextInput value={value} onChange={setValue} />

// Loading
<Spinner type="dots" />

// Borders
<Box borderStyle="round" borderColor="cyan">
```

Full docs: [https://github.com/vadimdemedes/ink](https://github.com/vadimdemedes/ink)

## Summary

You've learned:

1. How to build CLI applications with Ink
2. How to use React in a terminal environment
3. How to make executable commands
4. How to share code between different types of packages
5. How to add interactivity to CLIs

**Next:** [Part 5 - Workflow and Best Practices →](05-workflow-and-best-practices.md)

In the final tutorial, we'll explore the complete development workflow: testing everything together, linting, formatting, and advanced Turbo features. You'll learn how to work efficiently in your monorepo!
