# Chapter 5: Writing Your First Scenario Test

## The Scenario: User Signup Flow

Let's write a complete E2E test for the user signup workflow:

1. User signs up with email and password
2. System creates account and sends verification email
3. User cannot sign up with duplicate email
4. User cannot sign up with invalid data

This scenario tests your entire auth system: validation, database, email service, and API responses.

## Step 1: Create the Test File

Create the file:

```
tests/e2e/scenarios/01-user-signup.test.ts
```

## Step 2: Write the Complete Test

Here's the full, working test with detailed comments:

```typescript
// tests/e2e/scenarios/01-user-signup.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

// Import your app factory
import { createApp } from '../../../src/app.js';

// Import database helpers
import {
  setupTestDatabase,
  teardownTestDatabase,
  testPrisma,
} from '../setup.js';

// Import test utilities
import { generateTestEmail, generateTestUser } from '../helpers.js';

describe('Scenario: User Signup Flow', () => {
  let app: Express;

  // Setup: Run once before all tests in this scenario
  beforeAll(async () => {
    // Clean and prepare test database
    await setupTestDatabase();

    // Create Express app instance
    app = createApp();
  });

  // Teardown: Run once after all tests in this scenario
  afterAll(async () => {
    // Clean up and disconnect from database
    await teardownTestDatabase();
  });

  // Test 1: Happy path - successful signup
  it('Step 1: User signs up with valid credentials', async () => {
    // Arrange: Prepare test data
    const testUser = generateTestUser();

    // Act: Make POST request to signup endpoint
    const response = await request(app)
      .post('/auth/signup')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201); // Expect 201 Created status

    // Assert: Check response structure
    expect(response.body).toEqual({
      success: true,
      message: expect.any(String),
      data: {
        userId: expect.any(String),
        email: testUser.email,
      },
    });

    // Assert: Verify user was created in database
    const userInDb = await testPrisma.user.findUnique({
      where: { email: testUser.email },
    });

    expect(userInDb).toBeDefined();
    expect(userInDb?.email).toBe(testUser.email);
    expect(userInDb?.isVerified).toBe(false); // Not verified yet
    expect(userInDb?.passwordHash).toBeDefined();
    expect(userInDb?.passwordHash).not.toBe(testUser.password); // Should be hashed
  });

  // Test 2: Duplicate email should fail
  it('Step 2: User cannot signup with duplicate email', async () => {
    // Arrange: Create first user
    const testUser = generateTestUser();

    // First signup - should succeed
    await request(app)
      .post('/auth/signup')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201);

    // Act: Try to signup again with same email
    const response = await request(app)
      .post('/auth/signup')
      .send({
        email: testUser.email,
        password: 'DifferentPassword123!',
      })
      .expect(400); // Expect 400 Bad Request

    // Assert: Check error response
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('already exists');
  });

  // Test 3: Invalid email format should fail
  it('Step 3: User cannot signup with invalid email', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({
        email: 'not-a-valid-email', // Invalid format
        password: 'ValidPassword123!',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  // Test 4: Weak password should fail
  it('Step 4: User cannot signup with weak password', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({
        email: generateTestEmail(),
        password: '123', // Too weak
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  // Test 5: Missing fields should fail
  it('Step 5: User cannot signup with missing fields', async () => {
    // Missing email
    const response1 = await request(app)
      .post('/auth/signup')
      .send({
        password: 'ValidPassword123!',
      })
      .expect(400);

    expect(response1.body.success).toBe(false);

    // Missing password
    const response2 = await request(app)
      .post('/auth/signup')
      .send({
        email: generateTestEmail(),
      })
      .expect(400);

    expect(response2.body.success).toBe(false);
  });
});
```

## Understanding the Test Structure

### 1. Imports Section

```typescript
// Test framework
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// HTTP testing
import request from 'supertest';

// Your application
import { createApp } from '../../../src/app.js';

// Test helpers
import {
  setupTestDatabase,
  teardownTestDatabase,
  testPrisma,
} from '../setup.js';
import { generateTestEmail, generateTestUser } from '../helpers.js';
```

**Key Point:** We import everything we need upfront.

### 2. Test Suite Setup

```typescript
describe('Scenario: User Signup Flow', () => {
  let app: Express; // Shared app instance

  beforeAll(async () => {
    await setupTestDatabase(); // Clean database
    app = createApp(); // Create app
  });

  afterAll(async () => {
    await teardownTestDatabase(); // Cleanup
  });

  // Tests go here...
});
```

**Execution Flow:**

1. `beforeAll` runs once → clean database, create app
2. All `it()` tests run in sequence
3. `afterAll` runs once → cleanup

### 3. Individual Test Structure (AAA Pattern)

Each test follows the **Arrange-Act-Assert** pattern:

```typescript
it('should do something', async () => {
  // ARRANGE: Set up test data
  const testUser = generateTestUser();

  // ACT: Perform the action
  const response = await request(app).post('/auth/signup').send(testUser);

  // ASSERT: Verify the results
  expect(response.status).toBe(201);
  expect(response.body.data).toHaveProperty('userId');
});
```

### 4. Making HTTP Requests with Supertest

```typescript
const response = await request(app)
  .post('/auth/signup') // HTTP method and path
  .send({ email, password }) // Request body
  .expect(201); // Expected status code

// Access response
console.log(response.status); // 201
console.log(response.body); // { success: true, data: {...} }
console.log(response.headers); // { 'content-type': '...', ... }
```

### 5. Assertions

**Response assertions:**

```typescript
expect(response.body.success).toBe(true);
expect(response.body.data).toHaveProperty('userId');
expect(response.body.data.email).toBe('test@test.com');
```

**Database assertions:**

