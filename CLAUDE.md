# Papyrus Monorepo - Claude Development Guide

This guide provides an overview of the Papyrus monorepo and how to work with it effectively.

```
██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║██╔════╝
██████╔╝███████║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║███████╗
██╔═══╝ ██╔══██║██╔═══╝   ╚██╔╝  ██╔══██╗██║   ██║╚════██║
██║     ██║  ██║██║        ██║   ██║  ██║╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

> An AI-powered journaling tool built for developers

## Overview

Papyrus is a journaling system designed for developers to capture thoughts, progress, and insights directly from the command line. The project is organized as a monorepo containing multiple packages that work together.

## Monorepo Structure

```
papyrus/
├── packages/
│   ├── cli/              # Command-line interface
│   ├── api/              # Backend API server
│   └── shared/           # Shared types and utilities
├── docs/                 # Project-wide documentation
│   └── TUTOR-PRINCIPLES.md
├── package.json          # Root package configuration
├── pnpm-workspace.yaml   # Workspace configuration
├── turbo.json            # Turborepo configuration
├── tsconfig.base.json    # Base TypeScript config
└── CLAUDE.md            # This file
```

## Packages

### CLI (`packages/cli`)

**Purpose:** Terminal-based journal management tool

**Key Features:**

- Interactive journal browser with vim-style navigation
- External editor integration (vim, nano, VS Code)
- Authentication with JWT tokens
- Sync with remote server
- XDG-compliant local storage

**Tech Stack:** TypeScript, Commander.js, Ink (React for CLI), Axios

**Entry Points:**

- `papyrus add` - Create new journal entry
- `papyrus app` - Launch TUI to browse and read entries interactively
- `papyrus show` - Read entry in viewer
- `papyrus sync` - Sync with server
- `papyrus login/logout` - Authentication

**Documentation:** See [packages/cli/CLAUDE.md](./packages/cli/CLAUDE.md)

### API (`packages/api`)

**Purpose:** Backend server for journal synchronization

**Key Features:**

- RESTful API for journal operations
- User authentication and authorization
- Database persistence
- Cloudflare Workers deployment

**Tech Stack:** TypeScript, Hono (web framework), Cloudflare Workers, D1 (database)

**Endpoints:**

- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Authenticate user
- `GET /journals` - List user's journals
- `POST /journals` - Create/update journal
- `DELETE /journals/:date` - Delete journal

**Documentation:** See [packages/api/CLAUDE.md](./packages/api/CLAUDE.md) (if exists)

### Shared (`packages/shared`)

**Purpose:** Common types, schemas, and utilities

**Key Features:**

- Zod validation schemas
- TypeScript type definitions
- Content hashing utilities
- Date format constants

**Tech Stack:** TypeScript, Zod

**Exports:**

- Schemas: `DateStringSchema`, `SignupSchema`, `SigninSchema`
- Utilities: `generateContentHash()`
- Constants: `DATE_FORMAT`, `DATE_FORMAT_REGEX`

**Documentation:** See [packages/shared/CLAUDE.md](./packages/shared/CLAUDE.md)

## Getting Started

### Prerequisites

- **Node.js** (v20+)
- **pnpm** (v10+) - Fast, efficient package manager
- **Git**

### Initial Setup

```bash
# Clone the repository
git clone <repo-url>
cd papyrus

# Install dependencies (all packages)
pnpm install

# Build all packages
pnpm build
```

### Development Workflow

#### Work on CLI Only

```bash
# Terminal 1: Build shared package once
cd packages/shared
pnpm build

# Terminal 2: Develop CLI
cd packages/cli
pnpm dev
```

#### Work on API Only

```bash
# Terminal 1: Build shared package once
cd packages/shared
pnpm build

# Terminal 2: Develop API
cd packages/api
pnpm dev
```

#### Work on Multiple Packages

```bash
# Watch all packages in parallel
pnpm dev

