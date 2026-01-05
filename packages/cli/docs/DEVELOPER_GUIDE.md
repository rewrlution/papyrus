# Development Guide

This guide covers development setup, testing, building, and deployment for Papyrus CLI.

## Prerequisites

- Node.js 18 or higher
- pnpm 10 or higher
- Git

## Setup Development Environment

```bash
# Clone monorepo
git clone https://github.com/your-username/papyrus.git
cd papyrus

# Install dependencies
pnpm install

# Build shared package (required dependency)
cd packages/shared
pnpm build

# Return to CLI package
cd ../cli
```

## Development Workflow

```bash
# Watch mode (auto-reloads on changes)
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Run built CLI
pnpm start

# Or run directly with tsx
tsx src/cli.tsx add --date today
```

## Project Structure

```
packages/cli/
├── src/
│   ├── cli.tsx              # Entry point
│   ├── commands/            # Command handlers
│   │   ├── auth/            # Auth commands (login, register, logout)
│   │   └── journal/         # Journal commands (add, show, list, sync)
│   ├── components/          # React/Ink UI components
│   ├── lib/                 # Business logic
│   │   ├── api/             # API client
│   │   ├── auth/            # Auth middleware
│   │   ├── storage/         # Local storage
│   │   └── sync/            # Sync engine
│   └── utils/               # Utilities (date, editor, token)
├── docs/                    # Documentation
├── tests/                   # Tests
├── dist/                    # Build output
└── package.json
```

## Running Tests

```bash
# Run tests once
pnpm test

# Watch mode
pnpm test --watch

# With UI
pnpm test --ui

# From monorepo root
pnpm test --filter=@rewrlution/papyrus-cli
```

## Local Testing

When developing, you need to test your changes before publishing. Here are different approaches depending on your needs.

### Option 1: Using `pnpm link` (Recommended)

Test the CLI exactly as end users would, using the global `papyrus` command.

**When to use:** Testing the full user experience, verifying production builds, final testing before release.

```bash
# 1. If you have the npm package installed globally, uninstall it first
npm uninstall -g @rewrlution/papyrus-cli

# 2. Build your local changes
cd packages/cli
pnpm build

# 3. Link your local version globally
pnpm link --global

# 4. IMPORTANT: Restart your terminal
# Close and reopen your terminal for the PATH changes to take effect
# (especially important on Windows)

# 5. Now 'papyrus' and 'paper' use your local code!
papyrus logout
paper add
papyrus list

# 6. When done testing, unlink
pnpm unlink --global

# 7. (Optional) Reinstall the published version
npm i -g @rewrlution/papyrus-cli
```

**Pros:**

- ✅ Test exactly like end users (global command)
- ✅ Test production build
- ✅ No path specifications needed

**Cons:**

- ❌ Must rebuild after each code change

### Option 2: Direct Execution (Quick Testing)

Run the built CLI directly without global installation.

**When to use:** Quick one-off tests, testing in CI, avoiding global package conflicts.

```bash
# Build once
cd packages/cli
pnpm build

# Run directly with node
node dist/cli.js logout
node dist/cli.js add
node dist/cli.js list

# Or use pnpm start (shortcut for node dist/cli.js)
pnpm start logout
pnpm start add
```

**Pros:**

- ✅ No global package conflicts
- ✅ Quick for one-off tests

**Cons:**

- ❌ Must type full path or `node dist/cli.js`
- ❌ Must rebuild after changes

### Option 3: Development Mode (Fastest Iteration)

Run TypeScript directly without building, with hot reload on file changes.

**When to use:** Active development, rapid iteration, debugging.

```bash
# Terminal 1: Watch for file changes (optional)
cd packages/cli
pnpm dev

# Terminal 2: Run commands directly with tsx
npx tsx src/cli.tsx logout
npx tsx src/cli.tsx add
npx tsx src/cli.tsx list
```

**Pros:**

- ✅ No build step needed
- ✅ Fastest development cycle
- ✅ Immediate feedback

**Cons:**

- ❌ Requires typing full path each time
- ❌ Not testing production build
- ❌ Slightly different runtime than production

### Option 4: Shell Alias (Convenience)

Create a shorter command for development testing.

**When to use:** Frequent testing during development, when you want convenience of a short command.

```bash
# Add to ~/.bashrc, ~/.zshrc, or PowerShell profile

# For production-like testing (requires rebuild)
alias papyrus-dev='node /path/to/papyrus/packages/cli/dist/cli.js'

# For hot-reload development
alias papyrus-dev='npx tsx /path/to/papyrus/packages/cli/src/cli.tsx'

# Then use like normal
papyrus-dev logout
papyrus-dev add
```

### Quick Comparison

