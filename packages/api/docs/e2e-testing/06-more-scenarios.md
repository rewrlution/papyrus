# Chapter 6: Advanced Scenario-Based Tests

Now that you understand the basics, let's write more complex scenarios that test complete user workflows with multiple sequential steps.

## Scenario 2: User Creates and Manages Journal

This scenario tests the complete journal lifecycle:

1. User signs up and logs in
2. User creates a journal entry
3. User retrieves the journal
4. User updates the journal
5. User deletes the journal

### Key Concepts Introduced

- **Shared state** between test steps
- **Authenticated requests** with auth tokens
- **Sequential dependencies** (each step builds on previous)

### Complete Implementation

```typescript
// tests/e2e/scenarios/02-journal-lifecycle.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

import { createApp } from '../../../src/app.js';
import { setupTestDatabase, teardownTestDatabase } from '../setup.js';
import { generateTestUser } from '../helpers.js';

describe('Scenario: User Journal Lifecycle', () => {
  let app: Express;
  let authToken: string; // Shared: Auth token for authenticated requests
  let testUser: ReturnType<typeof generateTestUser>; // Shared: Test user
  let journalDate: string; // Shared: Journal date created

  beforeAll(async () => {
    await setupTestDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('Step 1: User signs up', async () => {
    testUser = generateTestUser();

    const response = await request(app)
      .post('/auth/signup')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('userId');
  });

  it('Step 2: User logs in', async () => {
    // Note: In reality, user would verify email first
    // For testing, we'll either mock verification or update DB directly

    const response = await request(app)
      .post('/auth/signin')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');

    // Save token for subsequent requests
    authToken = response.body.data.token;
  });

  it('Step 3: User creates a journal entry', async () => {
    journalDate = '20251230';

    const response = await request(app)
      .post('/journal')
      .set('Authorization', `Bearer ${authToken}`) // Authenticated request
      .send({
        date: journalDate,
        content: 'Today was a great day! I learned about E2E testing.',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('hash');
    expect(response.body.data.date).toBe(journalDate);
  });

  it('Step 4: User retrieves the journal entry', async () => {
    const response = await request(app)
      .get(`/journal/${journalDate}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      date: journalDate,
      content: 'Today was a great day! I learned about E2E testing.',
      hash: expect.any(String),
    });
  });

  it('Step 5: User updates the journal entry', async () => {
    const updatedContent =
      'Updated: Today was amazing! I mastered E2E testing.';

    const response = await request(app)
      .put(`/journal/${journalDate}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: updatedContent,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBe(updatedContent);

    // Verify the change persisted
    const getResponse = await request(app)
      .get(`/journal/${journalDate}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getResponse.body.data.content).toBe(updatedContent);
  });

  it('Step 6: User lists all journals', async () => {
    const response = await request(app)
      .get('/journal')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].date).toBe(journalDate);
  });

  it('Step 7: User deletes the journal entry', async () => {
    const response = await request(app)
      .delete(`/journal/${journalDate}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);

    // Verify journal is deleted
    await request(app)
      .get(`/journal/${journalDate}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('Step 8: User cannot access deleted journal', async () => {
    const response = await request(app)
      .get(`/journal/${journalDate}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('not found');
  });
});
```

## Key Patterns Explained

### 1. Shared State Between Steps

```typescript
describe('Scenario', () => {
  let authToken: string; // Accessible to all tests
  let userId: string;

  it('Step 1', async () => {
    const response = await request(app).post('/auth/signin').send(data);
    authToken = response.body.data.token; // Save for later
  });

  it('Step 2', async () => {
    // Use token from Step 1
    await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${authToken}`);
  });
});
```

**Why?** Real users maintain state (logged in, created resources). Tests should too.

### 2. Authenticated Requests

```typescript
// Add Authorization header to request
await request(app)
  .get('/journal')
  .set('Authorization', `Bearer ${authToken}`) // JWT token
  .expect(200);
```

**Pattern:** Most endpoints after login require authentication.

### 3. Sequential Test Steps

```typescript
it('Step 1: Login', async () => {
  /* Get token */
});
it('Step 2: Create', async () => {
  /* Use token */
});
it('Step 3: Read', async () => {
  /* Use token */
});
```

**Important:** Steps run in order and depend on previous steps succeeding.

## Scenario 3: Testing Authorization

Test that users can only access their own data:

```typescript
// tests/e2e/scenarios/03-journal-authorization.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

import { createApp } from '../../../src/app.js';
import { setupTestDatabase, teardownTestDatabase } from '../setup.js';
import { createAuthenticatedUser } from '../helpers.js';

describe('Scenario: Journal Authorization', () => {
  let app: Express;
  let user1Token: string;
  let user2Token: string;
  let user1JournalDate: string;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('Step 1: Create two users', async () => {
    // Helper function that signs up and logs in
    const user1 = await createAuthenticatedUser(app);
    const user2 = await createAuthenticatedUser(app);

    user1Token = user1.token;
    user2Token = user2.token;
  });

  it('Step 2: User 1 creates a journal', async () => {
    user1JournalDate = '20251230';

    await request(app)
      .post('/journal')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        date: user1JournalDate,
        content: 'User 1 private journal',
      })
      .expect(201);
  });

  it('Step 3: User 2 cannot access User 1 journal', async () => {
    const response = await request(app)
      .get(`/journal/${user1JournalDate}`)
      .set('Authorization', `Bearer ${user2Token}`) // Different user!
      .expect(404); // Should not find it

    expect(response.body.success).toBe(false);
  });

  it('Step 4: User 2 cannot update User 1 journal', async () => {
    await request(app)
      .put(`/journal/${user1JournalDate}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        content: 'Trying to modify User 1 journal',
      })
      .expect(404); // Should not find it
  });

  it('Step 5: User 2 cannot delete User 1 journal', async () => {
    await request(app)
      .delete(`/journal/${user1JournalDate}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(404);
  });

  it('Step 6: User 1 can still access their journal', async () => {
    const response = await request(app)
      .get(`/journal/${user1JournalDate}`)
      .set('Authorization', `Bearer ${user1Token}`) // Original user
      .expect(200);

    expect(response.body.data.content).toBe('User 1 private journal');
  });
});
```

## Advanced Helper: Create Authenticated User

To reduce boilerplate, create a helper that handles signup + login:

```typescript
// tests/e2e/helpers.ts