# This runs:
# - packages/shared: tsc --watch
# - packages/cli: tsx watch src/cli.tsx
# - packages/api: wrangler dev
```

### Build Everything

```bash
# From monorepo root
pnpm build

# This runs:
# 1. packages/shared: tsc
# 2. packages/cli: tsc
# 3. packages/api: tsc
# (Turborepo ensures correct order)
```

### Run Tests

```bash
# Test all packages
pnpm test

# Test specific package
pnpm test --filter=@rewrlution/papyrus-cli
pnpm test --filter=@rewrlution/papyrus-shared
pnpm test --filter=@rewrlution/papyrus-api
```

## Monorepo Tools

### pnpm Workspaces

**What it does:** Manages dependencies across packages efficiently.

**Key concepts:**

- Shared `node_modules` at root (saves disk space)
- Workspace protocol for local dependencies: `"@rewrlution/papyrus-shared": "workspace:*"`
- Install all dependencies: `pnpm install` (from root)
- Add dependency to specific package: `pnpm add axios --filter=@rewrlution/papyrus-cli`

**Configuration:** `pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
```

### Turborepo

**What it does:** Orchestrates build tasks across packages.

**Key features:**

- **Dependency ordering** - Builds packages in correct order
- **Caching** - Skips unchanged builds
- **Parallelization** - Runs independent tasks concurrently

**Configuration:** `turbo.json`

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"], // Build dependencies first
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**Usage:**

```bash
# Run build in all packages (respects dependencies)
turbo run build

# Run dev in all packages (parallel)
turbo run dev --parallel
```

### TypeScript Project References

**What it does:** Enables incremental builds across packages.

**Configuration:** `tsconfig.base.json` (root) + individual `tsconfig.json` (each package)

```json
// packages/cli/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "references": [
    { "path": "../shared" } // Depend on shared package
  ]
}
```

**Benefits:**

- Faster builds (only rebuild changed packages)
- Better IDE support (jump to definitions across packages)
- Type checking across package boundaries

## Package Dependencies

```
┌─────────────┐
│     CLI     │─────┐
└─────────────┘     │
                    ▼
┌─────────────┐  ┌─────────────┐
│     API     │──▶│   Shared    │
└─────────────┘  └─────────────┘
```

- **CLI** depends on **Shared** (types, schemas, utilities)
- **API** depends on **Shared** (types, schemas, utilities)
- **Shared** has no dependencies on other packages (pure library)

**Why this structure:**

- Shared types ensure CLI and API agree on data format
- No circular dependencies
- Easy to add new packages (just depend on shared)

## Common Workflows

### Adding a New Feature

1. **Update shared types** (if needed):

   ```bash
   cd packages/shared
   # Edit src/schemas/...
   pnpm build
   ```

2. **Implement in CLI**:

   ```bash
   cd packages/cli
   # Create src/commands/journal/new-feature.ts
   pnpm dev
   ```

3. **Implement in API**:

   ```bash
   cd packages/api
   # Create src/routes/new-feature.ts
   pnpm dev
   ```

4. **Test**:
   ```bash
   pnpm test  # From root, tests all packages
   ```

### Adding a New Dependency

```bash
# Add to specific package
pnpm add <package> --filter=@rewrlution/papyrus-cli

# Add to all packages
pnpm add <package> -w

# Add dev dependency to root
pnpm add -D <package> -w
```

### Updating Dependencies

```bash
# Update all dependencies
pnpm update -r

# Update specific package
pnpm update axios --filter=@rewrlution/papyrus-cli

