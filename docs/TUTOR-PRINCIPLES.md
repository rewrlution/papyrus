# Coding Tutor Principles

These principles guide how technical tutorials and code should be written for this project. Use this as a reference when creating tutorials, explaining concepts, or writing code.

**Feed this document to Claude at the start of coding sessions to maintain consistent quality and approach.**

## Core Philosophy

**Goal**: Help developers understand and implement features efficiently, writing maintainable code without over-engineering.

**Values**:

- **Clarity** over cleverness
- **Simplicity** over flexibility
- **Working code** over theory
- **Understanding** over memorization

## Key Principles

### 1. Top-Down Approach

Start with the big picture, then drill down into details.

**Structure:**

1. **Show the end goal** - What are we building?
2. **Explain the architecture** - How do components fit together?
3. **Provide implementation** - Actual working code
4. **Cover edge cases** - Optional advanced topics

**Example:**

```markdown
## Building Login Component

**Goal:** Interactive terminal login that authenticates users and stores tokens.

**Architecture:**
┌─────────────┐
│ LoginForm │ (UI component)
└──────┬──────┘
↓
┌─────────────┐
│ ApiClient │ (HTTP wrapper)
└──────┬──────┘
↓
┌─────────────┐
│ TokenStore │ (local storage)
└─────────────┘

**Implementation:**
[Complete working code...]

**Advanced:**

- Token refresh
- OAuth integration
```

**Why this works:**

- Gives context before diving into code
- Shows how pieces connect
- Allows skipping advanced topics if not needed

### 2. Proper Componentization

Break code into logical, reusable pieces, but avoid premature abstraction.

**Good componentization:**

- ✅ Separate concerns (UI, logic, API, storage)
- ✅ Each module has a single responsibility
- ✅ Clear interfaces between modules
- ✅ Easy to test independently
- ✅ Reusable when actually needed

**Bad componentization:**

- ❌ Over-abstraction (generic handlers for one-time use)
- ❌ God classes that do everything
- ❌ Deep inheritance hierarchies
- ❌ Excessive indirection
- ❌ "Future-proofing" that never gets used

**Rule of thumb:**

- **Once**: Inline it
- **Twice**: Consider extracting
- **Three times**: Definitely extract

**Example:**

```typescript
// Good: Clear separation of concerns
class ApiClient {
  constructor(
    private http: HttpClient,
    private tokenStore: TokenStore,
  ) {}
  async login(email: string, password: string) {
    /* ... */
  }
}

// Bad: Doing too much
class ApiClient {
  async login() {
    /* ... also validates, logs, caches, retries, etc. */
  }
}
```

**Why this matters:**

- Easier to understand small, focused modules
- Can change one part without breaking others
- Testing is simpler
- But over-abstraction makes code hard to follow

### 3. No Unnecessary Complexity

Keep it simple. Don't add features "just in case."

**Avoid:**

- ❌ Configuration for things that don't need configuring
- ❌ Abstractions for "future flexibility" that may never come
- ❌ Middleware/plugins/hooks for simple operations
- ❌ Generic utilities that could be one-liners
- ❌ Over-engineered error handling for impossible scenarios
- ❌ Elaborate state machines for simple flows

**Embrace:**

- ✅ Direct, straightforward code
- ✅ Clear, explicit logic
- ✅ Simple data structures
- ✅ Standard patterns
- ✅ Error handling only where errors can actually occur

**Example:**

```typescript
// Good: Simple and clear
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Bad: Over-engineered
class DateFormatter {
  constructor(
    private config: FormatterConfig,
    private plugins: Plugin[],
  ) {}

  format(date: Date, options?: FormatOptions): string {
    // 50 lines of complexity for basic date formatting
  }
}
```

**Why this matters:**

- Simpler code is easier to understand and maintain
- Less code means fewer bugs
- Complexity should match the actual problem

### 4. Complete Working Code Examples

Provide real, runnable code rather than pseudo-code or fragments.

**Do this:**

```typescript
// src/api/client.ts
import axios from "axios";

export class ApiClient {
  constructor(private baseUrl: string) {}

  async login(email: string, password: string) {
    const response = await axios.post(`${this.baseUrl}/auth/login`, {
      email,
      password,
    });
    return response.data;
  }
}
```

**Not this:**

```typescript
// Pseudo-code
class ApiClient {
  // ... constructor and setup
  login() {
    // Make API call
    // Handle response
    // Return data
  }
}
```

**Why this matters:**

- Developers can copy-paste and run immediately
- Shows all the details (imports, types, error handling)
- No ambiguity about implementation

### 5. Use Popular Libraries (Don't Reinvent the Wheel)

Leverage well-tested, community-maintained libraries for common tasks.

**Use existing solutions for:**

- ✅ HTTP requests (axios, fetch)
- ✅ CLI frameworks (commander, yargs)
- ✅ Terminal UI (ink, blessed)
- ✅ Testing (vitest, jest)
- ✅ Date handling (date-fns, dayjs)
- ✅ Validation (zod, yup)

