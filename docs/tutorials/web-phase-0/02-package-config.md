# Phase 0.2: Package Configuration

Configure `package.json` with all dependencies and scripts for the web package.

## What We're Building

**Goal:** Create a complete `package.json` that defines the web package, its dependencies, and npm scripts.

**Why:** The package.json is the heart of any npm package. It tells pnpm what to install, what scripts to run, and how this package relates to others in the monorepo.

---

## Prerequisites

- Phase 0.1 completed (project structure created)
- In directory: `/home/user/papyrus/packages/web`

---

## Understanding package.json

### Key Sections

```json
{
  "name": "@rewrlution/papyrus-web",           // Package identifier
  "version": "0.0.1",                          // Semantic version
  "private": true,                             // Not published to npm
  "scripts": { ... },                          // npm/pnpm commands
  "dependencies": { ... },                     // Runtime dependencies
  "devDependencies": { ... }                   // Development dependencies
}
```

**Why these sections matter:**
- **name** - Scoped package name (`@rewrlution/`) for organization
- **private: true** - Prevents accidental publish to npm registry
- **scripts** - Commands we'll run (`pnpm dev`, `pnpm build`)
- **dependencies** - Needed in production (React, Next.js)
- **devDependencies** - Only needed for development (TypeScript, ESLint)

### Workspace Dependencies

```json
"@rewrlution/papyrus-shared": "workspace:*"
```

**What `workspace:*` means:**
- Link to local package in monorepo
- Always uses the current version in `packages/shared`
- pnpm resolves this automatically
- No need to publish shared package to npm

---

## Implementation

### Step 1: Create package.json

Open `packages/web/package.json` and add the complete configuration:

```json
{
  "name": "@rewrlution/papyrus-web",
  "version": "0.0.1",
  "private": true,
  "description": "Marketing website for Papyrus CLI",
  "author": "Rewrlution <rewrlution@gmail.com>",
  "license": "MIT",
  "homepage": "https://github.com/rewrlution/papyrus#readme",
  "repository": {
    "type": "git",
    "url": "https://github.com/rewrlution/papyrus.git",
    "directory": "packages/web"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.1.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "lucide-react": "^0.468.0",
    "geist": "^1.3.1",
    "@rewrlution/papyrus-shared": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.7.3",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "eslint": "^8.57.1",
    "eslint-config-next": "^15.1.4",
    "prettier": "^3.4.2"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=10.0.0"
  }
}
```

### Step 2: Understand Each Section

#### Scripts Explained

```json
"scripts": {
  "dev": "next dev",              // Start development server on :3000
  "build": "next build",          // Build for production (static export)
  "start": "next start",          // Preview production build locally
  "lint": "next lint",            // Run ESLint on codebase
  "format": "prettier --write ...", // Format code with Prettier
  "type-check": "tsc --noEmit"    // Type check without building
}
```

**When to use each script:**
- `pnpm dev` - Daily development (hot reload)
- `pnpm build` - Before deploying (CI/CD)
- `pnpm start` - Test production build locally
- `pnpm lint` - Before committing code
- `pnpm type-check` - Debug TypeScript errors

#### Dependencies Explained

**Core Framework:**
```json
"next": "^15.1.4",        // React framework with routing, SSR, SSG
"react": "^19.0.0",       // UI library
"react-dom": "^19.0.0"    // React renderer for web
```

**Why Next.js 15:**
- App Router (modern routing)
- Static export (no server needed)
- Image optimization
- Font optimization
- Built-in TypeScript support

**Styling & UI:**
```json
"class-variance-authority": "^0.7.1",  // Variant-based styling (for shadcn)
"clsx": "^2.1.1",                      // Conditional classes
"tailwind-merge": "^2.6.0",            // Smart Tailwind class merging
"tailwindcss-animate": "^1.0.7",       // Animation utilities
"lucide-react": "^0.468.0",            // Icon library (tree-shakeable)
"geist": "^1.3.1"                      // Vercel's font (Sans + Mono)
```

**Why these libraries:**
- `class-variance-authority` - Create component variants easily
- `clsx` - Conditional class names: `clsx({ 'active': isActive })`
- `tailwind-merge` - Merge conflicting Tailwind classes intelligently
- `tailwindcss-animate` - Pre-built animations (fade, slide, etc.)
- `lucide-react` - 1000+ icons, only bundle what you use
- `geist` - Modern, optimized fonts from Vercel (great for dev tools)

**Monorepo Integration:**
```json
"@rewrlution/papyrus-shared": "workspace:*"
```

**What this gives us:**
- Access to shared TypeScript types
- Shared validation schemas (Zod)
- Shared utilities (date formatting, content hashing)
- Type-safe data models between CLI, API, and Web

#### DevDependencies Explained

**TypeScript:**
```json
"@types/node": "^22.10.5",           // Node.js types
"@types/react": "^19.0.6",           // React types
"@types/react-dom": "^19.0.2",       // React DOM types
"typescript": "^5.7.3"               // TypeScript compiler
```

