# Papyrus API Documentation

Welcome to the Papyrus API documentation hub.

## Available Guides

### [E2E Testing Tutorial](./e2e-testing/00-index.md)

A comprehensive, step-by-step guide to setting up scenario-based End-to-End tests for the Papyrus API.

**What you'll learn:**

- Write scenario-based tests that mirror real user workflows
- Test your API with real HTTP requests using Vitest and Supertest
- Set up isolated test databases
- Handle authentication, authorization, and edge cases
- Debug and run tests efficiently

**Time to complete:** ~2-3 hours
**Prerequisites:** Basic TypeScript knowledge

**[Start the tutorial →](./e2e-testing/00-index.md)**

---

## Quick Links

### E2E Testing Chapters

1. [Introduction to E2E Testing](./e2e-testing/01-introduction.md)
2. [Tools Overview - Vitest & Supertest](./e2e-testing/02-tools-overview.md)
3. [Organizing Your E2E Tests](./e2e-testing/03-project-structure.md)
4. [Setting Up the Test Database](./e2e-testing/04-database-setup.md)
5. [Writing Your First Scenario Test](./e2e-testing/05-first-scenario.md)
6. [Advanced Scenario-Based Tests](./e2e-testing/06-more-scenarios.md)
7. [Running and Debugging Tests](./e2e-testing/07-running-tests.md)

---

## Contributing

When adding new documentation:

1. Create a new folder under `docs/` for the topic
2. Use numbered markdown files (01-, 02-, etc.) for sequential content
3. Create a 00-index.md as the table of contents
4. Update this README with links to the new guide

## Document Structure

```
docs/
├── README.md                          # This file
│
└── e2e-testing/                       # E2E testing tutorial
    ├── 00-index.md                    # Tutorial index
    ├── 01-introduction.md
    ├── 02-tools-overview.md
    ├── 03-project-structure.md
    ├── 04-database-setup.md
    ├── 05-first-scenario.md
    ├── 06-more-scenarios.md
    └── 07-running-tests.md
```
