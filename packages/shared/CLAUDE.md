# Papyrus Shared - Claude Development Guide

This guide explains the shared package that provides common types, schemas, and utilities used across the Papyrus monorepo.

## Overview

The `@rewrlution/papyrus-shared` package is a library that contains:

- **Zod Schemas** - Type-safe validation schemas for API requests/responses
- **TypeScript Types** - Shared type definitions derived from Zod schemas
- **Utilities** - Common functions used across packages (hashing, formatting)
- **Constants** - Shared constants (date formats, regex patterns)

**Purpose**: Ensure type safety and consistency across CLI, API, and any future packages.

## Prerequisites

This is a library package used by other packages in the monorepo. To use it:

```bash
# From monorepo root
pnpm install

# Build the shared package
cd packages/shared
pnpm build
```

## Development Workflow

### 1. Run in Development Mode

Watch for changes and rebuild automatically:

```bash
cd packages/shared
pnpm dev
```

This runs `tsc --watch` which:

- Watches for file changes
- Recompiles TypeScript on save
- Updates `dist/` folder automatically

### 2. Build the Package

Compile TypeScript to JavaScript:

```bash
cd packages/shared
pnpm build
```

This creates the `dist/` folder with compiled JavaScript and type definitions.

### 3. Run Tests

Run the test suite with Vitest:

```bash
cd packages/shared
pnpm test
```

Or from the monorepo root:

```bash
pnpm test --filter=@rewrlution/papyrus-shared
```

## Project Structure

```
packages/shared/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── schemas/
│   │   ├── index.ts                # Schema exports
│   │   ├── zod.ts                  # Zod re-export
│   │   ├── auth/
│   │   │   ├── index.ts            # Auth schema exports
│   │   │   ├── inputs.ts           # Signup, signin schemas
│   │   │   └── responses.ts        # Auth response schemas
│   │   ├── journal/
│   │   │   ├── index.ts            # Journal schema exports
│   │   │   ├── input.ts            # Journal input schemas
│   │   │   └── responses.ts        # Journal response schemas
│   │   └── common/
│   │       ├── index.ts            # Common schema exports
│   │       ├── constants.ts        # Date format constants
│   │       ├── date.ts             # Date validation schema
│   │       ├── journal.ts          # Journal type schemas
│   │       ├── user.ts             # User type schemas
│   │       ├── params.ts           # URL param schemas
│   │       └── response.ts         # Generic response schemas
│   └── utils/
│       ├── index.ts                # Utility exports
│       └── hash.ts                 # Content hashing utilities
├── tests/                          # Test files
├── dist/                           # Build output (generated)
├── package.json
├── tsconfig.json
└── CLAUDE.md                       # This file
```

## Architecture

The shared package follows a layered structure:

### Layer 1: Schemas (`src/schemas/`)

Zod validation schemas that define the shape and validation rules for data. These are the source of truth for types.

**Key concepts:**

- All schemas use Zod for runtime validation
- Schemas are decorated with `.openapi()` for API documentation
- TypeScript types are inferred from schemas using `z.infer<>`
- Schemas are organized by domain (auth, journal, common)

### Layer 2: Utilities (`src/utils/`)

Pure utility functions used across packages.

**Key concepts:**

- No dependencies on schemas or other packages
- Pure functions with no side effects
- Well-tested and documented

### Layer 3: Constants (`src/schemas/common/constants.ts`)

Shared constants used across the codebase.

**Key concepts:**

- Date format strings
- Regex patterns
- Magic numbers with clear names

## Key Schemas

### Date Schema (`src/schemas/common/date.ts`)

Validates date strings in YYYYMMDD format:

```typescript
export const DateStringSchema = z
  .string()
  .regex(DATE_FORMAT_REGEX, 'Date must be in YYYYMMDD format')
  .refine((date) => {
    // Validates that date is a real calendar date
    // e.g., 20260231 (Feb 31) would fail
  });

export type DateString = z.infer<typeof DateStringSchema>;
```

**Usage in CLI:**

```typescript
import { DateStringSchema } from '@rewrlution/papyrus-shared';

const result = DateStringSchema.safeParse('20260104');
if (result.success) {
  console.log('Valid date:', result.data);
}
```