# Check for outdated packages
pnpm outdated -r
```

## Scripts Reference

### Root Level (`package.json`)

| Script   | Command                                    | Description               |
| -------- | ------------------------------------------ | ------------------------- |
| `build`  | `turbo run build`                          | Build all packages        |
| `dev`    | `turbo run dev --parallel`                 | Watch all packages        |
| `test`   | `turbo run test`                           | Test all packages         |
| `lint`   | `eslint . --ext .ts,.tsx`                  | Lint all TypeScript files |
| `format` | `prettier --write "**/*.{ts,tsx,json,md}"` | Format all files          |

### Per-Package Scripts

See individual package `CLAUDE.md` files:

- [CLI Scripts](./packages/cli/CLAUDE.md#package-scripts)
- [Shared Scripts](./packages/shared/CLAUDE.md#development-workflow)

## Architecture Decisions

### Why Monorepo?

**Decision:** Use a monorepo instead of separate repositories.

**Reasoning:**

- **Shared code:** Easy to share types between CLI and API
- **Atomic changes:** Update API and CLI together in one commit
- **Consistent tooling:** Single ESLint, Prettier, TypeScript config
- **Easier testing:** Test integration between packages

**Trade-offs:**

- More complex setup (but tools like Turborepo help)
- Larger repository size (but manageable with ~3 packages)

### Why pnpm?

**Decision:** Use pnpm instead of npm or yarn.

**Reasoning:**

- **Disk efficiency:** Shared dependencies via hard links
- **Speed:** Faster than npm, comparable to yarn
- **Workspace support:** First-class monorepo support
- **Strict:** Doesn't allow using undeclared dependencies

### Why Turborepo?

**Decision:** Use Turborepo for task orchestration.

**Reasoning:**

- **Smart caching:** Skip unchanged package builds
- **Dependency-aware:** Builds packages in correct order
- **Parallel execution:** Faster builds
- **Simple configuration:** Just `turbo.json`

**Alternatives considered:**

- Lerna (older, more complex)
- Nx (more features, steeper learning curve)
- Custom scripts (too much manual work)

## Common Issues

### "Cannot find module '@rewrlution/papyrus-shared'"

**Cause:** Shared package not built or installed.

**Solution:**

```bash
# Build shared package
cd packages/shared
pnpm build

