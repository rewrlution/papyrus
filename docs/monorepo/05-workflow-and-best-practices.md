# Part 5: Workflow and Best Practices - Working Efficiently in Your Monorepo

Welcome to the final part! You've built a complete monorepo with three packages. Now let's learn how to work with it efficiently, set up quality tools, and follow best practices.

## The Complete Picture

Your monorepo now has:

```
my-monorepo/
├── packages/
│   ├── shared/          ← Utilities, types, shared code
│   ├── api/             ← Express REST API
│   └── cli/             ← Ink terminal application
├── turbo.json           ← Build orchestration
├── tsconfig.base.json   ← Shared TypeScript config
├── eslint.config.js     ← Linting rules
├── .prettierrc.json     ← Code formatting
└── package.json         ← Root scripts
```

All three packages can import from each other, share configurations, and build together. Let's master the workflow!

## Essential Commands

You already have these scripts in your root `package.json`. Let's understand when to use each:

### Build Everything

```bash
pnpm build
```

Turbo builds packages in the right order:

1. `@myapp/shared` (no dependencies)
2. `@myapp/api` and `@myapp/cli` (parallel, both depend on shared)

**When to use:** After pulling changes, before running tests, when deploying.

### Development Mode

```bash
pnpm dev
```

Runs all packages in watch mode (parallel). Changes rebuild automatically.

**When to use:** Active development, working on multiple packages.

### Run Tests

```bash
pnpm test
```

Runs all tests in all packages.

**When to use:** Before committing, in CI/CD, after making changes.

### Lint Code

```bash
pnpm lint
```

Checks code style and potential issues.

**When to use:** Before committing, to catch issues early.

### Format Code

```bash
pnpm format
```

Auto-formats all code consistently.

**When to use:** Before committing, after writing messy code!

## Working with Individual Packages

Sometimes you want to work on just one package:

### Filter Commands

```bash
# Build only shared
pnpm --filter @myapp/shared build

# Test only API
pnpm --filter @myapp/api test

# Run dev mode for CLI only
pnpm --filter @myapp/cli dev
```

The `--filter` flag is your friend for focused work.

### Quick Package Access

```bash
# Navigate and work
cd packages/api
pnpm dev

# Or from root
pnpm --filter @myapp/api dev
```

## Understanding Turbo Caching

Turbo's superpower is **caching**. It remembers previous builds and skips work when nothing changed.

### See It in Action

```bash
# First build (no cache)
pnpm build
# Outputs: "cache miss, executing..."

# Build again (nothing changed)
pnpm build
# Outputs: "cache hit, replaying logs..."
```

Second build is instant! Turbo knows nothing changed, so it reuses the previous result.

### What Gets Cached

Turbo caches based on:

- Source files (`src/**/*.ts`)
- Configuration files (`tsconfig.json`, `package.json`)
- Dependencies (other packages)

Change any of these? Turbo rebuilds. Otherwise, it uses the cache.

### Clear Cache

```bash
# Remove turbo cache
rm -rf .turbo

# Or add to package.json
"clean": "turbo run clean && rm -rf node_modules .turbo"
```

## Setting Up Code Quality Tools

Let's add proper linting and formatting. You already have the configs, but let's understand them.

### ESLint Configuration

Your `eslint.config.js` catches common issues (ESLint v9 flat config format):

```javascript
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist", "node_modules", "*.cjs"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
];
```

**Key features:**

- Uses the new ESLint v9 flat config format
- Catches unused variables (unless they start with `_`)
- Enforces TypeScript best practices
- Ignores build output and dependencies

### Prettier Configuration

Your `.prettierrc.json` ensures consistent formatting:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Add Formatting Scripts

Update `.prettierignore`:

```
node_modules
dist
.turbo
coverage
pnpm-lock.yaml
```

Now `pnpm format` and `pnpm lint` work across all packages!

## Pre-commit Hooks with Husky

Want to automatically lint and format code before commits? Let's add Husky!

### Install Husky and lint-staged

**Important**: When installing packages at the root level, always use the `-w` flag:

```bash
pnpm add -D husky lint-staged -w
pnpm exec husky init
```

### What Just Happened?

After running `husky init`:

- Created `.husky/` folder with your git hooks
- Created `.husky/_/` folder (husky's internal scripts - **don't commit this**)
- Set up git hooks integration

Your `.gitignore` already excludes `.husky/_/`, so you'll only commit your actual hook scripts.

### Create Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/bin/sh
pnpm lint-staged
```

### Configure lint-staged

Add to root `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Why lint-staged Instead of Full Lint?

**Q: Why not just run `pnpm lint` and `pnpm format` in the pre-commit hook?**

**A: Performance and scope!**

