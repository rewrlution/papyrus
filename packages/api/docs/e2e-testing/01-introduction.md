# Chapter 1: Introduction to E2E API Testing

## What is End-to-End (E2E) Testing?

End-to-End testing verifies that your entire application works correctly from the user's perspective. Unlike unit tests that check individual functions, E2E tests simulate real user scenarios.

### Example: The Difference

**Unit Test:**

```typescript
// Tests one function in isolation
it('should hash a password', () => {
  const result = hashPassword('mypassword');
  expect(result).toMatch(/^\$2[ayb]\$.{56}$/);
});
```

**E2E Test:**

```typescript
// Tests the entire signup flow
it('should allow user to sign up', async () => {
  const response = await request(app)
    .post('/auth/signup')
    .send({ email: 'user@test.com', password: 'pass123' });

  expect(response.status).toBe(201);
  expect(response.body.data).toHaveProperty('userId');
});
```

## The Testing Pyramid

```
       /\
      /E2E\        <- Few tests, slow, high confidence
     /------\
    /  API  \      <- Some tests, medium speed
   /--------\
  /   Unit   \     <- Many tests, fast, low-level
 /------------\
```

**Unit Tests:** Test individual functions (80% of tests)

- Fast, run in milliseconds
- Test business logic, utilities, mappers
- Example: `JournalMapper.toJournalData()`

**API/Integration Tests:** Test multiple components together (15% of tests)

- Medium speed, run in seconds
- Test API endpoints with real HTTP calls
- Example: POST /auth/signup → database → response

**E2E Tests:** Test complete user scenarios (5% of tests)

- Slower, run in seconds to minutes
- Test realistic user workflows
- Example: Signup → Verify → Login → Create Journal

## What is Scenario-Based Testing?

Instead of testing individual endpoints in isolation, scenario-based tests follow complete user journeys.

### Traditional Approach (Isolated Tests)

```typescript
it('should create user', async () => {
  /* ... */
});
it('should login user', async () => {
  /* ... */
});
it('should create journal', async () => {
  /* ... */
});
```

**Problem:** These don't reflect how real users interact with your API

### Scenario-Based Approach

```typescript
describe('Scenario: New user creates their first journal', () => {
  let authToken;

  it('Step 1: User signs up', async () => {
    // Signup logic...
  });

  it('Step 2: User verifies email', async () => {
    // Uses data from step 1...
  });

  it('Step 3: User logs in', async () => {
    // Get auth token...
    authToken = response.body.data.token;
  });

  it('Step 4: User creates journal', async () => {
    // Use authToken from step 3...
  });
});
```

**Benefits:** Tests how features work together, catches integration bugs

## Why E2E Testing for APIs?

### 1. Catches Integration Issues

Your unit tests might pass, but E2E tests catch:

- Missing middleware
- Wrong route configuration
- Database constraint violations
- Authentication/authorization bugs

### 2. Documents API Behavior

E2E tests serve as living documentation:

```typescript
describe('Scenario: User journal workflow', () => {
  it('User signs up with email and password', async () => {
    /* ... */
  });
  it('User receives verification email', async () => {
    /* ... */
  });
  it('User verifies email with token', async () => {
    /* ... */
  });
  // ... clearly shows the expected workflow
});
```

### 3. Confidence in Refactoring

When you refactor code, E2E tests ensure the API still works from the user's perspective.

### 4. Prevents Regressions

When you add new features, E2E tests ensure existing scenarios still work.

## What You'll Learn in This Tutorial

By the end of this series, you'll be able to:

1. **Understand the tools** - Vitest and Supertest
2. **Structure your tests** - Organize E2E tests effectively
3. **Set up test database** - Isolate test data from production
4. **Write scenario tests** - Create realistic user workflows
5. **Handle non-idempotent operations** - Deal with signup, create, delete
6. **Run tests efficiently** - Execute tests locally and in CI/CD

## Your Papyrus API

Your API has these main features:

- **Authentication:** Signup, signin, email verification
- **Journals:** Create, read, update, delete journal entries
- **Encryption:** Journals are encrypted at rest

**Example User Journey:**

1. User signs up → Creates account
2. User verifies email → Activates account
3. User signs in → Gets auth token
4. User creates journal → Encrypted and stored
5. User reads journal → Decrypted and returned

We'll test all of these scenarios!

## Next Steps

In the next chapter, we'll explore the tools that make E2E testing easy:

- **Vitest** - Fast, modern test runner
- **Supertest** - HTTP assertion library

---

**[Next: Chapter 2 - Tools Overview →](./02-tools-overview.md)**