# Or rebuild everything
cd ../..
pnpm build
```

### Build Fails with Type Errors

**Cause:** TypeScript project references out of sync.

**Solution:**

```bash
# Clean build all packages
rm -rf packages/*/dist
pnpm build
```

### Changes in Shared Not Reflected in CLI/API

**Cause:** Forgot to rebuild shared package.

**Solution:**

```bash
# Rebuild shared
cd packages/shared
pnpm build

# Or use watch mode during development
pnpm dev
```

### pnpm Commands Not Working

**Cause:** Wrong directory or missing workspace configuration.

**Solution:**

```bash
# Always run from root for monorepo commands
cd /path/to/papyrus
pnpm build

# Or cd into specific package
cd packages/cli
pnpm build
```

### "Named export not found" After Installing CLI from npm

**Cause:** The shared package version wasn't bumped before releasing.

**Example error:**

```
import { StandupStreamEventSchema } from '@rewrlution/papyrus-shared';
         ^^^^^^^^^^^^^^^^^^^^^^^^
SyntaxError: Named export 'StandupStreamEventSchema' not found
```

**Solution:**

1. Bump the shared package version: `cd packages/shared && npm version patch`
2. Create a new release tag and push

**Prevention:** Always bump `packages/shared/package.json` version when you add/change exports in the shared package before releasing CLI.

## Best Practices

### 1. Always Build Shared First

When starting development:

```bash
cd packages/shared
pnpm build  # Build once

cd ../cli
pnpm dev    # Now CLI can use shared types
```

Or use watch mode:

```bash
cd packages/shared
pnpm dev    # Auto-rebuild on changes
```

### 2. Use Workspace Protocol

In package.json, reference local packages with `workspace:*`:

```json
{
  "dependencies": {
    "@rewrlution/papyrus-shared": "workspace:*"
  }
}
```

This ensures pnpm links to local package instead of npm registry.

### 3. Keep Shared Package Lean

Only put truly shared code in `packages/shared`:

- ✅ Types used by both CLI and API
- ✅ Validation schemas for API contracts
- ✅ Utility functions used by multiple packages
- ❌ CLI-specific UI components
- ❌ API-specific database logic

### 4. Run Tests from Root

Always run tests from monorepo root to test all packages:

```bash
pnpm test  # Tests all packages
```

### 5. Commit Atomic Changes

When changing shared types, update CLI and API in same commit:

```bash
git add packages/shared packages/cli packages/api
git commit -m "Add new journal tags feature"
```

### 6. Document Breaking Changes

When making breaking changes to shared package:

1. Update shared package version
2. Document changes in commit message
3. Update dependent packages in same PR

## Development Tips

### Fast Iteration

```bash
# Terminal 1: Watch shared package
cd packages/shared && pnpm dev

# Terminal 2: Watch CLI
cd packages/cli && pnpm dev

# Terminal 3: Test CLI commands
papyrus app
```

### Debugging

```bash
# Use tsx for debugging (enables source maps)
cd packages/cli
tsx src/cli.tsx list

# Use Node inspector
node --inspect dist/cli.js list
```

### Type Checking

```bash
# Check types across all packages
pnpm build  # Also type-checks

# Check specific package
cd packages/cli
pnpm tsc --noEmit
```

## Project Documentation

- **Root:** `/CLAUDE.md` (this file) - Monorepo overview
- **CLI:** `/packages/cli/CLAUDE.md` - CLI development guide
- **Shared:** `/packages/shared/CLAUDE.md` - Shared package guide
- **API:** `/packages/api/CLAUDE.md` - API development guide (if exists)
- **Tutorials:** `/packages/cli/docs/` - Step-by-step feature tutorials
- **Principles:** `/docs/TUTOR-PRINCIPLES.md` - Documentation guidelines

## Key Technologies

### Build & Package Management

- **pnpm** (v10) - Package manager with workspace support
- **Turborepo** (v2) - Build system orchestrator
- **TypeScript** (v5) - Type-safe JavaScript
- **Vitest** (v4) - Fast unit test framework

### CLI Package

- **Commander.js** - CLI framework
- **Ink** - React for terminal UIs
- **Axios** - HTTP client

### API Package

- **Hono** - Web framework
- **Cloudflare Workers** - Serverless platform
- **D1** - Cloudflare's SQL database

### Shared Package

- **Zod** - Schema validation
- **crypto** - Content hashing

## Contributing

When contributing to Papyrus:

1. **Branch from main**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** in appropriate package(s)

3. **Build and test**

   ```bash
   pnpm build
   pnpm test
   ```

4. **Commit with clear message**

   ```bash
   git commit -m "feat(cli): add journal search command"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```

## Future Enhancements

Potential new packages:

1. **Web UI** (`packages/web`)
   - Browser-based journal interface
   - Built with React/Next.js
   - Shares types with CLI and API via `shared` package

2. **Mobile App** (`packages/mobile`)
   - React Native app
   - Offline-first with sync
   - Shares types via `shared` package

3. **Plugins** (`packages/plugins`)
   - Plugin system for extending functionality
   - Custom templates
   - Export formats

## Resources

### Monorepo Tools

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

### Package Documentation

- [Commander.js](https://github.com/tj/commander.js)
- [Ink](https://github.com/vadimdemedes/ink)
- [Zod](https://zod.dev)
- [Hono](https://hono.dev)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

---

## Quick Reference

```bash
# Setup
pnpm install          # Install all dependencies
pnpm build            # Build all packages

# Development
pnpm dev              # Watch all packages
pnpm test             # Test all packages

# Per-Package
cd packages/<name>    # Navigate to package
pnpm dev              # Develop single package
pnpm build            # Build single package
pnpm test             # Test single package

# Add Dependency
pnpm add <pkg> --filter=@rewrlution/papyrus-<name>

# Troubleshooting
rm -rf node_modules packages/*/node_modules
pnpm install
pnpm build
```

---

**Happy coding!** For package-specific details, see individual `CLAUDE.md` files in each package directory.