```typescript
const user = await testPrisma.user.findUnique({
  where: { email: 'test@test.com' },
});

expect(user).toBeDefined();
expect(user?.isVerified).toBe(false);
```

**Why check both response AND database?**

- Response: Tests what the API returns to users
- Database: Tests what was actually saved (catches sync issues)

## Helper Functions Explained

### generateTestEmail()

```typescript
// tests/e2e/helpers.ts
import { randomUUID } from 'crypto';

export function generateTestEmail(): string {
  const timestamp = Date.now();
  const uuid = randomUUID().slice(0, 8);
  return `test-${timestamp}-${uuid}@example.com`;
}

// Generates: test-1704067200000-a1b2c3d4@example.com
```

**Why?** Creates unique emails so tests can run multiple times without "email already exists" errors.

### generateTestUser()

```typescript
export function generateTestUser() {
  return {
    email: generateTestEmail(),
    password: 'TestPassword123!',
  };
}
```

**Why?** Reduces boilerplate. Every test needs a user, this makes it one line.

## Running Your First Scenario

### Run the test:

```bash
pnpm vitest run tests/e2e/scenarios/01-user-signup.test.ts
```

### Expected output:

```
✓ tests/e2e/scenarios/01-user-signup.test.ts (5)
  ✓ Scenario: User Signup Flow (5)
    ✓ Step 1: User signs up with valid credentials
    ✓ Step 2: User cannot signup with duplicate email
    ✓ Step 3: User cannot signup with invalid email
    ✓ Step 4: User cannot signup with weak password
    ✓ Step 5: User cannot signup with missing fields

Test Files  1 passed (1)
     Tests  5 passed (5)
```

## Debugging Failed Tests

### If a test fails:

1. **Check the error message:**

```
AssertionError: expected 400 to equal 201
```

2. **Add console.log to inspect response:**

```typescript
const response = await request(app).post('/auth/signup').send(testUser);
console.log('Response:', response.status, response.body);
```

3. **Check database state:**

```typescript
const users = await testPrisma.user.findMany();
console.log('Users in DB:', users);
```

4. **Run with verbose logging:**

```bash
DEBUG_TESTS=1 pnpm vitest run tests/e2e/scenarios/01-user-signup.test.ts
```

## Common Mistakes and Solutions

### Mistake 1: Forgot to await

```typescript
// ❌ Wrong: Request doesn't complete
const response = request(app).post('/auth/signup').send(data);

// ✅ Correct: Wait for request to complete
const response = await request(app).post('/auth/signup').send(data);
```

### Mistake 2: Not cleaning database

```typescript
// ❌ Wrong: Database has leftover data from previous run
describe('Scenario', () => {
  it('test', async () => {
    /* ... */
  });
});

// ✅ Correct: Clean before tests
describe('Scenario', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  it('test', async () => {
    /* ... */
  });
});
```

### Mistake 3: Using same email in multiple tests

```typescript
// ❌ Wrong: Second test will fail with "email exists"
it('test 1', async () => {
  await request(app).post('/auth/signup').send({
    email: 'test@test.com', // Hard-coded email
    password: 'pass',
  });
});

it('test 2', async () => {
  await request(app).post('/auth/signup').send({
    email: 'test@test.com', // Same email!
    password: 'pass',
  });
});

// ✅ Correct: Generate unique emails
it('test 1', async () => {
  await request(app).post('/auth/signup').send(generateTestUser());
});

it('test 2', async () => {
  await request(app).post('/auth/signup').send(generateTestUser());
});
```

## Enhancing Your Test

### Add more detailed assertions:

```typescript
it('should create user with correct defaults', async () => {
  const testUser = generateTestUser();

  await request(app).post('/auth/signup').send(testUser).expect(201);

  const userInDb = await testPrisma.user.findUnique({
    where: { email: testUser.email },
  });

  // Detailed checks
  expect(userInDb).toMatchObject({
    email: testUser.email,
    isVerified: false,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });

  // Password should be hashed with bcrypt
  expect(userInDb?.passwordHash).toMatch(/^\$2[ayb]\$.{56}$/);

  // Should have a verification token
  expect(userInDb?.verificationToken).toBeDefined();
  expect(userInDb?.verificationToken).toHaveLength(64);
});
```

### Test edge cases:

```typescript
it('should trim whitespace from email', async () => {
  const response = await request(app)
    .post('/auth/signup')
    .send({
      email: '  user@test.com  ', // Extra spaces
      password: 'ValidPassword123!',
    })
    .expect(201);

  expect(response.body.data.email).toBe('user@test.com'); // Trimmed
});

it('should be case-insensitive for email', async () => {
  await request(app)
    .post('/auth/signup')
    .send({
      email: 'User@Test.com',
      password: 'pass123',
    })
    .expect(201);

  // Try with different case
  const response = await request(app)
    .post('/auth/signup')
    .send({
      email: 'user@test.com', // Same email, different case
      password: 'pass123',
    })
    .expect(400); // Should fail

  expect(response.body.error.message).toContain('already exists');
});
```

## Key Takeaways

1. **Structure:** Use `describe`, `beforeAll`, `afterAll`, `it`
2. **Pattern:** Arrange-Act-Assert in each test
3. **Supertest:** Makes HTTP requests without running a server
4. **Assertions:** Check both API response and database state
5. **Unique data:** Use helpers to generate unique test data
6. **Cleanup:** Always clean database before/after scenarios

## Practice Exercise

Try writing these additional tests:

1. Test that password is hashed (not stored in plain text)
2. Test that verification token is generated
3. Test maximum email length validation
4. Test SQL injection protection (send malicious input)

## Next Steps

Now let's write more complex scenarios with multiple steps!

---

**[← Previous: Database Setup](./04-database-setup.md) | [Next: More Scenarios →](./06-more-scenarios.md)**