**Styling:**
```json
"tailwindcss": "^4.0.0",    // CSS framework
"autoprefixer": "^10.4.20", // Add vendor prefixes (-webkit-, etc.)
"postcss": "^8.4.49"        // CSS transformer
```

**Code Quality:**
```json
"eslint": "^8.57.1",              // JavaScript/TypeScript linter
"eslint-config-next": "^15.1.4",  // Next.js ESLint rules
"prettier": "^3.4.2"              // Code formatter
```

**Why TypeScript:**
- Catch errors at compile time
- Better IDE autocomplete
- Self-documenting code
- Refactoring is safer

**Why ESLint + Prettier:**
- ESLint - Catches bugs and bad patterns
- Prettier - Consistent code style
- Together - Clean, bug-free code

### Step 3: Understand Version Constraints

```json
"next": "^15.1.4"
```

**Version syntax:**
- `^15.1.4` - Allow minor and patch updates (15.1.5, 15.2.0) but not 16.0.0
- `~15.1.4` - Allow patch updates only (15.1.5) but not 15.2.0
- `15.1.4` - Exact version (no updates)

**Why we use `^` (caret):**
- Get bug fixes automatically (patch updates)
- Get new features automatically (minor updates)
- Avoid breaking changes (major version locked)

### Step 4: Understand Engine Requirements

```json
"engines": {
  "node": ">=20.0.0",
  "pnpm": ">=10.0.0"
}
```

**Why specify engines:**
- Ensures team uses compatible versions
- CI/CD can validate versions
- Prevents "works on my machine" issues

**Our requirements:**
- Node.js 20+ - For latest JavaScript features
- pnpm 10+ - For workspace protocol support

---

## Verification

### Step 1: Validate JSON Syntax

```bash
cd /home/user/papyrus/packages/web

# Test if JSON is valid
cat package.json | jq .
```

**If jq is not installed:**
```bash
# Just try to use it - npm validates automatically
node -e "require('./package.json')"
```

Should output no errors.

### Step 2: Check Package Name

```bash
cat package.json | grep "name"
```

Should output:
```
"name": "@rewrlution/papyrus-web",
```

### Step 3: List Scripts

```bash
cat package.json | grep -A 10 "scripts"
```

Should show all 6 scripts.

---

## Testing (Don't Run Yet)

We can't run these scripts yet because we haven't installed dependencies. But we can verify they're configured:

```bash
# This will show what scripts are available
cat package.json | jq .scripts

# Expected output:
# {
#   "dev": "next dev",
#   "build": "next build",
#   ...
# }
```

**Next steps:**
1. Tutorial 03 - Configure TypeScript
2. Tutorial 04 - Configure Next.js
3. Then we'll install all dependencies with `pnpm install`

---

## What's Next

**Next Tutorial:** [03-typescript-config.md](./03-typescript-config.md) - Configure TypeScript for Next.js and monorepo integration.

---

## Common Issues

### Issue: Invalid JSON syntax error

**Symptom:**
```
SyntaxError: Unexpected token in JSON
```

**Solution:**
- Check for missing commas
- Check for trailing commas (not allowed in JSON)
- Validate with: https://jsonlint.com/

### Issue: Wondering why we use pnpm instead of npm

**Answer:**
pnpm has several advantages for monorepos:
- **Disk efficiency** - Shared dependencies via hard links (saves GB)
- **Speed** - Faster installs than npm
- **Workspace support** - First-class monorepo support
- **Strict** - Doesn't allow using undeclared dependencies

### Issue: What if I want to use npm or yarn?

**Answer:**
You can, but you'll need to:
- Change `workspace:*` to relative path or lerna
- Use npm/yarn workspaces instead of pnpm workspaces
- Update all scripts in monorepo root

We recommend pnpm for this project.

---

## Deep Dive: Dependencies vs DevDependencies

**Should it be in dependencies or devDependencies?**

**Simple rule:**
- **dependencies** - Needed when the app runs
- **devDependencies** - Only needed during development/build

**Examples:**

```json
// ✅ dependencies (needed at runtime)
"react": "^19.0.0"              // App can't run without React
"next": "^15.1.4"               // Framework runs the app

// ✅ devDependencies (only needed to build/develop)
"typescript": "^5.7.3"          // Compiles to JS, not needed at runtime
"eslint": "^8.57.1"             // Only used during development
```

**For Next.js static export:**
Since we're exporting static HTML/CSS/JS, technically everything is a build dependency. But we follow the convention:
- Framework & libraries → dependencies
- Build tools & linters → devDependencies

---

## Summary

You've configured the `package.json` with:

✅ Package metadata (name, version, description)
✅ All required dependencies (Next.js, React, Tailwind)
✅ Development dependencies (TypeScript, ESLint)
✅ npm scripts (dev, build, lint, etc.)
✅ Monorepo integration (`workspace:*`)
✅ Engine requirements (Node 20+, pnpm 10+)

**What's defined:** 19 dependencies, 9 devDependencies, 6 scripts
**Not installed yet:** We'll install after configuring TypeScript and Next.js

---

**Continue to:** [03-typescript-config.md](./03-typescript-config.md) →
