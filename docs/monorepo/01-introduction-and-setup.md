# Part 1: Introduction and Your First Monorepo

Welcome to this hands-on tutorial series! By the end of this series, you'll have built a complete monorepo with multiple packages that work together. Don't worry if you've never worked with monorepos before - we'll start from scratch and build up gradually.

## What You'll Build

Imagine you're building a product that has:

- A **web API** that serves data
- A **command-line tool** for managing the API
- **Shared code** that both tools use (like formatting functions, data types, etc.)

Without a monorepo, you'd have 3 separate projects. Keeping them in sync would be a nightmare. With a monorepo, all your code lives in one place, making it easy to:

- Share code between projects
- Make changes across multiple packages at once
- Ensure everything stays compatible
- Run tests and builds for everything together

## The Big Picture

Here's what we're building:

```
monorepo/
├── packages/
│   ├── shared/          ← Common utilities and types
│   ├── api/             ← Express REST API
│   └── cli/             ← Terminal application
└── [config files]       ← Shared configurations
```

The **shared** package contains code that both the API and CLI use. When you change something in shared, both apps automatically get the update!

## What is a Monorepo?

A **monorepo** (mono = one, repo = repository) is a single Git repository that holds multiple projects. Think of it like a house with multiple rooms instead of separate buildings.

**Benefits:**

- ✅ Share code easily between projects
- ✅ Change multiple packages together
- ✅ One place to manage dependencies
- ✅ Consistent tooling (linting, testing, building)
- ✅ Simplified versioning

**Real-world examples:** Google, Meta, and Microsoft all use monorepos for their major projects.

## Our Tech Stack

We'll use modern tools that work great together:

- **pnpm** - Fast package manager (like npm, but faster and better for monorepos)
- **Turborepo** - Smart build system that caches builds and runs tasks in the right order
- **TypeScript** - JavaScript with types (catches bugs before runtime)
- **ESM** - Modern JavaScript modules (the `import/export` syntax)

Don't worry if some of these are new - we'll explain as we go!

## Prerequisites

Before starting, make sure you have:

- **Node.js** 18 or higher ([download here](https://nodejs.org/))
- **pnpm** installed: `npm install -g pnpm`
- A code editor (VS Code recommended)
- Basic JavaScript/TypeScript knowledge

Check your versions:

```bash
node --version  # Should be 18+
pnpm --version  # Should be 8+
```

## Step 1: Create Your Project Directory

Let's start! Create a new folder for your project:

```bash
mkdir my-monorepo
cd my-monorepo
```

## Step 2: Set Up Version Control

Before we add any code, let's set up Git and define what to ignore.

### Initialize Git

```bash
git init
```

### Create .gitignore

Create a `.gitignore` file to exclude files that shouldn't be committed:

```
# Dependencies
node_modules/

# Build outputs
dist/
.turbo/

# Testing
coverage/

# Logs
*.log
logs/

# Environment variables
.env
.env.local
.env.*.local

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Husky (commit only these files)
.husky/_
```

**Important notes about what to commit:**

- ✅ **Commit**: `.husky/pre-commit`, `.husky/commit-msg` (your hook scripts)
- ❌ **Don't commit**: `.husky/_` (husky's internal folder, auto-generated)
- ✅ **Commit**: `pnpm-lock.yaml` (ensures consistent installs)
- ❌ **Don't commit**: `node_modules/`, `dist/`, `.turbo/` (generated files)

This `.gitignore` covers everything you'll need throughout the tutorial series.

## Step 3: Initialize pnpm Workspace

A **workspace** tells pnpm that this is a monorepo with multiple packages.

Create a file called `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
```

This tells pnpm: "Look in the `packages/` folder for all our packages."

## Step 4: Create Root package.json

Every Node.js project needs a `package.json`. Create one at the root:

```json
{
  "name": "my-monorepo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "test": "turbo run test",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@typescript-eslint/eslint-plugin": "^8.18.2",
    "@typescript-eslint/parser": "^8.18.2",
    "eslint": "^9.17.0",
    "prettier": "^3.4.2",
    "turbo": "^2.3.3",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

**Key points:**

- `"private": true` - This root package won't be published to npm
- `"type": "module"` - We're using modern ESM modules
- `"packageManager"` - Locks pnpm version for consistency
- Scripts use `turbo` - We'll configure this next
- `lint` and `format` - Code quality and formatting tools

**Installing root dependencies:**

When adding packages at the root level in a pnpm workspace, **always use the `-w` flag**:

```bash
pnpm add -D typescript -w     # ✅ Correct
pnpm add -D typescript        # ❌ Error: requires -w flag
```

The `-w` flag explicitly tells pnpm to install at the workspace root, preventing accidental installations in the wrong location.

## Step 5: Configure Turbo

Create `turbo.json` - this tells Turbo how to build and test your packages:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {
      "outputs": []
    },
    "format": {
      "outputs": [],
      "cache": false
    }
  }
}
```

**What this means:**

- `"build"` - Before building a package, build its dependencies first (`^build`)
- `"dev"` - Development mode doesn't cache (always runs fresh)
- `"test"` - Tests run after building
- `"lint"` - Check code quality (cached for performance)
- `"format"` - Format code (no cache, always formats fresh)

## Step 6: Add TypeScript Configuration

Create `tsconfig.base.json` - all packages will extend this:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist"]
}
```

This sets up TypeScript with:

- Modern JavaScript features (`ES2022`)
- ESM modules (`NodeNext`)
- Strict type checking (catches more bugs!)
- Source maps (for debugging)

## Step 7: Configure ESLint

Create `eslint.config.js` for code quality checks (ESLint v9 uses the flat config format):

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

**What this does:**

- Uses the new ESLint v9 flat config format
- Configures TypeScript-specific linting rules
- Ignores build output and dependencies
- Allows unused variables that start with `_`

## Step 8: Configure Prettier

Create `.prettierrc.json` for consistent code formatting:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

Create `.prettierignore` to skip formatting certain files:

```
node_modules
dist
.turbo
coverage
pnpm-lock.yaml
```

## Step 9: Install Dependencies

Now install everything:

```bash
pnpm install
```

You should see pnpm download and install all the tools we need. This might take a minute.

## Step 10: Verify Your Setup

Check that everything is working:

```bash
# Check that turbo is installed
pnpm exec turbo --version

# Check TypeScript
pnpm exec tsc --version
```

You should see version numbers printed out. If you get errors, go back and check your `package.json`.

## What We've Accomplished

At this point, you have:

✅ A workspace configured for multiple packages
✅ Turborepo set up for smart builds
✅ TypeScript configured for type safety
✅ All tools installed and ready

Your project structure looks like:

```
my-monorepo/
├── .git/
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── eslint.config.js
├── .prettierrc.json
├── .prettierignore
├── node_modules/
└── pnpm-lock.yaml
```

## Understanding What We Set Up

Before moving on, let's understand what each file does:

- **pnpm-workspace.yaml** - Defines where packages live
- **package.json** - Root dependencies and scripts
- **turbo.json** - Build orchestration rules
- **tsconfig.base.json** - Shared TypeScript settings
- **eslint.config.js** - Code quality rules
- **.prettierrc.json** - Code formatting rules

## Next Steps

In the next tutorial, we'll create your first package: the **shared** package. This will contain utilities and types that our API and CLI will both use.

But first, let's verify everything is working by running:

```bash
pnpm build
```

You should see: "No projects in scope" - that's perfect! We haven't created any packages yet.

## Quick Troubleshooting

**Problem:** `pnpm: command not found`
**Solution:** Install pnpm: `npm install -g pnpm`

**Problem:** TypeScript errors
**Solution:** Make sure `tsconfig.base.json` has no typos

**Problem:** Turbo not found
**Solution:** Run `pnpm install` again

## Summary

In this tutorial, you:

1. Learned what a monorepo is and why it's useful
2. Set up a workspace with pnpm
3. Configured Turborepo for smart builds
4. Added TypeScript for type safety
5. Installed all necessary tools

**Next:** [Part 2 - Creating Your First Package →](02-your-first-package.md)

You now have a solid foundation! In the next part, we'll create actual code and see your monorepo come to life.