**Usage in API:**

```typescript
import { DateStringSchema } from '@rewrlution/papyrus-shared';

// Validate request param
const { date } = req.params;
const validDate = DateStringSchema.parse(date); // Throws if invalid
```

### Auth Schemas (`src/schemas/auth/inputs.ts`)

Validation schemas for authentication:

```typescript
// Signup with password requirements
export const SignupSchema = z
  .object({
    email: z.email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Must be at least 8 characters long')
      .refine((val) => /[A-Z]/.test(val), 'Need uppercase')
      .refine((val) => /[a-z]/.test(val), 'Need lowercase')
      .refine((val) => /\d/.test(val), 'Need number')
      .refine((val) => /[@$!%*?&]/.test(val), 'Need special char'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof SignupSchema>;
```

**Why this approach:**

- Single source of truth for validation rules
- Frontend and backend use same validation
- Type-safe with TypeScript inference
- Error messages are consistent across the app

### Journal Schemas (`src/schemas/journal/`)

Schemas for journal operations (inputs and responses):

```typescript
// Example: Create journal input
export const CreateJournalSchema = z.object({
  date: DateStringSchema,
  content: z.string().min(1, 'Content cannot be empty'),
});

export type CreateJournalInput = z.infer<typeof CreateJournalSchema>;
```

**Usage:**

```typescript
// CLI: Validate before sending to API
const input: CreateJournalInput = { date, content };
const result = CreateJournalSchema.safeParse(input);

// API: Validate incoming request
app.post('/journals', (req, res) => {
  const body = CreateJournalSchema.parse(req.body);
  // body is now type-safe
});
```

## Utilities

### Content Hashing (`src/utils/hash.ts`)

Generate SHA-256 hashes for content comparison in sync:

```typescript
export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}
```

**Usage:**

```typescript
import { generateContentHash } from '@rewrlution/papyrus-shared';

const content = 'My journal entry';
const hash = generateContentHash(content); // "abc123..."

// Compare hashes to detect changes
if (localHash !== remoteHash) {
  console.log('Content has changed!');
}
```

**Why hashing:**

- Efficient comparison (64 chars vs entire content)
- Detects any changes in content
- Used for three-way sync algorithm

## Constants

### Date Format (`src/schemas/common/constants.ts`)

```typescript
export const DATE_FORMAT = 'yyyyMMdd';
export const DATE_FORMAT_REGEX = /^\d{8}$/;
```

**Usage:**

```typescript
import { DATE_FORMAT } from '@rewrlution/papyrus-shared';
import { format } from 'date-fns';

const today = format(new Date(), DATE_FORMAT); // "20260104"
```

## Package Exports

The package provides multiple entry points:

```json
{
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
  }
}
```

**Usage:**

```typescript
// Import everything
import {
  DateStringSchema,
  generateContentHash,
} from '@rewrlution/papyrus-shared';

// Import specific subpackage
import { generateContentHash } from '@rewrlution/papyrus-shared/utils';
import { DateStringSchema } from '@rewrlution/papyrus-shared/schemas';
```

## How Zod Works

Zod is a TypeScript-first schema validation library:

```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  name: z.string().min(1),
  age: z.number().positive(),
});

// Infer TypeScript type
type User = z.infer<typeof UserSchema>;
// Result: { name: string; age: number }

// Validate data
const result = UserSchema.safeParse({ name: 'Alice', age: 30 });
if (result.success) {
  console.log(result.data); // Type-safe!
} else {
  console.log(result.error); // Validation errors
}
```

**Key features:**

- Runtime validation + compile-time types
- Composable schemas
- Rich error messages
- Zero dependencies

## Adding New Schemas

To add a new schema:

1. **Create schema file** in appropriate domain:

   ```typescript
   // src/schemas/journal/delete.ts
   export const DeleteJournalSchema = z.object({
     date: DateStringSchema,
     force: z.boolean().optional(),
   });

   export type DeleteJournalInput = z.infer<typeof DeleteJournalSchema>;
   ```

2. **Export from domain index:**

   ```typescript
   // src/schemas/journal/index.ts
   export * from './delete.js';
   ```

