# Chapter 7: Running and Debugging Tests

## Running Tests

### Run All Tests

```bash
# Run all tests (unit + e2e)
pnpm test

# Or explicitly
pnpm vitest run
```

### Run Only E2E Tests

```bash
# Run all e2e tests
pnpm vitest run tests/e2e

# Or add script to package.json
{
  "scripts": {
    "test:e2e": "vitest run tests/e2e"
  }
}

# Then run
pnpm test:e2e
```

### Run Only Unit Tests

```bash
pnpm vitest run tests/unit
```

### Run Specific Scenario

```bash
# Run one scenario file
pnpm vitest run tests/e2e/scenarios/01-user-signup.test.ts

# Run multiple specific files
pnpm vitest run tests/e2e/scenarios/01-user-signup.test.ts tests/e2e/scenarios/02-journal-lifecycle.test.ts
```

### Run Tests Matching Pattern

```bash
# Run all tests with "journal" in filename
pnpm vitest run journal

# Run all tests with "auth" in filename
pnpm vitest run auth
```

### Watch Mode (Development)

```bash
# Watch all tests - re-runs on file changes
pnpm vitest watch

# Watch only e2e tests
pnpm vitest watch tests/e2e

# Watch specific file
pnpm vitest watch tests/e2e/scenarios/01-user-signup.test.ts
```

**Watch mode is great for development:**

- Automatically re-runs tests when you save files
- Shows which tests failed/passed
- Fast feedback loop

## Test Output

### Successful Run

```
✓ tests/e2e/scenarios/01-user-signup.test.ts (5) 1234ms
  ✓ Scenario: User Signup Flow (5)
    ✓ Step 1: User signs up with valid credentials 234ms
    ✓ Step 2: User cannot signup with duplicate email 123ms
    ✓ Step 3: User cannot signup with invalid email 89ms
    ✓ Step 4: User cannot signup with weak password 67ms
    ✓ Step 5: User cannot signup with missing fields 45ms

Test Files  1 passed (1)
     Tests  5 passed (5)
  Start at  10:30:00
  Duration  1.35s
```

### Failed Test

```
❌ tests/e2e/scenarios/01-user-signup.test.ts (5) 1234ms
  ✓ Scenario: User Signup Flow (5)
    ✓ Step 1: User signs up with valid credentials
    ❌ Step 2: User cannot signup with duplicate email

AssertionError: expected 201 to equal 400

- Expected: 400
+ Received: 201

 ❯ tests/e2e/scenarios/01-user-signup.test.ts:45:7
```

## Debugging Failed Tests

### 1. Read the Error Message

Vitest tells you exactly what failed:

```
AssertionError: expected 400 to equal 201
  at tests/e2e/scenarios/01-user-signup.test.ts:45:7
```

**This means:**

- Line 45, character 7
- Expected status 400, got 201
- Your API returned success when it should have failed

### 2. Add Console Logs

```typescript
it('should fail on duplicate email', async () => {
  const testUser = generateTestUser();

  // First signup
  await request(app).post('/auth/signup').send(testUser);

  // Second signup should fail
  const response = await request(app).post('/auth/signup').send(testUser);

  // Debug: Print response
  console.log('Status:', response.status);
  console.log('Body:', JSON.stringify(response.body, null, 2));

  expect(response.status).toBe(400);
});
```

### 3. Inspect Database State

```typescript
it('should create user', async () => {
  const testUser = generateTestUser();

  await request(app).post('/auth/signup').send(testUser);

  // Debug: Check what's in database
  const users = await testPrisma.user.findMany();
  console.log('Users in DB:', users.length);
  console.log(
    'User emails:',
    users.map((u) => u.email)
  );

  const user = await testPrisma.user.findUnique({
    where: { email: testUser.email },
  });
  console.log('Created user:', user);
});
```

### 4. Use Vitest's Built-in Debugging

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/vitest run tests/e2e/scenarios/01-user-signup.test.ts

# Then open Chrome DevTools:
# chrome://inspect
# Click "inspect" on the Node target
```

### 5. Run Single Test

Focus on one failing test:

```typescript
// Use .only to run just this test
it.only('should fail on duplicate email', async () => {
  // ... test code
});

// Or skip other tests
it.skip('other test', async () => {
  // This won't run
});
```

### 6. Increase Timeout for Debugging

```typescript
it('slow test', async () => {
  // ... test code
}, 30000); // 30 second timeout
```

Or globally:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds for all tests
  },
});
```

### 7. Check Test Isolation

If tests pass individually but fail together:

```bash
# Run individually
pnpm vitest run tests/e2e/scenarios/01-user-signup.test.ts  # ✅ Pass
pnpm vitest run tests/e2e/scenarios/02-journal-lifecycle.test.ts  # ✅ Pass

# Run together
pnpm vitest run tests/e2e  # ❌ Fail
```

**Likely cause:** Database not cleaned between scenarios

**Fix:**

```typescript
beforeAll(async () => {
  await setupTestDatabase(); // Make sure this is called!
});
```

## Common Issues and Solutions

### Issue 1: "Cannot connect to database"

**Error:**

```
PrismaClientInitializationError: Can't reach database server
```

**Solutions:**

