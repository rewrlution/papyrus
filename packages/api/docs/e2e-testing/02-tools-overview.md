# Chapter 2: Tools Overview - Vitest & Supertest

## The Testing Stack

For E2E API testing, we use two main tools:

1. **Vitest** - Test runner and assertion library
2. **Supertest** - HTTP testing library

Good news: You already have both installed! Check `packages/api/package.json`:

```json
{
  "devDependencies": {
    "@types/supertest": "^6.0.3",
    "supertest": "^7.1.4"
  }
}
```

## 1. Vitest - The Test Runner

### What is Vitest?

Vitest is a modern test framework that:

- Runs your tests
- Provides assertion functions (`expect`, `toBe`, etc.)
- Organizes tests with `describe` and `it`
- Handles setup/teardown with `beforeAll`, `afterAll`

### Basic Vitest Concepts

#### Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('My Test Suite', () => {
  it('should do something', () => {
    const result = 1 + 1;
    expect(result).toBe(2);
  });
});
```

**Key Functions:**

- `describe()` - Groups related tests together
- `it()` - Defines a single test case
- `expect()` - Makes assertions about values

#### Lifecycle Hooks

```typescript
import {
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';

describe('Test with setup/teardown', () => {
  beforeAll(() => {
    // Runs once before all tests in this describe block
    console.log('Setting up test suite');
  });

  afterAll(() => {
    // Runs once after all tests in this describe block
    console.log('Cleaning up test suite');
  });

  beforeEach(() => {
    // Runs before each test
    console.log('Setting up individual test');
  });

  afterEach(() => {
    // Runs after each test
    console.log('Cleaning up individual test');
  });

  it('test 1', () => {
    /* ... */
  });
  it('test 2', () => {
    /* ... */
  });
});
```

**Execution Order:**

```
beforeAll
  → beforeEach → test 1 → afterEach
  → beforeEach → test 2 → afterEach
afterAll
```

#### Async Tests

Vitest handles async code naturally:

```typescript
it('should wait for async operation', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Common Assertions

```typescript
// Equality
expect(value).toBe(42); // Strict equality (===)
expect(object).toEqual({ key: 'value' }); // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeNull();

// Numbers
expect(number).toBeGreaterThan(10);
expect(number).toBeLessThanOrEqual(100);

// Strings
expect(string).toContain('substring');
expect(string).toMatch(/regex/);

// Arrays/Objects
expect(array).toHaveLength(3);
expect(object).toHaveProperty('key');
expect(array).toContain(item);

// Types
expect(value).toBeInstanceOf(Date);
expect(typeof value).toBe('string');
```

## 2. Supertest - HTTP Testing Made Easy

### What is Supertest?

Supertest makes HTTP requests to your Express app **without starting a server**. It's perfect for API testing!

### How Supertest Works

```typescript
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp(); // Your Express app

// Make a request
const response = await request(app).get('/health').expect(200);

console.log(response.body); // { status: 'ok' }
```

**Magic:** No server needed! Supertest calls your Express handlers directly.

### Supertest API

#### Making Requests

```typescript
// GET request
await request(app).get('/path').expect(200);

// POST request with body
await request(app)
  .post('/auth/signup')
  .send({ email: 'user@test.com', password: 'pass123' })
  .expect(201);

// With headers
await request(app)
  .get('/journal')
  .set('Authorization', 'Bearer token123')
  .expect(200);

// With query parameters
await request(app).get('/search').query({ q: 'test', limit: 10 }).expect(200);
```

#### Assertions

```typescript
// Status code
.expect(200)
.expect(201)
.expect(404)

// Headers
.expect('Content-Type', /json/)
.expect('Authorization', 'Bearer token')

// Body (partial match)
.expect({ success: true })

// Custom assertions
const response = await request(app).get('/health');
expect(response.body).toEqual({
  success: true,
  data: { status: 'ok' }
});
```

#### Accessing Response Data

```typescript
const response = await request(app)
  .post('/auth/signup')
  .send({ email: 'test@test.com', password: 'pass' });

// Access response properties
console.log(response.status); // 201
console.log(response.body); // { success: true, data: { userId: '...' } }
console.log(response.headers); // { 'content-type': 'application/json', ... }

// Use in next request
const token = response.body.data.token;
await request(app).get('/journal').set('Authorization', `Bearer ${token}`);
```

## Combining Vitest + Supertest

Here's a complete example showing both tools together:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';

describe('Health Check Endpoint', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it('should return 200 and health status', async () => {
    // Supertest makes the request
    const response = await request(app)
      .get('/health')
      .expect(200) // Supertest assertion
      .expect('Content-Type', /json/); // Supertest assertion

    // Vitest assertions for detailed checks
    expect(response.body).toEqual({
      success: true,
      data: { status: 'ok' },
    });
  });

  it('should return 404 for unknown endpoint', async () => {
    const response = await request(app).get('/unknown').expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('not found');
  });
});
```

## Why This Combination?

### Vitest Benefits

- ⚡ **Fast** - Runs tests in parallel
- 🔥 **Hot reload** - Re-runs tests on file changes (watch mode)
- 📝 **Great TypeScript support** - Type-safe test writing
- 🎯 **Modern API** - Clean, intuitive syntax

### Supertest Benefits

- 🚀 **No server needed** - Tests Express app directly
- 🔗 **Chainable API** - Readable, fluent assertions
- 📦 **Works with any framework** - Express, Hono, Koa, etc.
- 🎨 **Flexible assertions** - Both Supertest and Vitest assertions

## Real-World Example: Testing Auth

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDatabase, teardownTestDatabase } from './setup.js';

describe('Authentication Flow', () => {
  let app;

  beforeAll(async () => {
    await setupTestDatabase(); // [Placeholder: Clean test DB]
    app = createApp();
  });

  afterAll(async () => {
    await teardownTestDatabase(); // [Placeholder: Disconnect DB]
  });

  it('should sign up a new user', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({
        email: 'newuser@test.com',
        password: 'SecurePass123!',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('userId');
  });

  it('should reject duplicate email', async () => {
    // First signup
    await request(app)
      .post('/auth/signup')
      .send({ email: 'duplicate@test.com', password: 'pass' });

    // Duplicate signup should fail
    const response = await request(app)
      .post('/auth/signup')
      .send({ email: 'duplicate@test.com', password: 'pass' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('already exists');
  });
});
```

## Key Takeaways

1. **Vitest** runs tests and provides assertions
2. **Supertest** makes HTTP requests to your app
3. **No server needed** - Tests call Express directly
4. **Async/await** - All requests are promises
5. **Flexible assertions** - Use both Supertest's `.expect()` and Vitest's `expect()`

## Next Steps

Now that you understand the tools, let's organize our test files properly.

---

**[← Previous: Introduction](./01-introduction.md) | [Next: Project Structure →](./03-project-structure.md)**
