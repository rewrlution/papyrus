# Part 2: Creating Your First Package - Shared Utilities

Welcome back! In Part 1, we set up the foundation of our monorepo. Now it's time to create your first package. We'll start with the **shared** package because both our API and CLI will depend on it.

## The Big Picture

Think of the shared package as your **toolbox**. It contains:

- Utility functions (like formatting messages)
- Data types/interfaces (like User, ApiResponse)
- Validation logic
- Anything you want to reuse across multiple packages

When your API needs to format a message, it imports from shared. When your CLI needs to validate an email, it imports from shared. One source of truth!

## What We'll Build

Our shared package will have:

- **Utilities** - Helper functions like `formatMessage()`, `generateId()`
- **Schemas** - TypeScript types like `User`, `ApiResponse`
- **Tests** - To make sure everything works
- **Build output** - Compiled JavaScript that other packages can import

## Step 1: Create the Package Structure

Create the folder structure:

```bash
mkdir -p packages/shared/src/utils
mkdir -p packages/shared/src/schemas
mkdir -p packages/shared/tests
```

Your project now looks like:

```
my-monorepo/
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── utils/
│       │   └── schemas/
│       └── tests/
└── [config files]
```

## Step 2: Create Package Configuration

Every package needs its own `package.json`. Create `packages/shared/package.json`:

```json
{
  "name": "@myapp/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    },
    "./schemas": {
      "import": "./dist/schemas/index.js",
      "types": "./dist/schemas/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Understanding the key parts:**

- `"name": "@myapp/shared"` - The `@myapp/` prefix is a "scope" (like a namespace)
- `"type": "module"` - We're using ESM (modern imports/exports)
- `"main"` and `"types"` - Entry points for the package
- `"exports"` - Allows users to import specific parts:
  - `import { formatMessage } from '@myapp/shared'` → uses default export
  - `import { formatMessage } from '@myapp/shared/utils'` → uses utils directly
- `"files": ["dist"]` - Only publish the built code, not source

## Step 3: Configure TypeScript

Create `packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

This extends the root config and adds:

- `"outDir": "./dist"` - Compiled files go here
- `"rootDir": "./src"` - Source files are here
- `"composite": true"` - Allows other packages to reference this one

## Step 4: Write Your First Utility

Create `packages/shared/src/utils/index.ts`:

```typescript
/**
 * Format a message with a prefix
 */
export function formatMessage(message: string): string {
  return `[MyApp] ${message}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

**What we created:**

- `formatMessage()` - Adds a prefix to any message
- `isValidEmail()` - Simple email validation
- `generateId()` - Creates unique IDs using timestamp + random string

These are simple but useful utilities that both API and CLI will need!

## Step 5: Create Data Schemas

Create `packages/shared/src/schemas/index.ts`:

```typescript
/**
 * User schema
 */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

/**
 * API Response schema
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Validate user data
 */
export function validateUser(user: Partial<User>): user is User {
  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    user.createdAt instanceof Date
  );
}
```

**Understanding TypeScript types:**

- `interface User` - Defines the shape of a user object
- `ApiResponse<T>` - Generic type (works with any data type)
- `validateUser()` - Type guard function (checks if data matches User type)

## Step 6: Create the Main Entry Point

Create `packages/shared/src/index.ts`:

```typescript
export * from "./utils/index.js";
export * from "./schemas/index.js";
```

**Important:** Notice the `.js` extension! Even though we're writing `.ts` files, when using ESM with TypeScript, you must use `.js` in imports. TypeScript will figure it out.

This file re-exports everything, so users can do:

```typescript
import { formatMessage, User } from "@myapp/shared";
```

## Step 7: Add Tests

Create `packages/shared/tests/utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatMessage, isValidEmail, generateId } from "../src/utils/index.js";

describe("formatMessage", () => {
  it("should format message with prefix", () => {
    const result = formatMessage("Hello World");
    expect(result).toBe("[MyApp] Hello World");
  });
});

describe("isValidEmail", () => {
  it("should validate correct email", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
  });

  it("should reject invalid email", () => {
    expect(isValidEmail("invalid")).toBe(false);
  });
});

describe("generateId", () => {
  it("should generate unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
```

This creates basic tests to verify our utilities work correctly.

## Step 8: Configure Testing

Create `packages/shared/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

This configures Vitest (our test runner) for a Node.js environment.

## Step 9: Build Your Package

Now comes the exciting part - let's build it!

```bash
# From the root of your monorepo
pnpm build
```

You should see:

```
@myapp/shared:build: > tsc
```

And a new `packages/shared/dist/` folder should appear with compiled JavaScript!

## Step 10: Run Tests

Verify everything works:

```bash
pnpm test
```

You should see all tests passing:

```
✓ tests/utils.test.ts (6 tests)
  Test Files  1 passed (1)
  Tests  6 passed (6)
```

## Verify Your Package

Let's check what we built:

```bash
# Look at the compiled output
ls packages/shared/dist/
```

You should see:

- `index.js` and `index.d.ts` - Main entry point
- `utils/` folder with compiled utilities
- `schemas/` folder with compiled schemas

Try opening `packages/shared/dist/index.js` - you'll see compiled JavaScript with source maps!

## Understanding ESM Imports (Important!)

When writing TypeScript with ESM, remember:

```typescript
// ✅ CORRECT - Use .js extension
import { formatMessage } from "./utils/index.js";

// ❌ WRONG - Will cause runtime errors
import { formatMessage } from "./utils/index";
import { formatMessage } from "./utils/index.ts";
```

Even though your file is named `.ts`, you import it with `.js`. This is because:

1. TypeScript compiles `.ts` → `.js`
2. Node.js only understands `.js`
3. TypeScript is smart enough to find the `.ts` file during compilation

## What We've Accomplished

You now have a working package with:

✅ Utility functions that other packages can use
✅ TypeScript types for type safety
✅ A working build process
✅ Tests that verify functionality
✅ Proper package exports

Your structure:

```
packages/shared/
├── src/
│   ├── index.ts                 (main entry)
│   ├── utils/index.ts           (utilities)
│   └── schemas/index.ts         (types)
├── tests/
│   └── utils.test.ts            (tests)
├── dist/                        (built code - gitignored)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Try It Yourself: Add a New Utility

Before moving on, try adding your own utility function:

1. Add this to `packages/shared/src/utils/index.ts`:

```typescript
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
```

2. Add a test in `packages/shared/tests/utils.test.ts`:

```typescript
describe("capitalize", () => {
  it("should capitalize first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });
});
```

3. Rebuild and test:

```bash
pnpm build
pnpm test
```

All tests should still pass, including your new one!

## Common Issues and Solutions

**Issue:** `Cannot find module './utils/index.js'`
**Solution:** Make sure you're using `.js` extension in imports (not `.ts`)

**Issue:** Build fails with module errors
**Solution:** Check `"type": "module"` is in package.json

**Issue:** Tests don't run
**Solution:** Make sure you ran `pnpm install` at the root

## Summary

You've created your first package! You learned:

1. How to structure a package in a monorepo
2. How to configure TypeScript for ESM
3. How to export utilities and types
4. How to write and run tests
5. How to build distributable code

**Next:** [Part 3 - Building the API →](03-building-the-api.md)

In the next tutorial, we'll create an Express API that **uses** this shared package. You'll see the power of monorepos when we import `formatMessage` and `User` from `@myapp/shared` effortlessly!
