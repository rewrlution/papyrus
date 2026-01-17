# Developer Guide

Welcome to the team! This guide will help you get up and running quickly with our monorepo.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10+ (`npm install -g pnpm`)

### Initial Setup

```bash
# Clone the repository
git clone <repo-url>
cd my-monorepo

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Verify everything works
pnpm test

# Init husky
pnpm exec husky init

# Generate a .env file by following instructions on .env.example
```

### VS Code Setup

This project includes recommended VS Code extensions for the best development experience.

**Install Recommended Extensions:**

1. Open VS Code Extensions panel: `Cmd+Shift+X` (Mac) or `Ctrl+Shift+X` (Windows/Linux)
2. Type `@recommended` in the search box
3. Click "Install" on all **Workspace Recommendations**

**Recommended extensions include:**

- ESLint - Code linting
- Prettier - Code formatting
- Tailwind CSS IntelliSense - Tailwind autocompletion
- Prisma - Database schema support

**Alternative: Install via CLI**

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension prisma.prisma
```

## 📦 Project Structure

```
my-monorepo/
├── packages/
│   ├── shared/       # Shared utilities and types
│   ├── api/          # Express REST API
│   └── cli/          # Terminal application
└── [config files]    # Shared configurations
```

## 🛠️ Essential Commands

### Development

```bash
# Run all packages in watch mode (recommended for active development)
pnpm dev

# Run a specific package only
pnpm --filter @myapp/api dev
pnpm --filter @myapp/cli dev
pnpm --filter @myapp/shared dev
```

### Building

```bash
# Build all packages (in correct dependency order)
pnpm build

# Build a specific package
pnpm --filter @myapp/api build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Test a specific package
pnpm --filter @myapp/api test
```

### Code Quality

```bash
# Lint all code
pnpm lint

# Format all code
pnpm format

# Type check without building
pnpm type-check
```

## 🔧 Setting Up Pre-commit Hooks

Pre-commit hooks automatically lint and format your code before each commit, ensuring code quality.

### Install Husky (one-time setup)

```bash
# Install husky and lint-staged at workspace root
pnpm add -D husky lint-staged -w

# Initialize husky
pnpm exec husky init
```

### Configure the Hook

Create `.husky/pre-commit`:

```bash
#!/bin/sh
pnpm lint-staged
```

### Add lint-staged Configuration

Add to root `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Verify It Works

```bash
# Make a change
echo "// test" >> packages/shared/src/index.ts

# Commit - you should see lint-staged run automatically
git add .
git commit -m "test: verify pre-commit hook"
```

**Note**: The `.husky/_` folder is auto-generated and already in `.gitignore` - don't commit it!

## 📝 Common Workflows

### Working on a Feature

```bash
# 1. Create a feature branch
git checkout -b feature/my-feature

# 2. Start development mode
pnpm dev

# 3. Make your changes

# 4. Run tests
pnpm test

# 5. Lint and format (or let pre-commit hook do it)
pnpm lint
pnpm format

# 6. Commit (pre-commit hook runs automatically)
git add .
git commit -m "feat: add my feature"
```

### Adding Dependencies

```bash
# Add to a specific package
pnpm add <package-name> --filter @myapp/api

# Add dev dependency to workspace root (use -w flag!)
pnpm add -D <package-name> -w

# Add workspace dependency (in package.json)
"dependencies": {
  "@myapp/shared": "workspace:*"
}
```

### Debugging TypeScript Issues

```bash
# If you see "Cannot find module '@myapp/shared'"
# 1. Ensure dependencies are installed
pnpm install

# 2. Build the dependency
pnpm --filter @myapp/shared build

# 3. Build everything
pnpm build

# 4. Clear cache if still having issues
rm -rf .turbo
pnpm build
```

## 🎯 Package-Specific Commands

### API Server

```bash
# Development with hot reload
pnpm --filter @myapp/api dev

# Build
pnpm --filter @myapp/api build

# Start production server
cd packages/api && node dist/index.js
```

### CLI Tool

```bash
# Development mode
pnpm --filter @myapp/cli dev

# Run the CLI
pnpm --filter @myapp/cli start
```

### Shared Package

```bash
# Build (required before others can use it)
pnpm --filter @myapp/shared build

# Test
pnpm --filter @myapp/shared test
```

## 💡 Pro Tips

### Turbo Caching

Turborepo caches builds automatically. If nothing changed, builds are instant!

```bash
# First build - cache miss
pnpm build  # Takes time

# Second build - cache hit
pnpm build  # Instant! ⚡
```

To clear cache: `rm -rf .turbo`

### Why lint-staged?

Pre-commit hooks use `lint-staged` to only check **files you're committing**, not the entire codebase:

```bash
# Without lint-staged
pnpm lint  # 😰 Checks 1000+ files (slow!)

# With lint-staged
lint-staged  # 😊 Checks only 3 modified files (fast!)
```

This means faster commits and you won't be blocked by legacy code issues you didn't touch.

### Working Directory Best Practices

```bash
# Prefer running from root with --filter
pnpm --filter @myapp/api test

# Or navigate to package
cd packages/api
pnpm test
```

## 🚨 Common Issues

### "Cannot find module" Errors

**Problem**: Import errors when running code

**Solution**:

1. Run `pnpm install`
2. Build dependencies: `pnpm --filter @myapp/shared build`
3. Use `.js` extensions in imports (not `.ts`)

### Build Order Issues

**Problem**: Packages build in wrong order

**Solution**:

1. Check `tsconfig.json` has correct `references`
2. Ensure `pnpm-workspace.yaml` includes all packages
3. Clear cache: `rm -rf .turbo`

### Pre-commit Hook Not Running

**Problem**: Hook doesn't execute on commit

**Solution**:

1. Ensure `husky init` was run
2. Check `.husky/pre-commit` is executable: `chmod +x .husky/pre-commit`
3. Verify `lint-staged` is in root `package.json`

### Installing Packages at Root

**Problem**: Error when adding packages to workspace root

**Solution**: Always use the `-w` flag:

```bash
pnpm add -D <package> -w  # ✅ Correct
pnpm add -D <package>     # ❌ Error
```

## 🏷️ Releasing and Pushing Tags

When you're satisfied with the main branch and ready to create a release, there are two approaches:

### ⚠️ Important: Bump Shared Package Version When Needed

**Before releasing**, check if you've made changes to `packages/shared/`. If you have, you **MUST** bump its version:

```bash
# Check if shared package has changes since last tag
git diff $(git describe --tags --abbrev=0) -- packages/shared/

# If there are changes, bump the version in packages/shared/package.json
cd packages/shared
npm version patch  # or minor/major as appropriate
cd ../..
```

**Why?** The CLI depends on `@rewrlution/papyrus-shared` from npm (not the local workspace) when users install it globally. If you add new exports to shared but don't bump its version, the publish workflow will skip it (version already exists on npm), and CLI users will get errors like:

```
import { NewSchema } from '@rewrlution/papyrus-shared';
         ^^^^^^^^^
SyntaxError: Named export 'NewSchema' not found
```

**Rule of thumb:** If you touch `packages/shared/src/`, bump its version before releasing.

### Approach 1: Using npm version (Recommended)

This approach automatically bumps the version in `package.json`, creates a commit, and creates a git tag:

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Bump version (choose one)
npm version patch   # 0.0.1 -> 0.0.2 (bug fixes)
npm version minor   # 0.0.1 -> 0.1.0 (new features)
npm version major   # 0.0.1 -> 1.0.0 (breaking changes)

# Push the commit and tag together
git push origin main --tags
```

**What `npm version` does:**

1. Updates `version` in `package.json`
2. Creates a commit with message `v0.0.2` (or whatever version)
3. Creates a git tag `v0.0.2`

### Approach 2: Manual Tag Creation

If you want more control or need to tag an existing commit without changing `package.json`:

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create an annotated tag (recommended)
git tag -a v0.0.2 -m "Release v0.0.2: Brief description of changes"

# Or create a lightweight tag (simpler, no message)
git tag v0.0.2

# Push the tag to remote
git push origin v0.0.2

# Or push all tags at once
git push origin --tags
```

**Tag an older commit:**

```bash
# Find the commit hash you want to tag
git log --oneline

# Tag that specific commit
git tag -a v0.0.2 <commit-hash> -m "Release v0.0.2"

# Push the tag
git push origin v0.0.2
```

### Viewing and Managing Tags

```bash
# List all tags
git tag

# List tags with messages
git tag -n

# Show details of a specific tag
git show v0.0.2

# Delete a local tag
git tag -d v0.0.2

# Delete a remote tag
git push origin --delete v0.0.2
```

### Best Practices

- **Use annotated tags** (`-a`) for releases - they include metadata like author and date
- **Follow semantic versioning** (semver): `major.minor.patch`
- **Write meaningful tag messages** describing what's in the release
- **Always test before tagging** - run `pnpm build && pnpm test` first

## 📚 Additional Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Semantic Versioning](https://semver.org/)

## 🤝 Getting Help

- Check existing issues in the repo
- Ask in team chat
- Review the full tutorial series in this repo

---

**Quick Command Reference**:

```bash
pnpm install    # Install dependencies
pnpm dev        # Start development
pnpm build      # Build all packages
pnpm test       # Run all tests
pnpm lint       # Check code quality
pnpm format     # Format code
```

Happy coding! 🎉
