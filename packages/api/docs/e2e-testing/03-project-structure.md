# Chapter 3: Organizing Your E2E Tests

## Current Test Structure

Your API already has some tests. Let's look at the current structure:

```
packages/api/
├── src/                           # Source code
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   └── ...
├── tests/                         # Test files
│   ├── domain/
│   │   └── mappers/
│   │       └── journal.mapper.test.ts   # Unit test
│   ├── env/
│   │   └── config.test.ts               # Unit test
│   └── middleware/
│       └── validate.test.ts             # Unit test
├── vitest.config.ts              # Vitest configuration
└── package.json
```

**Current tests** are unit tests - they test individual functions in isolation.

## Recommended E2E Structure

We'll add a new `e2e` folder for scenario-based tests:

```
packages/api/
├── tests/
│   ├── unit/                     # Move existing tests here
│   │   ├── domain/
│   │   ├── env/
│   │   └── middleware/
│   │
│   └── e2e/                      # NEW: E2E tests
│       ├── setup.ts              # Database setup/teardown helpers
│       ├── helpers.ts            # Shared test utilities
│       │
│       └── scenarios/            # Scenario-based test suites
│           ├── 01-user-signup.test.ts
│           ├── 02-user-journal-workflow.test.ts
│           ├── 03-journal-crud.test.ts
│           └── 04-auth-edge-cases.test.ts
```

## File Naming Conventions

### Unit Tests

```
[module-name].test.ts          # Unit tests
journal.mapper.test.ts         # Tests journal.mapper.ts
validate.test.ts               # Tests validate.ts
```

### E2E Tests

```
[scenario-name].test.ts        # Scenario-based E2E tests
user-signup.test.ts           # Tests signup flow
user-journal-workflow.test.ts # Tests complete user journey
```

**Tip:** Number scenario files (01-, 02-) to show recommended execution order.

## The Three Key Files

### 1. `setup.ts` - Database Lifecycle

This file handles test database connection and cleanup:

```typescript
// tests/e2e/setup.ts

import { PrismaClient } from '@prisma/client';

// Separate Prisma client for tests
export const testPrisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL,
});

/**
 * Clean all data from test database
 * Call this before/after test suites
 */
export async function cleanDatabase() {
  // [Placeholder: Delete all records]
  // Order matters: delete child records first
  await testPrisma.journal.deleteMany({});
  await testPrisma.user.deleteMany({});
}

/**
 * Setup test database before running tests
 */
export async function setupTestDatabase() {
  await cleanDatabase();
}

/**
 * Teardown test database after running tests
 */
export async function teardownTestDatabase() {
  await cleanDatabase();
  await testPrisma.$disconnect();
}
```

**Key Concept:** We use a separate database for tests so we don't affect production data.

### 2. `helpers.ts` - Reusable Test Utilities

This file contains helper functions used across multiple scenarios:

```typescript
// tests/e2e/helpers.ts

import { randomUUID } from 'crypto';
import type { Express } from 'express';
import request from 'supertest';

/**
 * Generate unique test email
 * Ensures tests can run multiple times without conflicts
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${randomUUID()}@example.com`;
}

/**
 * Generate test user credentials
 */
export function generateTestUser() {
  return {
    email: generateTestEmail(),
    password: 'TestPassword123!',
  };
}

/**
 * Helper: Create and authenticate a user
 * Returns auth token for authenticated requests
 */
export async function createAuthenticatedUser(app: Express) {
  // [Placeholder: Signup + Signin flow]
  const user = generateTestUser();

  // Step 1: Signup
  await request(app).post('/auth/signup').send(user);

  // Step 2: [Placeholder: Verify email]

  // Step 3: Signin
  const response = await request(app).post('/auth/signin').send(user);

  return {
    token: response.body.data.token,
    email: user.email,
  };
}
```

**Key Concept:** Helpers reduce code duplication and make tests more readable.

### 3. Scenario Test Files

Each scenario file tests one complete user workflow:

```typescript
// tests/e2e/scenarios/01-user-signup.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../../src/app.js';
import { setupTestDatabase, teardownTestDatabase } from '../setup.js';
import { generateTestUser } from '../helpers.js';