import request from 'supertest';
import type { Express } from 'express';
import { randomUUID } from 'crypto';

export function generateTestEmail(): string {
  return `test-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
}

export function generateTestUser() {
  return {
    email: generateTestEmail(),
    password: 'TestPassword123!',
  };
}

/**
 * Creates a user, verifies email, and logs in
 * Returns auth token and user info
 */
export async function createAuthenticatedUser(app: Express) {
  const testUser = generateTestUser();

  // Step 1: Signup
  const signupResponse = await request(app)
    .post('/auth/signup')
    .send({
      email: testUser.email,
      password: testUser.password,
    })
    .expect(201);

  const userId = signupResponse.body.data.userId;

  // Step 2: [Placeholder: Verify email]
  // In a real scenario, you'd either:
  // - Get verification token from database and call verify endpoint
  // - Or directly update user.isVerified in database
  // For now, assume signin works without verification in test mode

  // Step 3: Signin
  const signinResponse = await request(app)
    .post('/auth/signin')
    .send({
      email: testUser.email,
      password: testUser.password,
    })
    .expect(200);

  return {
    userId,
    email: testUser.email,
    password: testUser.password,
    token: signinResponse.body.data.token,
  };
}
```

**Usage:**

```typescript
const user = await createAuthenticatedUser(app);

await request(app)
  .get('/journal')
  .set('Authorization', `Bearer ${user.token}`)
  .expect(200);
```

## Scenario 4: Testing Edge Cases

Test boundary conditions and error handling:

```typescript
// tests/e2e/scenarios/04-journal-edge-cases.test.ts

describe('Scenario: Journal Edge Cases', () => {
  let app: Express;
  let authToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createApp();

    const user = await createAuthenticatedUser(app);
    authToken = user.token;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should reject journal with invalid date format', async () => {
    await request(app)
      .post('/journal')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        date: '2025-12-30', // Wrong format, should be YYYYMMDD
        content: 'Test',
      })
      .expect(400);
  });

  it('should reject empty content', async () => {
    await request(app)
      .post('/journal')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        date: '20251230',
        content: '', // Empty content
      })
      .expect(400);
  });

  it('should reject extremely long content', async () => {
    const veryLongContent = 'a'.repeat(1000000); // 1 million characters

    await request(app)
      .post('/journal')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        date: '20251230',
        content: veryLongContent,
      })
      .expect(400);
  });

  it('should handle special characters in content', async () => {
    const specialContent = 'Test 特殊字符 émojis 🎉 quotes "hi" and <html>';

    const response = await request(app)
      .post('/journal')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        date: '20251230',
        content: specialContent,
      })
      .expect(201);

    // Retrieve and verify special characters preserved
    const getResponse = await request(app)
      .get('/journal/20251230')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getResponse.body.data.content).toBe(specialContent);
  });

  it('should reject requests without auth token', async () => {
    await request(app)
      .post('/journal')
      // No Authorization header!
      .send({
        date: '20251230',
        content: 'Test',
      })
      .expect(401); // Unauthorized
  });

  it('should reject requests with invalid token', async () => {
    await request(app)
      .post('/journal')
      .set('Authorization', 'Bearer invalid-token-here')
      .send({
        date: '20251230',
        content: 'Test',
      })
      .expect(401);
  });
});
```

## Testing Best Practices

### 1. Test Happy Path First

```typescript
it('Step 1: User successfully creates journal', async () => {
  // Basic success case
});
```

### 2. Then Test Error Cases

```typescript
it('Step 2: User cannot create journal without auth', async () => {
  // Error case
});
```

### 3. Test Edge Cases

```typescript
it('Step 3: User creates journal with unicode characters', async () => {
  // Edge case
});
```

### 4. Keep Tests Focused

```typescript
// ✅ Good: One thing per test
it('should reject invalid date format', async () => {
  /* ... */
});
it('should reject empty content', async () => {
  /* ... */
});

// ❌ Bad: Testing multiple things
it('should validate input', async () => {
  // Tests date format, content, auth, etc.
});
```

## When to Create New Scenario Files

Create a new scenario file when:

- Testing a different user workflow
- Tests are logically separate
- Scenario has different setup requirements

**Example organization:**

```
scenarios/
├── 01-user-signup.test.ts          # Auth: Signup flow
├── 02-user-signin.test.ts          # Auth: Signin flow
├── 03-journal-lifecycle.test.ts    # CRUD: Complete journal operations
├── 04-journal-authorization.test.ts # Security: Access control
├── 05-journal-edge-cases.test.ts   # Edge: Error handling
```

## Key Takeaways

1. **Sequential steps** - Each step builds on previous ones
2. **Shared state** - Use variables to pass data between steps
3. **Authenticated requests** - Most endpoints require auth token
4. **Helper functions** - Reduce boilerplate with `createAuthenticatedUser()`
5. **Test authorization** - Verify users can't access others' data
6. **Test edge cases** - Invalid input, missing fields, special characters
7. **Keep focused** - One logical assertion per test

## Next Steps

Learn how to run and debug your tests efficiently!

---

**[← Previous: First Scenario](./05-first-scenario.md) | [Next: Running Tests →](./07-running-tests.md)**
