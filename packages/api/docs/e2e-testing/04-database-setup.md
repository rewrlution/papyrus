# Chapter 4: Setting Up the Test Database

## Why a Separate Test Database?

**Problem:** E2E tests need to create, update, and delete data. You don't want this to affect your development or production data!

**Solution:** Use a separate database just for testing.

```
Production:   papyrus           (real data, never touch in tests)
Development:  papyrus_dev       (local development)
Test:         papyrus_test      (test data only, cleaned frequently)
```

## Database Setup Strategy

You have **two options** for your test database:

1. **Remote Database (Easier)** - Use Supabase, Railway, Neon, etc.
2. **Local Database** - Set up PostgreSQL on your machine

### Option 1: Remote Database (Recommended for Getting Started)

**Perfect if you:**

- Want to get started quickly
- Already have a remote database provider (Supabase, Railway, Neon)
- Don't want to install PostgreSQL locally

**Using Supabase (Step-by-Step):**

1. **Create Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Click "New Project"
   - Name: `papyrus-test` (or any test-related name)
   - Choose region closest to you
   - Set database password (save this!)
   - Click "Create new project" (takes ~2 minutes)

2. **Get Connection String**
   - Go to Project Settings (gear icon) → Database
   - Scroll to "Connection String" section
   - Select "URI" tab
   - Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
   - Replace `[YOUR-PASSWORD]` with your actual database password

3. **Use in `.env.test`**
   - Paste the connection string as shown in Step 2 below

**Trade-offs:**

- ✅ Easy setup, no local installation
- ✅ Access from anywhere
- ⚠️ Slightly slower (network latency)
- ⚠️ Requires internet connection

### Option 2: Local Database

**Perfect if you:**

- Want faster test execution
- Prefer working offline
- Already have PostgreSQL installed

**Using PostgreSQL CLI:**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE papyrus_test;

# Verify
\l  # Lists all databases
```

**Using a GUI (pgAdmin, DBeaver, etc.):**

- Right-click → Create Database
- Name: `papyrus_test`

**Trade-offs:**

- ✅ Faster (no network latency)
- ✅ Works offline
- ⚠️ Requires PostgreSQL installation
- ⚠️ Only accessible from your machine

## Step 2: Configure Environment Variables

Create a `.env.test` file for test-specific configuration:

**For Remote Database (Supabase):**

```env
# .env.test

# Test Database (Supabase connection string)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
TEST_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# JWT Secret (can be different from prod)
JWT_SECRET="test-jwt-secret-key"

# Email (use test provider or mock)
EMAIL_PROVIDER="nodemailer"
EMAIL_FROM="test@papyrus.com"

# Encryption Key (use test key)
ENCRYPTION_KEY="test-encryption-key-32-characters"

# CORS (allow test origin)
CORS_ORIGIN="http://localhost:3000"
```

**For Local Database:**

```env
# .env.test

# Test Database (Local PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/papyrus_test"
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/papyrus_test"

# JWT Secret (can be different from prod)
JWT_SECRET="test-jwt-secret-key"

# Email (use test provider or mock)
EMAIL_PROVIDER="nodemailer"
EMAIL_FROM="test@papyrus.com"

# Encryption Key (use test key)
ENCRYPTION_KEY="test-encryption-key-32-characters"

# CORS (allow test origin)
CORS_ORIGIN="http://localhost:3000"
```

**Important:** Add `.env.test` to `.gitignore` to keep secrets safe!

### Step 3: Update Vitest Configuration

Tell Vitest to use the test environment:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      // Load .env.test file
      NODE_ENV: 'test',
    },
    setupFiles: ['./tests/e2e/setup.ts'], // Run setup before tests
    testTimeout: 10000, // 10 seconds
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

### Step 4: Load Test Environment

Update your environment config to load `.env.test`:

```typescript
// src/env/config.ts (or wherever you load env vars)
import { config } from 'dotenv';

// Load .env.test in test mode, .env otherwise
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: envFile });

// Your existing env validation...
```

## Creating `setup.ts` - Database Helpers

Now create the test setup file with full implementations:

```typescript
// tests/e2e/setup.ts