`lint-staged` only checks **staged files** (files you're about to commit), not your entire codebase:

```bash
# Without lint-staged - checks EVERYTHING
pnpm lint  # 😰 Checks 1000+ files across all packages

# With lint-staged - checks ONLY what you're committing
lint-staged  # 😊 Checks only the 3 files you modified
```

**Benefits:**

- ⚡ **Faster commits**: In a large monorepo, linting only changed files saves significant time
- 🎯 **Relevant checks**: Only validates code you're actually committing
- 🔄 **Incremental fixes**: Won't fail due to legacy code you didn't touch
- 🚀 **Better DX**: Developers aren't waiting for unrelated files to lint

**Example**: If you modify `apps/api/src/users.ts`, lint-staged runs:

```bash
eslint --fix apps/api/src/users.ts
prettier --write apps/api/src/users.ts
```

Instead of linting thousands of files in all packages!

### Test It

Make a change and commit:

```bash
echo "// test" >> packages/shared/src/index.ts
git add .
git commit -m "test: verify pre-commit hook"
```

You should see lint-staged run automatically! Every commit is now automatically linted and formatted.

## Common Development Workflows

### Scenario 1: Adding a New Feature

```bash
# 1. Create a feature branch
git checkout -b feature/user-avatars

# 2. Work in dev mode
pnpm dev

# 3. Make changes to shared, API, and CLI

# 4. Test everything
pnpm test

# 5. Lint and format
pnpm lint
pnpm format

# 6. Build to ensure everything compiles
pnpm build

# 7. Commit
git add .
git commit -m "feat: add user avatars"
```

### Scenario 2: Fixing a Bug in Shared

```bash
# 1. Make changes to packages/shared/src/utils/index.ts

# 2. Test shared package
pnpm --filter @myapp/shared test

# 3. Build and test dependents
pnpm build
pnpm test

# 4. Verify API and CLI still work
cd packages/api && pnpm dev
# Test manually
cd packages/cli && pnpm start
```

### Scenario 3: Adding a Dependency

```bash
# Add to specific package
pnpm add express-rate-limit --filter @myapp/api

# Add dev dependency to root (for all packages)
pnpm add -D prettier --save-dev -w

# Add workspace dependency
# In package.json:
"dependencies": {
  "@myapp/shared": "workspace:*"
}
```

## Testing Strategies

### Unit Tests

Test individual functions:

```typescript
// packages/shared/tests/utils.test.ts
describe("formatMessage", () => {
  it("formats message", () => {
    expect(formatMessage("hello")).toBe("[MyApp] hello");
  });
});
```

### Integration Tests

Test packages together:

```typescript
// packages/api/tests/integration.test.ts
import { createServer } from "../src/server.js";
import { formatMessage } from "@myapp/shared";

describe("API Integration", () => {
  it("uses shared formatMessage", async () => {
    const server = createServer();
    // Test that server responses use formatMessage
  });
});
```

### Run Tests by Package

```bash
# Fast: Test only changed code
pnpm --filter @myapp/shared test

# Thorough: Test everything
pnpm test
```

### Watch Mode

```bash
# Watch all tests
pnpm test:watch

# Watch specific package
pnpm --filter @myapp/api test:watch
```

## Debugging Tips

### TypeScript Errors

**Problem:** "Cannot find module '@myapp/shared'"

**Solutions:**

1. Check `pnpm-workspace.yaml` includes your package
2. Run `pnpm install`
3. Check `tsconfig.json` has correct `references`
4. Build shared: `pnpm --filter @myapp/shared build`

### Import Errors

**Problem:** Runtime "Cannot find module" with `.js` extension

**Solutions:**

1. Make sure `"type": "module"` in package.json
2. Use `.js` in imports (even for `.ts` files)
3. Check `moduleResolution: "NodeNext"` in tsconfig

### Build Errors

**Problem:** Turbo builds in wrong order

**Solutions:**

1. Check `references` in tsconfig.json
2. Ensure `dependsOn: ["^build"]` in turbo.json
3. Clear cache: `rm -rf .turbo`

## Performance Optimization

### Parallel Execution

Turbo runs independent tasks in parallel:

```bash
# API and CLI build in parallel (both depend on shared)
pnpm build

# Run all tests simultaneously
pnpm test
```

### Incremental Builds

TypeScript's `composite: true` enables incremental builds:

```json
{
  "compilerOptions": {
    "composite": true,
    "incremental": true
  }
}
```

Rebuilds are faster because TypeScript only recompiles changed files.

### Selective Testing

```bash
# Only test changed packages
pnpm test --filter ...[HEAD^1]

# Test a package and its dependencies
pnpm test --filter @myapp/api...
```

## CI/CD Setup

Example GitHub Actions workflow (`.github/workflows/ci.yml`):

```yaml
name: CI

on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test
```

Turbo's caching works in CI too! Add remote caching for even faster builds.

## Deployment Strategies

### Deploy API

```bash
# Build for production
NODE_ENV=production pnpm --filter @myapp/api build

# Run production server
cd packages/api
node dist/index.js
```

### Publish CLI

```bash
# Build
pnpm --filter @myapp/cli build

# Publish to npm
cd packages/cli
npm publish
```

### Docker

Create `packages/api/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm --filter @myapp/shared build
RUN pnpm --filter @myapp/api build

EXPOSE 3000

CMD ["node", "packages/api/dist/index.js"]
```

## Best Practices Summary

### Do's ✅

1. **Use workspace protocol** - `"@myapp/shared": "workspace:*"`
2. **Use TypeScript references** - `"references": [{ "path": "../shared" }]`
3. **Use `.js` in imports** - `import { x } from './utils.js'`
4. **Build before testing** - Ensure packages are up to date
5. **Run format before committing** - Keep code consistent
6. **Use Turbo for all tasks** - Leverage caching

### Don'ts ❌

1. **Don't publish internal packages** - Mark them `"private": true`
2. **Don't hardcode versions** - Use `workspace:*` for internal deps
3. **Don't skip TypeScript references** - They enable better IDE support
4. **Don't commit node_modules or dist** - Use .gitignore
5. **Don't mix CommonJS and ESM** - Stick with ESM (`"type": "module"`)

## Advanced: Adding More Packages

Want to add a web frontend?

```bash
mkdir -p packages/web/src
cd packages/web

# Create package.json with @myapp/shared dependency
pnpm init

# Add React/Next.js/Vite
pnpm add react react-dom

# Import from shared
import { User, ApiResponse } from '@myapp/shared';
```

The beauty: All packages share the same types!

## Monorepo vs. Polyrepo

You chose a monorepo. Here's why it's great:

| Monorepo                    | Polyrepo                  |
| --------------------------- | ------------------------- |
| ✅ Share code easily        | ❌ Duplicate code         |
| ✅ Atomic changes           | ❌ Sync multiple repos    |
| ✅ One place to find things | ❌ Scattered across repos |
| ✅ Consistent tooling       | ❌ Configure each repo    |
| ✅ Refactor across packages | ❌ Complex refactoring    |

## What You've Learned

Congratulations! You now know:

1. How to build and manage a monorepo
2. How to use Turborepo for smart builds
3. How to share code between packages
4. How to set up linting and formatting
5. How to test efficiently
6. How to debug common issues
7. How to deploy packages
8. Best practices for monorepo development

## Your Complete Monorepo Toolkit

```bash
# Daily development
pnpm dev                  # Start all packages
pnpm test:watch          # Watch tests

# Before committing
pnpm lint                # Check code
pnpm format              # Format code
pnpm build               # Ensure it builds
pnpm test                # Run all tests

# Working on one package
pnpm --filter @myapp/api dev
pnpm --filter @myapp/api test

# Clean slate
pnpm clean               # Clear builds and caches
pnpm install             # Reinstall dependencies
```

## Next Steps

Now that you have a solid monorepo:

1. **Add more features** - Extend your API and CLI
2. **Set up CI/CD** - Automate testing and deployment
3. **Add more packages** - Web frontend? Mobile app?
4. **Share with your team** - Collaborate in the monorepo
5. **Deploy to production** - Ship your applications

## Resources

- [Turborepo Docs](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Ink Documentation](https://github.com/vadimdemedes/ink)

## Final Thoughts

You've built a complete monorepo from scratch! You now have:

- ✅ A shared utilities package
- ✅ A REST API with Express
- ✅ A terminal CLI with Ink
- ✅ Type-safe imports between packages
- ✅ Fast builds with Turborepo
- ✅ Testing, linting, and formatting
- ✅ A foundation for scaling

The patterns you've learned apply to any monorepo - whether it's 3 packages or 300. You can now confidently build and maintain large-scale JavaScript/TypeScript projects.

**Happy coding!** 🚀

---

## Appendix: Quick Reference

### Commands Cheat Sheet

```bash
# Setup
pnpm install              # Install all dependencies
pnpm build                # Build all packages

# Development
pnpm dev                  # Run all packages in watch mode
pnpm --filter <pkg> dev   # Run specific package

# Testing
pnpm test                 # Run all tests
pnpm test:watch          # Watch mode

# Code Quality
pnpm lint                 # Lint all packages
pnpm format               # Format all code
pnpm type-check           # Type check without building

# Maintenance
pnpm clean                # Clean builds and caches
pnpm add <pkg> -w         # Add root dependency
pnpm add <pkg> --filter <pkg>  # Add to specific package
```

### File Structure

```
monorepo/
├── .gitignore
├── eslint.config.js
├── .prettierrc.json
├── .prettierignore
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── dist/ (gitignored)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   ├── api/
│   │   └── [same structure]
│   └── cli/
│       └── [same structure]
└── node_modules/ (gitignored)
```

### Import Rules

```typescript
// ✅ Correct ESM imports
import { x } from "./file.js"; // Local file
import { x } from "@myapp/shared"; // Workspace package
import { x } from "express"; // npm package

// ❌ Wrong
import { x } from "./file"; // Missing .js
import { x } from "./file.ts"; // Don't use .ts
```

You're now a monorepo expert! 🎓