**Consider building custom when:**

- Library adds too much complexity for your needs
- No good library exists for your specific use case
- Library is unmaintained or has security issues
- Performance is critical and library is too slow

**Example:**

```typescript
// Good: Use axios for HTTP
import axios from "axios";
const response = await axios.post("/api/login", data);

// Bad: Custom HTTP implementation
function httpPost(url, data) {
  // 200 lines of XMLHttpRequest code...
}
```

**Why this matters:**

- Popular libraries are battle-tested
- Community provides support and updates
- Security vulnerabilities get fixed
- Focus on your unique business logic, not infrastructure

### 6. Explain Why, Not Just How

Help learners understand the reasoning behind decisions.

**When introducing a new concept:**

- Explain the problem it solves
- Show alternatives and trade-offs
- Justify the chosen approach

**Good:**

```markdown
We use a separate TokenStore class instead of directly accessing localStorage because:

1. **Single responsibility** - Storage logic in one place
2. **Testability** - Easy to mock in tests
3. **Type safety** - TypeScript interfaces for token operations
4. **Flexibility** - Can switch storage mechanisms later (file, memory, etc.)

Alternative: Could use localStorage directly, but would scatter storage logic across codebase.
```

**Not enough:**

```markdown
Here's the TokenStore class.
```

**When to skip explanations:**

- Reader has stated knowledge level
- Concept is industry-standard (e.g., "REST API")
- Documentation is reference material, not tutorial

**Why this matters:**

- Understanding principles > memorizing patterns
- Developers can apply knowledge to new situations
- Easier to evaluate if approach fits their needs

### 7. Progressive Disclosure

Start simple, add complexity only when needed.

**Tutorial flow:**

```markdown
## Step 1: Basic Login (minimal, working)

[Simple code that works]

## Step 2: Add Error Handling (practical necessity)

[Code with try-catch and user feedback]

## Step 3: Add Loading States (better UX)

[Code with loading spinners]

## Optional: Advanced Topics

- Token refresh
- Session management
- OAuth integration
```

**Why this works:**

- Can stop at any level if it meets needs
- Not overwhelmed by advanced features upfront
- Clear progression of complexity

### 8. Provide Context

Show how pieces fit into the larger system.

**Always include:**

- ✅ File paths (`// src/api/client.ts`)
- ✅ All necessary imports
- ✅ Where the code runs (CLI, server, browser)
- ✅ What other parts interact with this code
- ✅ Project structure context

**Example:**

```typescript
// src/commands/auth/login.ts
// This command is registered in src/commands/auth/index.ts
// and executed when user runs: papyrus login

import { render } from 'ink';
import { LoginForm } from '../../components/LoginForm.js';

export async function login(): Promise<void> {
  const { waitUntilExit } = render(<LoginForm />);
  await waitUntilExit();
}
```

**Why this matters:**

- Understand where code lives in the project
- Know how to import and use the code
- See the bigger picture

### 9. Use Consistent Patterns

Follow project conventions and established patterns.

**In this project:**

- Commands: `src/commands/<group>/<command>.ts`
- Types: `src/commands/types.ts` or co-located
- Components: `src/components/<ComponentName>.tsx`
- Libs/Utils: `src/lib/<module>.ts`
- React: Functional components + hooks
- Async: `async/await` over promises
- Modules: ES modules with `.js` extensions in imports

**Why this matters:**

- Predictable structure
- Easier onboarding
- Consistent codebase

### 10. Test-Friendly Code

Write code that's easy to test, and show how to test it.

**Testable code characteristics:**

- Dependencies injected (not hardcoded)
- Pure functions where possible
- Side effects isolated
- Clear input/output contracts

**Example:**

```typescript
// Testable: dependencies injected
export class ApiClient {
  constructor(
    private baseUrl: string,
    private httpClient = axios, // Can inject mock
  ) {}
}

// Test
it("should call login endpoint", async () => {
  const mockHttp = {
    post: vi.fn().mockResolvedValue({ data: { token: "abc" } }),
  };
  const client = new ApiClient("http://api", mockHttp);
  await client.login("a@b.com", "pass");
  expect(mockHttp.post).toHaveBeenCalledWith("http://api/auth/login", {
    email: "a@b.com",
    password: "pass",
  });
});
```

**Why this matters:**

- Confidence in refactoring
- Catch bugs early
- Living documentation

### 11. Provide Multiple Learning Paths

Different people learn differently.

**Include:**

- **Quick Start**: "Just show me the code"
- **Tutorial**: Step-by-step walkthrough
- **Explanation**: Why and how it works
- **Reference**: Complete API documentation

**Example structure:**

```markdown
## Quick Start (for experienced developers)

[Complete code example]

## Tutorial (for learners)

### Step 1: ...

### Step 2: ...

## How It Works (for the curious)

[Deep dive into internals]

## API Reference (for reference)

[Complete method signatures and options]
```

## Tutorial Structure Template

Use this template for technical tutorials:

```markdown
# [Feature Name]

Brief description of what we're building and why (1-2 sentences).

## What We're Building

- Clear goal statement
- What problem does this solve?
- Expected outcome

## Architecture
```

Visual diagram or description of components and their relationships

```

**Why this architecture:**
- Reason for design choices
- Trade-offs considered

## Prerequisites

**Required:**
- Packages to install
- Previous tutorials to complete

**Assumed knowledge:**
- "Basic TypeScript" (can skip explanations of interfaces)
- "Familiar with React" (can skip useState explanation)

## Implementation

### Step 1: [Setup/Foundation]
**Goal:** [What this step achieves]

[Complete code with file path]

**Why this approach:**
[Brief explanation]

### Step 2: [Core Logic]
[Same structure...]

### Step 3: [Integration]
[Same structure...]

## Testing

How to test the implementation (with examples).

## Common Issues

**Issue:** [Problem description]
- **Solution:** [How to fix]
- **Why it happens:** [Explanation]

## Enhancements (Optional)

Ideas for extending the feature.

## Next Steps

- What to build next
- How to extend further
- Related tutorials

## References

- Links to library docs
- Related tutorials
- External resources
```

## Code Examples Best Practices

### Always Include:

- ✅ File path: `// src/api/client.ts`
- ✅ All necessary imports
- ✅ Complete type definitions
- ✅ Error handling where appropriate
- ✅ Comments for non-obvious logic

### Avoid:

- ❌ `// ... rest of the code`
- ❌ `// TODO: implement this`
- ❌ Partial code that won't run
- ❌ Unexplained magic numbers/strings
- ❌ Over-commenting obvious code

### Format:

```typescript
// src/path/to/file.ts
import { Dependency } from "package";

interface Options {
  field: string;
}

/**
 * Does something useful
 * @param options - Configuration options
 * @returns Result of operation
 */
export function doSomething(options: Options): Result {
  // Comment for complex logic only
  return result;
}
```

## Explaining Concepts: When to Elaborate vs. Skip

### Elaborate (explain why + how) when:

- ✅ Concept is new to the reader (check prerequisites)
- ✅ Concept is project-specific
- ✅ Multiple approaches exist (explain trade-offs)
- ✅ Design decisions are non-obvious
- ✅ Common pitfalls exist

### Can skip or briefly mention when:

- ✅ Reader has stated knowledge level
- ✅ Industry-standard pattern (e.g., REST, async/await)
- ✅ Well-documented in official docs (link instead)
- ✅ Concept already explained in previous tutorial

**Example:**

````markdown
// Good: Assumes TypeScript knowledge, explains design
We use dependency injection here to make the code testable:

```typescript
constructor(private http: HttpClient) {}  // Injected, not hardcoded
```
````

This allows us to pass a mock in tests without changing production code.

// Bad: Over-explaining basics
TypeScript allows us to define a constructor. The `private` keyword creates
a property automatically. We're using this to store the http client...

```

## When to Deviate

These principles are guidelines, not laws. Deviate when:

1. **Security concerns**: Add complexity if needed for security
2. **Performance critical**: Optimize even if it adds complexity
3. **External requirements**: Library/API constraints may require specific patterns
4. **Team standards**: Follow agreed-upon conventions
5. **Production systems**: Add robustness appropriate to the context
6. **Reader expertise**: Adjust depth based on stated knowledge level

**Always explain why you're deviating** from these principles.

## Checklist for Tutorials

Before publishing a tutorial, verify:

- [ ] Starts with clear goal and overview
- [ ] Shows architecture/component diagram
- [ ] States prerequisites and assumed knowledge
- [ ] Shows complete, runnable code
- [ ] Explains why, not just what (for new concepts)
- [ ] Uses popular libraries appropriately
- [ ] Follows project conventions
- [ ] Includes file paths and all imports
- [ ] Provides testing examples
- [ ] Has troubleshooting section
- [ ] Code is properly componentized
- [ ] No unnecessary complexity
- [ ] Clear next steps provided
- [ ] Uses top-down structure

## Checklist for Code

Before submitting code, verify:

- [ ] Uses popular libraries for common tasks
- [ ] Properly componentized (single responsibility)
- [ ] No premature abstraction
- [ ] Dependencies injected for testability
- [ ] Includes tests
- [ ] Has clear, focused functions/classes
- [ ] Error handling for actual error scenarios
- [ ] TypeScript types throughout (no `any`)
- [ ] Follows project patterns and structure
- [ ] Documented why for non-obvious decisions

---

## Summary

**Remember these core values:**

1. **Top-down** - Big picture first, details later
2. **Proper componentization** - Extract at 3 uses, not before
3. **No unnecessary complexity** - Simple > clever
4. **Complete working examples** - Runnable, not pseudo-code
5. **Use popular libraries** - Don't reinvent wheels
6. **Explain why** - Reasoning > mechanics (for new concepts)

**Goal:** Help developers be productive quickly while writing maintainable code.

**Motto:** Clarity and simplicity trump cleverness.
```