import { PrismaClient } from '@prisma/client';

/**
 * Separate Prisma client for test database
 * Uses TEST_DATABASE_URL from environment
 */
export const testPrisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL,
  log: process.env.DEBUG_TESTS ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Clean all data from test database
 * Order matters: delete child records before parent records
 */
export async function cleanDatabase() {
  // Delete all journals first (has foreign key to users)
  await testPrisma.journal.deleteMany({});

  // Then delete users
  await testPrisma.user.deleteMany({});

  console.log('✓ Test database cleaned');
}

/**
 * Setup test database before running tests
 * Called once before all test suites
 */
export async function setupTestDatabase() {
  try {
    // Ensure connection works
    await testPrisma.$connect();
    console.log('✓ Connected to test database');

    // Clean any existing data
    await cleanDatabase();

    console.log('✓ Test database ready');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Teardown test database after running tests
 * Called once after all test suites
 */
export async function teardownTestDatabase() {
  try {
    // Clean up any remaining data
    await cleanDatabase();

    // Disconnect from database
    await testPrisma.$disconnect();
    console.log('✓ Disconnected from test database');
  } catch (error) {
    console.error('Failed to teardown test database:', error);
    throw error;
  }
}

/**
 * Optional: Reset database to initial state
 * Useful if you want to seed test data
 */
export async function resetDatabase() {
  await cleanDatabase();

  // Optional: Add seed data here
  // await testPrisma.user.create({ ... });
}
```

## Database Cleanup Strategies

### Strategy 1: Clean Before Each Scenario (Recommended)

Each scenario file gets a fresh database:

```typescript
// tests/e2e/scenarios/01-user-signup.test.ts
import { beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '../setup.js';

describe('Scenario: User Signup', () => {
  beforeAll(async () => {
    await setupTestDatabase(); // Clean database before this scenario
  });

  afterAll(async () => {
    await teardownTestDatabase(); // Clean up after this scenario
  });

  // Tests...
});
```

**Pros:**

- Each scenario is completely isolated
- Scenarios can run in parallel
- Easier to debug (no data pollution)

**Cons:**

- Slightly slower (more cleanup operations)

### Strategy 2: Clean Once for All Scenarios

Clean database once before running all tests:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globalSetup: './tests/e2e/global-setup.ts', // Run once before all tests
    globalTeardown: './tests/e2e/global-teardown.ts', // Run once after all tests
  },
});

// tests/e2e/global-setup.ts
import { setupTestDatabase } from './setup.js';

export default async function () {
  await setupTestDatabase();
}

// tests/e2e/global-teardown.ts
import { teardownTestDatabase } from './setup.js';

export default async function () {
  await teardownTestDatabase();
}
```

**Pros:**

- Faster (less cleanup)

**Cons:**

- Scenarios share database state
- Must run sequentially
- Harder to debug

**Recommendation:** Use Strategy 1 (clean per scenario) for better isolation.

## Running Prisma Migrations on Test Database

Your test database needs the same schema as production. This works the same for **both remote and local databases**:

```bash
# Option 1: Run migrations using .env.test (works for both remote and local)
pnpm dotenv -e .env.test -- prisma migrate deploy

# Option 2: Or add a script to package.json (recommended)
{
  "scripts": {
    "test:db:migrate": "dotenv -e .env.test -- prisma migrate deploy"
  }
}

# Then run:
pnpm test:db:migrate
```

**Note:** Make sure you have `dotenv-cli` installed:

```bash
pnpm add -D dotenv-cli
```

**When to run migrations:**

- First time setting up test database
- After creating new migrations
- If tests fail with schema errors

## Handling Test Data

### Unique Data Per Test

Generate unique data to avoid conflicts:

```typescript
// tests/e2e/helpers.ts
import { randomUUID } from 'crypto';

export function generateTestEmail(): string {
  const timestamp = Date.now();
  const uuid = randomUUID().slice(0, 8);
  return `test-${timestamp}-${uuid}@example.com`;
}

export function generateTestUser() {
  return {
    email: generateTestEmail(),
    password: 'TestPassword123!',
  };
}

// Usage in tests
const user = generateTestUser();
// user.email = "test-1704067200000-a1b2c3d4@example.com"
```

**Why unique data?**

- Prevents "email already exists" errors
- Allows running same test multiple times
- Enables parallel test execution

### Shared Test Fixtures

For common test data, create helper functions:

```typescript
// tests/e2e/helpers.ts

export async function createTestUser(email?: string, password?: string) {
  const testEmail = email || generateTestEmail();
  const testPassword = password || 'TestPassword123!';

  await testPrisma.user.create({
    data: {
      email: testEmail,
      passwordHash: await hashPassword(testPassword), // [Placeholder: actual hash function]
      isVerified: true, // Pre-verified for easier testing
    },
  });

  return { email: testEmail, password: testPassword };
}

export async function createTestJournal(
  userId: string,
  date: string,
  content: string
) {
  // [Placeholder: Encrypt content]
  const encrypted = await encryptContent(content, userId);

  return await testPrisma.journal.create({
    data: {
      userId,
      date,
      hash: encrypted.hash,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    },
  });
}
```

## Debugging Database Issues

### Enable Query Logging

See what Prisma queries are running:

```typescript
// tests/e2e/setup.ts
export const testPrisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL,
  log: ['query', 'error', 'warn'], // Enable logging
});
```

### Inspect Database After Failed Test

Don't clean up if test fails:

```typescript
afterAll(async () => {
  if (process.env.KEEP_TEST_DATA) {
    console.log('Skipping cleanup - inspect database manually');
  } else {
    await teardownTestDatabase();
  }
});
```

Run with:

```bash
KEEP_TEST_DATA=1 pnpm test
```

### Verify Database Connection

Add a connection test:

```typescript
// tests/e2e/scenarios/00-database-connection.test.ts
import { describe, it, expect } from 'vitest';
import { testPrisma } from '../setup.js';

describe('Database Connection', () => {
  it('should connect to test database', async () => {
    const result = await testPrisma.$queryRaw`SELECT 1 as value`;
    expect(result).toBeDefined();
  });
});
```

## Security Best Practices

### 1. Never Use Production Database

```typescript
// Add safety check in setup.ts
if (process.env.DATABASE_URL?.includes('production')) {
  throw new Error('Cannot run tests against production database!');
}

if (!process.env.DATABASE_URL?.includes('test')) {
  throw new Error('DATABASE_URL must point to test database');
}
```

### 2. Separate Credentials

```env
# .env (production)
DATABASE_URL="postgresql://prod_user:prod_pass@prod_server/papyrus"

# .env.test (testing)
DATABASE_URL="postgresql://test_user:test_pass@localhost/papyrus_test"
```

### 3. Add .env.test to .gitignore

```gitignore
# .gitignore
.env
.env.test
.env.local
.env.*.local
```

## Quick Setup Checklist

- [ ] Create test database (remote Supabase OR local PostgreSQL)
- [ ] Create `.env.test` with TEST_DATABASE_URL (Supabase connection string OR local connection)
- [ ] Install `dotenv-cli`: `pnpm add -D dotenv-cli`
- [ ] Run migrations on test database: `pnpm dotenv -e .env.test -- prisma migrate deploy`
- [ ] Create `tests/e2e/setup.ts` with cleanup functions
- [ ] Update `vitest.config.ts` to load test environment
- [ ] Add safety checks to prevent running against production
- [ ] Test database connection with a simple test

## Key Takeaways

1. **Separate database** - Never test against production
2. **Clean between scenarios** - Each scenario gets fresh data
3. **Unique test data** - Generate unique emails/IDs to avoid conflicts
4. **Environment variables** - Use `.env.test` for test configuration
5. **Safety checks** - Verify you're using test database

## Next Steps

Now that the database is set up, let's write our first complete scenario test!

---

**[← Previous: Project Structure](./03-project-structure.md) | [Next: First Scenario →](./05-first-scenario.md)**