describe('Scenario: User Signup Flow', () => {
  let app: Express;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('Step 1: User signs up with valid credentials', async () => {
    // [Placeholder: Full implementation in next chapter]
  });

  it('Step 2: User cannot signup with duplicate email', async () => {
    // [Placeholder: Full implementation in next chapter]
  });
});
```

## Understanding Test Isolation

### Scenario-Level Isolation

Each scenario file gets a **clean database**:

```typescript
// scenarios/01-user-signup.test.ts
beforeAll(async () => {
  await setupTestDatabase(); // Clean database
});

// scenarios/02-user-journal.test.ts
beforeAll(async () => {
  await setupTestDatabase(); // Clean database again
});
```

**Result:** Each scenario runs independently, no shared state between files.

### Step-Level Sharing

Within a scenario, steps **share state**:

```typescript
describe('Scenario: User creates journal', () => {
  let authToken: string; // Shared between steps

  it('Step 1: User logs in', async () => {
    const response = await request(app)
      .post('/auth/signin')
      .send({ email: 'test@test.com', password: 'pass' });

    authToken = response.body.data.token; // Save for next step
  });

  it('Step 2: User creates journal', async () => {
    await request(app)
      .post('/journal')
      .set('Authorization', `Bearer ${authToken}`) // Use token from step 1
      .send({ date: '20251230', content: 'My journal' });
  });
});
```

**Key Concept:** Steps within a scenario form a sequence, like a real user's actions.

## TypeScript Configuration

To make imports work, ensure your `tsconfig.json` includes test files:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

## Vitest Configuration

Update `vitest.config.ts` to support E2E tests:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/**/*.test.ts', // Includes both unit and e2e tests
    ],
    testTimeout: 10000, // 10 seconds (E2E tests may be slower)
  },
});
```

## Running Different Test Types

### Run All Tests

```bash
pnpm test
```

### Run Only Unit Tests

```bash
pnpm vitest run tests/unit
```

### Run Only E2E Tests

```bash
pnpm vitest run tests/e2e
```

### Run Specific Scenario

```bash
pnpm vitest run tests/e2e/scenarios/01-user-signup.test.ts
```

### Watch Mode (Re-run on Changes)

```bash
pnpm vitest watch tests/e2e
```

## Organization Best Practices

### 1. One Scenario Per File

```
✅ Good: user-signup.test.ts
✅ Good: user-journal-workflow.test.ts
❌ Bad: all-tests.test.ts (too broad)
```

### 2. Descriptive Scenario Names

```
✅ Good: "Scenario: New user creates their first journal"
❌ Bad: "Test journal creation"
```

### 3. Sequential Steps

```typescript
it('Step 1: User signs up', async () => {
  /* ... */
});
it('Step 2: User verifies email', async () => {
  /* ... */
});
it('Step 3: User logs in', async () => {
  /* ... */
});
```

### 4. Extract Common Logic to Helpers

```typescript
// ❌ Bad: Duplicate code in every test
it('should create journal', async () => {
  const user = { email: `test-${Date.now()}@test.com`, password: 'pass' };
  await request(app).post('/auth/signup').send(user);
  const res = await request(app).post('/auth/signin').send(user);
  const token = res.body.data.token;
  // ... actual test logic
});

// ✅ Good: Use helper
it('should create journal', async () => {
  const { token } = await createAuthenticatedUser(app);
  // ... actual test logic
});
```

## Folder Structure Summary

```
tests/
├── unit/                          # Fast, isolated tests
│   ├── domain/
│   ├── env/
│   └── middleware/
│
└── e2e/                           # Slow, integrated tests
    ├── setup.ts                   # Database lifecycle
    ├── helpers.ts                 # Reusable utilities
    │
    └── scenarios/                 # User workflows
        ├── 01-user-signup.test.ts
        ├── 02-user-journal-workflow.test.ts
        └── ...
```

## Key Takeaways

1. **Separation:** Unit tests and E2E tests in different folders
2. **Setup file:** Handles database connection and cleanup
3. **Helpers file:** Contains reusable test utilities
4. **Scenario files:** One file per user workflow
5. **Isolation:** Each scenario gets a clean database
6. **Sharing:** Steps within a scenario share state

## Next Steps

Now let's set up the test database properly!

---

**[← Previous: Tools Overview](./02-tools-overview.md) | [Next: Database Setup →](./04-database-setup.md)**