| Method               | Command                   | Rebuild needed? | Like production? | Speed   |
| -------------------- | ------------------------- | --------------- | ---------------- | ------- |
| **pnpm link**        | `papyrus xxx`             | Yes             | ✅ Yes           | Medium  |
| **Direct execution** | `node dist/cli.js xxx`    | Yes             | ✅ Yes           | Medium  |
| **Dev mode (tsx)**   | `npx tsx src/cli.tsx xxx` | No              | ❌ No            | Fast    |
| **Shell alias**      | `papyrus-dev xxx`         | Depends         | Depends          | Depends |

### Recommended Workflow

1. **During active development:** Use Option 3 (tsx) for rapid iteration
2. **Before committing:** Use Option 1 (pnpm link) to test production build
3. **For quick checks:** Use Option 2 (direct execution)

## Building for Production

```bash
# Clean build
rm -rf dist
pnpm build

# Test tarball (simulates npm publish)
npm pack

# Install from tarball
npm install -g ./rewrlution-papyrus-cli-*.tgz
```

## Deployment

### Versioning

Papyrus follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes (e.g., command renamed)
- **MINOR**: New features (e.g., new command added)
- **PATCH**: Bug fixes (e.g., error handling fixed)

### Release Process

```bash
# Happypath release process
cd packages/cli
pnpm version patch
git push origin --follow-tags
```

```bash
# 1. Update version in package.json
vim packages/cli/package.json
# Change "version": "0.0.1" to "0.0.2"

# 2. Update CHANGELOG.md
vim packages/cli/CHANGELOG.md
# Document changes

# 3. Commit changes
git add packages/cli/package.json packages/cli/CHANGELOG.md
git commit -m "chore(cli): bump version to 0.0.2"

# 4. Create tag
# For bug fixes (1.0.0 → 1.0.1)
npm version patch
git push --follow-tags

# For new features (1.0.0 → 1.1.0)
npm version minor
git push --follow-tags

# For breaking changes (1.0.0 → 2.0.0)
npm version major
git push --follow-tags
```

The `npm version` command:

- ✅ Updates `package.json`
- ✅ Creates a git commit
- ✅ Creates a git tag
- ✅ All in one command!

## Quick Reference Card

```bash
# Normal development (no publish)
git add .
git commit -m "Add feature"
git push origin main

# When ready to release (publishes to npm)
npm version patch      # or minor/major
git push --follow-tags

# Delete tags (only use it if you create a tag by mistake)
git tag -d v1.0.0
```

**For detailed deployment instructions, see [10-DEPLOYMENT-GUIDE.md](./10-DEPLOYMENT-GUIDE.md).**

## Architecture

### Technology Stack

- **TypeScript** - Type-safe development
- **Commander.js** - CLI framework (git-like commands)
- **Ink** - React for terminal UIs
- **React** - UI component library
- **Axios** - HTTP client for API calls
- **date-fns** - Date manipulation
- **env-paths** - XDG-compliant path resolution
- **Zod** - Runtime type validation (from shared package)

### Key Design Decisions

**Why Ink (React)?**

- Declarative UI (easier than imperative terminal APIs)
- Component reusability
- State management with hooks
- Familiar for React developers

**Why Local-First?**

- Fast (no network latency)
- Works offline
- User owns their data (markdown files)
- Sync is optional enhancement

**Why XDG Base Directory?**

- Standard on Linux/Unix
- Predictable locations
- Respects user preferences
- Clean home directory

**Why Hash-Based Sync?**

- Efficient (compare hashes, not full content)
- Detects changes reliably
- Enables three-way merge
- No server-side state required

## Troubleshooting Development Issues

### "Cannot find module '@rewrlution/papyrus-shared'"

**Cause:** Development environment not set up correctly.

**Solution:**

```bash
# Build shared package first
cd packages/shared
pnpm build

# Then build CLI
cd ../cli
pnpm build
```

### Build Errors

**Solution:**

```bash
# Clean node_modules and rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

## Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs

1. Check existing issues: https://github.com/your-username/papyrus/issues
2. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (OS, Node version)
   - Error messages/screenshots

### Suggesting Features

1. Open a discussion: https://github.com/your-username/papyrus/discussions
2. Describe the feature and use case
3. Consider implementation approach
4. Be open to feedback

### Contributing Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes following code style
4. Add tests
5. Update documentation
6. Run tests: `pnpm test`
7. Run linter: `pnpm lint`
8. Commit: `git commit -m "feat(cli): add search command"`
9. Push: `git push origin feature/my-feature`
10. Open Pull Request

**Code Style:**

- Use TypeScript
- Follow existing patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write tests for new features

**Commit Messages:**

- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`
- Examples:
  - `feat(cli): add search command`
  - `fix(sync): handle conflict resolution`
  - `docs: update README with examples`

## Additional Documentation

- **[CLAUDE.md](../CLAUDE.md)** - Complete development guide
- **[Deployment Guide](./10-DEPLOYMENT-GUIDE.md)** - CI/CD and npm publishing
- **[Tutorials](./README.md)** - Step-by-step implementation guides