3. **Use in CLI/API:**

   ```typescript
   import { DeleteJournalSchema } from '@rewrlution/papyrus-shared';

   // Validate input
   const result = DeleteJournalSchema.safeParse(input);
   ```

## Testing Schemas

Example test for date validation:

```typescript
import { describe, it, expect } from 'vitest';
import { DateStringSchema } from '../src/schemas/common/date.js';

describe('DateStringSchema', () => {
  it('should accept valid date', () => {
    const result = DateStringSchema.safeParse('20260104');
    expect(result.success).toBe(true);
  });

  it('should reject invalid format', () => {
    const result = DateStringSchema.safeParse('2026-01-04');
    expect(result.success).toBe(false);
  });

  it('should reject invalid date', () => {
    const result = DateStringSchema.safeParse('20260231'); // Feb 31
    expect(result.success).toBe(false);
  });
});
```

## Dependencies

Key dependencies:

- **zod** (^4.2.1): Schema validation library
- **@asteasolutions/zod-to-openapi** (^8.2.0): Generate OpenAPI specs from Zod schemas

Dev dependencies:

- **typescript**: Type checking and compilation
- **vitest**: Test runner

## Design Decisions

### Why Zod?

**Decision**: Use Zod for all validation schemas instead of plain TypeScript types.

**Reasoning:**

- Runtime validation (catches invalid data at runtime)
- Single source of truth (types derived from schemas)
- Better error messages (user-friendly validation errors)
- OpenAPI integration (automatic API docs)

**Trade-off:** Adds runtime overhead, but worth it for type safety and validation.

### Why Shared Package?

**Decision**: Extract common types and utilities into separate package.

**Reasoning:**

- DRY principle (no duplicate schemas in CLI and API)
- Type consistency (both use same types)
- Easier maintenance (change once, update everywhere)
- Potential for future packages (web UI, mobile app)

**Trade-off:** Adds complexity to build process, but worth it for consistency.

### Why SHA-256 for Hashing?

**Decision**: Use SHA-256 for content hashing in sync.

**Reasoning:**

- Collision resistance (extremely unlikely to have duplicate hashes)
- Fast computation (quick to generate hashes)
- Standard algorithm (widely supported)
- Fixed output size (64 hex characters)

**Alternative considered:** MD5 (faster but less secure, not suitable for content verification).

## Common Issues

### "Cannot find module '@rewrlution/papyrus-shared'"

**Solution:** Build the shared package first:

```bash
cd packages/shared
pnpm build
```

### Schema validation fails in tests

**Solution:** Check that test data matches schema requirements:

```typescript
// Bad: Missing required fields
const result = UserSchema.safeParse({ name: 'Alice' });

// Good: All required fields
const result = UserSchema.safeParse({ name: 'Alice', age: 30 });
```

### Type errors when using schemas

**Solution:** Ensure you're using `z.infer<>` to extract types:

```typescript
// Bad: Manual type definition (can get out of sync)
type User = { name: string; age: number };

// Good: Infer from schema
type User = z.infer<typeof UserSchema>;
```

## Best Practices

1. **Always use schemas for validation**
   - Don't trust user input
   - Validate at boundaries (API endpoints, CLI inputs)

2. **Derive types from schemas**
   - Use `z.infer<>` instead of manual types
   - Keeps types and validation in sync

3. **Add descriptive error messages**
   - Use `.refine()` with custom messages
   - Help users understand what's wrong

4. **Test edge cases**
   - Test valid and invalid inputs
   - Test boundary conditions
   - Test error messages

5. **Keep utilities pure**
   - No side effects
   - Easy to test
   - Predictable behavior

## Future Enhancements

Potential improvements:

1. **More utility functions**
   - Date formatting helpers
   - String sanitization
   - File path utilities

2. **Enhanced schemas**
   - Tag validation
   - Rich text content
   - File attachment metadata

3. **Error handling**
   - Custom error classes
   - Error code constants
   - Error translation utilities

4. **API types**
   - Request/response types
   - Pagination schemas
   - Filter/sort schemas

## Resources

- [Zod Documentation](https://zod.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Vitest Documentation](https://vitest.dev)
