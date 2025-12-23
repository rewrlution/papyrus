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

## 📚 Additional Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

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
