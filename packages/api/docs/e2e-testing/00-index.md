# E2E API Testing Tutorial - Complete Guide

Welcome to the comprehensive guide for setting up scenario-based End-to-End (E2E) tests for your Papyrus API using Vitest and Supertest.

## About This Tutorial

This tutorial teaches you how to write **scenario-based E2E tests** that mirror real user workflows, such as:

- User signs up → verifies email → creates journal → updates it
- User A cannot access User B's private journals
- System correctly handles invalid input and edge cases

You'll learn to test your API with **real HTTP requests** against a **test database**, ensuring your entire stack works together correctly.

## Prerequisites

- Basic understanding of TypeScript
- Familiarity with your Papyrus API structure
- PostgreSQL installed locally
- Node.js and pnpm installed

## Tutorial Structure

### Part 1: Foundations

**[Chapter 1: Introduction to E2E Testing](./01-introduction.md)** (15 minutes)

- What is E2E testing?
- The testing pyramid
- Scenario-based vs isolated tests
- Why E2E tests matter for APIs

**[Chapter 2: Tools Overview - Vitest & Supertest](./02-tools-overview.md)** (20 minutes)

- Understanding Vitest (test runner)
- Understanding Supertest (HTTP testing)
- How they work together
- Basic API examples

**[Chapter 3: Organizing Your E2E Tests](./03-project-structure.md)** (15 minutes)

- Recommended folder structure
- Setup and helper files
- Test file naming conventions
- TypeScript configuration

### Part 2: Setup

**[Chapter 4: Setting Up the Test Database](./04-database-setup.md)** (30 minutes)

- Creating a separate test database
- Environment configuration
- Database cleanup strategies
- Security best practices

### Part 3: Writing Tests

**[Chapter 5: Writing Your First Scenario Test](./05-first-scenario.md)** (45 minutes)

- Complete walkthrough: User signup flow
- Understanding test structure
- Arrange-Act-Assert pattern
- Making HTTP requests with Supertest
- Database assertions
- Common mistakes and solutions

**[Chapter 6: Advanced Scenario-Based Tests](./06-more-scenarios.md)** (45 minutes)

- Multi-step scenarios with shared state
- Authenticated requests
- Testing authorization
- Edge cases and error handling
- Helper functions
- Best practices

### Part 4: Execution

**[Chapter 7: Running and Debugging Tests](./07-running-tests.md)** (30 minutes)

- Running tests (all, specific, watch mode)
- Debugging failed tests
- Common issues and solutions
- Performance optimization
- CI/CD integration

## Quick Start

If you want to jump straight in:

1. **Read Chapter 1-2** for context (30 min)
2. **Follow Chapter 4** to set up test database (30 min)
3. **Implement Chapter 5** to write your first test (45 min)
4. **Run the test** using Chapter 7 (5 min)

Total: ~2 hours to have working E2E tests

## Learning Path

### For Complete Beginners

Read chapters in order: 1 → 2 → 3 → 4 → 5 → 6 → 7

### For Experienced Developers

- Skim chapters 1-2 for tool-specific details
- Read chapter 3 for our conventions
- Follow chapters 4-5 for implementation
- Reference chapter 6-7 as needed

### For Quick Reference

- **Running tests:** Chapter 7
- **Database setup:** Chapter 4
- **Test structure:** Chapter 3
- **Writing scenarios:** Chapters 5-6

## Key Concepts

### Scenario-Based Testing

```typescript
describe('Scenario: User creates journal', () => {
  it('Step 1: User signs up', async () => {
    /* ... */
  });
  it('Step 2: User logs in', async () => {
    /* ... */
  });
  it('Step 3: User creates journal', async () => {
    /* ... */
  });
  // Steps share state and run sequentially
});
```

### Test Database Isolation

```typescript
beforeAll(async () => {
  await setupTestDatabase(); // Clean slate for this scenario
});

afterAll(async () => {
  await teardownTestDatabase(); // Clean up after
});
```

### HTTP Testing with Supertest

```typescript
const response = await request(app)
  .post('/auth/signup')
  .send({ email: 'test@test.com', password: 'pass123' })
  .expect(201);

expect(response.body.data).toHaveProperty('userId');
```

## File Structure You'll Create

```
packages/api/
├── tests/
│   ├── unit/                     # Existing unit tests
│   │   └── ...
│   │
│   └── e2e/                      # NEW: E2E tests
│       ├── setup.ts              # Database lifecycle helpers
│       ├── helpers.ts            # Reusable test utilities
│       │
│       └── scenarios/            # Scenario test files
│           ├── 01-user-signup.test.ts
│           ├── 02-journal-lifecycle.test.ts
│           ├── 03-journal-authorization.test.ts
│           └── 04-journal-edge-cases.test.ts
│
├── .env.test                     # Test environment variables
└── vitest.config.ts              # Updated for E2E tests
```

## Commands You'll Use

```bash
# Setup
pnpm add -D @types/supertest supertest  # Already installed!
psql -U postgres -c "CREATE DATABASE papyrus_test;"

# Running tests
pnpm test                         # All tests
pnpm test:e2e                     # Only E2E tests
pnpm vitest watch tests/e2e       # Watch mode

# Debugging
pnpm vitest run tests/e2e/scenarios/01-user-signup.test.ts
DEBUG_TESTS=1 pnpm test:e2e
```

## What You'll Learn

By completing this tutorial, you will:

✅ Understand E2E testing concepts and best practices
✅ Set up isolated test database environments
✅ Write scenario-based tests that mirror user workflows
✅ Test API endpoints with real HTTP requests
✅ Handle authentication and authorization in tests
✅ Test edge cases and error conditions
✅ Debug failing tests efficiently
✅ Run tests in development and CI/CD

## Getting Help

If you get stuck:

1. **Check Chapter 7** for debugging common issues
2. **Review code examples** in chapters 5-6
3. **Add `console.log()`** to inspect responses and database state
4. **Run tests individually** to isolate problems
5. **Verify database setup** in Chapter 4

## Additional Resources

### Vitest Documentation

- [Vitest Guide](https://vitest.dev/guide/)
- [API Reference](https://vitest.dev/api/)

### Supertest Documentation

- [Supertest GitHub](https://github.com/ladjs/supertest)
- [API Documentation](https://github.com/ladjs/supertest#api)

### Testing Best Practices

- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [AAA Pattern](https://automationpanda.com/2020/07/07/arrange-act-assert-a-pattern-for-writing-good-tests/)

## Tutorial Progression

Start here → [Chapter 1: Introduction to E2E Testing](./01-introduction.md)

---

## Chapter Navigation

1. [Introduction to E2E Testing](./01-introduction.md)
2. [Tools Overview - Vitest & Supertest](./02-tools-overview.md)
3. [Organizing Your E2E Tests](./03-project-structure.md)
4. [Setting Up the Test Database](./04-database-setup.md)
5. [Writing Your First Scenario Test](./05-first-scenario.md)
6. [Advanced Scenario-Based Tests](./06-more-scenarios.md)
7. [Running and Debugging Tests](./07-running-tests.md)

---

**Ready to begin?** Start with [Chapter 1: Introduction to E2E Testing →](./01-introduction.md)