1. Check PostgreSQL is running
2. Verify `TEST_DATABASE_URL` in `.env.test`
3. Ensure test database exists:
   ```bash
   psql -U postgres -c "CREATE DATABASE papyrus_test;"
   ```

### Issue 2: "Email already exists"

**Error:**

```
400 Bad Request: Email already exists
```

**Cause:** Database not cleaned between test runs

**Solution:**

```typescript
beforeAll(async () => {
  await setupTestDatabase(); // This should clean database
});
```

Or manually clean:

```bash
# Reset test database
psql -U postgres papyrus_test -c "TRUNCATE users, journals CASCADE;"
```

### Issue 3: "Invalid token"

**Error:**

```
401 Unauthorized: Invalid or expired token
```

**Cause:** Token not set or incorrect

**Debug:**

```typescript
it('should access protected route', async () => {
  console.log('Token:', authToken); // Is this defined?

  const response = await request(app)
    .get('/journal')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200);
});
```

**Solution:** Ensure login step succeeds first:

```typescript
it('Step 1: Login', async () => {
  const response = await request(app)
    .post('/auth/signin')
    .send({ email: 'test@test.com', password: 'pass' })
    .expect(200);

  authToken = response.body.data.token;
  console.log('Got token:', authToken); // Verify token is set
});
```

### Issue 4: Tests timeout

**Error:**

```
Test timed out in 5000ms.
```

**Causes:**

- Database operation taking too long
- Missing `await` on async operation
- Infinite loop

**Solutions:**

1. Check for missing `await`:

```typescript
// ❌ Wrong: No await
it('test', async () => {
  request(app).get('/health'); // This doesn't wait!
  expect(true).toBe(true);
});

// ✅ Correct: With await
it('test', async () => {
  await request(app).get('/health');
  expect(true).toBe(true);
});
```

2. Increase timeout:

```typescript
it('slow test', async () => {
  // ... slow operation
}, 15000); // 15 second timeout
```

### Issue 5: Schema mismatch

**Error:**

```
Invalid `prisma.user.create()` invocation:
Unknown field `verificationToken`
```

**Cause:** Test database schema outdated

**Solution:** Run migrations on test database:

```bash
# Set DATABASE_URL to test database
export DATABASE_URL="postgresql://localhost:5432/papyrus_test"

# Run migrations
pnpm prisma migrate deploy

# Or add script
{
  "scripts": {
    "test:db:migrate": "dotenv -e .env.test -- prisma migrate deploy"
  }
}
```

## Performance Optimization

### Run Tests in Parallel

Vitest runs test files in parallel by default:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false, // Enable parallel execution
      },
    },
  },
});
```

**Note:** Ensure scenarios are isolated (each cleans its own database)

### Reduce Database Cleanup Time

Only clean tables you're using:

```typescript
// Instead of cleaning all tables
export async function cleanDatabase() {
  await testPrisma.journal.deleteMany({});
  await testPrisma.user.deleteMany({});
  // Don't clean tables you don't use in tests
}
```

### Reuse Authenticated Users

Create once, use multiple times:

```typescript
describe('Multiple journal tests', () => {
  let authToken: string;

  beforeAll(async () => {
    const user = await createAuthenticatedUser(app);
    authToken = user.token; // Create once
  });

  it('test 1', async () => {
    await request(app)
      .get('/journal')
      .set('Authorization', `Bearer ${authToken}`);
  });

  it('test 2', async () => {
    await request(app)
      .post('/journal')
      .set('Authorization', `Bearer ${authToken}`);
  });

  // Both tests use same token - faster than creating user twice
});
```

## Continuous Integration (CI)

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: papyrus_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run migrations
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/papyrus_test

      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/papyrus_test
          JWT_SECRET: test-secret
          ENCRYPTION_KEY: test-encryption-key-32chars!!
```

## Test Scripts Cheat Sheet

Add these to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:e2e": "vitest run tests/e2e",
    "test:e2e:watch": "vitest watch tests/e2e",
    "test:unit": "vitest run tests/unit",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:db:setup": "dotenv -e .env.test -- prisma migrate deploy",
    "test:db:reset": "dotenv -e .env.test -- prisma migrate reset --force"
  }
}
```

**Usage:**

```bash
pnpm test                 # Run all tests once
pnpm test:watch           # Watch mode
pnpm test:e2e             # Only E2E tests
pnpm test:coverage        # With coverage report
pnpm test:ui              # Open Vitest UI in browser
pnpm test:db:setup        # Setup test database
```

## Vitest UI (Visual Test Runner)

Vitest has a web UI for running tests:

```bash
pnpm vitest --ui
```

Opens in browser at `http://localhost:51204/__vitest__/`

**Features:**

- Visual test tree
- Click to run individual tests
- See console output
- View test duration
- Filter by status (passed/failed)

## Key Takeaways

1. **Run specific tests** - Don't run all tests every time
2. **Use watch mode** - Get instant feedback during development
3. **Debug with console.log** - Inspect response and database state
4. **Check test isolation** - Each scenario should clean database
5. **Handle timeouts** - Add `await` and increase timeout if needed
6. **CI integration** - Run tests automatically on every commit

## Next Steps

You now know how to write and run E2E tests! Review the tutorial index for quick reference.

---

**[← Previous: More Scenarios](./06-more-scenarios.md) | [Next: Tutorial Index →](./00-index.md)**
